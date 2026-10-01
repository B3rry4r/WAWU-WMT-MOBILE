---
id: OPS-03
title: Staging backend
owner: YOU
area: OPS
day: 0
repo: wawu-backend
type: setup
status: ready
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V9]
artboards: []
---
# OPS-03 · Staging backend

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Today a merge to main deploys straight to production. Money work needs a place to run against the Fintava sandbox first.

## Scope

A second app and database on the droplet (or a second droplet), deployed from a `staging` branch, with its own env (Fintava sandbox keys, its own WAWU ID or a staging WAWU ID). Same deploy-failure alert as production.

## Capability checks

- [ ] A push to `staging` deploys to staging and does not touch production.
- [ ] Staging's health endpoint reports its environment and its own database name.
- [ ] A failed staging deploy opens the deploy-failure issue.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
