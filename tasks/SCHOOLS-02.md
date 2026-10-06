---
id: SCHOOLS-02
title: Admin: create and edit schools, courses and intakes
owner: DEV3
area: SCHOOLS
order: 16
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
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

Verifier, 6 Oct 2026, independent session (did not build it). Backend `wmt/SCHOOLS-02` `a997842`, which already contains `origin/main` `a94f338` (nothing to merge); mobile `c77f27e` (also contains main). Own databases `wawu_hub_test_schools_02_verify` and `wawu_hub_protected_schools_02_verify`; mock WAWU ID on 4156; built Hub (`node dist/src/main.js`) on 4155 with real admin logins (`POST /admin/auth/login`) for superadmin, reviewer, support and finance, and a real user token from the mock. Port 4001 was free, so the specs ran against my mock via `WAWU_ID_BASE_URL`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (counts match the builder's) | Backend: `tsc --noEmit` 0; `scripts/gates/run.py` 9 gates, 738 files, 16 fail / 35 warn / 76 accepted (a `git archive` of `origin/main` gives 732 files, 16 / 34 / 76: the 16 fails are main's, the one extra warn is `PROVISIONAL(SCHOOLS-ADMIN-LIMITS)`); `check_baseline.py` 108 entries, all with owner and reason; eslint `--no-fix` clean on the five new non-test files. Mobile: `npm run check` exit 0, 43 suites, 754/754, gates 9 run, 195 files, 0 fail 0 warn, task check ok. |
| V2 Contract | **failed** (finding D1, D2) | `npm run test:contract -- src/admin/schools src/schools` 46/46; `src/admin` 12 suites 333/333. Live HTTP probes of every write route with unexpected formats (about 230 requests): the validation is sound (wrong types, strings for numbers, `03/11/2026`, ISO date-times, 30 February, `2026-1-3`, `99999-01-01`, `TECH`, `in-person`, `http:`/`javascript:`/`data:`/`ftp:` links, bare hosts, `wawu/` links, a phone in the email field, an email with a newline, 121-char names, NUL characters, 13 expertise items, price `"100"`, `100.5`, `-1`, `2147483648`, bad JSON, an array or string body, non-UUID ids, `seatsTaken` on every route, unknown fields, `schoolId`/`courseId` moves) all answer 400 and 404 for an unknown id. Four unexpected inputs answer 500: see D1 and D2. A user token is 401 on all 10 routes, no token 401, finance 403 on all 10, support 403 on all 5 writes and 200 on the 5 reads, reviewer allowed, superadmin allowed. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` run three times on a fresh seeded DB: 253/253 passed, 244 required, every time (no flake seen in my 3 runs; the builder's 2 failures on a first main run did not reproduce here and I did not run main itself). `contract/openapi.json` against `origin/main`: no path or schema removed, no existing schema changed, 6 paths and 11 schemas added; 5 existing paths (`/services/mentors`, `/services/mentors/{id}`, `/professionals/applications`, `.../mine`, `.../{id}/listing`) differ only in the order of a `required` list or a `oneOf` item's keys, identical when compared order-insensitively (generator ordering, no change in meaning). Migration `20261006100000_schools_hidden` sorts after main's newest (`20261004141500_legal_documents`) and is three `ADD COLUMN ... TIMESTAMP(3)` nullable and nothing else; it applied clean on a fresh DB. Fenced files: `prisma/schema.prisma` gains exactly the three `hiddenAt` fields, `src/app.module.ts` gains exactly one import and one entry, `contract/openapi.json` regenerated; this equals the SHARED-CHANGES row SCHOOLS-02 #1. |
| V4 Field trace | passed, one open point (finding U1) | Writers: School `name category location foundedYear expertise about logo applyUrl reportEmail` written on POST and PATCH (foundedYear, logo, applyUrl can be cleared with null; expertise `[]`); SchoolCourse `title weeks mode syllabus outcomes priceKobo`; CourseIntake `startDate schedule location capacity`; `hiddenAt` via `hidden` at all three levels; `id createdAt updatedAt` by the database; `seatsTaken` has no writer here by design (400 on POST and PATCH, owned by SCHOOLS-07's claim). Read live: POST school, course and intake, then `GET /admin/schools/:id` returned every field equal; list shows `id name category location logo hidden courseCount createdAt updatedAt`; paging walk of 15 rows at limit 7 returned 15 unique ids. Hide and show work at each level, the admin routes still read a hidden row, and `hidden` is stored as `hiddenAt` (checked in the DB). No reader of these tables exists on the branch yet except the admin service (grep), so the reader plan is a plan: SCHOOLS-04 must serve only `hiddenAt` null at each level. |
| V9 Live seam | partly run, rest NOT RUN | Run: the built Hub, a real `POST /admin/auth/login` for each role, a real mock-WAWU-ID user token, every route driven over HTTP, results above, a read-back from the admin route and the database. A 409 capacity guard run live: seats set to 5 in the DB, capacity 4 answers 409, `{capacity: 4, hidden: true}` answers 409 and the hide is not applied (`hiddenAt` stays null), capacity 5 answers 200. NOT RUN: the dashboard screens (not in these checkouts) and a signed-in app reading these routes (nothing reads them until SCHOOLS-04). A concurrent seat-claim race was not driven live; the guard is a single `updateMany` with `seatsTaken <= capacity` in its `where`, read in `school-admin.service.ts`. |

Capability checks as written: "an admin can add a school with a course and an intake and read it back from the admin route" passed live; "a user token is refused on every admin school route" passed live (401 on all 10).

### Findings

**D1 (defect, V2): a `null` in a PATCH for a required column answers 500.** `PATCH /admin/schools/:id` with `{"name":null}`, `{"about":null}`, `{"location":null}`, `{"expertise":null}`; `PATCH /admin/school-courses/:id` with `{"title":null}` or `{"priceKobo":null}`; `PATCH /admin/school-intakes/:id` with `{"capacity":null}` all answer `500 Something went wrong. Please try again.`, and the same three-field cases on create correctly answer 400. The update DTOs use `@IsOptional()` which lets `null` through, and the service passes it to Prisma, which rejects it on a non-nullable column. It should be a 400 that names the field (as `name: ""` does). The same body with `null` on the nullable columns (`foundedYear`, `logo`, `applyUrl`, intake `location`) works as intended. Reproduce on the built Hub: `curl -X PATCH $B/admin/schools/<id> -H 'authorization: Bearer <superadmin>' -H 'content-type: application/json' -d '{"name":null}'`.

**D2 (defect, V2): `startDate: "0000-01-01"` on `POST /admin/school-courses/:id/intakes` answers 500.** It passes `isCalendarDate` (JavaScript reads year 0 and writes it back unchanged) and then Postgres refuses the date. A start date that early should be refused as 400; the same applies to any year the database cannot hold. (`99999-01-01` is correctly 400.)

**U1 (unclear, reader plan lives in one place):** the rule "SCHOOLS-04 serves only rows whose `hiddenAt` is null at each level" is written in SHARED-CHANGES row SCHOOLS-02 #1 and the builder report only. `tasks/SCHOOLS-04.md` (and `SCHOOLS-07.md`, where a hidden intake must not take an enrolment, and `SCHOOLS-10.md`) say nothing of it, and the builder did not edit them. Someone with the owner's or lead's authority should add one line to SCHOOLS-04 and SCHOOLS-07, or it will be missed. Not a code defect in this task.

**Minor records (no defect, no action required to pass):**
- `PATCH` with `{"startDate": null}` on an intake answers 200 and changes nothing (the null is dropped silently); `{"hidden": null}` the same.
- Hiding an already hidden row stamps `hiddenAt` again with the new time (the original hide time is lost).
- `GET /admin/schools?cursor=nonsense` (or an unknown UUID) answers 200 with an empty page, not 400.
- A name like `<b>x</b>` is stored as typed (no escaping at write; the admin is trusted and the apps render text, so this is a note for SCHOOLS-04's readers).
- `logo` accepts `https://user:pass@host/...` and upper-case `HTTPS://`; both are https, so they meet the stated rule.
- A past start date and a price of 0 are accepted; no ruling bounds either (the limits are `PROVISIONAL(SCHOOLS-ADMIN-LIMITS)`, owner to confirm).
- The role matrix (read superadmin, reviewer, support; write superadmin, reviewer; finance refused) is the builder's default and is labelled as such; confirmed as built, not as a ruling.
- The builder's first mobile commit `dec994b` lacks the session trailer; record only.
- The Hub's success body repeats `statusCode: 200` on a 201 (existing interceptor behaviour on every route, not this task).

Status: back to `building` for D1 and D2. Everything else passed.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
