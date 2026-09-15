// Shared constants: mints, Pyth feed ids, wallet, RPC.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export const RPC = process.env.RPC || "https://api.mainnet-beta.solana.com";
export const connection = new Connection(RPC, "confirmed");

export const KEYPAIR_PATH = process.env.KEYPAIR || `${homedir()}/.config/solana/lp-farm/keypair.json`;
export function loadKeypair() {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(KEYPAIR_PATH, "utf8"))));
}

// Quote-token candidates: xStocks (Backed) Token-2022 mints. All four carry a Meteora DBC TokenBadge
// on mainnet (verified 2026-09-15, scripts/check-badges.mjs). 8 decimals, ScaledUiAmount multiplier.
export const XSTOCKS = {
  AAPLx: { mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", decimals: 8, pythUsd: "Crypto.AAPLX/USD", pythUsdHermes: "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675", lazerId: 1792, underlying: "AAPL" },
  TSLAx: { mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", decimals: 8, pythUsd: "Crypto.TSLAX/USD", underlying: "TSLA" },
  NVDAx: { mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", decimals: 8, pythUsd: "Crypto.NVDAX/USD", underlying: "NVDA" },
  SPYx:  { mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", decimals: 8, pythUsd: "Crypto.SPYX/USD",  underlying: "SPY" },
};
export const USDC = { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
export const WSOL = "So11111111111111111111111111111111111111112";

export const PYTH_PUSH_ORACLE = new PublicKey("pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT");
export const LAZER_HTTP = "https://pyth-lazer-0.dourolabs.app/v1/latest_price";
export const HERMES_META = "https://hermes.pyth.network/v2/price_feeds"; // metadata endpoint is still public
export const PYTH_MCP = "https://mcp.pyth.network/mcp";

export function loadPythToken() {
  try {
    const env = readFileSync(`${homedir()}/.config/pyth/pyth.env`, "utf8");
    return env.match(/PYTH_ACCESS_TOKEN=(\S+)/)?.[1] || null;
  } catch { return null; }
}
