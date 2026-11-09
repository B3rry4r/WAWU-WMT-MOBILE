---
id: WEBAPP-07
title: The whole web app walked as every kind of user
owner: YOU
area: WEB
order: 367
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [WEBAPP-01, WEBAPP-02, WEBAPP-03, WEBAPP-04, WEBAPP-05, WEBAPP-06]
decisions: [R-127]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-07 · The whole web app walked as every kind of user

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-07.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

Before usewmt.com goes live, fresh walkers use the merged web app as a guest, a new user, a person without a wallet, a wallet holder, a buyer, a creator and a verified user, at 390 and 1440, from a cold start and from a refresh, and every money path on the stack. Nothing goes live until it passes (owner hard rules 5 and 6).

## Scope

- Read only: no code changes. Findings go to `tasks/SWEEP-WEB.md` and a fix batch.

## Capability checks

- [ ] A user of each kind finishes every path they can take on the phone app, in a browser, at both sizes, with pictures beside the boards.
- [ ] Every money path that works on the phone completes on the web on the stack, and every attack in V8 fails.

## Builder report

## Verifier report

## Owner sign-off
