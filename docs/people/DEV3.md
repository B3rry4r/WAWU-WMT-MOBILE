# Developer 3

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
