---
id: INBOX-20
title: Request money and pay a request
owner: DEV2
area: INBOX
order: 141
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-04, INBOX-15, INBOX-19, UI-02]
decisions: [R-13, R-10, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I16, I17, I18, I19, I20]
---
# INBOX-20 · Request money and pay a request

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I16 I17 I18 I19 I20` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I18 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I16 · Request sheet**: Request from Femi sheet: amount ₦12,000, what it's for, "Nothing moves until they tap Pay", Request ₦12,000.
- **I17 · Request sent**: Chat bubble "You requested ₦12,000 · Logo edits, round 2 · Waiting for Femi".
- **I18 · Request from someone**: Incoming request bubble from Kemi with Decline and, before the PIN, the breakdown (₦15.75 + ₦10 = ₦25.75), "Pay ₦12,025.75" and "Kemi gets ₦12,000" (BRIEF I18), then PIN W11.
- **I19 · Request paid**: The request bubble flips to Paid and the conversation continues.
- **I20 · Money filter**: Inbox filtered to money moments only: tips/transfers in, requests, sends, refunds (e.g. "Refunded ₦200 · no reply"). Moved here from INBOX-04: its rows have a real cause only once requests and sends exist.

## Brief changes (build these, not the canvas)

- **I18**: paying a request is a send to a WAWU user, so show the breakdown before the PIN (in the bubble, or a short review sheet): Fintava's charge ₦15.75 + WAWU's fee ₦10 = ₦25.75, Total ₦12,025.75, "Kemi gets ₦12,000"; button "Pay ₦12,025.75". (Why: R-10 and rule 5, as I14.)

## Capability checks

- [ ] **I16**: a user can enter amount and reason; Request.
- [ ] **I18**: a user can Decline; see ₦15.75 + ₦10 = ₦25.75 and "Pay ₦12,025.75" with "Kemi gets ₦12,000"; enter their PIN.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] **I20**: a user can tap the Money chip and see only money moments (tips and sends in, requests, sends, refunds), each opening its chat.
- [ ] From I13 (INBOX-19) a user can tap Request money and reach I16, and from I1 (INBOX-04) a money-request row and the Money chip (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **I16**: missing. Missing: Needs MoneyRequest(id, conversationId, requesterWawuId, payerWawuId, amount, memo, status pending|paid|declined|cancelled, paidLedgerRef) and POST create.
- **I17**: missing. Missing: Request bubble and status updates need the MoneyRequest model and live delivery.
- **I18**: missing. Missing: Needs POST pay (wallet debit/transfer + status paid, idempotent) and POST decline, plus notification to requester.
- **I19**: missing. Missing: As I18.
- **I20**: partial. Missing: Tips and DM refunds exist as data but there is no aggregation by counterpart; P2P transfers and requests do not exist. Tips are not linked to any chat (the entry map calls a tip "shown as a bubble" in chat).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I16: ₦12,000
- I16: Logo edits, round 2
- I17: ₦12,000
- I18: ₦12,000
- I20: Sent you ₦5,000
- I20: Requested ₦12,000
- I20: You sent ₦25,000
- I20: Refunded ₦200

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
