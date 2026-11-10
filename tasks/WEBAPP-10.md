---
id: WEBAPP-10
title: Desktop screens drawn for the web app
owner: YOU
area: WEB
order: 370
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: [WEBAPP-07]
decisions: [R-127]
passes: [V1]
artboards: []
tier: T1
---
# WEBAPP-10 · Desktop screens drawn for the web app

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-10.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

Phase 2 starts from drawings: a desktop shell and the main screens at 1440 (and 1024) in light and dark, in the app's own design system, for the owner to review before anything is built.

## Scope

- `design/` only: a new desktop flow canvas. What it must draw (readiness section 6): the navigation shell and header, Home with a side rail, the Explore grid, content detail, Inbox list and thread side by side, the Wallet flows, the Library table, Settings in two columns, sign-in split screen, sheets as dialogs, with hover, focus, empty and error states. Who Made This branding only (R-37, `<BrandMark>`).

## Capability checks

- [ ] The owner can open one canvas and see every desktop screen, light and dark, and say yes or what to change.

## Builder report

## Verifier report

## Owner sign-off
