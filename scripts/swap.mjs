// Jupiter swap between any two of SOL / xStocks / USDC (mainnet). Replaces swap-sol-to-quote.mjs.
// Usage: node scripts/swap.mjs --from AAPLx --to SPYx --amount 0.02      (amount in human units of --from)
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection, loadKeypair, XSTOCKS, USDC, WSOL } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const tok = (s) => s === "SOL" ? { mint: WSOL, decimals: 9, prog: TOKEN_PROGRAM_ID } : s === "USDC" ? { ...USDC, prog: TOKEN_PROGRAM_ID } : { ...XSTOCKS[s], prog: TOKEN_2022_PROGRAM_ID };
const fromS = arg("from", "SOL"), toS = arg("to", "AAPLx");
const from = tok(fromS), to = tok(toS);
if (!from?.mint || !to?.mint) throw new Error("unknown token");
const amount = Math.round(Number(arg("amount", "0.1")) * 10 ** from.decimals);
const kp = loadKeypair(), owner = kp.publicKey;

const bal = async (t) => t.mint === WSOL ? (await connection.getBalance(owner)) / 1e9
  : Number((await getAccount(connection, getAssociatedTokenAddressSync(new PublicKey(t.mint), owner, false, t.prog), "confirmed", t.prog).catch(() => ({ amount: 0n }))).amount) / 10 ** t.decimals;
console.log(`before: ${await bal(from)} ${fromS}, ${await bal(to)} ${toS}, SOL ${(await connection.getBalance(owner)) / 1e9}`);

const q = await (await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${from.mint}&outputMint=${to.mint}&amount=${amount}&slippageBps=100`)).json();
if (!q.outAmount) throw new Error("quote failed: " + JSON.stringify(q).slice(0, 200));
console.log(`quote: ${amount / 10 ** from.decimals} ${fromS} -> ${Number(q.outAmount) / 10 ** to.decimals} ${toS} (impact ${Number(q.priceImpactPct).toFixed(4)}%) via ${q.routePlan.map((r) => r.swapInfo.label).join(" > ")}`);
const sw = await (await fetch("https://lite-api.jup.ag/swap/v1/swap", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quoteResponse: q, userPublicKey: owner.toBase58(), wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true, prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 200000, priorityLevel: "medium" } } }) })).json();
if (!sw.swapTransaction) throw new Error("swap build failed: " + JSON.stringify(sw).slice(0, 300));
const tx = VersionedTransaction.deserialize(Buffer.from(sw.swapTransaction, "base64"));
tx.sign([kp]);
const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
if (conf.value.err) throw new Error("tx failed: " + JSON.stringify(conf.value.err));
console.log(`CONFIRMED https://solscan.io/tx/${sig}`);
console.log(`after:  ${await bal(from)} ${fromS}, ${await bal(to)} ${toS}, SOL ${(await connection.getBalance(owner)) / 1e9}`);
