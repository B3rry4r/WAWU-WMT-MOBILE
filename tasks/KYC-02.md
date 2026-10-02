---
id: KYC-02
title: Selfie match to the BVN photo
owner: YOU
area: KYC
order: 75
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [KYC-01]
decisions: [R-6]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# KYC-02 · Selfie match to the BVN photo

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A6, A7, A16: a selfie must match the BVN photo.

## Scope

Fintava's face match (`/compliance/verify/bvn/selfie`) through the backend's Fintava client (MONEY-06),
retries limited to 3 a day per user because each attempt costs WAWU even when it fails (`docs/fintava/fees.md`),
result stored.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /compliance/verify/bvn/selfie` (base64 image and BVN) is a face match. Fintava offers no liveness check, so nothing claims one: the selfie is captured and matched, and nothing on A6, A7 or A16 says or suggests a liveness check (BRIEF A6).

## Capability checks

- [ ] A matching selfie passes; a selfie of a different person fails the match; three failures show A16 and the retry rule.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
