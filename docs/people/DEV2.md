# Dev 2 · Account, Me and Events

You own these features end to end: the screens AND the backend behind them.
If a screen needs something the backend doesn't serve, fixing the backend is
part of your task.

## What you own

- **The app shell and session**: the five tabs, sign-in storage, the API
  client wiring, tester builds (SHELL-*). Day 1, because everyone builds on it.
- **Sign-up and sign-in**: BVN, phone check, selfie, the sign-up sequence in
  WAWU ID, and the screens (AUTH-*).
- **Settings**: notifications, privacy, blocking, password, deletion (SETTINGS-*).
- **Me**: profile, someone else's profile, edit profile, featured works,
  create and publish, verification ticks and their payment, saved, purchases,
  notifications (ME-*).
- **Events**: browse, buy tickets and their payment, my tickets, hosting,
  running the event at the door (EVENTS-*).

## Rules that matter most for you

- **Expo changes every SDK.** Read `docs/EXPO-AGENTS.md`; install with
  `npx expo install`.
- **You own the route graph for the tabs.** Other people's screens add route
  files but never edit `_layout.tsx`.
- **Payments go through Dev 1's money core** (pay-from-wallet, PIN sheet, pay
  sheet). You build the tick and ticket payment paths on top of it; you never
  talk to Fintava directly.
- **Users already on WAWU have no BVN and no wallet.** Sign-in must lead them
  to "open your wallet" the first time they touch money.

Your tasks: `tasks/INDEX.md`, section "Dev 2".
