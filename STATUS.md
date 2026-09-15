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
