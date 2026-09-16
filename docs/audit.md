# Audit — 2026-09-16

Scope: every script in `scripts/` and `src/`, ten mainnet pools' worth of logs, and the console. Findings are split into
fixed-now, known-and-accepted, and next.

## Fixed in this pass

| # | Finding | Fix |
|---|---|---|
| 1 | Sends carried no priority fee; on public RPC this produced two empty-log "simulation failed" sends and one expired blockhash across the day | `withPriority()` in `src/config.mjs` prepends `setComputeUnitPrice` (default 50k µlamports, `PRIORITY_MICROLAMPORTS` env) on every send in keeper/launch/buy/migrate/claim/lp |
| 2 | `lp.mjs`, `claim.mjs`, `status.mjs`, `buy.mjs`, `migrate.mjs` read `out/launch.json` (the *latest* pool) for symbol/decimals even when `--pool` targeted another pool — a dry run mislabeled 0.0402 SOL as "40.2 DKNG" | `loadPoolRecord(pool)` resolves plan/launch from `out/pools/*` by address; `--out` no longer needed |
| 3 | Keeper read the wSOL token account for SOL-quoted pools → graduate buys sized to 0 | native balance minus a 0.03 SOL reserve |
| 4 | Keeper/status re-resolved references and would have replaced a `manual` anchor with a stale Pyth push print (RKLB: 119 d, 2× wrong) | plan provenance `manual` is honored; stale push prints are last resort only |
| 5 | `status.mjs` fabricated `Crypto.<SYM>X/USD` for Backpack/Ondo quotes | uses the map's `pythUsd` or nothing |
| 6 | Keeper exit disabled via `--exit-bps 100000` hack | explicit `--no-exit` |
| 7 | Fixed-supply rounding on some decimal combos threw `leftOverDelta` | builder retries with a 1-token leftover |
| 8 | `undefined` CLI args overrode curve-shape defaults (broke `--curve lean`) | undefined never overrides |
| 9 | Metaplex name limit (32 chars) failed a pool tx after the config tx | relaunch on the existing config via `launch-shared.mjs`; names kept short |
| 10 | Token metadata: JSON lacked `properties.files`/`category`; served as `text/plain` from GitHub | full Metaplex shape on all tokens; Worker serves `/meta/*` as `application/json` + CORS; future URIs point there |
| 11 | Console snapshots went stale per pool | `scripts/refresh.mjs [--deploy]` re-snapshots every pool, rebuilds, deploys |

## Known and accepted (documented, not changed)

- **Immutable metadata** (`TokenAuthorityOption.Immutable`): on-chain URIs of pools 1–9 point at GitHub raw; JSON content is
  live so images resolve, but explorers that cached before the logos existed refresh on their own schedule.
- **Reference quality**: twins are secondary-market prints. DKNG's moved 7.7% in 20 min; Ondo twins have <$1k DEX liquidity
  but Jupiter's price tracks the underlying (RKLBon $63.51 vs $63.55 close). Real pools must anchor to Pyth (grant needed).
- **Keeper is single-process, polling** (8–15 s). Fine for issuer-run pools; not a competitive sniper — by design.
- **Hot wallet on disk** signs everything. Demo-scale only. A real deployment needs a signer service / hardware key and the
  keeper's budget cap enforced outside the process.
- **Public RPC** with priority fees works; Helius/Triton would remove the remaining 429s during scans.

## Next (ordered by value)

1. ~~Reference = median of sources + TWAP~~ **done**: `resolveUsdRobust` (median across Pyth/twins/Jupiter, `--twap`, `--max-spread`, low-liquidity flag).
2. ~~Graduation in USD terms~~ **done**: `--raise-usd` sizes the float; launch-time **drift guard** refuses if the reference moved > 1% since the plan.
3. **Post-graduation liquidity**: route part of migrated LP into a DLMM band around reference (market-making the basis), not
   only a full-range DAMM v2 position.
4. **Pool-creation watcher for third-party launches** on our shared configs (the launchpad's inbound side) + creation-fee
   claim sweep across all pools on a config (`getPoolsFeesByConfig`).
5. **Console**: live RPC read of DBC/DAMM price in the browser (currently snapshot + live quote price from Jupiter).
6. **Clawpump** registration once a `cpk_` key exists; **Pyth** equity grant for RKLB-class names.
7. Ondo twins as *quotes* (all 28 badged) — untested; thin liquidity makes inventory acquisition the constraint.
