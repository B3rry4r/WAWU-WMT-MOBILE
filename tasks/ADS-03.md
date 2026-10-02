---
id: ADS-03
title: Ads data model
owner: DEV2
area: ADS
order: 184
priority: launch
repo: wawu-backend
type: migration
status: todo
depends_on: []
decisions: [R-15]
passes: [V1, V3, V4, V9]
artboards: []
---
# ADS-03 · Ads data model

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

H33 and H36 need sponsored cards with a schedule and a placement.

## Scope

Additive: AdCampaign and AdCreative (advertiser, headline, subline, CTA label, CTA destination from an allow-list, artwork, placement tgif_card or today_slot, start and end, status, weight).

## Capability checks

- [ ] Migration applies cleanly to a copy of production.
- [ ] V3 regression suite unchanged.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
