# FIX-54 · round history

Moved out of [tasks/FIX-54.md](../FIX-54.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files (backend `c78b796`, round 1 `0fa4b31`):** `src/nuvion/areas/payouts.ts`, `src/nuvion/handlers/outflows-bank.ts`, `src/money/transfers/wallet-transfer.service.ts`, `src/money/ledger/ledger.service.ts`, `src/wallet-provider/wallet-provider.interface.ts`, `scripts/dev/nuvion-standin.cjs`, new spec `wallet-transfer-bank-nuvion.contract.spec.ts` (6 cases). Mobile: this file, `docs/LOG.md`, `docs/PROGRESS.md`.
- **Spec before and after:** the 5 first cases fail on `773a9ee` (4 on "pending" vs "completed" or the refund stopping; the lost-answer case on the failure text) and pass on `0fa4b31`; round 2 adds a 6th (a send that waited on its fee and is issued later by the sweep, which `issueSend` also completed on acceptance), which fails with its guard switched off ("pending" vs "completed") and passes with it. Now 6 of 6, EXIT 0. They cover: pending until completed; failed after acceptance; refunded after completion; duplicated and reordered deliveries; a lost answer then a status poll; a send issued late by the sweep.
- **Related specs, after:** `wallet-transfer-nuvion*`, `wallet-transfer-wawu-fee-nuvion`, `nuvion-payouts*`, `nuvion-bank-reconcile-seam`, `nuvion-adapter`, `nuvion-webhook`, `nuvion-book*`: 12 suites, 307 tests, EXIT 0 on round 1 (on a mock WAWU ID at 7787); after round 2 the fee, bank and payouts suites: 4 suites, 97 tests, EXIT 0. The Fintava specs were not run (rule); the Fintava path is unchanged by design (a receipt without `pending` completes as before).
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the six changed backend files EXIT 0; `python3 scripts/gates/run.py` PASSED (0 fail). Stand-in: syntax check, and a scripted run (settle successful, then reversed) shows `outflows.refunded` as `type: inflow` with `meta.source_payment_id`.
- **Gaps:** none filed. A reversal of a bank send found only by the sweep (no credit record) gives no `reversal` figures; the status and the fee-back still follow.
- **CI:** see the lead's hand-back for run ids.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-54.md](history/FIX-54.md).

