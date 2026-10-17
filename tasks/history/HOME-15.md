# HOME-15 · round history

Moved out of [tasks/HOME-15.md](../HOME-15.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B1, 17 Oct 2026 (Sonnet builder), backend `wmt/B1` `e41210e`.
- Files: `src/content-piece/wallet/` (dto, view type, service, controller, module, 8-test spec); uses the shared `deliver-or-refund.ts` and `wallet-pay-harness.ts` from HOME-14; `app.module.ts`; inventories; `contract/openapi.json`; WALLET.md.
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail; 8 of 8 tests pass; route inventories pass.
- Not done: MONEY-19 (listed in depends_on) was not needed: the kind registers with what is on batch 7. A mutation run is not done.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

