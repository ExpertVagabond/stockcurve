# Stocklana competitor scan — 2026-09-15

Source: the official project list at hackathons.solana.com/hackathons/stocklana/projects is
**hidden until submissions close** ("No public projects yet"). 72 submissions were counted on the
hackathon page. This scan covers the 23 public GitHub repos that self-tag "Stocklana" (via
`gh search repos stocklana`), READMEs pulled 2026-09-15.

## Bounty overlap (what matters for us)

| Repo | Bounties targeted | Meteora DBC | Pyth | Live mainnet? | Commits | Threat to us |
|---|---|---|---|---|---|---|
| **AutoClawGPT/equitycurve-studio** | Meteora DBC + Clawpump | Yes — equity DBC configs, studio UI, **dry-run only** (`dbc-equity-dry-run.mjs still refuses mainnet txs`). Only live pool is HWEEN/**SOL** (memecoin pair, not stock-paired) | No | Web app; DBC equity pool NOT on mainnet | 8 | **Direct rival.** Beatable on "working code on mainnet" and on stock-as-quote. |
| Shaurya-M002/noctis | Main + Pyth | No | Yes — fair value outside market hours w/ error bar | Devnet program, static demo | 24 | Pyth-track rival (fair-value angle). |
| elaris-xyz/bozBasket | Main + Pyth | No | Yes — Pyth reference gates recurring buys | Unclear | 62 | Pyth-track rival (investing wedge). |
| wadezigh96/Swarm_Agent | Clawpump + Agentic Payments | No | No | Unclear | 3 | Clawpump rival, thin. |
| GODGRACE07/multiplier | Infrastructure | No | No | ScaledUiAmount corporate-actions oracle | 4 | No overlap; useful reference for xStocks multiplier handling. |
| bellabaelfire/stocklana-sharelens | Infrastructure | No | No | Local read-only | 2 | No overlap. |

## Everyone else (main track only, no DBC/Pyth-bounty overlap)

| Repo | One-liner | Commits |
|---|---|---|
| aramzcrypto/henar | Market + intelligence layer: one company → every issuer mint (xStocks/Backpack/Ondo), live app | 78 |
| martymedia/after-hours | After-hours trading UI: drift from last real print, freshness, Jupiter swap | 100 |
| cryptoduke01/hanko | Refracts one tokenized stock into Shield/Core/Edge tranches, live site | 55 |
| NathanOyewole/stocksh | Keyboard TUI for trading xStocks via Jupiter | 44 |
| MallorcaBCDays/stocklana-baskets | Anchor program: weighted index baskets, mint/redeem | 26 |
| PoulavBhowmick03/Erodoro_Stocklana | Upside markets (lock equity, sell strike/expiry upside for USDC) on MagicBlock | 17 |
| Bsh54/stax | Yield-bearing tokenized stocks (deposit, keep exposure, earn) | 17 |
| criptocbas/tape-stocklana | Issuer-aware terminal keyed by canonical mint, live on Vercel | 12 |
| khalydmaina/fairfill | Best-price/right-issuer buy router; recorder built, fair-price engine unfinished | 8 |
| dren712/sentinel_finance | Robo-portfolio with on-chain postcondition guarantees | 5 |
| nagumo-dawnlabs/harpoon | Whale perp-position hunter (Phoenix/Hyperliquid), static demo | 4 |
| KvngJamesII/stocklane | DCA + portfolio for xStocks, GitHub Pages demo | 3 |
| vsevolod-zhuravlov/stocklana-mvp | Voice-first accessible wallet with agent tool-calling | 1 |
| shafiankhan/Stocklana | Programmable strategy vaults, devnet program | 1 |
| 0xLubna/stocksol | Pay Solana Pay merchants directly from tokenized stocks | 1 |
| luckysitara/stocklana | Empty | 1 |
| Kelsay849/Stocklana-Meme | Memecoin website | — |

## Positioning conclusions

1. **Nobody has a live mainnet DBC pool quoted in a stock token.** The only DBC entry is dry-run
   for equity and live only for HWEEN/SOL. Meteora's judging line is "working code on mainnet beats
   slides" — a real `TOKEN/AAPLx` (or TSLAx) DBC pool on mainnet is the whole differentiator.
2. **Meteora already badged xStocks as quote mints** (TokenBadge PDAs exist on mainnet for TSLAx,
   NVDAx, AAPLx, SPYx — verified 2026-09-15 with `scripts/check-badges.mjs`). So the stock-paired
   pool is permissionless for us today.
3. **Pyth-track rivals (noctis, bozBasket) use Pyth as a gate/fair-value input, not as a curve
   parameter.** Deriving the DBC curve itself (start price, graduation band, fee decay) from the Pyth
   reference is novel among the visible entries.
4. **Clawpump rivals are thin** (Swarm_Agent: 3 commits; equitycurve-studio: reuses a pre-existing
   memecoin). A genuinely stock-paired pool satisfies "stock-paired liquidity pool using clawpump and
   Meteora" more literally than either.
5. The xStocks `ScaledUiAmountConfig` multiplier (corporate actions) is a recurring theme
   (multiplier, sharelens, fairfill). Our monitor should display multiplier-adjusted units to avoid
   the "raw balance" trap judges will have seen flagged.
