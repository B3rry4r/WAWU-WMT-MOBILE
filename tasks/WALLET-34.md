---
id: WALLET-34
title: Admin screens: proof-of-address review queue
owner: YOU
area: WALLET
order: 189
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: todo
depends_on: [WALLET-24]
decisions: []
passes: [V1, V6, V7, V9]
artboards: []
---
# WALLET-34 · Admin screens: proof-of-address review queue

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Tier 3 needs a person to check proof of address.

## Scope

Dashboard queue over WALLET-24's review endpoints.

## Waiting on

This waits for the owner's ruling on what A17 to A20 become (BRIEF, "A17 to A20"; after launch). Fintava's API has no tiers.

## Capability checks

- [ ] An admin can approve or reject a Tier 3 request with a reason, and the user sees the result.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
