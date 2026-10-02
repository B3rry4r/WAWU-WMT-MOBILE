---
id: MONEY-13
title: No wallet yet: money screens lead to Open your wallet
owner: YOU
area: MONEY
order: 80
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-12]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-13 · No wallet yet: money screens lead to Open your wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Nobody has a wallet until they open one (R-6), new and existing users alike. Every money endpoint answers 'no wallet yet' the same way, and every money screen leads to Open your wallet.

## Scope

A consistent `no_wallet` error on every wallet and payment endpoint, in the contract (MONEY-04). The screens
that lead to Open your wallet are wired by KYC-05 (the pay sheet) and by each screen task that draws a way in
(docs/WORKFLOW.md section 7, "Links between screens").

## Capability checks

- [ ] A signed-in user with no wallet gets the same `no_wallet` answer from every wallet and payment endpoint (no 500s).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
