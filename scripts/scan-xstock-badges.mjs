// Which xStocks can be a DBC quote token today? Pull the xStock list from Jupiter, check each mint's Meteora TokenBadge.
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../src/config.mjs";

const seen = new Map();
for (const q of ["xStock", "xStocks", "Xs"]) {
  const r = await (await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${q}`)).json();
  for (const t of (Array.isArray(r) ? r : r.tokens || [])) if (t.id?.startsWith("Xs") && /x$/.test(t.symbol)) seen.set(t.id, t);
}
const list = [...seen.values()].sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
const infos = await connection.getMultipleAccountsInfo(list.map((t) => deriveTokenBadgeAddress(new PublicKey(t.id))));
let ok = 0;
for (let i = 0; i < list.length; i++) {
  const t = list[i], has = !!infos[i]; ok += has;
  console.log(`${has ? "✅" : "❌"} ${t.symbol.padEnd(7)} ${t.id}  liq $${Math.round(t.liquidity || 0).toLocaleString()}  $${(t.usdPrice || 0).toFixed(2)}`);
}
console.log(`\nbadged as DBC quote: ${ok}/${list.length}`);
