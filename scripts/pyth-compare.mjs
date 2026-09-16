// Pyth "use one feed, compare both": Equity.US.<T>/USD vs Crypto.<T>X/USD (xStock) vs Crypto.<T>ON/USD (Ondo) for a ticker.
// Each feed: Pyth Pro (Lazer) if the key is entitled, else the Pyth push-oracle account on Solana (with age). Then the
// live on-chain twin prices for the same instruments, so the equity/xStock/Ondo basis is visible from Pyth's own data.
// Usage: node scripts/pyth-compare.mjs AAPL [TSLA ...]
import { pythLazer, pythOnChain, jupiterPrice, resolveHermesFeed } from "../src/prices.mjs";
import { twinsOf } from "../src/config.mjs";

const tickers = process.argv.slice(2).length ? process.argv.slice(2) : ["AAPL"];
const age = (s) => s < 120 ? `${s}s` : s < 7200 ? `${Math.round(s / 60)}m` : s < 172800 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`;
for (const t of tickers) {
  console.log(`\n== ${t}: Pyth feeds ==`);
  const rows = [];
  for (const sym of [`Equity.US.${t}/USD`, `Crypto.${t}X/USD`, `Crypto.${t}ON/USD`, `Equity.Index.${t}/USD`, `Crypto.${t}X/${t}.RR`]) {
    const meta = await resolveHermesFeed(sym).catch(() => null);
    if (!meta) { rows.push({ sym, status: "no such feed" }); continue; }
    const l = await pythLazer(sym).catch(() => ({ ok: false, why: "err" }));
    if (l.ok) { rows.push({ sym, status: "Pyth Pro live", price: l.price, ageSec: l.ageSec }); continue; }
    const o = await pythOnChain(sym).catch(() => ({ ok: false }));
    rows.push(o.ok ? { sym, status: "push account", price: o.price, ageSec: o.ageSec, conf: o.conf } : { sym, status: `not entitled (${l.why?.slice(0, 40)}), no push account` });
  }
  for (const r of rows) console.log(`  ${r.sym.padEnd(26)} ${r.status.padEnd(44)} ${r.price ? "$" + r.price.toFixed(2).padStart(9) : "".padStart(10)} ${r.ageSec != null ? "age " + age(r.ageSec) : ""}${r.conf ? " ±" + r.conf.toFixed(2) : ""}`);
  const eq = rows.find((r) => r.sym.startsWith("Equity.US") && r.price), xs = rows.find((r) => r.sym.includes("X/USD") && r.price), on = rows.find((r) => r.sym.includes("ON/USD") && r.price);
  if (eq && xs) console.log(`  xStock vs equity (Pyth): ${((xs.price / eq.price - 1) * 1e4).toFixed(0)} bps`);
  if (eq && on) console.log(`  Ondo vs equity (Pyth):   ${((on.price / eq.price - 1) * 1e4).toFixed(0)} bps`);
  console.log(`  live twins (Jupiter):`);
  for (const tw of twinsOf(t)) { const j = await jupiterPrice(tw.mint).catch(() => ({ ok: false })); if (j.ok) console.log(`    ${tw.issuer.padEnd(9)} ${tw.symbol.padEnd(8)} $${j.price.toFixed(2)}  liq $${Math.round(j.liquidityUsd || 0).toLocaleString()}${eq ? `  vs Pyth equity ${((j.price / eq.price - 1) * 1e4).toFixed(0)} bps` : ""}`); }
}
