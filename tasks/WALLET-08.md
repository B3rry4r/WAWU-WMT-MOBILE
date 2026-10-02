---
id: WALLET-08
title: Find a recipient, and recent recipients
owner: YOU
area: WALLET
order: 130
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-10, MONEY-12, SETTINGS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-08 · Find a recipient, and recent recipients

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W7: search by name, @handle or phone, and show recent recipients.

## Scope

Recipient search across all accounts that have wallets, block-aware (SETTINGS-04: a blocked user never appears); recent recipients from the ledger.

## Capability checks

- [ ] Searching a phone written 080... finds the same person as +234...
- [ ] People the user blocked never appear.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
