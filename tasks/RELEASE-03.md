---
id: RELEASE-03
title: iOS release
owner: YOU
area: RELEASE
order: 261
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: [RELEASE-02]
decisions: [R-24]
passes: [V1, V10]
artboards: []
---
# RELEASE-03 · iOS release

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/BUILDS.md` (the iOS steps, "Later: iPhone")
- `DECISIONS.md`: R-24

## Goal

The iPhone app ships once someone can test it on an iPhone. Testing and the first store release are Android
(R-24); this task carries everything iOS.

## Scope

Unblocked when an iPhone tester joins the team. The owner runs the first `eas build -p ios --profile preview`
interactively (Apple signing credentials, `docs/BUILDS.md`), the tester installs it through TestFlight, the App
Store listing and privacy answers are completed, and the owner submits with `eas submit -p ios`.

## Capability checks

- [ ] A preview build installs on a real iPhone through TestFlight and reaches the production backend (V10).
- [ ] Release builds work on that iPhone: network, camera, push, deep links (V10).
- [ ] The App Store listing passes Apple's own pre-submission checks and the app is submitted.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off
