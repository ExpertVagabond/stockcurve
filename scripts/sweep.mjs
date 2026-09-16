// Fee sweep across every pool on every config we own (inbound third-party launches included):
// trading fees → creation fee → listing fee (if migrated). Usage: node scripts/sweep.mjs [--dry] [--config <addr>]
import { readdirSync, existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { connection, loadKeypair, withPriority } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const kp = loadKeypair(), me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");
mkdirSync("out", { recursive: true });
const log = (ev) => { const line = JSON.stringify({ at: new Date().toISOString(), ...ev }); console.log(line); appendFileSync("out/sweep.log", line + "\n"); };

// configs we own = every config in out/pools whose feeClaimer is us (+ --config override)
const configs = new Set(arg("config") ? [arg("config")] : []);
if (!arg("config")) for (const name of existsSync("out/pools") ? readdirSync("out/pools") : []) { const f = `out/pools/${name}/launch.json`; if (existsSync(f)) configs.add(JSON.parse(readFileSync(f, "utf8")).config); }

async function send(label, tx) {
  withPriority(tx); tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
  if (DRY) { const sim = await connection.simulateTransaction(tx); return sim.value.err ? null : "dry"; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label}: ${JSON.stringify(conf.value.err)}`);
  return sig;
}

let pools = 0, inbound = 0, claimed = 0;
for (const c of configs) {
  const config = new PublicKey(c);
  const cfg = await client.state.getPoolConfig(config).catch(() => null);
  if (!cfg || !cfg.feeClaimer.equals(me)) { log({ ev: "skip", config: c, why: cfg ? "not our feeClaimer" : "no config" }); continue; }
  const fees = await client.state.getPoolsFeesByConfig(config);
  for (const f of fees) {
    pools++;
    const ps = await client.state.getPool(f.poolAddress);
    const isInbound = !ps.poolState.creator.equals(me);
    if (isInbound) inbound++;
    const row = { config: c, pool: f.poolAddress.toBase58(), creator: ps.poolState.creator.toBase58(), inbound: isInbound, migrated: !!ps.poolState.isMigrated, unclaimedQuote: f.partnerQuoteFee.toString(), unclaimedBase: f.partnerBaseFee.toString() };
    const acts = {};
    if (f.partnerQuoteFee.gtn(0) || f.partnerBaseFee.gtn(0)) {
      const tx = await client.partner.claimPartnerTradingFee({ feeClaimer: me, payer: me, pool: f.poolAddress, maxBaseAmount: f.partnerBaseFee, maxQuoteAmount: f.partnerQuoteFee });
      acts.trading = await send("trading", tx).catch((e) => "ERR " + e.message.slice(0, 80));
    }
    if (Number(cfg.poolCreationFee?.toString?.() ?? 0) > 0) {
      try { const tx = await client.partner.claimPartnerPoolCreationFee({ pool: f.poolAddress, feeReceiver: me }); acts.creation = await send("creation", tx); } catch (e) { acts.creation = /already|claimed|0x/.test(e.message) ? "already claimed" : "ERR " + e.message.slice(0, 60); }
    }
    if (ps.poolState.isMigrated && cfg.migrationFeePercentage > 0) {
      try { const tx = await client.partner.partnerWithdrawMigrationFee({ pool: f.poolAddress, sender: me }); acts.listing = await send("listing", tx); } catch (e) { acts.listing = /already|withdrawn|0x|Simulation failed/.test(e.message) ? "already withdrawn" : "ERR " + e.message.slice(0, 60); }
    }
    if (Object.values(acts).some((v) => v && !String(v).startsWith("ERR") && !String(v).startsWith("already"))) claimed++;
    log({ ev: isInbound ? "inbound-pool" : "own-pool", ...row, acts });
  }
}
log({ ev: "sweep-done", configs: configs.size, pools, inbound, poolsWithClaims: claimed, dry: DRY });
