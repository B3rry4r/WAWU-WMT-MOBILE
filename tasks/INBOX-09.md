---
id: INBOX-09
title: Pause paid questions for creators who stop replying
owner: DEV2
area: INBOX
order: 15
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-09 · Pause paid questions for creators who stop replying

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Creators who leave too many paid questions unanswered are warned, then paused for 7 days (R-13). Additive only.

## Scope

Rolling 30-day unanswered rate, warning and switch-off per R-13, enforced when sending and shown on the profile.

## Capability checks

- [ ] A creator at 21% unanswered over 30 days is warned once; at 31% paid questions switch off for 7 days and a fan sees I8. The thresholds (20% and 30%) come from config.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
