# Runbook: the first real-sized launch (SNDK, seed profile)

The two pools that made money (sSNDK/SOL, sGME/AAPLx) did so because a third party bought the discount at launch. This
repeats that at a size where it pays. Everything below is the same code that ran the 13 demo pools; only the numbers change.

## Sizing (2026-09-16, SNDK ≈ $1,543, SOL ≈ $97.5; rerun `size.mjs` on the day)

| raise | float | our opening buy (lean, 15%) | tokens we get back | curve fees | rent |
|---|---|---|---|---|---|
| $10k | 13 sh | **$1,572 ≈ 16.1 SOL** | 1.0 sh (~$1,556 at reference) | $83 | 0.07 SOL |
| $20k | 25 sh | **$3,023 ≈ 31 SOL** | 1.9 sh (~$2,993) | $160 | 0.07 SOL |

Seed profile: partner LP 90% unlocked / 10% locked, no listing fee. What we recover after graduation: 90% of the
migrated LP (quote + base) plus the tokens the opening buy bought (sell at reference on the DAMM v2 pool or hold as
inventory). Demo precedent: 0.9 SOL raise → 0.79 SOL withdrawn (+ fees) on ~0.25 SOL in.

Wallet needed on launch day: opening buy + 0.15 SOL (rent + migration + fees). For $20k: **~31.5 SOL**.

## Commands (in order)

```
# 1. plan: median/TWAP reference, lean curve, seed profile, $20k raise
node scripts/plan.mjs --base SNDK --quote SOL --raise-usd 20000 --curve lean --profile seed --twap 60 --max-spread 2

# 2. launch atomically (config + pool + opening buy in one tx; drift guard refuses if reference moved >1%)
node scripts/launch-atomic.mjs --out sSNDK-real

# 3. keeper: watches the curve, buys only the discount if a bot doesn't, migrates at graduation, exits inventory at reference
node scripts/keeper.mjs --pool <pool from out/pools/sSNDK-real/launch.json> --budget 0 --graduate --exit-bps 0

# 4. after migration: withdraw the unlocked 90% partner LP (the seed-profile proof) — or leave it to earn
node scripts/lp.mjs --pool <pool> --withdraw 1.0

# 5. DLMM band ±5% around reference on the graduated venue: this is where the arb flow pays fees
node scripts/dlmm-band.mjs --pool <pool> --width-bps 500

# 6. fees: the 30-min launchd job sweeps; or node scripts/sweep.mjs --pretty
```

## What to expect
- A sniper filled the demo raise in 5 s. Expect the same: the raise is funded by arbs buying the −5% open, not by us.
- If nobody buys within the keeper's window, the keeper buys the discount itself (budget = the opening-buy SOL); the
  downside is holding SNDK exposure at a 5% discount, not a loss.
- Fees only matter with flow; the DLMM band is what earns on a stock-quoted pool. Demo pools earned ~$3 total on $200 of raises.
