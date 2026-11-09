---
id: TIER-UPGRADE-FIX
title: Upgrading a tier after renewing it keeps the days already paid for
owner: YOU
area: MONEY
order: 368
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-86, R-101, R-128]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# TIER-UPGRADE-FIX · Upgrading a tier after renewing it keeps the days already paid for

## Current state

As of 9 Nov 2026.
- **Status:** todo. Found by the WEBAPP-05/06 verifier (V8, an upgrade after a renew reset the end date) and read in the Hub source by the WEBAPP-06 builder (`tasks/WEBAPP-06.md`, "Hub findings for the lead", item b).
- **Next:** a builder starts from the brief below. The fix is built and verified on a branch; it merges (which deploys the live Hub) only on the owner's word.
- **History:** none yet. Reports go to tasks/history/TIER-UPGRADE-FIX.md.

## Read first

- `docs/WORKFLOW.md` (sections 4a T2, 5, 6: the live product stays safe)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- wawu-backend `CLAUDE.md` (Money), `src/tiers/` or wherever `tier-grant.service.ts` lives, its `upgrade()` (about lines 340 to 358) and `renew()`
- `tasks/WEBAPP-06.md`, "Hub findings for the lead"

## Goal

Today a person who renews a tier and then upgrades loses the days the renewal paid for: `upgrade()` sets the end date to now plus the new tier's days. It happens on the app, the website and the web app alike. After this task an upgrade never shortens the time a person has already paid for.

## Scope

- wawu-backend `tier-grant.service.ts` `upgrade()` only (the smallest fix: the new end date is the later of the held end date and now plus the new tier's days; if the product rule for an upgrade is different, for example days carried over at the new tier's rate, say what the code and the quote already promise and follow that), and its specs.
- The upgrade quote shown to the person states the end date the grant will set (no surprise).
- No migration; no change to any other route; the protected route suite equals main.

## Capability checks

- [ ] A person who renews a tier and then upgrades keeps every day already paid for (end date never earlier than before the upgrade), on the Hub and as the app and web screens show it.
- [ ] A person who upgrades without a renewal gets the same end date as today.
- [ ] The upgrade's quote and the grant agree on the end date.

## Builder report

## Verifier report

## Owner sign-off
