// Browser bundle for the Launch page: DBC SDK + web3 + BN, exposed on window.SC. Built by scripts/build-launch.mjs (esbuild).
import BN from "bn.js";
import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress, getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice, getPriceFromSqrtPrice, feeNumeratorToBps } from "@meteora-ag/dynamic-bonding-curve-sdk";
window.SC = { BN, Connection, PublicKey, Keypair, Transaction, VersionedTransaction, ComputeBudgetProgram, DynamicBondingCurveClient, deriveDbcPoolAddress, deriveTokenBadgeAddress, getQuoteReserveFromNextSqrtPrice, getSqrtPriceFromPrice, getPriceFromSqrtPrice, feeNumeratorToBps };
