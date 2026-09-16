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

## The APIs, in the order you need them (Stocklana stack)

Each one unlocks the next. Get the key on day zero; first call it on the day listed.

| # | Day | API | What it does for you | First call |
|---|---|---|---|---|
| 1 | 0 | **Helius RPC** (`mainnet.helius-rpc.com/?api-key=`) | Reads and writes to Solana without the public RPC's 429s; enhanced tx history for audits; DAS for holder counts. Everything else sits on it. | `getSlot`, then a balance read of the project wallet. |
| 2 | 0 | **X developer app** (OAuth 1.0a for posting, OAuth 2.0 for third-party connects) | Posts from the project and agent handles; the same app authorizes every account. Reading is what costs; post-only stays cheap. | Authorize the project handle; post nothing yet. |
| 3 | 1 | **Jupiter lite API** (`lite-api.jup.ag/price/v3`, `/swap/v1`) | Live USD prices for any mint (the twin prices your reference is a median of) and swaps between anything; no key. | `price/v3?ids=<twin mints>`: is there a price at all? |
| 4 | 1 | **Pyth** (Pro/Lazer `latest_price` with a token; MCP `get_symbols` for ids) | The equity reference when your key is entitled to the feed; authoritative over twins. Ask for entitlements the day you get the key; most equities 403 by default. | One `Equity.US.TSLA/USD` call to learn what the key returns. |
| 5 | 1 | **PreStocks** (`prestocks.com/api/prestocks`) and **Tessera** (`rest-api.tessera.pe/v1/public/token-details`) | Pre-IPO mark prices and mints; reference-only (their tokens can't be a DBC quote). Public, no key; Tessera flaps, retry. | Fetch both, diff the valuations for the same company. |
| 6 | 2 | **Meteora DBC SDK** (`@meteora-ag/dynamic-bonding-curve-sdk`) | Builds the config (curve, fees, profile), creates the pool, atomic first buy, quotes and swaps, migration to DAMM v2, fee claims. `deriveTokenBadgeAddress` tells you which stock mints can be a quote. | Badge check on every stock mint, then one config + pool. |
| 7 | 2 | **Clawpump partner API** (`clawpump.tech/api/v1`, `cpk_` key) | `GET /pump-pairs` lists the stock quotes it can pair; `POST /launch/self-funded` mints an agent token on a stock pair (preflight → pay → confirm); `/price` is a second reference source. Agent routes need the key linked to the dashboard account. | `/pump-pairs`, then one self-funded launch. |
| 8 | 2 | **Clawpump dashboard** (not an API: Launch Token → Meteora) | Their native "agent token on a Meteora DBC curve quoted in a stock"; the track's sentence, done in their UI. SAID identity, prospectus, marketplace, x402 endpoint live here too. | Launch the agent's own token paired with a Sunrise stock. |
| 9 | 3 | **DexScreener** (`api.dexscreener.com/tokens/v1/solana/<mint>`) | Pair, liquidity, volume, price change for anything graduated; the console's market data. Doesn't tick pump.fun curve prices. | Read your own pools; expect empty until they trade. |
| 10 | 4 | **Cloudflare Workers** (`wrangler deploy`, `wrangler secret put`) | Hosts the console and the launch page; a Worker route proxies RPC so the Helius key never reaches the browser; serves token metadata. | Deploy the static console; add `/rpc` when the launch page ships. |
| 11 | 5 | **Meteora DLMM SDK** (`@meteora-ag/dlmm`, `createRequire` import) | Concentrated liquidity around the reference after graduation; also the stock-paired pool under any Clawpump token. Fees come from flow here. | One ±5% band on a graduated pool. |
| 12 | 5 | **Meteora cp-amm SDK** (`@meteora-ag/cp-amm-sdk`) | Reads the DAMM v2 pool the curve migrated into: vault balances, positions, unlocked vs locked LP, fee claims, withdrawals. | Read a migrated pool's vaults; withdraw the seed profile's unlocked LP. |
| 13 | 7 | **PumpPortal** (`pumpportal.fun/api/data` stream, `/api/trade-local`) | Only if you go near pump.fun: launch stream is free, per-token trade streams need a funded key, `trade-local` builds unsigned buys/sells. Route sells through Jupiter instead when a pool is on Meteora. | The launch stream; nothing else until you've read the ledger. |
| 14 | 9 | **Solana hackathons form** (`hackathons.solana.com/…/submit`, wallet sign-in) | The submission itself. Links only to things that resolve. | Submit on day six; edit in place after. |

What "in order" means: nothing on this list is called before the one above it exists. Prices before curves, curves before
pools, pools before pages, pages before posts, and the form last.
