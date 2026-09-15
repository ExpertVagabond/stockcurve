// Pre-IPO references: PreStocks (mark price from the SPV + on-chain token price) and Tessera (mark price + valuation).
// Neither mint can be a DBC quote today (TransferFeeConfig, no badge) — they are references only.
const PRESTOCKS = "https://prestocks.com/api/prestocks";
const TESSERA = "https://rest-api.tessera.pe/v1/public/token-details";

// Company aliases across the two providers.
const ALIASES = { SPACEX: ["SPACEX", "T-SpaceX"], OPENAI: ["OPENAI", "T-OpenAI"], KALSHI: ["KALSHI", "T-Kalshi"] };

export async function fetchPreIpo() {
  const [pre, tess] = await Promise.all([
    fetch(PRESTOCKS).then((r) => r.json()),
    fetch(TESSERA).then((r) => r.json()),
  ]);
  return {
    prestocks: pre.map((t) => ({ provider: "prestocks", symbol: t.symbol, mint: t.contract_address, mark: t.markPrice, token: t.tokenPrice, markValuation: t.markValuation, impliedValuation: t.impliedValuation, supply: t.supply, url: t.external_url })),
    tessera: tess.map((t) => ({ provider: "tessera", symbol: t.symbol, mint: t.mint, mark: t.markPrice, markValuation: t.markValuation, holders: t.holders })),
  };
}

/** Reference for a pre-IPO company: PreStocks mark price is the anchor; everything else is context. */
export async function resolvePreIpo(name) {
  const { prestocks, tessera } = await fetchPreIpo();
  const names = ALIASES[name.toUpperCase()] || [name];
  const p = prestocks.find((t) => names.includes(t.symbol));
  const t = tessera.find((x) => names.includes(x.symbol));
  if (!p && !t) throw new Error(`no pre-IPO reference for ${name}`);
  const anchor = p ? { price: p.mark, source: "prestocks-mark", feed: `${p.symbol}@${p.mint}` } : { price: t.mark, source: "tessera-mark", feed: `${t.symbol}@${t.mint}` };
  return {
    ok: true, ...anchor, ageSec: 0, tried: [],
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
