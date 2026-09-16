// Pyth, the obvious version: read a stock's price from Pyth Pro and compare it to the on-chain xStock. One command, no keys in code.
// node simple/pyth-stock.mjs TSLA      (token in ~/.config/pyth/pyth.env)
import { readFileSync } from "node:fs"; import { homedir } from "node:os";
const t = (process.argv[2] || "TSLA").toUpperCase();
const token = readFileSync(`${homedir()}/.config/pyth/pyth.env`, "utf8").match(/PYTH_ACCESS_TOKEN=(\S+)/)[1];
const feeds = await (await fetch(`https://hermes.pyth.network/v2/price_feeds?query=${t}`)).json();
const sym = `Equity.US.${t}/USD`;
const meta = await (await fetch("https://mcp.pyth.network/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_symbols", arguments: { query: t, limit: 50 } } }) })).json();
const id = JSON.parse(meta.result.content[0].text).feeds.find((f) => f.symbol === sym)?.pyth_lazer_id;
const r = await fetch("https://pyth-lazer-0.dourolabs.app/v1/latest_price", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ channel: "fixed_rate@200ms", formats: [], parsed: true, priceFeedIds: [id], properties: ["price", "exponent", "feedUpdateTimestamp"] }) });
if (!r.ok) { console.log(`${sym}: ${await r.text()}`); process.exit(1); }
const p = (await r.json()).parsed.priceFeeds[0], pyth = Number(p.price) * 10 ** p.exponent;
const xs = feeds.find((f) => f.attributes.symbol === `Crypto.${t}X/USD`);
const mints = { TSLA: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", AAPL: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", NVDA: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", QQQ: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ" };
const j = mints[t] ? (await (await fetch(`https://lite-api.jup.ag/price/v3?ids=${mints[t]}`)).json())[mints[t]] : null;
console.log(`${sym} (Pyth Pro, ${Math.round(Date.now() / 1000 - Number(p.feedUpdateTimestamp) / 1e6)}s old): $${pyth.toFixed(2)}`);
if (j) console.log(`${t}x on Solana (Jupiter): $${j.usdPrice.toFixed(2)}  →  xStock trades ${((j.usdPrice / pyth - 1) * 1e4).toFixed(0)} bps ${j.usdPrice >= pyth ? "above" : "below"} the Pyth equity price`);
