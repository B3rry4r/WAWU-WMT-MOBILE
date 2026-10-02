# Developer

> **2 Oct 2026 · R-37: the app is now "Who Made This", with a new logo.** WAWU is
> out of the app's name and logo. Draw the logo only with `<BrandMark>`
> (`src/components/BrandMark.tsx`), never the canvas's `wawu-icon`/`wawu-logo`
> images. Copy that names the app says "Who Made This"; WAWU Credits, WAWU ID,
> "WAWU's fee" and the other names listed in DECISIONS.md R-37 stay. Your tasks
> that carry R-37: AUTH-02 (A1 landing logo), EXPLORE-01 (header mark), EXPLORE-02, EXPLORE-04, HOME-03, HOME-09, ME-01, ME-02, ME-08, SETTINGS-01, SETTINGS-02 (About: mark and "About Who Made This"), SETTINGS-05. Read R-37 before you build any of them.

You own these features end to end: the screens AND the backend behind them.
If a screen needs something the backend doesn't serve, fixing the backend is
part of your task.

## What you own

- **Verifying the repo setup** (SETUP-01). It's first on your list because you
  built none of it.
- **The app shell and session:** the five tabs, sign-in storage, API client
  wiring, tester builds (SHELL-*).
- **The design-system components** every screen is built from (UI-*).
- **Sign-up and sign-in:** email and phone, the phone check, the sign-up
  sequence in WAWU ID, and the screens (AUTH-*). Sign-up asks for no BVN and
  no selfie: those happen later, when someone opens a wallet (R-6, owned by
  You).
- **Settings** (SETTINGS-*).
- **Me:** profile, someone else's profile, edit, featured works, create and
  publish, ticks and their payment, saved, purchases, notifications (ME-*).
- **Home:** Today, the feed, content detail, TGIF, unlocking and tipping, and
  their payments (HOME-*).
- **Explore** (EXPLORE-*).

Inbox moved to Developer 2 and Events to Developer 3 on 2 Oct 2026.

## Rules that matter most for you

- **Expo changes every SDK.** Read `docs/EXPO-AGENTS.md`; install packages with
  `npx expo install`.
- **Components are made once** in `src/components/`. A screen that needs a
  variant gets a new prop, never a copy.
- **You own the route graph.** `_layout.tsx` files are yours. Developers 2
  and 3 ask for route changes in `SHARED-CHANGES.md`; apply them between
  rounds.
- **Payments go through the money core** (pay-from-wallet, the PIN sheet, the
  pay sheet). You build each feature's payment path on top of it and never
  talk to Fintava directly. Tasks that need the money core first say so in
  `tasks/INDEX.md`.
- **Nobody has a wallet until they open one.** That's everyone at first, new
  or existing (R-6). Every payment screen you build checks for a wallet and,
  if there isn't one, hands over to "Open your wallet" (MONEY-13). Earnings
  still accrue without one and land when it opens (R-11).
- **Designs are final; changes come from the brief.** Check
  `docs/designer/BRIEF.md` for every artboard you build (R-29).
- **Links between screens:** a hub builds only the rows whose screen exists;
  the task that builds a screen adds its own way in, as drawn (R-27,
  `docs/WORKFLOW.md` section 7).
- **Compare pictures with pictures:** render the artboard, screenshot your
  screen at 390 px in both themes, open both.

- **Builds:** you have Expo, not Apple or Google. Build and publish to the
  `preview` channel; the owner submits to the stores (`docs/BUILDS.md`).

Your list: `tasks/INDEX.md`, section "Developer".

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
