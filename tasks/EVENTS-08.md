---
id: EVENTS-08
title: My events, organiser dashboard, call it off, called off
owner: DEV3
area: EVENTS
order: 151
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EVENTS-04, EVENTS-05, EVENTS-09, EVENTS-10, ME-12, UI-02, EVENTS-01]
decisions: [R-10, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E17, E18, E25, E11]
---
# EVENTS-08 · My events, organiser dashboard, call it off, called off

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E17 E18 E25 E11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md`: its entries for E18, E25, E11 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

E18's 'Edit event' and 'Ticket types' reuse E13 to E15, and 'Shared links' lists the host's referral links; no undrawn screen is invented.

## Artboards

- **E17 · My events**: Host's events with status pills: Live (64 sold), In review, Sent back (with reviewer's note 'Add the street address.'), Removed (Taken down 20 Sep).
- **E18 · Organiser dashboard**: Live event dashboard: Sold 64, Checked in 0, Left 56, 'Yours after WAWU's cut ₦408,000 · 85%', At the door (scan), Ticket types, Shared links '3 links · 22 sales', Edit event, Call the event off.
- **E25 · Call it off**: Cancel sheet over E18: 'Cancel this event · This refunds real money · All 64 buyers get the ticket price back (BRIEF E25). Why: The venue withdrew.' Cancel and refund everyone / Keep the event.
- **E11 · Called off**: Ticket view for a cancelled event: 'This event was called off · ₦7,500 is back in your Naira wallet.' The amount is the ticket price (BRIEF E11). Moved here from EVENTS-03: its cause is E25.

## Brief changes (build these, not the canvas)

- **E18**: Edit event and Ticket types reuse E13 to E15; Shared links lists the host's referral links. (Why: the rows are drawn; their screens reuse the canvas's own.)
- **E25**: "This refunds real money. All 64 buyers get the ticket price back." (Why: the refund default (R-10): Fintava's charge on each ticket isn't returned, so "their money back" promises more than the buyer gets.)
- **E11**: keep the sentence; the amount is the ticket price (sample ₦7,500), filled by the app. Don't add "in full" or "everything you paid". (Why: the refund default (R-10): a refund returns the ticket price, not Fintava's charge.)

## Capability checks

- [ ] **E17**: a user can open a live event (E18); open a sent-back event (E22).
- [ ] **E18**: a user can At the door (E19); edit ticket types; manage shared links; Edit event; Call the event off (E25).
- [ ] **E25**: a user can enter a reason; Cancel and refund everyone (each buyer gets the ticket price back, EVENTS-10); Keep the event.
- [ ] **E11**: a buyer of a called-off event sees that it was called off and the ticket price back in their wallet.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E25.
- [ ] From E1's My events tab (EVENTS-01) and E16's My events (EVENTS-04), a host reaches E17 (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **E17**: partial. Missing: EventView carries no sold count; '64 sold' needs a soldCount on /events/mine or one GET /events/{id}/dashboard per row.
- **E18**: partial. Missing: Referral rows return revenue only: dashboard() builds byCode.tickets but never increments or returns it, so '22 sales' has no source. netNaira is a computed figure only: no money ever reaches the host (WalletFundingService.run funds Purchase and answered DMs only; grep EventOrder outside event-ticketing finds only admin finance, webhook, payment-link). No GET /events/{id}/referrals list route either (create only).
- **E25**: partial. Missing: Refund is flutterwave.refundCharge per EventOrder keyed on flutterwaveTxId; with wallet payment it must be a Fintava credit to each buyer wallet from the account holding ticket money. '64 buyers' on the board is the ticket count; the backend refunds per order (buyers ≠ tickets), no distinct-buyer count is returned by the dashboard.

- **E11**: partial. Missing: Refund destination changes: board says money returns to the buyer's Naira wallet. Needs a wallet credit (Fintava transfer from wherever ticket money is held back to the buyer wallet) replacing flutterwave.refundCharge; myTickets response has no refund amount/status (EventOrder.refundedAt/refundReference not exposed).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E17: Creators Summit 64 sold
- E18: Yours after WAWU's cut ₦408,000 · 85% (64 × ₦7,500 = ₦480,000 gross; 85% = ₦408,000)
- E18: Left 56 (implies capacity 120)
- E18: 3 links · 22 sales
- E25: All 64 buyers get their money back
- E11: ₦7,500 is back in your Naira wallet

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
