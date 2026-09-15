// Checks whether Pyth push-oracle PriceUpdateV2 accounts exist on Solana mainnet for the AAPL feeds
// (sponsored feeds are pushed on-chain and readable without a Pyth Pro key).
import { Connection, PublicKey } from "@solana/web3.js";
const c = new Connection(process.env.RPC || "https://api.mainnet-beta.solana.com", "confirmed");
const PUSH = new PublicKey("pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT");
const feeds = {
  "Equity.US.AAPL/USD":    "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  "Crypto.AAPLX/USD":      "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675",
  "Equity.Index.AAPL/USD": "aaba35e6f33fb973bb2201d48a79ae24795affa6ba8bd50a93dcaf7da0030f36",
  "Crypto.SOL/USD":        "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
};
for (const [name, id] of Object.entries(feeds)) {
  for (const shard of [0, 1]) {
    const sh = Buffer.alloc(2); sh.writeUInt16LE(shard);
    const [pda] = PublicKey.findProgramAddressSync([sh, Buffer.from(id, "hex")], PUSH);
    const ai = await c.getAccountInfo(pda);
    if (!ai) { if (shard === 1) console.log(name.padEnd(22), "❌ no on-chain account (shard 0/1)"); continue; }
    // PriceUpdateV2 layout: 8 disc + 32 write_authority + 1 verification_level(+ u8 if partial) ... parse loosely
    const d = ai.data; let o = 8 + 32; const vl = d[o]; o += vl === 0 ? 2 : 1; // Partial{num_signatures} vs Full
    const feedId = d.subarray(o, o + 32).toString("hex"); o += 32;
    const price = d.readBigInt64LE(o); o += 8; const conf = d.readBigUInt64LE(o); o += 8;
    const expo = d.readInt32LE(o); o += 4; const pub = Number(d.readBigInt64LE(o));
    console.log(name.padEnd(22), `shard${shard} ✅`, pda.toBase58(), "price", Number(price) * 10 ** expo, "age", Math.floor(Date.now()/1000) - pub, "s", feedId === id ? "" : "(FEED MISMATCH)");
    break;
  }
}
