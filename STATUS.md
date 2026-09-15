# stockcurve — STATUS

Stocklana hackathon entry. Deadline **Fri 2026-09-18 16:00 ET**. Submit at
https://hackathons.solana.com/hackathons/stocklana/submit (register first).

Targets: Main track + Best Use of Meteora DBC ($5k) + Stocknized Agent on Clawpump ($5k) + Pyth.

## Thesis
A DBC launch primitive tuned for tokenized-stock pairs: the curve's start price, graduation band and
fee decay are derived from the Pyth reference price of the underlying, and the pool is quoted in the
xStock itself (TOKEN/AAPLx), not SOL. Issuer console monitors curve price vs reference.

## Done (2026-09-15)
- Source confirmed live; 72 submissions; list hidden until close.
- Competitor scan → docs/competitor-scan.md. Direct rival equitycurve-studio is dry-run only.
- Hot wallet 8nqQzTU5bqH3yjfi2ST1XvaaqWw447enCqnZkxHXTsKF funded: 0.3507 SOL (on-chain confirmed).
  Keypair ~/.config/solana/lp-farm/keypair.json. USDC/xStock quote must be swapped from SOL.
- Meteora TokenBadge EXISTS on mainnet for TSLAx/NVDAx/AAPLx/SPYx → stock-quote DBC pool is permissionless.
  (scripts/check-badges.mjs)
- Pyth: Hermes public API now 401. Pro token stored at ~/.config/pyth/pyth.env — authenticates on
  Lazer ws but has NO feed grants (equity, crypto, indices all "Not entitled"). On-chain push accounts
  exist but stale for equities (AAPL 32d, AAPLX 3d). Feed ids: Lazer 922 Equity.US.AAPL/USD,
  1792 Crypto.AAPLX/USD, 1791 AAPLX/AAPL.RR, 3191 Equity.Index.AAPL/USD (24/7).
- Deps installed: dynamic-bonding-curve-sdk 1.5.12, cp-amm-sdk, web3.js v1, spl-token, hermes-client.

- 2026-09-15 MAINNET: swapped 0.15 SOL -> 0.04386 AAPLx (tx k2ZMaWqr…). Created DBC config
  8de9pBxf2o4hmXo2kxhiLRvhmjuBmQjJQdiPTn5FQXC2 + pool sGME/AAPLx J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm
  (base mint 71cwbrMGTMTAt9m8wbuYt8k3eW6VUGKuLW8Yzn961vuP). Curve: GME ref $18.65 (on-chain Pyth, stale 32d — flagged),
  unit 0.1 share, float 5, -15%/+5%, weights 1:3:4, 300→30bps/1h, DAMM v2 25bps, LP 100% locked. Graduation ≈ 0.01426 AAPLx.
  Details out/launch.json. Wallet after: ~0.17 SOL + 0.0439 AAPLx.
- Metadata URI points at https://raw.githubusercontent.com/ExpertVagabond/stockcurve/main/meta/sGME.json — repo + file NOT yet created (do this).

## Blocked / needs Matthew
- Pyth Terminal: enable feed grants on the token (see checklist in chat). Until then price source
  falls back to on-chain Pyth accounts (stale-flagged) + Jupiter price for AAPLx.
- Clawpump API key (cpk_…) if we want the pool registered on clawpump.tech; otherwise the DBC pool
  alone still satisfies "stock-paired pool using Meteora".

## Next
1. src/pyth.mjs — price source adapter (Lazer ws → on-chain fallback → Jupiter), reports staleness.
2. src/curve.mjs — equity curve builder: reference → DBC config (buildCurveWithMarketCap or custom
   points), fee scheduler decay, graduation band, DAMM v2 migration params.
3. scripts/create-config.mjs + create-pool.mjs — mainnet, quote = AAPLx (badge verified).
4. Swap ~0.1 SOL → AAPLx via Jupiter for quote inventory + seed buys.
5. Monitor page (CF Pages) — curve price vs Pyth reference, graduation progress, multiplier-adjusted units.
6. README + 2-min video + submit.

Exact next command: `node scripts/buy.mjs --quote-amount 0.005` (write it first: swapQuote2 + swap2 against pool J1gcmbH…), then status.mjs, then gh repo create.
Old: `cd "$VS/projects/stockcurve" && node scripts/check-badges.mjs` (sanity) then write src/pyth.mjs.
