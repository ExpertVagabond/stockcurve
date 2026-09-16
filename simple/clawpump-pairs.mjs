// Clawpump, the obvious version: which stocks you can pair a launch with. node simple/clawpump-pairs.mjs   (key in ~/.config/clawpump/clawpump.env)
import { readFileSync } from "node:fs"; import { homedir } from "node:os";
const key = readFileSync(`${homedir()}/.config/clawpump/clawpump.env`, "utf8").match(/CLAWPUMP_API_KEY=(\S+)/)[1];
const d = await (await fetch("https://clawpump.tech/api/v1/pump-pairs", { headers: { Authorization: `Bearer ${key}` } })).json();
const stocks = d.assets.filter((a) => a.mint.startsWith("Xs") || /^[A-Z]{2,5}$/.test(a.symbol) && a.decimals === 6 && !["SOL", "USDC", "BTC", "ETH"].includes(a.symbol));
console.log(`${d.assets.length} pairable assets; stock-looking: ${stocks.length}. Creator fee ${d.creatorFeeBps.min}–${d.creatorFeeBps.max} bps.`);
for (const a of stocks) console.log(`  ${a.symbol.padEnd(7)} ${a.mint}`);
console.log("\nLaunch = POST /api/v1/launch/self-funded with pumpQuoteMint = one of these. We launched scSNDK paired with SNDK: https://pump.fun/coin/CUnDgEpzGQNkwQKDCNoyv1SB6YvBygUSCekSPgnsUGkm");
