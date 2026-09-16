// DAMM v2 LP positions for a graduated pool: show unlocked / locked liquidity, and withdraw a share of the
// unlocked part (the `seed` profile's recoverability proof). Usage: node scripts/lp.mjs --pool <dbc pool> [--withdraw 0.5] [--dry]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, DAMM_V2_MIGRATION_FEE_ADDRESS, deriveDammV2PoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import { connection, loadKeypair } from "../src/config.mjs";
import { withPriority, loadPoolRecord } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const { plan, launch, dir: poolDir } = loadPoolRecord(arg("pool"));
const pool = new PublicKey(arg("pool", launch.pool));
const frac = Number(arg("withdraw", "0"));
const kp = loadKeypair(), me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");
const cpAmm = new CpAmm(connection);

const ps = await client.state.getPool(pool);
const cfg = await client.state.getPoolConfig(ps.poolState.config);
const dammPool = deriveDammV2PoolAddress(DAMM_V2_MIGRATION_FEE_ADDRESS[cfg.migrationFeeOption], ps.poolState.baseMint, cfg.quoteMint);
const st = await cpAmm.fetchPoolState(dammPool);
const positions = await cpAmm.getUserPositionByPool(dammPool, me);
const qDec = plan.quote.decimals, bDec = 9;
const aIsBase = st.tokenAMint.equals(ps.poolState.baseMint);
const [aProg, bProg] = await Promise.all([connection.getAccountInfo(st.tokenAMint).then((a) => a.owner), connection.getAccountInfo(st.tokenBMint).then((a) => a.owner)]);
console.log(`DAMM v2 pool ${dammPool.toBase58()} · ${positions.length} position(s) owned by ${me.toBase58().slice(0, 6)}… · total pool liquidity ${st.liquidity.toString()}`);
let totalUnlocked = new BN(0), totalLocked = new BN(0);
for (const p of positions) {
  const s = p.positionState;
  totalUnlocked = totalUnlocked.add(s.unlockedLiquidity); totalLocked = totalLocked.add(s.permanentLockedLiquidity).add(s.vestedLiquidity);
  console.log(`  position ${p.position.toBase58()}  unlocked ${s.unlockedLiquidity.toString()}  permanentLocked ${s.permanentLockedLiquidity.toString()}  vested ${s.vestedLiquidity.toString()}  locked=${cpAmm.isLockedPosition(s)}`);
}
const pctUnlocked = totalUnlocked.add(totalLocked).isZero() ? 0 : totalUnlocked.muln(10000).div(totalUnlocked.add(totalLocked)).toNumber() / 100;
console.log(`unlocked ${pctUnlocked}% of our LP (profile ${plan.summary.profile}: expected ${plan.summary.partnerUnlockedLpPct ?? 0}% withdrawable)`);

if (frac > 0) {
  const p = positions.find((x) => x.positionState.unlockedLiquidity.gtn(0));
  if (!p) { console.log("no unlocked liquidity to withdraw"); process.exit(1); }
  const delta = p.positionState.unlockedLiquidity.muln(Math.round(frac * 10000)).divn(10000);
  const quote = cpAmm.getWithdrawQuote({ liquidityDelta: delta, minSqrtPrice: st.sqrtMinPrice, maxSqrtPrice: st.sqrtMaxPrice, sqrtPrice: st.sqrtPrice });
  const outA = Number(quote.outAmountA.toString()) / 10 ** (aIsBase ? bDec : qDec), outB = Number(quote.outAmountB.toString()) / 10 ** (aIsBase ? qDec : bDec);
  console.log(`withdraw ${frac * 100}% of unlocked liquidity → ≈ ${outA} ${aIsBase ? launch.symbol : plan.quote.symbol} + ${outB} ${aIsBase ? plan.quote.symbol : launch.symbol}`);
  const solBefore = await connection.getBalance(me);
  const tx = await cpAmm.removeLiquidity({ owner: me, position: p.position, pool: dammPool, positionNftAccount: p.positionNftAccount, liquidityDelta: delta, tokenAAmountThreshold: new BN(0), tokenBAmountThreshold: new BN(0), tokenAMint: st.tokenAMint, tokenBMint: st.tokenBMint, tokenAVault: st.tokenAVault, tokenBVault: st.tokenBVault, tokenAProgram: aProg, tokenBProgram: bProg, vestings: [], currentPoint: new BN(Math.floor(Date.now() / 1000)) });
  withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
  if (DRY) { const sim = await connection.simulateTransaction(tx); console.log("sim", sim.value.err ? "ERR " + JSON.stringify(sim.value.err) + " " + sim.value.logs?.slice(-4).join(" | ") : "OK"); process.exit(0); }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(JSON.stringify(conf.value.err));
  console.log(`removeLiquidity: CONFIRMED https://solscan.io/tx/${sig}`);
  const after = await cpAmm.getUserPositionByPool(dammPool, me);
  const solAfter = await connection.getBalance(me);
  console.log(`after: unlocked ${after.map((x) => x.positionState.unlockedLiquidity.toString()).join("+")} · wallet SOL Δ ${((solAfter - solBefore) / 1e9).toFixed(6)} (quote side returned as SOL)`);
  const dir = poolDir || `out/pools/${arg("out", `${launch.symbol}-${plan.quote.symbol}`)}`;
  if (existsSync(`${dir}/launch.json`)) { const l = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8")); l.txs = { ...l.txs, withdrawLp: sig }; l.lp = { unlockedPct: pctUnlocked, withdrawnFrac: frac, quoteReturned: aIsBase ? outB : outA, baseReturned: aIsBase ? outA : outB, at: new Date().toISOString() }; writeFileSync(`${dir}/launch.json`, JSON.stringify(l, null, 2)); }
}
