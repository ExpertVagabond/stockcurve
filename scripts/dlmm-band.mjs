// Market-make the basis: after graduation, put inventory into a concentrated two-sided DLMM position around the
// reference price (± --width-bps). Creates the DLMM pair if none exists (active bin = reference).
// Usage: node scripts/dlmm-band.mjs --pool <dbc pool> --base 1.0 --quote 0.15 [--width-bps 300] [--bin-step 25] [--fee-bps 20] [--dry]
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createRequire } from "node:module";
const _dlmm = createRequire(import.meta.url)("@meteora-ag/dlmm"); // ESM build has a broken dir import; CJS works
const DLMM = _dlmm, { StrategyType, ActivationType: DlmmActivation } = _dlmm; // module.exports IS the class, statics + enums attached
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair, loadPoolRecord, withPriority, twinsOf } from "../src/config.mjs";
import { resolveUsdRobust } from "../src/prices.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const { plan, launch, dir } = loadPoolRecord(arg("pool"));
const pool = new PublicKey(arg("pool", launch.pool));
const widthBps = Number(arg("width-bps", "300")), binStep = Number(arg("bin-step", "25")), feeBps = Number(arg("fee-bps", "20"));
const baseAmt = Number(arg("base", "0")), quoteAmt = Number(arg("quote", "0"));
const kp = loadKeypair(), me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");

const ps = await client.state.getPool(pool);
const cfg = await client.state.getPoolConfig(ps.poolState.config);
const X = ps.poolState.baseMint, Y = cfg.quoteMint, xDec = 9, yDec = plan.quote.decimals;

// reference in quote per base token (same resolver as the keeper)
const refBase = plan.preipo ? await resolvePreIpo(plan.base) : await resolveUsdRobust({ pythSymbol: `Equity.US.${plan.base}/USD`, twins: twinsOf(plan.base), manual: plan.reference?.base?.source === "manual" ? plan.reference.base.price : undefined }, { force: true });
const refQuote = plan.quote.symbol === "USDC" ? { price: 1 } : await resolveUsdRobust({ pythSymbol: plan.quote.symbol === "SOL" ? "Crypto.SOL/USD" : undefined, mint: plan.quote.mint }, { force: true });
const refPrice = (refBase.price * plan.unit) / refQuote.price;
const pricePerLamport = Number(DLMM.getPricePerLamport(xDec, yDec, refPrice));
const activeId = DLMM.getBinIdFromPrice(pricePerLamport, binStep, false);
const halfBins = Math.max(1, Math.round(widthBps / binStep));
console.log(`${launch.symbol}/${plan.quote.symbol} reference ${refPrice.toFixed(8)} → activeId ${activeId} (bin step ${binStep} bps) · band ±${widthBps} bps = ±${halfBins} bins · fee ${feeBps} bps`);

async function send(label, tx, signers = [kp]) {
  withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(...signers);
  if (DRY) { const sim = await connection.simulateTransaction(tx); if (sim.value.err) { console.error(label, "SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-6)); process.exit(1); } console.log(`${label}: sim OK ${sim.value.unitsConsumed} CU`); return null; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label}: ${JSON.stringify(conf.value.err)}`);
  console.log(`${label}: CONFIRMED https://solscan.io/tx/${sig}`);
  return sig;
}

// 1. pair (create if missing)
let pair = await DLMM.getCustomizablePermissionlessLbPairIfExists(connection, X, Y);
let createSig = null;
if (!pair) {
  const tx = await DLMM.createCustomizablePermissionlessLbPair(connection, new BN(binStep), X, Y, new BN(activeId), new BN(feeBps), DlmmActivation.Timestamp, false, me);
  createSig = await send("create DLMM pair", tx);
  if (DRY) process.exit(0);
  pair = await DLMM.getCustomizablePermissionlessLbPairIfExists(connection, X, Y);
}
console.log(`DLMM pair ${pair.toBase58()}`);
const dlmm = await DLMM.create(connection, pair);
const active = await dlmm.getActiveBin();
console.log(`active bin ${active.binId} price ${Number(active.price).toFixed(8)} (per token) · reference ${refPrice.toFixed(8)}`);

// 2. two-sided Curve position ± halfBins around the active bin
if (baseAmt > 0 || quoteAmt > 0) {
  const position = Keypair.generate();
  const minBinId = active.binId - halfBins, maxBinId = active.binId + halfBins;
  const tx = await dlmm.initializePositionAndAddLiquidityByStrategy({ positionPubKey: position.publicKey, user: me, totalXAmount: new BN(Math.round(baseAmt * 10 ** xDec)), totalYAmount: new BN(Math.round(quoteAmt * 10 ** yDec)), strategy: { minBinId, maxBinId, strategyType: StrategyType.Curve }, slippage: 1 });
  const txs = Array.isArray(tx) ? tx : [tx];
  const sigs = [];
  for (const [i, t] of txs.entries()) sigs.push(await send(`add liquidity ${i + 1}/${txs.length}`, t, [kp, position]));
  if (!DRY) {
    const { userPositions } = await dlmm.getPositionsByUserAndLbPair(me);
    const p = userPositions.find((u) => u.publicKey.equals(position.publicKey));
    const bins = p?.positionData.positionBinData.filter((b) => Number(b.binLiquidity) > 0) || [];
    console.log(`position ${position.publicKey.toBase58()} · ${bins.length} bins ${minBinId}..${maxBinId} · X ${Number(p?.positionData.totalXAmount || 0) / 10 ** xDec} ${launch.symbol} · Y ${Number(p?.positionData.totalYAmount || 0) / 10 ** yDec} ${plan.quote.symbol}`);
    if (dir && existsSync(`${dir}/launch.json`)) { const l = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8")); l.dlmm = { pair: pair.toBase58(), position: position.publicKey.toBase58(), activeId: active.binId, minBinId, maxBinId, binStep, feeBps, widthBps, base: baseAmt, quote: quoteAmt, referencePrice: refPrice, at: new Date().toISOString() }; l.txs = { ...l.txs, ...(createSig ? { dlmmCreatePair: createSig } : {}), dlmmAddLiquidity: sigs[sigs.length - 1] }; writeFileSync(`${dir}/launch.json`, JSON.stringify(l, null, 2)); }
  }
}
