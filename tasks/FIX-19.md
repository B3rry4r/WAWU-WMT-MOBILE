---
id: FIX-19
title: School and course names refuse control characters
owner: YOU
area: FIX
order: 223
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-19 · School and course names refuse control characters

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-19.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/SCHOOLS-02.md` (the admin name rules) and `tasks/SCHOOLS-04.md` (round 3 decision 2: the cursor bound counts control characters because the admin accepts them)

## Goal

SCHOOLS-02's admin rules refuse only NUL and lone surrogates in a school or course name, so an admin can save a name holding control characters, which the app draws as boxes.

## Scope

- The admin create and edit routes refuse C0 controls (U+0001 to U+001F), DEL and C1 controls (U+0080 to U+009F) in every school and course name field with 400 naming the field, and save nothing.
- Count existing rows that hold one and report the count in the builder report. Change no data without a lead ruling.
- SCHOOLS-04's cursor bound may stay as it is (larger than needed is safe); say so in the report.

## Capability checks

- [ ] Each control-character range is refused on create and edit, by field, with nothing saved.
- [ ] Real names (accents, Arabic, Chinese, emoji) are still accepted.
- [ ] The existing-row count is in the report. Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
