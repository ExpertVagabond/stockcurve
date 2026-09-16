# Submission review — what we built vs. what each track asks for

Deadline Fri 18 Sep 2026, 4:00 pm ET. Submit: https://hackathons.solana.com/hackathons/stocklana/submit (wallet sign-in).
Everything below is on mainnet and linked from the README; the console shows all of it live.

## The build in one paragraph

stockcurve is a launch primitive for tokenized stocks on Meteora's Dynamic Bonding Curve. A pool is quoted in a stock
token (xStocks, Backpack, or USDC/SOL); the curve's start, graduation band and fee schedule come from a reference price
resolved as a **median across every live source** (Pyth Pro when granted, xStock/Backpack/Ondo twins, Pyth push
account), time-averaged, with provenance recorded and a drift guard at launch. Launches are **atomic** (pool creation +
opening buy in one tx, no sniper window). A **keeper** discovers pools, buys only the discount, graduates, migrates to
DAMM v2 and exits at target. Three **fee profiles** (demo / issuer / seed) with every stream claimed on-chain, a
**shared-config launchpad** (one partner config, any ticker), a **DLMM band** after graduation, an **inbound watcher +
fee sweep**, an issuer **console**, a **sizing tool**, 17 tests, and a 2-minute narrated demo.

## Track by track

### Main track ($100k, Solana Foundation) — "could this be a real app people actually use?"
| Criterion | Evidence |
|---|---|
| Real user + problem | Backpack has pre-deployed mints for 1,158 US stocks; only 48 have ever been issued, and all 48 trade (`scan-backpack-venues.mjs`, measured). The other ~1,100 are mintable on demand but never launched — no price-discovery path for a stock with zero holders. DBC is built for launches but tuned for memecoins. |
| Working end-to-end demo | 11 pools launched → traded → graduated → DAMM v2 on mainnet; keeper ran pools 4, 6–11; console live; video with VO. |
| Reason it belongs on Solana | Meteora DBC/DAMM v2/DLMM, Token-2022 stock mints with Meteora badges, 24/7 markets, sub-second atomic launch. |
| Quality of execution | Every step re-read from chain; audit doc; tests; drift guard; provenance on every reference. |

### Best Use of Meteora DBC ($5k) — "originality of the DBC configuration or use case, technical soundness, life after"
| Criterion | Evidence |
|---|---|
| Original configuration | Stock **as the quote** (badged Token-2022 quotes); inverted liquidity weights (dense at/above reference); lean vs standard shapes; graduation defined as +5% over reference; fees collected in the stock; `Customizable` migrated-pool fee; seed profile with 90% withdrawable LP. |
| Original use case | IPO-style discovery for stocks that have never been issued on-chain; pre-IPO curves anchored to mark prices; index-relative pricing (sGME-SPY/SPYx); one config serving any ticker via unit derivation. |
| Technical soundness | `createConfigAndPoolWithFirstBuy` atomic path; `PartialFill`; keeper bisection on offline `swapQuote2`; migration + fee claims via SDK; 17 tests; measured decay signature identical across 11 pools. |
| Life after | Issuer profile revenue proven on-chain (listing 3% + creation + trading + DAMM v2 LP); launchpad = partner-of-record; keeper + sweep are the back office. |
| Sponsor line: "working code on mainnet beats slides" | 11 pools, ~1.7 SOL, every address linked. |

### Stocknized Agent on Clawpump ($5k) — "Launch your token with a stock-paired liquidity pool using clawpump and Meteora"
| Requirement | Evidence |
|---|---|
| Launched through Clawpump | `scSNDK` via the partner API, paired with Backpack SNDK — mint `CUnDgEpz…UGkm`, pump.fun curve with Token-2022 stock quote, 75% fee share to the keeper wallet. `scripts/clawpump-launch.mjs`. |
| **That token on Meteora, stock-paired** | DLMM pair `7LvHsXj3…Yb2y` scSNDK/SNDK, two-sided position at curve price (`meteora-pair.mjs`). The sentence is satisfied literally: launched with Clawpump, pooled on Meteora, paired with a stock. |
| Meteora stock-paired pool | sRKLB-DK/DKNG (Backpack quote), sGME/AAPLx, sGME-SPY/SPYx (xStock quotes) — all Meteora DBC → DAMM v2. |
| "Agent" | the keeper: autonomous discover / buy / graduate / migrate / exit / claim; agentId `stockcurve-keeper` on Clawpump. |

### Best Use of PreStocks ($5k) — "creativity, integration depth, product quality"
| Evidence |
|---|
| `src/preipo.mjs` reads the PreStocks API (mark price, secondary token price, valuation, supply, mint) for all 8 names. Pool 3 `pOPENAI/USDC` anchored to the PreStocks mark; console shows mark vs secondary basis (+1460 bps at launch). PreStocks tokens can't be a DBC quote (TransferFee, no badge) — documented, with the reason. |

### Best Use of Tessera ($6k) — "products that drive value to pre-IPO Tessera tokens"
| Evidence |
|---|
| Pool 11 `pSPACEX/USDC` and **pool 13 `pKALSHI/USDC`** anchored to **Tessera's mark** (`--anchor tessera`) — Kalshi is one of the two T-tokens the track names. PreStocks as cross-check; console shows the valuation disagreement. Provider fetch retries because their API flaps. Gap: we reference T-tokens; we don't route flow into them (their mint isn't badge-eligible as a quote). |

### Best use of Pyth market data (3 months Pyth Pro) — "how central Pyth is, soundness, exists post-hackathon"
| Evidence | Gap |
|---|---|
| **Pool 12 `sTSLA-QQ/QQQx` is anchored on Pyth Pro on both legs** (Equity.US.TSLA/USD, Equity.US.QQQ/USD — the two equities the key is entitled to). Pyth is authoritative in the resolver whenever present (twins become context). `pyth-compare.mjs` puts the equity, xStock, Ondo and redemption-rate feeds side by side (Pro or push account with age) against live twins. SOL/USD from Lazer anchors every SOL-quoted pool. | Most equities on the key are still 403; those pools use twins with provenance. Requested from Pyth. |

## What to paste
- Links: repo · console · video (upload the mp4 or YouTube unlisted) · live pool `GretDMXw…` · Clawpump coin page.
- Text: `docs/submission.md` (updated). Tick all six tracks.
- Team: solo.

## Known gaps, stated honestly
- Pyth equity entitlement pending (above).
- Demo-scale floats ($2–90 raises); sizing for real ($50k) is in `size.mjs` and the README.
- Immutable metadata on pools 1–9 points at GitHub-hosted JSON; images resolve, explorers refresh on their schedule.
- Keeper is single-process polling; hot wallet on disk — fine for a demo, not a production signer.
