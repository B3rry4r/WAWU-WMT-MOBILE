---
id: SCHOOLS-01
title: Schools data model
owner: DEV3
area: SCHOOLS
order: 12
priority: launch
repo: wawu-backend
type: migration
status: verifying
depends_on: []
decisions: [R-32]
passes: [V1, V3, V4, V9]
artboards: []
---
# SCHOOLS-01 · Schools data model

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Schools is a new product (SC1-SC11). It needs schools, courses and dated intakes with seat limits.

## Scope

Additive migration: School (name, location, foundedYear, expertise, about, logo, applyUrl, reportEmail), SchoolCourse (title, weeks, mode, syllabus, outcomes, priceKobo), CourseIntake (startDate, schedule, location, capacity, seatsTaken).

Also `category` on School (SC1's chips: Tech, Business, Creative, Languages, Vocational). No rating field: school ratings are left off at launch until the owner rules (R-32). Payee details for SCHOOLS-11 can be added there, additively.

## Capability checks

- [ ] The migration applies on a fresh local database built from every existing migration (`prisma migrate deploy`) and on the OPS-03 seeded database, and adds only new tables or nullable columns.
- [ ] V3 regression suite unchanged.
- [ ] Every field has a planned writer (SCHOOLS-02) and reader (SCHOOLS-04).

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/SCHOOLS-01` `b4e6716` (from main `48b9043`, main `a055b4f` merged in; no new migration came with it).
- **Files:** `prisma/schema.prisma` (appended only: enums `SchoolCategory` tech/business/creative/languages/vocational, `SchoolCourseMode` online/in_person/hybrid; models `School`, `SchoolCourse`, `CourseIntake`; no rating, R-32); migration `20261003180000_schools` (2 enums, 3 tables, cascade FKs School > SchoolCourse > CourseIntake, CHECKs `0 <= seatsTaken <= capacity`, `weeks > 0`, `priceKobo >= 0`); spec `src/schools/tests/schools-schema.contract.spec.ts` (own fixtures: every field round-trips, two racing claims for the last seat give one seat, an oversell is refused, delete cascades). Choices (default, agent; owner may override): `priceKobo` is Int (holds ₦21.47M, above the ₦10M merchant cap); `startDate` is a calendar date (`@db.Date`); `location` on CourseIntake is null for an online intake; `logo`, `applyUrl`, `foundedYear` nullable; `reportEmail` required. A "hidden" flag is not added: SCHOOLS-02 adds its own column for hiding.
- **Check 1 (migration applies, additive): passed.** Fresh DB, `prisma migrate deploy` of all 81 migrations: exit 0, and `prisma migrate diff` afterwards shows only the known `ContentPiece_specializations_idx` line (raw-SQL GIN index, same note as `20261002210000_fintava_ledger`). OPS-03 seeded DB (main's 80 migrations + `prisma db seed`, as `scripts/local/up.sh` does), then the branch's `migrate deploy`: applied 1, every existing table's row count unchanged, `pg_dump -s` before/after differs only by added lines (163) plus pg_dump's random `\restrict` token. No existing table, column or index touched.
- **Check 2 (V3 unchanged): passed.** `scripts/protected-routes/run.sh --fresh` on `origin/main` before: 253/253, all 244 required. On `wmt/SCHOOLS-01` after the merge: 253/253, all 244 required.
- **Check 3 (writer and reader for every field):** School name, category, location, foundedYear, expertise, about, logo: written by SCHOOLS-02, read by SCHOOLS-04 (SC1, SC2; category is SC1's chips and filter). applyUrl: SCHOOLS-02 writes, SCHOOLS-04 serves, SCHOOLS-10 redirects to it. reportEmail: SCHOOLS-02 writes, SCHOOLS-09 reads (never served to the app). SchoolCourse title, weeks, mode, syllabus, outcomes, priceKobo: SCHOOLS-02 writes, SCHOOLS-04 reads (SC2, SC3); priceKobo also SCHOOLS-07 snapshots it. CourseIntake startDate, schedule, location, capacity: SCHOOLS-02 writes, SCHOOLS-04 reads (SC3, SC4); seatsTaken: SCHOOLS-07 writes (conditional claim), SCHOOLS-04 reads as seats left. Nothing reads or writes them yet (no routes in this task); the spec is the only writer and reader today.
- **Gates (backend), before > after:** `scripts/gates/run.py` 16 fail, 12 warn, 76 accepted > the same (files 631 > 637 after main's merge; all 16 fails pre-exist on main: deferrals 4, fake_data 1, forks 11). `check_baseline.py` 108 entries ok both. `tsc --noEmit` 0 errors both. eslint (no --fix) 4488 problems both, none in new files.
- **Contract suite:** red in this environment on main too (no `.env` here; most failures are 401s): main 47 failed / 81 passed suites, branch 47 failed / 82 passed (the new spec), the same 47 suites; test-level differences are only `fintava-stall` timing tests, which vary run to run. Mobile `npm run check`: exit 0 before and after (377 tests, gates 0 fail).
- **contract/openapi.json:** not changed. `npm run contract:build` on this branch reorders some enum members in the output (same values; checked equal as sets), because the new Prisma enums shift the checker's type order; main regenerates byte-identical. The file is left as main has it; the next regeneration may carry the reorder, with no change in meaning.
- **V9:** this task serves no route; the round trip through the API is SCHOOLS-02 (write) and SCHOOLS-04 (read). Shared-change requests: none (the task names this migration). Gaps filed: none.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
