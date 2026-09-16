// Graduate a completed DBC pool into DAMM v2 (if Meteora's keeper hasn't already). Mainnet.
// Usage: node scripts/migrate.mjs [--pool <addr>]
import { readFileSync, writeFileSync } from "node:fs";
import { PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient, DAMM_V2_MIGRATION_FEE_ADDRESS, deriveDammV2PoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair } from "../src/config.mjs";
import { withPriority, loadPoolRecord } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const { launch } = loadPoolRecord(arg("pool"));
const pool = new PublicKey(arg("pool", launch.pool));
const kp = loadKeypair();
const client = DynamicBondingCurveClient.create(connection, "confirmed");

const ps = await client.state.getPool(pool);
const cfg = await client.state.getPoolConfig(ps.poolState.config);
const PROGRESS = ["PreBondingCurve", "PostBondingCurve", "LockedVesting", "CreatedPool"];
console.log(`pool ${pool.toBase58()} migrationProgress=${PROGRESS[ps.poolState.migrationProgress]} isMigrated=${ps.poolState.isMigrated} feeOption=${cfg.migrationFeeOption}`);
const dammConfig = DAMM_V2_MIGRATION_FEE_ADDRESS[cfg.migrationFeeOption];
const dammPool = deriveDammV2PoolAddress(dammConfig, ps.poolState.baseMint, cfg.quoteMint);
console.log(`dammConfig ${dammConfig.toBase58()} → expected DAMM v2 pool ${dammPool.toBase58()}`);

if (ps.poolState.migrationProgress === 0) { console.log("curve not complete yet"); process.exit(1); }
if (ps.poolState.isMigrated || ps.poolState.migrationProgress === 3) {
  console.log("already migrated (keeper or prior run)");
} else {
  const { transaction, firstPositionNftKeypair, secondPositionNftKeypair } = await client.migration.migrateToDammV2({ payer: kp.publicKey, pool, dammConfig });
  withPriority(transaction); transaction.feePayer = kp.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signers = [kp, firstPositionNftKeypair, secondPositionNftKeypair].filter(Boolean);
  transaction.sign(...signers);
  const sim = await connection.simulateTransaction(transaction);
  if (sim.value.err) { console.error("SIM ERR", JSON.stringify(sim.value.err), sim.value.logs?.slice(-10)); process.exit(1); }
  const sig = await connection.sendRawTransaction(transaction.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error("migrate failed: " + JSON.stringify(conf.value.err));
  console.log(`migrateToDammV2: CONFIRMED https://solscan.io/tx/${sig}`);
  launch.txs.migrateToDammV2 = sig;
}
// Independent re-read: DAMM v2 pool account must exist.
const ai = await connection.getAccountInfo(dammPool);
const after = await client.state.getPool(pool);
console.log(`DAMM v2 pool ${dammPool.toBase58()} exists=${!!ai} (${ai?.data.length ?? 0} bytes, owner ${ai?.owner.toBase58()}); DBC migrationProgress=${PROGRESS[after.poolState.migrationProgress]} isMigrated=${after.poolState.isMigrated}`);
launch.dammV2Pool = dammPool.toBase58();
launch.dammConfig = dammConfig.toBase58();
writeFileSync("out/launch.json", JSON.stringify(launch, null, 2));
