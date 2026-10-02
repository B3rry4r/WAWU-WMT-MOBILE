---
id: OPS-05
title: Update the other repos' CLAUDE.md for today's rulings
owner: YOU
area: OPS
order: 6
priority: launch
repo: wawuafrica, wawu-backend
type: ops
status: todo
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-05 · Update the other repos' CLAUDE.md for today's rulings

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawuafrica, wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

The web and backend CLAUDE.md files still say Flutterwave holds wallet money and that the web is the product. Agents there would build the old way.

## Scope

Rewrite the wallet note (R-1), add that the mobile app is now authoritative and the web follows (R-3, DECISIONS authority), and point to this repo's docs/WORKFLOW.md.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava's examples put customer accounts at Loma Bank (Iyin Ekiti MFB), not "Fintava MFB". The wallet note names the bank Fintava confirms (question 5 in `docs/fintava/naira-api.md`).

## Capability checks

- [ ] Both files describe Fintava custody and mobile-first, with the date and the ruling id.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
