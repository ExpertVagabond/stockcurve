// Basis keeper for stockcurve pools. Not a sniper: it only acts on the *discount* to reference.
//
//   discount zone   pool < reference·(1 − band)  → buy just enough quote to lift price to reference (capped by --budget)
//   fair zone       reference ≤ pool < graduate  → do nothing (real demand graduates the pool) — unless --graduate
//   curve complete  progress ≥ 100%              → migrate to DAMM v2
//   graduated       DAMM v2 price ≥ reference·(1 + exit) and we hold base → sell the position
//
// Usage:
//   node scripts/keeper.mjs --pool <addr> [--budget 1] [--band-bps 0] [--exit-bps 0] [--graduate] [--once] [--interval 15]
//   node scripts/keeper.mjs --watch  [same flags]   # subscribe to DBC pool creations, track pools whose config is in out/pools/
//   --dry prints intended actions without sending.
import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { ActivationType, DynamicBondingCurveClient, DYNAMIC_BONDING_CURVE_PROGRAM_ID, DAMM_V2_MIGRATION_FEE_ADDRESS, SwapMode, deriveDammV2PoolAddress, getPriceFromSqrtPrice } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { CpAmm, getPriceFromSqrtPrice as dammPrice } from "@meteora-ag/cp-amm-sdk";
import { connection, loadKeypair, XSTOCKS } from "../src/config.mjs";
import { resolveUsd } from "../src/prices.mjs";
import { resolvePreIpo } from "../src/preipo.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const DRY = has("dry");
const budget = Number(arg("budget", "1"));           // quote units the keeper may spend per pool
const bandBps = Number(arg("band-bps", "0"));        // only buy when pool < ref·(1 − band)
const exitBps = Number(arg("exit-bps", "0"));        // sell on DAMM v2 when price ≥ ref·(1 + exit)
const interval = Number(arg("interval", "15")) * 1000;

const kp = loadKeypair();
const me = kp.publicKey;
const client = DynamicBondingCurveClient.create(connection, "confirmed");
const cpAmm = new CpAmm(connection);
mkdirSync("out", { recursive: true });
const log = (ev) => { const line = JSON.stringify({ at: new Date().toISOString(), ...ev }); console.log(line); appendFileSync("out/keeper.log", line + "\n"); };

// Registry: every pool we launched, keyed by config address → { plan, launch }
const registry = new Map();
for (const name of existsSync("out/pools") ? readdirSync("out/pools") : []) {
  const dir = `out/pools/${name}`;
  if (!existsSync(`${dir}/launch.json`)) continue;
  const plan = JSON.parse(readFileSync(`${dir}/plan.json`, "utf8")), launch = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8"));
  registry.set(launch.config, { name, plan, launch });
}

async function reference(plan) {
  const base = plan.preipo ? await resolvePreIpo(plan.base) : await resolveUsd({ pythSymbol: `Equity.US.${plan.base}/USD`, twinMint: XSTOCKS[`${plan.base}x`]?.mint });
  const quote = plan.quote.symbol === "USDC" ? { price: 1, source: "peg" } : await resolveUsd({ pythSymbol: `Crypto.${plan.quote.symbol.toUpperCase()}/USD`, mint: plan.quote.mint });
  return { refQuote: (base.price * plan.unit) / quote.price, baseSource: base.source, quoteSource: quote.source };
}

const spent = new Map(); // pool → quote spent so far
const tokenProgramOf = async (mint) => (await connection.getAccountInfo(mint)).owner;
async function balance(mint) {
  const prog = await tokenProgramOf(mint);
  const ata = getAssociatedTokenAddressSync(mint, me, false, prog);
  return getAccount(connection, ata, "confirmed", prog).then((a) => a.amount).catch(() => 0n);
}

/** Smallest amountIn (raw quote) that lifts the curve price to `target`, by bisection on the SDK's offline quote. */
function amountToReach(ps, cfg, currentPoint, target, bDec, qDec, maxRaw) {
  let lo = 0n, hi = BigInt(maxRaw);
  for (let i = 0; i < 40 && hi - lo > 1n; i++) {
    const mid = (lo + hi) / 2n;
    let p;
    try {
      const q = client.pool.swapQuote2({ virtualPool: ps, config: cfg, swapBaseForQuote: false, swapMode: SwapMode.PartialFill, amountIn: new BN(mid.toString()), slippageBps: 100, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint });
      p = Number(getPriceFromSqrtPrice(q.nextSqrtPrice, bDec, qDec));
    } catch { p = Infinity; }
    if (p < target) lo = mid; else hi = mid;
  }
  return hi;
}

