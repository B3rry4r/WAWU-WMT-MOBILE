---
id: EVENTS-06
title: Buy a ticket: pay, PIN, ticket, still confirming
owner: YOU
area: EVENTS
order: 108
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, EVENTS-01, EVENTS-03, EVENTS-07, UI-02]
decisions: [R-6, R-8, R-10, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: [E3, E4, E5, E10]
---
# EVENTS-06 · Buy a ticket: pay, PIN, ticket, still confirming

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder on mobile `wmt/EVENTS-06`, stacked on `wmt/MERGE-7` (`0aca612c`, backend `9c40478`). No backend, wawu-id or web change: EVENTS-07 and EVENTS-13 (merged in batch 7) already serve everything these screens read. No migration. No PR.
- **Next:** an independent verifier (V1, V4 to V10). V10 is the real Android phone only (R-24).
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; DV2-COPY re-checks this task last.
- **What is built** (all under `src/features/events/`, routes `src/app/events/[id].tsx` and `src/app/events/orders/[orderId].tsx`):
  - **E2** draws the quantity steppers, the running total and Get tickets again (the first open tier starts at 1; a tier cannot pass what is left; the whole order cannot pass 50, `roomFor`). Without the route's `buy` handlers the screen draws none of them (R-47).
  - **Get tickets** makes the order (`POST /events/{id}/orders/wallet`, one `Idempotency-Key` per basket, so a second tap answers the same order). A basket of ₦0 is issued by that call: straight to E5, no wallet, pay sheet or PIN (R-8). No wallet (`wallet_not_open`, `wallet_opening`) goes to Open your wallet (A26). The Hub's own sentence shows for `event_order_limit`.
  - **E3** is the shared `PaySheet`: Tickets, "Bank charge" (and "WAWU's fee" only when the Hub's quote has one), Total, "Pay from wallet" with the balance in the quote. A quote past its time is asked for again before the PIN. Short of money shows the bank's figures and Add money; over today's limit and an order-limit refusal are blocked states, not failures.
  - **E4** is the shared `PinSheet`, "Approve ₦X to <event>"; the pay sheet steps aside while it is up. `X-Transaction-Pin` and `Idempotency-Key` go on `POST /events/orders/wallet/pay`.
  - **Exactly once:** one payment key per quote, sent again unchanged after a wrong PIN or a lost answer (`buyApi.ts`, `useTicketBuy.ts`). The payment is written to the phone before it leaves (`buyIntent.ts`, secure store) and removed when the Hub decides; a first payment the phone cannot keep is not sent. A payment the Hub took but did not answer is found by reading the order, never paid again.
  - **E10** (the Hub's `processing`) replaces the tiers and the button with "Paid, still confirming. Don't pay again. Your ticket shows up in a minute." and Refresh; the order is read every 4 s and on Refresh, and goes on to E5 when `paid`. Leaving and coming back (or closing the app) shows E10 again, not Get tickets. A `failed` order shows the Hub's reason on E2 and Get tickets works again.
  - **E5** (`/events/orders/<id>`, replaces E2 so Back never lands on Get tickets): "You're in. Show this at the door.", the QR and code (the Hub's), tier and holder name, Add to calendar (the phone's own new-event screen, `expo-calendar/legacy`, no permission; the browser build opens the calendar's add page), My tickets. Several tickets show one at a time. The same page reads a `processing` order (Refresh) or a `failed` one.
- **Decisions the task did not name (change if the lead rules otherwise):** (1) the sheet's subtitle reads "1 × Regular · Sun 12 Oct"; (2) an event with no end is held 3 hours in the calendar (`PROVISIONAL(EVENT-CALENDAR-HOLD)`); (3) polling is 4 s (`PROVISIONAL(EVENT-ORDER-POLL)`); (4) the pay sheet hides while the PIN sheet is up; (5) a failed order after payment is a banner on E2, not the sheet's failed state, because Try again could not pay a failed order.
- **Filed:** BACKEND_GAPS G-827 (the 50-ticket cap counts the whole order and is not served; the app keeps a copy), G-828 (`EventOrderEventView` has no `format`, so an online event's ticket card says its location). SHARED-CHANGES EVENTS-06 #1 (open: `PaySheet` joins the verb and total with " · ", the artboard draws "Pay ₦7,515.75"; until it lands the button reads "Pay · ₦7,515.75") and #2 (contract already regenerated in MERGE-7e).
- **Checks:** see the builder report in `tasks/history/EVENTS-06.md`.
- **Provider (lead note, 17 Oct, R-39, R-45):** nothing built here names or depends on a wallet provider: the app calls the Hub's `/events/orders/wallet` routes, which go through `WALLET_PROVIDER`, and the label is "Bank charge". No Fintava code was built or touched, so the rollback is unaffected. **NOT RUN:** a purchase through a Hub with `WALLET_PROVIDER=nuvion` and the Nuvion stand-in. `scripts/dev/stack.sh` at `wmt/MERGE-7` has no `WALLET_PROVIDER` switch and the Nuvion stand-ins are in-process doubles under `test/nuvion/` that a stack cannot start, so the pictures come from the web export with a browser stand-in answering the Hub's events and wallet routes in the contract's shapes. A verifier with a stack that runs Nuvion should buy a ticket end to end (E3, PIN, E5, and E10 by making the provider answer pending).
- **NOT RUN:** V10 on a real Android phone (the calendar screen, the biometric key, brightness); the rest of the list is in the builder report in `tasks/history/EVENTS-06.md`.
- **History:** `tasks/history/EVENTS-06.md`.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E3 E4 E5 E10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md`: its entries for E3, E4 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: a QR renderer (E5), `expo-calendar` (Add to calendar). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E3 · Pay**: Order review sheet over E2: 1 × Regular, Tickets ₦7,500, Fintava's charge ₦15.75, Total ₦7,515.75, funding source 'Pay from wallet · Naira wallet · balance available', button 'Pay ₦7,515.75' (BRIEF E3).
- **E4 · PIN**: PIN keypad over the order sheet: 'Enter your PIN · Approve ₦7,515.75 to WAWU Creators Summit' (BRIEF E4), then 'PIN accepted'.
- **E5 · Ticket**: Success: 'Your ticket · You're in. Show this at the door.' QR, code K7QX-4M2P-9WLA-3RTE, tier + holder name, Add to calendar, My tickets.
- **E10 · Still confirming**: After PIN: 'Paid, still confirming. Don't pay again. Your ticket shows up in a minute.' with Refresh.

## Brief changes (build these, not the canvas)

- **E3**: the breakdown: Tickets ₦7,500, Fintava's charge ₦15.75, Total ₦7,515.75; button "Pay ₦7,515.75". (Why: R-10 and the purchases default (ticket money is held in WAWU's own wallet until the event, R-19).)
- **E4**: "Approve ₦7,515.75 to WAWU Creators Summit". (Why: rule 5.)

## Capability checks

- [ ] **E3**: a user reviews the order, sees ₦7,500 + ₦15.75 = ₦7,515.75 and taps "Pay ₦7,515.75" (E4).
- [ ] **E4**: a user can enter their 4-digit PIN (MONEY-09).
- [ ] **E5**: a user can show QR; Add to calendar; go to My tickets (E6).
- [ ] **E10**: a user can Refresh.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E3, E4, E10.
- [ ] A user gets a ticket to a ₦0 event without a wallet, a pay sheet or a PIN (R-8).
- [ ] From E2's Get tickets (EVENTS-01), a user reaches E3 (this task adds it, as drawn).
- [ ] E2 draws the ticket quantity steppers and the running total again, beside Get tickets, as the artboard has them (this task adds them; EVENTS-01 built them and FIX-30 took them out of E2 until a buy button exists, R-47). `src/features/events/TicketStepper.tsx` is built and held for this. The E2 test that pins their absence is rewritten in this task: a user sets a quantity per tier, sees the total, and taps Get tickets.
- [ ] E2 gets screen-level tests again for what the steppers do there: a tier cannot be raised past what is left (the per-tier maximum), and a free pick totals Free. FIX-30 moved the maximum test to `ticketStepper.test.tsx` (the stepper alone) and dropped the free-total test with the total, so neither is pinned at the screen until this task wires the steppers back.
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **E3**: missing. Missing: No buyer wallet debit exists. EventTicketingService.buy() calls flutterwave.initCharge and returns flutterwaveConfig for a hosted/inline Flutterwave checkout; there is no Fintava client anywhere in wawu-backend/src (grep 'fintava' = 0 hits) and the only wallet is CreatorWallet (a Flutterwave payout subaccount, creators only) whose WalletEntryKind is earning|withdrawal|reversal, with no spend/debit kind. Change: buy() must create a pending EventOrder and either (a) return an order to be confirmed with a PIN, then debit the buyer's Fintava wallet, or (b) debit immediately; the flutterwaveConfig response field disappears.
- **E4**: missing. Missing: Needs a wallet PIN: set/change/reset endpoints, hashed storage, attempt counter + lockout, and the ticket debit authorised only after PIN verify. If Fintava issues/validates the PIN, needs that integration instead.
- **E5**: served. Missing: With wallet payment the issue step is no longer behind verifyOrder(transaction_id, tx_ref); tickets are issued on confirmed wallet debit (same issueOrder transaction).
- **E10**: partial. Missing: Today 'still confirming' is a Flutterwave charge awaiting verify/webhook. With wallet payment it becomes a Fintava debit whose status is pending: needs a GET order-status route (none exists; only verify) and a Fintava webhook/requery path replacing the Flutterwave webhook lookup on EventOrder.flutterwaveTxRef.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E3: Fee: No fee (on ticket purchase)
- E3: Naira wallet · ₦485,250.75 available
- E3: Total ₦7,500
- E5: ticket code format K7QX-4M2P-9WLA-3RTE

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-06.md](history/EVENTS-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
