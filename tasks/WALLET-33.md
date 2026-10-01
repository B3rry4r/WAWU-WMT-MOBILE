---
id: WALLET-33
title: Crypto through Fintava's custody partner (first slice)
owner: YOU
area: WALLET
order: 180
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [D11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-33 · Crypto through Fintava's custody partner (first slice)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D11 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Crypto through Fintava's custody partner is on the canvas, marked as placeholder until Fintava confirms it. It is only built if D11 puts it in the first release.

## Scope

Split into two-day tasks once D11 is ruled and Fintava's API for it is in docs/fintava/.

## Capability checks

- [ ] D11 is ruled 'in', Fintava's docs are in docs/fintava/, and this task has been split into tasks of two days or less.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
