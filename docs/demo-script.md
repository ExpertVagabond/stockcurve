# Hacker House / Breakpoint walkthrough (2 minutes, laptop, no video)

Open two tabs before you start: the console and the launch page. Everything below is live; nothing is a slide.

**0:00 · Console** (stockcurve.purplesquirrelnetworks.workers.dev)
"Backpack has 1,158 pre-deployed stock mints on Solana. 48 are issued. The other 1,100 have no way to find a price, because a stock with zero holders can't use a memecoin curve. So the pool is quoted in the stock itself, the curve is anchored to the live reference, it opens 5% under and graduates 5% over." Scroll the rails: 14 pools, each with reference, basis, status.

**0:30 · One thing per track row**
Point at the six tiles. "One artifact per sponsor, each one on mainnet." Click $SOLENT/SPCX: "This one was launched with Clawpump's own Meteora launcher, quoted in Sunrise's SpaceX token, run by a SAID-verified agent. Clawpump's account described it as the full stack working."

**1:00 · Launch page** (/launch)
Connect Phantom. Type a ticker (RKLB). Build plan: "Reference is a median across the twins and Clawpump's feed; it refuses if they disagree by more than 2%. The unit is derived so this ticker lands on an existing partner config's ladder. Opening buy, fees, rent, all shown before you sign." Click Preview: "That's the real transaction simulated on mainnet." Don't sign unless you mean to.

**1:30 · Revenue**
"Seed profile: a bot filled the 0.9 SOL raise in seconds; we withdrew 0.79 SOL of partner LP on-chain. Issuer profile: listing fee, creation fee, trading fees, all claimed on chain every 30 minutes. At a $50k raise that's about $1.5k on day one. The $10k config is live; the first real-sized launch is the next step."

**1:50 · Close**
"Everything you saw was read back from chain before it was shown. Repo is public." Hand them the console URL.

If asked "is it a security?": the s-tokens are launch curves priced off a stock, not claims on the equity; the plumbing is the product.
If asked "what broke?": PumpPortal streams need a funded key; Clawpump is one token per agent id; DexScreener doesn't tick curve prices; congestion needs a resend loop. All in the repo.
