---
id: HOME-05
title: Feed: creator and professional cards, media details
owner: DEV
area: HOME
order: 43
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-05 · Feed: creator and professional cards, media details

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A backend gap behind lane B's screens, from docs/analysis/ANALYSIS-EVIDENCE.md. Additive only.

## Scope

Creator and professional cards interleaved in the feed; photo-set frames, durations and page counts.

## Capability checks

- [ ] The feed returns a creator card among content as H9 shows.
- [ ] A photo set returns its frames in order.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
