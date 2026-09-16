// Reference-price resolver. Every result carries provenance {source, ageSec, feed} so the curve
// config can record exactly what it was anchored to. Order of preference:
//   1. Pyth Pro (Lazer) HTTP latest_price — live, needs a token with a grant for that feed
//   2. Pyth push-oracle account on Solana — no key needed, but may be stale (flagged)
//   3. Jupiter price v3 — only for on-chain mints (xStocks), live secondary-market price
//   4. manual override — issuer-supplied, recorded as such
import { PublicKey } from "@solana/web3.js";
import { connection, HERMES_META, LAZER_HTTP, PYTH_MCP, PYTH_PUSH_ORACLE, loadPythToken } from "./config.mjs";

const now = () => Math.floor(Date.now() / 1000);

/** Hermes metadata is public: resolve "Equity.US.GME/USD" -> { hermesId, expo } */
export async function resolveHermesFeed(symbol) {
  const q = symbol.split(".").pop().split("/")[0];
  const feeds = await (await fetch(`${HERMES_META}?query=${encodeURIComponent(q)}`)).json();
  const f = feeds.find((x) => x.attributes.symbol === symbol);
  return f ? { hermesId: f.id, symbol } : null;
}

/** Lazer numeric id via the public Pyth MCP get_symbols (no auth needed for metadata). */
export async function resolveLazerId(symbol) {
  const q = symbol.split(".").pop().split("/")[0];
  const r = await fetch(PYTH_MCP, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_symbols", arguments: { query: q, limit: 50 } } }),
  });
  try {
    const j = await r.json();
    const feeds = JSON.parse(j.result.content[0].text).feeds;
    return feeds.find((f) => f.symbol === symbol)?.pyth_lazer_id ?? null;
  } catch { return null; } // MCP returns a plain error string when its upstream is down; treat as "no id"
}

export async function pythLazer(symbol) {
  const token = loadPythToken();
  if (!token) return { ok: false, why: "no PYTH_ACCESS_TOKEN" };
  const id = await resolveLazerId(symbol).catch(() => null);
  if (!id) return { ok: false, why: "no lazer id (metadata unavailable)" };
  const r = await fetch(LAZER_HTTP, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "fixed_rate@200ms", formats: [], parsed: true, priceFeedIds: [id], properties: ["price", "bestBidPrice", "bestAskPrice", "exponent", "feedUpdateTimestamp"] }),
  });
  if (!r.ok) return { ok: false, why: `HTTP ${r.status}: ${(await r.text()).slice(0, 120)}` };
  const p = (await r.json()).parsed.priceFeeds[0];
  const expo = p.exponent;
  const price = Number(p.price) * 10 ** expo;
  const ts = Math.floor(Number(p.feedUpdateTimestamp) / 1e6);
  return { ok: true, price, bid: p.bestBidPrice && Number(p.bestBidPrice) * 10 ** expo, ask: p.bestAskPrice && Number(p.bestAskPrice) * 10 ** expo, source: "pyth-lazer", feed: `${symbol}#${id}`, ageSec: now() - ts };
}

/** Parse a PriceUpdateV2 account from the Pyth push oracle (shard 0). */
export async function pythOnChain(symbol) {
  const f = await resolveHermesFeed(symbol);
  if (!f) return { ok: false, why: "no hermes feed" };
  const shard = Buffer.alloc(2);
  const [pda] = PublicKey.findProgramAddressSync([shard, Buffer.from(f.hermesId, "hex")], PYTH_PUSH_ORACLE);
  const ai = await connection.getAccountInfo(pda);
  if (!ai) return { ok: false, why: "no push-oracle account" };
  const d = ai.data;
  let o = 8 + 32; // discriminator + write_authority
  const vl = d[o]; o += vl === 0 ? 2 : 1; // VerificationLevel::Partial{num_signatures} | Full
  o += 32; // feed_id
  const price = Number(d.readBigInt64LE(o)); o += 8;
  const conf = Number(d.readBigUInt64LE(o)); o += 8;
  const expo = d.readInt32LE(o); o += 4;
  const publishTime = Number(d.readBigInt64LE(o));
  return { ok: true, price: price * 10 ** expo, conf: conf * 10 ** expo, source: "pyth-onchain", feed: `${symbol}@${pda.toBase58()}`, ageSec: now() - publishTime };
}

