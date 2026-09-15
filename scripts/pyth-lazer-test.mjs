// Smoke test: subscribe to Pyth Pro (Lazer) websocket with the Bearer token and print one update per feed.
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(`${process.env.HOME}/.config/pyth/pyth.env`, "utf8").split("\n").filter(l => l.includes("=")).map(l => l.split("=")));
const ids = (process.argv[2] || "922").split(",").map(Number);
const ws = new WebSocket("wss://pyth-lazer-0.dourolabs.app/v1/stream", { headers: { Authorization: `Bearer ${env.PYTH_ACCESS_TOKEN}` } });
const t = setTimeout(() => { console.log("TIMEOUT no data"); process.exit(2); }, 8000);
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", subscriptionId: 1, priceFeedIds: ids, properties: ["price", "bestBidPrice", "bestAskPrice", "exponent", "feedUpdateTimestamp"], formats: [], channel: "fixed_rate@1000ms", ignoreInvalidFeeds: true }));
ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.type === "streamUpdated") { console.log(JSON.stringify(j.parsed)); clearTimeout(t); ws.close(); process.exit(0); } else console.log("msg:", JSON.stringify(j).slice(0, 300)); };
ws.onerror = (e) => { console.log("ERROR", e.message || e); };
ws.onclose = (e) => { console.log("closed", e.code, e.reason); };
