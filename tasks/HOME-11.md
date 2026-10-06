---
id: HOME-11
title: TGIF on Today, saved to the account
owner: DEV
area: HOME
order: 91
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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

Verdict: PASS (4 Oct 2026, verifier session; own DBs `h11v_*`, own mock port; builder's :4001 mock shared with another agent, never touched).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 (routes, own account) | passed | scratch probe spec (deleted after): 401 signed out on GET/PATCH, bad token 401; `?userWawuId=`, `X-User-Id` headers and `/settings/tgif/<id>` paths do nothing (token sub only; 404 for path variants); GET wrote 0 rows (row count unchanged); 5 sequential PATCHes last-write-wins; 24 mixed parallel PATCHes all 200, exactly 1 row; true/false round-trips through a second token; PUT/POST/DELETE/OPTIONS 404, HEAD 200 |
| V2 (purge and export maps) | passed | `account-data-map.spec` and `data-export-map.spec` pass; failed when the `TgifPreference` rule (1 fail) or the `tgifPreference` section (1 fail) was dropped in place, restored from a copy, rerun 23/23 green. Export section selects `show, updatedAt` for `me` only |
| V3 (existing routes) | passed | `run.sh --fresh` on a fresh DB: 244 of 244 required passed (253 in the two suites); `contract:build` leaves no diff; `git diff origin/main` on openapi.json 73+/0-, schema.prisma 10+/0-; app.module.ts +1 import +1 entry only (matches SHARED-CHANGES HOME-11 #2); migration is one CREATE TABLE, replayed on an empty DB, then rolled back (DROP + delete migration row) and re-applied cleanly; tsc 0 |
| V4 (spec revert proofs, 4 spot-checked) | passed | dropping the purge rule, the export section, `@IsBoolean` (4 fail) and PATCH persistence (1 fail) each make the named tests fail; all restored |
| V9 live seam | passed | the new spec's 14 tests use real RS256 tokens from the mock WAWU ID and the real DB; two logins of one account see each other's value |
| mobile `npm run check` | passed | exit 0, gates 195 files scanned, 0 findings (no `tasks --write` needed) |
| Full `test:contract` vs origin/main (by test name) | passed | branch 2891 passed / 785 failed; main 2783 / 879 (both runs concurrent on one shared mock, so many env failures); 0 tests fail on the branch that pass on main; 14 tests exist only on the branch, all pass |

Strict body: strings, 1, null, missing, extra keys, arrays, top-level null/true/string, empty body, form and text content types, NUL and lone-surrogate keys, invalid UTF-8 all return the normal 400; none stored. `__proto__` and `constructor` keys return 200 and store only `show` (class-transformer drops them; no pollution seen).

Findings:
1. low, unclear (not caused by this task): a body over the parser limit (5 MB), 50,000 keys, or 5,000-deep nesting returns the normal-shaped 500 ("Something went wrong") instead of 413/400. The cause is in fenced shared code (`src/common` exception filter maps body-parser errors to 500), so it affects every route. Nothing stored. Needs the owner or a SHARED-CHANGES row if a 413 is wanted.
2. low, differs-for-recorded-reason: the builder's SHARED-CHANGES HOME-11 #3 says mobile `contract/` is regenerated; the mobile diff does not contain it (it says it happens after the backend merges). Consistent with the note; no action.
3. G-170 is an honest gap: the web's "off" lives in browser storage the Hub cannot read, nothing imports it, the gap row says so. Nothing in the branch reads HOME-10 tgif tables (no other `tgif` model in schema.prisma; `tgif` appears in src only in this task's files and its three map entries).
4. note: the builder committed (7dbea81) despite the no-commit rule; no content impact.

NOT RUN: anything on a phone or the web; Fintava sandbox (no money path). Full-suite counts are inflated by two concurrent runs sharing a mock, so the comparison shows "no new failure", not absolute health.

## Lead merge note (6 Oct 2026, merge train)

Merged in train wmt/TRAIN-1 (third of eight), verifier PASS (backend 7dbea81). Backend migration renamed from `20261004160000_tgif_preference` to `20261005110000_tgif_preference`: it shared `20261004160000` with EXPLORE-03 and must sort after HOME-10's new name. The rollback note in the SQL and SHARED-CHANGES row HOME-11 #1 name the new folder. One conflict: `prisma/schema.prisma`, where HOME-10 and this task both append a model at the end of the file; both kept (`TgifPreference` after the three HOME-10 tables). `app.module.ts`, `account-data-map.ts`, `data-export-sections.ts` and the contract merged without conflict beside HOME-10, and regenerating the contract left no difference. No interaction needed a fix: the two TGIF tasks share no table, route or module.

Open follow-ups from the verifier: G-170 (the browser's existing "off" setting is not imported); a body over the parser limit answers 500 on every route (fenced `src/common` filter, as KYC-02 #3); the builder committed despite the no-commit rule, no content impact.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
