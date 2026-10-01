---
id: WALLET-28
title: Scan to pay and my QR
owner: DEV1
area: WALLET
day: later
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [WALLET-07]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-28 · Scan to pay and my QR

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W24, W25: a personal QR code, and paying by scanning (NQR if Fintava supports it).

## Scope

Personal pay-code payload and resolver; NQR decode and pay.

## Capability checks

- [ ] Scanning a user's QR fills their name and lets you pay them with your PIN.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
