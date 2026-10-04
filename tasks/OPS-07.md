---
id: OPS-07
title: List the web features the app doesn't have, for the web team
owner: YOU
area: OPS
order: 183
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: []
decisions: [R-34]
passes: []
artboards: []
---
# OPS-07 · List the web features the app doesn't have, for the web team

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Web features absent from the canvas are not built in the app (DECISIONS.md, Authority: the canvas decides
the app; the web follows after launch; R-34). This list hands the 89 of them to the web team for its own port
after launch. Nothing here is an owner ruling.

## Scope

`docs/analysis/ANALYSIS-EVIDENCE.md`, "On the web today, absent from the canvas". Mark each row "not in the
app" and name the web-port task that carries it. List separately the rows that hold user money or user data
needing migration.

## Capability checks

- [ ] Each of the 89 rows is marked "not in the app" and assigned to the web-port task.
- [ ] Rows that hold user money or user data needing migration are listed separately for the web team.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
