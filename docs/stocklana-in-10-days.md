# Stocklana in 10 days

The order we should have used, with what each day produces. Everything here was actually done at least once in the
stockcurve build; the days just rearrange it. Assumes one builder, ~1.5 SOL, and the day-zero checklist (docs/day-zero-general.md).

| Day | Do | Done means |
|---|---|---|
| **0** | Mailbox, name, X handles, logo set, empty repo with .gitignore + STATUS.md, sponsor accounts and keys from inside each dashboard, wallet funded with a 1 SOL floor. Read every sponsor's pinned post and dashboard. | Every login is one identity; keys work on every route; you know what each sponsor's UI already does. |
| **1** | Scan the field: every submission so far, every sponsor's example. Write one sentence per track naming the artifact you'll ship. Write the "why now" with sources. | `tracks.json` with six rows; nothing built yet. |
| **2** | The obvious artifact per track, simplest form on mainnet: one stock-quoted DBC pool (Meteora), one Clawpump agent token paired with a Sunrise stock **using their dashboard's Meteora launcher**, one pool anchored to a PreStocks mark, one to a Tessera mark, one on the Pyth feeds your key actually has. Five launches, ~0.3 SOL. | Six links that resolve on Solscan. |
| **3** | Live page: every pool, reference, basis, status, and the six-track row. Deploy it. Reply on each sponsor's hackathon post with the live link. | Console URL public; at least one sponsor reply. |
| **4** | The product surface: a launch page where a wallet signs one transaction to create a pool on your partner config. Create one real-size config ($10k graduation). | A stranger can launch without you. |
| **5** | Keeper: watch, migrate, band after graduation, sweep fees on a schedule. Agent identity on Clawpump (SAID, prospectus, marketplace, x402 endpoint). | Launch-and-earn runs unattended; the agent is verifiable. |
| **6** | Submit. Paste-ready doc, all six tracks ticked, links only to things that resolve. Then keep editing in place. | Submission filed with a week to spare. |
| **7** | One real launch on the real-size config, with distribution: the post from the project handle, the sponsor threads, the community that already watches launches. Size to what bots plus a few humans can fill; bots are a ~1 SOL floor, not the buyer. | A pool with outside buyers, or a measured "no" and why. |
| **8** | Video: two minutes, narrated, six beats matching the six rows. Re-read every number in it from chain first. | mp4 on the Desktop, reviewed. |
| **9** | Sponsor follow-ups (entitlements, key links, replies), README and submission text final, Hacker House / demo script written. | Nothing left that depends on someone else. |
| **10** | Buffer. The day you'll need because a transaction expired, a sponsor replied, or a stat was wrong. | Submitted, verified, quiet. |

What this order skips on purpose: thirteen demo pools (two SOL of rent), any trading with the project wallet, building an
API path a sponsor's dashboard already offers, and making the video before the six rows exist.
