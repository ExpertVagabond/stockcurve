// Meteora, the obvious version: which stock tokens can be the QUOTE of a Dynamic Bonding Curve pool.
// DBC only accepts Token-2022 quotes that Meteora has badged. This derives the badge PDA for every
// xStock / Backpack / Ondo mint and reads it. node simple/meteora-stock-quotes.mjs
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { connection, XSTOCKS, BACKPACK, ONDO } from "../src/config.mjs";

const sets = { xStocks: XSTOCKS, Backpack: BACKPACK, Ondo: ONDO };
for (const [issuer, list] of Object.entries(sets)) {
  const entries = Object.entries(list);
  const badges = entries.map(([, v]) => deriveTokenBadgeAddress(new PublicKey(typeof v === "string" ? v : v.mint)));
  const infos = [];
  for (let i = 0; i < badges.length; i += 100) infos.push(...await connection.getMultipleAccountsInfo(badges.slice(i, i + 100)));
  const ok = entries.filter((_, i) => infos[i]);
  console.log(`${issuer.padEnd(9)} ${ok.length}/${entries.length} badged → usable as a DBC quote${ok.length === entries.length ? " (all)" : ": " + ok.map(([k]) => k).join(" ")}`);
}
console.log("\nA stock as the quote means the curve is priced in shares, not SOL. We launched 13 that way; e.g. sGME/AAPLx https://solscan.io/account/J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm");
