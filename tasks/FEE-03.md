---
id: FEE-03
title: App: every withdrawal and payment shows the fee and what is received under the new schedule; switched-off products hidden; adding money by account number only
owner: YOU
area: MONEY
order: 396
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: [FEE-01]
decisions: [R-139, R-47]
passes: [V1, V2, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FEE-03 · App: the fee and what is received, before every confirm

## Current state

As of 11 Nov 2026.
- **Status:** FIX after verifier round 1 (11 Nov 2026): see tasks/history/FEE-03.md, Verifier report, round 1 (F1 deploy order, F2 abroad button, F8 missing pictures are the blockers to clear). Built 11 Nov 2026 on Hub `wmt/FEE-01` `176859ec`; see the Builder report. Cut by the lead from R-139 points 3, 5 and 11.
- **What exists:** the confirm screens already show fees before the PIN: `features/send/ReviewScreen.tsx`, `features/withdraw/WithdrawScreen.tsx`, `features/abroad/views.tsx` (`AbroadReviewView`), `features/wallet/fx/swap/SwapReview.tsx`, `components/pay-sheet/PaySheet.tsx` (and TipSheets, AskSheets, RequestPaySheet, legal PaySheets), `features/addmoney/model.ts`. They draw today's provider plus WAWU lines.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `VERIFIER.md`
- DECISIONS.md R-139, R-47 (show only what is built)
- tasks/FEE-01.md (the quote's new fields)

## Goal

Before any withdrawal, payout, send, swap or payment, a person sees WAWU's fee (and VAT when on) and the exact amount the receiver gets, taken from the Hub's quote; products switched off are not drawn; adding money shows only the wallet's account number with the bank charge passed on.

## Scope

- Each confirm screen draws the quote's fee, VAT (only when the Hub says it is on), total and "they get" lines; no figure is worked out in the app. The provider's own charge is never shown.
- Swap and receiving dollars from local banks are not drawn while the Hub says they are off.
- Add money: the account number only; no card, no USSD.
- A refusal below the minimum, or with a fee bigger than the amount, reads plainly on the screen.
- Ships to usewmt.com (R-134). Pictures at 390 px, dark and light, of every confirm screen beside its artboard.

## Capability checks

- [ ] A user withdrawing NGN 10,000 sees a fee of NGN 100 and NGN 9,900 reaching the bank (or the amount plus fee, as the Hub's quote says) before the PIN.
- [ ] A user does not see swap while it is off.
- [ ] A user adding money sees only their account number.

## Builder report

Rounds 0, 1 and 2 are in [tasks/history/FEE-03.md](history/FEE-03.md); the latest is "Builder report, fix round 2" (F1 fallback, F2 abroad button, F3 dollar sheet, F5 labels, F7 totals, pictures in `audits/FEE-03/round2/`).

## Verifier report

Round 1 (verifier, 11 Nov 2026): FIX. The full report is in [tasks/history/FEE-03.md](history/FEE-03.md), "Verifier report, round 1". `npm run check` exit 0 on `6a62f0f1`.

## Owner sign-off
