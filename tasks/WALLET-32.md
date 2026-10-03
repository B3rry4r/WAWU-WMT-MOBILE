---
id: WALLET-32
title: Dollar account and swaps (first slice)
owner: YOU
area: WALLET
order: 200
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-16]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-32 · Dollar account and swaps (first slice)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-16 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Dollar account and swaps. Blocked until Fintava sends the dollar-account API (requested, R-20).

## Scope

Split into two-day tasks once R-16 is ruled and Fintava's API for it is in docs/fintava/.

## Capability checks

- [ ] Fintava's dollar-account API is in `docs/fintava/`, and this task has been split into tasks of two days or less.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
