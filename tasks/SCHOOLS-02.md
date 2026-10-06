---
id: SCHOOLS-02
title: Admin: create and edit schools, courses and intakes
owner: DEV3
area: SCHOOLS
order: 16
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SCHOOLS-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-02 · Admin: create and edit schools, courses and intakes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Schools are added from the WAWU dashboard (canvas note on SC1), not by school accounts.

## Scope

Admin namespace only, admin auth only. Create, edit, hide schools, courses and intakes.

## Capability checks

- [ ] An admin can add a school with a course and an intake and read it back from the admin route.
- [ ] A user token is refused on every admin school route.

## Builder report

Builder, 6 Oct 2026. wawu-backend `wmt/SCHOOLS-02` `a997842` (on main `a94f338`; SCHOOLS-01's migration `20261003180000_schools` is already on main, PR #46 merged, so nothing extra was merged in).
- **Files:** migration `20261006100000_schools_hidden` (three nullable `hiddenAt` columns); `prisma/schema.prisma` (those three fields only); `src/admin/schools/` (controller, module, spec); `src/schools/school-admin.{dto,service,views}.ts`; `src/app.module.ts` (one import, one entry); `contract/openapi.json` regenerated (six paths, eleven schemas added; every existing path and schema equal in meaning, checked by comparing the two files as sets).
- **Routes (admin only):** `GET/POST /admin/schools`, `GET/PATCH /admin/schools/:id`, `POST /admin/schools/:id/courses`, `GET/PATCH /admin/school-courses/:id`, `POST /admin/school-courses/:id/intakes`, `GET/PATCH /admin/school-intakes/:id`. Hide is `{ hidden: true }` in a PATCH, show is `false`; nothing deletes. `seatsTaken` is never writable (400); a capacity below the seats taken is 409, by one conditional write. Every field SCHOOLS-01 lists has a writer here (rating is absent, R-32).
- **Hiding (SCHOOLS-01 verifier finding 1):** the ticket names no migration and `schema.prisma` is fenced, so I filed SHARED-CHANGES row SCHOOLS-02 #1 and made the additive migration on the branch (as MONEY-09 #10 and SETTINGS-02 #1 did), for the owner to approve or revert at merge. The same row covers `app.module.ts` and the regenerated contract. SCHOOLS-04 must serve only unhidden rows at each level (school, course, intake). SCHOOLS-10's link code and click log are not in this row.
- **Check 1 (admin adds a school with a course and an intake and reads it back): passed.** Spec test 1 posts all three through the routes and reads the school (with course and intake, every field equal), then the list. Further tests: edit of every field, hide and show at each level and the `hidden` filter, capacity guard, input refusals (bad category, blank name, bad email, http link, year, weeks 0, negative or fractional kobo, 30 February, unknown id, unknown field), cursor paging.
- **Check 2 (a user token is refused on every admin school route): passed.** A real token from the mock WAWU ID (port 4151) is 401 on all 10 routes; no token is 401; finance is 403; support is 403 on every write. `src/admin/schools/tests/admin-schools.contract.spec.ts` 42 tests green, with `schools-schema` 4: 46/46, own DB `wawu_hub_test_schools_02`.
- **Role matrix (default, agent; owner may override):** the shop's: read superadmin, reviewer, support; write superadmin, reviewer; finance refused.
- **Limits (default, agent):** `PROVISIONAL(SCHOOLS-ADMIN-LIMITS)` in `school-admin.dto.ts` (text sizes, founding year 1800 to this year, 1 to 520 weeks, 1 to 100000 seats, fee up to Int kobo); one new gate warn. Logo and apply URL must be `https`.
- **Gates (backend), before > after:** `scripts/gates/run.py` 16 fail / 34 warn / 76 accepted (732 files) > 16 / 35 / 76 (738 files; the extra warn is the PROVISIONAL above); `check_baseline.py` 108 ok both; `tsc --noEmit` 0 > 0; eslint clean on the new non-test files (specs carry the repo's usual unsafe-any findings, like every other spec). **V3:** `scripts/protected-routes/run.sh --fresh` 253/253, 244 required, on `a997842`; on `origin/main` it was 253/253 on the second run (the first run had 2 failed, then green on the rerun with nothing changed: flaky on main, not this branch).
- **Mobile `npm run check`:** no app code changed (docs, task file, INDEX and PROGRESS only). Before my edits, on main merged in: 43 suites, 753 passed and 1 failed (the tail kept only the summary, so the failing test was not captured; the machine was loaded by parallel agents). After, with nothing in `src` changed: exit 0, 43 suites, 754/754, gates 9 run, 195 files, 0 fail 0 warn, task check ok.
- **NOT RUN:** V9 live seam from a signed-in app: nothing reads these routes in the app yet (SCHOOLS-04), and there is no dashboard in this checkout; the routes were driven over HTTP by the spec. The dashboard screens themselves are not in this repo. Gaps filed: none (G-60 unused). Open for the owner: the role matrix and the limits above.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
