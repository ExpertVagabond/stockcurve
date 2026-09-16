// Create the DBC config (partner) and the virtual pool (creator) on mainnet from out/plan.json.
// Usage: node scripts/launch.mjs [--dry] [--name "..."] [--symbol sGME] [--uri https://...]
// --dry simulates both transactions and prints compute/rent without sending.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";
import { withPriority } from "../src/config.mjs";
import { buildEquityCurve } from "../src/curve.mjs";
import { resolveUsdRobust } from "../src/prices.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";
import { twinsOf } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
const name = arg("name", `stockcurve ${plan.base} ${plan.unit}sh`);
const symbol = arg("symbol", `s${plan.base}`);
const uri = arg("uri", `https://stockcurve.purplesquirrelnetworks.workers.dev/meta/${symbol}.json`);

const kp = loadKeypair();
const me = kp.publicKey;
const quoteMint = new PublicKey(plan.quote.mint);
// SPL quotes (USDC) are permissionless; Token-2022 stock quotes need Meteora's TokenBadge at remaining account 0.
const badgePda = deriveTokenBadgeAddress(quoteMint);
const tokenBadge = (await connection.getAccountInfo(badgePda)) ? badgePda : undefined;
if (!tokenBadge && !["USDC", "SOL"].includes(plan.quote.symbol)) throw new Error(`no TokenBadge for quote ${plan.quote.symbol}`);


// Drift guard: the ladder was built for plan.reference; if the live reference moved, the ±band would be wrong from block one.
{
  const maxDrift = Number(arg("max-drift", "1"));
  const live = plan.preipo ? await resolvePreIpo(plan.base, plan.preipoAnchor || "prestocks") : await resolveUsdRobust({ pythSymbol: `Equity.US.${plan.base}/USD`, twins: twinsOf(plan.base), manual: plan.reference?.base?.source === "manual" ? plan.reference.base.price : undefined }, { force: true });
  const driftPct = (live.price / plan.reference.base.price - 1) * 100;
  console.log(`drift guard: plan ref $${plan.reference.base.price.toFixed(2)} → live $${live.price.toFixed(2)} (${driftPct >= 0 ? "+" : ""}${driftPct.toFixed(2)}%)`);
  if (Math.abs(driftPct) > maxDrift && !process.argv.includes("--force")) { console.error(`reference drifted ${driftPct.toFixed(2)}% > ${maxDrift}% since the plan — re-run plan.mjs (or --force)`); process.exit(2); }
}
// Rebuild the exact curve from the recorded references (BN fields don't survive JSON).
const { configParams, summary } = buildEquityCurve({
  refBaseUsd: plan.reference.base.price, refQuoteUsd: plan.reference.quote.price, quoteDecimals: plan.quote.decimals,
  unit: plan.unit, float: plan.float, discountBps: plan.summary.discountBps, premiumBps: plan.summary.premiumBps, profile: plan.summary.profile || "demo", curve: plan.summary.curve || "standard",
});
if (summary.migrationQuoteThreshold !== plan.summary.migrationQuoteThreshold) throw new Error("curve drifted from plan.json — re-run plan.mjs");

const client = DynamicBondingCurveClient.create(connection, "confirmed");
const config = Keypair.generate();
const baseMint = Keypair.generate();
console.log(`${DRY ? "DRY RUN" : "MAINNET"} launch ${symbol} (${name}) / ${plan.quote.symbol}`);
console.log(`config ${config.publicKey.toBase58()}  baseMint ${baseMint.publicKey.toBase58()}  badge ${tokenBadge ? tokenBadge.toBase58() : "none (SPL quote)"}`);

async function run(label, tx, signers) {
  withPriority(tx); tx.feePayer = me;
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
const record = { ...plan.summary, name, symbol, uri, config: config.publicKey.toBase58(), baseMint: baseMint.publicKey.toBase58(), pool: pool.toBase58(), quoteMint: plan.quote.mint, tokenBadge: tokenBadge?.toBase58() ?? null, txs: { createConfig: sig1, createPool: sig2 }, launchedAt: new Date().toISOString() };
writeFileSync("out/launch.json", JSON.stringify(record, null, 2));
const dir = `out/pools/${arg("out", `${symbol}-${plan.quote.symbol}`)}`;
mkdirSync(dir, { recursive: true });
copyFileSync("out/plan.json", `${dir}/plan.json`);
writeFileSync(`${dir}/launch.json`, JSON.stringify(record, null, 2));
console.log(`wrote out/launch.json and ${dir}/{plan,launch}.json`);
