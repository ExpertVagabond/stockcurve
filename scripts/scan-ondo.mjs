// Ondo Global Markets tokenized stocks on Solana: vanity mints ending in "ondo". Badge, extensions, Jupiter liquidity, Pyth feed.
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { unpackMint, getExtensionTypes, ExtensionType, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { writeFileSync } from "node:fs";
import { connection } from "../src/config.mjs";

const tickers = ["AAPL","TSLA","NVDA","MSFT","AMZN","GOOGL","META","SPY","QQQ","COIN","HOOD","PLTR","MSTR","GME","AMD","NFLX","AVGO","CRCL","GLD","TLT","IWM","SNDK","RKLB","DKNG","RDDT"];
const found = new Map();
for (const t of tickers) {
  const r = await (await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${t}on`)).json().catch(() => []);
  for (const x of (Array.isArray(r) ? r : r.tokens || [])) if (x.id.endsWith("ondo")) found.set(x.id, { sym: x.symbol, mint: x.id, name: x.name, jupUsd: x.usdPrice ?? null, jupLiq: x.liquidity ?? null });
}
const list = [...found.values()];
const infos = await connection.getMultipleAccountsInfo(list.map((r) => new PublicKey(r.mint)));
const badges = await connection.getMultipleAccountsInfo(list.map((r) => deriveTokenBadgeAddress(new PublicKey(r.mint))));
const hermes = await (await fetch("https://hermes.pyth.network/v2/price_feeds?query=ON/USD")).json().catch(() => []);
const feeds = new Set(hermes.map((f) => f.attributes.symbol));
let badged = 0;
for (let i = 0; i < list.length; i++) {
  const r = list[i], ai = infos[i];
  let ext = []; if (ai?.owner.equals(TOKEN_2022_PROGRAM_ID)) { const m = unpackMint(new PublicKey(r.mint), ai, TOKEN_2022_PROGRAM_ID); ext = getExtensionTypes(m.tlvData).map((t) => ExtensionType[t]); r.dec = m.decimals; }
  r.badge = !!badges[i]; badged += r.badge;
  r.pyth = feeds.has(`Crypto.${r.sym.toUpperCase()}/USD`) ? `Crypto.${r.sym.toUpperCase()}/USD` : null;
  r.eligible = r.badge ? "badge" : ext.every((t) => ["MetadataPointer", "TokenMetadata"].includes(t)) ? "permissionless" : "needs-badge";
  console.log(`${r.eligible.padEnd(14)} ${r.sym.padEnd(8)} ${r.mint}  ${r.jupUsd ? "$" + r.jupUsd.toFixed(2) : "no price"}  liq ${r.jupLiq ? "$" + Math.round(r.jupLiq) : "-"}  pyth ${r.pyth || "-"}  ${ext.join(",")}`);
}
console.log(`\n${list.length} Ondo mints found, ${badged} badged`);
writeFileSync("out/ondo-scan.json", JSON.stringify(list, null, 2));
