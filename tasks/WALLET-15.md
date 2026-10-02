---
id: WALLET-15
title: Fee quotes
owner: YOU
area: WALLET
order: 95
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-10]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-15 · Fee quotes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Every fee shown before paying comes from the server, never from the app.

## Scope

GET fee quote for transfer, withdraw, card top-up and card order, from configuration set per R-10: Fintava's fee plus WAWU's fee.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

The user pays Fintava's fee plus WAWU's fee (R-10). The quote is Fintava's fee for that action plus WAWU's fee from config, shown as one total with both parts in the breakdown. Fintava's fee per action comes from their answer to question 3 and goes into config.

## Capability checks

- [ ] Changing a fee in configuration changes the quote and the charge together.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
