// Create a reusable partner config from out/plan.json (no pool). Registers it in configs/registry.json so the Launch page
// lists it as a default. Usage: node scripts/plan.mjs ... && node scripts/config-only.mjs --label "SOL · issuer · $10k" [--dry]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair, withPriority } from "../src/config.mjs";
import { buildEquityCurve } from "../src/curve.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry"); const plan = JSON.parse(readFileSync("out/plan.json", "utf8")); const kp = loadKeypair(), me = kp.publicKey;
const quoteMint = new PublicKey(plan.quote.mint); const badgePda = deriveTokenBadgeAddress(quoteMint); const tokenBadge = (await connection.getAccountInfo(badgePda)) ? badgePda : undefined;
const { configParams, summary } = buildEquityCurve({ refBaseUsd: plan.reference.base.price, refQuoteUsd: plan.reference.quote.price, quoteDecimals: plan.quote.decimals, unit: plan.unit, float: plan.float, discountBps: plan.discountBps, premiumBps: plan.premiumBps, weights: plan.weights, curve: plan.curve, profile: plan.profile, feeSchedule: plan.feeSchedule });
const client = DynamicBondingCurveClient.create(connection, "confirmed"); const config = Keypair.generate();
const tx = await client.partner.createConfig({ ...configParams, config: config.publicKey, feeClaimer: me, leftoverReceiver: me, payer: me, quoteMint, tokenBadge });
withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp, config);
const before = await connection.getBalance(me);
if (DRY) { const sim = await connection.simulateTransaction(tx); console.log(sim.value.err ? "SIM ERR " + JSON.stringify(sim.value.err) : `sim OK · ${sim.value.unitsConsumed} CU · threshold ${summary.migrationQuoteThreshold} ${plan.quote.symbol} (~$${summary.migrationQuoteThresholdUsd?.toFixed(0)})`); process.exit(0); }
const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 }); const c = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed"); if (c.value.err) throw new Error(JSON.stringify(c.value.err));
const rent = (before - await connection.getBalance(me)) / 1e9;
console.log(`config ${config.publicKey.toBase58()} CONFIRMED https://solscan.io/tx/${sig} · rent ${rent.toFixed(4)} SOL`);
mkdirSync("configs", { recursive: true }); const reg = existsSync("configs/registry.json") ? JSON.parse(readFileSync("configs/registry.json", "utf8")) : [];
reg.unshift({ config: config.publicKey.toBase58(), label: arg("label", `${plan.quote.symbol} · ${plan.profile} · $${Math.round(summary.migrationQuoteThresholdUsd || 0)}`), quote: plan.quote.symbol, quoteMint: plan.quote.mint, quoteDecimals: plan.quote.decimals, profile: plan.profile, curve: plan.curve, listingFeePct: summary.listingFeePct, dammFeeBps: summary.dammFeeBps, creationFeeSol: summary.creationFeeSol, thresholdQuote: summary.migrationQuoteThreshold, thresholdUsd: summary.migrationQuoteThresholdUsd, default: true, createdAt: new Date().toISOString(), tx: sig });
writeFileSync("configs/registry.json", JSON.stringify(reg, null, 2)); console.log("registered in configs/registry.json");
