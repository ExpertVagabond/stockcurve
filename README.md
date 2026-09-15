# stockcurve

**A Meteora DBC launch primitive for tokenized-stock pairs.** The pool is quoted in a stock token
(xStocks `AAPLx`, not SOL), and the curve's start price, graduation band and fee decay are derived
from the Pyth reference price of the underlying. An issuer console reads the pool back against the
reference and reports basis, progress and fees.

Built for [Stocklana](https://hackathons.solana.com/hackathons/stocklana) (Sept 2026).
Working code on mainnet — the whole lifecycle ran on Solana mainnet on 2026-09-15:

| Step | Address / tx |
|---|---|
| DBC config (partner) | [`8de9pBxf2o4hmXo2kxhiLRvhmjuBmQjJQdiPTn5FQXC2`](https://solscan.io/account/8de9pBxf2o4hmXo2kxhiLRvhmjuBmQjJQdiPTn5FQXC2) · [tx](https://solscan.io/tx/5RHP6icoTyXdS46Y9FFhsMfyt1q1qhUn2Jgjt5Nb3Kw61SUfD547zUgfAJvBVEboVqMqRVRefCkfoVBk6qWRGwNw) |
| DBC virtual pool `sGME / AAPLx` | [`J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm`](https://solscan.io/account/J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm) · [tx](https://solscan.io/tx/5ca4uXAHMxNMP93KYuS2PTtrnPLV93W6hFJYRzPtRsAux7rwuDgDWG3YMtDuYpZukePwWweV7rhvw2NEXdSvyWi2) |
| Base mint `sGME` | [`71cwbrMGTMTAt9m8wbuYt8k3eW6VUGKuLW8Yzn961vuP`](https://solscan.io/token/71cwbrMGTMTAt9m8wbuYt8k3eW6VUGKuLW8Yzn961vuP) |
| Quote mint `AAPLx` (Token-2022, Meteora token badge) | [`XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`](https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp) |
| Buys on the curve (+10.3%, +5.2%, +3.5%, +2.8%) | [1](https://solscan.io/tx/3PVDD46WX4cgzA9vhvtfa5Z7rEJbiSCkknfHdF6oRtQHptxrX9WpYTwPmN67gF1EX4DeCKyN2EJXGvteNSUmr763) · [2](https://solscan.io/tx/2uxZB78z7aFKjJ1dRNiL9EVSGLhWCCpe5p9BCNbksSX5xLLjahNNgBAJJ4exYJ43i3Q1poE34LWD5qSYA2Fc1Kpf) · [3](https://solscan.io/tx/57oGj6HMKuyWwB9ALSsK9M44QCvPqB5VXJ9kCz9d2ufkVkmA7ZGWxcG3CYDJXiQtZbLVZ1x9ZYF4cRf7nuQi65Q4) · [4 (partial fill to 100%)](https://solscan.io/tx/RYwvXNb6tv3JzgwcrSGQJEDJnMSgG5fp5gyG77zZZA8sRizsTi2YMCD5fugTwGcWVDVCK9xnFgHfkTUsLXm1yXS) |
| Graduation → DAMM v2 pool | [`7FGmDHJNPhTu4VbRLQL7b5RKMXDD1p8Sm7hDKPWby4gA`](https://solscan.io/account/7FGmDHJNPhTu4VbRLQL7b5RKMXDD1p8Sm7hDKPWby4gA) · [tx](https://solscan.io/tx/5RgKF9dHygAC131e2ZBCEo71mUHipnR5m76QCywEUpRL7QVSP5bnqTKXwvHwAo3sHx4iPDubv3LDA8H3uEtyR9Gh) |

Total cost of the run: ~0.2 SOL including the AAPLx quote inventory.

## Why a stock needs a different curve

A memecoin has no fair value, so its curve puts dense liquidity at the bottom and goes vertical on
hype. A tokenized stock *has* a fair value: the Pyth reference. `stockcurve` inverts the memecoin
shape around that number:

```
price                                          weights (liquidity per segment)
 ref × 1.05  ┤ graduation ─────────────────┐   4   dense: it takes real demand above
 ref         ┤ reference  ───────────────┐ │   3   dense: price settles near fair value
 ref × 0.95  ┤                      ┌────┘ │   1   thin:  early buyers close the discount fast
 ref × 0.85  ┤ start ───────────────┘      │
```

- **Start** = reference × (1 − 15%) — an IPO-style discount for price discovery.
- **Graduation** = reference × (1 + 5%) — the pool migrates to DAMM v2 only once price is *above*
  fair value, i.e. once there is real demand, not a sniper.
- **Liquidity weights 1 : 3 : 4** — on mainnet, four equal-ish buys moved price +10.3%, +5.2%,
  +3.5%, +2.8%. That decay *is* the design.
- **Fees** — `FeeSchedulerExponential` 300 → 30 bps over the first hour (anti-snipe), then equity-like
  30 bps, with Meteora's dynamic fee on. Fees are collected in the **quote**, so an issuer earns in
  shares. (DBC rejects `RateLimiter` for new configs; the scheduler is the supported path.)
- **After graduation** — DAMM v2 at 25 bps, 100% of migrated LP permanently locked.

All of it is one function: [`src/curve.mjs`](src/curve.mjs) `buildEquityCurve({ refBaseUsd,
refQuoteUsd, unit, float, discountBps, premiumBps })` → a validated DBC `ConfigParameters`.

## Stock as the *quote* token

Every xStock (`AAPLx`, `TSLAx`, `NVDAx`, `SPYx`) is a Token-2022 mint with `PermanentDelegate`,
`TransferHook` and `ScaledUiAmountConfig` — extensions DBC does not accept permissionlessly.
Meteora has already issued a **TokenBadge** for all four on mainnet
([`scripts/check-badges.mjs`](scripts/check-badges.mjs) verifies it), so a stock-quoted pool needs
no permission from anyone. The DAMM v2 migration config carries `CreatePoolWithoutMintValidation`,
which is why graduation works too.

The issuer console applies the xStock `ScaledUiAmount` multiplier (1.00266 for AAPLx at the time of
writing) so displayed quote amounts are share-units, not raw balances.

## Pyth

The reference price comes from [`src/prices.mjs`](src/prices.mjs), which records provenance
(`source`, `ageSec`, `feed`) into the plan so the config is auditable:

1. **Pyth Pro (Lazer)** `POST /v1/latest_price` — live; `Equity.US.<T>/USD` for the base,
   `Crypto.<T>X/USD` for the xStock quote. The redemption-rate feed (`Crypto.AAPLX/AAPL.RR`) and
   the 24/7 `Equity.Index.*` feeds are wired for the basis view.
2. **Pyth push-oracle account on Solana** — read directly from the `PriceUpdateV2` account
   (no key), with staleness surfaced. Equity accounts are often days old; the console flags it.
3. **Jupiter price** for the xStock mint (secondary-market price, live).
4. **Issuer-supplied** value, recorded as such.

The mainnet run above used source 2 for GME (32 days stale, flagged in `out/plan.json`) because the
free Pyth Pro grant covers crypto majors only; with an equity grant the same command uses source 1
unchanged.

## Run it

```bash
npm i
# 1. dry run: resolve references, build + validate the curve, write out/plan.json
node scripts/plan.mjs --base GME --quote AAPLx --unit 0.1 --float 5
# 2. quote inventory (SOL → xStock via Jupiter)
node scripts/swap-sol-to-quote.mjs --quote AAPLx --sol 0.15
# 3. mainnet: create config + pool (simulate first with --dry)
node scripts/launch.mjs --dry && node scripts/launch.mjs
# 4. trade, watch, graduate
node scripts/buy.mjs --quote-amount 0.004
node scripts/status.mjs
node scripts/migrate.mjs
```

`KEYPAIR` and `RPC` env vars override the defaults. Pyth Pro token goes in `~/.config/pyth/pyth.env`
as `PYTH_ACCESS_TOKEN=…` (never in the repo).

Knobs: `--unit` (shares per token, e.g. `0.1`), `--float` (tokens issued), `--discount`,
`--premium` (bps), quote `AAPLx | TSLAx | NVDAx | SPYx | USDC`.

## Layout

```
src/config.mjs      mints, feeds, wallet, RPC
src/prices.mjs      reference resolver with provenance (Lazer → on-chain Pyth → Jupiter → manual)
src/curve.mjs       buildEquityCurve → DBC ConfigParameters
scripts/plan.mjs    dry run → out/plan.json
scripts/launch.mjs  createConfig + createPool (token badge aware)
scripts/buy.mjs     swapQuote2 + swap2 (ExactIn / PartialFill)
scripts/status.mjs  issuer console snapshot → out/status.json
scripts/migrate.mjs migrateToDammV2 + verification
scripts/check-badges.mjs, check-pyth-onchain.mjs, scan-onchain-equities.mjs   research probes
docs/competitor-scan.md   the 23 public Stocklana repos, and why none has a stock-quoted DBC pool
```

## After the hackathon

- Any Pyth-covered ticker → a stock-quoted or USDC-quoted DBC pool in one command; the curve is the
  product, the demo token is not.
- Backpack Securities opened mint/redeem for its tokenized stocks to all Solana developers — a
  second quote-token family once Meteora badges them.
- Clawpump: the same pool registered as a stock-paired agent launch.
- Console v2: live basis vs both the equity feed and the xStock feed, redemption-rate spread,
  graduation ETA.

The `sGME` demo token is a hackathon artifact: 1 sGME = 0.1 share-*unit* of a GME reference. It is
not a claim on GameStop shares.
