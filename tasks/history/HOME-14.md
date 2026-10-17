# HOME-14 · round history

Moved out of [tasks/HOME-14.md](../HOME-14.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B1, 17 Oct 2026 (Sonnet builder), backend `wmt/B1` `e41210e`.
- Files: `src/purchase/wallet/` (dto, view type, service, controller, module, 8-test spec); `src/money/payments/deliver-or-refund.ts` (shared); `test/payments/wallet-pay-harness.ts` (shared, no Fintava double: the Fintava settings point at a socket that counts hits, and every spec asserts none); `app.module.ts`; the two route inventories; `contract/openapi.json`; WALLET.md.
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail (the first push had 2 wire_types FAIL lines on a DTO import, fixed in `e41210e`); 8 of 8 tests pass; route inventories 61 pass.
- Not done: a mutation run; the operational (merchant) side of the ledger is checked by exact figures in the happy path only, not by a ledger sum after every attack.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

