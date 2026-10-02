# Developer 2

You own these features end to end: the screens AND the backend behind them.
If a screen needs something the backend doesn't serve, fixing the backend is
part of your task.

## What you own

- **Inbox:** the inbox list, paid questions (paid DMs) and their payments,
  free chat between any two users, sending and requesting money in chat,
  communities, WAWU Credits, push notifications and live chat updates
  (INBOX-*). Rulings: R-13 (free chat; paid-message warning at 20%, pause at
  30%), R-5 (WAWU Credits are a count, never naira), R-19 (paid DMs hold money
  in WAWU's merchant wallet until answered).
- **Bills:** electricity, airtime, data and cable TV (BILLS-*). Bills debit
  WAWU's merchant wallet, so a user's bill is a wallet transfer then the bill
  payment, with a reversal if the biller fails (`docs/fintava/naira-api.md`).
  Each disco has its own minimum; read them from Fintava, never assume ₦500
  (`docs/fintava/sandbox/`).
- **Ads:** the TGIF sponsored card, serving and counting ads, and the admin
  side. Ads are booked by the WAWU team and invoiced by hand (R-15) (ADS-*).

## Rules that matter most for you

- **Expo changes every SDK.** Read `docs/EXPO-AGENTS.md`; install packages with
  `npx expo install`.
- **Components and theme are shared.** Build from `src/components/` and
  `@/theme`. Need a new prop, component, route or layout change? Ask in
  `SHARED-CHANGES.md` (the current developer owns the route graph and
  components); build everything else meanwhile.
- **Payments go through the money core** (pay-from-wallet, the PIN sheet, the
  pay sheet, owned by You). You build your features' payment paths on top of
  it and never talk to Fintava directly. Tasks that need the money core first
  say so in `tasks/INDEX.md`.
- **Nobody has a wallet until they open one** (R-6). Every payment screen you
  build checks for a wallet and, if there isn't one, hands over to "Open your
  wallet" (MONEY-13).
- **Fees:** the buyer pays Fintava's charge (R-10, `docs/fintava/fees.md`);
  screens show the breakdown and the total, never a literal.
- **Designs are final; changes come from the brief.** Check
  `docs/designer/BRIEF.md` for every artboard you build.
- **Branches:** `docs/WORKFLOW.md` section 8. Branch from the newest main,
  merge main in before verification, never rebase or force-push.
- **Compare pictures with pictures:** render the artboard, screenshot your
  screen at 390 px in both themes, open both.

Your list: `tasks/INDEX.md`, section "Developer 2".

## Keep going: you don't wait to be prompted

You are given one prompt, once. After that you work through your list on your
own until it is finished or every remaining task is blocked:

1. `git fetch origin && git merge origin/main` (or branch from the newest
   main). Read `tasks/INDEX.md` from main every time: the order can change.
2. Take your first task that isn't `done`, `review` or in progress and whose
   `depends_on` are all `review` or `done`.
3. Build it in a builder agent (`docs/roles/BUILDER.md`), then verify it in a
   separate verifier agent (`docs/roles/VERIFIER.md`). Fix and re-verify
   until it passes.
4. Merge the newest main in, run `npm run check`, push `wmt/<ID>`. The lead
   merges it; you don't wait for that.
5. Go back to step 1 straight away.

Only a real blocker stops a task, never a question you can answer from the
docs. Write the blocker and the fact that unblocks it in the task file, push,
and move on to your next startable task. Ask the owner only when every
remaining task is blocked, and ask once, listing them all.
