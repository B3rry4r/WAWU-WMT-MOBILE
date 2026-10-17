# HOME-14 · round history

Moved out of [tasks/HOME-14.md](../HOME-14.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B1, 17 Oct 2026 (Sonnet builder), backend `wmt/B1` `e41210e`.
- Files: `src/purchase/wallet/` (dto, view type, service, controller, module, 8-test spec); `src/money/payments/deliver-or-refund.ts` (shared); `test/payments/wallet-pay-harness.ts` (shared, no Fintava double: the Fintava settings point at a socket that counts hits, and every spec asserts none); `app.module.ts`; the two route inventories; `contract/openapi.json`; WALLET.md.
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail (the first push had 2 wire_types FAIL lines on a DTO import, fixed in `e41210e`); 8 of 8 tests pass; route inventories 61 pass.
- Not done: a mutation run; the operational (merchant) side of the ledger is checked by exact figures in the happy path only, not by a ledger sum after every attack.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report (round 2, B3a, 17 Oct 2026)

Lead ruling 3 (17 Oct): a refund the person did not cause returns every naira, the charge included; WAWU bears the refund transfer's own charge.
Files: backend `src/money/payments/deliver-or-refund.ts` (`holds.refund(..., { returnCharge: true })`, comment), the service's doc comment, the refund test of the task's spec (the assertion now expects the payer's opening balance back; it was the balance less the charge). Records only here.
Checks: `tsc --noEmit` EXIT 0; the task's spec passes; the spec fails on `ed45009` (refund test) and passes after; 36 suites, 721 passed, 3 skipped (EXIT 0) over the B3a specs.
Not run: Fintava specs (rule); the app.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-14.md](history/HOME-14.md).

