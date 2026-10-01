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
- **Sign-up and sign-in:** BVN, phone check, selfie, the sign-up sequence in
  WAWU ID, and the screens (AUTH-*).
- **Settings** (SETTINGS-*).
- **Me:** profile, someone else's profile, edit, featured works, create and
  publish, ticks and their payment, saved, purchases, notifications (ME-*).
- **Home:** Today, the feed, content detail, TGIF, unlocking and tipping, and
  their payments (HOME-*).
- **Explore** (EXPLORE-*).
- **Events:** browse, tickets and their payment, hosting, the door (EVENTS-*).
- **Inbox:** the inbox list, paid questions and their payments, free chat,
  money in chat, communities, credits, push notifications, live chat updates
  (INBOX-*).

## Rules that matter most for you

- **Expo changes every SDK.** Read `docs/EXPO-AGENTS.md`; install packages with
  `npx expo install`.
- **Components are made once** in `src/components/`. A screen that needs a
  variant gets a new prop, never a copy.
- **You own the route graph.** `_layout.tsx` files are yours.
- **Payments go through the money core** (pay-from-wallet, the PIN sheet, the
  pay sheet). You build each feature's payment path on top of it and never
  talk to Fintava directly. Tasks that need the money core first say so in
  `tasks/INDEX.md`.
- **People already on WAWU have no BVN and no wallet.** The first time they
  touch money, lead them to "open your wallet".
- **Compare pictures with pictures:** render the artboard, screenshot your
  screen at 390 px in both themes, open both.

Your list: `tasks/INDEX.md`, section "Developer".
