// Issuer console snapshot: pool price vs reference, basis, graduation progress, fees, wallet units.
// Writes out/status.json (consumed by the monitor page). Usage: node scripts/status.mjs [--pool <addr>] [--json]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { PublicKey } from "@solana/web3.js";
import { getMint, getExtensionData, ExtensionType, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { DynamicBondingCurveClient, getPriceFromSqrtPrice, feeNumeratorToBps } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, XSTOCKS, twinOf, twinsOf } from "../src/config.mjs";
import { loadPoolRecord } from "../src/config.mjs";
import { resolveUsd, resolveUsdRobust } from "../src/prices.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const { plan, launch, dir: poolDir } = loadPoolRecord(arg("pool"));
const pool = new PublicKey(arg("pool", launch.pool));
const qDec = plan.quote.decimals, bDec = 9;

const client = DynamicBondingCurveClient.create(connection, "confirmed");
const [ps, progress, feeMetrics, refBase, refQuote] = await Promise.all([
  client.state.getPool(pool),
  client.state.getPoolQuoteTokenCurveProgress(pool),
  client.state.getPoolFeeMetrics(pool),
  plan.preipo ? resolvePreIpo(plan.base) : resolveUsdRobust({ pythSymbol: `Equity.US.${plan.base}/USD`, twins: twinsOf(plan.base), manual: plan.reference?.base?.source === "manual" ? plan.reference.base.price : undefined }, { force: true }),
  plan.quote.symbol === "USDC" ? { price: 1, source: "peg", ageSec: 0 } : resolveUsd({ pythSymbol: XSTOCKS[plan.quote.symbol]?.pythUsd || (plan.quote.symbol === "SOL" ? "Crypto.SOL/USD" : undefined), mint: plan.quote.mint }),
]);
const cfg = await client.state.getPoolConfig(ps.poolState.config);

// xStocks carry a ScaledUiAmount multiplier (corporate actions). Raw units × multiplier = display units.
const qMint = ["USDC", "SOL"].includes(plan.quote.symbol) ? null : await getMint(connection, new PublicKey(plan.quote.mint), "confirmed", TOKEN_2022_PROGRAM_ID).catch(() => null);
let multiplier = 1;
if (qMint) {
  const ext = getExtensionData(ExtensionType.ScaledUiAmountConfig, qMint.tlvData);
  if (ext) multiplier = ext.readDoubleLE(32); // authority(32) | multiplier f64 | new_multiplier_effective_timestamp | new_multiplier
}

const poolPrice = Number(getPriceFromSqrtPrice(ps.poolState.sqrtPrice, bDec, qDec)); // quote per base token
const refPriceQuote = (refBase.price * plan.unit) / refQuote.price;
const basisBps = ((poolPrice / refPriceQuote) - 1) * 10_000;
const quoteReserve = Number(ps.poolState.quoteReserve.toString()) / 10 ** qDec;
const threshold = Number(cfg.migrationQuoteThreshold.toString()) / 10 ** qDec;
const now = Math.floor(Date.now() / 1000);
const status = {
  at: new Date().toISOString(), poolAddress: pool.toBase58(), symbol: launch.symbol, quote: plan.quote.symbol, unit: plan.unit,
  preipo: refBase.context || null,
  reference: { baseUsd: refBase.price, baseSource: refBase.source, baseAgeSec: refBase.ageSec, baseStale: !!refBase.stale, quoteUsd: refQuote.price, quoteSource: refQuote.source, refPriceQuote, refPriceUsd: refBase.price * plan.unit },
  pool: { priceQuote: poolPrice, priceUsd: poolPrice * refQuote.price, basisBps, startPriceQuote: plan.summary.startPriceQuote, graduationPriceQuote: plan.summary.graduationPriceQuote,
    quoteReserve, quoteReserveDisplay: quoteReserve * multiplier, threshold, thresholdUsd: threshold * refQuote.price, progressPct: Number(progress) * 100, isMigrated: ps.poolState.isMigrated,
    baseSold: (Number(cfg.preMigrationTokenSupply.toString()) - Number(ps.poolState.baseReserve.toString())) / 10 ** bDec,
    activationPoint: Number(ps.poolState.activationPoint.toString()), ageSec: now - Number(ps.poolState.activationPoint.toString()) },
  fees: { totalTradingQuote: Number(feeMetrics.total.totalTradingQuoteFee.toString()) / 10 ** qDec, partnerUnclaimedQuote: Number(feeMetrics.current.partnerQuoteFee.toString()) / 10 ** qDec,
    currentBaseFeeBps: feeNumeratorToBps(cfg.poolFees.baseFee.cliffFeeNumerator), schedule: plan.summary.feeSchedule },
  quoteMint: { mint: plan.quote.mint, scaledUiMultiplier: multiplier },
  config: ps.poolState.config.toBase58(), baseMint: ps.poolState.baseMint.toBase58(),
};
mkdirSync("out", { recursive: true });
writeFileSync("out/status.json", JSON.stringify(status, null, 2));
if (process.argv.includes("--json")) { console.log(JSON.stringify(status, null, 2)); process.exit(0); }
const f = (n, d = 8) => Number(n).toFixed(d);
console.log(`\n== ${status.symbol}/${status.quote}  pool ${status.poolAddress} ==`);
console.log(`reference ${f(refPriceQuote)} ${status.quote}  ($${f(status.reference.refPriceUsd, 4)}/token; ${plan.base} $${f(refBase.price, 2)} via ${refBase.source}${refBase.stale ? " ⚠ STALE " + (refBase.ageSec / 86400).toFixed(1) + "d" : ""})`);
console.log(`pool      ${f(poolPrice)} ${status.quote}  ($${f(status.pool.priceUsd, 4)})   basis ${basisBps >= 0 ? "+" : ""}${basisBps.toFixed(0)} bps vs reference`);
console.log(`band      start ${f(status.pool.startPriceQuote)} → graduate ${f(status.pool.graduationPriceQuote)}`);
console.log(`progress  ${status.pool.progressPct.toFixed(1)}%  reserve ${f(quoteReserve)} / ${f(threshold)} ${status.quote} ($${f(status.pool.thresholdUsd, 2)})  migrated=${status.pool.isMigrated}`);
console.log(`sold      ${f(status.pool.baseSold, 4)} tokens = ${f(status.pool.baseSold * plan.unit, 4)} shares`);
console.log(`fees      ${f(status.fees.totalTradingQuote)} ${status.quote} total trading; partner unclaimed ${f(status.fees.partnerUnclaimedQuote)}; pool age ${status.pool.ageSec}s`);
console.log(`xStock multiplier ${multiplier} (display units = raw × multiplier)`);
console.log("wrote out/status.json");
