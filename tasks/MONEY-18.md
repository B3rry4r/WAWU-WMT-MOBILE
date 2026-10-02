---
id: MONEY-18
title: Hold, release and refund
owner: YOU
area: MONEY
order: 62
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17]
decisions: [D16]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-18 · Hold, release and refund

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Paid DMs and tickets hold money until something happens, then pay out or refund.

## Scope

Hold (Fintava lien, or WAWU's collection account if Fintava has no lien), release to the payee, refund to the payer.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava has no hold or lien. The only place to hold money is WAWU's merchant wallet, which puts customer money in WAWU's account (the custody line in `docs/fintava/naira-api.md`, "To raise with the owner"). Build the hold behind a flag that stays off in live until Fintava answers question 2.

## Capability checks

- [ ] A held payment is not spendable by the payer and not yet paid to the payee.
- [ ] A refund lands in the payer's wallet once, even if requested twice.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