async function sendTx(label, tx, signers = [kp]) {
  tx.feePayer = me;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(...signers);
  if (DRY) { const sim = await connection.simulateTransaction(tx); log({ ev: "dry", label, ok: !sim.value.err, err: sim.value.err }); return null; }
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const conf = await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
  if (conf.value.err) throw new Error(`${label}: ${JSON.stringify(conf.value.err)}`);
  return sig;
}

async function tick(poolAddr, entry) {
  const pool = new PublicKey(poolAddr);
  const { plan } = entry;
  const bDec = 9, qDec = plan.quote.decimals;
  const ps = await client.state.getPool(pool);
  const cfg = await client.state.getPoolConfig(ps.poolState.config);
  const { refQuote, baseSource } = await reference(plan);
  const price = Number(getPriceFromSqrtPrice(ps.poolState.sqrtPrice, bDec, qDec));
  const progress = Number(await client.state.getPoolQuoteTokenCurveProgress(pool));
  const basisBps = (price / refQuote - 1) * 1e4;
  const state = { pool: poolAddr, name: entry.name, price, refQuote, basisBps: Math.round(basisBps), progressPct: +(progress * 100).toFixed(1), migrated: !!ps.poolState.isMigrated, refSource: baseSource };

  // ── graduated: manage the exit on DAMM v2
  if (ps.poolState.isMigrated) {
    const dammConfig = DAMM_V2_MIGRATION_FEE_ADDRESS[cfg.migrationFeeOption];
    const dammPool = deriveDammV2PoolAddress(dammConfig, ps.poolState.baseMint, cfg.quoteMint);
    const st = await cpAmm.fetchPoolState(dammPool);
    const aIsBase = st.tokenAMint.equals(ps.poolState.baseMint);
    const pA = Number(dammPrice(st.sqrtPrice, aIsBase ? bDec : qDec, aIsBase ? qDec : bDec)); // price of A in B
    const dPrice = aIsBase ? pA : 1 / pA;
    const held = await balance(ps.poolState.baseMint);
    const target = refQuote * (1 + exitBps / 1e4);
    log({ ev: "graduated", ...state, dammPool: dammPool.toBase58(), dammPrice: dPrice, exitTarget: target, heldBase: Number(held) / 10 ** bDec });
    if (held > 0n && dPrice >= target) {
      const [aProg, bProg] = await Promise.all([tokenProgramOf(st.tokenAMint), tokenProgramOf(st.tokenBMint)]);
      const slot = await connection.getSlot(), now = Math.floor(Date.now() / 1000);
      const quoteFor = (raw) => cpAmm.getQuote({ inAmount: new BN(raw.toString()), inputTokenMint: ps.poolState.baseMint, slippage: 1, poolState: st, currentTime: now, currentSlot: slot });
      // Size the sell so the average execution price (quote out / base in) stays ≥ target: bisection on the offline quote.
      let lo = 0n, hi = held;
      for (let i = 0; i < 40 && hi - lo > 1n; i++) {
        const mid = (lo + hi) / 2n;
        const avg = (Number(quoteFor(mid).swapOutAmount.toString()) / 10 ** qDec) / (Number(mid) / 10 ** bDec);
        if (avg >= target) lo = mid; else hi = mid;
      }
      const sellRaw = lo;
      if (sellRaw <= 0n) { log({ ev: "hold-exit", pool: poolAddr, why: "any sell would execute below target" }); return "done"; }
      const q = quoteFor(sellRaw);
      const tx = await cpAmm.swap({ payer: me, pool: dammPool, inputTokenMint: ps.poolState.baseMint, outputTokenMint: cfg.quoteMint, amountIn: new BN(sellRaw.toString()), minimumAmountOut: q.minSwapOutAmount, tokenAMint: st.tokenAMint, tokenBMint: st.tokenBMint, tokenAVault: st.tokenAVault, tokenBVault: st.tokenBVault, tokenAProgram: aProg, tokenBProgram: bProg, referralTokenAccount: null, poolState: st });
      const sig = await sendTx("sell-damm", tx);
      const left = Number(await balance(ps.poolState.baseMint)) / 10 ** bDec;
      log({ ev: "sold", pool: poolAddr, base: Number(sellRaw) / 10 ** bDec, quoteOut: Number(q.swapOutAmount.toString()) / 10 ** qDec, avgPrice: (Number(q.swapOutAmount.toString()) / 10 ** qDec) / (Number(sellRaw) / 10 ** bDec), target, stillHeld: left, sig });
    }
    return "done";
  }

  // ── curve complete: migrate
  if (progress >= 0.999 || ps.poolState.migrationProgress >= 1) {
    log({ ev: "complete", ...state });
    const dammConfig = DAMM_V2_MIGRATION_FEE_ADDRESS[cfg.migrationFeeOption];
    const { transaction, firstPositionNftKeypair, secondPositionNftKeypair } = await client.migration.migrateToDammV2({ payer: me, pool, dammConfig });
    const sig = await sendTx("migrate", transaction, [kp, firstPositionNftKeypair, secondPositionNftKeypair].filter(Boolean));
    log({ ev: "migrated", pool: poolAddr, sig });
    return "migrated";
  }

  // ── on the curve
  const currentPoint = cfg.activationType === ActivationType.Slot ? new BN(await connection.getSlot()) : new BN(Math.floor(Date.now() / 1000));
  const remaining = Math.max(0, budget - (spent.get(poolAddr) || 0));
  const quoteBal = Number(await balance(cfg.quoteMint)) / 10 ** qDec;
  const buyTarget = refQuote * (1 - bandBps / 1e4);
  let intent = "hold";
  let amountRaw = 0n;
  if (price < buyTarget) {
    intent = "buy-discount";
    amountRaw = amountToReach(ps, cfg, currentPoint, refQuote, bDec, qDec, Math.floor(Math.min(remaining, quoteBal) * 10 ** qDec));
  } else if (has("graduate")) {
    intent = "graduate";
    amountRaw = BigInt(Math.floor(Math.min(remaining, quoteBal) * 10 ** qDec)); // PartialFill stops exactly at threshold
  }
  log({ ev: "tick", ...state, intent, amount: Number(amountRaw) / 10 ** qDec, budgetLeft: remaining });
  if (amountRaw <= 0n) return intent;
  const q = client.pool.swapQuote2({ virtualPool: ps, config: cfg, swapBaseForQuote: false, swapMode: SwapMode.PartialFill, amountIn: new BN(amountRaw.toString()), slippageBps: 100, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint });
  const tx = await client.pool.swap2({ owner: me, pool, swapBaseForQuote: false, swapMode: SwapMode.PartialFill, amountIn: new BN(amountRaw.toString()), minimumAmountOut: q.minimumAmountOut, referralTokenAccount: null });
  const sig = await sendTx(intent, tx);
  const used = Number(q.includedFeeInputAmount?.toString?.() ?? amountRaw) / 10 ** qDec;
  spent.set(poolAddr, (spent.get(poolAddr) || 0) + used);
  const after = await client.state.getPool(pool);
  log({ ev: "bought", pool: poolAddr, intent, quoteIn: used, baseOut: Number(q.outputAmount.toString()) / 10 ** bDec, priceAfter: Number(getPriceFromSqrtPrice(after.poolState.sqrtPrice, bDec, qDec)), sig });
  return intent;
}

