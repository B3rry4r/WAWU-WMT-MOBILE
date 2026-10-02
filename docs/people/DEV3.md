# Developer 3

> **2 Oct 2026 · R-37: the app is now "Who Made This", with a new logo.** WAWU is
> out of the app's name and logo. Draw the logo only with `<BrandMark>`
> (`src/components/BrandMark.tsx`), never the canvas's `wawu-icon`/`wawu-logo`
> images. Copy that names the app says "Who Made This"; WAWU Credits, WAWU ID,
> "WAWU's fee" and the other names listed in DECISIONS.md R-37 stay. Your tasks
> that carry R-37: EVENTS-01, EVENTS-03 (header mark), EVENTS-06, EVENTS-08, LEGAL-02, LEGAL-06, PROS-01, SCHOOLS-06, SCHOOLS-08. Read R-37 before you build any of them.

You own these features end to end: the screens AND the backend behind them.
If a screen needs something the backend doesn't serve, fixing the backend is
part of your task.

## What you own

- **Schools:** listings, courses and intakes, applying and enrolling, school
  fees and their payment, a school paid by bank transfer when it isn't on WAWU
  (SCHOOLS-*). School fees split 85/15 (R-12).
- **Professionals and Legal:** professional profiles, credentials, listings,
  asking a professional, legal requests and their payment (PROS-*, LEGAL-*).
  Legal prices are set by WAWU in admin, never in the app or code (R-14). No
  Trust Score (R-18).
- **Events:** browse, tickets and their payment, hosting, refunds, the door
  check-in (EVENTS-*). Hosting is for verified accounts; ₦0 events are allowed
  (R-8); a refund returns the ticket price (R-10).

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
  `docs/designer/BRIEF.md` for every artboard you build (R-29).
- **Links between screens:** a hub builds only the rows whose screen exists;
  the task that builds a screen adds its own way in, as drawn (R-27,
  `docs/WORKFLOW.md` section 7).
- **Branches:** `docs/WORKFLOW.md` section 8. Branch from the newest main,
  merge main in before verification, never rebase or force-push.
- **Compare pictures with pictures:** render the artboard, screenshot your
  screen at 390 px in both themes, open both.

Your list: `tasks/INDEX.md`, section "Developer 3".

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
