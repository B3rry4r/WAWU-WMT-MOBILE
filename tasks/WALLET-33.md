---
id: WALLET-33
title: Crypto through Cardex (first slice)
owner: YOU
area: WALLET
order: 217
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
- `docs/fintava/cardex.md` (what Cardex does and where the canvas differs)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Crypto (W3, W22, W23) runs through Cardex, Fintava's crypto partner, after launch (R-16). Cardex holds the coins in WAWU's treasury, so our backend keeps each user's crypto balance in its own ledger, checked against Cardex's treasury every night.

## Scope

Once the Cardex test keys are in the backend's local `.env`, split this into small tasks: signed client and webhooks, deposit addresses, per-user ledger and nightly check, quote and convert, send out, then the screens. USDT and USDC only (no BTC), the real 90-second quote, the fee on top.

## Capability checks

- [ ] With Cardex test keys in the local `.env`, a sandbox deposit reaches our webhook and is recorded once.
- [ ] This task is split into small tasks, each with its own checks, and none shows BTC.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
