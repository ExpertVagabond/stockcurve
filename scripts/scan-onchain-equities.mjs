// For a list of tickers: resolve Hermes feed id (public metadata endpoint), then check the Solana push-oracle account + age.
import { Connection, PublicKey } from "@solana/web3.js";
const c = new Connection(process.env.RPC || "https://api.mainnet-beta.solana.com", "confirmed");
const PUSH = new PublicKey("pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT");
const tickers = process.argv.slice(2);
for (const t of tickers) {
  const feeds = await (await fetch(`https://hermes.pyth.network/v2/price_feeds?query=${t}`)).json();
  const f = feeds.find(x => x.attributes.symbol === `Equity.US.${t}/USD`);
  if (!f) { console.log(t.padEnd(6), "no Equity.US feed"); continue; }
  const sh = Buffer.alloc(2);
  const [pda] = PublicKey.findProgramAddressSync([sh, Buffer.from(f.id, "hex")], PUSH);
  const ai = await c.getAccountInfo(pda);
  if (!ai) { console.log(t.padEnd(6), f.id.slice(0, 8), "no on-chain acct"); continue; }
  const d = ai.data; let o = 40; const vl = d[o]; o += vl === 0 ? 2 : 1; o += 32;
  const price = Number(d.readBigInt64LE(o)); o += 16; const expo = d.readInt32LE(o); o += 4; const pub = Number(d.readBigInt64LE(o));
  console.log(t.padEnd(6), f.id.slice(0, 8), "$" + (price * 10 ** expo).toFixed(2), "age", ((Date.now() / 1000 - pub) / 86400).toFixed(1) + "d", pda.toBase58());
}
