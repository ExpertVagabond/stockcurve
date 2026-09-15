// Buy base from the virtual pool with quote (xStock). Mainnet.
// Usage: node scripts/buy.mjs --quote-amount 0.005 [--pool <addr>] [--partial]
import { readFileSync } from "node:fs";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { ActivationType, DynamicBondingCurveClient, SwapMode, getPriceFromSqrtPrice } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const launch = JSON.parse(readFileSync("out/launch.json", "utf8"));
const plan = JSON.parse(readFileSync("out/plan.json", "utf8"));
const pool = new PublicKey(arg("pool", launch.pool));
const qDec = plan.quote.decimals, bDec = 9, qSym = plan.quote.symbol;
const amountIn = new BN(Math.round(Number(arg("quote-amount", "0.005")) * 10 ** qDec));
const mode = process.argv.includes("--partial") ? SwapMode.PartialFill : SwapMode.ExactIn;

const kp = loadKeypair();
const client = DynamicBondingCurveClient.create(connection, "confirmed");
const ps = await client.state.getPool(pool);
const cfg = await client.state.getPoolConfig(ps.poolState.config);
const currentPoint = cfg.activationType === ActivationType.Slot ? new BN(await connection.getSlot()) : new BN(Math.floor(Date.now() / 1000));

const priceBefore = Number(getPriceFromSqrtPrice(ps.poolState.sqrtPrice, bDec, qDec));
const quote = client.pool.swapQuote2({ virtualPool: ps, config: cfg, swapBaseForQuote: false, swapMode: mode, amountIn, slippageBps: 100, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint });
console.log(`price before ${priceBefore.toFixed(8)} ${qSym}/${launch.symbol}`);
console.log("quote:", JSON.stringify(quote, (k, v) => (v && v.words) ? v.toString() : v));

const tx = await client.pool.swap2({ owner: kp.publicKey, pool, swapBaseForQuote: false, swapMode: mode, amountIn, minimumAmountOut: quote.minimumAmountOut, referralTokenAccount: null });
tx.feePayer = kp.publicKey;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.sign(kp);
const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
if (conf.value.err) throw new Error("swap failed: " + JSON.stringify(conf.value.err));
console.log(`CONFIRMED https://solscan.io/tx/${sig}`);

// Independent re-read of pool state.
const after = await client.state.getPool(pool);
const priceAfter = Number(getPriceFromSqrtPrice(after.poolState.sqrtPrice, bDec, qDec));
const progress = await client.state.getPoolQuoteTokenCurveProgress(pool);
console.log(`price after ${priceAfter.toFixed(8)} (${((priceAfter / priceBefore - 1) * 100).toFixed(2)}%), quote reserve ${Number(after.poolState.quoteReserve.toString()) / 10 ** qDec}, curve progress ${(Number(progress) * 100).toFixed(1)}%, migrated=${after.poolState.isMigrated}`);
