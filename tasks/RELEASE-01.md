---
id: RELEASE-01
title: Store listings and production builds
owner: YOU
area: RELEASE
order: 159
priority: launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: [SHELL-03]
decisions: []
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

App Store Connect and Google Play listings, privacy and data-safety forms (BVN, selfie, payments), screenshots from the real app, an EAS production profile pointing at production. Submission is the owner's alone, from their own machine, with the store keys kept off Expo (`docs/BUILDS.md`).

## Capability checks

- [ ] A production build installs from TestFlight and Play internal testing.
- [ ] Both listings are complete and pass the stores' own pre-submission checks.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
