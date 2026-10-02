---
id: WALLET-33
title: Crypto through Cardex (first slice)
owner: YOU
area: WALLET
order: 179
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-16]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-33 · Crypto through Cardex (first slice)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-16 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/cardex.md` (what Cardex does, what the canvas assumes, and the custody question)

## Goal

Crypto (W3, W22, W23) runs through Cardex, Fintava's crypto partner, after launch (R-16). Cardex is a business treasury: every user's coins sit in WAWU's treasury, so WAWU would be the custodian. That question is answered before anything is built.

## Scope

Get written answers to the five questions in `docs/fintava/cardex.md`, then split this into small tasks. USDT and USDC only (no BTC), the real 90-second quote, the fee on top, keys only in environment secrets.

## Capability checks

- [ ] The custodian of record and its licence are confirmed in writing and recorded in DECISIONS.md.
- [ ] This task is split into small tasks, each with its own checks, and none shows BTC.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
