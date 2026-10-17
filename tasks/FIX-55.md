---
id: FIX-55
title: Bank transfer only for a short wallet, and no pay sheet offers Add money until WALLET-05
owner: YOU
area: FIX
order: -55
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
tier: T0
depends_on: []
decisions: [R-47]
passes: [V1, V5, V6]
artboards: []
---
# FIX-55 · Bank transfer only for a short wallet, and no pay sheet offers Add money until WALLET-05

## Current state

As of 17 Oct 2026.
- **Status:** built by a Sonnet builder (tier T0); not yet checked by an independent verifier. Branch `wmt/FIX-55` in the mobile repo only: `origin/wmt/WA` `2c5e1bc2` with `origin/wmt/S2` `6957df6b` merged (never rebased). No backend, wawu-id, contract or migration change.
- **Id and order:** order -55 (a whole number the checker takes): every launch slot below CHECK-3 (298) is taken on this base, the only free orders (311, 339) are after launch. The lead renumbers at merge.
- **Merge note:** S2 and WA both wrote gaps G-880 to G-882. WA's three are renamed G-WALLET-03-1 (W14), G-POINTS-06-1 and G-POINTS-06-2 (PT4) in `BACKEND_GAPS.md`, `tasks/POINTS-06.md` and `tasks/WALLET-03.md`; S2's keep G-880 to G-883. `tasks/history/POINTS-06.md` (not edited) still says G-881 and G-882 for the WA pair.
- **Built (1, lead ruling on POINTS-06):** PT4 draws the "Bank transfer" row only when the quote says the wallet is short of the pack. A wallet that covers it sees the wallet alone (the Hub pays from the wallet, so a transfer card for the full price asked for money that is not needed). A transfer already under way (PIN open, awaiting the money, kept on the phone) stays on screen if the money lands and covers the pack; a picked transfer falls back to the wallet when the row goes away. `src/features/points/BuyScreen.tsx`.
- **Built (2, R-47 until WALLET-05 builds Add money):** `onAddMoney` is optional all the way down and no route passes it, so every pay sheet shows its short notice with no "Add ₦X". Callers changed: `src/app/events/[id].tsx` (E3 ticket sheet), `src/features/credits/BuyCreditsEntry.tsx` (I28, the `credits-add` button now draws only when a caller gives `onAddMoney`), `src/app/chat/[id].tsx` (request pay sheet I17), `src/app/chat/send.tsx` (I14 send sheet), `src/app/preview/pay-sheet.tsx` (dev preview). Props made optional: `EventDetailScreen` `BuyHandlers`, `useTicketBuy`, `useBuyCredits`, `ChatScreen`, `ChatSendScreen`, `useRequestPay`. Already done by WA round 2: `PaySheet`, send review (W10).
- **Tests changed (ruling-driven, SHARED-CHANGES POINTS-06 #2 and FIX-55 #1):** `buyFlow.test.tsx` (the two bank-transfer cases that pinned the old offer now set a short wallet; the "covers the pack" case now asserts no offer; the Send-0 case now says the money landed between quote and purchase; one case added), `chatThread.test.tsx`, `chatSend.test.tsx`, `buyTickets.test.tsx`, `eventsScreens.test.tsx`, `buyCredits.test.tsx` (no Add button, handlers no longer pass `onAddMoney`).
- **Checks:** see the hand-back; the full mobile check runs once per batch.
- **Not run:** GitHub CI, a real device.
- **Next:** a fresh verifier; the lead merges with the batch.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-47; `tasks/POINTS-06.md`, `tasks/WALLET-03.md`, `tasks/WALLET-05.md`

## Goal

(1) PT4's "Bank transfer" is offered only when the wallet is short of the pack. (2) No pay sheet in the app offers "Add ₦X" until WALLET-05 builds Add money; each keeps its short notice.

## Scope

The files listed under Built and the six tests listed under Tests changed. No gate, baseline, contract, backend or fenced file.

## Capability checks

- [ ] PT4 with a wallet that covers the pack shows the wallet row and no Bank transfer row; with a short wallet it shows both.
- [ ] E3, I14, I17 and I28 with a short wallet show "Not enough in your Naira wallet" and no button starting "Add".
- [ ] `grep -rn "onAddMoney" src --include=*.tsx --include=*.ts` finds no route passing it.
- [ ] The points, events, credits, send, chat and pay-sheet tests, typecheck, lint on changed files, `npm run gates` and `npm run tasks` exit 0.

## Owner sign-off
