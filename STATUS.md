# stockcurve — STATUS

Stocklana hackathon entry. Deadline **Fri 2026-09-18 16:00 ET**. Submit at
https://hackathons.solana.com/hackathons/stocklana/submit (register first — Matthew, interactive).

Targets: Main track + Best Use of Meteora DBC ($5k) + Stocknized Agent on Clawpump ($5k) + Pyth.

## Live
- Repo (PUBLIC): https://github.com/ExpertVagabond/stockcurve
- Console: https://stockcurve.purplesquirrelnetworks.workers.dev (Worker + static assets, purplesquirrel acct;
  rebuild: `node scripts/status.mjs && node site/build.mjs && wrangler deploy`)
- Handoff PDF: ~/Desktop/Stocklana-Handoff.pdf (1 page)

## Done 2026-09-15 (all mainnet, all independently re-read)
- Swap 0.15 SOL → 0.04386 AAPLx (Jupiter) tx k2ZMaWqr…
- DBC config 8de9pBxf2o4hmXo2kxhiLRvhmjuBmQjJQdiPTn5FQXC2 (quote AAPLx via TokenBadge 8VeVZe3Z…)
- Pool sGME/AAPLx J1gcmbH3QthJahRdXqEAXc7eDbYE6JoWYqGVViGvFLbm, base mint 71cwbrMG…
- 4 buys (+10.3%, +5.2%, +3.5%, +2.8% partial) → curve 100% at exactly the +5% graduation price
- migrateToDammV2 → DAMM v2 pool 7FGmDHJNPhTu4VbRLQL7b5RKMXDD1p8Sm7hDKPWby4gA (isMigrated=1)
- Curve: GME ref $18.65 (Pyth on-chain, 32d stale, FLAGGED), unit 0.1 share, float 5, −15%/+5%,
  weights 1:3:4, fee 300→30 bps exp/1h + dynamic, DAMM v2 25 bps, LP 100% locked. Threshold 0.01426 AAPLx.
- Wallet 8nqQzTU5…TsKF after: 0.153 SOL + ~0.028 AAPLx.
- README with proof table; docs/competitor-scan.md; token metadata meta/sGME.json resolves (200).

## Pool 2 (2026-09-15 evening) — sGME-SPY/SPYx, LIVE reference (GMEx twin via Jupiter)
- config 2stFUjXp…, pool 9rKgkPWtf2fWAd8heFjmrZam6dMiMNAZioTHBLVAfQ6B, base GnfNU67q…, DAMM v2 3qKHCfkELRGMmy97KU5W71ShZbkXMJcSVk3B9NjnJm3a
- SNIPED at t+5s by GQKsdX8C… (flash-loan bot), sold back at t+20s at a loss; curve unaffected. See docs/research-findings.md
- Research: Backpack 1,158 Solana mints / 51 priced / 48 DBC-badged; pre-IPO (Tessera 3, PreStocks 8) = reference only (TransferFee, no badge);
  Clawpump rival pool is self-made SOL config, 252 SOL threshold, 0%.
- Console is multi-pool (out/pools/<name>/ → data/pools.json). Wallet ≈ 0.12 SOL, 0.015 AAPLx, ~0.0025 SPYx.

## Pool 3 (2026-09-15 late) — pOPENAI/USDC pre-IPO curve
- config 7EM9JeCd…, pool 6vyZDFfkDW5GTZ9NbKUVhPmFKgcXYF28GV61hcnHqwfz, base AD8PxCMD…, DAMM v2 99dvULFK5mK5AeVPQvsauXJGCBaYrnkJhoB1GUBhvwYz
- anchor PreStocks OPENAI mark $954.71; secondary $1094 (+1460bps); Tessera T-OpenAI val $950B = 0.80× PreStocks. unit 0.0001, float 60, leftover 1.
- Backpack overlap: badged(48) == priced(48) exactly; 1,110 have neither. Wallet ≈ 0.03 SOL, ~1 USDC, 0.015 AAPLx — NEEDS TOP-UP for anything further.

## Keeper + Pool 4 (2026-09-15 22:00 UTC)
- scripts/keeper.mjs: --watch on DBC program; buy-discount (bisection on swapQuote2), --graduate, migrate, target-sized DAMM v2 exit.
- Real exits: pOPENAI 1.344 @0.09546909 (=ref) tx 5hXZDvES…; sGME-SPY 0.112 @0.001404 (=ref) tx 5gt4rmaa…
- Pool 4 sDKNG/AAPLx eMbF1jwsZ1YNBjcNmYK15FQrAyX8Hz4ksjtvvoSxZ25 (config 8pQ79LJm…, base CAvzhyds…), ref = Backpack DKNG twin via Jupiter.
  Keeper discovered it via logsSubscribe, bought 0.004535 AAPLx → price == ref (tx 2fh18yoK…). Graduate/migrate/exit in progress — see out/keeper.log.
- SOL quote added (wrapped SOL, Pyth Lazer live for SOL/USD). Top-up landed: wallet 0.52 SOL before pool 4.
- Token logos: scripts/make-logos.py → meta/*.png, JSON image fields repointed.

## Pool 5 + submission pack (2026-09-15 ~22:40 UTC)
- ATOMIC launch sRDDT/SOL GretDMXwL3Na7AtVvQzaAuQhVw8zVwsttqVxkYKXE3FP (config, then createPool+firstBuy in ONE tx 5nA1XC87…),
  opened +3 bps vs ref, first tx == creation. Left LIVE on curve at reference (judges can trade). Wallet ~0.42 SOL.
- Pool 4 keeper run complete: exit tx 45FzHKzW… at target. docs/keeper-pool4.log.
- Console: 5 pools. README summary table. docs/submission.md = paste-ready text + links.
- Known: Pyth MCP get_symbols intermittently returns an error string; resolver now tolerates it.

## Pool 6 + issuer profile (2026-09-15 ~23:30 UTC)
- curve.mjs PROFILES {demo, issuer}; issuer = 3% listing fee (Customizable), DAMM v2 20bps+dynamic, 0.02 SOL creation fee.
- sHOOD/SOL 2gZ7X2AZH7gEXirrju5NwJVuLKVVivXVH2RWrWw7qTiu atomic launch (+3bps), keeper graduated (native-SOL balance bug fixed),
  DAMM v2 3oW76MEC…, claim.mjs claimed trading 0.000618 SOL + creation 0.018 SOL + listing 3% (txs in launch.json). Net +0.0195 SOL.
- Console: 6 pools, revenue card on title page, ISSUER tag. Wallet ≈ 0.31 SOL.

## Needs Matthew (interactive)
1. Register + submit on hackathons.solana.com (links: repo, console; video optional).
2. Pyth Terminal: equity/xStock feed grant on the Pro token (free grant = crypto majors only; all stock feeds 403).
   With it, `node scripts/plan.mjs` uses live Lazer prices unchanged — worth a second pool (TSLAx quote) for the demo.
3. Clawpump: sign up at clawpump.tech/developers → cpk_ key → then probe `/api/v1/pump-pairs` to see whether the
   DBC pool can be registered as a stock-paired agent launch (their bounty wording: "using clawpump and Meteora").

## Next (me)
- 2-min video (terminal run + console) — build, hand over for review, never post.
- Optional: second pool TSLAx-quoted with live Pyth if the grant lands; console history (multiple snapshots).
- Memory + STATUS on every milestone.

Exact next command: `cd "$VS/projects/stockcurve" && node scripts/status.mjs` (sanity), then video.
