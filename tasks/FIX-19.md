---
id: FIX-19
title: School and course names refuse control characters
owner: YOU
area: FIX
order: 223
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
depends_on: [SCHOOLS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-19 · School and course names refuse control characters

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-19.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-09` (this branch contains it); API types regenerated from backend `wmt/FIX-19` (f69596e).
- **Branches:** backend `wmt/FIX-19` 2dbf748 (on main 56f94d0). Mobile `wmt/FIX-19` carries only this file, `tasks/history/FIX-19.md`, `docs/LOG.md` and `docs/PROGRESS.md`. No migration, no fenced file, no contract change (`contract:emit` and `contract:enrich` leave `contract/openapi.json` byte-identical).
- **Built:** a school's `name` and a course's `title` (create and edit) answer 400 `<field> must not contain control characters` and save nothing when they hold U+0001 to U+001F, U+007F or U+0080 to U+009F. `src/schools/school-admin.dto.ts`: `hasControlCharacter`, a `HasNoControlCharacters` decorator and a `trimmedName` transform on the four DTO fields. NUL keeps its own message. Accents, Arabic, Chinese, emoji and combining marks pass.
- **Judgement calls to confirm:**
  - "Name field" is read as the school `name` and the course `title`. `location`, `about`, the expertise, syllabus and outcome lists and the intake `schedule` still accept controls (`about` holds line breaks on purpose).
  - A name is checked as it came, not trimmed first: `"Acme\n"` is now a 400 (it was trimmed and saved as `Acme`). Plain spaces are still trimmed.
- **Existing rows:** NOT counted on production (no production access from here). The query is in `tasks/history/FIX-19.md`; a fresh test database answers 0 and 0. Open for the lead. No data was changed.
- **Cursor bound:** SCHOOLS-04's stays as it is (360 name units, 1498 characters). It is now larger than the admin can produce, which is safe; a row already stored with controls still pages.
- **Test I changed that I did not write:** `src/schools/tests/schools-admin-written.contract.spec.ts` (SCHOOLS-04 round 3) wrote its worst-bytes names (`\u0001` + U+FE0F) through the admin route, which now refuses them. Those two rows are written to the table instead, as rows stored before this change are, and the spec asserts the admin's new 400 for the same name. Nothing else in it changed; its 10 tests pass.
- **Evidence:** new spec `src/admin/schools/tests/admin-schools.control-chars.contract.spec.ts`, 12 tests (every code point of the three ranges as a unit; per field, 12 characters in 4 places on create and edit; messages; real names; trim; `about` unchanged). One mutant (C1 range one short) fails 5 of 12. Live Hub built from the branch: 328 requests (all 64 code points, 9 of them also at the start and end, on school and course, create and edit) all 400 naming the field, 0 rows stored; 6 real names accepted on all four routes; NUL still 400.
- **Checks:** `tsc --noEmit` EXIT 0; eslint and prettier clean on the three files; `src/admin/schools` and `src/schools` 9 suites, 107 tests, EXIT 0.
- **CI on 2dbf748:** suite (3 shards), netns, contract, baseline, deploy-test-in-sync and branch checks (run 38903140751) green; protected routes 253/253 (run 38903140624) green; gates (run 38903140703) red only on the 16 FAIL lines main already has, none in `src/schools` or `src/admin/schools`.
- **Open findings:** blocker 0, high 0, medium 0. Lows: the count of existing control-character rows is a query someone with production access must run (open for the lead); the 121-character refusal assertion now covers the units name only. They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head, and has someone with production access run the existing-rows query in tasks/history/FIX-19.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/SCHOOLS-02.md` (the admin name rules) and `tasks/SCHOOLS-04.md` (round 3 decision 2: the cursor bound counts control characters because the admin accepts them)

## Goal

SCHOOLS-02's admin rules refuse only NUL and lone surrogates in a school or course name, so an admin can save a name holding control characters, which the app draws as boxes.

## Scope

- The admin create and edit routes refuse C0 controls (U+0001 to U+001F), DEL and C1 controls (U+0080 to U+009F) in every school and course name field with 400 naming the field, and save nothing.
- Count existing rows that hold one and report the count in the builder report. Change no data without a lead ruling.
- SCHOOLS-04's cursor bound may stay as it is (larger than needed is safe); say so in the report.

## Capability checks

- [ ] Each control-character range is refused on create and edit, by field, with nothing saved.
- [ ] Real names (accents, Arabic, Chinese, emoji) are still accepted.
- [ ] The existing-row count is in the report. Protected routes 253/253.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-19.md](history/FIX-19.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