export async function jupiterPrice(mint) {
  const j = await (await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`)).json();
  const p = j[mint];
  if (!p) return { ok: false, why: "no jupiter price" };
  return { ok: true, price: p.usdPrice, source: "jupiter-v3", feed: mint, ageSec: 0, liquidityUsd: p.liquidity ?? null };
}

const LOW_LIQ_USD = 10_000; // below this a twin is "low-confidence": used, but flagged

/**
 * Robust USD reference: every live source in parallel → median; optionally sampled over a window (TWAP of medians).
 * Refuses when sources disagree by more than maxSpreadPct (unless force). Always records every source.
 * @param {{pythSymbol?: string, twins?: {issuer:string,symbol:string,mint:string}[], mint?: string, manual?: number}} a
 * @param {{twapSec?: number, samples?: number, maxSpreadPct?: number, force?: boolean}} o
 */
export async function resolveUsdRobust(a, o = {}) {
  const twapSec = o.twapSec ?? 0, samples = twapSec > 0 ? Math.max(2, o.samples ?? Math.min(6, Math.ceil(twapSec / 10))) : 1;
  const maxSpread = o.maxSpreadPct ?? 2;
  const rounds = [];
  for (let i = 0; i < samples; i++) {
    const srcs = [];
    const jobs = [];
    for (const sym of [a.pythSymbol, ...(a.pythSymbols || [])].filter(Boolean)) jobs.push(pythLazer(sym).then((r) => r.ok && srcs.push({ src: "pyth-lazer", label: sym, price: r.price, liquidityUsd: null, conf: "high" })).catch(() => {}));
    for (const t of a.twins || []) jobs.push(jupiterPrice(t.mint).then((r) => r.ok && srcs.push({ src: `twin-${t.issuer}`, label: t.symbol, price: r.price, liquidityUsd: r.liquidityUsd, conf: (r.liquidityUsd ?? 0) >= LOW_LIQ_USD ? "high" : "low" })).catch(() => {}));
    if (a.mint) jobs.push(jupiterPrice(a.mint).then((r) => r.ok && srcs.push({ src: "jupiter", label: a.mint.slice(0, 6), price: r.price, liquidityUsd: r.liquidityUsd, conf: (r.liquidityUsd ?? 0) >= LOW_LIQ_USD ? "high" : "low" })).catch(() => {}));
    if (a.pythSymbol) jobs.push(pythOnChain(a.pythSymbol).then((r) => r.ok && r.ageSec <= 3600 && srcs.push({ src: "pyth-onchain", label: a.pythSymbol, price: r.price, liquidityUsd: null, conf: "high" })).catch(() => {}));
    await Promise.all(jobs);
    if (!srcs.length && a.manual != null) srcs.push({ src: "manual", label: "issuer-supplied", price: a.manual, liquidityUsd: null, conf: "manual" });
    if (!srcs.length) throw new Error(`no live source for ${a.pythSymbol || a.mint}`);
    // Pyth Pro is authoritative when present: median over Pyth sources; twins/Jupiter stay recorded as context.
    const pythSrcs = srcs.filter((s) => s.src === "pyth-lazer");
    const anchorSrcs = (o.preferPyth ?? true) && pythSrcs.length ? pythSrcs : srcs;
    for (const s2 of srcs) s2.role = anchorSrcs.includes(s2) ? "anchor" : "context";
    const ps = anchorSrcs.map((s) => s.price).sort((x, y) => x - y);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const allPs = srcs.map((s) => s.price).sort((x, y) => x - y);
    const spreadPct = allPs.length > 1 ? ((allPs[allPs.length - 1] - allPs[0]) / median) * 100 : 0; // disagreement across ALL sources still guards
    rounds.push({ at: new Date().toISOString(), sources: srcs, median, spreadPct });
    if (i < samples - 1) await new Promise((r) => setTimeout(r, (twapSec * 1000) / (samples - 1)));
  }
  const last = rounds[rounds.length - 1];
  const twap = rounds.reduce((acc, r) => acc + r.median, 0) / rounds.length;
  const maxSpreadSeen = Math.max(...rounds.map((r) => r.spreadPct));
  const highConf = last.sources.some((s) => s.conf === "high");
  if (maxSpreadSeen > maxSpread && !o.force) throw new Error(`reference sources disagree by ${maxSpreadSeen.toFixed(2)}% (> ${maxSpread}%): ${last.sources.map((s) => `${s.src}:${s.label}=$${s.price.toFixed(2)}`).join(", ")} — pass --force to override`);
  const anchorNames = [...new Set(last.sources.filter((s) => s.role === "anchor").map((s) => s.src))];
  return {
    ok: true, price: twap, source: anchorNames.length > 1 ? `median(${anchorNames.join("+")})${samples > 1 ? `·twap${twapSec}s` : ""}` : (anchorNames[0] === "manual" ? "manual" : `${anchorNames[0]}${samples > 1 ? `·twap${twapSec}s` : ""}`),
    feed: last.sources.map((s) => `${s.src}:${s.label}`).join(","), ageSec: 0,
    robust: { median: last.median, twap, samples, twapSec, spreadPct: maxSpreadSeen, lowConfidenceOnly: !highConf && last.sources[0].src !== "manual", sources: last.sources, rounds: rounds.map((r) => ({ at: r.at, median: r.median, spreadPct: r.spreadPct })) },
    tried: [],
  };
}

/**
 * Resolve a USD reference for an asset.
 * @param {{pythSymbol?: string, mint?: string, twinMint?: string, manual?: number, maxAgeSec?: number}} a
 *   twinMint: an on-chain tokenized twin of the same underlying (GME → GMEx). Its live secondary-market
 *   price is a valid reference when the Pyth equity feed is unavailable and the push account is stale.
 */
export async function resolveUsd(a) {
  const tried = [];
  if (a.pythSymbol) {
    const l = await pythLazer(a.pythSymbol);
    if (l.ok) return { ...l, tried };
    tried.push(`lazer: ${l.why}`);
  }
  if (a.twinMint) {
    const j = await jupiterPrice(a.twinMint);
    if (j.ok) return { ...j, source: "jupiter-xstock-twin", tried };
    tried.push(`twin: ${j.why}`);
  }
  if (a.pythSymbol) {
    const o = await pythOnChain(a.pythSymbol);
    if (o.ok && o.ageSec <= (a.maxAgeSec ?? 3600)) return { ...o, tried };
    if (o.ok) tried.push(`onchain: stale ${(o.ageSec / 86400).toFixed(1)}d ($${o.price})`); else tried.push(`onchain: ${o.why}`);
  }
  if (a.mint) {
    const j = await jupiterPrice(a.mint);
    if (j.ok) return { ...j, tried };
    tried.push(`jupiter: ${j.why}`);
  }
  if (a.manual != null) return { ok: true, price: a.manual, source: "manual", feed: "issuer-supplied", ageSec: 0, tried };
  // Last resort: a stale on-chain Pyth print is still better than nothing, but flag it loudly.
  if (a.pythSymbol) {
    const o = await pythOnChain(a.pythSymbol);
    if (o.ok) return { ...o, stale: true, tried };
  }
  throw new Error(`no reference price for ${JSON.stringify(a)}: ${tried.join(" | ")}`);
}
