# Before you build on Solana: the day-zero checklist

For any Solana project or hackathon entry. Everything here takes one afternoon and costs nothing. Skipping it costs days
later, in the order listed.

## 1. One identity
- **Name.** Check the X handle, GitHub name, domain and npm name in one sitting. Renaming after launch means redoing the
  site, the deck, the repo and every sponsor form.
- **Mailbox on a domain you own.** `project@yourdomain`. Not a personal Gmail. Every account below signs up with it, so
  handing the project to a teammate or a buyer is handing over one login.
- **Handles.** Project X account; a second one if an agent or bot will post. Created with the mailbox. One X developer app can
  be authorized by all of them; posting is cheap, reading is what costs.
- **Logo, avatar, banner** from one source image: 512 square, 1500×500, and a 2:3 poster. Every form asks. Do it once.

## 2. Repo before code
- Create it empty. Decide public or private now. `.gitignore` before the first commit: `node_modules/`, `.env`, `out/`, `*.log`.
- Secrets live in `~/.config/<project>/` with 600 permissions, never in the tree, never in a doc or a video.
- A `STATUS.md` with done / next / exact next command, from day one, so any cutoff resumes instead of restarts.

## 3. Accounts and keys, from inside the account you'll use
- Sign up for every sponsor, RPC provider, and data feed with the project mailbox.
- Generate API keys inside the dashboard you'll actually operate from. Keys minted from a docs-page form can be unlinked
  from your account: they work for some routes and 403 on the rest, and you find out mid-build.
- Read each sponsor's dashboard and their pinned posts before their API docs. The button you're about to rebuild usually exists.
- Ask for entitlements (paid feeds, allowlists, partner tiers) on day one. They take days; the ask takes minutes.

## 4. Money
- One project hot wallet, funded once, with a **1 SOL floor you never spend**. Rent, congestion retries, creation fees and
  sponsor deposits all arrive at the wrong moment.
- Know what can't be undone before you sign: locked LP, permanent configs, account rent that never closes. Demo scale
  doesn't make it cheaper; rent is fixed.
- The project wallet does not trade. Small trades lose to fees; that lesson costs more than it teaches.

## 5. Plan the submission, then build
- One sentence per track naming the artifact a judge will click. Build those first, in the simplest form that exists on
  mainnet. Depth only where a sponsor's own criteria ask for it.
- A live page that shows everything, from day two. Judges and sponsors click links; they don't read repos.
- The "why now" with sources (a volume number, a sponsor announcement), written on day one. It won't change.

## 6. Talk early, verify always
- Reply on each sponsor's hackathon post with what's live, the day it's live. Sponsor accounts do reply, and their words end
  up in your submission.
- Post from the project handle on a cadence: numbers and sources, no predictions, nothing that isn't on chain.
- Read every on-chain claim back from chain before you write it down. The claims that sound best are the ones to check twice.

## The order
Mailbox → name and handles → logo → repo → accounts and linked keys → wallet with a floor → one artifact per track → live page
→ sponsor replies → build the rest.
