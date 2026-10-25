---
id: INBOX-11
title: Paid question: not enough money, refunded, messages off
owner: YOU
area: INBOX
order: 168
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [INBOX-10, INBOX-09, MONEY-03, MONEY-19, HOME-13, UI-02, WALLET-05]
decisions: [R-2, R-9, R-10, R-13, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I6, I7, I8]
---
# INBOX-11 · Paid question: not enough money, refunded, messages off

## Current state

As of 18 Oct 2026, merging (lead): round 2 verified (MERGE) and stacked in batch 17.
- **Status:** merging (lead). Same branches and verdict as INBOX-10 (`wmt/S3`; reports `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S3.md` and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S3-r2.md`): round 1 NOT merge (I7 amount and I6 "Add, then back"), round 2 MERGE. Stacked in batch 17 by MERGE-17; not on main.
- **Merge (MERGE-17):** the full account is in INBOX-10's Current state. The lows are SWEEP-INBOX rows INBOX-10 N1, N2 and F6 (N1 is I7's missing figure while a refund is still moving).
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; the 16 Oct boards of this task differ from the old ones only by that wording. DV2-COPY re-checks this task last.
- **Branches (round 1):** same as INBOX-10 (`wmt/S3`, mobile and backend).
- **Built:** I6 is the ask sheet's not-enough state: "Not enough in your Naira wallet / You need ₦1,523.25. You have ₦900.00." (the Hub's total and balance) and "Add ₦623.25" (the Hub's shortfall), which opens Add money (W15) with that shortfall (`/add-money?short=62325` in tests, `?short=60000` on the stack). I7 is the thread after the window passed: the amount and the time are the wallet's own record (`refundedKobo`, `settledAt`), "coming back" while the refund is moving, and a question with no wallet record says only that it was refunded; "Try again · ₦1,500" opens the sheet with the old words. I8: "Messages off" and the note on the profile, and the same state in the thread's composer, for a creator who switched it off and for one the no-reply rule paused (read from `GET /paid-dm/creators/{id}/availability`, G-ME-02-1).
- **Stack run (`s3_test`, ports 7890 to 7897, backend `wmt/S3` on the Nuvion stand-in; Hub balance = stand-in after each step):** a fan paid ₦1,500: a DOUBLE TAP on Send made one question and one debit (5,000,000 to 4,850,000); a wrong PIN moved nothing; a lost answer (the Hub took the payment, the phone heard 500) then the PIN again: the same key twice, one payment, one question, one debit (4,850,000 to 4,700,000); the creator answered with two bubbles and the thread showed "Replied in" and the follow-up offer; the window passed unanswered and the sweep paid every naira back in 56 s (4,700,000 to 4,850,000; "you got ₦1,500 back ... today at 22:36"); the no-reply rule then paused that creator and the thread said so in place of the composer; a fan with ₦900 saw I6 and Add opened W15 with the shortfall; a creator switched off and a creator paused showed Messages off. The stack charges a ₦0 bank charge, so ₦23.25 is only in the jest cases (the quote's shape).
- **Checks:** mobile tsc 0, eslint 0 on changed files; jest paid-ask, inbox, chat, visitor 213 pass (45 new: 18 model, 19 flow, 3 row, 5 profile); gates and `check_tasks` 0 fail. Backend tsc 0, eslint 0, gates 0 fail, contract:build, wallet spec 13 pass. NOT RUN: full suites (CI), Fintava (never), a verifier. Mobile CI fails in seconds while billing is off.

Round 2, built after the check (18 Oct 2026, Sonnet builder, T2). Same branches as INBOX-10 (`wmt/S3`, mobile and backend); the full account is in INBOX-10's Current state.
- **I7 (F1):** the amount is now the Hub's real returned total (`HoldView.refundedKobo` = what the refund moved, ₦1,523.25 with a 2,325 kobo charge), checked live: "you got ₦1,523.25 back" and the fan's balance +152,325.
- **I6 (F2):** after Add money and back the sheet asks one fresh quote and shows Send (live: ₦900, deposit, back, "₦2,100.00 available", paid). Round 1's "₦0 bank charge on the stack" is replaced by a 2,325 kobo run.

Status set to review by the records sync, 25 Oct 2026: merged as app c5118ae6, verifier PASS in the lead's merge log, 18 Oct (v S3 r2 MERGE both).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-11.md](history/INBOX-11.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
