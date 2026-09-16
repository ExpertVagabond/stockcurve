// Create a Meteora DLMM pair for ANY two mints and open a two-sided position around a price.
// Used to give a Clawpump-launched token a stock-paired Meteora pool (scSNDK / SNDK).
// Usage: node scripts/meteora-pair.mjs --x <mint>:<dec> --y <mint>:<dec> --x-amt 200000 --y-amt 0.0004 [--price <Y per X>] [--width-bps 500] [--bin-step 25] [--fee-bps 100] [--dry]
import { writeFileSync, mkdirSync } from "node:fs";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createRequire } from "node:module";
const DLMM = createRequire(import.meta.url)("@meteora-ag/dlmm"); const { StrategyType, ActivationType } = DLMM;
import { connection, loadKeypair, withPriority } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const [xm, xd] = arg("x").split(":"), [ym, yd] = arg("y").split(":");
const X = new PublicKey(xm), Y = new PublicKey(ym), xDec = Number(xd), yDec = Number(yd);
const binStep = Number(arg("bin-step", "25")), feeBps = Number(arg("fee-bps", "100")), widthBps = Number(arg("width-bps", "500"));
const xAmt = Number(arg("x-amt", "0")), yAmt = Number(arg("y-amt", "0"));
const kp = loadKeypair(), me = kp.publicKey;

let price = arg("price") ? Number(arg("price")) : null;
if (!price) { // Y per X from a Jupiter quote of 1 X
  const q = await (await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${xm}&outputMint=${ym}&amount=${10 ** xDec}&slippageBps=300&onlyDirectRoutes=true`)).json();
  if (!q.outAmount) throw new Error("no Jupiter quote; pass --price"); price = Number(q.outAmount) / 10 ** yDec;
}
const activeId = DLMM.getBinIdFromPrice(Number(DLMM.getPricePerLamport(xDec, yDec, price)), binStep, false);
const half = Math.max(1, Math.round(widthBps / binStep));
console.log(`price ${price.toExponential(4)} Y/X → activeId ${activeId} · ±${widthBps} bps = ±${half} bins · fee ${feeBps} bps`);

async function send(label, tx, signers = [kp]) {
  withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(...signers);
  if (DRY) { const sim = await connection.simulateTransaction(tx); if (sim.value.err) { console.error(label, "SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-6)); process.exit(1); } console.log(`${label}: sim OK`); return null; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label}: ${JSON.stringify(conf.value.err)}`);
  console.log(`${label}: CONFIRMED https://solscan.io/tx/${sig}`); return sig;
}

let pair = await DLMM.getCustomizablePermissionlessLbPairIfExists(connection, X, Y), createSig = null;
if (!pair) {
  createSig = await send("create DLMM pair", await DLMM.createCustomizablePermissionlessLbPair2(connection, new BN(binStep), X, Y, new BN(activeId), new BN(feeBps), ActivationType.Timestamp, false, me));
  if (DRY) process.exit(0);
  pair = await DLMM.getCustomizablePermissionlessLbPairIfExists(connection, X, Y);
}
console.log(`DLMM pair ${pair.toBase58()}`);
const dlmm = await DLMM.create(connection, pair);
const active = await dlmm.getActiveBin();
console.log(`active bin ${active.binId} price ${Number(active.price).toExponential(4)}`);
if (xAmt > 0 || yAmt > 0) {
  const position = Keypair.generate();
  const tx = await dlmm.initializePositionAndAddLiquidityByStrategy({ positionPubKey: position.publicKey, user: me, totalXAmount: new BN(Math.round(xAmt * 10 ** xDec)), totalYAmount: new BN(Math.round(yAmt * 10 ** yDec)), strategy: { minBinId: active.binId - half, maxBinId: active.binId + half, strategyType: StrategyType.Curve }, slippage: 1 });
  const sigs = []; for (const [i, t] of (Array.isArray(tx) ? tx : [tx]).entries()) sigs.push(await send(`add liquidity ${i + 1}`, t, [kp, position]));
  if (!DRY) {
    const { userPositions } = await dlmm.getPositionsByUserAndLbPair(me);
    const p = userPositions.find((u) => u.publicKey.equals(position.publicKey));
    console.log(`position ${position.publicKey.toBase58()} · bins ${active.binId - half}..${active.binId + half} · X ${Number(p?.positionData.totalXAmount || 0) / 10 ** xDec} · Y ${Number(p?.positionData.totalYAmount || 0) / 10 ** yDec}`);
    mkdirSync("out/pairs", { recursive: true });
    writeFileSync(`out/pairs/${pair.toBase58()}.json`, JSON.stringify({ pair: pair.toBase58(), x: xm, y: ym, activeId: active.binId, binStep, feeBps, widthBps, position: position.publicKey.toBase58(), xAmt, yAmt, price, txs: { create: createSig, addLiquidity: sigs.at(-1) }, at: new Date().toISOString() }, null, 2));
  }
}
