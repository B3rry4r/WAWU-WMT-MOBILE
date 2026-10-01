---
id: WALLET-14
title: Saved recipients and payout account
owner: YOU
area: WALLET
order: 141
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-14 · Saved recipients and payout account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A21, W17: a saved payout bank with a real bank code, checked against the BVN name.

## Scope

Beneficiaries; payout account with bank code and resolved name.

## Capability checks

- [ ] A payout account whose name doesn't match the BVN name is flagged.
- [ ] A saved recipient can be removed.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
