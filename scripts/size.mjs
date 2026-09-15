// Size a real pool: given a target raise (USD), find the float, the issuer's opening capital, the inventory it
// returns, rent, and revenue at graduation — for each curve shape. Price-independent except for the unit.
// Usage: node scripts/size.mjs --base RKLB --raise 50000 [--quote USDC|SOL|AAPLx] [--price 127.86] [--profile issuer]
import BN from "bn.js";
import { getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice, getBaseTokenForSwap } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { buildEquityCurve, CURVES, PROFILES } from "../src/curve.mjs";
import { XSTOCKS, BACKPACK, USDC, SOL, twinOf } from "../src/config.mjs";
import { resolveUsd } from "../src/prices.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const base = arg("base", "RKLB"), raise = Number(arg("raise", "50000")), qSym = arg("quote", "USDC"), profile = arg("profile", "issuer");
const quote = qSym === "USDC" ? USDC : qSym === "SOL" ? SOL : XSTOCKS[qSym] || BACKPACK[qSym];
const refBase = arg("price") ? { price: Number(arg("price")), source: "manual", ageSec: 0 } : await resolveUsd({ pythSymbol: `Equity.US.${base}/USD`, twinMint: twinOf(base) });
const refQuote = qSym === "USDC" ? { price: 1, source: "peg" } : await resolveUsd({ pythSymbol: qSym === "SOL" ? "Crypto.SOL/USD" : `Crypto.${qSym.toUpperCase()}/USD`, mint: quote.mint });
const prof = PROFILES[profile];
const bDec = 9, qDec = quote.decimals;
console.log(`\n== sizing ${base} / ${qSym} · raise $${raise.toLocaleString()} · profile ${profile} ==`);
console.log(`reference ${base} $${refBase.price.toFixed(2)} [${refBase.source}${refBase.stale ? " STALE " + (refBase.ageSec / 86400).toFixed(0) + "d" : ""}] · ${qSym} $${refQuote.price.toFixed(2)} [${refQuote.source}]`);
if (refBase.source !== "pyth-lazer") console.log(`⚠ a real pool needs a live Pyth reference for ${base} (Lazer equity grant); this source is for sizing only`);

const rows = [];
for (const curve of Object.keys(CURVES)) {
  // 1 token = 1 share; threshold scales linearly with float, so one probe sizes the float.
  const probe = buildEquityCurve({ refBaseUsd: refBase.price, refQuoteUsd: refQuote.price, quoteDecimals: qDec, unit: 1, float: 1000, curve, profile });
  const float = Math.max(1, Math.round(1000 * raise / probe.summary.migrationQuoteThresholdUsd));
  const b = buildEquityCurve({ refBaseUsd: refBase.price, refQuoteUsd: refQuote.price, quoteDecimals: qDec, unit: 1, float, curve, profile });
  const cp = b.configParams, s = b.summary;
  const refSqrt = getSqrtPriceFromPrice(s.referencePriceQuote.toString(), bDec, qDec);
  const reserve = Number(getQuoteReserveFromNextSqrtPrice(refSqrt, cp).toString()) / 10 ** qDec; // quote to lift start → reference
  const openFee = b.summary.feeSchedule.startsWith("300") ? 0.03 : 0.03;
  const openingQuote = reserve / (1 - openFee) * 1.005;
  const tokens = Number(getBaseTokenForSwap(cp.sqrtStartPrice, refSqrt, cp.curve).toString()) / 10 ** bDec; // tokens received for that buy
  const raiseUsd = s.migrationQuoteThresholdUsd, openingUsd = openingQuote * refQuote.price;
  const listing = raiseUsd * prof.migrationFeePct / 100;
  const curveFees = raiseUsd * 0.01 * 0.8; // ~1% average scheduler fee on the raise, 80% partner after protocol
  rows.push({ curve, float, unit: 1, raiseUsd, openingUsd, openingPct: openingUsd / raiseUsd * 100, tokens, inventoryUsd: tokens * refBase.price, listing, curveFees, creation: prof.poolCreationFeeSol, start: s.startPriceQuote, grad: s.graduationPriceQuote, ref: s.referencePriceQuote });
}
const $ = (n) => "$" + Math.round(n).toLocaleString();
console.log(`\n${"curve".padEnd(9)} ${"float (shares)".padEnd(15)} ${"raise".padEnd(10)} ${"opening buy".padEnd(20)} ${"tokens back".padEnd(18)} ${"inventory @ref".padEnd(15)} ${"listing 3%".padEnd(11)} ${"curve fees".padEnd(11)} rent`);
for (const r of rows) console.log(`${r.curve.padEnd(9)} ${String(r.float).padEnd(15)} ${$(r.raiseUsd).padEnd(10)} ${($(r.openingUsd) + " (" + r.openingPct.toFixed(0) + "%)").padEnd(20)} ${(r.tokens.toFixed(1) + " sh").padEnd(18)} ${$(r.inventoryUsd).padEnd(15)} ${$(r.listing).padEnd(11)} ${$(r.curveFees).padEnd(11)} ~0.07 SOL`);
const lean = rows.find((r) => r.curve === "lean");
console.log(`\nlean: price ladder ${lean.start.toFixed(2)} → ${lean.ref.toFixed(2)} → ${lean.grad.toFixed(2)} ${qSym}/share; the other ${$(lean.raiseUsd - lean.openingUsd)} of the raise is real buyers between reference and +5%.`);
console.log(`capital at risk = basis on ${lean.tokens.toFixed(0)} shares of inventory, not the ${$(lean.openingUsd)} itself (keeper sells at ≥ reference on DAMM v2).`);
console.log(`after graduation: DAMM v2 depth ≈ ${$(lean.raiseUsd * (1 - prof.migrationFeePct / 100))} + the migrated float, 100% locked to the partner, earning ${prof.migratedPoolFeeBps ?? 25} bps + dynamic fee on every trade, forever.`);
