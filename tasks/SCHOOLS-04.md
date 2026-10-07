---
id: SCHOOLS-04
title: Schools: browse, search, course detail
owner: DEV3
area: SCHOOLS
order: 20
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
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

Verifier V1, 7 Oct 2026. Independent session. Backend `wmt/SCHOOLS-04` `6f10845` merged with `origin/main` (already up to date, no merge commit), mobile merged the same. Evidence in the verifier's scratchpad (`schools04v/`: `odd.py`, `walk.py`, `skip.py`, `seats*.py`, `cap.py`, `br.json`/`mn.json`, `prot-1.log`/`prot-2.log`, `mcheck.log`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 diff vs report | passed | 10 backend files as reported; no migration or schema change; `src/app.module.ts`, `src/common/**` untouched; SearchResponseModule imports the schools module. Mobile: contract, generated types, SHARED-CHANGES, BACKEND_GAPS, LOG, PROGRESS, task file only. |
| Gates and checks | passed | backend `tsc --noEmit` 0; gates 16 fail / 58 warn / 76 accepted on the branch (891 files) and on main (885 files), identical finding lists; `check_baseline.py` ok; mobile `npm run check` exit 0 (1183 tests, gates 0 fail, 309 files). |
| V3 protected routes | passed | `run.sh --fresh` on the branch, twice: 253 passed, "all 244 required tests passed", both times. `/search` other tabs: 180 captured requests (18 terms x 5 tab values x with and without a real login token, 24 with rows), byte-identical status and body between main's build and the branch's build on the same database. |
| Contract | passed | `npm run contract:build` regenerates exactly the committed file. Against main: 3 paths added, `/search` differs only in the `tab` enum (fifth value `schools`), 0 paths and 0 schemas removed or changed, 6 schemas added (`PublicSchoolCard` and five more). Mobile `contract/openapi.json` equals the backend branch file; SHARED-CHANGES SCHOOLS-04 #1 and #2 are accurate. G-330 appears once across main and every origin `wmt/*` branch. |
| Full backend contract suite, branch vs main | NOT RUN | The specs hard-code the mock WAWU ID on port 4001 (`MOCK_WAWU_ID_PORT = 4001`), and another session's mock holds 4001 with other keys, so tokens 401 (privacy-settings, saved-item, credits-state fail for that reason, not for this branch). Run instead: `src/schools`, `src/search-response`, `src/admin/schools` specs: branch 5 suites 88/88, main 4 suites 77/77 (+11 new). |
| V2 live, built Hub | passed with defect D1 | `node dist/src/main.js` from `npm run build`, real logins through the repo's mock WAWU ID (not /home/user/WAWU-ID; the mock is the one the contract suite uses), admin routes through a seeded superadmin. 60 schools (ties on name, `%`, `_`, `\`, regex and SQL-ish names, accents), courses, intakes. |
| V4 odd input | passed | 1,500 requests across `GET /schools`, `/schools/{id}`, `/schools/courses/{id}`, `/search?tab=schools` (NUL, lone surrogates, 200,000-character `q`, `%`, `_`, `\`, regex, SQL strings, `q=a&q=b`, `q[]=`, `q[a][b]=`, `__proto__`, bad uuids, trailing slash and case, categories outside the enum, limit 0, -1, 1e20, NaN, Infinity, 0x10, 30 nines, cursors malformed, foreign, upper-case, 5000 characters, 800 random fuzz): 765 x 200, 721 x 400, 8 x 404, zero 500 on these routes. The 200,000-character `q` resets the connection at Node's header limit, not a 500. `q` 100 characters is 200, 101 is 400. |
| V9 live seam | passed | Public: no token, a real user token, a garbage token, a Basic header and an admin token all get 200 on the three routes and `/search`. Answers carry no `hiddenAt`, `reportEmail` or `rating`. Seats: 10 taken of 10 is `seatsLeft` 0 and `full`; 7 of 10 is 3; 9 of 10 is 1 and not full; DB check constraint refuses taken above capacity and the admin refuses a capacity under taken (409), so a negative number cannot arise. Hiding an intake drops it and moves the school page's `nextIntake`; showing restores both. Hidden course: course page 404, its intake ids 404 as course and as school, gone from the school page and `courseCount`. Hidden school: school page, its courses and its search card all gone. All intakes hidden: course page 200 with an empty list. |
| Paging walk | failed (D1) | Limits 1, 2, 3, 7, 20, 50 visit all 60 visible schools once each, same order for every limit, ties on name ordered by id (31 tie pairs), with `q`, `category`, wildcard queries. Hiding a school mid-walk: the hidden school never appears afterwards; but see D1. A page that ends exactly at the last row gives `nextCursor` null. |
| Own mutants | 4 of 11 killed | On a scratch copy, spec 11 tests: `Max(50)` to 51 killed; `Min(1)` to 0 killed; cursor check removed killed; intake order desc killed. Survived: `q` length 100 to 101; `more` `>` to `>=`; default page 20 to 21; matched courses cap 3 to 4; `full` at `<= 1`; `fromPriceKobo` min to max; no id tiebreak in the order. Each of those behaviours is right live (checked above and in the walk), so these are gaps in the spec, not in the code. |

**Findings**

- **D1 (defect): hiding the school a page ended on skips the next school.** `GET /schools?limit=3` gives `nextCursor` = school C. The dashboard hides C. `GET /schools?limit=3&cursor=C` now skips the school that should come right after C (first expected row `4a5e97b4...` missing; the page starts at the second). Cause: Prisma `cursor` with `skip: 1` assumes the cursor row is in the filtered set; a hidden cursor row is not, so the skip eats the first real row. The same happens with a cursor school that does not match `category` or `q`. The task asks the walk to visit every visible row once with hide and show toggled during it, and a cursor "must not skip hidden rows". `walk.py` reproduces it (58 of 59 visible rows seen), `skip.py` shows the page. Fix direction (builder's choice): page by a keyset comparison on `(name, id)` read from the cursor row, not by `cursor` plus `skip`, so a cursor row that is no longer shown still positions the page. Add a spec: hide the cursor school between two requests and expect no missing row.
- **Spec gaps (minor, not defects):** the seven surviving mutants above; add boundary tests for `q` at 100 and 101 characters, the last page when the remaining rows equal the limit, the default of 20, the cap of 3 matched courses, 1 seat left not full, `fromPriceKobo` the lowest price, and ties on name.
- **G-330 (the `schools` key is not in `SearchResults`): acceptable.** `PublicSchoolCard` and `PublicSchoolsPage` are in the contract, so the app types the cards from them (or from `GET /schools`) and reads `schools` off `/search` with one local intersection type. Widening `SearchResults` would change a schema the web reads. EXPLORE-05 should say so in its task when it takes the tab.
- **unclear (not this task): `GET /search?q=%00` answers 500** on tabs all, content and creators. Same on main (verified on a build of `origin/main`); `tab=schools` answers 400 for it. `/search` is protected, so this is for the owner or a separate task, not a SCHOOLS-04 defect.
- **Cursor note (not a defect):** a foreign cursor that is a hidden school's id returns the rows after it by name. No hidden row's content is returned; only its sort position is implied.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
