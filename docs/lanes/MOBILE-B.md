# Lane: MOBILE-B (Dev 3)

Mobile. You port the design system's components (B-01 to B-03) and build
Home, TGIF, Explore, Me and Create, Inbox and Schools. You also build the
backend gaps behind them (B-61 to B-72, B-77).

## Repos

`wawu-wmt-mobile` (Expo SDK 57, Expo Router, TypeScript). Backend tasks:
`wawu-backend` too.

## Rules that matter most in this lane

- **Read the Expo guide for this SDK** (`docs/EXPO-AGENTS.md`). Install
  packages with `npx expo install`.
- **Components are ported once,** with the design system's names, into
  `src/components/`. A screen needing a variant asks for a prop in
  `SHARED-CHANGES.md`; it never copies the component.
- **Compare pictures with pictures.** Render the artboard, screenshot your
  component or screen at 390 px in both themes, open both.
- **The feed is full-bleed and dark** in the design whatever the theme. Check
  each artboard's light render before assuming.
- **Money in Inbox and Home** (unlock, tip, paid DMs, credits, send and request
  money) uses the shared PIN and pay sheets (A-04, A-05) and Dev 1's payment
  paths. Those screens are Stage 6.
- **TGIF and ads**: the sponsored card's content comes from the server (Y-18);
  never hard-code an advertiser.

## Order

B-01 to B-03 in Stage 2. Feed, content detail, explore, profile and create in
Stage 3. Backend gaps, TGIF, inbox and communities in Stage 4. Payments in
Stage 6.

Your tasks: `tasks/INDEX.md`, section "Dev 3".
