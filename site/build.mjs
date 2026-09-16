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
copyFileSync("site/tracks.json", "site/dist/data/tracks.json");
copyFileSync("site/_headers", "site/dist/_headers");
writeFileSync("site/dist/index.html", readFileSync("site/index.html", "utf8").replace("__BUILT_AT__", new Date().toISOString()));
console.log(`site/dist built with ${pools.length} pools:`, pools.map((p) => p.name).join(", "));
