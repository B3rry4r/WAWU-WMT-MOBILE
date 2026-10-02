---
id: SETTINGS-06
title: Delete account in the Hub: empty wallet first, freeze, restore on cancel
owner: DEV
area: SETTINGS
order: 170
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-06, MONEY-11]
decisions: [R-17, R-11, R-19]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-06 · Delete account in the Hub: empty wallet first, freeze, restore on cancel

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-17 (ruled; build what it says)
- This task changes `wawu-id, wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z6 to Z8: deletion waits 30 days, money is handled first, and a cancelled deletion brings everything back (R-17). The WAWU ID half (the grace period and cancel on sign-in) is SETTINGS-08.

## Scope

Refuse to schedule deletion while the wallet holds money (balance from Fintava, MONEY-11), a hold is open (R-19) or
earnings are waiting (R-11). Freeze the Fintava wallet when deletion is scheduled and unfreeze it on cancel (a cancel
route SETTINGS-08 calls). Content stays restorable for the 30 days.

## Capability checks

- [ ] A user with money in their wallet, an open hold or waiting earnings is told to move it first.
- [ ] A user who cancels within 30 days gets their wallet unfrozen and their content back.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
