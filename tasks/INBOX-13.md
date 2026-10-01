---
id: INBOX-13
title: Out of credits, buy credits, credits added
owner: DEV3
area: INBOX
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [INBOX-16, MONEY-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I27, I28, I29]
---
# INBOX-13 · Out of credits, buy credits, credits added

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py I27 I28 I29` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| I27 | Out of credits | Room with 0 credits: "You're out of credits. Reading stays free. Buy credits to send messages here." with Buy credits. |
| I28 | Buy credits | Buy WAWU Credits sheet: packs 50/₦500, 120/₦1,000 (Popular), 300/₦2,000 (Best value), "Credits don't expire and can't be cashed out", Pay from wallet, Buy 120 credits · ₦1,000 then PIN. |
| I29 | Credits added | "120 credits added. Paid ₦1,000 from your Naira wallet. You have 120 credits." Back to chat. |

## Capability checks

- [ ] **I27**: a user can Buy credits.
- [ ] **I28**: a user can pick a pack; Buy; enter PIN.
- [ ] **I29**: a user can Back to chat.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I27.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| I27 | served | served |
| I28 | partial | Packs match the server table. Payment is a Flutterwave charge, not a wallet debit with PIN; CreditPurchase.flutterwaveTxRef is the lookup key. |
| I29 | partial | Crediting is served; "paid from your Naira wallet" is not (Flutterwave). Note: the board shows 48 + 120 = 120, which reads as the balance replaced rather than added; the server adds. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I27: 0 credits
- I27: Reading stays free
- I28: 50 credits ₦500
- I28: 120 credits ₦1,000
- I28: 300 credits ₦2,000
- I28: Credits don't expire and can't be cashed out
- I28: Naira wallet · ₦485,250.75
- I29: 120 credits added
- I29: Paid ₦1,000
- I29: You have 120 credits

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
