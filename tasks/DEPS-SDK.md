---
id: DEPS-SDK
title: The app's packages match the installed Expo SDK, so CI's Expo SDK health step passes
owner: YOU
area: APP
order: -10801
priority: launch
repo: wawu-wmt-mobile
type: setup
status: verifying
depends_on: []
decisions: [R-3]
passes: [V1]
artboards: []
tier: T0
---
# DEPS-SDK · `npx expo install --fix`

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T0), mobile `wmt/FIX-108` (commit `ddb57848`, the first of that branch) on `origin/main` `2847eb32`. Status verifying.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | `npx expo-doctor` (CI's "Expo SDK health" step): 20 of 21 checks pass; 12 packages one patch behind the installed SDK 57 | 21 of 21 pass (`EXIT 0`) |

The 12, as `npx expo install --fix` moved them: `expo` 57.0.27 to ~57.0.31, `expo-asset`, `expo-calendar`, `expo-constants`, `expo-dev-client`, `expo-linking`, `expo-notifications`, `expo-router` (57.0.25 to ~57.0.29), `expo-sharing`, `expo-splash-screen`, `expo-updates`, `jest-expo` (to ~57.0.6). `package.json` and `package-lock.json` only; `npm ci --dry-run` is clean. The suites for the send, the chat send, the withdraw, Wallet settings and the PIN sheet pass on the new versions (FIX-108's run); the full app check runs once per batch (the merge agent). Native modules changed: needs the next Android build.

## Read first

- `docs/EXPO-AGENTS.md`

## Goal

CI's "Expo SDK health" step passes again.

## Scope

`package.json`, `package-lock.json`.

## Capability checks

- [x] `npx expo-doctor` exits 0 with 21 of 21 checks passed.
- [ ] The full `npm run check` and a device build on the new patch versions: NOT RUN here (the merge agent runs the full check once per batch).
