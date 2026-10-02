---
id: MONEY-09
title: Transaction PIN
owner: YOU
area: MONEY
order: 26
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-04]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-09 · Transaction PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Every movement of money asks for a 4-digit PIN (W11, W36).

## Scope

Set, confirm, change; stored as a slow hash; locked after 5 wrong tries; required on every debit endpoint.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava has no wallet PIN (only card PINs), so this PIN is ours, as planned.

## Capability checks

- [ ] A debit without a PIN, or with a wrong PIN, is refused.
- [ ] Five wrong PINs lock it, and the lock is shown with when it ends.
- [ ] The PIN never appears in logs.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
