# Research findings — 2026-09-15 (evening)

Everything below was measured, not read. Scripts in `scripts/scan-*.mjs`; raw output in `out/backpack-scan.txt`.

## 1. The addressable problem is ~1,100 tokenized stocks with no venue (Backpack)

`GET api.backpack.exchange/api/v1/assets` (public, no key):

| Metric | Count |
|---|---|
| `.US` securities listed by Backpack | 6,387 |
| … with a Solana mint already deployed | **1,158** (all Token-2022; same extension set as xStocks: PermanentDelegate, TransferHook, ScaledUiAmount, Pausable, DefaultAccountState) |
| … with **any** Jupiter price (i.e. any on-chain liquidity) | **51** |
| … already carrying a **Meteora DBC TokenBadge** | **48** (DKNG, RDDT, MSTR, HOOD, INTC, NKE, AMC, COST, BA, RBLX, MU, SKHY, SPCX …) |

So **95% of tokenized stocks on Solana have no price discovery venue at all.** That is the number
behind Meteora's bounty sentence ("price discovery for thinly traded or newly tokenized stock pairs")
and the "life after hackathon" argument: the same one-command primitive we ran twice today works,
permissionlessly, against two issuers (Backed xStocks and Backpack Securities) — 20 + 48 badged quote
tokens today, and Meteora badges are clearly being issued in bulk for stock tokens.

Backpack's mint/redeem API (ED25519-signed, opened to all developers 2026-09-13) is the issuer-side
on-ramp: mint the real security, then float it through a stockcurve launch instead of a dead
DAMM/DLMM pool nobody seeds.

## 2. Pre-IPO tokens (Tessera, PreStocks) — reference yes, quote no

Both APIs are live and public:
- Tessera: 3 T-Tokens (T-OpenAI $812.79, T-Kalshi $413.80, T-SpaceX $423.00) — Token-2022 with
  `TransferFeeConfig` + metadata.
- PreStocks: 8 tokens (ANDURIL, ANTHROPIC, FIGUREAI, KALSHI, NEURALINK, OPENAI, POLYMARKET, SPACEX) —
  Token-2022 with the full xStocks-style extension set **plus** `TransferFeeConfig`.

DBC requires a quote mint with **zero transfer fee** and no badge exists for any of the 11, so none can
be a DBC quote today. But PreStocks publishes **mark price vs token price** per token and the basis is
large and live (SPACEX −20%, OPENAI +15%, NEURALINK +8%, FIGUREAI −9%). A pre-IPO name has no exchange
print, so a DBC curve anchored to the mark price *is* the price discovery — the cleanest fit for the
whole primitive. Path: base = new DBC token per pre-IPO name, quote = USDC or SPYx, reference = mark
price, console shows curve price vs mark vs PreStocks token price. Not built yet.

## 3. Clawpump's "stock-paired" pool is not what it sounds like

The one rival pool (`DtWYmvqE…`, HWEEN) is a **self-made DBC config** — feeClaimer = the rival's own
wallet, quote **SOL**, migration threshold **252 SOL (~$24k)**, 1 pool, 0% progress. There is no
Clawpump partner config on Meteora that we could have "launched through". The Clawpump bounty's
requirement therefore reduces to: a stock-paired Meteora pool + a Clawpump agent wallet holding it.
The `cpk_` key is the only missing piece.

## 4. Snipers watch DBC pool creation — and the fee schedule handled it

Pool 2 (`9rKgkPWt…`, sGME-SPY/SPYx) was created at 20:55:22 UTC. At **20:55:27** a bot
(`GQKsdX8C…`) bought 2.583 of the 5-token float for 0.0036 SPYx via a flash-loan program
(`FLASHX8D…`), paying a 0.0286 SOL priority tip. At **20:55:42** it sold everything back for
0.003429 SPYx. Net: the bot lost ~0.00017 SPYx + the tip; the pool collected the 300 bps opening fee
and returned to its start state; our own four buys then ran the curve exactly as pool 1 did.

Two design consequences worth stating in the submission:
- The exponential fee scheduler (300 → 30 bps over the first hour) is not decoration — it is what
  made the sniper's round trip unprofitable at t+5s.
- A stock-anchored curve is *less* attractive to snipers than a memecoin curve because the graduation
  price is bounded at reference × (1 + premium): there is no vertical segment to front-run.

## 5. Sanity numbers from both mainnet runs

| | sGME/AAPLx | sGME-SPY/SPYx |
|---|---|---|
| Reference source | Pyth on-chain (32d stale, flagged) | **GMEx via Jupiter, live** (xStock twin) |
| Buys → price move | +10.3 / +5.2 / +3.5 / +2.8 % | +11.1 / +4.7 / +3.4 / +2.6 % |
| Graduation | 0.01426 AAPLx ($4.72) | 0.00355 SPYx ($2.68) |
| DAMM v2 pool | `7FGmDHJN…by4gA` | `3qKHCfkE…Jm3a` |
| Sniped? | no | yes, bot lost money, curve unaffected |

The identical decay signature across two quotes and two references is the curve, not luck.
