---
id: FIX-09
title: No em-dashes in any message a person can read from the backend or the web
owner: YOU
area: FIX
order: 190
priority: launch
repo: wawu-backend, wawuafrica
type: setup
status: todo
depends_on: []
decisions: [R-5]
passes: [V1, V2, V3]
artboards: []
---
# FIX-09 · No em-dashes in any message a person can read from the backend or the web

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-09.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `CLAUDE.md` (no em-dashes in anything a user reads; a product-owner instruction)
- `tasks/EVENTS-11.md` (PR #83's note on the admin events messages) and `tasks/HOME-09.md` (O5: the web's `public/tgif`)

## Goal

The backend still sends em-dashes in error and notification messages (32 found in the admin events messages and others, for example "can only be restored from removed — this one is pending"), and the web's `public/tgif` assets carry 18. The product owner's rule is no em-dashes in anything a person reads.

## Scope

Rewrite every user-readable string the backend sends (error messages, notification text, seeded content, emails) without an em-dash: two sentences, a comma, a colon or brackets. Same in the web's `public/tgif`. Code comments are exempt. Add a gate or spec that fails on an em-dash in a served string. Protected routes whose message changes need the relock-approved label: list each changed protected answer in the PR.

## Capability checks

- [ ] A scan of served strings (messages, notifications, seeds, emails, web public assets) finds no em-dash.
- [ ] A spec or gate fails when one is added back.
- [ ] Protected routes pass with the relabelled lock; the PR lists every changed answer.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
