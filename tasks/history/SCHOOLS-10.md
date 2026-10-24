# SCHOOLS-10 · round history

Moved out of [tasks/SCHOOLS-10.md](../SCHOOLS-10.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 16 Oct 2026 (Sonnet). Backend `wmt/SCHOOLS-10` `a3b0f9f` (from main `3797fb2`); mobile `wmt/SCHOOLS-10` (this file, SHARED-CHANGES SCHOOLS-10 #1 and #2, log). Migration `20261022230000_school_link_clicks`.

**Files (backend):** `prisma/schema.prisma` (+38, two models and back relations), the migration, `src/schools/school-link.ts` (code and URL helpers), `school-link.service.ts`, `school-link.controller.ts`, `school-link.views.ts`, `schools-public.module.ts` (adds the controller and service; `app.module.ts` untouched), `account-purge/account-data-map.ts` (+1 OWNED row), `data-export-request/data-export-sections.ts` (+1 section), `contract/openapi.json` (+81, two paths and `SchoolApplyLinkView`, nothing removed), and `src/schools/tests/school-link.contract.spec.ts`.

**Capability check "Tapping 'Apply on their site' records one click and lands on the school's URL with the WAWU code":** spec `records one click and lands on the school address with the WAWU code` (one row: school, course, the token's user, a time within seconds; the answer is `https://school.example.com/apply?ref=wawu-XXXX`, equal to what the sheet's `apply-link` printed). Also run live against the stack's Hub (`stack.sh` name `schools_10`, mock WAWU ID): `GET apply-link` 200 with the code, `POST apply-click` without a token 401 and no row, with a token 200 and exactly one row for the right school, course and user. Probe output was in the scratch folder; the stack is down and its database dropped.

**Spec:** 18 tests, 18/18; with the purge and export drift guards 27/27; the schools, search-response, admin schools suites pass except 10 search-response tests that read seeded content the stack database does not have (they pass in CI, which seeds). Covered: code shape and alphabet, one code per school across courses and repeated asks, two schools two codes, ten simultaneous asks make one row, a drawn code another school holds is redrawn, query and fragment kept and an existing `ref` replaced, 404 for a missing, hidden-course, hidden-school, no-address and non-web-address (javascript:, ftp:) course with no click written, 400 for a bad id, 401 without a token (no row), each tap and each person its own click, the link holds only `ref` (no user id or email in the link or the body), a removed course keeps the click with no course, and a real `AccountPurgeService.purge` deletes only that person's clicks and the export section lists them. Eight mutants, each killed: no row written, row written twice, guard removed, `ref` appended instead of set, hidden course shown, hidden school shown, `skipDuplicates` removed, an extra query parameter in the link.

**Checks:** `npx tsc --noEmit` 0; eslint clean on every changed file; `prisma migrate diff` of the migrated database against the schema shows nothing for these tables (the only difference is an index on ContentPiece, not mine); `npm run contract:build` regenerated, 0 removed. Gates: 16 FAIL lines before (main) and after, none in these files; baseline ok. CI on `a3b0f9f`: Branch checks run 38933291303 green (suite shards 1 to 3, netns, contract, deploy-test-in-sync); Protected routes (V3) run 38933291332 green; baseline green; Gates run 38933291320 red with exactly the 16 FAIL lines main has, none in these files. Mobile (docs only): typecheck, lint, jest 155 suites 2832/2832, gates, tasks all pass (`EXIT 0`).

**Decisions (default, recorded):** (1) The tap is a POST that answers JSON, not a 302, because the person must be known. (2) The link read is public and may write the school's code row once (bounded: one row per school). (3) A repeat tap is a new click; the app disables the button while the call runs (no `Idempotency-Key`, that is for money). (4) The code is `ref=wawu-XXXX` as SC9 draws it; a `ref` the school's address already had is replaced. (5) Clicks are OWNED, so deleting an account deletes them.

**Gaps and requests:** SHARED-CHANGES SCHOOLS-10 #1 (schema, migration, contract) and #2 (mobile contract not copied, SCHOOLS-08 syncs). No BACKEND_GAPS row: nothing the screen needs is missing.

**NOT RUN:** V9 from the app (SC9 is SCHOOLS-08); a phone; a probe against `node dist/src/main.js` beyond the stack's Hub; the full backend suite locally (CI runs it).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

