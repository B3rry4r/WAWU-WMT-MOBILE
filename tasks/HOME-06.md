---
id: HOME-06
title: Content detail: previews, fair ratings, counts
owner: DEV
area: HOME
order: 80
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-06 · Content detail: previews, fair ratings, counts

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Content detail shows free preview pages or seconds, ratings only from buyers, and real counts (H19, H23, H25). Additive only.

## Scope

Free preview pages or seconds; ratings only from buyers, once each; updated-at, purchased-at and student counts.

## Capability checks

- [ ] A user who didn't buy a piece cannot rate it.
- [ ] Rating twice updates, not adds.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
