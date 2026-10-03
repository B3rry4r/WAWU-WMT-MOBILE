---
id: MONEY-19
title: Not enough money, and still confirming
owner: YOU
area: MONEY
order: 96
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-08]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-19 · Not enough money, and still confirming

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

H17, I6, S11, W13: tell the user exactly how much they are short. H18, E10: say when a payment is still confirming.

## Scope

An insufficient-funds error carrying balance and shortfall; a 'pending' result the app can poll.

## Capability checks

- [ ] With ₦500 in the wallet, a ₦1,000 purchase fails with a ₦523.25 shortfall (₦1,023.25 total, BRIEF rule 5).
- [ ] A pending payment resolves to paid or reversed, never stays pending past the sweep.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
