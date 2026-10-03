---
id: RELEASE-01
title: Store listings and production builds
owner: YOU
area: RELEASE
order: 171
priority: launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: [SHELL-03, KYC-04]
decisions: [R-24]
passes: [V1, V10]
artboards: []
---
# RELEASE-01 · Store listings and production builds

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

The stores need listings, screenshots and privacy answers before they will review anything. This takes longer than people expect.

## Scope

The Google Play listing, its data-safety form (BVN, NIN, selfie, payments), screenshots from the real app, and an
EAS production profile pointing at production. Testing and the first release are Android (R-24); the App Store
listing waits for RELEASE-03. Submission is the owner's alone, from their own machine, with the store keys kept
off Expo (`docs/BUILDS.md`).

## Capability checks

- [ ] A production build installs from Play internal testing on the owner's Android phone and reaches the production backend.
- [ ] The Play listing is complete and passes Google's own pre-submission checks.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
