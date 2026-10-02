---
id: WALLET-09
title: Send money to a bank
owner: YOU
area: WALLET
order: 136
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-09 · Send money to a bank

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W8, W10-W14, W17-W19: send to any Nigerian bank account, replacing today's creator-only withdraw.

## Scope

Bank list and name check, NIP transfer with fee, note, PIN, Idempotency-Key; reversal on failure; KYC rule per W18.

## Capability checks

- [ ] The account name is confirmed before the user can send.
- [ ] A failed transfer reverses once and the user sees W14.
- [ ] The fee shown is the fee charged.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
