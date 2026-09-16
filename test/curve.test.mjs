import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEquityCurve, CURVES, PROFILES } from "../src/curve.mjs";
import { getPriceFromSqrtPrice, validateConfigParameters } from "@meteora-ag/dynamic-bonding-curve-sdk";

const base = { refBaseUsd: 100, refQuoteUsd: 1, quoteDecimals: 6, unit: 1, float: 1000 };
const price = (sp, q = 6) => Number(getPriceFromSqrtPrice(sp, 9, q));

test("standard curve: start −15%, graduation +5%, three segments, validates", () => {
  const b = buildEquityCurve({ ...base, curve: "standard", profile: "demo" });
  assert.equal(b.checkpoints.length, 4);
  assert.ok(Math.abs(b.summary.startPriceQuote / 100 - 0.85) < 1e-6);
  assert.ok(Math.abs(b.summary.graduationPriceQuote / 100 - 1.05) < 1e-6);
  assert.equal(b.configParams.curve.length, 3);
  validateConfigParameters({ ...b.configParams, leftoverReceiver: "8nqQzTU5bqH3yjfi2ST1XvaaqWw447enCqnZkxHXTsKF" });
});

test("lean curve opens at −5% and puts most liquidity above reference", () => {
  const b = buildEquityCurve({ ...base, curve: "lean", profile: "demo" });
  assert.ok(Math.abs(b.summary.startPriceQuote / 100 - 0.95) < 1e-6);
  const liq = b.configParams.curve.map((c) => BigInt(c.liquidity.toString()));
  assert.ok(liq[2] > liq[0] * 5n, "top segment ≥ 6× the first (weights 1:1:6)");
  assert.deepEqual(b.summary.weights, CURVES.lean.weights);
});

test("graduation threshold scales linearly with float (USD sizing relies on it)", () => {
  const a = buildEquityCurve({ ...base, float: 1000 }), b = buildEquityCurve({ ...base, float: 2000 });
  const r = b.summary.migrationQuoteThreshold / a.summary.migrationQuoteThreshold;
  assert.ok(Math.abs(r - 2) < 0.01, `ratio ${r}`);
});

test("reference price lands on the middle checkpoint in quote units", () => {
  const b = buildEquityCurve({ refBaseUsd: 63.55, refQuoteUsd: 97.4, quoteDecimals: 9, unit: 0.01, float: 5 });
  assert.ok(Math.abs(b.checkpoints[2] - (63.55 * 0.01) / 97.4) < 1e-12);
  assert.ok(Math.abs(price(b.configParams.curve[1].sqrtPrice, 9) - b.checkpoints[2]) / b.checkpoints[2] < 1e-6);
});

test("issuer profile sets listing fee, creation fee and custom DAMM v2 fee; seed profile unlocks 90% LP", () => {
  const i = buildEquityCurve({ ...base, profile: "issuer" });
  assert.equal(i.configParams.migrationFee.feePercentage, 3);
  assert.equal(Number(i.configParams.poolCreationFee.toString()) / 1e9, 0.02);
  assert.equal(i.configParams.migratedPoolFee.poolFeeBps, 20);
  assert.equal(i.configParams.partnerPermanentLockedLiquidityPercentage, 100);
  const s = buildEquityCurve({ ...base, profile: "seed" });
  assert.equal(s.configParams.partnerLiquidityPercentage, 90);
  assert.equal(s.configParams.partnerPermanentLockedLiquidityPercentage, 10);
  assert.equal(s.configParams.migrationFee.feePercentage, 0);
  assert.deepEqual(Object.keys(PROFILES).sort(), ["demo", "issuer", "seed"]);
});

test("undefined args never override a curve shape (regression: --curve lean was ignored)", () => {
  const b = buildEquityCurve({ ...base, curve: "lean", discountBps: undefined, premiumBps: undefined });
  assert.equal(b.summary.discountBps, 500);
});

test("fixed-supply rounding edge retries with a leftover instead of throwing (regression: float 12 / 9-dec quote)", () => {
  const b = buildEquityCurve({ refBaseUsd: 1528, refQuoteUsd: 97, quoteDecimals: 9, unit: 0.01, float: 12, curve: "lean", profile: "seed" });
  assert.ok(b.summary.migrationQuoteThreshold > 0);
});

test("unknown curve or profile throws", () => {
  assert.throws(() => buildEquityCurve({ ...base, curve: "nope" }), /unknown curve/);
  assert.throws(() => buildEquityCurve({ ...base, profile: "nope" }), /unknown profile/);
});
