---
id: LEGAL-07
title: Admin screens: legal prices
owner: YOU
area: LEGAL
order: 73
priority: launch
repo: wawu-dashboard
type: admin-screen
status: todo
depends_on: [LEGAL-03]
decisions: [R-14]
passes: [V1, V6, V7, V9]
artboards: []
---
# LEGAL-07 · Admin screens: legal prices

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs LEGAL-03 built first.
- **History:** none yet. Reports go to tasks/history/LEGAL-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Legal prices are set by WAWU in admin, never in the app or in code (R-14). Today they are code constants
(`CONSULTATION_FEES`); this gives staff the screen that sets them.

## Scope

Dashboard screens over LEGAL-03's price settings: the price and length of video, phone and in-person
consultations, and the price of each fixed-price service (for example business name registration).

## Capability checks

- [ ] An admin can set the price and length of a video, phone and in-person consultation and the price of each fixed-price service.
- [ ] After an admin changes a price, the app shows the new price on the next quote and charges it.
- [ ] A user token is refused on every price route.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
