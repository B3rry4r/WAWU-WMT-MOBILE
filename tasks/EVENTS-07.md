---
id: EVENTS-07
title: Buy event tickets from the wallet (backend)
owner: YOU
area: EVENTS
order: 103
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [MONEY-18, MONEY-13, MONEY-16, WALLET-15, EVENTS-02]
decisions: [R-8, R-10, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# EVENTS-07 · Buy event tickets from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-07.md`, rounds 2 and 3): verdict merge, nothing medium or worse. Stacked in batch 6 (backend and mobile `wmt/MERGE-6`). Built by a Sonnet builder. Backend `wmt/EVENTS-07` `6603fba` (round 2 `541b4bb`, round 1 `0da82ba`, from `wmt/FIX-42` `73f4eb5`, which holds batches 3 and 4, BILLS-04, FIX-40 and FIX-42); mobile `wmt/EVENTS-07` (this record). Migration `20261024010000_event_wallet_orders` (unchanged since round 1). No PR.
- **What is built** (backend `src/event-ticketing/wallet/`): `POST /events/{id}/orders/wallet` makes an order from lines (one per ticket type, so Regular and VIP are one payment, E2) and answers E3's quote (the tickets, the provider's charge, the total, the balance); `POST /events/orders/wallet/pay` pays it with the PIN; `GET /events/orders/wallet/{orderId}/quote` and `GET /events/orders/wallet/{orderId}` (E5's tickets and holder name, E10's Refresh). The web's Flutterwave routes keep their answers.
- **How an order is paid:** a held `event_ticket` payment (R-19): the tickets' price moves into WAWU's account and waits there until the event, the provider's charge is on top (R-10), the 85/15 split is recorded with the payment (R-5). The tickets are made once the debit is confirmed, in one short transaction with the seats taken by conditional updates. If the seats went or the event was called off between the debit and the tickets, the order is `failed` and the buyer gets back everything the payment took, Fintava's charge included (WAWU carries the charge, as for a failed bill; the move is price + charge, the hold's `refundedKobo` stays the price, the ledger shows both sides of the whole sum). The hold is otherwise left alone: WALLET-17 releases the host's share, EVENTS-10 refunds a called-off event, both through `order.walletPaymentId` and `order.holdId`.
- **A free basket (R-8)** is issued in the create request: no wallet, no PIN, no debit, `payment: null`. An optional `Idempotency-Key` makes one tap one order. A mixed basket (a free tier and a paid one) is priced at the paid lines only.
- **Order reference:** `EventOrder.paymentReference` (WAW-EVT-...) and `paymentProvider` (`wallet`, `free`, null for the web's). `flutterwaveTxRef` (required, unique) holds `wawu-event-wallet-<id>` on a wallet order, as the web's free orders hold `wawu-event-free-...`; the old column and `flutterwaveTxId` are kept until after launch.
- **Beside the web's routes (touched services, no change for an order the web made):** `POST /events/orders/:orderId/verify` answers 409 for a wallet order; `POST /events/:id/cancel` leaves wallet orders to their hold; `PUT /events/:id/tickets` removes unpaid wallet quotes that name the tiers it replaces and answers 409 while a payment for one is being confirmed.
- **Round 2 (the verifier's findings 1 to 4):** (1) a host who erases their account: before the purge deletes any event row, each held `event_ticket` price of the host's events goes back to its payer through the hold's own refund, holding nothing across the provider call (the order reads `refunded`, its tickets void). An event with a hold that cannot move now is kept with its orders, names nobody (`hostWawuId` `erased-host`, status `removed`), and a five-minute sweep (`EventHostErasureService`) finishes it and then deletes the event. The purge makes one call, `AccountPurgeHooks.beforeErase`. After a full refund the event still goes (accepted, round 3: the buyer's wallet history keeps the refund). (2) the create route's `Idempotency-Key` header is once; its other answers (`wallet_not_open`, `wallet_opening`, `idempotency_key_reused`, `idempotency_key_required`, `fees_not_set`) are named in the operation's description, not in `@MoneyErrors`, because `wallet-gate-coverage.spec.ts` and `money-moving-coverage.spec.ts` make a route that documents them there run the wallet gate and the fees guard, and a free basket needs neither (accepted). (3) `PUT /events/:id/tickets` no longer answers 500 over a failed or refunded wallet order (409 while its money is on its way, else the order goes with the tiers); the web's own pending Flutterwave order is as it was. (4) a loser of the last seat gets everything back.
- **Round 3 (the lead's rulings on the host erase):** (1) the erase refund returns EVERYTHING the buyer paid, Fintava's charge included (`returnCharge`, one move of price + charge; the hold's `refundedKobo` stays the price; WAWU carries the charge), like a losing buyer and a failed bill (G-462): the buyer did nothing wrong. **EVENTS-10's host cancel must follow the same rule** (its brief says the price only: that line is superseded; noted in tasks/EVENTS-10.md). (3) Only an event that has NOT started (`startsAt` after now) gets the erase refund. An event that has started or ended keeps its holds held, with its orders, for the deleted-payee path (G-461, G-480): nobody is refunded, the event is detached (names nobody, off sale) so the purge cannot delete it, and the sweep deletes it only once none of its holds is held. The decision is written once, when the host leaves (`Event.lastDecisionReason`), and the sweep reads it, so an event does not change sides as the clock moves.
- **Not changed, by ruling:** finding 5 (a cancel leaves the order `paid` and the hold `held`) stays as it is: EVENTS-10 owns it and must land before the app sells wallet tickets.
- **Next:** the lead merges it with batch 6.
- **Open for the lead or owner:** G-790 (the dashboard's owed streams count wallet-paid orders as owed to the old creator wallets; WALLET-17 or the dashboard task leaves them out), G-791 (unpaid quotes are never expired; a sweep). Cancelling a called-off event for wallet orders is EVENTS-10; until it lands, a cancel voids the tickets and leaves the price held. G-792 (an erased host's event stays as a removed, anonymous shell while any buyer's refund cannot move, for example a buyer whose own account is gone, and for ever while an event that had started has a hold held for a payee who is gone: G-461).
- **Fences touched:** SHARED-CHANGES EVENTS-07 #1 (schema and migration, `src/app.module.ts` mounting `EventWalletOrdersModule` after `WalletBillsModule`, `contract/openapi.json` +4 paths +9 schemas, two route inventories in specs). Round 2 touches `contract/openapi.json` again (one route's header and errors) and, in the account purge, `src/account-purge/account-purge.service.ts` (one call) and `account-purge.module.ts` (the hooks provider); SETTINGS-06's purge rewrite meets them at merge. Round 3 touches no fenced file.
- **History:** the builder report is in tasks/history/EVENTS-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

Tickets are paid from the buyer's wallet with the PIN; the money waits in WAWU's merchant wallet until the event (R-19); a ₦0 ticket needs no debit (R-8). The web keeps Flutterwave until after launch.

## Scope

Buying tickets pays from the wallet (E3-E5, E10); the order reference stops being Flutterwave-specific (additive column, old one kept until after launch). The web stays on Flutterwave until after launch; V3 checks it still works.

Also: basket order lines, so Regular and VIP are bought in one payment (E2); ₦0 orders issue tickets without a debit.

## Capability checks

- [ ] A user buys a Regular and a VIP ticket in one payment (E2 basket) and is debited the quoted total once.
- [ ] A user gets a ticket to a ₦0 event without a wallet or a PIN (R-8).
- [ ] Ticket money waits in WAWU's merchant wallet until the event (R-19).
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-07.md](history/EVENTS-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
