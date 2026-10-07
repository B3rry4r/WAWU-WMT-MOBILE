---
id: WALLET-23
title: Account limits from Fintava
owner: YOU
area: WALLET
order: 190
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-12]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-23 · Account limits from Fintava

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Limits come from Fintava, never from the canvas. Fintava's API has no tiers and every wallet gives its NIN at
opening (BRIEF A17 to A20), so there is no NIN upgrade.

## Scope

Read the account's limits from Fintava once Fintava publishes them, enforce them on debits, and show them on the
W35 limits row. What A17 to A20 become waits for the owner's ruling on them (after launch).

## Capability checks

- [ ] A debit over the account's limit is refused with the limit shown.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
