# Lane: MOBILE-A (Dev 2)

Mobile. You build the app shell, the session, the PIN and pay sheets every
payment reuses, and the account, settings, wallet, bills, legal, events and
professionals screens. You also build the backend gaps behind them (A-50 to
A-59).

## Repos

`wawu-wmt-mobile` (Expo SDK 57, Expo Router, TypeScript). Backend tasks:
`wawu-backend` or `wawu-id` too.

## Rules that matter most in this lane

- **Read the Expo guide for this SDK** (`docs/EXPO-AGENTS.md`). Expo changes
  every SDK; never trust remembered APIs. Install packages with
  `npx expo install`, never plain npm, so versions match SDK 57.
- **Colours, sizes and fonts come from `@/theme`.** A literal fails the gates.
  Use `font(600)`, not `fontWeight` (custom fonts are chosen by family).
- **You own the route graph for the tabs** (A-01). Other screen tasks add
  route files but never edit `_layout.tsx`; they request changes in
  `SHARED-CHANGES.md`.
- **The PIN sheet (A-04) and pay sheet (A-05) are shared.** Every payment
  screen uses them. Never copy them.
- **Wallet screens build against the mock first** (M-03), then the real API.
  The screen doesn't change when the backend arrives.
- **Users without a wallet yet** (everyone already on WAWU) must be handled on
  every money screen (M-12).

## Order

A-01 to A-05 in Stage 2. Sign-in, settings, events browse and professionals
in Stage 3. Backend gaps in Stage 4. Sign-up in Stage 5. Wallet, bills, legal
and tickets in Stage 6.

Your tasks: `tasks/INDEX.md`, section "Dev 2".
