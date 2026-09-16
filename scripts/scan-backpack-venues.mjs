// Re-examine the "95% have no venue" claim: for every Backpack stock mint, check (a) circulating supply on-chain,
// (b) a Backpack exchange spot/perp market, (c) a Jupiter price (on-chain DEX liquidity).
import { PublicKey } from "@solana/web3.js";
import { unpackMint, TOKEN_2022_PROGRAM_ID, getExtensionData, ExtensionType } from "@solana/spl-token";
import { readFileSync, writeFileSync } from "node:fs";
import { connection } from "../src/config.mjs";

const scan = JSON.parse(readFileSync("out/backpack-scan.json", "utf8")).filter((r) => r.mint);
const markets = await (await fetch("https://api.backpack.exchange/api/v1/markets")).json();
const spot = new Set(), perp = new Set();
for (const m of markets) { const t = m.baseSymbol?.replace(".US", ""); if (!m.baseSymbol?.endsWith(".US")) continue; (m.marketType === "PERP" ? perp : spot).add(t); }
const chunk = (a, n) => a.reduce((x, _, i) => (i % n ? x : [...x, a.slice(i, i + n)]), []);
const infos = (await Promise.all(chunk(scan.map((r) => new PublicKey(r.mint)), 100).map((c) => connection.getMultipleAccountsInfo(c)))).flat();
let withSupply = 0, spotN = 0, perpN = 0, priced = 0, supplyNoVenue = 0, supplyOnlyCex = 0;
const rows = [];
for (let i = 0; i < scan.length; i++) {
  const r = scan[i], ai = infos[i];
  if (!ai) continue;
  const m = unpackMint(new PublicKey(r.mint), ai, TOKEN_2022_PROGRAM_ID);
  let mult = 1; const ext = getExtensionData(ExtensionType.ScaledUiAmountConfig, m.tlvData); if (ext) mult = ext.readDoubleLE(32);
  const supply = Number(m.supply) / 10 ** m.decimals * mult;
  const hasSpot = spot.has(r.sym), hasPerp = perp.has(r.sym), hasJup = !!r.jupUsd;
  if (supply > 0) withSupply++;
  if (hasSpot) spotN++; if (hasPerp) perpN++; if (hasJup) priced++;
  if (supply > 0 && !hasJup && !hasSpot) supplyNoVenue++;
  if (supply > 0 && !hasJup && hasSpot) supplyOnlyCex++;
  rows.push({ sym: r.sym, mint: r.mint, supply, supplyUsd: r.jupUsd ? supply * r.jupUsd : null, backpackSpot: hasSpot, backpackPerp: hasPerp, jupiterPriced: hasJup, jupLiq: r.jupLiq });
}
rows.sort((a, b) => b.supply - a.supply);
console.log(`Backpack stock mints: ${scan.length}`);
console.log(`  with non-zero on-chain supply: ${withSupply}`);
console.log(`  with a Backpack exchange SPOT market: ${spotN}   (PERP: ${perpN})`);
console.log(`  with a Jupiter price (on-chain DEX liquidity): ${priced}`);
console.log(`  supply > 0 AND no Jupiter price AND no Backpack spot market: ${supplyNoVenue}`);
console.log(`  supply > 0 AND no Jupiter price BUT a Backpack spot market (CEX-only venue): ${supplyOnlyCex}`);
console.log("\ntop 15 by supply:");
for (const r of rows.slice(0, 15)) console.log(`  ${r.sym.padEnd(7)} supply ${r.supply.toFixed(2).padStart(14)}  jup ${r.jupiterPriced ? "yes" : "no "}  spot ${r.backpackSpot ? "yes" : "no "}  perp ${r.backpackPerp ? "yes" : "no "}`);
console.log("\nsupply>0, no DEX price, no spot market (sample):", rows.filter((r) => r.supply > 0 && !r.jupiterPriced && !r.backpackSpot).slice(0, 25).map((r) => `${r.sym}(${r.supply.toFixed(1)})`).join(" "));
writeFileSync("out/backpack-venues.json", JSON.stringify(rows, null, 2));
