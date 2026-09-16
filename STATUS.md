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

## Pool 7 + lean curve + sizing (2026-09-16 ~00:10 UTC)
- launch-shared.mjs: pool on an existing partner config, unit derived from ladder. sPLTR/SOL Enj6KRMb… on sHOOD's config
  2NEDFzx7…; keeper graduated; all 3 fees claimed again (same feeClaimer). 7 pools in console. Wallet 0.28 SOL.
- curve.mjs CURVES {standard (−15%,1:3:4), lean (−5%,1:1:6)}; `--curve lean`. size.mjs: RKLB $50k raise → lean opening
  capital $7.6k (15%) vs standard $29.3k (59%); listing $1.5k + curve ~$400 at graduation. RKLB reference needs Pyth grant
  (Backpack mint RKLBnAXG… exists, no price/badge; Pyth push 119d stale).

## Pool 8 RKLB lean + seed profile (2026-09-16 ~00:40 UTC)
- sRKLB/SOL 5hTGV4FQJkuNLBS9CJG2iAgunQp74EETNM9fcpj4r4tC: lean curve, manual ref $63.55 (Yahoo close 9/15; Pyth push print $127.86 was 119d stale & 2× wrong),
  atomic (0 bps), keeper graduated (keeper/status now honor manual provenance), DAMM v2 Cdg8v5kX…, all 3 fees claimed. 8 pools.
- `seed` profile: partner LP 90% unlocked/10% locked, no listing/creation fee → self-funded venue with recoverable capital. Validated
  (HOOD/SOL float 150 = $822 raise); NOT launched — needs ~20 SOL. Wallet ≈ 0.19 SOL.

## Pool 9 seed venue (2026-09-16 ~01:20 UTC)
- sSNDK/SOL EnrkDGJc1L77nsBmpAcbLs9SssALuf7McSWPYvLw7fEt on seed config CsrQWn2J… (created by launch-atomic; pool tx failed on
  Metaplex 32-char name limit → relaunched via launch-shared on that config). Lean curve, live SNDK twin ($1,527), 0 bps open.
  Keeper self-funded 0.895 SOL raise → DAMM v2 836qKA34…; lp.mjs withdrew 50% unlocked LP: 0.402 SOL + 2.43 sSNDK back (tx QJVT7Vtb…).
- Gotchas: token name ≤ 32 chars; leftover auto-retry in curve.mjs; keeper SOL-quote native balance. Wallet ≈ 0.62 SOL. 9 pools.

## Pool 10 + Ondo + audit (2026-09-16 ~02:30 UTC)
- Ondo: 28 mints (…ondo vanity), 28 badged; RKLBon $63.51 = live RKLB twin. twinOf: xStock→Backpack→Ondo. ONDO map in config.
- Pool 10 sRKLB-DK/DKNG ERBiYKkLF15Uqgx3vpPpDw4kgWhnYzz5ADR1YWJWhm1b: Backpack quote + Ondo reference, atomic 0 bps; external buyer
  8Fux3NDf… graduated it 9s after launch (paid our 3% listing + fees); keeper migrated (DAMM v2 4BpA4qG8…) + exited; claim.mjs ✓.
- Audit (docs/audit.md): priority fee on all sends, loadPoolRecord by --pool (decimals mislabel bug), --no-exit, status quote feed,
  refresh.mjs. Console 10 pools. Wallet ≈ 0.93 SOL + 0.18 DKNG + 2.4 sSNDK etc.

## Median/TWAP reference + USD graduation (2026-09-16 ~03:00 UTC)
- prices.mjs resolveUsdRobust: median across Pyth Lazer / all twins (xStock+Backpack+Ondo via twinsOf) / Jupiter / fresh push account;
  --twap <sec> samples; --max-spread 2% refusal; low-liquidity flag. Wired into plan (base+quote), keeper, status.
- plan --raise-usd sizes float to a dollar graduation. launch/launch-atomic drift guard: refuses if ref moved >1% since plan (--force).
  Verified: fresh plan passes (+0.00%), 3%-stale plan refused. Not launched (wallet 0.95 SOL).
- Key pages opened for Matthew: Pyth Terminal, Clawpump developers, Helius dashboard.

## Clawpump DONE (2026-09-16 00:20 UTC)
- cpk_ key at ~/.config/clawpump/clawpump.env. pump-pairs = 156 quote assets incl. xStocks + Backpack. Self-funded launch needs only an
  agentId STRING (no dashboard agent). scripts/clawpump-launch.mjs: preflight → pay 0.009218 SOL → launch. scSNDK mint CUnDgEpz… paired
  with Backpack SNDK on pump.fun (Token-2022 quote), 75% fee share → hot wallet. out/clawpump/scSNDK.json.
- Still pending: Pyth equity grant (tab open), Helius RPC key (tab open), submission form.

## DLMM band + inbound watcher + sweep (2026-09-16 ~03:40 UTC)
- dlmm-band.mjs (DLMM SDK via CJS require — ESM build broken): sSNDK/SOL pair HGJHSe53… at ref bin −738, position D2tqGBkg… 25 bins ±3%,
  0.94 sSNDK + 0.159 SOL, 20 bps. sweep.mjs: 9 configs/10 pools, claimed trading fees on 6. keeper: inbound detection + creation-fee claim.
- Pyth key re-verified: same token, equity/xStock/index still 403 — needs an entitlement on the Pyth Terminal account (pythdata.app opened).

## Demo video (2026-09-16 ~04:30 UTC)
- demo/stockcurve-demo.mp4 (85s, 1080p, 6.3MB) + copy on ~/Desktop. Pipeline: demo/record-console.mjs (Playwright webm), demo/record-term.py
  (tmux capture → PIL frames → mp4; --render-only reuses demo/raw/frames.json; marks.json drives caption windows), demo/assemble.py
  (PIL cards + PNG caption overlays; this ffmpeg has no drawtext). Not posted anywhere — Matthew reviews, then attaches to submission.

## Needs Matthew (interactive)
1. Register + submit on hackathons.solana.com (links: repo, console; video optional).
2. Pyth Terminal: equity/xStock feed grant on the Pro token (free grant = crypto majors only; all stock feeds 403).
   With it, `node scripts/plan.mjs` uses live Lazer prices unchanged — worth a second pool (TSLAx quote) for the demo.
3. ~~Clawpump key~~ done — scSNDK launched.

## Next (me)
- 2-min video (terminal run + console) — build, hand over for review, never post.
- Optional: second pool TSLAx-quoted with live Pyth if the grant lands; console history (multiple snapshots).
- Memory + STATUS on every milestone.

Exact next command: `cd "$VS/projects/stockcurve" && node scripts/status.mjs` (sanity), then video.
