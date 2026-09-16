// Re-snapshot every pool in out/pools, rebuild the console, deploy. Cron-able: `node scripts/refresh.mjs --deploy`.
import { readdirSync, existsSync, readFileSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
const deploy = process.argv.includes("--deploy");
let ok = 0, fail = 0;
for (const name of readdirSync("out/pools").sort()) {
  const dir = `out/pools/${name}`;
  if (!existsSync(`${dir}/launch.json`)) continue;
  const launch = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8"));
  try {
    execSync(`node scripts/status.mjs --pool ${launch.pool}`, { stdio: "pipe" });
    copyFileSync("out/status.json", `${dir}/status.json`); ok++;
    console.log(`✓ ${name}`);
  } catch (e) { fail++; console.log(`✗ ${name}: ${String(e.stderr || e.message).split("\n").filter((l) => /Error|error/.test(l))[0] || "failed"}`); }
}
execSync("node site/build.mjs", { stdio: "inherit" });
if (deploy) execSync("wrangler deploy", { stdio: "inherit" });
console.log(`refreshed ${ok} pools, ${fail} failed${deploy ? ", deployed" : ""}`);
