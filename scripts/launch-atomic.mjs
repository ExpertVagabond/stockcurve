// Atomic launch: create the pool AND buy the discount in the same transaction, so the pool opens
// already sitting at reference and there is no block in which a sniper can be first.
//   tx1  createConfig                      (a config alone is not tradeable — nothing to snipe)
//   tx2  createPool + swap(quote → base)   (SDK createConfigAndPoolWithFirstBuy; one atomic tx)
// The buy is sized offline from the curve: quote reserve needed to move sqrtStart → sqrt(reference),
// grossed up for the opening fee. Usage: node scripts/launch-atomic.mjs --symbol sRDDT --name "..." --uri ... --out sRDDT-SOL [--dry] [--slack-bps 50]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress, getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice, getPriceFromSqrtPrice } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";
import { buildEquityCurve } from "../src/curve.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const slackBps = Number(arg("slack-bps", "50")); // overshoot so the opening print is at/just above reference, never below
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
const symbol = arg("symbol", `s${plan.base}`);
const name = arg("name", `stockcurve ${plan.base} ${plan.unit}sh`);
const uri = arg("uri", `https://raw.githubusercontent.com/ExpertVagabond/stockcurve/main/meta/${symbol}.json`);
const outName = arg("out", `${symbol}-${plan.quote.symbol}`);

const kp = loadKeypair(), me = kp.publicKey;
const quoteMint = new PublicKey(plan.quote.mint);
const badgePda = deriveTokenBadgeAddress(quoteMint);
const tokenBadge = (await connection.getAccountInfo(badgePda)) ? badgePda : undefined;
if (!tokenBadge && !["USDC", "SOL"].includes(plan.quote.symbol)) throw new Error(`no TokenBadge for quote ${plan.quote.symbol}`);

const bDec = 9, qDec = plan.quote.decimals;
const { configParams, summary } = buildEquityCurve({ refBaseUsd: plan.reference.base.price, refQuoteUsd: plan.reference.quote.price, quoteDecimals: qDec, unit: plan.unit, float: plan.float, discountBps: plan.summary.discountBps, premiumBps: plan.summary.premiumBps });
if (summary.migrationQuoteThreshold !== plan.summary.migrationQuoteThreshold) throw new Error("curve drifted from plan.json — re-run plan.mjs");

// Size the opening buy: quote reserve to reach reference, grossed up for the opening fee (+ slack).
const refSqrt = getSqrtPriceFromPrice(summary.referencePriceQuote.toString(), bDec, qDec);
const reserveNeeded = getQuoteReserveFromNextSqrtPrice(refSqrt, configParams);
const openFeeBps = plan.summary.feeSchedule.match(/^(\d+)→/)?.[1] ? Number(plan.summary.feeSchedule.match(/^(\d+)→/)[1]) : 300;
const buyAmount = reserveNeeded.muln(10_000 + slackBps).divn(10_000 - openFeeBps);
console.log(`${DRY ? "DRY RUN" : "MAINNET"} atomic launch ${symbol} / ${plan.quote.symbol}`);
console.log(`reference ${summary.referencePriceQuote.toFixed(8)}  start ${summary.startPriceQuote.toFixed(8)}  opening buy ${Number(buyAmount.toString()) / 10 ** qDec} ${plan.quote.symbol} (reserve ${Number(reserveNeeded.toString()) / 10 ** qDec} + ${openFeeBps} bps fee + ${slackBps} bps slack)`);

const client = DynamicBondingCurveClient.create(connection, "confirmed");
const config = Keypair.generate(), baseMint = Keypair.generate();
const { createConfigTx, createPoolWithFirstBuyTx } = await client.partner.createConfigAndPoolWithFirstBuy({
  ...configParams, config: config.publicKey, feeClaimer: me, leftoverReceiver: me, payer: me, quoteMint, tokenBadge,
  preCreatePoolParam: { name, symbol, uri, poolCreator: me, baseMint: baseMint.publicKey },
  firstBuyParam: { buyer: me, buyAmount, minimumAmountOut: new BN(1), referralTokenAccount: null },
});

async function send(label, tx, signers) {
  tx.feePayer = me;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(...signers);
  if (DRY) { const sim = await connection.simulateTransaction(tx); if (sim.value.err) { console.error(label, "SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-8)); process.exit(1); } console.log(`${label}: sim OK, ${sim.value.unitsConsumed} CU, ${tx.instructions.length} ixs`); return null; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label} failed: ${JSON.stringify(conf.value.err)}`);
  console.log(`${label}: CONFIRMED https://solscan.io/tx/${sig}`);
  return sig;
}

const before = await connection.getBalance(me);
const sig1 = await send("createConfig", createConfigTx, [kp, config]);
if (DRY) { console.log("createPool+firstBuy: skipped in dry run (needs the config on-chain)"); process.exit(0); }
const sig2 = await send("createPool+firstBuy (ATOMIC)", createPoolWithFirstBuyTx, [kp, baseMint]);

// Verify: pool exists, opened at reference, and its FIRST signature is the creation tx (nobody could be earlier).
const pool = deriveDbcPoolAddress(quoteMint, baseMint.publicKey, config.publicKey);
const ps = await client.state.getPool(pool);
const opened = Number(getPriceFromSqrtPrice(ps.poolState.sqrtPrice, bDec, qDec));
const sigs = await connection.getSignaturesForAddress(pool, { limit: 5 });
const first = sigs[sigs.length - 1]?.signature;
const after = await connection.getBalance(me);
console.log(`pool ${pool.toBase58()}  opened at ${opened.toFixed(8)} (${((opened / summary.referencePriceQuote - 1) * 1e4).toFixed(0)} bps vs reference)  reserve ${Number(ps.poolState.quoteReserve.toString()) / 10 ** qDec} ${plan.quote.symbol}`);
console.log(`first tx on pool == creation+buy tx: ${first === sig2}  (${sigs.length} txs so far)  SOL spent ${(before - after) / 1e9}`);

const record = { ...plan.summary, name, symbol, uri, atomic: true, openingBuy: Number(buyAmount.toString()) / 10 ** qDec, openedAtPrice: opened, config: config.publicKey.toBase58(), baseMint: baseMint.publicKey.toBase58(), pool: pool.toBase58(), quoteMint: plan.quote.mint, tokenBadge: tokenBadge?.toBase58() ?? null, txs: { createConfig: sig1, createPoolWithFirstBuy: sig2 }, launchedAt: new Date().toISOString() };
writeFileSync("out/launch.json", JSON.stringify(record, null, 2));
mkdirSync(`out/pools/${outName}`, { recursive: true });
copyFileSync("out/plan.json", `out/pools/${outName}/plan.json`);
writeFileSync(`out/pools/${outName}/launch.json`, JSON.stringify(record, null, 2));
console.log(`wrote out/pools/${outName}/{plan,launch}.json`);
