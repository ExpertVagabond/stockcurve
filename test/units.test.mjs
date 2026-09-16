import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEquityCurve } from "../src/curve.mjs";
import { getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { twinsOf, twinOf, XSTOCKS, BACKPACK, ONDO } from "../src/config.mjs";

test("shared-config unit derivation: unit = ladderRef / (refBase/refQuote) lands the ticker on the ladder", () => {
  const ladderRef = 0.01118697, refBase = 173.72, refQuote = 97.47; // pool 7: PLTR on the sHOOD/SOL config
  const unit = ladderRef / (refBase / refQuote);
  assert.ok(Math.abs((refBase * unit) / refQuote - ladderRef) < 1e-12);
  assert.ok(Math.abs(unit - 0.00627676) < 1e-7);
});

test("opening buy = quote to move start→reference, grossed up for the opening fee; lean ≈ 15%, standard ≈ 59% of raise", () => {
  for (const [curve, lo, hi] of [["lean", 0.12, 0.18], ["standard", 0.5, 0.65]]) {
    const b = buildEquityCurve({ refBaseUsd: 100, refQuoteUsd: 1, quoteDecimals: 6, unit: 1, float: 1000, curve, profile: "issuer" });
    const refSqrt = getSqrtPriceFromPrice(b.summary.referencePriceQuote.toString(), 9, 6);
    const reserve = Number(getQuoteReserveFromNextSqrtPrice(refSqrt, b.configParams).toString()) / 1e6;
    const opening = reserve / (1 - 0.03) * 1.005;
    const frac = opening / b.summary.migrationQuoteThreshold;
    assert.ok(frac > lo && frac < hi, `${curve}: opening buy is ${(frac * 100).toFixed(1)}% of the raise`);
  }
});

test("twin resolution order and coverage: xStock → Backpack → Ondo", () => {
  assert.equal(twinOf("GME"), XSTOCKS.GMEx.mint);
  assert.equal(twinOf("DKNG"), BACKPACK.DKNG.mint);
  assert.equal(twinOf("RKLB"), ONDO.RKLBon.mint);
  assert.equal(twinOf("ZZZZ"), undefined);
  assert.deepEqual(twinsOf("GME").map((t) => t.issuer), ["xstocks", "ondo"]);
  assert.deepEqual(twinsOf("SNDK").map((t) => t.issuer), ["backpack", "ondo"]);
  assert.equal(Object.keys(XSTOCKS).length, 20); assert.equal(Object.keys(BACKPACK).length, 48); assert.equal(Object.keys(ONDO).length, 28);
});
