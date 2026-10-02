---
id: SCHOOLS-03
title: Schools: directory, school page, course page, no results
owner: DEV3
area: SCHOOLS
order: 60
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SCHOOLS-04, UI-02, UI-03]
decisions: [R-32]
passes: [V1, V4, V5, V6, V9]
artboards: [SC1, SC2, SC3, SC10]
---
# SCHOOLS-03 · Schools: directory, school page, course page, no results

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
