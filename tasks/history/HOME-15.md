# HOME-15 · round history

Moved out of [tasks/HOME-15.md](../HOME-15.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B1, 17 Oct 2026 (Sonnet builder), backend `wmt/B1` `e41210e`.
- Files: `src/content-piece/wallet/` (dto, view type, service, controller, module, 8-test spec); uses the shared `deliver-or-refund.ts` and `wallet-pay-harness.ts` from HOME-14; `app.module.ts`; inventories; `contract/openapi.json`; WALLET.md.
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail; 8 of 8 tests pass; route inventories pass.
- Not done: MONEY-19 (listed in depends_on) was not needed: the kind registers with what is on batch 7. A mutation run is not done.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report (round 2, B3a, 17 Oct 2026)

Lead ruling 3 (17 Oct): an undeliverable unlock returns the price and the charge, one transfer; WAWU's account agrees with the ledger afterwards.
Files: backend `src/money/payments/deliver-or-refund.ts` (`holds.refund(..., { returnCharge: true })`, comment), the service's doc comment, the refund test of the task's spec (the assertion now expects the payer's opening balance back; it was the balance less the charge). Records only here.
Checks: `tsc --noEmit` EXIT 0; the task's spec passes; the spec fails on `ed45009` (refund test) and passes after; 36 suites, 721 passed, 3 skipped (EXIT 0) over the B3a specs.
Not run: Fintava specs (rule); the app.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-15.md](history/HOME-15.md).

