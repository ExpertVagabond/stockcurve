# Stocklana submission — paste-ready

**Project name:** stockcurve

**One-liner:** A Meteora DBC launch primitive for tokenized stocks: pools quoted in the stock token itself, curves anchored to a median-of-sources reference, atomic launches with no sniper window, and a keeper that runs the lifecycle. Eleven pools on mainnet, three fee profiles with every stream claimed on-chain, a shared-config launchpad, a Clawpump stock-paired launch.

**Links**
- GitHub: https://github.com/ExpertVagabond/stockcurve
- Live console (all pools): https://stockcurve.purplesquirrelnetworks.workers.dev
- Live pool on the curve right now: https://solscan.io/account/GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP
- Clawpump stock-paired launch (scSNDK / Backpack SNDK): https://pump.fun/coin/CUnDgEpzGQNkwQKDCNoyv1SB6YvBygUSCekSPgnsUGkm
- Demo video (2 min, narrated): attach `demo/stockcurve-demo.mp4` (also on the Desktop) or a YouTube-unlisted upload of it
- Track-by-track evidence: https://github.com/ExpertVagabond/stockcurve/blob/main/docs/submission-review.md

**Tracks:** Main · Best Use of Meteora DBC · Stocknized Agent on Clawpump · Best Use of PreStocks · Best Use of Tessera · Best use of Pyth market data

**One thing per track**

- **Main track** — A live DBC pool you can trade right now, opened at reference with an atomic launch. https://solscan.io/account/GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP
- **Best Use of Meteora DBC** — A DBC pool quoted in a stock token (AAPLx), curve anchored to reference, graduated to DAMM v2. https://solscan.io/account/J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm
- **Stocknized Agent on Clawpump** — scSNDK: launched through Clawpump's API paired with Backpack SNDK, then pooled on Meteora (DLMM scSNDK/SNDK). https://solscan.io/account/7LvHsXj3LFmpwCx6mDbsj7erpVdDJsNDznLhzkwWYb2y
- **Best Use of PreStocks** — A pre-IPO launch curve anchored to the PreStocks OPENAI mark price, monitored against their secondary price. https://solscan.io/account/6vyZDFfkDW5GTZ9NbKUVhPmFKgcXYF28GV61hcnHqwfz
- **Best Use of Tessera** — A launch curve anchored to Tessera's T-Kalshi mark price (and one to T-SpaceX). https://solscan.io/account/4gckR2ZJ4TGWRu8aC7cMQgn5tP2wVLrwc3xGBn8dfZoc
- **Best use of Pyth market data** — A pool anchored on Pyth Pro on both legs: Equity.US.TSLA/USD for the base, Equity.US.QQQ/USD for the QQQx quote. https://solscan.io/account/229XVFnwBhJyPdmCpA6f1q3udV6xmScYZQVxduKeet4D

**Description (≈250 words)**

Backpack Securities has pre-deployed Solana mints for 1,158 US stocks, but only 48 have ever been issued — and all 48 trade (measured on-chain, script in repo). The other 1,100 can be minted on demand and never are, because a stock with zero holders has no price-discovery path. Memecoin launch curves are the wrong tool for that — a stock has a fair value.

stockcurve turns Meteora's Dynamic Bonding Curve into an IPO-style launch for equity-like assets. The pool is quoted in a stock token (xStocks or Backpack, both already Meteora-badged) or USDC/SOL. The curve's start (−15%), graduation (+5%) and liquidity weights (thin in the discount, dense around fair value) are derived from a reference price with recorded provenance: Pyth Pro when granted, the Pyth push account on Solana, a live on-chain twin (GME→GMEx, DKNG→Backpack DKNG), or — for pre-IPO names with no exchange print — the PreStocks mark price, cross-checked against the PreStocks secondary and Tessera's valuation.

On mainnet on 2026-09-15/16 we ran eleven pools end-to-end (config → pool → buys → curve complete → DAMM v2), across AAPLx, SPYx, USDC, SOL and Backpack DKNG quotes, with references from xStocks, Backpack and Ondo twins, a pre-IPO mark price, and a median/TWAP resolver; three fee profiles (demo / issuer with 3% listing fee claimed on-chain / seed with 90% withdrawable LP, withdrawn on-chain); a stock-paired launch through Clawpump's partner API, a pre-IPO pool anchored to Tessera's mark and another to PreStocks', a DLMM band on a graduated venue, and a fee sweep across every config we own. Four equal buys moved price +10%, +5%, +3.5%, +2.8% on every pool — the curve shape, not luck. A sniper bot hit pool 2 five seconds after creation and sold back at a loss to the 300 bps opening fee schedule.

Then we removed the window entirely: `launch-atomic.mjs` creates the pool and executes the opening buy in one transaction (pool 5 opened 3 bps from reference; its first tx is its creation). And a basis keeper watches the DBC program, buys only the discount, graduates, migrates and exits at target-sized fills — pool 4 was run by it unattended.

An issuer console shows curve vs reference basis, graduation progress, fees, multiplier-adjusted units and reference provenance for every pool.

**What's real:** every address in the README is mainnet; every step was re-read from chain after sending. **What's not yet:** our Pyth Pro key lacks the equity-feed entitlement, so stock references currently come from live on-chain twins with recorded provenance; Lazer is wired and takes over the moment the grant lands.

**Team:** Matthew Karsten (solo). Open-source components: Meteora DBC / DAMM v2 SDKs, Jupiter lite API, Pyth, PreStocks/Tessera/Backpack public APIs.
