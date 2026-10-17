# HOME-17 · round history

Moved out of [tasks/HOME-17.md](../HOME-17.md) word for word, oldest first. The current state is in that file.

## Builder report

Files changed (backend): `src/plan-settings/plan-setting-registry.ts` and `plan-settings.defaults.json` (new row, name check bound, TGIF time no longer provisional), `src/scheduler/` (notice service reads the registry; new retention service, config and module), `src/money/saved-accounts/name-check-budget.ts` and `src/money/money.module.ts`, `src/search-response/` (service, config, module), `prisma/migrations/20261024220000_tgif_notice_retention_index/`, `.env.example`, `docs/contract/CONVENTIONS.md`, and the specs named above.

Checks: `npx tsc --noEmit` EXIT 0; eslint and prettier on the changed files, no errors (3 old warnings in the HOME-16 contract spec, lines I did not touch); `npm run contract:build` leaves `contract/openapi.json` unchanged; gates: no new finding (the one FAIL, `content-piece.service.ts:67`, is on main); `check_baseline.py` EXIT 0. On a local stack (`home_17`), contract specs: the two new specs (10 and 14 tests) pass; `src/scheduler/tests`, `src/search-response/tests` (except the seed-dependent `search-response.contract.spec.ts`, 10 tests that need the seeded CAC content the stack database does not have), `src/plan-settings/tests`, `src/admin/plan-settings/tests` and `src/money/saved-accounts/tests` pass. GitHub runs the full suite.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

