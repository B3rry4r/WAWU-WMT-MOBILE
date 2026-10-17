---
id: INBOX-11
title: Paid question: not enough money, refunded, messages off
owner: YOU
area: INBOX
order: 168
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [INBOX-10, INBOX-09, MONEY-03, MONEY-19, HOME-13, UI-02, WALLET-05]
decisions: [R-2, R-9, R-10, R-13, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I6, I7, I8]
---
# INBOX-11 · Paid question: not enough money, refunded, messages off

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): INBOX-10, HOME-13, WALLET-05.
- **History:** none yet. Reports go to tasks/history/INBOX-11.md.
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; the 16 Oct boards of this task differ from the old ones only by that wording. DV2-COPY re-checks this task last.

## Current state

As of 17 Oct 2026, built with INBOX-10 (Sonnet builder, T2), waiting for a verifier.
- **Status:** verifying. Same branches as INBOX-10 (`wmt/S3`, mobile and backend).
- **Built:** I6 is the ask sheet's not-enough state: "Not enough in your Naira wallet / You need ₦1,523.25. You have ₦900.00." (the Hub's total and balance) and "Add ₦623.25" (the Hub's shortfall), which opens Add money (W15) with that shortfall (`/add-money?short=62325` in tests, `?short=60000` on the stack). I7 is the thread after the window passed: the amount and the time are the wallet's own record (`refundedKobo`, `settledAt`), "coming back" while the refund is moving, and a question with no wallet record says only that it was refunded; "Try again · ₦1,500" opens the sheet with the old words. I8: "Messages off" and the note on the profile, and the same state in the thread's composer, for a creator who switched it off and for one the no-reply rule paused (read from `GET /paid-dm/creators/{id}/availability`, G-ME-02-1).
- **Stack run (`s3_test`, ports 7890 to 7897, backend `wmt/S3` on the Nuvion stand-in; Hub balance = stand-in after each step):** a fan paid ₦1,500: a DOUBLE TAP on Send made one question and one debit (5,000,000 to 4,850,000); a wrong PIN moved nothing; a lost answer (the Hub took the payment, the phone heard 500) then the PIN again: the same key twice, one payment, one question, one debit (4,850,000 to 4,700,000); the creator answered with two bubbles and the thread showed "Replied in" and the follow-up offer; the window passed unanswered and the sweep paid every naira back in 56 s (4,700,000 to 4,850,000; "you got ₦1,500 back ... today at 22:36"); the no-reply rule then paused that creator and the thread said so in place of the composer; a fan with ₦900 saw I6 and Add opened W15 with the shortfall; a creator switched off and a creator paused showed Messages off. The stack charges a ₦0 bank charge, so ₦23.25 is only in the jest cases (the quote's shape).
- **Checks:** mobile tsc 0, eslint 0 on changed files; jest paid-ask, inbox, chat, visitor 213 pass (45 new: 18 model, 19 flow, 3 row, 5 profile); gates and `check_tasks` 0 fail. Backend tsc 0, eslint 0, gates 0 fail, contract:build, wallet spec 13 pass. NOT RUN: full suites (CI), Fintava (never), a verifier. Mobile CI fails in seconds while billing is off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I6 I7 I8` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I6, I8 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I6 · Not enough in wallet**: Ask sheet with an insufficient-balance banner "You need ₦1,523.25. You have ₦900.00." and "Add ₦623.25", which opens Add money (W15) with the shortfall prefilled (BRIEF I6).
- **I7 · Refunded**: Thread after the window passed unanswered: "No reply in 24 hours, so you got ₦200 back. It went back to your Naira wallet on Tuesday at 14:10. Zainab earned nothing." with Try again · ₦200.
- **I8 · Creator has paid messages off**: Profile with "Messages off" and "Tolu isn't taking paid messages right now. You can still follow, tip and buy Tolu's work." (BRIEF I8; no shop, R-2, R-9) Designer note: off by choice, or switched off after missing too many.

## Brief changes (build these, not the canvas)

- **I6**: the refund line as on I3 ("your ₦1,500 comes back", no "in full"), then "You need ₦1,523.25. You have ₦900.00." and "Add ₦623.25". (Why: rule 5 (the shortfall uses I3's total) and rule 6.)
- **I8**: "You can still follow, tip and buy Tolu's work." (Why: R-2 and R-9: there is no shop.)

## Capability checks

- [ ] **I6**: with ₦900 a user sees "You need ₦1,523.25. You have ₦900.00." and taps "Add ₦623.25", which opens W15 with the shortfall filled in.
- [ ] **I7**: a user can Try again · ₦200.
- [ ] **I8**: a user can follow; tip (H26); open the creator's work (M5 Content tab).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I6, I7, I8.

## What the backend serves today (from the analysis)

- **I6**: missing. Missing: No payer (fan) wallet, no wallet balance check in the DM send path, no add-money/top-up endpoint. Owned jointly with the wallet flow (W15).
- **I7**: partial. Missing: Refund exists end to end but goes back to the payer's CARD through Flutterwave (POST /v3/transactions/:id/refund keyed by flutterwaveTxId), not to a Naira wallet. A wallet refund would replace DmRefundService.refundOne with a wallet credit/release of the hold.
- **I8**: partial. Missing: The "switched off after missing too many" half does not work: nothing computes or writes CreatorNoResponseTracker, sendInit never checks dmDisabledUntil, and the public profile does not expose the penalty state.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I6: You need ₦1,500. You have ₦900.00.
- I6: Add ₦600
- I7: ₦200 paid
- I7: No reply in 24 hours
- I7: went back to your Naira wallet on Tuesday at 14:10

## Designer notes (⚠, unresolved)

- None.

## Builder report

Built with INBOX-10 (same files): I6 in `AskSheets.tsx`, I7 in `model.refundedCard` and `PaidThreadScreen.tsx`, I8 in `visitor/parts.tsx`, the thread composer and `useAskTerms.ts`. Tests: `askFlow.test.tsx` (I6, I7, I8 in the thread), `VisitorProfileScreen.test.tsx` (I2, I8), `model.test.ts`. Not done: the pause date is not drawn (no board draws it, R-47).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
