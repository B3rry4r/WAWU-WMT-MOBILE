---
id: HOME-11
title: TGIF on Today, saved to the account
owner: DEV
area: HOME
order: 91
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-11 · TGIF on Today, saved to the account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Turning TGIF off today lives in one browser's storage; it should follow the account to the phone.

## Scope

A per-account preference with GET and PATCH.

## Capability checks

- [ ] Turning TGIF off on one device hides it on another after sign-in.

## Builder report

Built 4 Oct 2026 (backend branch `wmt/HOME-11`, off main a94f338). Nothing committed or pushed.

- **Routes (new, additive):** `GET /settings/tgif` and `PATCH /settings/tgif`, body `{ "show": boolean }`, answer `{ "show": boolean }`. Own account only (the id comes from the token). No row means `show: true`, and GET never writes. PATCH is one upsert on the primary key, so parallel writes make one row and never fail.
- **Files (backend):** `src/tgif-preference/` (module, controller, service, DTO, spec), `prisma/schema.prisma` (+ model `TgifPreference`), migration `20261004160000_tgif_preference`, `src/app.module.ts` (one import, one entry), `src/account-purge/account-data-map.ts` (OWNED), `src/data-export-request/data-export-sections.ts` (section `tgifPreference`: `show`, `updatedAt`), `contract/openapi.json` (regenerated, +73 lines, 0 removed).
- **HOME-10 relation:** none. This task is independent of `src/tgif` on `origin/wmt/HOME-10` (not fetched into the code, nothing copied). Different first path segment (`settings/`, not `tgif/`), different table, own module file. Merge note for the owner: either order works; if both add rows to `account-data-map.ts`, `data-export-sections.ts`, `app.module.ts`, `schema.prisma` or `contract/openapi.json`, keep both sets and re-run `npx prisma generate` and `npm run contract:build` after the second merge (the contract file is generated: regenerate, never hand-merge).
- **Check "Turning TGIF off on one device hides it on another after sign-in":** spec `src/tgif-preference/tests/tgif-preference.contract.spec.ts` (14 tests, real RS256 tokens from the mock WAWU ID, real DB): a user turns it off with one login and a second login reads `show: false`; turning it back on; another user unaffected; no sign-in is 401; bad bodies (empty, string, number, null, array, extra field, wrong name, broken JSON) are 400 and store nothing; 14 simultaneous PATCHes all 200, one row. Revert proofs run: PATCH not persisting fails the cross-device test; validation removed fails 5 tests; purge entry and export section removed fail `account-data-map.spec.ts` and `data-export-map.spec.ts`. All restored and green after.
- **Ran:** `npx tsc --noEmit` clean; eslint on the new module 0 errors (5 `getHttpServer` any-warnings, the same the other specs carry); `scripts/protected-routes/run.sh --fresh` on a fresh DB: 244 of 244 required tests passed (253 in the two suites); `python3 scripts/gates/run.py` 16 fail, 34 warn, 76 accepted, identical on main (none in my files); `check_baseline.py` clean; `contract:build` run, diff additive only.
- **Full `npm run test:contract`** (once, local seeded DB; main compared by test name from a separate worktree on its own DB): mine 3075 passed, 601 failed; main 2823 passed, 839 failed (main's DB was less warm; the ~600 are env-caused). No test fails on main that I newly broke except 6 in `marketplace-save` that failed in the full run only and pass alone (6 of 6), the same order and environment effect as main's other cases; the 14 new tests pass. `src/data-export-request/tests/data-export.contract.spec.ts` has 14 failures that are identical on main (mail outbox status "pending", environment).
- **Mobile:** this task changes no screen. HOME-09 and HOME-01 read `GET /settings/tgif` after sign-in and write it from the Today toggle; the types come from `npm run api` once the backend merges.
- **Gap rows:** G-170, G-171. **Shared changes:** HOME-11 #1 to #3 in `SHARED-CHANGES.md`.
- **NOT RUN:** anything on a phone or the web (no screen here); a run against the live Fintava sandbox (no money path touched).
- **Defaults (agent), owner may override:** (1) route is `/settings/tgif`, beside `/settings/privacy`; (2) the field is `show`, default true, so TGIF is on until a person turns it off; (3) PATCH takes only `show`, required, a real boolean (strings and unknown fields are 400); (4) GET for a person with no row answers shown without creating a row; (5) last write wins, no versioning; (6) the browser's existing "off" setting is not imported (G-170).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
