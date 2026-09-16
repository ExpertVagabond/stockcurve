// Remove all liquidity from one of our DLMM positions, claim fees, and close it (rent back).
// Usage: node scripts/dlmm-close.mjs --pair <pair> [--position <pos>] [--dry]
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { createRequire } from "node:module";
const DLMM = createRequire(import.meta.url)("@meteora-ag/dlmm");
import { connection, loadKeypair, withPriority } from "../src/config.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry"); const kp = loadKeypair(), me = kp.publicKey;
const dlmm = await DLMM.create(connection, new PublicKey(arg("pair")));
const { userPositions } = await dlmm.getPositionsByUserAndLbPair(me);
const pos = arg("position") ? userPositions.find((p) => p.publicKey.toBase58() === arg("position")) : userPositions[0];
if (!pos) throw new Error("no position found for our wallet on that pair");
const d = pos.positionData; console.log(`position ${pos.publicKey.toBase58()} bins ${d.lowerBinId}..${d.upperBinId} · X ${d.totalXAmount} · Y ${d.totalYAmount} · fees X ${d.feeX} Y ${d.feeY}`);
const txs = await dlmm.removeLiquidity({ position: pos.publicKey, user: me, fromBinId: d.lowerBinId, toBinId: d.upperBinId, bps: new BN(10000), shouldClaimAndClose: true });
const before = await connection.getBalance(me);
for (const [i, tx] of (Array.isArray(txs) ? txs : [txs]).entries()) {
  withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
  if (DRY) { const sim = await connection.simulateTransaction(tx); console.log(`tx ${i + 1}: ${sim.value.err ? "SIM ERR " + JSON.stringify(sim.value.err) : "sim OK"}`); continue; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 }); const c = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  console.log(`tx ${i + 1}: ${c.value.err ? "FAILED " + JSON.stringify(c.value.err) : "CONFIRMED"} https://solscan.io/tx/${sig}`);
}
if (!DRY) console.log(`SOL Δ ${((await connection.getBalance(me)) - before) / 1e9}`);
