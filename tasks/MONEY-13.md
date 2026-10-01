---
id: MONEY-13
title: Open a wallet for existing users
owner: DEV1
area: MONEY
day: 3
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [MONEY-12]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-13 · Open a wallet for existing users

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Everyone already on WAWU has no BVN and no wallet. Every money screen has to handle that and lead them in.

## Scope

'Open your wallet' for an existing account (BVN, selfie per D1, account opening), and a consistent 'no wallet yet' answer on every wallet endpoint.

## Capability checks

- [ ] An existing web user signs in on mobile, taps Wallet, and can open a wallet without making a new account.
- [ ] Every wallet endpoint answers 'no wallet yet' the same way for that user (no 500s).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
