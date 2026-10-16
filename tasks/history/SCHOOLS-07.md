# SCHOOLS-07 · round history

Moved out of [tasks/SCHOOLS-07.md](../SCHOOLS-07.md) word for word, oldest first. The current state is in that file.

## Builder report

**Builder report: SCHOOLS-07 (Sonnet builder, 16 Oct 2026).** Backend `wmt/SCHOOLS-07` `79b24be`; mobile `wmt/SCHOOLS-07` (docs). CI: Branch checks run 38974103211 and Protected routes run 38974103277 passed; Gates run 38974103634 has the base's 5 FAIL lines only.

- **Files (backend):** `src/schools/enrolment/` (rules, service, controller, module, DTOs with the typed error envelope, view type, 2 specs), `test/schools/school-enrolment-harness.ts`, `prisma/schema.prisma` + `migrations/20261024020000_school_enrolments`, `contract/openapi.json` (+235 lines, none removed), `src/schools/schools-public.module.ts` (mount), `src/money/dto/money-enums.ts`, `holds/hold-rules.ts`, `money-view.type.ts`, `payments/payable-registry.ts`, `payments/wallet-payment.service.ts` (one line), `src/account-purge/account-data-map.ts`, `src/data-export-request/data-export-sections.ts`, `docs/contract/WALLET.md`, `CONVENTIONS.md`.
- **Two users racing for the last seat (tested, 8 at once for 2 seats, and 2 for 1):** exactly the seats there are are held, the others get `class_full` with the next class (hidden, full and started classes are skipped; null when none). Mutant without the capacity guard: 7 of 27 tests failed.
- **The same enrol request twice (tested, also 6 at once):** one order, one seat. The same pay request twice (same key) debits once and replays; a new key is `target_not_payable`; two pays at once with different keys debit once.
- **The receipt shows the course, intake and amount actually charged (tested):** the order keeps the course, school and class as they were (a later edit changes nothing); `providerFeeKobo` and `totalKobo` come from the payment row (₦15.75 and ₦150,015.75 on ₦150,000); the hold is `held`, `intake_started`, 12,750,000 school and 2,250,000 WAWU.
- **Also tested:** unpaid place released and seat returned once; a pending payment keeps the seat; a payment after release retakes the seat or refunds through the hold (mutant without the refund: 1 failed); swapping class; intake closed; hidden 404; the per-student cap; ₦0 course; no wallet (`wallet_not_open` on the quote); a short wallet (402, nothing taken); another student's order 404; the daily purchase limit and a refunded fee freeing it (FIX-40); data export and account purge (the row stays, the person goes).
- **Checks:** `tsc --noEmit` 0; eslint 0 on every touched file; 40 tests in 2 new suites green; related suites (money payments, holds, history, ledger, tests, account purge, export map, schools) 545 of 546 green, the one failure a ledger timing test that passes alone; gates: 5 FAIL lines, none in a file this branch touched (same as the base); baseline check 0.
- **Gaps and requests filed:** SHARED-CHANGES SCHOOLS-07 #1. No BACKEND_GAPS row.
- **Not done, and why:** paying the school and releasing or refunding the hold at intake start (SCHOOLS-11); the enrolment report email and "My courses" list (SCHOOLS-09); the screens (SCHOOLS-06); the mobile copy of the contract (SCHOOLS-06's first step).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

