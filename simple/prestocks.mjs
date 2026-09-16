// PreStocks, the obvious version: their API, every token, mark price vs on-chain price. node simple/prestocks.mjs
const d = await (await fetch("https://prestocks.com/api/prestocks")).json();
console.log("PreStocks  mark(SPV)   token(chain)   basis     valuation");
for (const t of d) {
  const tok = t.tokenPrice == null ? "   (none)" : "$" + t.tokenPrice.toFixed(2).padStart(8);
  const basis = t.tokenPrice == null ? "      —" : ((t.tokenPrice / t.markPrice - 1) * 1e4).toFixed(0).padStart(6) + " bps";
  console.log(`${t.symbol.padEnd(11)} $${t.markPrice.toFixed(2).padStart(8)}   ${tok}   ${basis}   $${(t.markValuation / 1e9).toFixed(0)}B   ${t.contract_address}`);
}
