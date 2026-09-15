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
  return { ok: true, price: p.usdPrice, source: "jupiter-v3", feed: mint, ageSec: 0 };
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
