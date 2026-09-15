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

// xStocks (Backed) Token-2022 mints. All 20 carry a Meteora DBC TokenBadge on mainnet (verified 2026-09-15,
// scripts/scan-xstock-badges.mjs). 8 decimals, ScaledUiAmount multiplier. Usable as quote AND as a live
// reference twin for a base ticker (GME → GMEx).
export const XSTOCKS = {
  SPYx: { mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", decimals: 8, underlying: "SPY", pythUsd: "Crypto.SPYX/USD" },
  NVDAx: { mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", decimals: 8, underlying: "NVDA", pythUsd: "Crypto.NVDAX/USD" },
  QQQx: { mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", decimals: 8, underlying: "QQQ", pythUsd: "Crypto.QQQX/USD" },
  CRCLx: { mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", decimals: 8, underlying: "CRCL", pythUsd: "Crypto.CRCLX/USD" },
  TSLAx: { mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", decimals: 8, underlying: "TSLA", pythUsd: "Crypto.TSLAX/USD" },
  MSTRx: { mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", decimals: 8, underlying: "MSTR", pythUsd: "Crypto.MSTRX/USD" },
  SPCXx: { mint: "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8", decimals: 8, underlying: "SPCX", pythUsd: "Crypto.SPCXX/USD" },
  AAPLx: { mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", decimals: 8, underlying: "AAPL", pythUsd: "Crypto.AAPLX/USD" },
  MSFTx: { mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", decimals: 8, underlying: "MSFT", pythUsd: "Crypto.MSFTX/USD" },
  MCDx: { mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2", decimals: 8, underlying: "MCD", pythUsd: "Crypto.MCDX/USD" },
  GLDx: { mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re", decimals: 8, underlying: "GLD", pythUsd: "Crypto.GLDX/USD" },
  GOOGLx: { mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", decimals: 8, underlying: "GOOGL", pythUsd: "Crypto.GOOGLX/USD" },
  HOODx: { mint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg", decimals: 8, underlying: "HOOD", pythUsd: "Crypto.HOODX/USD" },
  COINx: { mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", decimals: 8, underlying: "COIN", pythUsd: "Crypto.COINX/USD" },
  METAx: { mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", decimals: 8, underlying: "META", pythUsd: "Crypto.METAX/USD" },
  STRCx: { mint: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH", decimals: 8, underlying: "STRC", pythUsd: "Crypto.STRCX/USD" },
  GMEx: { mint: "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc", decimals: 8, underlying: "GME", pythUsd: "Crypto.GMEX/USD" },
  PLTRx: { mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", decimals: 8, underlying: "PLTR", pythUsd: "Crypto.PLTRX/USD" },
  AMZNx: { mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", decimals: 8, underlying: "AMZN", pythUsd: "Crypto.AMZNX/USD" },
  KOx: { mint: "XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ", decimals: 8, underlying: "KO", pythUsd: "Crypto.KOX/USD" },
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
