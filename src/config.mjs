// Shared constants: mints, Pyth feed ids, wallet, RPC.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { homedir } from "node:os";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey } from "@solana/web3.js";

// RPC: env RPC > ~/.config/stockcurve/rpc.env (Helius) > public mainnet.
function rpcFromFile() { try { return readFileSync(`${homedir()}/.config/stockcurve/rpc.env`, "utf8").match(/^RPC=(\S+)/m)?.[1]; } catch { return undefined; } }
export const RPC = process.env.RPC || rpcFromFile() || "https://api.mainnet-beta.solana.com";
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

// Ondo Global Markets tokenized stocks on Solana (vanity ...ondo mints). All 28 Meteora-badged (scripts/scan-ondo.mjs, 2026-09-16).
// Thin DEX liquidity but Jupiter prices track the underlying (RKLBon $63.51 vs $63.55 close) — usable as reference twins.
export const ONDO = {
  AAPLon: { mint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo", decimals: 9, underlying: "AAPL", issuer: "ondo", pythUsd: "Crypto.AAPLON/USD" },
  TSLAon: { mint: "KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo", decimals: 9, underlying: "TSLA", issuer: "ondo", pythUsd: "Crypto.TSLAON/USD" },
  NVDAon: { mint: "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo", decimals: 9, underlying: "NVDA", issuer: "ondo", pythUsd: "Crypto.NVDAON/USD" },
  MSFTon: { mint: "FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo", decimals: 9, underlying: "MSFT", issuer: "ondo", pythUsd: "Crypto.MSFTON/USD" },
  AMZNon: { mint: "14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo", decimals: 9, underlying: "AMZN", issuer: "ondo" },
  GOOGLon: { mint: "bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo", decimals: 9, underlying: "GOOGL", issuer: "ondo", pythUsd: "Crypto.GOOGLON/USD" },
  METAon: { mint: "fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo", decimals: 9, underlying: "META", issuer: "ondo" },
  SPYon: { mint: "k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo", decimals: 9, underlying: "SPY", issuer: "ondo" },
  QQQon: { mint: "HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo", decimals: 9, underlying: "QQQ", issuer: "ondo" },
  SQQQon: { mint: "D1tu7Fnm3cCpKyyPXrqm5GXShPqMj7a2SEjjq9fondo", decimals: 9, underlying: "SQQQ", issuer: "ondo" },
  TQQQon: { mint: "14W1itEkV7k1W819mLSknFTaMmkCtPokbF2tRkPUondo", decimals: 9, underlying: "TQQQ", issuer: "ondo" },
  COINon: { mint: "5u6KDiNJXxX4rGMfYT4BApZQC5CuDNrG6MHkwp1ondo", decimals: 9, underlying: "COIN", issuer: "ondo", pythUsd: "Crypto.COINON/USD" },
  HOODon: { mint: "BVdXGvmgi6A9oAiwWvBvP76fyTqcCNRJMM7zMN6ondo", decimals: 9, underlying: "HOOD", issuer: "ondo", pythUsd: "Crypto.HOODON/USD" },
  PLTRon: { mint: "HfsnTS5qtdStwec9DfBrunRqnAMYMMz1kjv9Hu9ondo", decimals: 9, underlying: "PLTR", issuer: "ondo" },
  RIOTon: { mint: "i6f3DvZBuLpnGSqS8x6WPeStJ7jNe5KewD6afD5ondo", decimals: 9, underlying: "RIOT", issuer: "ondo" },
  PPLTon: { mint: "DwRtkbsaQMGAS3oMeEGYh6M5vH4X9WECsQgqHjAondo", decimals: 9, underlying: "PPLT", issuer: "ondo" },
  MSTRon: { mint: "FSz4ouiqXpHuGPcpacZfTzbMjScoj5FfzHkiyu2ondo", decimals: 9, underlying: "MSTR", issuer: "ondo", pythUsd: "Crypto.MSTRON/USD" },
  GMEon: { mint: "aznKt8v32CwYMEcTcB4bGTv8DXWStCpHrcCtyy7ondo", decimals: 9, underlying: "GME", issuer: "ondo" },
  AMDon: { mint: "14diAn5z8kjrKwSC8WLqvBqqe5YmihJhjxRxd8Z6ondo", decimals: 9, underlying: "AMD", issuer: "ondo" },
  NFLXon: { mint: "g4KnPrxPLeeKkwvDmZFMtYQPM64eHeShbD55vK6ondo", decimals: 9, underlying: "NFLX", issuer: "ondo" },
  AVGOon: { mint: "1FWZtdWN7y38BSXGzbs8D6Shk88oL9atDNgbVz9ondo", decimals: 9, underlying: "AVGO", issuer: "ondo" },
  CRCLon: { mint: "6xHEyem9hmkGtVq6XGCiQUGpPsHBaoYuYdFNZa5ondo", decimals: 9, underlying: "CRCL", issuer: "ondo", pythUsd: "Crypto.CRCLON/USD" },
  GLDon: { mint: "hWfiw4mcxT8rnNFkk6fsCQSxoxgZ9yVhB6tyeVcondo", decimals: 9, underlying: "GLD", issuer: "ondo" },
  TLTon: { mint: "KaSLSWByKy6b9FrCYXPEJoHmLpuFZtTCJk1F1Z9ondo", decimals: 9, underlying: "TLT", issuer: "ondo" },
  IWMon: { mint: "dvj2kKFSyjpnyYSYppgFdAEVfgjMEoQGi9VaV23ondo", decimals: 9, underlying: "IWM", issuer: "ondo" },
  SNDKon: { mint: "EJmUVvDqAdfH5zEohkdS4234bi3c6iunqEMobjmondo", decimals: 9, underlying: "SNDK", issuer: "ondo" },
  RKLBon: { mint: "E9VQY3VnrpVSekFByzRmfeK1kxgM3UiKCoVVbdUondo", decimals: 9, underlying: "RKLB", issuer: "ondo" },
  RDDTon: { mint: "HXFrTf9v9NdjGUTnx4sojR3Cf92hoBsQFUxKTN7ondo", decimals: 9, underlying: "RDDT", issuer: "ondo" },
};

export const USDC = { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
export const WSOL = "So11111111111111111111111111111111111111112";
export const SOL = { mint: WSOL, decimals: 9, pythUsd: "Crypto.SOL/USD" }; // wrapped SOL: permissionless DBC quote

/** Live on-chain twin of an underlying ticker: xStock, then Backpack, then Ondo. */
export const twinOf = (ticker) => XSTOCKS[`${ticker}x`]?.mint || BACKPACK[ticker]?.mint || ONDO[`${ticker}on`]?.mint;
/** Every on-chain twin of a ticker, labelled by issuer — the median reference uses all of them. */
export const twinsOf = (ticker) => [
  XSTOCKS[`${ticker}x`] && { issuer: "xstocks", symbol: `${ticker}x`, mint: XSTOCKS[`${ticker}x`].mint },
  BACKPACK[ticker] && { issuer: "backpack", symbol: ticker, mint: BACKPACK[ticker].mint },
  ONDO[`${ticker}on`] && { issuer: "ondo", symbol: `${ticker}on`, mint: ONDO[`${ticker}on`].mint },
].filter(Boolean);

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

/** Prepend a compute-unit price so sends land on the first try (public RPC + no tip = expired blockhashes). */
export const PRIORITY_MICROLAMPORTS = Number(process.env.PRIORITY_MICROLAMPORTS || 50_000);
export function withPriority(tx) {
  if (!tx.instructions.some((ix) => ix.programId.equals(ComputeBudgetProgram.programId))) tx.instructions.unshift(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_MICROLAMPORTS }));
  return tx;
}

/** Resolve {plan, launch, dir} for a pool: by address from out/pools/*, else the latest out/{plan,launch}.json. */
export function loadPoolRecord(poolAddr) {
  const { readdirSync, existsSync } = require("node:fs");
  if (poolAddr && existsSync("out/pools")) for (const name of readdirSync("out/pools")) {
    const dir = `out/pools/${name}`;
    if (!existsSync(`${dir}/launch.json`)) continue;
    const launch = JSON.parse(readFileSync(`${dir}/launch.json`, "utf8"));
    if (launch.pool === poolAddr) return { plan: JSON.parse(readFileSync(`${dir}/plan.json`, "utf8")), launch, dir };
  }
  return { plan: JSON.parse(readFileSync("out/plan.json", "utf8")), launch: JSON.parse(readFileSync("out/launch.json", "utf8")), dir: null };
}
