// Sell our entire base balance back into a DBC pool (base → quote), or --buy <quoteAmount> to buy base with quote. Any pool, no local record needed.
// Usage: node scripts/dbc-sell.mjs --pool <addr> [--pct 100] [--buy 0.03] [--dry]
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { DynamicBondingCurveClient, SwapMode } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair, withPriority } from "../src/config.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry"); const kp = loadKeypair(), me = kp.publicKey; const pool = new PublicKey(arg("pool"));
const client = DynamicBondingCurveClient.create(connection, "confirmed"); const ps = await client.state.getPool(pool); const cfg = await client.state.getPoolConfig(ps.poolState.config);
const buy = arg("buy") ? Number(arg("buy")) : null; const qInfo = await connection.getParsedAccountInfo(cfg.quoteMint); const qDec = qInfo.value.data.parsed.info.decimals;
const baseMint = ps.poolState.baseMint; const prog = (await connection.getAccountInfo(baseMint)).owner; const ata = getAssociatedTokenAddressSync(baseMint, me, false, prog);
let amountIn; if (buy) amountIn = new BN(Math.round(buy * 10 ** qDec)); else { const bal = (await getAccount(connection, ata, "confirmed", prog)).amount; amountIn = new BN((bal * BigInt(Math.round(Number(arg("pct", "100")) * 100)) / 10000n).toString()); }
if (amountIn.isZero()) throw new Error("nothing to swap"); const swapBaseForQuote = !buy;
const currentPoint = new BN(Math.floor(Date.now() / 1000));
const q = client.pool.swapQuote2({ virtualPool: ps, config: cfg, swapBaseForQuote, swapMode: SwapMode.ExactIn, amountIn, slippageBps: 300, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint });
const out = Number(q.outputAmount?.toString?.() ?? q.amountOut?.toString?.() ?? 0);
console.log(buy ? `buy with ${buy} quote → ≈ ${(out / 10 ** cfg.tokenDecimal).toFixed(6)} base` : `sell ${Number(amountIn.toString()) / 10 ** cfg.tokenDecimal} base → ≈ ${(out / 10 ** qDec).toFixed(6)} quote`);
const tx = await client.pool.swap2({ owner: me, pool, swapBaseForQuote, swapMode: SwapMode.ExactIn, amountIn, minimumAmountOut: q.minimumAmountOut, referralTokenAccount: null });
withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
if (DRY) { const sim = await connection.simulateTransaction(tx); console.log(sim.value.err ? "SIM ERR " + JSON.stringify(sim.value.err) + " " + (sim.value.logs || []).slice(-4).join(" | ") : "sim OK"); process.exit(0); }
const before = await connection.getBalance(me);
const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 0 }); const t0 = Date.now(); let done = null;
while (Date.now() - t0 < 60000 && !done) { await new Promise((r) => setTimeout(r, 2000)); const s = (await connection.getSignatureStatuses([sig])).value[0]; if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) done = s; else connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 0 }).catch(() => {}); }
console.log(done ? (done.err ? "FAILED " + JSON.stringify(done.err) : `CONFIRMED https://solscan.io/tx/${sig}`) : "not confirmed: " + sig);
console.log(`SOL Δ ${((await connection.getBalance(me)) - before) / 1e9}`);
