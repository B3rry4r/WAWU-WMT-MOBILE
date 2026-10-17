---
id: EVENTS-10
title: Refund ticket buyers when an event is called off
owner: YOU
area: EVENTS
order: 149
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [EVENTS-07, MONEY-18]
decisions: [R-10, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# EVENTS-10 · Refund ticket buyers when an event is called off

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder. Backend `wmt/EVENTS-10` `1b0ea03` on `wmt/MERGE-6` `fbf391f`. Mobile record on `wmt/MERGE-6` `70a7895`. No migration, no fenced file, no contract change (the cancel route keeps its answer's shape).
- **Ruling carried out (lead, 16 Oct):** a called-off event gives each buyer back EVERYTHING they paid, Fintava's charge included (`refund(..., { returnCharge: true })`: one move of price + charge, the hold's `refundedKobo` stays the price, WAWU carries the charge). This replaces "the ticket price comes back, not Fintava's charge" in Scope below.
- **What is built** (backend `src/event-ticketing/`):
  - `wallet/event-call-off-refund.service.ts`: for each `paid` wallet order of a called-off event, asks its hold to refund (the same call as a losing buyer and a host who left, no money path of its own), then marks the order `refunded` and voids its tickets. The order flips once the refund is CHOSEN (the hold can only go back to the buyer from then on); the buyer's order view says "on its way" until the hold reads `refunded`, and the hold sweep finishes a move the provider has not confirmed.
  - `event-cancel-hooks.ts`: a registry `POST /events/:id/cancel` runs after it voids the tickets. The wallet module registers into it, so `EventTicketingModule` never imports `MoneyModule`. The route's answer keeps its shape: `ordersRefunded` and `refundsNeedingAttention` now include wallet orders. The web's Flutterwave loop is as it was; an event with no wallet order costs one extra query.
  - Time and connections: refunds go five at a time; each provider call is made by the hold service holding no transaction, connection or lock. The request stops at 15 s; a minute sweep (`event-called-off-refunds`) finishes the rest and anything a crash left, for any called-off event with a `paid` wallet order.
  - Once: the hold decides one way, once, under its own reference. Two cancels at once, a retry and the sweep together move each order's price once (spec).
  - No ticket for a called-off event: issuing tickets takes a share lock on the event row, so a cancel that lands a moment before makes the order `failed` and refunds it, and one that lands after voids the new tickets.
  - My tickets (`GET /events/tickets/held`, `/held/:ticketId`) keeps the void ticket of a refunded order of a called-off event (it would have vanished when the order left `paid`). E11 reads the money from `GET /events/orders/wallet/{orderId}`: `returned.returnedKobo`.
- **Decisions the task did not name (change if the lead rules otherwise):**
  - A called-off event is refunded whether or not it has started: the host is still here and chose to call it off. The "started keeps its holds held" rule is the host-erase path's (the payee is gone).
  - A price already released to the host (the event took place and WALLET-17 paid the share) cannot be refunded by itself: the order stays `paid`, `refundError` says why, the cancel counts it in `refundsNeedingAttention`, and the sweep leaves it. G-793.
  - A free ticket has no payment: nothing is sent, its ticket is void. An unpaid quote stays `pending` and cannot be paid. A debit still being confirmed is refunded when it lands (the existing delivery path).
- **Changed test:** `event-wallet-order.contract.spec.ts` expected a cancel to leave the order `paid` and the hold `held` (EVENTS-07's interim state, round 2 finding 5); it now expects the refund.
- **For EVENTS-08 (mobile screens):** its brief for E25 and E11 says the buyer gets the ticket price back and Fintava's charge is not returned, and bans "everything you paid". That is superseded by the ruling above: the buyer gets back the whole sum (`returnedKobo` is the total). The lead rules the copy.
- **Not done:** the real Fintava sandbox (no keys; the double only); MONEY-16's nightly ledger check was not run on this stack (the spec checks both ledger rows of each refund).
- **Open for the lead:** G-793. A buy-then-cancel loop by two colluding accounts costs WAWU the provider's charge each round (the ruling makes WAWU carry it); a cap or a rule is the lead's call.
- **History:** the builder report is in tasks/history/EVENTS-10.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Calling an event off (E25) returns each buyer's ticket price to their wallet (E11). Host payouts are WALLET-17's (Lead, 2 Oct 2026).

## Scope

Refunds from WAWU's merchant wallet, where ticket money waits (R-19): the ticket price comes back, not Fintava's charge (R-10), and Fintava's charge on the refund is WAWU's (R-31). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] Calling an event off returns each buyer's ticket price to their wallet once (R-10).
- [ ] Running the refund twice pays each buyer once (V8).
- [ ] The ledger and Fintava agree after the refunds (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-10.md](history/EVENTS-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
