// Claim every partner revenue stream on a pool and re-read the result: trading fees, pool-creation fee,
// migration (listing) fee. Usage: node scripts/claim.mjs [--pool <addr>] [--dry]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const launch = JSON.parse(readFileSync("out/launch.json", "utf8"));
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
const pool = new PublicKey(arg("pool", launch.pool));
const qDec = plan.quote.decimals;
const kp = loadKeypair(), me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");

async function send(label, tx) {
  tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
  if (DRY) { const sim = await connection.simulateTransaction(tx); console.log(`${label}: sim ${sim.value.err ? "ERR " + JSON.stringify(sim.value.err) : "OK"}`); return null; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label}: ${JSON.stringify(conf.value.err)}`);
  console.log(`${label}: CONFIRMED https://solscan.io/tx/${sig}`);
  return sig;
}

const ps = await client.state.getPool(pool);
const cfg = await client.state.getPoolConfig(ps.poolState.config);
const before = await client.state.getPoolFeeBreakdown(pool);
const solBefore = await connection.getBalance(me);
const q = (bn) => Number(bn.toString()) / 10 ** qDec;
console.log(`pool ${pool.toBase58()} (${launch.symbol}/${plan.quote.symbol}) profile ${plan.summary.profile || "demo"}  migrated=${ps.poolState.isMigrated}`);
console.log(`partner trading fees: unclaimed ${q(before.partner.unclaimedQuoteFee)} ${plan.quote.symbol}, claimed ${q(before.partner.claimedQuoteFee)}, total ${q(before.partner.totalQuoteFee)}`);
console.log(`pool creation fee: ${Number(cfg.poolCreationFee?.toString?.() ?? 0) / 1e9} SOL configured; migration fee ${cfg.migrationFeePercentage}% of raise (creator share ${cfg.creatorMigrationFeePercentage}%)`);
console.log(`protocol migration fee balance on pool: ${q(ps.poolState.protocolMigrationFeeBalance ?? new BN(0))}; migration fee withdraw status ${ps.poolState.isWithdrawMigrationFee ?? ps.poolState.migrationFeeWithdrawStatus}`);

const txs = {};
// 1. trading fees (partner)
if (before.partner.unclaimedQuoteFee.gtn(0) || before.partner.unclaimedBaseFee.gtn(0)) {
  const tx = await client.partner.claimPartnerTradingFee({ feeClaimer: me, payer: me, pool, maxBaseAmount: before.partner.unclaimedBaseFee, maxQuoteAmount: before.partner.unclaimedQuoteFee });
  txs.claimTradingFee = await send("claim trading fee", tx);
} else console.log("claim trading fee: nothing unclaimed");
// 2. pool creation fee (partner 90%)
if (Number(cfg.poolCreationFee?.toString?.() ?? 0) > 0) {
  try { const tx = await client.partner.claimPartnerPoolCreationFee({ pool, feeReceiver: me }); txs.claimCreationFee = await send("claim creation fee", tx); }
  catch (e) { console.log("claim creation fee: " + e.message.slice(0, 120)); }
} else console.log("claim creation fee: not configured");
// 3. migration (listing) fee — only after migration
if (ps.poolState.isMigrated && cfg.migrationFeePercentage > 0) {
  try { const tx = await client.partner.partnerWithdrawMigrationFee({ pool, sender: me }); txs.withdrawMigrationFee = await send("withdraw listing fee", tx); }
  catch (e) { console.log("withdraw listing fee: " + e.message.slice(0, 160)); }
} else console.log(`withdraw listing fee: ${ps.poolState.isMigrated ? "not configured" : "pool not migrated yet"}`);

// Independent re-read
const after = await client.state.getPoolFeeBreakdown(pool);
const solAfter = await connection.getBalance(me);
console.log(`after: partner unclaimed ${q(after.partner.unclaimedQuoteFee)}, claimed ${q(after.partner.claimedQuoteFee)} ${plan.quote.symbol}; wallet SOL Δ ${((solAfter - solBefore) / 1e9).toFixed(6)}`);
if (!DRY) {
  const dir = `out/pools/${arg("out", `${launch.symbol}-${plan.quote.symbol}`)}`;
  if (existsSync(`${dir}/launch.json`)) { const l = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8")); l.txs = { ...l.txs, ...txs }; l.revenue = { tradingFeeQuote: q(after.partner.claimedQuoteFee), listingFeePct: cfg.migrationFeePercentage, creationFeeSol: Number(cfg.poolCreationFee?.toString?.() ?? 0) / 1e9, claimedAt: new Date().toISOString() }; writeFileSync(`${dir}/launch.json`, JSON.stringify(l, null, 2)); console.log(`recorded in ${dir}/launch.json`); }
}
