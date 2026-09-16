// Record the live console with Playwright (headless Chrome): scroll rails, hover tiles, open two title pages.
const mod = await import("file:///Volumes/Virtual Server/configs/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright-core/index.js");
const chromium = mod.chromium || mod.default.chromium;
const b = await chromium.launch({ headless: true, channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, recordVideo: { dir: "raw", size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("https://stockcurve.purplesquirrelnetworks.workers.dev/", { waitUntil: "networkidle" });
await sleep(3500);
const scrollTo = async (y, ms = 1400) => { await page.evaluate(([y, ms]) => new Promise((res) => { const s = window.scrollY, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); window.scrollTo(0, s + (y - s) * e); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }), [y, ms]); };
await scrollTo(560); await sleep(1800);
await scrollTo(1050); await sleep(1200);
const tiles = page.locator("#railGrad .tile");
for (const i of [0, 2, 4]) { await tiles.nth(i).hover(); await sleep(900); }
await scrollTo(1500); await sleep(1500);
await scrollTo(0, 1200); await sleep(800);
await page.locator("#heroMore").click(); await sleep(2200);
await page.evaluate(() => document.querySelector("#sheet").scrollTo({ top: 420, behavior: "smooth" })); await sleep(2200);
await page.evaluate(() => document.querySelector("#sheet").scrollTo({ top: 900, behavior: "smooth" })); await sleep(2200);
await page.locator("#close").click(); await sleep(600);
await scrollTo(1050, 900); await sleep(400);
await page.locator("#railGrad .tile").filter({ hasText: "" }).nth(1).click(); await sleep(2200);
await page.evaluate(() => document.querySelector("#sheet").scrollTo({ top: 520, behavior: "smooth" })); await sleep(2500);
await page.locator("#close").click(); await sleep(1200);
const video = page.video();
await ctx.close(); await b.close();
console.log("saved", await video.path());
