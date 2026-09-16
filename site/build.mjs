// Build the static issuer console: every pool under out/pools/<name>/{plan,launch,status}.json → site/dist/
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync } from "node:fs";
mkdirSync("site/dist/data", { recursive: true });
mkdirSync("site/dist/posters", { recursive: true });
mkdirSync("site/dist/meta", { recursive: true });
for (const f of readdirSync("meta")) if (f.endsWith(".json") || (f.endsWith(".png") && !f.includes("-poster") && !f.includes("-billboard"))) copyFileSync(`meta/${f}`, `site/dist/meta/${f}`);
for (const f of readdirSync("meta")) if (f.endsWith("-poster.png") || f.endsWith("-billboard.png")) copyFileSync(`meta/${f}`, `site/dist/posters/${f}`);
const pools = [];
for (const name of readdirSync("out/pools").sort()) {
  const dir = `out/pools/${name}`;
  if (!existsSync(`${dir}/status.json`)) continue;
  const plan = JSON.parse(readFileSync(`${dir}/plan.json`, "utf8"));
  const launch = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8"));
  const status = JSON.parse(readFileSync(`${dir}/status.json`, "utf8"));
  pools.push({ name, status, launch, plan: { base: plan.base, unit: plan.unit, float: plan.float, quote: plan.quote, summary: plan.summary, checkpoints: plan.checkpoints, reference: plan.reference } });
}
writeFileSync("site/dist/data/pools.json", JSON.stringify(pools, null, 2));
// Launch page data: the partner configs a user can launch on (deduped), and the ticker → mint maps for references.
const configs = {};
for (const p of pools) { const l = p.launch; if (!l.config || !l.quoteMint) continue; if (!configs[l.config]) configs[l.config] = { config: l.config, quote: p.plan.quote.symbol, quoteMint: l.quoteMint, quoteDecimals: p.plan.quote.decimals, profile: l.profile || "demo", listingFeePct: l.listingFeePct || 0, dammFeeBps: l.dammFeeBps, creationFeeSol: l.creationFeeSol || 0, curve: p.plan.summary?.curve, example: p.name }; }
// real-size partner configs from configs/registry.json come first and are flagged default
const registry = existsSync("configs/registry.json") ? JSON.parse(readFileSync("configs/registry.json", "utf8")) : [];
const merged = [...registry.map((r) => ({ ...r, example: null })), ...Object.values(configs).filter((c) => !registry.some((r) => r.config === c.config)).map((c) => ({ ...c, label: `${c.quote} · ${c.profile} profile · ${c.curve || "standard"} curve · demo-scale (${c.example})`, default: false }))];
writeFileSync("site/dist/data/configs.json", JSON.stringify(merged, null, 2));
const cfgmod = await import("../src/config.mjs");
const tickers = {}; for (const [k, v] of Object.entries(cfgmod.XSTOCKS)) tickers[k] = { mint: typeof v === "string" ? v : v.mint, issuer: "xstocks", underlying: k.replace(/x$/, "") };
for (const [k, v] of Object.entries(cfgmod.BACKPACK)) tickers[k] = { mint: v.mint, issuer: "backpack", underlying: v.underlying || k, decimals: v.decimals };
for (const [k, v] of Object.entries(cfgmod.ONDO)) tickers[k] = { mint: v.mint, issuer: "ondo", underlying: (v.underlying || k).replace(/on$/i, "") };
writeFileSync("site/dist/data/tickers.json", JSON.stringify(tickers));
mkdirSync("site/dist/launch", { recursive: true }); copyFileSync("site/launch/sc.bundle.js", "site/dist/launch/sc.bundle.js"); copyFileSync("site/launch/index.html", "site/dist/launch/index.html");
copyFileSync("site/tracks.json", "site/dist/data/tracks.json");
if (existsSync("out/agents.json")) copyFileSync("out/agents.json", "site/dist/data/agents.json");
copyFileSync("site/_headers", "site/dist/_headers");
writeFileSync("site/dist/index.html", readFileSync("site/index.html", "utf8").replace("__BUILT_AT__", new Date().toISOString()));
console.log(`site/dist built with ${pools.length} pools:`, pools.map((p) => p.name).join(", "));
