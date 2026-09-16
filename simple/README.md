# The obvious thing, per track — one file each

Each file here is the simplest possible use of one sponsor's product. No keeper, no profiles, no resolver, no shared
code beyond `src/config.mjs`. Run one, read it in a minute.

| Track | Command | What it does |
|---|---|---|
| Pyth | `node simple/pyth-stock.mjs TSLA` | Reads `Equity.US.TSLA/USD` from Pyth Pro and prints how far TSLAx on Solana trades from it |
| Meteora DBC | `node simple/meteora-stock-quotes.mjs` | Derives the TokenBadge for every xStock / Backpack / Ondo mint: which stocks can be a DBC **quote** (all 96) |
| Clawpump | `node simple/clawpump-pairs.mjs` then `node scripts/clawpump-launch.mjs --pair TSLA --symbol scTSLA` | Lists the 94 stock quotes Clawpump accepts, then launches a stock-paired token in one call (75% creator fee to your wallet) |
| PreStocks | `node simple/prestocks.mjs` | All 8 PreStocks: SPV mark vs on-chain token price, basis in bps, valuation, mint |
| Tessera | `node simple/tessera.mjs` | The 3 T-tokens: mark, valuation, holders, mint, and how PreStocks values the same company |
| Main | `node scripts/launch-atomic.mjs --base RDDT --quote SOL` | One command → a live stock launch curve on mainnet (pool creation + opening buy in one tx) |

Sample output (2026-09-15):

```
$ node simple/pyth-stock.mjs TSLA
Equity.US.TSLA/USD (Pyth Pro, 0s old): $356.01
TSLAx on Solana (Jupiter): $354.61  →  xStock trades -39 bps below the Pyth equity price

$ node simple/meteora-stock-quotes.mjs
xStocks   20/20 badged → usable as a DBC quote (all)
Backpack  48/48 badged → usable as a DBC quote (all)
Ondo      28/28 badged → usable as a DBC quote (all)

$ node simple/tessera.mjs
T-OpenAI  mark $ 812.79  valuation $950B  holders 8259  mint oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ
           PreStocks values OPENAI at $1182B → 1.24× Tessera
T-Kalshi  mark $ 413.80  valuation $14B  holders 2606  mint TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ
           PreStocks values KALSHI at $32B → 2.26× Tessera
```

Keys (never in the repo): `~/.config/pyth/pyth.env` (`PYTH_ACCESS_TOKEN=`), `~/.config/clawpump/clawpump.env` (`CLAWPUMP_API_KEY=`).
