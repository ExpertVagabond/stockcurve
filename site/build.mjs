// Build the static issuer console from out/status.json + out/launch.json + out/plan.json → site/dist/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
const status = JSON.parse(readFileSync("out/status.json", "utf8"));
const launch = JSON.parse(readFileSync("out/launch.json", "utf8"));
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
mkdirSync("site/dist/data", { recursive: true });
copyFileSync("out/status.json", "site/dist/data/status.json");
copyFileSync("out/launch.json", "site/dist/data/launch.json");
writeFileSync("site/dist/data/plan.json", JSON.stringify({ base: plan.base, unit: plan.unit, float: plan.float, quote: plan.quote, summary: plan.summary, checkpoints: plan.checkpoints, reference: plan.reference }, null, 2));
let html = readFileSync("site/index.html", "utf8").replace("__BUILT_AT__", new Date().toISOString());
writeFileSync("site/dist/index.html", html);
console.log("site/dist built", new Date().toISOString());
