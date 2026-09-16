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

Second run, same day, quoted in the S&P 500 xStock (index-relative price discovery) with a **live**
reference (GMEx via Jupiter): DBC pool [`9rKgkPWtf2fWAd8heFjmrZam6dMiMNAZioTHBLVAfQ6B`](https://solscan.io/account/9rKgkPWtf2fWAd8heFjmrZam6dMiMNAZioTHBLVAfQ6B)
→ DAMM v2 [`3qKHCfkELRGMmy97KU5W71ShZbkXMJcSVk3B9NjnJm3a`](https://solscan.io/account/3qKHCfkELRGMmy97KU5W71ShZbkXMJcSVk3B9NjnJm3a).
A sniper bot bought half the float 5 seconds after creation and sold it back 15 seconds later at a
loss — the 300 bps opening fee did its job ([docs/research-findings.md](docs/research-findings.md) §4).

Third run: a **pre-IPO curve** — `pOPENAI / USDC`, anchored to the PreStocks OPENAI mark price ($954.71)
and monitored against the PreStocks secondary price (+1460 bps over mark) and Tessera's T-OpenAI valuation
(0.80× PreStocks). A pre-IPO name has no exchange print, so the curve *is* the price discovery.
DBC pool [`6vyZDFfkDW5GTZ9NbKUVhPmFKgcXYF28GV61hcnHqwfz`](https://solscan.io/account/6vyZDFfkDW5GTZ9NbKUVhPmFKgcXYF28GV61hcnHqwfz)
→ DAMM v2 [`99dvULFK5mK5AeVPQvsauXJGCBaYrnkJhoB1GUBhvwYz`](https://solscan.io/account/99dvULFK5mK5AeVPQvsauXJGCBaYrnkJhoB1GUBhvwYz).

Fourth run — **operated entirely by the keeper**: `sDKNG / AAPLx`, reference live from the Backpack
Securities DKNG mint. The keeper caught the creation on the DBC program's log feed, bought the discount
in one transaction (opening price = reference to 7 decimals), graduated it, migrated it, and exited at
exactly target. DBC pool [`eMbF1jwsZ1YNBjcNmYK15FQrAyX8Hz4ksjtvvoSxZ25`](https://solscan.io/account/eMbF1jwsZ1YNBjcNmYK15FQrAyX8Hz4ksjtvvoSxZ25)
→ DAMM v2 [`F2r2JepVXvycXCFBWxpLGXMVuu3hry4oXp246JmHRW4a`](https://solscan.io/account/F2r2JepVXvycXCFBWxpLGXMVuu3hry4oXp246JmHRW4a).
Keeper transcript: [docs/keeper-pool4.log](docs/keeper-pool4.log).

Fifth run — **atomic launch**: `sRDDT / SOL`, pool creation and the opening buy in one transaction
(`scripts/launch-atomic.mjs`, sized offline from the curve). The pool opened **3 bps** from reference and
its first transaction *is* the creation — there is no block in which a sniper can be first.
DBC pool [`GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP`](https://solscan.io/account/GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP)
· [creation+buy tx](https://solscan.io/tx/5nA1XC87vSFsVAH3FLWz3aa4eBVyTuD32FujmrFpw7uZid2RFrPLKqcTX9C1qSGAS6WgNFEbqcpT76n66pxXzibg). Left live on the curve at fair value.

Ten pools, ~1.6 SOL all-in. Audit of the whole thing: [docs/audit.md](docs/audit.md). Console for all pools:
**https://stockcurve.purplesquirrelnetworks.workers.dev**

| Pool | Quote | Reference | Launch | Status |
|---|---|---|---|---|
| sGME/AAPLx | xStock | Pyth push account (stale, flagged) | manual | graduated |
| sGME-SPY/SPYx | index xStock | GMEx twin, live | manual, sniped at t+5s, bot lost | graduated |
| pOPENAI/USDC | USDC | PreStocks mark (pre-IPO) | manual | graduated |
| sDKNG/AAPLx | xStock | Backpack DKNG twin, live | manual; **keeper did everything else** | graduated |
| sRDDT/SOL | SOL | Backpack RDDT twin, live | **atomic** create+buy | live on curve, +3 bps |
| sHOOD/SOL | SOL | Backpack HOOD twin, live | atomic, **issuer profile**, keeper-graduated | graduated; listing + creation + trading fees claimed |
| sRKLB/SOL | SOL | manual print $63.55 (no live source exists for RKLB) | atomic, **lean curve** (opening buy = 15% of raise), keeper-graduated | graduated; fees claimed |
| sSNDK/SOL | SOL | Backpack SNDK twin, live ($373k liq) | atomic, lean, **seed profile**, keeper self-funded the raise | graduated; **50% of unlocked LP withdrawn** back to the wallet |
| sRKLB-DK/DKNG | **Backpack DKNG** | **Ondo RKLBon** twin, live | atomic, lean, issuer profile; an external buyer graduated it 9 s after launch and paid the listing fee | graduated; all three issuers in one pool; fees claimed in DKNG |
| pSPACEX/USDC | USDC | **Tessera T-SpaceX mark** (PreStocks as cross-check; the two value SpaceX 2.3× apart) | atomic, lean, issuer; outside buyers funded ~70% within 15 s | graduated; fees claimed in USDC |
| pKALSHI/USDC | USDC | **Tessera T-Kalshi mark** | atomic, lean, issuer, keeper-graduated | graduated; fees claimed |
| sTSLA-QQ/QQQx | QQQx (Nasdaq-100 xStock) | **Pyth Pro live** — Equity.US.TSLA/USD base, Equity.US.QQQ/USD quote | atomic, lean, issuer, keeper-graduated | graduated; both legs anchored on Pyth |
| sPLTR/SOL | SOL | PLTRx twin, live | atomic on the **shared config** (`launch-shared.mjs`, unit derived from the ladder, no config rent) | graduated; all three fees claimed to the same partner |

## Launch page (the product surface)

**stockcurve.purplesquirrelnetworks.workers.dev/launch/** — connect a wallet (Phantom / Backpack / Solflare), type a ticker, get the plan
(median twin reference, unit derivation onto a partner config's ladder, opening buy, fees, rent), simulate, sign **one transaction**.
The pool is created on a stockcurve partner config, so stockcurve is partner-of-record (creation fee, listing fee, curve fees, DAMM v2
fees) and the keeper picks the pool up automatically. The Helius key stays server-side (`/rpc` Worker route); metadata is served from
`/meta/dyn`. Bundle: `scripts/build-launch.mjs` (esbuild; DBC SDK + web3 in the browser). Privy (email login + embedded wallet) is the
next step for non-crypto issuers; the page is wallet-agnostic so it drops in.

## One thing per track

The simplest possible version of each — one file, one command, no shared machinery — is in [`simple/`](simple/README.md).

**Outside evidence for the thesis (2026-09-15):** [ALLINU](https://pump.fun/coin/4MMQY9bwkxxTtsK3W227Q5ABT6yFY8Pmn9Ze7wmAXKY8) launched on Raydium LaunchLab quoted in Backpack **DKNG** and reached a $16M cap with 7,000 holders. Its DKNG pool (`5752ia7j…`) is a ~$20 stub; all volume is ALLINU/SOL. We opened the first real stock-quoted venue for it: Meteora DLMM **ALLINU/DKNG** [`F76rVHnd5jbrCBgVvPxW9dp1mntauxkrv8L9XMFTjPsb`](https://solscan.io/account/F76rVHnd5jbrCBgVvPxW9dp1mntauxkrv8L9XMFTjPsb) (`scripts/meteora-pair.mjs`).

| Track | They asked for | The one thing |
|---|---|---|
| **Main track** (Solana Foundation) | Could this be a real app people actually use? | A live DBC pool you can trade right now, opened at reference with an atomic launch — [sRDDT/SOL on Solscan](https://solscan.io/account/GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP) |
| **Best Use of Meteora DBC** (Meteora) | Originality of the DBC configuration, technical soundness, life after the hackathon | A DBC pool quoted in a stock token (AAPLx), curve anchored to reference, graduated to DAMM v2 — [sGME/AAPLx on Solscan](https://solscan.io/account/J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm) |
| **Stocknized Agent on Clawpump** (Clawpump) | Launch your token with a stock-paired liquidity pool using clawpump and Meteora | Two Stocknized agent tokens launched through Clawpump's API, each paired with a Backpack/Sunrise stock and pooled on Meteora: scSPCX/SPCX (SpaceX, Sunrise's flagship) and scSNDK/SNDK — [scSPCX/SPCX Meteora DLMM pair](https://solscan.io/account/GYN1e3YjRrWuAZDVJthgW1wYJBPaciZxmW1gfDRaFkHP) · [scSPCX on Clawpump / pump.fun](https://pump.fun/coin/2QSXUQVQZ7RxjsifbT8tnJocJHbpEt5SCUypLeCjVCcH) · [scSNDK/SNDK Meteora DLMM pair](https://solscan.io/account/7LvHsXj3LFmpwCx6mDbsj7erpVdDJsNDznLhzkwWYb2y) |
| **Best Use of PreStocks** (PreStocks) | Build your project using PreStocks | A pre-IPO launch curve anchored to the PreStocks OPENAI mark price, monitored against their secondary price — [pOPENAI/USDC on Solscan](https://solscan.io/account/6vyZDFfkDW5GTZ9NbKUVhPmFKgcXYF28GV61hcnHqwfz) |
| **Best Use of Tessera** (Tessera) | A product or use case with OpenAI or Kalshi T-Tokens | A launch curve anchored to Tessera's T-Kalshi mark price (and one to T-SpaceX) — [pKALSHI/USDC on Solscan](https://solscan.io/account/4gckR2ZJ4TGWRu8aC7cMQgn5tP2wVLrwc3xGBn8dfZoc) |
| **Best use of Pyth market data** (Pyth) | Live financial data does real work; use one feed, compare both | A pool anchored on Pyth Pro on both legs: Equity.US.TSLA/USD for the base, Equity.US.QQQ/USD for the QQQx quote — [sTSLA-QQ/QQQx on Solscan](https://solscan.io/account/229XVFnwBhJyPdmCpA6f1q3udV6xmScYZQVxduKeet4D) |

Everything else in this README is depth behind those six rows.

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

The reference is a **median across every live source, optionally time-averaged** (`--twap <sec>`): Pyth Pro when
granted, every on-chain twin the ticker has (xStock, Backpack, Ondo — e.g. GME = median of GMEx and GMEon), the
Pyth push account when fresh. Sources with under $10k of liquidity are used but flagged; if sources disagree by more
than `--max-spread` (2%) the plan refuses. At launch a **drift guard** re-resolves the reference and refuses if it
moved more than 1% since the plan, because the ±band is fixed at config time. `--raise-usd` sizes the float so the
graduation threshold lands on a dollar amount (USD graduation) instead of a token count.

Sources, in order of preference when only one is available:

1. **Pyth Pro (Lazer)** `POST /v1/latest_price` — live; `Equity.US.<T>/USD` for the base,
   `Crypto.<T>X/USD` for the xStock quote. The redemption-rate feed (`Crypto.AAPLX/AAPL.RR`) and
   the 24/7 `Equity.Index.*` feeds are wired for the basis view.
2. **Pyth push-oracle account on Solana** — read directly from the `PriceUpdateV2` account
   (no key), with staleness surfaced. Equity accounts are often days old; the console flags it.
3. **Jupiter price** for the xStock mint (secondary-market price, live).
4. **Issuer-supplied** value, recorded as such.

When a Pyth Pro source exists it is the **anchor** and every twin is recorded as context; otherwise the median of twins
is used. The free key turned out to include a few equities — `Equity.US.TSLA/USD` and `Equity.US.QQQ/USD` are live —
so pool 12 (`sTSLA-QQ/QQQx`) is anchored on Pyth Pro on both legs. `scripts/pyth-compare.mjs AAPL` prints the equity,
xStock, Ondo and redemption-rate feeds side by side (Pro where entitled, push account with age otherwise) against the
live twins — Pyth's "use one feed, compare both" in one command.

## Fee profiles — where the revenue is

`src/curve.mjs` ships two profiles. `demo` is what pools 1–5 used. **`issuer`** is the revenue configuration,
and pool 6 (`sHOOD / SOL`, [`2gZ7X2AZH7gEXirrju5NwJVuLKVVivXVH2RWrWw7qTiu`](https://solscan.io/account/2gZ7X2AZH7gEXirrju5NwJVuLKVVivXVH2RWrWw7qTiu))
ran it end-to-end with every stream **claimed on-chain**:

| Stream | Setting | Claimed |
|---|---|---|
| Listing fee | 3% of the quote raised, once, at graduation (`migrationFee.feePercentage`) | [tx](https://solscan.io/tx/5ZL2uECtiMm7u12HRcAqriB8Q6dFZk7G4mc2ecTcpaWUV6K636sKxwokDFHHguaNcHBeVQHDwEwzFwisHzPZfuyX) |
| Pool creation fee | 0.02 SOL per pool launched on the config, 90% to partner | [tx](https://solscan.io/tx/2nsL4LYT16ABSLxvPdoxwW75JsqVGebF51ktbo8zZG2cZ7Q1bPwUFwAUS4qB56Sk65QDjGuPvtvVXJAp6QUXkUeh) |
| Curve trading fees | 300→30 bps scheduler + dynamic, 80% partner after protocol | [tx](https://solscan.io/tx/58FaHH1KK9inxxmrPXWwMpemGp4CNded1Y6jpjbbEhGzrchE6qC9Vp18w5H9EzCMM1x8piRxZtKrz2e2B4yrroqs) |
| DAMM v2 pool fees | 20 bps + dynamic fee (`Customizable`), LP 100% permanently locked to partner — accrues forever | ongoing |

Equity underwriters take 3–7% of an IPO raise; the listing fee is that, in the stock token, with no effect on
trading. The DAMM v2 stream is the compounding one — tokenized stocks on Solana trade 24/7. `scripts/claim.mjs`
claims all three and re-reads the breakdown. The business is being the partner-of-record for other issuers'
launches: `--profile issuer` is one flag.

### One config, any ticker (the launchpad)

A DBC config fixes its price ladder in quote units, so `scripts/launch-shared.mjs` floats the **unit** instead:
`unit = ladderReference / (refBase / refQuote)` shares per token, so any ticker's live reference lands on the
ladder. Pool 7 (`sPLTR/SOL`, [`Enj6KRMbth9gqVFLEat9u8LC5wmfL8qjvrU9ojuWJqE6`](https://solscan.io/account/Enj6KRMbth9gqVFLEat9u8LC5wmfL8qjvrU9ojuWJqE6))
launched on pool 6's config: no config rent, creation fee + curve fees + listing fee all claimed by the same
`feeClaimer`. That is what "partner-of-record for other issuers' launches" means in code.

### Sizing a real pool (`scripts/size.mjs`)

`node scripts/size.mjs --base RKLB --raise 50000 --quote USDC` — RKLB has a pre-deployed Backpack mint with zero supply, no badge and
a 119-day-stale Pyth push account: the exact case the primitive is for. Two curve shapes (`--curve`):

| curve | float | raise | issuer's opening buy | inventory back | listing 3% | curve fees |
|---|---|---|---|---|---|---|
| `standard` (−15%, 1:3:4) | 770 sh | $50k | **$29.3k (59%)** | 235 sh ≈ $30k | $1,500 | ~$400 |
| `lean` (−5%, 1:1:6) | 753 sh | $50k | **$7.6k (15%)** | 58 sh ≈ $7.5k | $1,500 | ~$400 |

Pool 8 (`sRKLB/SOL`, [`5hTGV4FQJkuNLBS9CJG2iAgunQp74EETNM9fcpj4r4tC`](https://solscan.io/account/5hTGV4FQJkuNLBS9CJG2iAgunQp74EETNM9fcpj4r4tC)) ran the lean curve on mainnet: opening buy 0.0026 of a 0.0172 SOL raise = **15%**, opened at 0 bps. A third profile, `seed`, keeps 90% of partner LP withdrawable (DBC minimum 10% locked) for standing up a self-funded venue.

The opening buy is the atomic anti-snipe buy; it returns as inventory the keeper sells at ≥ reference on
DAMM v2, so the capital at risk is the basis on those shares, not the cash. The other 85% of a lean raise is real
buyers between reference and +5%. After graduation the raise (minus the listing fee) sits in a DAMM v2 pool,
100% locked to the partner, earning 20 bps + dynamic fee forever. A real pool's reference must be live Pyth
(Lazer equity grant); the twins are fine for demos and wrong for size.

### The profile matrix, all proven on mainnet

| profile | what it's for | proof |
|---|---|---|
| `demo` | mechanism | pools 1–5 |
| `issuer` | revenue: 3% listing + 0.02 SOL creation + curve fees + 20 bps DAMM v2 on locked LP | pools 6–8, all three streams claimed on-chain |
| `seed` | a self-funded venue with recoverable capital: partner LP 90% withdrawable, 10% locked | pool 9 `sSNDK/SOL` [`EnrkDGJc1L77nsBmpAcbLs9SssALuf7McSWPYvLw7fEt`](https://solscan.io/account/EnrkDGJc1L77nsBmpAcbLs9SssALuf7McSWPYvLw7fEt): keeper funded the 0.895 SOL raise, graduated, then [withdrew 50% of the unlocked LP](https://solscan.io/tx/QJVT7Vtb3TMq4HeSUyqSDZiRrpTj6WY5GVmDrEcRBchaQ69AwGV68SJ8s52f7gCTnrwGUP9emN5K4G7xsoTnKqq) — 0.402 SOL + 2.43 sSNDK back in the wallet (`scripts/lp.mjs`) |

### After graduation: market-make the basis (DLMM band)

`scripts/dlmm-band.mjs` creates a DLMM pair at the reference bin (if none exists) and opens a two-sided **Curve**
position ± `--width-bps` around it. On the SNDK venue: pair [`HGJHSe53E1UynSd36dyApZYcRd2tAjVxBJ1srnyZ2Vpy`](https://solscan.io/account/HGJHSe53E1UynSd36dyApZYcRd2tAjVxBJ1srnyZ2Vpy),
position `D2tqGBkg…UD99`, 25 bins (±3%), 0.94 sSNDK + 0.159 SOL, 20 bps — concentrated liquidity where a stock
actually trades, next to the full-range DAMM v2 pool. This is the fee engine for a real venue.

### Inbound launches and the fee sweep (the launchpad's back office)

- `keeper.mjs --watch` now recognises a pool created **by someone else on one of our configs** ("inbound"), claims its
  creation fee on sight, logs it to `out/inbound.jsonl`, and does *not* trade it (unknown ticker → no reference).
- `scripts/sweep.mjs` walks every config we own (`getPoolsFeesByConfig`) and claims trading, creation and listing fees on
  every pool, ours or inbound. First run: 9 configs, 10 pools, 6 with fees to claim, 0 inbound yet.

## The keeper (not a sniper)

Pool 2 was sniped 5 seconds after creation by a flash-loan bot that then sold back at a loss. A
stock-anchored curve is a bad target for that trade — the run is capped at reference × 1.05 and the
300 bps opening fee eats the edge — but it is a good target for a **basis keeper**, which is what an
issuer actually needs so a pool does not depend on a demo wallet:

```
node scripts/keeper.mjs --watch [--budget 1] [--band-bps 0] [--exit-bps 0] [--graduate]
```

- subscribes to DBC pool creations (`logsSubscribe` on the program) and tracks pools whose config is
  in `out/pools/` (an issuer's own launches);
- **discount zone** (pool < reference): buys exactly the quote that lifts price to reference — sized
  by bisection on the SDK's offline `swapQuote2`, one `PartialFill` transaction, no probing;
- **fair zone**: does nothing — real demand graduates the pool (`--graduate` overrides);
- **curve complete**: migrates to DAMM v2;
- **graduated**: sells the position on DAMM v2 only when the pool trades ≥ reference, sized so the
  *average* execution stays ≥ target (bisection on the DAMM v2 quote) instead of dumping.

Live proof: [sell of 1.344 pOPENAI at 0.09546909 USDC avg = the reference to 10 decimals](https://solscan.io/tx/5hXZDvESTgHTr7WNxF4YMtrdqDZun8ttxwAMnfNVtf6gwEpFRYrCYrQZKz9j9qTcxtT9GwtCeRAE6L3i2pQSuc8w).

## Pre-IPO mode (Tessera / PreStocks)

`--anchor tessera` anchors to Tessera's mark instead of PreStocks' (pool 11, `pSPACEX/USDC`). `node scripts/plan.mjs --preipo OPENAI --quote USDC --unit 0.0001 --float 60` swaps the Pyth reference for
[`src/preipo.mjs`](src/preipo.mjs): the PreStocks mark price is the anchor; the PreStocks secondary token
price, both providers' valuations and the Tessera mark are recorded as context and shown in the console.
Neither provider's mint can be a DBC *quote* today (both carry `TransferFeeConfig`, no badge), which is
why the pre-IPO pool is USDC-quoted.

## Run it

```bash
npm i
# 1. dry run: resolve references, build + validate the curve, write out/plan.json
node scripts/plan.mjs --base GME --quote AAPLx --unit 0.1 --float 5      # or --preipo OPENAI --quote USDC
# 2. quote inventory (any of SOL / USDC / xStock → xStock via Jupiter)
node scripts/swap.mjs --from SOL --to AAPLx --amount 0.15
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
`--premium` (bps), quote = any of the 20 xStocks or 48 badged Backpack stocks in `src/config.mjs`, `USDC`, or `SOL`.
A base ticker with an on-chain twin (GME → GMEx, DKNG → Backpack DKNG) gets a live secondary-market
reference automatically.

## Layout

```
src/config.mjs      mints, feeds, wallet, RPC
src/prices.mjs      reference resolver with provenance (Lazer → on-chain Pyth → Jupiter → manual)
src/curve.mjs       buildEquityCurve → DBC ConfigParameters
scripts/plan.mjs    dry run → out/plan.json
scripts/launch.mjs  createConfig + createPool (token badge aware)
scripts/launch-atomic.mjs  createConfig, then createPool + opening buy in ONE tx (no sniper window)
scripts/buy.mjs     swapQuote2 + swap2 (ExactIn / PartialFill)
scripts/status.mjs  issuer console snapshot → out/status.json
scripts/migrate.mjs migrateToDammV2 + verification
scripts/keeper.mjs  basis keeper: watch → buy discount → migrate → target-sized exit (--no-exit to hold)
scripts/launch-shared.mjs  pool on an existing partner config, unit derived from the ladder (the launchpad path)
scripts/claim.mjs   claim trading + creation + listing fees on a pool
scripts/lp.mjs      DAMM v2 positions; withdraw unlocked LP (seed profile)
scripts/size.mjs    size a real pool for a target raise, both curve shapes
scripts/refresh.mjs re-snapshot every pool, rebuild + deploy the console
scripts/dlmm-band.mjs  DLMM pair + concentrated two-sided band around reference
scripts/sweep.mjs   claim every fee stream on every pool of every config we own (inbound included)
scripts/clawpump-launch.mjs  stock-paired launch through Clawpump's partner API
scripts/swap.mjs    Jupiter swap between SOL / USDC / xStocks
scripts/scan-*.mjs  research probes: xStock badges, Backpack (1,158 mints), pre-IPO, on-chain Pyth
docs/research-findings.md   Backpack/pre-IPO/Clawpump/sniper findings with numbers
docs/competitor-scan.md   the 23 public Stocklana repos, and why none has a stock-quoted DBC pool
```

## Clawpump (Stocknized Agent track)

`scripts/clawpump-launch.mjs` launches a stock-paired token through Clawpump's partner API (self-funded: our
wallet pays the 0.0092 SOL creation fee via preflight → transfer → confirm). Live: **scSPCX** paired with Backpack/Sunrise SPCX (pair `GYN1e3Yj…`) and **scSNDK**, paired with Backpack
SNDK, mint [`CUnDgEpzGQNkwQKDCNoyv1SB6YvBygUSCekSPgnsUGkm`](https://pump.fun/coin/CUnDgEpzGQNkwQKDCNoyv1SB6YvBygUSCekSPgnsUGkm)
· [launch tx](https://solscan.io/tx/2E6RepKQMDmAhBTcRdCFpJBtbyibVFiWQoYdxnCEPVzK7zdewMgffdaRh3F58eMQCFUyuz4U7viN7Pyn1SkaEsts),
100 bps creator fee, 75% fee share to the keeper wallet. On-chain it is a pump.fun curve with a Token-2022 stock quote — so we also gave **that token a Meteora pool paired with the
stock**: DLMM pair [`7LvHsXj3LFmpwCx6mDbsj7erpVdDJsNDznLhzkwWYb2y`](https://solscan.io/account/7LvHsXj3LFmpwCx6mDbsj7erpVdDJsNDznLhzkwWYb2y)
scSNDK/SNDK with a two-sided position at the curve price (`scripts/meteora-pair.mjs`, Token-2022 on both sides).
The "agent" is the keeper.
Clawpump's pair catalogue (`GET /pump-pairs`) lists 156 quote assets including the xStocks and Backpack stocks.

## Three issuers, one primitive

Every Solana stock issuer we could find is already Meteora-badged as a DBC quote token:
**xStocks 20/20** (`scan-xstock-badges.mjs`), **Backpack 48** of 1,158 mints (`scan-backpack.mjs`),
**Ondo 28/28** (`scan-ondo.mjs`). Pool 10 (`sRKLB-DK/DKNG`) is quoted in a Backpack stock and anchored to an
Ondo twin; pools 1–2 are quoted in xStocks. The twin resolver falls through xStock → Backpack → Ondo, which is how
RKLB — no xStock, no Backpack price, stale Pyth account — still gets a live reference (RKLBon $63.51 vs $63.55 close).

## Why this matters beyond the demo

`scripts/scan-backpack.mjs` + `scan-backpack-venues.mjs` (public Backpack API, on-chain supply): Backpack has
**pre-deployed Solana mints for 1,158 US stocks. Only 48 have ever been issued (non-zero supply) — and all 48 trade
on Jupiter and carry a Meteora DBC quote badge.** The other ~1,100 can be minted on demand through Backpack's API,
but nothing launches them: a stock with zero holders has no price-discovery path. That is the gap.
(An earlier draft of this README said "95% have no venue" — wrong: those mints are empty, not unpriced.) Every xStock we could find (20/20) is badged too.
The same command works against both issuers today. Full numbers and the pre-IPO (Tessera/PreStocks)
analysis: [docs/research-findings.md](docs/research-findings.md).

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
