---
id: INBOX-18
title: Answer paid questions (creator)
owner: DEV3
area: INBOX
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [INBOX-08, INBOX-17]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I9, I10, I11]
---
# INBOX-18 · Answer paid questions (creator)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py I9 I10 I11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| I9 | Paid DMs · to answer | Creator view of the Paid DMs chip: "Waiting on your reply ₦4,500 from 3 questions", rows sorted by time left with price and countdown, red under 2 hours, Settings link. |
| I10 | Reply | Creator thread with the fan question, "Reply in 1h 12m to earn ₦1,275. That's 85% of ₦1,500. Miss it and Bisi gets the full amount back." and a reply composer. |
| I11 | Answered | Answered thread: "₦1,275 added to your earnings. Replied in 49 minutes. It moves to your wallet from Earnings (W39)." |

## Capability checks

- [ ] **I9**: a user can tap a question; open Settings.
- [ ] **I10**: a user can type reply; Reply.
- [ ] **I11**: a user can Message (continue).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| I9 | partial | No status filter, no deadline ordering, no pending-total aggregate; client would have to page through everything. Add ?status=awaiting_response&sort=deadline and a total. |
| I10 | served | served |
| I11 | partial | Backend moves the share into the wallet automatically; the canvas says the creator moves it from Earnings (W39). Which model wins is a ruling. "Message" after answering implies continued chat, which the single-reply DM model does not support. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

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