// ── pool discovery for --watch: find the VirtualPool account among a creation tx's accounts
async function poolFromSignature(sig) {
  const tx = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
  if (!tx) return null;
  const keys = tx.transaction.message.staticAccountKeys ?? tx.transaction.message.accountKeys;
  const infos = await connection.getMultipleAccountsInfo(keys);
  for (let i = 0; i < keys.length; i++) {
    if (!infos[i]?.owner.equals(DYNAMIC_BONDING_CURVE_PROGRAM_ID)) continue;
    try { const ps = await client.state.getPool(keys[i]); return { pool: keys[i].toBase58(), config: ps.poolState.config.toBase58() }; } catch {}
  }
  return null;
}

const tracked = new Map(); // pool → registry entry
if (arg("pool")) {
  const p = arg("pool");
  const entry = [...registry.values()].find((e) => e.launch.pool === p);
  if (!entry) throw new Error(`pool ${p} not in out/pools registry (need its plan.json for the reference)`);
  tracked.set(p, entry);
} else if (has("watch")) {
  log({ ev: "watch", program: DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58(), knownConfigs: [...registry.keys()] });
  connection.onLogs(DYNAMIC_BONDING_CURVE_PROGRAM_ID, async ({ signature, logs, err }) => {
    if (err || !logs.some((l) => /InitializeVirtualPool/i.test(l))) return;
    const found = await poolFromSignature(signature).catch(() => null);
    if (!found) return;
    const entry = registry.get(found.config);
    log({ ev: "pool-created", ...found, ours: !!entry, sig: signature });
    if (entry) tracked.set(found.pool, entry);
  }, "confirmed");
  for (const e of registry.values()) if (e.launch.pool && !(await client.state.getPool(new PublicKey(e.launch.pool))).poolState.isMigrated) tracked.set(e.launch.pool, e);
} else {
  console.log("usage: --pool <addr> | --watch   [--budget q] [--band-bps n] [--exit-bps n] [--graduate] [--once] [--dry]"); process.exit(1);
}

for (;;) {
  for (const [p, e] of tracked) {
    try { const r = await tick(p, e); if (r === "done") tracked.delete(p); }
    catch (err) { log({ ev: "error", pool: p, msg: err.message.slice(0, 200) }); }
  }
  if (has("once") || (!has("watch") && tracked.size === 0)) break;
  await new Promise((r) => setTimeout(r, interval));
}
