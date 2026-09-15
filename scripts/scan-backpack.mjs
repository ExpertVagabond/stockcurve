// Backpack Securities tokenized stocks on Solana: which have mints, token program/extensions, DBC quote eligibility, on-chain liquidity.
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { getMint, getExtensionTypes, ExtensionType, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { writeFileSync } from "node:fs";
import { connection } from "../src/config.mjs";

const assets = await (await fetch("https://api.backpack.exchange/api/v1/assets")).json();
const onchain = assets.flatMap((a) => (a.tokens || []).filter((t) => t.blockchain === "Solana" && t.contractAddress && /\.US$/.test(a.symbol)).map((t) => ({ sym: a.symbol.replace(".US", ""), mint: t.contractAddress })));
const total = assets.filter((a) => /\.US$/.test(a.symbol)).length;
console.log(`${total} .US assets listed, ${onchain.length} with a Solana mint`);

const mints = onchain.map((r) => new PublicKey(r.mint));
const chunk = (arr, n) => arr.reduce((a, _, i) => (i % n ? a : [...a, arr.slice(i, i + n)]), []);
const infos = (await Promise.all(chunk(mints, 100).map((c) => connection.getMultipleAccountsInfo(c)))).flat();
const badges = (await Promise.all(chunk(mints.map((m) => deriveTokenBadgeAddress(m)), 100).map((c) => connection.getMultipleAccountsInfo(c)))).flat();
const ids = onchain.map((r) => r.mint).join(",");
const prices = await (await fetch(`https://lite-api.jup.ag/price/v3?ids=${ids}`)).json().catch(() => ({}));

let t22 = 0, spl = 0, badged = 0, permissionless = 0, priced = 0;
const out = [];
for (let i = 0; i < onchain.length; i++) {
  const r = onchain[i], ai = infos[i];
  if (!ai) { out.push({ ...r, status: "NO ACCOUNT" }); continue; }
  let ext = [], dec = null;
  if (ai.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    t22++;
    const m = await getMint(connection, mints[i], "confirmed", TOKEN_2022_PROGRAM_ID);
    ext = getExtensionTypes(m.tlvData).map((t) => ExtensionType[t]); dec = m.decimals;
  } else if (ai.owner.equals(TOKEN_PROGRAM_ID)) { spl++; ext = ["SPL"]; }
  const eligible = ext[0] === "SPL" || ext.every((t) => ["MetadataPointer", "TokenMetadata"].includes(t)) ? "permissionless" : badges[i] ? "badge" : "needs-badge";
  if (eligible === "permissionless") permissionless++; if (badges[i]) badged++;
  const p = prices[r.mint]; if (p) priced++;
  out.push({ ...r, dec, ext, eligible, jupUsd: p?.usdPrice ?? null, jupLiq: p?.liquidity ?? null });
}
out.sort((a, b) => (b.jupLiq || 0) - (a.jupLiq || 0));
for (const r of out) console.log(`${(r.eligible || r.status).padEnd(14)} ${r.sym.padEnd(7)} ${r.mint}  ${r.jupUsd ? "$" + r.jupUsd.toFixed(2) : "no jup price"}  liq ${r.jupLiq ? "$" + Math.round(r.jupLiq).toLocaleString() : "-"}  ${(r.ext || []).join(",")}`);
console.log(`\nToken-2022: ${t22}, SPL: ${spl}, DBC-quote permissionless: ${permissionless}, badged: ${badged}, with Jupiter price: ${priced}/${onchain.length}`);
writeFileSync("out/backpack-scan.json", JSON.stringify(out, null, 2));
