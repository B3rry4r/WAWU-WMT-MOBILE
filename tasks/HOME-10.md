---
id: HOME-10
title: TGIF reactions, readers and shares
owner: DEV
area: HOME
order: 147
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-10 · TGIF reactions, readers and shares

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

H29-H35 show reactions, readers today and share counts that nothing records today.

## Scope

TgifReaction, TgifRead; GET stats for a date; POST react, read, share.

## Capability checks

- [ ] A user's reaction shows as theirs on reopening, and the count includes it once.
- [ ] 'Readers today' equals distinct readers recorded for that date.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
