# Stocklana submission — paste-ready

**Project name:** stockcurve

**One-liner:** A Meteora DBC launch primitive for tokenized-stock pairs: pools quoted in the stock token itself, curves anchored to a live reference price, a keeper that runs the lifecycle, and an atomic launch with no sniper window. Five pools on mainnet in one day.

**Links**
- GitHub: https://github.com/ExpertVagabond/stockcurve
- Live console (all pools): https://stockcurve.purplesquirrelnetworks.workers.dev
- Live pool on the curve right now: https://solscan.io/account/GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP

**Tracks:** Main · Best Use of Meteora DBC · Stocknized Agent on Clawpump · Best Use of PreStocks · Best Use of Tessera · Best use of Pyth market data

**Description (≈250 words)**

95% of tokenized stocks on Solana have no price-discovery venue: Backpack Securities alone has 1,158 stocks with mints and only 48 with any on-chain price (measured, script in repo). Memecoin launch curves are the wrong tool for that — a stock has a fair value.

stockcurve turns Meteora's Dynamic Bonding Curve into an IPO-style launch for equity-like assets. The pool is quoted in a stock token (xStocks or Backpack, both already Meteora-badged) or USDC/SOL. The curve's start (−15%), graduation (+5%) and liquidity weights (thin in the discount, dense around fair value) are derived from a reference price with recorded provenance: Pyth Pro when granted, the Pyth push account on Solana, a live on-chain twin (GME→GMEx, DKNG→Backpack DKNG), or — for pre-IPO names with no exchange print — the PreStocks mark price, cross-checked against the PreStocks secondary and Tessera's valuation.

On mainnet on 2026-09-15 we ran five pools end-to-end (config → pool → buys → curve complete → DAMM v2), across AAPLx, SPYx, USDC, SOL quotes. Four equal buys moved price +10%, +5%, +3.5%, +2.8% on every pool — the curve shape, not luck. A sniper bot hit pool 2 five seconds after creation and sold back at a loss to the 300 bps opening fee schedule.

Then we removed the window entirely: `launch-atomic.mjs` creates the pool and executes the opening buy in one transaction (pool 5 opened 3 bps from reference; its first tx is its creation). And a basis keeper watches the DBC program, buys only the discount, graduates, migrates and exits at target-sized fills — pool 4 was run by it unattended.

An issuer console shows curve vs reference basis, graduation progress, fees, multiplier-adjusted units and reference provenance for every pool.

**What's real:** every address in the README is mainnet; every step was re-read from chain after sending.

**Team:** Matthew Karsten (solo). Open-source components: Meteora DBC / DAMM v2 SDKs, Jupiter lite API, Pyth, PreStocks/Tessera/Backpack public APIs.
