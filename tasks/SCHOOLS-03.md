---
id: SCHOOLS-03
title: Schools: directory, school page, course page, no results
owner: YOU
area: SCHOOLS
order: 62
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SCHOOLS-04, UI-02, UI-03]
decisions: [R-32]
passes: [V1, V4, V5, V6, V9]
artboards: [SC1, SC2, SC3, SC10]
---
# SCHOOLS-03 · Schools: directory, school page, course page, no results

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV3).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py SC1 SC2 SC3 SC10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A7.json`
- `docs/designer/BRIEF.md`: its entries for SC1 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Ratings (SC1's '4.8', SC2's '4.8 (1,240)') are left off at launch until the owner rules (R-32): nothing writes a school rating. Keep the cards' layout without the rating. Enroll is added by SCHOOLS-06 and 'Or apply on the school's website' by SCHOOLS-08 (docs/WORKFLOW.md section 7).

## Artboards

- **SC1 · Schools**: Schools directory: search 'Search schools or courses', category chips All/Tech/Business/Creative/Languages/Vocational, school cards with initials avatar, city, course count, rating and 'from' price (Greenfield Tech Academy, Lagos, 18 courses, 4.8, from ₦45,000; Aba Fashion Institute, Aba, 9 courses, 4.7, from ₦30,000). Entry: Explore (X15) · Find a school.
- **SC2 · School**: School profile: initials avatar, name, 'Yaba, Lagos · Since 2016 · 4.8 (1,240)', expertise chips (Product design, Software, Data, Cloud), blurb with a placement claim, 'Courses 18' list with course name, length/mode and price.
- **SC3 · Course**: Course detail: school name, course title, Length 12 weeks, Classes 'Online, Saturdays in Yaba', Starts Mon 3 November, You get 'Certificate, mentor, portfolio', numbered syllabus, secondary link 'Or apply on Greenfield's website', sticky price '₦150,000 One payment' + Enroll.
- **SC10 · No results**: From SC1 no results: query 'drone piloting', 'No schools for "drone piloting" · Try a shorter search, or browse a category.'

## Brief changes (build these, not the canvas)

- **SC1**: no rating at launch; the card keeps its layout without it. (Why: R-32: nothing writes a school rating.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- SC3: Enroll (opens SC4): added by SCHOOLS-06
- SC3: Or apply on the school's website (opens SC9): added by SCHOOLS-08

## Capability checks

- [ ] **SC1**: a user can search schools or courses; filter by category chip; tap a school.
- [ ] **SC2**: a user can read profile; tap a course.
- [ ] **SC3**: a user can read the course: length, classes, start date, what they get and the syllabus.
- [ ] **SC10**: a user can edit search; pick a category chip.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states SC10.
- [ ] No school rating is shown anywhere (R-32).

## What the backend serves today (from the analysis)

- **SC1**: missing. Missing: Needs School model + GET /api/hub/schools?category=&q= returning aggregate courseCount and min price; rating requires a review system that does not exist (Product.ratingAvg comment forbids seeded ratings).
- **SC2**: missing. Missing: Needs GET /api/hub/schools/{id} with nested courses. ratingCount 1,240 needs reviews; placement claim is free text the admin enters.
- **SC3**: missing. Missing: Needs GET /api/hub/schools/courses/{id} with intakes[], syllabus[], outcomes[], priceNaira, applyUrl (tracked). 'One payment' implies a payment-plan field (instalments not drawn).
- **SC10**: missing. Missing: Same as SC1: no schools search endpoint.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- SC1: Greenfield Tech Academy · Lagos · 18 courses · 4.8 · from ₦45,000
- SC1: Aba Fashion Institute · Aba · 9 courses · 4.7 · from ₦30,000
- SC1: ratings 4.8 / 4.7 (no review system exists to derive them)
- SC2: Since 2016
- SC2: 4.8 (1,240) rating
- SC2: '6,000 graduates placed in Lagos and remote roles' (marketing claim WAWU would publish)
- SC2: Product Design Bootcamp 12 weeks ₦150,000
- SC2: Frontend Development 16 weeks ₦180,000
- SC2: Data Analysis with Excel 4 weeks ₦45,000
- SC3: ₦150,000 One payment
- SC3: Starts Mon 3 November
- SC3: You get Certificate, mentor, portfolio (school's claim)

## Designer notes (⚠, unresolved)

- None.

## Builder report

Builder (Sonnet agent), 10 Oct 2026. Mobile `wmt/SCHOOLS-03`, code at `a6e75c6` (from `origin/main` `ad4eebd`), then `origin/main` `bda7c68` merged in. No backend change: SCHOOLS-04's routes are on backend `origin/main` (`7b4ffef`), which ran locally for every picture below.

**Built (new files under `src/features/schools/` and `src/app/schools/`):** SC1 `/schools` (search "Search schools or courses", chips All/Tech/Business/Creative/Languages/Vocational, a card per school: picture block, logo, name, place and course count, "from" fee; paging by the Hub's cursor; pull to refresh), SC10 as the same screen when a search matches none, SC2 `/schools/<id>` (logo, name, place and year, expertise pills, about, "Courses <count>" and a row per course with length, mode and fee; Back and Share), SC3 `/schools/courses/<id>` (school, title, Length, Classes, Starts, You get, numbered syllabus, the fee at the foot). States: loading shapes, empty (SC10 as drawn; a category nobody is in; no school at all), error and no-connection with Try again, a refresh that fails keeps the rows with a line, a next page that fails keeps the rows with Try again, "not available" for a 404 or a link that is not an id. Android back on all three. No rating anywhere (R-32); no Enroll, no "Or apply on the school's website" (R-47: SCHOOLS-06 and SCHOOLS-08 add them).

**Entries (R-27, R-41):** Explore's "Find a school" door (X1, X15; between Find a professional and List your services) and Home's Schools tile (H1 and H36, third in the row, BRIEF H1) both open SC1. Checked for others: Explore search's Schools tab is EXPLORE-05's, My courses is SCHOOLS-08/09's, SC4 to SC9 and SC11 are SCHOOLS-06/08's; nothing else enters SC1.

**Capability checks:**
- SC1 search, chip and tap: `schoolsScreen.test.tsx` (31 tests: debounce, the search key, the exact requests `q=`, `category=`, `cursor=`, a NUL or tab or lone half of a character never sent and a request of only controls is no search, 100-character cap, rows stay between searches, a tap passes the id); live against the local Hub in the web export (search "pattern" finds a school by a course title; the request sent for `tech\0 acad\tmy` was `q=tech%20acad%20my`).
- SC2 read profile and tap a course: `detailScreens.test.tsx`; live.
- SC3 length, classes, start date, what they get, syllabus: `detailScreens.test.tsx`; live. "Starts" is the soonest class that has not started; none coming means no Starts row.
- SC10 edit search and pick a chip: tests, and live ("drone piloting" against the real Hub).
- No figure is a literal: every test gives a second school or course with other values and asserts the other words; no rating test asserts no star, no `4.8`-shaped figure.
- States by real causes (live, route interception on the real web export for the Hub being down, offline and slow; the real Hub for 404 and 400): pictures below.
- Routes and entries: `routes.test.tsx` (16 tests), Explore and Home suites updated (`screens.test.tsx`, `HomeScreen.test.tsx`, professionals `routes.test.tsx`).

**Mutants** (each applied, its suites run, the file restored): 27 run, 26 killed at once (control characters not replaced, lone halves kept, no length cap, no debounce, `q`/`category`/`cursor` sent wrong, rows blank between searches, rating drawn, a started class shown, kobo drawn, outcomes row empty, an Enroll button drawn, syllabus numbering, 400 not read as gone, course and school taps wrong, signed-out route drawn, Android back not wired, Explore door removed or wrong, Home tile removed or wrong, page replacing page, duplicate school). One survived the first test set (kobo drawn on the fee); the fee tests now assert no `.00`, and it and its twin on SC1's fee are killed.

**Pictures** (web export at 390 wide against the local Hub, Playwright, light and dark, beside the rendered artboard; the artboard's status bar is cropped off SC1, SC3 and SC10): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/schools03/shots/x/cmp-SC1-{light,dark}.png`, `cmp-SC2-*`, `cmp-SC3-*`, `cmp-SC10-*` (each: artboard left, built right); more in the same folder: `SC1-creative-*`, `SC1-search-*`, `SC1-logo-*` (a school with a picture logo); in `.../shots/y/`: `home-tile-*`, `explore-door-*`, `SC1-loading-*`, `SC1-error-*`, `SC1-offline-*`, `SC1-languages-*`, `SC2-loading-*`, `SC2-gone-*`, `SC3-loading-*`, `SC3-gone-*`. Every request in the runs went to localhost; none to a wawuafrica.com host.

