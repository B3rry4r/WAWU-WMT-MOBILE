---
id: EVENTS-08
title: My events, organiser dashboard, call it off
owner: DEV2
area: EVENTS
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [EVENTS-05, EVENTS-10]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E17, E18, E25]
---
# EVENTS-08 · My events, organiser dashboard, call it off

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py E17 E18 E25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| E17 | My events | Host's events with status pills: Live (64 sold), In review, Sent back (with reviewer's note 'Add the street address.'), Removed (Taken down 20 Sep). |
| E18 | Organiser dashboard | Live event dashboard: Sold 64, Checked in 0, Left 56, 'Yours after WAWU's cut ₦408,000 · 85%', At the door (scan), Ticket types, Shared links '3 links · 22 sales', Edit event, Call the event off. |
| E25 | Call it off | Cancel sheet over E18: 'Cancel this event · This refunds real money · All 64 buyers get their money back. Why: The venue withdrew.' Cancel and refund everyone / Keep the event. |

## Capability checks

- [ ] **E17**: a user can open a live event (E18); open a sent-back event (E22).
- [ ] **E18**: a user can At the door (E19); edit ticket types; manage shared links; Edit event; Call the event off (E25).
- [ ] **E25**: a user can enter reason; Cancel and refund everyone; Keep the event.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E25.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| E17 | partial | EventView carries no sold count; '64 sold' needs a soldCount on /events/mine or one GET /events/{id}/dashboard per row. |
| E18 | partial | Referral rows return revenue only: dashboard() builds byCode.tickets but never increments or returns it, so '22 sales' has no source. netNaira is a computed figure only: no money ever reaches the host (WalletFundingService.run funds Purchase and answered DMs only; grep EventOrder outside event-ticketing finds only admin finance, webhook, payment-link). No GET /events/{id}/referrals list route either (create only). |
| E25 | partial | Refund is flutterwave.refundCharge per EventOrder keyed on flutterwaveTxId; with wallet payment it must be a Fintava credit to each buyer wallet from the account holding ticket money. '64 buyers' on the board is the ticket count; the backend refunds per order (buyers ≠ tickets), no distinct-buyer count is returned by the dashboard. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E17: Creators Summit 64 sold
- E18: Yours after WAWU's cut ₦408,000 · 85% (64 × ₦7,500 = ₦480,000 gross; 85% = ₦408,000)
- E18: Left 56 (implies capacity 120)
- E18: 3 links · 22 sales
- E25: All 64 buyers get their money back

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
