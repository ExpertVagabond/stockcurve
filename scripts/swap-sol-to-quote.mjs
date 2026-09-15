// Acquire quote inventory: swap SOL -> xStock via Jupiter (lite API, no key). Mainnet.
// Usage: node scripts/swap-sol-to-quote.mjs --quote AAPLx --sol 0.2
import { VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { connection, loadKeypair, XSTOCKS, WSOL } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const quote = XSTOCKS[arg("quote", "AAPLx")];
const sol = Number(arg("sol", "0.2"));
const kp = loadKeypair();
const owner = kp.publicKey;
const amount = Math.round(sol * 1e9);

const before = await connection.getBalance(owner);
console.log(`wallet ${owner.toBase58()} SOL before: ${before / 1e9}`);

const q = await (await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${WSOL}&outputMint=${quote.mint}&amount=${amount}&slippageBps=100`)).json();
if (!q.outAmount) throw new Error("quote failed: " + JSON.stringify(q).slice(0, 200));
console.log(`quote: ${sol} SOL -> ${Number(q.outAmount) / 10 ** quote.decimals} ${arg("quote", "AAPLx")} (impact ${Number(q.priceImpactPct).toFixed(4)}%)`);

const sw = await (await fetch("https://lite-api.jup.ag/swap/v1/swap", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quoteResponse: q, userPublicKey: owner.toBase58(), wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true, prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 200000, priorityLevel: "medium" } } }),
})).json();
if (!sw.swapTransaction) throw new Error("swap build failed: " + JSON.stringify(sw).slice(0, 300));

const tx = VersionedTransaction.deserialize(Buffer.from(sw.swapTransaction, "base64"));
tx.sign([kp]);
const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
console.log("sent", sig);
const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
if (conf.value.err) throw new Error("tx failed: " + JSON.stringify(conf.value.err));

// Independent re-read of external state (not the tx result): token balance + SOL after.
const ata = getAssociatedTokenAddressSync(new (await import("@solana/web3.js")).PublicKey(quote.mint), owner, false, TOKEN_2022_PROGRAM_ID);
const acct = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
const after = await connection.getBalance(owner);
console.log(`CONFIRMED https://solscan.io/tx/${sig}`);
console.log(`quote balance now: ${Number(acct.amount) / 10 ** quote.decimals} (ata ${ata.toBase58()}); SOL after: ${after / 1e9}`);
