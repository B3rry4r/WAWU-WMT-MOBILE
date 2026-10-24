---
id: SCHOOLS-05
title: Admin screens: schools, courses, intakes
owner: YOU
area: SCHOOLS
order: 36
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [SCHOOLS-02, SCHOOLS-04]
decisions: []
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# SCHOOLS-05 · Admin screens: schools, courses, intakes

## Current state

As of 24 Oct 2026, verified by a Sonnet verifier (T1, bundle B13): PASS. Dashboard `wmt/ADS-02` `0d16895`; status review; nothing is merged or live.

- The capability check passed live: a school, a course and an intake added in the browser come back on the public `GET /schools` (courseCount, fromPriceKobo, nextIntake), and every edit, hide and show of a school, a course and an intake is reflected there on the next read.
- `npm test` 6 of 6; the inherited gate failure `finance/payouts/page.tsx:39` is identical on dashboard main.
- One low for the sweep (F1: finance on a school's page gets a load error, not "Not your screen"). One note (N1: re-pin the contract at merge).
- **Next:** the merge agent (one dashboard PR for ADS-02, LEGAL-07 and SCHOOLS-05).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-05.md](history/SCHOOLS-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
