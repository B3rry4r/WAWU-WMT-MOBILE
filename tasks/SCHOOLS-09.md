---
id: SCHOOLS-09
title: Enrolment report to the school, and My courses
owner: YOU
area: SCHOOLS
order: 133
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SCHOOLS-07]
decisions: [R-12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-09 · Enrolment report to the school, and My courses

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Backend `wmt/B2` (from `origin/wmt/MERGE-7` 432f017), SCHOOLS-09 at 1ba6884, in one branch with SCHOOLS-11 (head be8d9cb). Mobile `wmt/B2` carries the records, the contract copy and the API types only. Migration `20261025130000_school_enrolment_report` (one new table, `SchoolEnrolmentReport`).
- **Built** (backend `src/schools/enrolment/`): when an order becomes enrolled (paid, or a course with no fee) the school's `reportEmail` gets one mail through WAWU ID's relay (`WawuIdMailRelay`): student name, email, phone, course, intake (date, schedule, place), reference, and the time the student agreed to share (SC4's Continue; no follow-up time is promised). The copy of the student's details is taken from the sign-in token in the order's own transaction (WAWU ID alone holds them, and the payment sweep that enrols a student has no token) and the send clears it. A lease (`leaseUntil`) lets one caller send; the mail goes under the key `school-report-<enrolment id>`, so a lost answer, a retry or a second server makes no second mail; rests 1, 2, 4 ... 60 minutes; given up after ten tries with an error in the log; a deleted account's report is given up, not sent; a refunded order is never sent. `GET /schools/enrolments` is My courses (SC8): `tab` current or finished, cursor pages, each row the enrolment view plus `weeks`, `endDate` and `tab`; a released place is not listed. The enrolments controller is registered ahead of `schools/:id` (one segment under `schools`).
- **Checks:** `tsc --noEmit` 0; eslint 0 on touched files; `school-report.contract.spec.ts` 11 tests green on Nuvion stood in (one mail, paid and free; five parallel sends make one mail; lost answer; relay down and back; refused ten times; account removed; refunded order; My courses tabs, cursor, other student). Contract additive (one new GET, no path or schema changed). CI on 9b41f13: Branch checks run 39040062677, Gates 39040062651 (green), Protected routes 39040062684 (green).
- **NOT RUN:** a real mail relay or WAWU ID (stood in); the app (backend task).
- **Defaults I set:** consent time is the SC4 Continue tap (the enrol request), recorded server-side; `finished` is a class whose last day (start + weeks x 7 - 1) is past, or a refunded enrolment. The SC4 disclosure sentence is the design's.
- **Fences touched:** SHARED-CHANGES SCHOOLS-09 #1 (schema, contract, purge map row for the report copy, `SchoolsPublicModule` controller order).
- **Round 2 (be8d9cb, one low from the verifier):** a report whose token gave no name, email or phone is no longer given up as "the student removed their account": that happens only when the account is really removed (the purge clears `wawuUserId` with the details). Otherwise the school gets the mail with what exists ("not given" for the rest, plus the course, the reference and the consent time). Spec added to `school-report.contract.spec.ts` (12 tests; fails before, passes after). The 30-day copy of a released or refunded order's details is by design.
- **Next:** a verifier. Passes V1, V2, V3, V4, V9.
- **History:** reports go to tasks/history/SCHOOLS-09.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC7 says the school gets the student's details; SC8 lists courses with their status.

## Scope

On enrolment, email the school the student's name, email, phone, course and intake, with the consent time recorded. GET my school enrolments with status.

The email goes through the backend's existing mailer.

## Capability checks

- [ ] After enrolling, the school's report address receives one email with the right details.
- [ ] My courses shows the enrolment with its intake date.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-09.md](history/SCHOOLS-09.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
