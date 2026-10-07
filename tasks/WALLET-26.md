---
id: WALLET-26
title: Add money by USSD
owner: YOU
area: WALLET
order: 197
priority: after-launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-06]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# WALLET-26 · Add money by USSD

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W15: a USSD option.

## Scope

USSD funding if Fintava supports it; otherwise the USSD option stays not built and `docs/designer/BRIEF.md` records it. This task adds the USSD option to W15 when it lands.

## Capability checks

- [ ] A sandbox USSD payment credits the wallet once, or Fintava has confirmed it has no USSD funding and the brief records it.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
