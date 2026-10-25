---
id: SCHOOLS-08
title: My courses and apply on the school's site
owner: YOU
area: SCHOOLS
order: 136
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [SCHOOLS-03, SCHOOLS-09, SCHOOLS-10, UI-02, SCHOOLS-06]
decisions: [R-12, R-33, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [SC8, SC9]
---
# SCHOOLS-08 · My courses and apply on the school's site

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (the trailing arrow fixed in code) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S5.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main. Built: Built after SCHOOLS-06 in the same branch; reads SCHOOLS-09's `GET /schools/enrolments` (never LearnCourse) and SCHOOLS-10's apply-link calls.
- **Built:** SC8 `MyCoursesScreen` (`/schools/mine`): Current and Finished tabs, newest first, cursor pages, one pill per row ("School will contact you" before the class starts, "In progress" once begun, "Not paid yet" for a held place that opens the pay screen, "Finished", "Refunded"); loading, empty per tab (with "Find a school"), error with retry, pull to refresh. "week 3 of 6" is left out (G-851). The Me menu gets its My courses row, first, as the canvas orders it (SHARED-CHANGES SCHOOLS-08 #1; no "1 enrolled" line, G-854). SC7's My courses button leads to SC8.
- **SC9** `ApplySheet` over SC3, drawn with Enroll and only for a school that gave a site: the link comes from `GET .../apply-link` (printed without `https://`), "Continue to their site" records one click with `POST .../apply-click` and opens the answer in the phone's browser, "Enroll on Who Made This? instead" opens SC4 (not drawn when no class can be joined). The raw `applyUrl` is never opened.
- **Checks:** same run as SCHOOLS-06 (one branch): tsc EXIT 0, eslint EXIT 0, gates EXIT 0, jest green (`enrolFlow.test.tsx` has the SC8, SC9 and Me cases).
- **Pictures:** SC8-my-courses, SC8-finished-empty, SC8-error, SC9-apply in the same folder as SCHOOLS-06's, beside `board-SC8` and `board-SC9`.
- **NOT RUN:** a real phone browser opening the link (jest checks `Linking.openURL` is called with the Hub's `url`; the stack run recorded the click path through the Hub only in the unit cases), the Finished tab with rows (no class on the stack ends this year), the current-tab empty state on the stack (every seeded student holds a place).
- **Round 2 (17 Oct 2026):** F4 fixed: SC9's "Continue to their site" no longer draws the trailing arrow the board lacks (`ApplySheet.tsx`). Same schools run: tsc EXIT 0, eslint EXIT 0, jest 156 of 156.
- **Next:** the batch 12 pull request (the lead). No low is left open.

Status set to review by the records sync, 25 Oct 2026: merged as app 5f0a87a4, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py SC8 SC9` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A7.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for SC8, SC9, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Built at launch (R-33): SC3, SC7 and M7 draw ways in on launch screens. SC8 reads the new school enrolments (SCHOOLS-09), never LearnCourse's `CourseEnrollment`. 'week 3 of 6' is left out until something writes progress (filed in BACKEND_GAPS.md). SC9's link and click log are SCHOOLS-10's.

## Artboards

- **SC8 · My courses**: My courses with Current/Finished tabs: Product Design Bootcamp · Greenfield · starts 3 Nov · 'School will contact you'; Pattern Cutting Basics · Aba Fashion Institute · week 3 of 6 · 'In progress'. Entry: SC7 My courses or Me menu.
- **SC9 · Apply on their site**: From SC3 'Or apply on their website'. Sheet: 'Apply on Greenfield's site. You finish signing up on their website. Your WAWU link tells them you came from here.' Shows greenfield.ng/apply?ref=wawu-7KQ2, 'Continue to their site', 'Enroll on WAWU instead'. Board note: 'Tracked link, for commission.' Section note: 'Or apply on the school's site through the WAWU link, and the school pays WAWU a commission.'

## Capability checks

- [ ] **SC8**: a user can switch Current/Finished; open an enrollment.
- [ ] **SC9**: a user can Continue to their site (external); Enroll on WAWU instead.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states SC9.
- [ ] From SC3's 'Or apply on the school's website' (SCHOOLS-03) and SC7's My courses (SCHOOLS-06), a user reaches SC9 and SC8 (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **SC8**: partial. Missing: No list route for my enrollments; CourseEnrollment has no school, intake, payment or status. 'week 3 of 6' needs a progress source (school or admin updates it), none exists. The existing enrol gate references the removed subscription.
- **SC9**: missing. Missing: Needs: SchoolLink(code, schoolId, courseId?) and a redirect endpoint (e.g. GET /api/hub/schools/go/{code} -> 302 + SchoolLinkClick row with userWawuId, courseId, ts); a way to learn conversions (school self-report in dashboard, CSV import, or a postback API the school calls); commission invoicing to the school (off-platform receivable). WAWU can see clicks only; conversions depend on the school.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- SC9: greenfield.ng/apply?ref=wawu-7KQ2
- SC9: 'the school pays WAWU a commission' (rate unstated)

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-08.md](history/SCHOOLS-08.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
