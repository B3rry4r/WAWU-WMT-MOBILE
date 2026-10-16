# FIX-40 · round history

Moved out of [tasks/FIX-40.md](../FIX-40.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-40` `79cf759` on `wmt/BILLS-04` `ba5e043`. Mobile on `wmt/BILLS-04` `2f83c27` (docs only).
- **Red on `ba5e043`:** the two new specs, 11 cases: 9 failed, 2 passed (the two that say "still counts"). The money-limits spec fails on `Expected 0n, Received 1000000n` for a refunded bill, DM and ticket; the bill flow fails on `withinDailyLimit` (`Expected true, Received false`).
- **Green:** the same 11 cases pass with the change (EXIT 0), and the whole `src/money/limits` folder (10 suites, 136 tests).
- **Checks:** `tsc --noEmit` EXIT 0; eslint --no-fix on the three touched files EXIT 0; `npm run test:contract -- src/money src/wallet-bills`: 78 suites, 76 passed; the two that failed are `receipt-units.spec.ts` (4 tests, Node 22.22 Unicode digit tables, the file is not touched; the BILLS-04 verifier saw the same) and one 5 s timeout in `ledger.contract.spec.ts` under machine load, which passes alone (25 of 25). `contract:build` twice gives the same file as committed (no route changed).
- **Note for the verifier:** the database check `WalletHold_outcome_check` allows `refunded` only with `refundedKobo = amountKobo`, so there is no stored "partly refunded" hold; the brief's partial refund is a refund still waiting or unconfirmed, which keeps the hold `held` and the payment counted.
