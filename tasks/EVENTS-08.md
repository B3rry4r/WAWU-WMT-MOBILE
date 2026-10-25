---
id: EVENTS-08
title: My events, organiser dashboard, call it off, called off
owner: YOU
area: EVENTS
order: 152
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [EVENTS-04, EVENTS-05, EVENTS-09, EVENTS-10, UI-02, EVENTS-01]
decisions: [R-10, R-37, R-69]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E17, E18, E25, E11]
---
# EVENTS-08 · My events, organiser dashboard, call it off, called off

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead) (partly built, see Not built). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-08.md`, verdict merge, two lows). Stacked in batch 8 by MERGE-8. Built by a Sonnet builder. Backend `wmt/EVENTS-08` `b10d7f0` on `wmt/MERGE-7` `9c40478` (no migration; one new route, `GET /events/{id}/call-off`). Mobile `wmt/EVENTS-08` on `wmt/MERGE-7` `0aca612c`.
- **Built (mobile, `src/features/events/organiser/`, routes `src/app/events/mine.tsx`, `dashboard/[id].tsx`, `links/[id].tsx`):**
  - E17 My events: the Hub's events at every status with its pill (Live, In review, Sent back with the reviewer's note, Removed, and Called off). A live event opens E18, a sent-back one opens E22; In review, Removed and Called off have no screen so the row is not pressable. Sales are `GET /events/mine/sold`; a count the Hub did not send leaves the date alone. The My events tab is on E1 and the wizard (`chrome.tsx`), and E16 has its My events button beside Done.
  - E18 dashboard: Sold, Checked in, Left, "Yours after our cut" and the share, all from `GET /events/{id}/dashboard` and `/events/options` (no figure typed). Rows drawn: At the door (opens E19), Shared links (`3 links · 22 sales` from `/referrals`).
  - E25 call-off sheet over E18: the Hub's `buyersToRefund` (`GET /events/{id}/call-off`; with no answer the line says it without a number), a reason (10 to 500 characters, the Hub's check), Cancel and refund everyone, Keep the event. After the cancel the sheet says what the Hub's answer says: refunds sent, `ordersLeftToSweep` still going out, `refundsNeedingAttention` that could not be sent automatically. A second cancel shows the Hub's 409 words. A called-off event shows its reason and no longer offers the cancel.
  - Shared links: the host's links with the Hub's code and sales, and a field to make another (`POST /events/{id}/referrals`).
  - E11: a void ticket of a called-off event reads `GET /events/orders/wallet/{orderId}`: "₦7,500 is back in your Naira wallet." (the order's `returnedKobo`, so "₦15,000 for your 2 tickets" for a two-ticket order), "on its way" while the hold has not refunded, "could not be sent automatically" when the host was already paid (G-793). With no answer, or a free order, the plain "not valid" note stands.
- **Backend:** new route `GET /events/{id}/call-off` answers `{ buyersToRefund }` (distinct buyers of a priced ticket; host only; spec in `event-running.contract.spec.ts`; contract regenerated). It is a route and not a dashboard field because the protected route suite locks the dashboard's answer.
- **Decisions the task did not name (change if the lead rules otherwise):**
  - Copy follows the lead's call-off ruling (EVENTS-10: the buyer gets everything back, the provider's charge included; the wallet provider is Nuvion, R-39 and R-45, and nothing here is built for Fintava), so E25 reads "All 64 buyers get their money back." and E11 does not say "ticket price"; BRIEF E25 and E11 (R-10 default) are superseded and not edited here.
  - A void ticket still shows no QR or code (EVENTS-03's tested behaviour); the board draws a dimmed QR.
  - E17's "Taken down 20 Sep" has no date source (G-EVENTS-08-2): the row says "Taken down".
  - `tests`: `host/__tests__/hostScreens.test.tsx` had one assertion that the My events tab is not drawn until this task; it now expects the three tabs.
- **Not built (filed, not drawn, R-47):** E18's Edit event and Ticket types rows. Two Hub rules decide them (G-833): every `PATCH` sends a live event back to review, and `PUT /tickets` is refused once any tier has sold. They need an owner answer before the wizard's steps are mounted in edit mode.
- **Gaps and shared changes filed:** BACKEND_GAPS G-EVENTS-08-1, G-EVENTS-08-2, G-832 and G-833; SHARED-CHANGES EVENTS-08 #1 (a `danger` Button variant; `DangerButton` stands in), #2, #3 (contract).
- **Pictures:** 390 px, light and dark, from the stack's web export, beside the boards (`render_design.py E17 E18 E25 E11`): scratch `events-08-b/pics/` (E17, E18, E25, E25-result, links, E11).
- **Checks (local, mobile CI is off):** full run 194 suites, 3380 tests passed; typecheck, lint, gates (0 fail, 7 warn: two new PROVISIONAL, G-EVENTS-08-1), baseline and tasks all exit 0; the 21 new tests in `organiser/__tests__`. Backend: typecheck, lint, contract:build; the specs run in GitHub. No Fintava code was touched, run or tested; the stack's Hub ran with the repo default provider setting at a closed port and made no provider call.
- **Next:** a verifier; the lead rules the two decisions above and G-833.

Status set to review by the records sync, 25 Oct 2026: merged as app d37b0c84, verifier PASS in the lead's merge log, 17 Oct.

## Design v2 update (16 Oct 2026)

- Copy only: the organiser dashboard line reads "Yours after our cut ₦408,000 · 85%" (the figure comes from the Hub, never typed; 85/15 stays, R-5). Hosting by tier (E21) is DV2-04 and EVENTS-12.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-08.md](history/EVENTS-08.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
