// Pre-IPO tokens (Tessera T-Tokens, PreStocks): mint program, extensions, DBC badge, mark vs token price.
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { getMint, getExtensionTypes, ExtensionType, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "../src/config.mjs";

const tess = await (await fetch("https://rest-api.tessera.pe/v1/public/token-details")).json();
const pre = await (await fetch("https://prestocks.com/api/prestocks")).json();
const rows = [
  ...tess.map((t) => ({ src: "tessera", sym: t.symbol, mint: t.mint, mark: t.markPrice, token: null })),
  ...pre.map((t) => ({ src: "prestocks", sym: t.symbol, mint: t.contract_address, mark: t.markPrice, token: t.tokenPrice, supply: t.supply })),
];
const infos = await connection.getMultipleAccountsInfo(rows.map((r) => new PublicKey(r.mint)));
const badges = await connection.getMultipleAccountsInfo(rows.map((r) => deriveTokenBadgeAddress(new PublicKey(r.mint))));
let permissionless = 0, badged = 0;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i], ai = infos[i];
  let prog = "?", ext = "";
  if (ai?.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    prog = "T22";
    const m = await getMint(connection, new PublicKey(r.mint), "confirmed", TOKEN_2022_PROGRAM_ID);
    const types = getExtensionTypes(m.tlvData).map((t) => ExtensionType[t]);
    ext = types.join(",");
    r.dec = m.decimals;
    r.quoteOk = types.every((t) => ["MetadataPointer", "TokenMetadata"].includes(t)) ? "permissionless" : badges[i] ? "badge" : "NEEDS BADGE";
  } else if (ai?.owner.equals(TOKEN_PROGRAM_ID)) { prog = "SPL"; r.quoteOk = "permissionless"; }
  if (r.quoteOk === "permissionless") permissionless++; if (badges[i]) badged++;
  const basis = r.token && r.mark ? ((r.token / r.mark - 1) * 1e4).toFixed(0) + " bps" : "";
  console.log(`${(r.quoteOk || "?").padEnd(14)} ${r.src.padEnd(9)} ${r.sym.padEnd(12)} ${prog} ${r.mint}  mark $${Number(r.mark).toFixed(2)}${r.token ? ` token $${Number(r.token).toFixed(2)} basis ${basis}` : ""}  ${ext}`);
}
console.log(`\n${rows.length} pre-IPO tokens: ${permissionless} usable as DBC quote permissionlessly, ${badged} badged`);
