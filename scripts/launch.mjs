// Create the DBC config (partner) and the virtual pool (creator) on mainnet from out/plan.json.
// Usage: node scripts/launch.mjs [--dry] [--name "..."] [--symbol sGME] [--uri https://...]
// --dry simulates both transactions and prints compute/rent without sending.
import { readFileSync, writeFileSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";
import { buildEquityCurve } from "../src/curve.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
const name = arg("name", `stockcurve ${plan.base} ${plan.unit}sh`);
const symbol = arg("symbol", `s${plan.base}`);
const uri = arg("uri", `https://raw.githubusercontent.com/ExpertVagabond/stockcurve/main/meta/${symbol}.json`);

const kp = loadKeypair();
const me = kp.publicKey;
const quoteMint = new PublicKey(plan.quote.mint);
const tokenBadge = deriveTokenBadgeAddress(quoteMint);
if (!(await connection.getAccountInfo(tokenBadge))) throw new Error(`no TokenBadge for quote ${plan.quote.symbol}`);

// Rebuild the exact curve from the recorded references (BN fields don't survive JSON).
const { configParams, summary } = buildEquityCurve({
  refBaseUsd: plan.reference.base.price, refQuoteUsd: plan.reference.quote.price, quoteDecimals: plan.quote.decimals,
  unit: plan.unit, float: plan.float, discountBps: plan.summary.discountBps, premiumBps: plan.summary.premiumBps,
});
if (summary.migrationQuoteThreshold !== plan.summary.migrationQuoteThreshold) throw new Error("curve drifted from plan.json — re-run plan.mjs");

const client = DynamicBondingCurveClient.create(connection, "confirmed");
const config = Keypair.generate();
const baseMint = Keypair.generate();
console.log(`${DRY ? "DRY RUN" : "MAINNET"} launch ${symbol} (${name}) / ${plan.quote.symbol}`);
console.log(`config ${config.publicKey.toBase58()}  baseMint ${baseMint.publicKey.toBase58()}  badge ${tokenBadge.toBase58()}`);

async function run(label, tx, signers) {
  tx.feePayer = me;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(...signers);
  if (DRY) {
    const sim = await connection.simulateTransaction(tx);
    if (sim.value.err) { console.error(label, "SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-8)); process.exit(1); }
    console.log(`${label}: sim OK, ${sim.value.unitsConsumed} CU`);
    return null;
  }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label} failed: ${JSON.stringify(conf.value.err)}`);
  console.log(`${label}: CONFIRMED https://solscan.io/tx/${sig}`);
  return sig;
}

const before = await connection.getBalance(me);
const configTx = await client.partner.createConfig({ ...configParams, config: config.publicKey, feeClaimer: me, leftoverReceiver: me, payer: me, quoteMint, tokenBadge });
const sig1 = await run("createConfig", configTx, [kp, config]);

if (DRY) {
  // Pool sim would fail without the config on-chain; only simulate config in dry mode.
  console.log("createPool: skipped in dry run (depends on config account)");
  process.exit(0);
}
const poolTx = await client.creator.createPool({ baseMint: baseMint.publicKey, config: config.publicKey, name, symbol, uri, payer: me, poolCreator: me, tokenBadge });
const sig2 = await run("createPool", poolTx, [kp, baseMint]);

const pool = deriveDbcPoolAddress(quoteMint, baseMint.publicKey, config.publicKey);
// Independent re-read: the pool account must exist and reference our config.
const state = await client.state.getPool(pool);
const after = await connection.getBalance(me);
console.log(`pool ${pool.toBase58()} exists; config matches: ${state.poolState.config.equals(config.publicKey)}; SOL spent ${(before - after) / 1e9}`);
const record = { ...plan.summary, name, symbol, uri, config: config.publicKey.toBase58(), baseMint: baseMint.publicKey.toBase58(), pool: pool.toBase58(), quoteMint: plan.quote.mint, tokenBadge: tokenBadge.toBase58(), txs: { createConfig: sig1, createPool: sig2 }, launchedAt: new Date().toISOString() };
writeFileSync("out/launch.json", JSON.stringify(record, null, 2));
console.log("wrote out/launch.json");
