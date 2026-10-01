---
id: SCHOOLS-07
title: School enrolment order
owner: YOU
area: SCHOOLS
day: 4
repo: wawu-backend
type: money-path
status: blocked
blocked_by: "until D7 is ruled in DECISIONS.md"
depends_on: [SCHOOLS-04, MONEY-17]
decisions: [D7]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-07 · School enrolment order

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D7 (open: this task is blocked until they are ruled)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

SC4-SC7, SC11: enrol in an intake and pay from the wallet, with the seat claimed safely.

## Scope

Enrolment order with amount and commission snapshot, race-safe seat claim (the Product.stock pattern), class-full returns the next intake, receipt; payment through MONEY-17.

## Capability checks

- [ ] Two users racing for the last seat: one enrols, the other is told the class is full and offered the next intake.
- [ ] The same enrol request sent twice charges once.
- [ ] The receipt shows the course, intake and amount actually charged.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
