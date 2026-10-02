---
id: INBOX-20
title: Request money and pay a request
owner: DEV
area: INBOX
order: 158
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-15]
decisions: [R-13]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I16, I17, I18, I19]
---
# INBOX-20 · Request money and pay a request

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I16 I17 I18 I19` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I16 · Request sheet**: Request from Femi sheet: amount ₦12,000, what it's for, "Nothing moves until they tap Pay", Request ₦12,000.
- **I17 · Request sent**: Chat bubble "You requested ₦12,000 · Logo edits, round 2 · Waiting for Femi".
- **I18 · Request from someone**: Incoming request bubble from Kemi with Decline and Pay ₦12,000 (then PIN W11).
- **I19 · Request paid**: The request bubble flips to Paid and the conversation continues.

## Capability checks

- [ ] **I16**: a user can enter amount and reason; Request.
- [ ] **I18**: a user can Decline; Pay ₦12,000; enter PIN.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **I16**: missing. Missing: Needs MoneyRequest(id, conversationId, requesterWawuId, payerWawuId, amount, memo, status pending|paid|declined|cancelled, paidLedgerRef) and POST create.
- **I17**: missing. Missing: Request bubble and status updates need the MoneyRequest model and live delivery.
- **I18**: missing. Missing: Needs POST pay (wallet debit/transfer + status paid, idempotent) and POST decline, plus notification to requester.
- **I19**: missing. Missing: As I18.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I16: ₦12,000
- I16: Logo edits, round 2
- I17: ₦12,000
- I18: ₦12,000

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
