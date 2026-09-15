// Launch a pool on an EXISTING partner config (the launchpad path): no config rent, and every fee stream —
// creation fee, curve trading fees, listing fee, DAMM v2 LP — flows to the config's feeClaimer.
//
// A DBC config fixes the price ladder in quote units (start → reference → graduation). To reuse one config for
// any ticker we float the UNIT (shares per token): unit = ladderReference / (refBaseUsd / refQuoteUsd), so the
// ticker's live reference lands exactly on the ladder's reference point. Then create pool + opening buy atomically.
//
// Usage: node scripts/launch-shared.mjs --config <addr> --base PLTR [--preipo OPENAI] --symbol sPLTR --name "..." --uri ... --out sPLTR-SOL [--dry]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress, getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice, getPriceFromSqrtPrice, feeNumeratorToBps } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair, XSTOCKS, BACKPACK, USDC, SOL, WSOL, twinOf } from "../src/config.mjs";
import { resolveUsd } from "../src/prices.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const configAddr = new PublicKey(arg("config"));
const preipo = arg("preipo");
const base = preipo ? preipo.toUpperCase() : arg("base");
if (!base) throw new Error("--base or --preipo required");
const symbol = arg("symbol", `s${base}`);
const name = arg("name", `stockcurve ${base}`);
const uri = arg("uri", `https://raw.githubusercontent.com/ExpertVagabond/stockcurve/main/meta/${symbol}.json`);
const slackBps = Number(arg("slack-bps", "50"));
const kp = loadKeypair(), me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");

// ── read the ladder from chain
const cfg = await client.state.getPoolConfig(configAddr);
const quoteMint = cfg.quoteMint;
const qSym = quoteMint.toBase58() === WSOL ? "SOL" : quoteMint.toBase58() === USDC.mint ? "USDC" : (Object.entries({ ...XSTOCKS, ...BACKPACK }).find(([, v]) => v.mint === quoteMint.toBase58())?.[0] ?? quoteMint.toBase58().slice(0, 6));
const qDec = qSym === "SOL" ? 9 : qSym === "USDC" ? 6 : 8, bDec = cfg.tokenDecimal;
const pts = [cfg.sqrtStartPrice, ...cfg.curve.filter((c) => !c.liquidity.isZero()).map((c) => c.sqrtPrice)].map((sp) => Number(getPriceFromSqrtPrice(sp, bDec, qDec)));
const ladder = { start: pts[0], reference: pts[2] ?? pts[1], graduation: pts[pts.length - 1] };
const float = Number(cfg.preMigrationTokenSupply.toString()) / 10 ** bDec;
const threshold = Number(cfg.migrationQuoteThreshold.toString()) / 10 ** qDec;
console.log(`config ${configAddr.toBase58()} quote ${qSym} feeClaimer ${cfg.feeClaimer.toBase58()}${cfg.feeClaimer.equals(me) ? " (us)" : ""}`);
console.log(`ladder start ${ladder.start.toFixed(8)} → reference ${ladder.reference.toFixed(8)} → graduation ${ladder.graduation.toFixed(8)} ${qSym}/token · float ${float} · threshold ${threshold} ${qSym} · listing fee ${cfg.migrationFeePercentage}% · creation fee ${Number(cfg.poolCreationFee?.toString?.() ?? 0) / 1e9} SOL · opening fee ${feeNumeratorToBps(cfg.poolFees.baseFee.cliffFeeNumerator)} bps`);

// ── live references, then derive the unit
const refBase = preipo ? await resolvePreIpo(preipo) : await resolveUsd({ pythSymbol: `Equity.US.${base}/USD`, twinMint: twinOf(base) });
const refQuote = qSym === "USDC" ? { price: 1, source: "peg", ageSec: 0, tried: [] } : await resolveUsd({ pythSymbol: qSym === "SOL" ? "Crypto.SOL/USD" : `Crypto.${qSym.toUpperCase()}/USD`, mint: quoteMint.toBase58() });
const unit = ladder.reference / (refBase.price / refQuote.price); // shares (or PreStocks units) per token
console.log(`${base} ref $${refBase.price.toFixed(2)} [${refBase.source}] · ${qSym} $${refQuote.price.toFixed(2)} [${refQuote.source}] → unit = ${unit.toPrecision(6)} share/token so reference lands on the ladder`);

