// Track our Clawpump agent tokens: curve/mcap/creator from pump.fun, holders via Helius DAS, DexScreener volume,
// and the fees accrued in our Meteora DLMM positions. Writes out/agents.json. Usage: node scripts/agents.mjs [--json]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { PublicKey } from "@solana/web3.js";
import { createRequire } from "node:module";
const DLMM = createRequire(import.meta.url)("@meteora-ag/dlmm");
import { connection, loadKeypair, RPC } from "../src/config.mjs";
const me = loadKeypair().publicKey;
const launches = readdirSync("out/clawpump").filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(`out/clawpump/${f}`, "utf8")));
const pairs = readdirSync("out/pairs").map((f) => JSON.parse(readFileSync(`out/pairs/${f}`, "utf8")));
const usd = (n) => n == null ? "—" : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}k` : `$${Number(n).toFixed(2)}`;
const holders = async (mint) => { let n = 0, cursor; do { const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTokenAccounts", params: { mint, limit: 1000, ...(cursor ? { cursor } : {}) } }) }).then((r) => r.json()); const accts = r.result?.token_accounts || []; n += accts.filter((a) => Number(a.amount) > 0).length; cursor = r.result?.cursor; if (!accts.length) break; } while (cursor); return n; };
const rows = [];
for (const l of launches) {
  const mint = l.response?.mintAddress; if (!mint) continue;
  const c = l.response?.dbcPool ? { symbol: l.request.symbol, complete: false, creator: "clawpump-dbc" } : await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`, { headers: { "user-agent": "Mozilla/5.0" } }).then((r) => r.json()).catch(() => ({}));
  const ps = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${mint}`).then((r) => r.json()).catch(() => []);
  const pump = ps.find((p) => p.dexId === "pumpfun" || p.dexId === "pumpswap"), met = ps.find((p) => p.dexId === "meteora");
  const pair = pairs.find((p) => p.x === mint);
  let pos = null;
  if (pair) { try { const d = await DLMM.create(connection, new PublicKey(pair.pair)); const { userPositions } = await d.getPositionsByUserAndLbPair(me); const p = userPositions[0]; if (p) pos = { x: Number(p.positionData.totalXAmount) / 1e6, y: Number(p.positionData.totalYAmount) / 1e6, feeX: Number(p.positionData.feeX) / 1e6, feeY: Number(p.positionData.feeY) / 1e6, bins: `${p.positionData.lowerBinId}..${p.positionData.upperBinId}` }; } catch (e) { pos = { err: e.message.slice(0, 60) }; } }
  rows.push({ symbol: l.request.symbol, mint, wallet: me.toBase58(), quote: l.request.pumpQuoteMint, creator: c.creator, curve: c.complete ? "graduated" : "on curve", mcapUsd: c.usd_market_cap, replies: c.reply_count, lastTrade: c.last_trade_timestamp, holders: await holders(mint), vol24h: pump?.volume?.h24 ?? 0, liqUsd: pump?.liquidity?.usd, pumpUrl: `https://pump.fun/coin/${mint}`, pair: pair?.pair, pairVol24h: met?.volume?.h24 ?? 0, position: pos, launchedAt: l.at });
}
writeFileSync("out/agents.json", JSON.stringify({ at: new Date().toISOString(), wallet: me.toBase58(), agents: rows }, null, 2));
if (process.argv.includes("--json")) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
for (const r of rows) {
  console.log(`${r.symbol}  ${r.mint}\n  pump.fun: ${r.curve} · mcap ${usd(r.mcapUsd)} · holders ${r.holders} · vol24h ${usd(r.vol24h)} · last trade ${r.lastTrade ? new Date(r.lastTrade).toISOString().slice(0, 16) : "—"} · creator ${r.creator?.slice(0, 8)}${r.creator === r.wallet ? " (us)" : " (Clawpump)"}`);
  console.log(`  meteora pair ${r.pair || "—"}: vol24h ${usd(r.pairVol24h)}${r.position ? r.position.err ? ` · position err ${r.position.err}` : ` · our position ${r.position.x.toFixed(0)} X / ${r.position.y.toFixed(5)} Y · fees accrued ${r.position.feeX.toFixed(2)} X / ${r.position.feeY.toFixed(6)} Y · bins ${r.position.bins}` : ""}`);
}
