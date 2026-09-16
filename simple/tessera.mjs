// Tessera, the obvious version: their API, the T-tokens, mark price and valuation — compared with PreStocks for the same company. node simple/tessera.mjs
const [tess, pre] = await Promise.all([fetch("https://rest-api.tessera.pe/v1/public/token-details").then((r) => r.json()), fetch("https://prestocks.com/api/prestocks").then((r) => r.json())]);
const alias = { "T-OpenAI": "OPENAI", "T-Kalshi": "KALSHI", "T-SpaceX": "SPACEX" };
for (const t of tess) {
  const p = pre.find((x) => x.symbol === alias[t.symbol]);
  console.log(`${t.symbol.padEnd(9)} mark $${t.markPrice.toFixed(2).padStart(7)}  valuation $${(t.markValuation / 1e9).toFixed(0)}B  holders ${t.holders}  mint ${t.mint}` + (p ? `\n           PreStocks values ${alias[t.symbol]} at $${(p.markValuation / 1e9).toFixed(0)}B → ${(p.markValuation / t.markValuation).toFixed(2)}× Tessera` : ""));
}
