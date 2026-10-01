---
id: WALLET-10
title: Money in: bank transfers to the account
owner: YOU
area: WALLET
order: 139
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-07, MONEY-10]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-10 · Money in: bank transfers to the account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W15: money sent to the user's account number shows up and notifies them.

## Scope

Inbound credit webhook to ledger to a 'money in' notification.

## Capability checks

- [ ] A sandbox transfer into the account appears in history and as a notification once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
