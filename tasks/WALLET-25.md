---
id: WALLET-25
title: Add money by card
owner: YOU
area: WALLET
order: 193
priority: after-launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-06]
decisions: [R-10]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# WALLET-25 · Add money by card

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W16: top up with a card, 3-D Secure, saved cards.

## Scope

Card funding through Fintava (or the provider they name) with 3-D Secure and saved card tokens; the fee per R-10.

## Capability checks

- [ ] A sandbox card top-up credits the wallet once.
- [ ] A declined card shows why and charges nothing.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
