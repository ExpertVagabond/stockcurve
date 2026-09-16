# Day zero for a Solana hackathon project

What to set up before writing code, learned the expensive way on Stocklana (Sept 2026). Every item below cost us
hours or SOL because we did it in the wrong order. Do them first; they take an afternoon.

## 1. Identity (one mailbox, everything keyed to it)
- [ ] **Name.** Pick it once. Check the X handle, the GitHub name, the domain, and the npm name in one sitting. (We renamed a
      project mid-week and re-did a deck, a site and a repo for it.)
- [ ] **Mailbox on a domain you own** (`project@yourdomain`). Not a personal Gmail. Every service below signs up with it.
- [ ] **X handle** for the project, and one for the agent if there is one, created with that mailbox. Authorize your existing
      X developer app for them (one app, many accounts; posting is ~$0.015 a post, reading is what costs).
- [ ] **Logo, avatar, banner** once, from one source image: 512 square, 1500×500 banner, a 2:3 poster. Every form asks.
- [ ] **GitHub repo** created empty, public or private decided now, `.gitignore` with `node_modules/`, `.env`, `out/` before the
      first commit. (We committed node_modules on day one.)

## 2. Sponsor accounts and keys (from inside the linked account)
- [ ] Sign up for every sponsor dashboard with the project mailbox: Clawpump, Pyth Pro, Meteora, PreStocks, Tessera, Discord.
- [ ] Generate API keys **from the dashboard you'll use**, not from a docs-page form. (Our Clawpump key launched tokens fine
      and returned 403 on every agent route for a day: "API key is not linked to a user account.")
- [ ] Read each sponsor's **own posts and dashboard** before their docs. Clawpump's dashboard had a native "launch on Meteora
      paired with a stock" button; we rebuilt that path by hand through the API first.
- [ ] Ask for entitlements on day one (Pyth equity feeds took a Discord thread we started on day four).

## 3. Money
- [ ] One project hot wallet, funded once, with a **1 SOL floor** you never spend: congestion retries, rent, sponsor deposits
      and creation fees all needed SOL at moments the wallet was at 0.02.
- [ ] Decide what gets rent before launching anything: 13 demo pools cost ~2 SOL, almost all of it account rent that can't
      be closed. One pool with a post behind it would have taught the same lesson.
- [ ] No trading with the project wallet. Six hours and 0.4 SOL taught us that fees and dev dumps dominate at small size.

## 4. Plan the submission before the build
- [ ] For each track, write **one sentence** naming the artifact a judge will click. Build those six things first; depth
      only where a sponsor's own criteria ask for it.
- [ ] Write the "why now" with sources (a volume number, a sponsor announcement) on day one; it doesn't change.
- [ ] Console or page that shows everything live, from day two. Judges and sponsors click links; they don't read repos.

## 5. Talk early
- [ ] Reply on each sponsor's hackathon post with what's live, the day it's live. Clawpump's account replied to ours in
      twelve minutes and described the stack accurately; that reply is now in the submission.
- [ ] Post from the project/agent handle, not your personal one, on a cadence, with numbers and sources only.

## 6. Verify everything you claim
- [ ] Read every on-chain claim back from chain before writing it down. A "+21%" exit that netted −0.0004 SOL and a
      "95% have no venue" line that turned out to be 48-of-1,158 both got caught only because we checked.

## The order, in one line
Mailbox → name and handles → logo → repo → sponsor accounts and linked keys → wallet with a floor → one artifact per track
→ live page → sponsor replies → then everything else.