// ── opening buy sized from the on-chain ladder
const refSqrt = getSqrtPriceFromPrice(ladder.reference.toString(), bDec, qDec);
const reserveNeeded = getQuoteReserveFromNextSqrtPrice(refSqrt, cfg);
const openFeeBps = feeNumeratorToBps(cfg.poolFees.baseFee.cliffFeeNumerator);
const buyAmount = reserveNeeded.muln(10_000 + slackBps).divn(10_000 - openFeeBps);
console.log(`${DRY ? "DRY RUN" : "MAINNET"} ${symbol}/${qSym} on shared config · opening buy ${Number(buyAmount.toString()) / 10 ** qDec} ${qSym}`);

const badgePda = deriveTokenBadgeAddress(quoteMint);
const tokenBadge = (await connection.getAccountInfo(badgePda)) ? badgePda : undefined;
const baseMint = Keypair.generate();
const tx = await client.creator.createPoolWithFirstBuy({
  createPoolParam: { baseMint: baseMint.publicKey, config: configAddr, name, symbol, uri, payer: me, poolCreator: me, tokenBadge },
  firstBuyParam: { buyer: me, buyAmount, minimumAmountOut: new BN(1), referralTokenAccount: null },
});
tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp, baseMint);
const before = await connection.getBalance(me);
let sig = null;
if (DRY) { const sim = await connection.simulateTransaction(tx); if (sim.value.err) { console.error("SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-8)); process.exit(1); } console.log(`createPool+firstBuy: sim OK, ${sim.value.unitsConsumed} CU, ${tx.instructions.length} ixs`); process.exit(0); }
sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
if (conf.value.err) throw new Error("failed: " + JSON.stringify(conf.value.err));
console.log(`createPool+firstBuy (ATOMIC, shared config): CONFIRMED https://solscan.io/tx/${sig}`);

const pool = deriveDbcPoolAddress(quoteMint, baseMint.publicKey, configAddr);
const ps = await client.state.getPool(pool);
const opened = Number(getPriceFromSqrtPrice(ps.poolState.sqrtPrice, bDec, qDec));
const sigs = await connection.getSignaturesForAddress(pool, { limit: 5 });
const after = await connection.getBalance(me);
console.log(`pool ${pool.toBase58()} opened at ${opened.toFixed(8)} (${((opened / ladder.reference - 1) * 1e4).toFixed(0)} bps vs ladder reference); first tx == creation: ${sigs[sigs.length - 1]?.signature === sig}; SOL spent ${(before - after) / 1e9} (no config rent)`);

// ── write plan/launch in the shape status.mjs / keeper.mjs / the console expect
const disc = Math.round((1 - ladder.start / ladder.reference) * 1e4), prem = Math.round((ladder.graduation / ladder.reference - 1) * 1e4);
const plan = { createdAt: new Date().toISOString(), base, preipo: !!preipo, unit, float, sharedConfig: configAddr.toBase58(), quote: { symbol: qSym, mint: quoteMint.toBase58(), decimals: qDec },
  reference: { base: refBase, quote: refQuote }, checkpoints: pts,
  summary: { referencePriceQuote: ladder.reference, startPriceQuote: ladder.start, graduationPriceQuote: ladder.graduation, migrationQuoteThreshold: threshold, migrationQuoteThresholdUsd: threshold * refQuote.price, feeSchedule: `${openFeeBps}→30 bps exp (config), dynamic fee on`, unit, float, discountBps: disc, premiumBps: prem, weights: [1, 3, 4], profile: (cfg.partnerLpPercentage ?? 0) > 0 ? "seed" : cfg.migrationFeePercentage > 0 ? "issuer" : "demo", partnerUnlockedLpPct: cfg.partnerLpPercentage ?? 0, curve: disc <= 600 ? "lean" : "standard", listingFeePct: cfg.migrationFeePercentage, dammFeeBps: 20, creationFeeSol: Number(cfg.poolCreationFee?.toString?.() ?? 0) / 1e9 } };
const record = { ...plan.summary, name, symbol, uri, atomic: true, sharedConfig: true, openingBuy: Number(buyAmount.toString()) / 10 ** qDec, openedAtPrice: opened, config: configAddr.toBase58(), baseMint: baseMint.publicKey.toBase58(), pool: pool.toBase58(), quoteMint: quoteMint.toBase58(), tokenBadge: tokenBadge?.toBase58() ?? null, txs: { createPoolWithFirstBuy: sig }, launchedAt: new Date().toISOString() };
const dir = `out/pools/${arg("out", `${symbol}-${qSym}`)}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/plan.json`, JSON.stringify(plan, null, 2)); writeFileSync(`${dir}/launch.json`, JSON.stringify(record, null, 2));
writeFileSync("out/plan.json", JSON.stringify(plan, null, 2)); writeFileSync("out/launch.json", JSON.stringify(record, null, 2));
console.log(`wrote ${dir}/{plan,launch}.json`);
