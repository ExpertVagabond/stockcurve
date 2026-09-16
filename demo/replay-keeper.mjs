// Replay a keeper log (pool 4's unattended run) as a paced, human-readable transcript for the demo terminal.
import { readFileSync } from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = readFileSync(process.argv[2] || "docs/keeper-pool4.log", "utf8").trim().split("\n").map((l) => JSON.parse(l));
const pool = process.argv[3] || "eMbF1jwsZ1YNBjcNmYK15FQrAyX8Hz4ksjtvvoSxZ25";
const c = { g: "\x1b[32m", y: "\x1b[33m", b: "\x1b[34m", m: "\x1b[35m", d: "\x1b[2m", r: "\x1b[0m", w: "\x1b[1m" };
console.log(`${c.w}$ node scripts/keeper.mjs --watch --budget 0.012 --graduate${c.r}`);
await sleep(600);
for (const e of lines) {
  if (e.pool && e.pool !== pool) continue;
  const t = e.at.slice(11, 19);
  let out = null;
  if (e.ev === "watch") out = `${c.d}${t}${c.r} ${c.b}watch${c.r}  subscribed to DBC program logs (${e.program.slice(0, 8)}…)`;
  else if (e.ev === "pool-created") out = `${c.d}${t}${c.r} ${c.m}pool-created${c.r}  ${e.pool.slice(0, 12)}…  config ${e.config.slice(0, 8)}…  ours=${e.ours}`;
  else if (e.ev === "tick" && e.intent !== "hold") out = `${c.d}${t}${c.r} tick  price ${e.price.toFixed(7)}  ref ${e.refQuote.toFixed(7)}  basis ${e.basisBps >= 0 ? "+" : ""}${e.basisBps} bps  progress ${e.progressPct}%  → ${c.y}${e.intent}${c.r} ${e.amount ? e.amount.toFixed(6) : ""}`;
  else if (e.ev === "bought") out = `${c.d}${t}${c.r} ${c.g}bought${c.r}  ${e.intent}  in ${e.quoteIn.toFixed(6)}  out ${e.baseOut.toFixed(4)}  price→ ${e.priceAfter.toFixed(7)}  ${c.d}${e.sig.slice(0, 16)}…${c.r}`;
  else if (e.ev === "complete") out = `${c.d}${t}${c.r} ${c.y}curve complete${c.r}  100%  basis ${e.basisBps >= 0 ? "+" : ""}${e.basisBps} bps`;
  else if (e.ev === "migrated") out = `${c.d}${t}${c.r} ${c.g}migrated → DAMM v2${c.r}  ${c.d}${e.sig.slice(0, 16)}…${c.r}`;
  else if (e.ev === "graduated") out = `${c.d}${t}${c.r} graduated  damm ${e.dammPool.slice(0, 10)}…  price ${e.dammPrice.toFixed(7)}  exit target ${e.exitTarget.toFixed(7)}  held ${e.heldBase.toFixed(4)}`;
  else if (e.ev === "sold") out = `${c.d}${t}${c.r} ${c.g}sold${c.r}  ${e.base.toFixed(4)} @ avg ${e.avgPrice.toFixed(7)} (target ${e.target.toFixed(7)})  still held ${e.stillHeld.toFixed(4)}  ${c.d}${e.sig.slice(0, 16)}…${c.r}`;
  else if (e.ev === "error") out = `${c.d}${t}${c.r} ${c.y}retry${c.r}  ${e.msg.slice(0, 60)}`;
  if (!out) continue;
  console.log(out);
  await sleep(e.ev === "bought" || e.ev === "migrated" || e.ev === "sold" ? 1500 : 700);
}
