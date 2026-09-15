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
// Backpack Securities tokenized stocks on Solana that are both Meteora-badged (DBC quote OK) and priced on Jupiter.
// Generated from scripts/scan-backpack.mjs (2026-09-15). Usable as quote and as a live reference twin (DKNG → Backpack DKNG).
export const BACKPACK = {
  SKHY: { mint: "SKHYhSjuRWHgikq8eRKbtBbpABgJSkd7ytQV14i9EQ3", decimals: 6, underlying: "SKHY", issuer: "backpack" },
  MU: { mint: "MUxEsUKSMACyw5fZf68wxf5FLnZVhtU9CwH8uNNGay1", decimals: 6, underlying: "MU", issuer: "backpack" },
  SPCX: { mint: "SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb", decimals: 6, underlying: "SPCX", issuer: "backpack" },
  DKNG: { mint: "DKNGQFNGQmoBdXSRGKJ8tTu7uPDasw5JDcfMmWniNfow", decimals: 6, underlying: "DKNG", issuer: "backpack" },
  SNDK: { mint: "SNDKbwMUQvZhnLnxLduradgLHG5KrPuKwpnrkkGRhfH", decimals: 6, underlying: "SNDK", issuer: "backpack" },
  BROS: { mint: "BRVaZKg6J9iF2BEsdpsxJ9NyvN9PPxPZuoQUX2v8qqkk", decimals: 6, underlying: "BROS", issuer: "backpack" },
  DJT: { mint: "DJTu7vi8norVzdVAffgvb39VP7wjKeTsgaMBJrzfxvoF", decimals: 6, underlying: "DJT", issuer: "backpack" },
  GRND: { mint: "GRNDYDpqwpCm6jVxpbh4xT5AM4r3p391qYsKTHqgaET2", decimals: 6, underlying: "GRND", issuer: "backpack" },
  MRNA: { mint: "MRNAzXzhNcaEXJPibHEn8cd4vyekCDiivTyEwswLUCT", decimals: 6, underlying: "MRNA", issuer: "backpack" },
  RDDT: { mint: "RDDTGbhHwVXfyCvQMXzzowKjf5qrYBZAnehoXW83ooh", decimals: 6, underlying: "RDDT", issuer: "backpack" },
  TTWO: { mint: "TTWofwAge91oFhZs7kpQdyrVRkmevgM88xijGvQFbKo", decimals: 6, underlying: "TTWO", issuer: "backpack" },
  NKE: { mint: "NKEda5nHhNGgjrE9nDdMvaEmkmJ96qqxzBVZEcKmjSg", decimals: 6, underlying: "NKE", issuer: "backpack" },
  MSTR: { mint: "MSTRdWXMeZxdE8osAQy3fA4rvTY5rgummDSMEx6U7Nz", decimals: 6, underlying: "MSTR", issuer: "backpack" },
  DRAM: { mint: "DRAMjSWR7HRfJKjRkvQWYL2bcaejaVhuxEcjf4pAY4Cw", decimals: 6, underlying: "DRAM", issuer: "backpack" },
  HOOD: { mint: "HooDYv5RewLRiMLnEVq3VJqdqxhuE6c5eYvqejMC3e9A", decimals: 6, underlying: "HOOD", issuer: "backpack" },
  RBLX: { mint: "RBLXDGRD64AtRamHMFVcjqne3Ar7NLWtFtYNtsrf1cE", decimals: 6, underlying: "RBLX", issuer: "backpack" },
  PTN: { mint: "PTNzAfFAB4LvoUQEUUGrFMyUoRLExMYjH6CcfyQfsVP", decimals: 6, underlying: "PTN", issuer: "backpack" },
  BOT: { mint: "BoTx8y9ynfdxf5ZjWtCoBVkff52qKA82ysaLU8ZM6d8T", decimals: 6, underlying: "BOT", issuer: "backpack" },
  SCHH: { mint: "SCHHJ3jRdSjeFEVAaLrnYdx3Brphn92Ys7z1qkiCtPX", decimals: 6, underlying: "SCHH", issuer: "backpack" },
  AMC: { mint: "AMC1qwR9KhiyrQBRPrxnfo4JfMeMZqEBvt5tgTytNNoc", decimals: 6, underlying: "AMC", issuer: "backpack" },
  WEN: { mint: "WENAZ2WyPbmgvUcKfQ8hyMDfBQP9bZ65hsZ5KTFrRGZ", decimals: 6, underlying: "WEN", issuer: "backpack" },
  COST: { mint: "CZEB3WNZuF2Yz1z2H81RcCk8T7fsw82KB33zqamASVsg", decimals: 6, underlying: "COST", issuer: "backpack" },
  BA: { mint: "BArimz1PcKZr8PcPh3tcZ2dg4S7FJLk3cw6R5F8GsHKg", decimals: 6, underlying: "BA", issuer: "backpack" },
  FLWS: { mint: "FLWSojG1gB5VStYR3Sb4nQFRt43UBYkqih1j2CpVLqgd", decimals: 6, underlying: "FLWS", issuer: "backpack" },
  INTC: { mint: "iNTCy1qTsUEZQe3DSocLz1ZXXai34Gdw8THQh5rxFaF", decimals: 6, underlying: "INTC", issuer: "backpack" },
  SNAP: { mint: "SNAPcESrvnH8yUdgeMF6xm1hym9b6hW6s8YeqeHdZFz", decimals: 6, underlying: "SNAP", issuer: "backpack" },
  SPHR: { mint: "SPHRp8cZaSQBTp1KMNP4V1X821SXhXWt4Q2yLdyHzju", decimals: 6, underlying: "SPHR", issuer: "backpack" },
  LLY: { mint: "LLYuwZ33keFihgwoxXsBawy31AiRFLFSva32TYq5TvD", decimals: 6, underlying: "LLY", issuer: "backpack" },
  JNJ: { mint: "JNJg1znKdF712Phe7L7z52AATAvEjEytBdN2w8Lnh1Y", decimals: 6, underlying: "JNJ", issuer: "backpack" },
  BABA: { mint: "BABANGA4JE7Kkam4nTrALAwAVgsNJUuFJnnkF7S16BZp", decimals: 6, underlying: "BABA", issuer: "backpack" },
  HIMS: { mint: "HiMSSzzwkZkrXJ4PGVJRdtfLaANeAztjjcgk5Dxe7Lwx", decimals: 6, underlying: "HIMS", issuer: "backpack" },
  DNUT: { mint: "DNUTsCvKbKwu2RM72cUuW3TD9YpzArzACcqYQssjPLSk", decimals: 6, underlying: "DNUT", issuer: "backpack" },
  IBM: { mint: "BMKdM4yUxX12moFqVk195k7coMbaybd4RUKCUdm7D1Sk", decimals: 6, underlying: "IBM", issuer: "backpack" },
  MGM: { mint: "MGMuubtUEirmkhfEQdmGUh4pr7HuUdMWcZXFtpPbVJD", decimals: 6, underlying: "MGM", issuer: "backpack" },
  SHOP: { mint: "SH55hfaipFAbwT42nQYhRoM5o5t61QpkmJ6p62vXB3m", decimals: 6, underlying: "SHOP", issuer: "backpack" },
  LULU: { mint: "LULUmT9VMttkfAJE236LXJcYJ2tTP7nunrSWR5G1BdS", decimals: 6, underlying: "LULU", issuer: "backpack" },
  HTZ: { mint: "HTZsLG4zqaNvWMwXSLHH3GG5KyJpKwpBRsKVdMG6hvzP", decimals: 6, underlying: "HTZ", issuer: "backpack" },
  GPRO: { mint: "GPRR2u6NS5yBQHWGauoJ9HXgjrTH8dDsrBfTV5zAYvDH", decimals: 6, underlying: "GPRO", issuer: "backpack" },
  LMT: { mint: "LMT3i1BHgixFqPUgcyteJhnEz2dpy9i3cYy4pi9BoeV", decimals: 6, underlying: "LMT", issuer: "backpack" },
  FLY: { mint: "FLYRq3en8r2Z69gN3KyAnDrvnitEJNkwPYY7favinHeD", decimals: 6, underlying: "FLY", issuer: "backpack" },
  UPS: { mint: "UPSqUeMHcWbkdg784XuBUEF9DtySSnW9ur5LAVdcuB9", decimals: 6, underlying: "UPS", issuer: "backpack" },
  DELL: { mint: "DELL2aRKQz7DMq5DrKLtkn47ZCnbxXPZXrSGbkmd13wy", decimals: 6, underlying: "DELL", issuer: "backpack" },
  PFE: { mint: "PFER6ENqP8r8NF3CqVt4mFowxsin3V5MLidBNQFCC3x", decimals: 6, underlying: "PFE", issuer: "backpack" },
  RIVN: { mint: "RcZmt84VMJv9bDhKqmw1uWDahYrUT468VwAChTnfD8p", decimals: 6, underlying: "RIVN", issuer: "backpack" },
  BULL: { mint: "BULL151gUXcFV5wXEUqu9Am2L7Qt4bTJRLRuAUjkcspC", decimals: 6, underlying: "BULL", issuer: "backpack" },
  NBIS: { mint: "NBiSF3UaVUFtRzHwAfxyHsBCAZWGEKnMpewAE4oh7BG", decimals: 6, underlying: "NBIS", issuer: "backpack" },
  QUBT: { mint: "QUBTAD8C9bMU9LvmMNgKPhrmBGbHvxpu6vfWQtThxxw", decimals: 6, underlying: "QUBT", issuer: "backpack" },
  MRVL: { mint: "MRVLSjkR2ceUBukujaD3xCyHP1H3B2SzpsNTZF546jo", decimals: 6, underlying: "MRVL", issuer: "backpack" },
};

export const USDC = { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
export const WSOL = "So11111111111111111111111111111111111111112";
export const SOL = { mint: WSOL, decimals: 9, pythUsd: "Crypto.SOL/USD" }; // wrapped SOL: permissionless DBC quote

/** Live on-chain twin of an underlying ticker: xStock first, then Backpack. */
export const twinOf = (ticker) => XSTOCKS[`${ticker}x`]?.mint || BACKPACK[ticker]?.mint;

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
