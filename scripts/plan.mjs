// Dry run: resolve reference prices, build the equity curve, validate it, write out/plan.json.
// Usage: node scripts/plan.mjs --base GME --quote AAPLx [--unit 0.1] [--float 5] [--discount 1500] [--premium 500] [--manual-base 18.65]
import { mkdirSync, writeFileSync } from "node:fs";
import { validateConfigParameters, getPriceFromSqrtPrice } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { XSTOCKS, BACKPACK, ONDO, USDC, SOL, twinOf } from "../src/config.mjs";
import { resolveUsd } from "../src/prices.mjs";
import { buildEquityCurve, DEFAULTS } from "../src/curve.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const preipo = arg("preipo"); // e.g. --preipo OPENAI: reference = PreStocks mark price, no Pyth equity feed exists
const base = preipo ? preipo.toUpperCase() : arg("base", "GME");
const quoteSym = arg("quote", "AAPLx");
const unit = Number(arg("unit", DEFAULTS.unit));
const float = Number(arg("float", DEFAULTS.float));
const discountBps = arg("discount") ? Number(arg("discount")) : undefined;
const premiumBps = arg("premium") ? Number(arg("premium")) : undefined;
const manualBase = arg("manual-base") ? Number(arg("manual-base")) : undefined;
const profile = arg("profile", "demo");
const curve = arg("curve", "standard");

const quote = quoteSym === "USDC" ? { ...USDC, sym: "USDC" } : quoteSym === "SOL" ? { ...SOL, sym: "SOL" } : { ...(XSTOCKS[quoteSym] || BACKPACK[quoteSym] || ONDO[quoteSym]), sym: quoteSym };
if (!quote.mint) throw new Error(`unknown quote ${quoteSym}`);

const refBase = preipo ? await resolvePreIpo(preipo) : await resolveUsd({ pythSymbol: `Equity.US.${base}/USD`, twinMint: twinOf(base), manual: manualBase });
const refQuote = quoteSym === "USDC" ? { price: 1, source: "peg", feed: "USDC", ageSec: 0, tried: [] }
  : await resolveUsd({ pythSymbol: quote.pythUsd || `Crypto.${quoteSym.toUpperCase()}/USD`, mint: quote.mint });

const built = buildEquityCurve({ refBaseUsd: refBase.price, refQuoteUsd: refQuote.price, quoteDecimals: quote.decimals, unit, float, discountBps, premiumBps, profile, curve });
validateConfigParameters({ ...built.configParams, leftoverReceiver: "8nqQzTU5bqH3yjfi2ST1XvaaqWw447enCqnZkxHXTsKF" });

const cp = built.configParams;
const s = built.summary;
const fmt = (n, d = 8) => Number(n).toFixed(d);
console.log(`\n== stockcurve plan: ${base}${preipo ? " (pre-IPO)" : ""} (unit ${unit} ${preipo ? "PreStocks-token" : "share"}) / ${quote.sym} ==`);
if (refBase.context) { const c = refBase.context; if (c.prestocks) console.log(`prestocks  mark $${c.prestocks.mark.toFixed(2)}  secondary token $${c.prestocks.token.toFixed(2)} (${c.prestocks.basisBps >= 0 ? "+" : ""}${c.prestocks.basisBps.toFixed(0)} bps)  valuation $${(c.prestocks.markValuation / 1e9).toFixed(0)}B`); if (c.tessera) console.log(`tessera    ${c.tessera.symbol} mark $${c.tessera.mark.toFixed(2)}  valuation $${(c.tessera.markValuation / 1e9).toFixed(0)}B  (${c.prestocks ? (c.tessera.markValuation / c.prestocks.markValuation).toFixed(2) + "× PreStocks" : ""})`); }
console.log(`base ref   $${fmt(refBase.price, 2)}  [${refBase.source}${refBase.stale ? " STALE" : ""} age ${refBase.ageSec}s] ${refBase.tried.length ? "tried: " + refBase.tried.join(" | ") : ""}`);
console.log(`quote ref  $${fmt(refQuote.price, 2)}  [${refQuote.source} age ${refQuote.ageSec}s] ${refQuote.tried.length ? "tried: " + refQuote.tried.join(" | ") : ""}`);
console.log(`reference  ${fmt(s.referencePriceQuote)} ${quote.sym}/token  ($${fmt(s.referencePriceQuote * refQuote.price, 4)})`);
console.log(`start      ${fmt(s.startPriceQuote)}  (-${s.discountBps} bps, curve ${s.curve})`);
console.log(`graduate   ${fmt(s.graduationPriceQuote)}  (+${s.premiumBps} bps)`);
console.log(`checkpoints ${built.checkpoints.map((c) => fmt(c)).join(" → ")}  weights ${s.weights.join(":")}`);
console.log(`curve pts  ${cp.curve.length}: ${cp.curve.map((c) => fmt(getPriceFromSqrtPrice(c.sqrtPrice, 9, quote.decimals))).join(", ")}`);
console.log(`float      ${float} tokens = ${float * unit} shares (fixed supply ${Number(cp.tokenSupply.preMigrationTokenSupply.toString()) / 1e9})`);
console.log(`graduation needs ${fmt(s.migrationQuoteThreshold)} ${quote.sym} ≈ $${fmt(s.migrationQuoteThresholdUsd, 2)}`);
console.log(`fees       ${s.feeSchedule}; profile ${s.profile}: listing fee ${s.listingFeePct}% at graduation, DAMM v2 ${s.dammFeeBps} bps, creation fee ${s.creationFeeSol} SOL; partner LP ${100 - (s.partnerUnlockedLpPct || 0)}% permanently locked${s.partnerUnlockedLpPct ? `, ${s.partnerUnlockedLpPct}% withdrawable` : ""}`);

mkdirSync("out", { recursive: true });
const plan = {
  createdAt: new Date().toISOString(), base, preipo: !!preipo, unit, float, quote: { symbol: quote.sym, mint: quote.mint, decimals: quote.decimals },
  reference: { base: refBase, quote: refQuote }, summary: s, checkpoints: built.checkpoints,
  configParams: JSON.parse(JSON.stringify(cp, (k, v) => (v && v._bn !== undefined) || (v && v.words) ? v.toString() : v)),
};
writeFileSync("out/plan.json", JSON.stringify(plan, null, 2));
console.log("\nwrote out/plan.json (validateConfigParameters: OK)");
