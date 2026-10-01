# Dev 3 · Feed and Inbox

You own these features end to end: the screens AND the backend behind them.
If a screen needs something the backend doesn't serve, fixing the backend is
part of your task.

## What you own

- **The design-system components** everyone uses (UI-*). Day 1, because every
  screen is built from them.
- **Home**: Today, the feed, content detail, TGIF, unlocking content and
  tipping, and their payment paths (HOME-*).
- **Explore**: browse, categories, search (EXPLORE-*).
- **Inbox**: the inbox list, paid questions and their payments, free chat,
  sending and requesting money in chat, communities, WAWU Credits, push
  notifications and live chat updates (INBOX-*).

## Rules that matter most for you

- **Components are made once** in `src/components/`. A screen needing a variant
  asks for a prop in `SHARED-CHANGES.md`; nobody copies a component.
- **Compare pictures with pictures**: render the artboard, screenshot your
  screen at 390 px in both themes, open both.
- **Payments go through Dev 1's money core.** You build the unlock, tip, credits
  and paid-question payment paths on top of it; you never talk to Fintava
  directly.
- **Expo changes every SDK.** Read `docs/EXPO-AGENTS.md`; install with
  `npx expo install`.

Your tasks: `tasks/INDEX.md`, section "Dev 3".
