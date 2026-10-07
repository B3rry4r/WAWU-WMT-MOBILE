---
id: SCHOOLS-04
title: Schools: browse, search, course detail
owner: DEV3
area: SCHOOLS
order: 20
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SCHOOLS-02]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-04 · Schools: browse, search, course detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC1-SC3 and SC10 need a public list, search, a school page and a course page with intakes and seats left.

## Scope

GET schools (category, q), school by id, course by id with intakes; a 'schools' tab in the existing search.

The schools tab in search is this task's; EXPLORE-05 depends on it.

## Capability checks

- [ ] A user can search 'design' and get schools whose courses match.
- [ ] A course page shows each intake's seats left from real enrolment counts.

## Builder report

Builder, 7 Oct 2026. wawu-backend `wmt/SCHOOLS-04` `6f10845` (from `origin/main` `3041887`, which holds SCHOOLS-01 and SCHOOLS-02 #70); mobile `wmt/SCHOOLS-04`.

**Built (all new, additive, public, no account needed):**
- `GET /schools?category=&q=&limit=&cursor=`: a school card (name, category, place, logo, founded year, expertise, `courseCount`, `fromPriceKobo`, `matchedCourses`), ordered by name then id, `limit` 1 to 50 (default 20), `{ items, nextCursor }` like the other list routes (a cursor must be a school id this server gave out, else 400). `q` matches a school's name or place, or the title of one of its SHOWN courses, any case; `%`, `_`, `\` and regex characters mean themselves (escaped; a mutant without the escape fails).
- `GET /schools/{id}`: the school page: about, `applyUrl`, expertise, and its shown courses, each with the next shown intake and its seats left.
- `GET /schools/courses/{id}` (declared before `:id`): the course page: length, mode, syllabus, outcomes, `priceKobo`, the school, and every shown intake soonest first with `capacity`, `seatsLeft` (capacity minus `seatsTaken`, never below 0) and `full`.
- `GET /search?q=&tab=schools`: a new `tab` value; the answer has the same three arrays (empty) plus `schools` (the same cards, first 20). Every other tab answers with exactly its old keys (spec). Added in `search-response` (not fenced) with the schools module imported by `SearchResponseModule`, so `src/app.module.ts` is untouched.
- Hidden rows never leave: school, course and intake are each checked on `hiddenAt` (a hidden school hides its courses and intakes; a hidden course hides its intakes). A hidden row is 404 on its page. No rating field (R-32), no `reportEmail`, no `hiddenAt` in any answer. No table, no migration, no new data, so nothing to add to the account purge map or the data export (the catalogue holds no person's data).

**Decisions (recorded, default):** (1) `GET /search` `tab=all` is NOT given a `schools` key: the web calls it and a new key would widen its answer; the app asks `tab=schools`. (2) The `schools` key is not in the contract's `SearchResults` schema (that type is in fenced `src/common/types` and the web reads it); the app types school cards from `GET /schools` (G-330). (3) Past intakes are not dropped: the dashboard decides what is shown, and hiding is its tool. (4) An empty `q` counts as no `q`; a `q` over 100 characters, a NUL or a lone surrogate is 400. (5) Course page lives at `/schools/courses/{id}` as the analysis planned (not `/school-courses/{id}`).

**Capability checks:**
- A user can search "design" and get schools whose courses match: spec `a user can search "design"...` (`q=DESIGN` returns the school with `matchedCourses: ["Product Design"]`, not the unrelated school; a hidden course "Hidden Design Secret" does not match). Also through `tab=schools`.
- A course page shows each intake's seats left from real counts: spec writes `seatsTaken` 7 of 20 and 10 of 10 and reads 13 left / full, then moves it to 19 and reads 1 left; a hidden intake is absent.

**Specs:** `src/schools/tests/schools-public.contract.spec.ts`, 11 tests, 11/11 (with admin schools, search-response and the schools schema specs: 88/88). Odd inputs, each 400 or 404, none 500: NUL and lone surrogate in `q` and `cursor`, 5000-character `q`, `q=a&q=b`, `q[a]=1`, `limit` 0 / 51 / 1e20 / abc / duplicated, unknown param, malformed ids on both detail routes, absent ids, `category` unknown or duplicated; a malformed percent sequence is plain text (200). Mutants run on the service, each fails the spec: school hidden check dropped on the course page (3 tests fail), course hidden dropped (1), school hidden dropped on the school page (3), intake hidden dropped on the course page (1), seats left ignoring seats taken (3), off by one on seats left (3), no LIKE escape (1), `take` without the extra row (1), cursor without `skip` (1), hidden course counted in the search match (1).

**Checks, before > after:** `tsc --noEmit` 0 > 0; gates 16 fail / 76 accepted on both (`origin/main` and the branch); `check_baseline.py` ok; `scripts/protected-routes/run.sh --fresh` 253/253 (244 required) passed; eslint clean on the non-test files; `npm run contract:build` regenerated: 3 paths added, `/search` differs only in the `tab` enum (a fifth value `schools`), 0 paths or schemas removed. Mobile contract copied from the branch, `sync_contract.py` run, `SOURCE_COMMIT` names the branch commit; mobile `npm run check` exit 0 (typecheck, lint, tests, gates 0 fail, task check).

**Shared changes filed:** SCHOOLS-04 #1 (backend `contract/openapi.json`), #2 (mobile contract and generated types). **Gap filed:** G-330.

**NOT RUN:** a probe against a built `node dist/src/main.js` (the spec runs the same global pipe, filter and interceptor through supertest, not `main.ts`); V9 from the app (no screen reads these yet; SCHOOLS-05 and SCHOOLS-06 build them); the seat race (SCHOOLS-07 writes `seatsTaken`).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
