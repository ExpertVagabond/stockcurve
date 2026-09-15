// Equity-tuned DBC curve builder.
//
// Memecoin curves put dense liquidity at the bottom and thin liquidity at the top: price goes
// vertical on hype. An equity pair has a known fair value (the Pyth reference), so we invert that:
//   segment 1  discount → near-ref   thin  (fast discovery: early buyers close the discount quickly)
//   segment 2  near-ref → reference  dense (price stabilises around fair value)
//   segment 3  reference → premium   dense (it takes real demand above reference to graduate)
// Graduation price = reference × (1 + premium). Migration goes to DAMM v2 with LP permanently locked.
import BN from "bn.js";
import {
  ActivationType, BaseFeeMode, CollectFeeMode, MigrationFeeOption, MigrationOption,
  MigratedCollectFeeMode, DammV2DynamicFeeMode, DammV2BaseFeeMode,
  TokenAuthorityOption, TokenDecimal, TokenType,
  buildCurveWithCustomSqrtPrices, createSqrtPrices, getPriceFromSqrtPrice,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

// Fee profiles. `demo` is what pools 1–5 used. `issuer` is the revenue configuration:
//   listing fee   3% of the quote raised, taken once at graduation, 100% to the partner
//   DAMM v2 pool  20 bps + dynamic fee (Customizable migrated-pool fee), LP 100% permanently locked to the partner — earns forever
//   creation fee  0.02 SOL per pool launched on this config (partner 90% / protocol 10%)
export const PROFILES = {
  demo:   { migrationFeePct: 0, migrationFeeOption: "FixedBps25", poolCreationFeeSol: 0, migratedPoolFeeBps: null },
  issuer: { migrationFeePct: 3, migrationFeeOption: "Customizable", poolCreationFeeSol: 0.02, migratedPoolFeeBps: 20 },
};

// Curve shapes. `standard` opens 15% under reference with half the liquidity in the discount zone — good
// discovery, but the atomic opening buy that lifts price to reference costs ~57% of the raise (measured on
// pools 6–7). `lean` opens 5% under with most liquidity above reference: same graduation rule, ~20% capital.
export const CURVES = {
  standard: { discountBps: 1500, premiumBps: 500, weights: [1, 3, 4] },
  lean:     { discountBps: 500,  premiumBps: 500, weights: [1, 1, 6] },
};

export const DEFAULTS = {
  profile: "demo",
  curve: "standard",
  startFeeBps: 300,       // anti-snipe: 3% at open …
  endFeeBps: 30,          // … decaying to 30 bps (equity-like) …
  feePeriods: 60,
  feeDurationSec: 3600,   // … over the first hour
  baseDecimals: 9,
  unit: 1,                // shares per base token (0.1 = one token is a tenth of a share)
  float: 1,               // integer number of base tokens floated (total supply)
};

/**
 * @param {object} p
 * @param {number} p.refBaseUsd   reference USD price of ONE SHARE of the base equity
 * @param {number} p.refQuoteUsd  reference USD price of one quote token (1 for USDC)
 * @param {number} p.quoteDecimals
 * @returns {{configParams: object, checkpoints: number[], summary: object}}
 */
export function buildEquityCurve(p) {
  const shape = CURVES[p.curve || DEFAULTS.curve];
  if (!shape) throw new Error(`unknown curve ${p.curve}`);
  const o = { ...DEFAULTS, ...shape, ...p };
  const prof = PROFILES[o.profile];
  if (!prof) throw new Error(`unknown profile ${o.profile}`);
  const pRef = (o.refBaseUsd * o.unit) / o.refQuoteUsd; // quote units per base token
  const d = o.discountBps / 10_000, prem = o.premiumBps / 10_000;
  const checkpoints = [pRef * (1 - d), pRef * (1 - d / 3), pRef, pRef * (1 + prem)];
  const sqrtPrices = createSqrtPrices(checkpoints, o.baseDecimals, o.quoteDecimals);

  const configParams = buildCurveWithCustomSqrtPrices({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: o.baseDecimals,
      tokenQuoteDecimal: o.quoteDecimals,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: o.float,
      // 1% of float (0 for tiny floats) absorbs fixed-supply rounding on low-decimal quotes; returns to leftoverReceiver after migration
      leftover: o.leftover ?? Math.round(o.float * 0.01),
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerExponential,
        feeSchedulerParam: { startingFeeBps: o.startFeeBps, endingFeeBps: o.endFeeBps, numberOfPeriod: o.feePeriods, totalDuration: o.feeDurationSec },
      },
      dynamicFeeEnabled: true,
      collectFeeMode: CollectFeeMode.QuoteToken, // issuer earns fees in the stock token
      creatorTradingFeePercentage: 0,
      poolCreationFee: prof.poolCreationFeeSol,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption[prof.migrationFeeOption], // FixedBps25 (demo) or Customizable (issuer)
      migrationFee: { feePercentage: prof.migrationFeePct, creatorFeePercentage: 0 }, // listing fee, 100% partner
      ...(prof.migratedPoolFeeBps ? { migratedPoolFee: { collectFeeMode: MigratedCollectFeeMode.QuoteToken, dynamicFee: DammV2DynamicFeeMode.Enabled, poolFeeBps: prof.migratedPoolFeeBps, baseFeeMode: DammV2BaseFeeMode.FeeTimeSchedulerLinear } } : {}),
    },
    liquidityDistribution: {
      partnerLiquidityPercentage: 0,
      partnerPermanentLockedLiquidityPercentage: 100, // all graduated LP permanently locked
      creatorLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
    },
    lockedVesting: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 },
    activationType: ActivationType.Timestamp,
    sqrtPrices,
    liquidityWeights: o.weights,
  });

  const q = 10 ** o.quoteDecimals;
  const thresholdQuote = Number(configParams.migrationQuoteThreshold.toString()) / q;
  const lastSqrt = configParams.curve[configParams.curve.length - 1].sqrtPrice;
  const summary = {
    referencePriceQuote: pRef,
    startPriceQuote: Number(getPriceFromSqrtPrice(configParams.sqrtStartPrice, o.baseDecimals, o.quoteDecimals)),
    graduationPriceQuote: Number(getPriceFromSqrtPrice(lastSqrt, o.baseDecimals, o.quoteDecimals)),
    migrationQuoteThreshold: thresholdQuote,
    migrationQuoteThresholdUsd: thresholdQuote * o.refQuoteUsd,
    feeSchedule: `${o.startFeeBps}→${o.endFeeBps} bps exp over ${o.feeDurationSec}s (${o.feePeriods} periods), dynamic fee on`,
    curve: o.curve, profile: o.profile, listingFeePct: prof.migrationFeePct, dammFeeBps: prof.migratedPoolFeeBps ?? 25, creationFeeSol: prof.poolCreationFeeSol,
    unit: o.unit, float: o.float, discountBps: o.discountBps, premiumBps: o.premiumBps, weights: o.weights,
  };
  return { configParams, checkpoints, sqrtPrices, summary };
}

export { BN };
