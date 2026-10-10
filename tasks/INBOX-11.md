---
id: INBOX-11
title: Paid question: not enough money, refunded, messages off
owner: YOU
area: INBOX
order: 168
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-10, INBOX-09, MONEY-03, MONEY-19, HOME-13, UI-02, WALLET-05]
decisions: [R-2, R-9, R-10, R-13, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I6, I7, I8]
---
# INBOX-11 · Paid question: not enough money, refunded, messages off

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
