# How to submit a project on Solana in 10 days

Worked example throughout: **stockcurve**, our Stocklana entry (Solana Foundation, Sept 2026): a Meteora DBC launch primitive for
tokenized stocks. Every "example" cell below is a real, clickable artifact from that build.

One deliverable per day. Each day ends with something a stranger can click. If a day's deliverable isn't done, the next
day doesn't start; the order is the point.

| Day | Deliverable | Done means | Stocklana example |
|---|---|---|---|
| **0** | **Identity.** Mailbox on your domain, name and handles, logo set, empty repo, every sponsor account and key made from inside its dashboard, one wallet with a 1 SOL floor. | One login for everything. Keys work on every route. | stockcurve@purplesquirrel.media, github.com/ExpertVagabond/stockcurve, keeper wallet `8nqQzTU5…`, Clawpump/Pyth/Meteora accounts |
| **1** | **The six sentences.** Read every sponsor's pinned post and dashboard, scan the submissions so far, then write one sentence per track naming the artifact a judge will click. Write the "why now" with sources. | `tracks.json`. Nothing built. | `site/tracks.json`: six rows, one per sponsor; "why now" = $200M/day tokenized-stock volume, Meteora's Backpack announcement |
| **2** | **Six launches.** The simplest form of each sentence, on mainnet, using the sponsor's own tool where one exists. | Six links that resolve on Solscan. | sGME/AAPLx (Meteora), $SOLENT/SPCX (Clawpump's launcher), pOPENAI/USDC (PreStocks mark), pKALSHI/USDC (Tessera mark), sTSLA-QQ/QQQx (Pyth Pro) |
| **3** | **The live page.** Every artifact, its status, and the six-track row on one URL. Reply on each sponsor's hackathon post with that URL. | A public page, and at least one sponsor reply. | stockcurve.purplesquirrelnetworks.workers.dev; @clawpumptech replied in 12 minutes: "that's the full stack working" |
| **4** | **The product surface.** The one thing a user does without you: a page where a wallet signs one transaction. Plus one real-size config so it isn't a toy. | A stranger can use it. | /launch: wallet signs one tx to create a pool on partner config `4tmRWBk8…` ($10k graduation) |
| **5** | **Automation and identity.** The keeper or bot that runs unattended on a schedule; the agent's on-chain identity if there is one. | It runs while you sleep, and it's verifiable. | keeper.mjs (migrate, DLMM band, 30-min fee sweep); agent Solent SAID-verified, prospectus, marketplace, x402 endpoint |
| **6** | **Submit.** Paste-ready text, all tracks ticked, links only to things that resolve. Then keep editing behind the link. | Filed, four days early. | docs/submission.md pasted into hackathons.solana.com/hackathons/stocklana/submit; deadline Sept 25, 4 PM ET |
| **7** | **One real launch with distribution.** Sized to what can actually be filled, announced from the project handle, in the sponsor threads, to the people who already watch launches. | Outside users, or a measured "no" and why. | sRKLB2/SOL seed launch at 1.35 SOL graduation: no outside buyer in 2 h without a post; the lesson that bots fill ~1 SOL and stop |
| **8** | **The video.** Two minutes, narrated, one beat per track. Every number read back from chain first. | mp4 reviewed, not posted. | demo/stockcurve-demo.mp4 (2 min, cloned VO); the "95% have no venue" line caught and corrected to 48 of 1,158 before it shipped |
| **9** | **Follow-ups.** Entitlements, key links, sponsor replies, README and submission text final, demo script for the next room. | Nothing left that depends on someone else. | Pyth entitlement request, Clawpump key-link request, docs/demo-script.md for Hacker House London |
| **10** | **Buffer.** The transaction that expires, the sponsor who replies, the stat that was wrong. | Submitted, verified, quiet. | expired transactions during congestion, the Walmart rug, the McDonald's re-entry: all absorbed by slack |

## What this order skips on purpose
Demo pools by the dozen (rent you never get back), trading with the project wallet, rebuilding a button the sponsor's
dashboard already has, and cutting the video before the six sentences exist.

## The whole thing in one line
Identity → six sentences → six launches → live page and sponsor replies → product surface → automation → submit → one real
launch → video → follow-ups → buffer.
