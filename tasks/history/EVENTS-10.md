# EVENTS-10 · round history

Moved out of [tasks/EVENTS-10.md](../EVENTS-10.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/EVENTS-10` `1b0ea03` on `wmt/MERGE-6` `fbf391f`; mobile record on `70a7895`. Own stack `events_10` (:7560-7567), the Fintava double, no provider called.
- **Files changed (backend):** new `src/event-ticketing/event-cancel-hooks.ts`, `wallet/event-call-off-refund.service.ts`, `tests/event-call-off-refund.contract.spec.ts`; changed `event-ticketing.service.ts` (cancel runs the hook, adds its counts), `event-ticketing.module.ts`, `wallet/event-wallet-orders.module.ts`, `wallet/event-wallet-order.service.ts` (share lock on the event row when issuing), `wallet/event-wallet-order-rules.ts` (constants), `event-held-tickets.service.ts`, `test/events/event-wallet-harness.ts` (exposes the service), and one assertion in `tests/event-wallet-order.contract.spec.ts`.
- **Calling an event off returns each buyer's ticket price to their wallet once (R-10):** PASSED. Two buyers of different baskets: each wallet is back to its start (price + Fintava's charge), one refund move each of the whole total, the hold `refunded` with `refundedKobo` = price and `transferKobo` = total, the ledger has both sides of the whole sum, the order reads `refunded` with void tickets and `returned.returnedKobo` = the total. A free ticket is void with no refund; an unpaid quote stays pending.
- **Running the refund twice pays each buyer once (V8):** PASSED. A second cancel is 409; a retry, the sweep and the hold sweep move nothing; two cancels, a retry and the sweep at once give one move per order (four buyers).
- **The ledger and Fintava agree (MONEY-16):** each refund's merchant-out and user-in rows are both the whole sum; the nightly check was not run.
- **Other cases:** provider down (the refund is chosen, the order reads refunded and "on its way", the hold sweep sends it once the provider is back); a price already released is left for a person and the rest are refunded; a debit still being confirmed is refunded when it lands; a cancel committing between the debit and the tickets makes no ticket (a mutant without the share lock fails it); twenty buyers with a 3 s provider: all refunded, the request under 25 s, a bystander's read under 1 s throughout. Mutants (charge kept, no cancelled guard, no lock) each fail their test.
- **Checks:** `tsc --noEmit` 0; eslint 0 on the changed files; gates 0 fail (as the base); the new spec 10 of 10 and the touched wallet-order, round 2, limit, coverage and account-purge specs pass on the stack (98 tests). On the stack the held-tickets, door and event-running suites fail on the stand-in WAWU ID not knowing their people (holder name null, staff lookup 404), as in EVENTS-07; GitHub runs them.
- **Gaps filed:** G-793. **Shared changes:** none.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

