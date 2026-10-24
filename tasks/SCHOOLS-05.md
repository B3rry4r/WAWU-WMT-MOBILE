---
id: SCHOOLS-05
title: Admin screens: schools, courses, intakes
owner: YOU
area: SCHOOLS
order: 36
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: [SCHOOLS-02, SCHOOLS-04]
decisions: []
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# SCHOOLS-05 · Admin screens: schools, courses, intakes

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B13), dashboard branch `wmt/ADS-02` `0d16895` (wawu-dashboard, on the ADS-02 branch `95e1085`), mobile `wmt/ADS-02` (records). Status verifying; nothing is merged or live. No backend change: the screens use SCHOOLS-02's ten routes on backend `8fca5dd` as they are.

| # | Before | After |
|---|---|---|
| 1 | staff had no place to add or edit a school | `/schools` (the list, filter by category and shown or hidden, a page at a time), `/schools/new` (add), `/schools/[id]` (the school, its courses and their intakes: edit the school, add and edit a course, add and edit an intake, hide and show each) |
| 2 | `GET /admin/schools` pages by keyset on (name, id), so a renamed school can come back on a later page | the list drops any school id it already holds when it appends a page (the lead's note); `npm test` covers it, 6 of 6 |

Capability check "an admin can add a school with a course and an intake from the dashboard, and the public schools route returns it": passed live. A superadmin added "Lagos Design Academy" in the browser, then a course (₦150,000, 12 weeks, online) and an intake (14 Nov 2026, 30 seats), edited the school, and `GET /schools` (SCHOOLS-04) returned it with `courseCount 1` and `fromPriceKobo 15000000`. Pictures `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13/` `schools-1` to `schools-11` at 1440 px (list empty, create empty, create filled, the school with no course, the course modal, the course with no intake, the intake modal, the school with a course and an intake, edit the school, an edit modal, the list with the school).
- **Next:** a verifier session.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Staff need a place to add and edit schools.

## Scope

Dashboard screens over SCHOOLS-02's endpoints.

## Capability checks

- [ ] An admin can add a school with a course and an intake from the dashboard, and the public schools route returns it (SCHOOLS-04).

## Lead note (8 Oct 2026): paging from SCHOOLS-04

`GET /schools` pages by keyset on (name, id). A school renamed between two page reads can come back on a later page, so when the list appends a page it drops any school id it already holds. Add a test for it.

## Builder report

Built by a Sonnet builder, bundle B13, 24 Oct 2026. Dashboard `wmt/ADS-02` `0d16895`; mobile `wmt/ADS-02` (this file, `BACKEND_GAPS.md` G-1725 and G-1726, `SHARED-CHANGES.md` B13 #1, `docs/LOG.md`). **No backend change.**
- **Files (dashboard):** new `src/app/(app)/schools/page.tsx`, `schools/new/page.tsx`, `schools/[id]/page.tsx`; `src/components/schools/` (`SchoolForm`, `SchoolDetail`, `CourseModal`, `IntakeModal`, `SchoolBadges`, `schoolText.ts`); `src/lib/api/admin-schools.ts`, `schools-paging.ts` and `schools-paging.test.ts`; `src/components/layout/nav.ts` ("Schools" under Services); `scripts/generate-contract-types.mjs` (the ten routes keyed `adminSchools...`, the views, the seven DTOs, `SCHOOL_LIMITS`, the two enums) and the regenerated contract; `package.json` (`npm test` is `node --test` over the paging test) and `tsconfig.json` (`allowImportingTsExtensions`, so the test can import its module by file name).
- **Behaviour:** every limit is `SCHOOL_LIMITS` from the backend (text lengths, expertise items, weeks, list lines, seats, the fee ceiling, the founding year from 1800 to this year); a fee is typed in naira with at most two decimals and sent as whole kobo, and 0 is accepted; an edit sends only the fields that changed and is held when nothing has; an intake's seats cannot go below the seats taken (the server's 409 is shown in its words); hiding a school, course or intake asks first, showing is one press; nothing is deleted (there is no delete route, so no delete control). Roles are `ROUTE_ROLES`: superadmin and reviewer write, support reads with no controls and is told why, finance sees "Not your screen".
- **Defaults (agent), owner may override:** the list is a "Load more" over keyset pages with a count read so far and no total (the server sends none); hidden schools are listed, marked, because this is where they are brought back; the logo and the apply link are https links the admin pastes (no admin upload, G-195, G-1726); a new school opens on its own page to add its first course.
- **Dashboard checks:** `npm run check` exit 0, `npm run build` exit 0, `npm test` exit 0 (6 of 6), `python3 scripts/gates/run.py` 1 fail, 0 warn, 6 accepted (the same `finance/payouts/page.tsx:39` deferral as before). Before this bundle (main `c1dfca6` plus ADS-02): `npm run check` exit 0.
- **Not done:** paging past 25 schools was not driven live (one school exists on the stack); the append rule is covered by the unit test, and the control is a plain "Load more" over the server's cursor. Support and finance views were checked in code, not pictured.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