**Decisions (Default (agent), owner may override):**
1. The pictures at the top of a school card (110), the school page (200) and the course page (170) are quiet blocks: the Hub serves a logo and no cover or course picture (G-624). The logo is the school's picture or its initials on a hue.
2. "One payment" under the fee is not drawn (nothing serves a payment plan and Enroll is SCHOOLS-06's), so the foot holds the fee alone (G-626). The SC3 Bookmark is not drawn: nothing saves a course (G-627); its slot is kept so the title stays centred.
3. The Hub serves one `location` string; the card and the profile both draw it as it is, so a card reads "Yaba, Lagos" where the canvas has "Lagos" (G-628).
4. A course row reads "12 weeks · online" from `weeks` and `mode` (hybrid reads "online + in person"); Classes reads the mode, then the soonest coming class's days and place ("Online, Saturdays in Yaba"). The canvas's "online + weekends" was never a field.
5. `matchedCourses` (the course titles a search matched) is served and not drawn: SC1 has no place for it. A designer may want it on the card when a search matches a course.
6. Copy the canvas does not draw, in its tone: "No <Category> schools yet" with "Try another category.", "No schools yet" with "Check back later.", "No courses listed yet.", "This school (course) is not available" with "It may have been taken down or never existed.", "Couldn’t load schools (this school, this course)". An em-dash appears in none.
7. SC2's Share opens the phone's share sheet with the school's name and place (no link: no public link to a school exists).
8. `nextIntake` can be null for a course with no shown intake; the generated type says it cannot (G-625), so the app types it as the Hub sends it.

**Gaps and shared changes:** G-624 to G-628 (BACKEND_GAPS; numbers taken above G-623, the highest on origin when written, re-checked before the push); SHARED-CHANGES SCHOOLS-03 #1 (`Avatar` gets a square shape; `SchoolLogo` in `parts.tsx` stands in).

**Checks, before > after:** gates (10 run) 0 fail, 1 warn (the HOST-PICKER provisional, not this task's), 0 accepted, 455 files > 0 fail, 1 warn, 0 accepted, 469 files (the gate failed once on a `gap` key in my metrics object, renamed; no baseline touched); jest 76 suites at the start of the day's main > 118 suites, 2004 tests, all passing at the merge with `origin/main` `bda7c68` (this task adds 4 suites, 103 tests, and edits the Home, Explore and Professionals suites); typecheck and lint 0 errors (no warning in my files). `npm run check` exit 0 on the third run. The first run failed only `src/features/professionals/__tests__/screens.test.tsx` (a load timeout in a suite this task did not touch, 25 of 25 pass alone) and the second only `src/features/events/__tests__/eventsScreens.test.tsx` (the known flake, 47 of 47 pass alone); logs `check1.log` to `check3.log` in the scratch folder.

**NOT RUN:** a phone (V10): needs a tester build against a Hub with the schools routes (they are live on production per the lead) on an Android phone. Native rendering of the logo ring and the share sheet: the pictures are the web export; the unblocking fact is a development build on the same Wi-Fi as a local Hub (`docs/LOCAL.md`). A real production Hub read: never called (rules); V9 ran against the local Hub built from backend `origin/main`. Enroll, "Or apply on the school's website" and the class-full banner (SC11) are SCHOOLS-06 and SCHOOLS-08's, so their checks belong to those tasks.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
