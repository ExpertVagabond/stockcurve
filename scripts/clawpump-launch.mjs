// Launch a stock-paired token through Clawpump's partner API (self-funded: our wallet pays the creation fee).
// Flow: POST /launch/self-funded {preflight:true} → pay exact lamports to payTo → POST again with txSignature+preflightToken.
// Usage: node scripts/clawpump-launch.mjs --pair SNDK --symbol sSNDK-CP --name "..." --image https://... [--dry]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { connection, loadKeypair, withPriority } from "../src/config.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const key = readFileSync(`${homedir()}/.config/clawpump/clawpump.env`, "utf8").match(/CLAWPUMP_API_KEY=(\S+)/)[1];
const H = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const api = (path, opts = {}) => fetch(`https://clawpump.tech/api/v1${path}`, { headers: H, ...opts }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

const kp = loadKeypair(), me = kp.publicKey;
const pairSym = arg("pair", "SNDK");
const pairs = (await api("/pump-pairs")).body.assets;
const pair = pairs.find((a) => a.symbol === pairSym);
if (!pair) throw new Error(`pair ${pairSym} not in Clawpump catalogue`);
const body = {
  name: arg("name", `stockcurve ${pairSym} pair`), symbol: arg("symbol", `sc${pairSym}`),
  description: arg("description", `stockcurve launch paired with ${pair.name} (${pairSym}) on Clawpump — a Meteora stock-paired pool for the Stocklana hackathon; issuer-side keeper and console at stockcurve.purplesquirrelnetworks.workers.dev`),
  imageUrl: arg("image", "https://stockcurve.purplesquirrelnetworks.workers.dev/meta/sSNDK.png"),
  agentId: arg("agent-id", "stockcurve-keeper"), agentName: arg("agent-name", "stockcurve keeper"),
  walletAddress: me.toBase58(), pumpQuoteMint: pair.mint, pumpCreatorFeeBps: Number(arg("creator-fee-bps", "100")),
};
console.log(`pair ${pairSym} ${pair.mint} · symbol ${body.symbol} · creator fee ${body.pumpCreatorFeeBps} bps · earnings → ${me.toBase58()}`);

const pre = await api("/launch/self-funded", { method: "POST", body: JSON.stringify({ ...body, preflight: true }) });
console.log("preflight", pre.status, JSON.stringify(pre.body).slice(0, 500));
const amountLamports = pre.body.payment?.amountLamports ?? pre.body.amountLamports, payTo = pre.body.payment?.payTo ?? pre.body.payTo, preflightToken = pre.body.retryWith?.preflightToken ?? pre.body.preflightToken;
if (pre.status !== 200 || !preflightToken) process.exit(1);
console.log(`pay ${amountLamports / 1e9} SOL → ${payTo}`);
if (DRY) { console.log("dry run: not paying"); process.exit(0); }

const tx = withPriority(new Transaction().add(SystemProgram.transfer({ fromPubkey: me, toPubkey: new PublicKey(payTo), lamports: Number(amountLamports) })));
tx.feePayer = me; tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash; tx.sign(kp);
const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
console.log(`paid: https://solscan.io/tx/${sig}`);

const res = await api("/launch/self-funded", { method: "POST", body: JSON.stringify({ ...body, txSignature: sig, preflightToken }) });
console.log("launch", res.status, JSON.stringify(res.body, null, 2).slice(0, 2000));
mkdirSync("out/clawpump", { recursive: true });
writeFileSync(`out/clawpump/${body.symbol}.json`, JSON.stringify({ request: body, preflight: pre.body, paymentTx: sig, response: res.body, at: new Date().toISOString() }, null, 2));
