---
id: SHELL-03
title: Tester builds
owner: DEV2
area: SHELL
day: 1
repo: wawu-wmt-mobile
type: setup
status: ready
blocked_by: ""
depends_on: [SHELL-01]
decisions: []
passes: [V1, V10]
artboards: []
---
# SHELL-03 · Tester builds

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)

## Goal

Testers and the owner install real builds, not Expo Go.

## Scope

eas.json profiles (development, preview pointing at staging, production); internal distribution for Android and TestFlight for iOS. Needs the owner's Apple and Google accounts.

## Capability checks

- [ ] A preview build installs on a real Android phone and a real iPhone and reaches staging.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
