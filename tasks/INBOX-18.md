---
id: INBOX-18
title: Answer paid questions (creator)
owner: DEV2
area: INBOX
order: 167
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-04, INBOX-08, INBOX-12, INBOX-17, WALLET-16, UI-02, ME-14, INBOX-19]
decisions: [R-11, R-13]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I9, I10, I11]
---
# INBOX-18 · Answer paid questions (creator)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I9 I10 I11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I10, I11 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I9 · Paid DMs · to answer**: Creator view of the Paid DMs chip: "Waiting on your reply ₦4,500 from 3 questions", rows sorted by time left with price and countdown, red under 2 hours, Settings link.
- **I10 · Reply**: Creator thread with the fan question, "Reply in 1h 12m to earn ₦1,275. That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500 back." (BRIEF I10) and a reply composer.
- **I11 · Answered**: Answered thread: "₦1,275 is in your wallet. Replied in 49 minutes." (for a creator without a wallet yet: "... it lands when you open your wallet"; R-11, BRIEF I11)

## Brief changes (build these, not the canvas)

- **I10**: "That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500 back." No "full amount". (Why: rule 6.)
- **I11**: "₦1,275 is in your wallet. Replied in 49 minutes." (for a creator without a wallet yet: "... it lands when you open your wallet"). The arrow becomes "Earnings show in W39". (Why: R-11. Earnings land in the wallet by themselves.)

## Capability checks

- [ ] **I9**: a creator sees questions sorted by time left with the total waiting; can tap a question (I10) and open Settings (I21).
- [ ] **I10**: a user can type reply; Reply.
- [ ] **I11**: a creator sees "₦1,275 is in your wallet" (or that it lands when they open one) and can tap Message to continue in the free chat (I12).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From I1's paid DM row (creator) and Paid DMs chip (INBOX-04), and from Reply on M31 (ME-14), a creator can reach I9 or I10 (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **I9**: partial. Missing: No status filter, no deadline ordering, no pending-total aggregate; client would have to page through everything. Add ?status=awaiting_response&sort=deadline and a total.
- **I10**: served.
- **I11**: partial. Missing: Backend moves the share into the wallet automatically; the canvas says the creator moves it from Earnings (W39). R-11 settles it: earnings land in the wallet, and I11's copy follows the brief. "Message" after answering opens the free chat (I12, R-13).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I9: ₦4,500 from 3 questions
- I9: ₦1,500 each
- I9: 1h 12m / 9h 04m / 21h 40m left
- I9: red under 2 hours
- I10: earn ₦1,275
- I10: 85% of ₦1,500
- I10: 1h 12m left
- I11: ₦1,275 added to your earnings
- I11: Replied in 49 minutes

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
