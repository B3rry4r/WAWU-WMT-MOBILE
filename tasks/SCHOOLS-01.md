---
id: SCHOOLS-01
title: Schools data model
owner: DEV3
area: SCHOOLS
order: 12
priority: launch
repo: wawu-backend
type: migration
status: review
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

Verifier, 3 Oct 2026, fresh session (did not build this task). Checked the branches as they will land: main had moved on both sides, so origin/main was merged in.
- **Backend `wmt/SCHOOLS-01` `101785b`** = builder's `b4e6716` + merge of main `a055b4f` (WALLET-14). The builder's report says `a055b4f` was merged in; the branch actually held `ad1e515` (MONEY-15), so WALLET-14's two migrations were missing. The merge conflicted in `prisma/schema.prisma` only because both sides appended after `FintavaLedgerReference`. Resolved as main's file followed, unchanged, by the branch's schools block (checked: the merged file is main's file plus exactly the block the branch added to its base; `prisma validate` ok). After the merge, `git diff origin/main` is exactly the builder's 3 files (migration, schema append, spec); nothing missing or extra.
- **Mobile `wmt/SCHOOLS-01`** = builder's `8dc730d` + merge of main `68c68ba` (generated `docs/PROGRESS.md` conflict taken from main and regenerated with `npm run tasks -- --write`).
- Own databases only (`*_schools_01_verify`), mock WAWU ID on 4136, `HUB_API_PORT` 4135. No `.env`, no Fintava keys.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Mobile `npm run check` exit 0 after the merge: 377/377 tests, gates 9 run, 98 files scanned, 0 fail 0 warn, task check ok. Backend, main `a055b4f` > branch `101785b`: `scripts/gates/run.py` 643 > 644 files scanned, 16 fail / 13 warn / 76 accepted on both, finding lists identical line for line (all 16 fails pre-exist: deferrals 4, fake_data 1, forks 11); `check_baseline.py` 108 entries ok both; `tsc --noEmit` 0 errors both; `eslint` without --fix 4488 problems both, 0 in `src/schools/`. `prisma format --check` reports unformatted on main as well (not this task). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh` on `wawu_hub_protected_test_schools_01_verify`, lock from origin/main `a055b4f`: main `a055b4f` 253/253, all 244 required; builder's `b4e6716` 253/253; merged `101785b` 253/253, all 244 required. |
| V4 Field trace | passed (planned; no route reads or writes yet) | Every field has a planned writer and reader in the ticket files: SCHOOLS-02 writes schools, courses and intakes from admin; SCHOOLS-04 serves them (SC1 chips = enum exactly: All, Tech, Business, Creative, Languages, Vocational; SC1 card's course count and "from" price derive from SchoolCourse; SC3/SC4 "8 seats left" from capacity minus seatsTaken); seatsTaken written by SCHOOLS-07's conditional claim; reportEmail read by SCHOOLS-09; applyUrl by SCHOOLS-10; priceKobo snapshotted by SCHOOLS-07. No rating column (R-32, BRIEF SC1). Today the spec is the only writer and reader. |
| V9 Live seam | NOT RUN | This task serves no route, so there is nothing for a signed-in app to read. Unblocked when SCHOOLS-04 serves `GET` schools (write side SCHOOLS-02). |

**Capability checks, as written**
- Migration applies, additive only: **passed.** Fresh DB `wawu_hub_test_schools_01_verify`: `prisma migrate deploy` of 83 migrations exit 0; `prisma migrate diff` afterwards proposes only `DROP INDEX "ContentPiece_specializations_idx"` (the known raw-SQL GIN index). Seeded DB `wawu_hub_seeded_test_schools_01_verify`: main's 82 migrations + `prisma db seed` (27 tables with rows), then the branch's `migrate deploy` applied only `20261003180000_schools`; every existing table's row count unchanged (only `_prisma_migrations` +1 and three new empty tables); `pg_dump -s` before/after: 0 lines removed, 161 added, every added line on `School`, `SchoolCourse`, `CourseIntake`, `SchoolCategory` or `SchoolCourseMode`. Direct SQL probes: weeks 0, priceKobo -1, capacity -1, seatsTaken -1 and seatsTaken above capacity are all refused by their CHECK; category `arts` refused by the enum; priceKobo 2147483647 accepted; deleting a school cascades to its courses and intakes.
- V3 unchanged: **passed** (table above).
- Every field has a planned writer and reader: **passed** (V4 above).

**Tests.** `src/schools/tests/schools-schema.contract.spec.ts`: 4/4, five runs in a row, and it leaves 0 rows behind. With `CourseIntake_seatsTaken_check` dropped by hand, the oversell test fails (1 failed, 3 passed), so it tests the constraint; restored afterwards. Full contract suite (`jest --runInBand`, fresh migrated and seeded DB each): main 49 failed / 83 passed suites, 1257 failed / 1939 passed tests; branch 49 / 84 suites, 1257 / 1943 tests. Compared test by test: the only differences are the 4 new passing tests. The red is this environment's (no `.env`: for example `IDENTITY_HASH_KEY is not set` answers 503, many 401s), the same on main.

**Contract.** `npm run contract:build` on `101785b` (in a scratch copy) regenerates `contract/openapi.json` byte for byte; the enum reorder the builder reported does not reproduce after the merge.

**Findings**
1. `unclear`: hiding a school. SCHOOLS-02's scope says "create, edit, hide", and this task adds no hidden column (the builder leaves it to SCHOOLS-02). SCHOOLS-02's ticket names no migration, and `prisma/schema.prisma` is fenced except for a migration the ticket names. Unblocked when SCHOOLS-02's ticket names an additive migration for its hidden column (or a SHARED-CHANGES row is accepted). The same applies to SCHOOLS-10's per-school link code and click log.
2. `unclear` (wording only): SCHOOLS-04's check says seats left come "from real enrolment counts", while the model keeps a `seatsTaken` counter that SCHOOLS-07 increments in the enrolment transaction. Default (verifier): `seatsTaken` is that count; SCHOOLS-04 reads `capacity - seatsTaken`. Owner may override.

No defects.

Report notes (not defects): the builder's report names main `a055b4f` as merged in, but the branch held `ad1e515` (see above). "Every field round-trips" is slightly overstated: the spec writes `about` but does not assert it back.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
