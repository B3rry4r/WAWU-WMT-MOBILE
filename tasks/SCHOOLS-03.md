---
id: SCHOOLS-03
title: Schools: directory, school page, course page, no results
owner: YOU
area: SCHOOLS
order: 62
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: done
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

Verifier (Sonnet agent, independent: wrote none of this), 10 Oct 2026, restart of an earlier verifier lost in a container restart (nothing of it was used). Mobile `origin/wmt/SCHOOLS-03` at `9396579`, trial-merged with `origin/main` `bda7c68`. Backend `origin/main` `7b4ffef` built and run locally (Hub on 6111, behind a logging proxy on 6114 that can delay, fail or reset a request on demand; wawu-id `fb8717e` on 6112; the web export of the branch on 6113, 390 wide, light and dark, Playwright). Real sign-in (`user@test.wawu.dev` through wawu-id, no injected token). Every request in the runs went to localhost; the only request that left it was the logo address of a school I wrote myself (`picsum.example`), and my guard aborted it. Nothing touched a real provider or a wawuafrica.com host. Scratch and pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vschools03/` (`shots/`, `*.json` for every run, `mutants.log`).

**Verdict: review. No blocker.** Three open `defect (low)` items (F1, F2, F5), two `unclear` (F3, F4), survived-mutant test gaps (F7) and notes (F6, F8) for follow-up; no capability check, ruling, state or entry failed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` EXIT 0 on the trial-merged tree (`check-merged.log`): typecheck 0 errors; lint 0 errors, 7 warnings (none in a schools file: eventsFocus, ticketsRefetchFails and professionals screens tests, all on main); jest 118 suites, 2004 tests, all passing (the builder's numbers, re-run, not trusted); gates 10 run, 469 files scanned, 0 fail, 1 warn (HOST-PICKER provisional, not this task's), 0 accepted, baseline 0 entries; task check 273 tasks. No flake hit. Check 2 (stand-ins for what main has): one finding, F1. Em-dash scan of `src/features/schools` and `src/app/schools`: none (comments excepted); no rating, Enroll, apply, Bookmark or "One payment" in any user-facing string |
| V4 Field trace | passed | Writer = the dashboard's admin routes (`POST /admin/schools`, `/admin/schools/:id/courses`, `/admin/school-courses/:id/intakes`, then `PATCH`), reader = SC1, SC2, SC3 (`v4.json`). A school written through the real admin route showed its name, place, since-year, expertise, about, logo, course count and fees on SC1 and SC2, and its title, length, mode, class days and place, start date, what it gives, syllabus and fee on SC3, each value as written. A rename and a price change reached SC2 on reload; hiding a course dropped it and moved "Courses 2" to 1; hiding the school removed it from SC1's list (SC10's copy shown) and made SC2 and SC3 read "not available". `matchedCourses`, `category`, `applyUrl`, `capacity` and `seatsLeft` are served and not drawn (decision 5, R-47, and the later tasks' entries); `reportEmail` and `hidden` never leave the Hub. Contract: the three schools paths and all 22 schemas whose names hold School, Course or Intake in mobile `contract/openapi.json` equal backend main's `contract/openapi.json` exactly (no drift) |
| V5 Picture | passed, with recorded differences | `shots/cmp-SC1-{light,dark}.png`, `cmp-SC2-*`, `cmp-SC3-*`, `cmp-SC10-*`, `cmp-X15-doors-*`, `cmp-H1-*`, `cmp-H36-*` (artboard left, built right, status bar cropped off the artboard). SC1, SC2, SC3, SC10 match the artboards in structure, order, spacing, copy and icons in both themes. Differs for a recorded reason: the picture blocks (decision 1, G-624), no rating (R-32, BRIEF SC1), "Yaba, Lagos" on the card (G-628), no "One payment", Bookmark, Enroll or "Or apply on ..." (R-47; G-626, G-627; SCHOOLS-06 and SCHOOLS-08), the course second line (F4), "Courses 4" and the fees, names and dates are the Hub's data, SC10's search text reads in the primary colour and SC10's block sits about 25 px lower than the artboard only because the artboard's status bar was cropped. Chips (shared `FilterChips`) measure about 2 px wider each and 0.5 px more apart than the artboard (F6, not this task's code) |
| V6 States | passed | Each entered by its real cause, light and dark, pictures in `shots/` (`sheet-SC1-states-*.png`, `sheet-SC2SC3-states-*.png`, `states.json`, `refresh.json`). Loading: the first read held 6 s on the proxy (SC1, SC2, SC3 shapes). Empty: SC10 by a search no school matches; "No Languages schools yet" with every Languages school hidden in the database; "No schools yet" with every school hidden. Error: the Hub answering 500 (3 requests, the app's two retries), message "Internal server error" with Try again, then Try again with a healthy Hub loads the list. No connection: the connection reset by the proxy ("No connection. Check your internet and try again." with the Wi-Fi-off icon). Failed refresh: reopening the list after its 30 s with the Hub answering 500 keeps the 20 rows and shows "Could not check for updates." with Try again; Try again clears it. Failed next page: page 2 answering 500 keeps the 20 rows, shows "Couldn't load more schools." and Try again, which sent exactly one request and loaded page 2. Not available: a hidden school or course (404), a random id (404) and `not-an-id` (400) all read "This school (course) is not available". Retry after 500 and after a reset worked on SC2 and SC3 |
| V9 Live seam | passed | Real login through wawu-id, then the schools I wrote through the admin routes (V4) were read back on SC1, SC2, SC3; signed out, `/schools`, `/schools/<id>` and `/schools/courses/<id>` all land on `/welcome` and send no schools request |
| V10 Device | NOT RUN | Not in this task's passes. Android hardware back is covered only by the Jest routes suite and mutants M18 and M19 (killed); not run on a phone. The web export does not run `BackHandler`, so the three routes' on-screen back and the browser's back were walked instead (below) |

### Capability checks, as written

- **SC1** a user can search, filter by chip and tap a school: passed live (search "pattern" finds Aba by a course title, "ABA" and "yaba" by place, case-insensitive; chip Tech, Creative; chip plus search; a tap opens SC2).
- **SC2** read the profile and tap a course: passed (`data-*.png`, `v4.json`).
- **SC3** length, classes, start date, what they get, syllabus: passed.
- **SC10** edit the search, pick a chip: passed (the box stays editable and the chips work from the empty state).
- Every value from the API: passed (14 seeded variations, second school and course with other values, `data.json`). No rating anywhere (R-32): none in any picture, label or string.

### Search, paging, Starts, time zones (all live, `behave1.json`, `behave2.json`, `data.json`, `v4.json`, the proxy log)

- **One request per change.** First load: 1 request (`limit=20`). Typing `pattern` at 40 ms a key: 1 request (`q=pattern`). Typing `fin` at 300 ms a key (under the 350 ms debounce): 1. `aba` then Enter: 1. Chip Tech: 1 (`category=tech`); chip Creative: 1; back to All: 0 (cached); chip plus search: 1.
- **Sanitising** (the value set into the box like a paste, so the browser does not filter it first): `tech<NUL> acad<TAB>my` sent `q=tech acad my`; only controls, only spaces or only a lone surrogate: no request; C1 control, line and paragraph separators and a byte order mark became spaces; a lone high surrogate was dropped (`abcd`); a whole emoji pair kept; NBSP and ideographic space became one space; `100% _ \ '"` sent as typed (the Hub treats them as text, and `100%`, `_`, `%` each find only the school with that character).
- **100 characters.** 150 typed characters: the box holds 100, one request with a 100-character `q`. Pasted: 150 x gave a 100-character `q`; 99 a plus an emoji gave 99 (the pair is never split); 60 emoji gave 50 (the Hub counts a pair as one, so 50 is the safe side); 100 a, a space, b gave 100.
- **Paging.** 49 visible schools (50 minus one hidden): 3 requests (first, `cursor` of "Filler School 16", `cursor` of "Filler School 36"), no cursor requested twice, the 49 rows seen equal the 49 the Hub lists, in the Hub's order, none twice.
- **Stale answers.** `q=fil` held 5 s while `q=filler school 01` answered at once: the screen showed the one row, and still showed it after the old answer landed. Rows from before stayed (20) while `q=fil` and `q=zzz` were in flight (no skeleton, no flash of empty); after an empty answer the next search shows the loading shapes, not the old empty words.
- **Starts rule.** The soonest class not started: a course with intakes on 1 Sep (past), 7 Nov, 12 Jan shows 7 Nov; a hidden earlier intake is never shown; all started (3 Aug, yesterday) or none at all: no Starts row and Classes reads the mode alone; a class starting today still counts (Starts today). A full class still gives its date (SC11's banner is SCHOOLS-06's). Time zones: the phone's calendar day decides, flipping at the phone's midnight (Africa/Lagos 23:59 shows the class on that day, 00:01 does not; Pacific/Pago_Pago, America/Los_Angeles and Pacific/Kiritimati each flip at their own midnight; `t_tz.py`). The date label is read as the calendar day it names and never shifted (all three zones pass `model.test.ts` and `detailScreens.test.tsx` unchanged).
- **Fee.** Naira from kobo on all three screens (`₦150,000` from 15000000, `₦9,999,999` from 999999999), no `.00`, no raw kobo anywhere. F2 and F3 are the edges.
- **Routes and entries.** Explore: "Find a school" sits between "Find a professional" and "List your services", opens SC1, back returns to Explore (light and dark; X15 matches). Home: the Schools tile is third in the row (Events, Legal, Schools), opens SC1 and back returns to Home; with TGIF off (H36, switched off through `PATCH /settings/tgif`) the tile is still there, the TGIF card is gone and no empty frame stands in its place (`home-tgif-off-*.png`, `cmp-H36-*.png`). Stack walk: Explore, SC1 (search "Green" kept), SC2, SC3; back from SC3 lands on SC2, from SC2 on SC1 with the search and the rows still there, from SC1 on Explore; the browser's back and forward agree; opened on its own, SC1 back goes to Explore, SC2 and SC3 back go to SC1. No horizontal page scroll at 320 wide (only the chip row scrolls), long names, titles, expertise, outcomes and a ₦9,999,999 fee wrap or truncate as drawn.

### Builder decisions 1 to 8

1. **Quiet picture blocks (110, 200, 170 high): CONFIRMED, differs-for-recorded-reason (G-624).** Not a placeholder R-47 forbids: R-47 bars entries, rows and tiles that lead to or stand for an unbuilt screen, and a picture slot is none of those; no ruling or brief entry asks for a no-picture state, and the canvas draws none for a school. It is the repo's convention for a designed picture the Hub does not serve (MediaCard's "quiet block", the events thumbnail and hero on a sunken block when `bannerUrl` is absent, EXPLORE-01's neutral frames), it is an empty frame with no word, figure, glyph or claim, and it keeps the layout so a later `coverUrl` lands with no change. Judgement the owner may reverse: if "nothing drawn that nothing fills" is the stricter reading, the three `Cover` uses go (SC2's hero would then need a plain bar for its Back and Share).
2. **No "One payment", no Bookmark, Bookmark's slot kept: CONFIRMED (R-47; G-626, G-627).** Nothing serves a payment plan, nothing saves a course, and Enroll is SCHOOLS-06's. The title stays centred (picture checked).
3. **One `location` string on the card and the profile: CONFIRMED (G-628).** The Hub serves one string; the card reads "Yaba, Lagos · 4 courses".
4. **Course row "12 weeks · online", hybrid as "online + in person"; Classes = mode, then the soonest coming class's days and place: CONFIRMED as a recorded default, with F4 open.** The mapping is the enum's own words and never invents; Classes matches SC3's "Online, Saturdays in Yaba" shape. The builder's reason "was never a field" is only partly true: `nextIntake.schedule` is served on every course card (see F4).
5. **`matchedCourses` served and not drawn: CONFIRMED.** SC1 draws no place for it and R-47 and R-29 forbid inventing one; a search by a course title lists the school without saying why (live: "Bootcamp" lists Greenfield), a designer may want the matched title on the card.
6. **Copy the canvas does not draw: CONFIRMED.** "No <Category> schools yet / Try another category.", "No schools yet / Check back later.", "No courses listed yet.", "This school (course) is not available / It may have been taken down or never existed.", "Couldn't load schools (this school, this course)": same tone and apostrophe as the app's other states, no em-dash, all seen live. A failed read prints the Hub's own sentence ("Internal server error"), which is the app's convention for every screen.
7. **SC2's Share opens the share sheet with the name and place, no link: CONFIRMED.** Same as E2's share (name, when, venue, no link); no link to a school exists and none is claimed. On the web export the tap does nothing (the browser has no share sheet; the rejection is swallowed); native NOT RUN.
8. **`nextIntake` typed as nullable locally (G-625): CONFIRMED.** The Hub does answer `null` for a course with no shown intake (seeded: Cloud Basics, French's hidden first intake): SC2 lists it, no crash. The contract's `nullable` beside a `$ref` is dropped by the generator, so the local type is the honest one; the row is in BACKEND_GAPS.
- **Home's Schools tile: CONFIRMED.** SCHOOLS-03 owns it: HOME-01's left-out table row names "Schools ... SC1 ... SCHOOLS-03" (and its H1 and H36 checks), EVENTS-01's U-H1 ruling says "the fourth is Schools ... from SCHOOLS-03", `Services.tsx`'s comment and the task's "Hub entries this task adds" say the same. It is drawn where H1 and H36 draw the services row, with the canvas's tile size, glyph and label, in the third column rather than the fourth: differs-for-recorded-reason, the lead's U-H1 ruling (b), the row packs from the left in canvas order and Pay bills stays off (R-42), so it reads Events, Legal, Schools. The Shop tile is gone everywhere (R-2).

### Findings

- **F1 defect (low, VERIFIER.md check 2).** `SchoolLogo` in `src/features/schools/parts.tsx` stands in for the shared `Avatar` (it reuses `initialsOf` and `hueFor` and redraws the rest), and SHARED-CHANGES SCHOOLS-03 #1 (`Avatar` `shape` prop, "open, NO OWNER") defers the swap. Mitigation: main's `Avatar` is a circle only, so SC1 and SC2's rounded-square logo cannot be built from it today; same shape of finding as EXPLORE-01 and SETTINGS-02, accepted by the lead at merge. Fix route: apply row #1, then delete `SchoolLogo`.
- **F2 defect (low, money display).** A fee with kobo is drawn without them, cut and not rounded: seeded `priceKobo` 1,234,567 (₦12,345.67) reads "from ₦12,345" on SC1, "₦12,345" on SC2's row and SC3's foot (`Money decimals={false}` floors). The Hub takes any whole-kobo fee (`CreateCourseDto.priceKobo`: `@IsInt() @Min(0)`, no whole-naira rule), so the screen can state a lower fee than the one SCHOOLS-06 will charge. Every whole-naira fee, the realistic case and the canvas's, draws right. Fix: draw the kobo when they are not zero, or have the admin route refuse a fee that is not whole naira (a lead or owner ruling).
- **F3 unclear (owner or designer).** A ₦0 course (the Hub allows `priceKobo` 0; R-8 allows free content) reads "from ₦0" on SC1 and "₦0" in SC3's foot; no design or ruling words a free course.
- **F4 unclear (designer).** The canvas's SC2 course line carries days ("12 weeks · online + weekends", "4 weeks · weekends"). Each course card carries `nextIntake.schedule` ("Saturdays") but the row reads length and mode only (decision 4 says the days "were never a field"). No rule says how to combine mode and days, so this is not called a defect.
- **F5 defect (low, test gap that hides a user-visible fault), M7.** `todayOf` read in UTC passes every test when jest runs in UTC (this machine's zone); in Nigeria (UTC+1) it would show an already-started class as "Starts" for the first hour after each midnight. Killed by `TZ=Africa/Lagos npx jest src/features/schools/__tests__/model.test.ts` (1 failure). A zone-proof test passes a `Date` whose local getters and `toISOString()` disagree.
- **F6 note (not this task's code).** Shared `FilterChips` draws each chip about 2 px wider (padding) and the gap 0.5 px wider than SC1's artboard; same on every screen that uses it.
- **F7 test gaps (survived mutants, with the test that kills each).** M12 (loading shapes after an empty search dropped: the screen would say `No schools for "zzzy"` before the Hub answers) needs a test that answers empty, then types again with the Hub held, and expects the shapes; M13 (the guard that stops the list asking again after a failed next page) needs a test that fails page 2, fires end-reached again and expects no new request; M14 (the "Could not check for updates." line with no rows) needs a refetch failure over an empty list. The code is right on all three (M12 live: shapes; M13 live: one request per Try again).
- **F8 notes.** G-624 to G-628 are free on every branch I checked (G-623 is on INBOX-05): re-check at merge. SC3 reads today once at mount, so a course page left open across midnight keeps yesterday's day until reopened (deliberate, commented). A school logo address that fails to load leaves the coloured square without initials (read from the code: a set `logo` draws the picture and never the initials, as the shared `Avatar` does with a `source`; not pictured). `asking` (the one-next-page guard) stays set until the old key's page answers if the person changes the search meanwhile; not hit in any run.

### Trial merge, checks, mutants

- **Trial merge** (throwaway worktree on `origin/wmt/SCHOOLS-03`, `git merge --no-commit --no-ff origin/main`): "Already up to date", **0 conflicts**. Main (`bda7c68`) is the merge base, so the merged tree is the branch's tree. On it: `tsc --noEmit` 0 errors, `expo lint` 0 errors (7 warnings, none in a schools file), full `npm run check` EXIT 0 (numbers in V1).
- **Diff against the report:** 27 files, the builder's list plus comment-only edits to `DoorsCard.tsx` and `TodayScreen.tsx` and the generated `docs/PROGRESS.md`; nothing extra in product code. The edits to the Home, Explore and Professionals tests only flip "not drawn yet" to "drawn" for this task's entries; no gate, baseline or other test touched.
- **24 mutants of my own** (`mutants.py`, each applied, its suites run, the file restored and compared; `mutants.log`), **20 killed, 4 survived**. Killed: M1 NUL kept in a search; M2 lone low surrogate kept; M3 no 100-character cut after cleaning; M4 pages joined newest first; M5 cursor mangled on its way to the Hub; M6 a class starting today not coming (`>=` to `>`); M8, M9, M10 the fee in kobo times 100, with kobo, and divided by 100 (SC1, SC3, SC2); M11 empty copy order (category over search); M15 Explore doors with school first; M16 the school door opening Professionals; M17 Home tile before Legal; M18 SC3's Android back not wired; M19 SC2 opened on its own going to Explore; M20 debounce 350 to 0; M21 query key without the category; M22 Classes from the first intake though started; M23 a bad id read as an error; M24 a rating figure on the card line. Survived: M7, M12, M13, M14 (F5 and F7).
- Environment notes: Python Playwright 1.56 and Pillow were installed into the scratch folder (`pylib`, not the repo) because `render_design.py` needs them; the artboards were rendered with `PYTHONPATH` set to it.

### NOT RUN

- V10: a phone. Native rendering of the logo ring and the share sheet, and Android's hardware back (only unit tests and mutants M18, M19). Unblocked by a development build on the same Wi-Fi as a local Hub (`docs/LOCAL.md`) and an Android phone.
- The production Hub: never called (rules).
- SCHOOLS-06's and SCHOOLS-08's checks (Enroll, "Or apply on the school's website", the class-full banner): belong to those tasks.
- Pull-to-refresh by hand (the web export has no pull gesture): the failed-refresh state was entered by reopening the list after its fresh window instead; the pull path itself is covered by `schoolsScreen.test.tsx`.

## Hub entries this task adds (R-41)

The HOME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

Merged by the lead, 10 Oct 2026 (mobile main, merge of `d270bb3`): the verifier's review, no blocker; the trial merge with main was clean and its full check exit 0. F2 (kobo), F3 (Free), F4 (class days), F5 (the phone's day) and the F7 tests follow in round 2 on the same branch.
