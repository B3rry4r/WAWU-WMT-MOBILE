---
id: SCHOOLS-07
title: Enrol in a course and pay from the wallet (backend)
owner: DEV3
area: SCHOOLS
order: 120
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-18, MONEY-13, MONEY-16, WALLET-15, SCHOOLS-04]
decisions: [R-12, R-10, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-07 · Enrol in a course and pay from the wallet (backend)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

SC4-SC7, SC11: enrol in an intake and pay from the wallet, with the seat claimed safely.

## Scope

Enrolment order with amount and commission snapshot, race-safe seat claim (the Product.stock pattern), class-full returns the next intake, receipt; payment through MONEY-17.

The fee waits in WAWU's merchant wallet until it is paid to the school (MONEY-18, R-19). School enrolments never read the old LearnCourse enrolment gate, which references the removed subscription.

Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

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
