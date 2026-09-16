// Pre-IPO references: PreStocks (mark price from the SPV + on-chain token price) and Tessera (mark price + valuation).
// Neither mint can be a DBC quote today (TransferFeeConfig, no badge) — they are references only.
const PRESTOCKS = "https://prestocks.com/api/prestocks";
const TESSERA = "https://rest-api.tessera.pe/v1/public/token-details";

// Company aliases across the two providers.
const ALIASES = { SPACEX: ["SPACEX", "T-SpaceX"], OPENAI: ["OPENAI", "T-OpenAI"], KALSHI: ["KALSHI", "T-Kalshi"] };

export async function fetchPreIpo() {
  // Each provider fails independently: a 500 from one must not take the other (or the anchor) down.
  // Tessera's API flaps (intermittent 500s); retry with backoff before treating a provider as absent.
  const once = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url} HTTP ${r.status}`)))).then((j) => (Array.isArray(j) ? j : Promise.reject(new Error(`${url} non-array`))));
  const safe = async (url) => { for (let i = 0; i < 4; i++) { try { return await once(url); } catch (e) { if (i === 3) { console.warn(`preipo: ${e.message} (after 4 tries)`); return []; } await new Promise((r) => setTimeout(r, 800 * (i + 1))); } } };
  const [pre, tess] = await Promise.all([safe(PRESTOCKS), safe(TESSERA)]);
  return {
    prestocks: pre.map((t) => ({ provider: "prestocks", symbol: t.symbol, mint: t.contract_address, mark: t.markPrice, token: t.tokenPrice, markValuation: t.markValuation, impliedValuation: t.impliedValuation, supply: t.supply, url: t.external_url })),
    tessera: tess.map((t) => ({ provider: "tessera", symbol: t.symbol, mint: t.mint, mark: t.markPrice, markValuation: t.markValuation, holders: t.holders })),
  };
}

/** Reference for a pre-IPO company. anchor = "prestocks" (default) or "tessera": that provider's mark price is the anchor,
 *  the other is context. The two providers' per-token units differ, so the anchor also defines what "1 unit" means. */
export async function resolvePreIpo(name, anchor = process.env.PREIPO_ANCHOR || "prestocks") {
  const { prestocks, tessera } = await fetchPreIpo();
  const names = ALIASES[name.toUpperCase()] || [name];
  const p = prestocks.find((t) => names.includes(t.symbol));
  const t = tessera.find((x) => names.includes(x.symbol));
  if (!p && !t) throw new Error(`no pre-IPO reference for ${name}`);
  const useT = anchor === "tessera" ? !!t : !p;
  if (anchor === "tessera" && !t) throw new Error(`Tessera has no ${name} token (API down or unlisted)`);
  const a = useT ? { price: t.mark, source: "tessera-mark", feed: `${t.symbol}@${t.mint}`, anchor: "tessera" } : { price: p.mark, source: "prestocks-mark", feed: `${p.symbol}@${p.mint}`, anchor: "prestocks" };
  return {
    ok: true, ...a, ageSec: 0, tried: [],
    context: {
      prestocks: p && { symbol: p.symbol, mint: p.mint, mark: p.mark, token: p.token, basisBps: (p.token / p.mark - 1) * 1e4, markValuation: p.markValuation, impliedValuation: p.impliedValuation, supply: p.supply },
      tessera: t && { symbol: t.symbol, mint: t.mint, mark: t.mark, markValuation: t.markValuation, holders: t.holders },
    },
  };
}

export async function listPreIpo() {
  const { prestocks, tessera } = await fetchPreIpo();
  for (const p of prestocks) console.log(`prestocks ${p.symbol.padEnd(11)} mark $${p.mark.toFixed(2)}  token $${p.token.toFixed(2)}  basis ${((p.token / p.mark - 1) * 1e4).toFixed(0).padStart(6)} bps  markVal $${(p.markValuation / 1e9).toFixed(0)}B  implied $${(p.impliedValuation / 1e9).toFixed(0)}B  supply ${p.supply.toFixed(0)}`);
  for (const t of tessera) console.log(`tessera   ${t.symbol.padEnd(11)} mark $${t.mark.toFixed(2)}  markVal $${(t.markValuation / 1e9).toFixed(0)}B  holders ${t.holders}`);
}
if (process.argv[1]?.endsWith("preipo.mjs")) await listPreIpo();
