import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveUsdRobust } from "../src/prices.mjs";

// Stub fetch: Jupiter price v3 per mint, Lazer 403, Pyth MCP metadata, Hermes metadata (no feed).
let prices = {};
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes("lite-api.jup.ag/price/v3")) { const id = new URL(u).searchParams.get("ids"); const p = prices[id]; return { ok: true, json: async () => (p ? { [id]: { usdPrice: p.price, liquidity: p.liq } } : {}) }; }
    if (u.includes("pyth-lazer")) return { ok: false, status: 403, text: async () => "Not entitled" };
    if (u.includes("mcp.pyth.network")) return { ok: true, json: async () => ({ result: { content: [{ type: "text", text: JSON.stringify({ feeds: [] }) }] } }) };
    if (u.includes("hermes.pyth.network")) return { ok: true, json: async () => [] };
    throw new Error("unexpected fetch " + u);
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const twins = [{ issuer: "xstocks", symbol: "GMEx", mint: "X" }, { issuer: "ondo", symbol: "GMEon", mint: "O" }, { issuer: "backpack", symbol: "GME", mint: "B" }];

test("median across twins; liquidity tags high/low; spread reported", async () => {
  prices = { X: { price: 21.39, liq: 253000 }, O: { price: 21.53, liq: 20 }, B: { price: 21.60, liq: 15000 } };
  const r = await resolveUsdRobust({ pythSymbol: "Equity.US.GME/USD", twins });
  assert.equal(r.price, 21.53);
  assert.match(r.source, /^median\(/);
  assert.equal(r.robust.sources.find((s) => s.label === "GMEx").conf, "high");
  assert.equal(r.robust.sources.find((s) => s.label === "GMEon").conf, "low");
  assert.ok(Math.abs(r.robust.spreadPct - ((21.60 - 21.39) / 21.53) * 100) < 1e-9);
  assert.equal(r.robust.lowConfidenceOnly, false);
});

test("even count → mean of the two middle prices", async () => {
  prices = { X: { price: 10, liq: 1e6 }, O: { price: 10.1, liq: 1e6 } };
  const r = await resolveUsdRobust({ twins: twins.slice(0, 2) });
  assert.ok(Math.abs(r.price - 10.05) < 1e-9);
});

test("single thin twin is used but flagged lowConfidenceOnly", async () => {
  prices = { O: { price: 63.51, liq: 0 } };
  const r = await resolveUsdRobust({ pythSymbol: "Equity.US.RKLB/USD", twins: [twins[1]] });
  assert.equal(r.price, 63.51);
  assert.equal(r.robust.lowConfidenceOnly, true);
});

test("refuses when sources disagree beyond max spread, unless forced", async () => {
  prices = { X: { price: 100, liq: 1e6 }, O: { price: 105, liq: 1e6 } };
  await assert.rejects(resolveUsdRobust({ twins: twins.slice(0, 2) }, { maxSpreadPct: 2 }), /disagree/);
  const r = await resolveUsdRobust({ twins: twins.slice(0, 2) }, { maxSpreadPct: 2, force: true });
  assert.equal(r.price, 102.5);
});

test("manual value is used only when no live source exists, and is labelled", async () => {
  prices = {};
  const r = await resolveUsdRobust({ pythSymbol: "Equity.US.RKLB/USD", twins: [twins[1]], manual: 63.55 });
  assert.equal(r.price, 63.55); assert.equal(r.source, "manual");
  prices = { O: { price: 60, liq: 0 } };
  const r2 = await resolveUsdRobust({ twins: [twins[1]], manual: 63.55 });
  assert.equal(r2.price, 60, "live source beats manual");
});

test("no source at all throws", async () => {
  prices = {};
  await assert.rejects(resolveUsdRobust({ twins: [twins[0]] }), /no live source/);
});
