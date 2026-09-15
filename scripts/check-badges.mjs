// Checks whether Meteora has issued a DBC TokenBadge for candidate stock-token quote mints.
import { deriveTokenBadgeAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, getExtensionTypes, ExtensionType, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const c = new Connection(process.env.RPC || "https://api.mainnet-beta.solana.com", "confirmed");
const mints = {
  TSLAx: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  NVDAx: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  AAPLx: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  SPYx:  "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
  USDC:  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};
for (const [n, m] of Object.entries(mints)) {
  const mint = new PublicKey(m);
  const badge = deriveTokenBadgeAddress(mint);
  const [bi, mi] = await Promise.all([c.getAccountInfo(badge), c.getAccountInfo(mint)]);
  let ext = "SPL";
  if (mi?.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    const info = await getMint(c, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    ext = "T22[" + getExtensionTypes(info.tlvData).map(t => ExtensionType[t]).join(",") + "] dec=" + info.decimals;
  }
  console.log(n.padEnd(6), m, ext, "| badge", bi ? "EXISTS ✅" : "missing ❌", badge.toBase58());
}
