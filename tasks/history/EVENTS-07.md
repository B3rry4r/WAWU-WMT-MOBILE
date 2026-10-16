# EVENTS-07 · round history

Moved out of [tasks/EVENTS-07.md](../EVENTS-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/EVENTS-07` `0da82ba` on `wmt/FIX-42` `73f4eb5`; mobile record on `wmt/FIX-42` `1ca79a3`. Own stack `events_07` (:7410-7417), own database; Fintava's double and the mock WAWU ID, no provider called.
- **Files changed (backend):** `prisma/schema.prisma` and `prisma/migrations/20261024010000_event_wallet_orders` (seven nullable `EventOrder` columns, `EventOrderLine`); `src/event-ticketing/wallet/` (module, controller, service, DTOs, view types, pure rules); `src/event-ticketing/event-ticketing.service.ts` (`ticketCode` exported; verify, cancel and setTicketTypes guards for wallet orders); `src/app.module.ts` (one import, one entry); `contract/openapi.json` (regenerated); `docs/contract/WALLET.md` (the `event_ticket` row); the two route inventories in specs; `test/events/event-wallet-harness.ts` and three specs.
- **A user buys a Regular and a VIP ticket in one payment and is debited the quoted total once:** PASSED. `event-wallet-order.contract.spec.ts` (21 tests): ₦27,500 in tickets + ₦15.75 = ₦27,515.75 leaves the wallet once, one transfer of the price to WAWU's account, two tickets, `sold` counted per tier, the payment's 85% share and the hold recorded; the order shows in My tickets as two rows.
- **₦0 ticket with no wallet or PIN (R-8):** PASSED. A wallet-less person gets their tickets in the create request, no payment, no Fintava call; the same key twice (also in parallel) is one order; two people asking for the last seat, one gets it; a mixed basket is priced at the paid lines.
- **Ticket money waits in WAWU's merchant wallet (R-19):** PASSED. The hold is `held`, release condition `event_took_place`, for the price; the buyer's balance is down by the total and the merchant account is up by the price. The seats going or the event being called off between the debit and the tickets fails the order and refunds the hold (price back, Fintava's charge on the first move not, R-10), and a refund leaves the daily limit free (`event-wallet-order-limit.contract.spec.ts`).
- **Same request twice charges once (V8):** PASSED. Same key: the first answer replays with `Idempotent-Replayed: true`; another key on a paid order is `target_not_payable`; two taps at once are one 201 and one 409; a wrong PIN, a stale quote token, too little money, a changed price and gone seats all take nothing.
- **Ledger and Fintava agree (MONEY-16):** the payment's ledger rows are completed; the nightly MONEY-16 check was not run on this stack.
- **E10:** an unconfirmed debit answers `processing` ("still confirming, don't pay again"); the sweep finds the transfer and issues the tickets once.
- **Checks:** `tsc --noEmit` 0 errors; eslint and prettier clean on the changed files; the new specs 26 tests passed (3 suites + the rules spec), with the gate-coverage, money-moving, account-purge and money-contract specs 92 passed. On the seeded stack the existing event suites have 8 failures that read names and ordering from the stand-in WAWU ID (holder and display names, trending order); the push's CI run is the judge. Contract rebuilt: +4 paths, +9 schemas, nothing removed or changed (compared as JSON).
- **Gaps filed:** G-790, G-791. **Shared change:** EVENTS-07 #1.
- **Not done:** the real Fintava sandbox (no keys; question 17 for payouts is not needed here: a ticket purchase is a wallet-to-wallet move); the mobile app's screens (EVENTS-06); releasing the host's share (WALLET-17) and refunding a called-off event (EVENTS-10).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

