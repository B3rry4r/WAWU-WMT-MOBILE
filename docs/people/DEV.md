# Developer

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

Events and Inbox moved to Developer 2 on 2 Oct 2026 (`docs/people/DEV2.md`).

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
- **Compare pictures with pictures:** render the artboard, screenshot your
  screen at 390 px in both themes, open both.

- **Builds:** you have Expo, not Apple or Google. Build and publish to the
  `preview` channel; the owner submits to the stores (`docs/BUILDS.md`).

Your list: `tasks/INDEX.md`, section "Developer".
