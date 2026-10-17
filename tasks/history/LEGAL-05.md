# LEGAL-05 · round history

Moved out of [tasks/LEGAL-05.md](../LEGAL-05.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B1, 17 Oct 2026 (Sonnet builder), backend `wmt/B1` `e41210e`.
- Files: `src/legal/wallet/` (dto, view type, service with `feeDue`, controller, module, 10-test spec); uses the shared `deliver-or-refund.ts` and `wallet-pay-harness.ts`; `app.module.ts`; inventories; `contract/openapi.json`; WALLET.md.
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail; 10 of 10 tests pass; route inventories pass.
- Not done: in-person consultations priced by LEGAL-07 are payable only when a fee is recorded on the request; a mutation run is not done.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

