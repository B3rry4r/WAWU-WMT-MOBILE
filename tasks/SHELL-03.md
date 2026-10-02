---
id: SHELL-03
title: Tester builds
owner: DEV
area: SHELL
order: 17
priority: launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: [SHELL-01]
decisions: []
passes: [V1, V10]
artboards: []
---
# SHELL-03 · Tester builds

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)

## Goal

Testers and the owner install real builds, not Expo Go.

## Scope

Follow `docs/BUILDS.md`. `npx expo install expo-dev-client`; `eas.json` with the three profiles it lists; the owner runs `eas init` and the first iOS build (only they have Apple). Android preview is an APK anyone can install. iPhones get builds through TestFlight, submitted by the owner. Updates from this task go to the `preview` channel only.

## Capability checks

- [ ] A preview build installs on a real Android phone and a real iPhone and reaches staging.
- [ ] The developer can run `eas build --profile preview` for both platforms without an Apple or Google login.
- [ ] `eas update --channel preview` reaches an installed preview build without a rebuild.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
