---
id: TIER-RENEW
title: Renew shows only when a tier is ending or has ended
owner: YOU
area: CREATE
order: 378
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-132, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# TIER-RENEW · Renew shows only when a tier is ending or has ended

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from R-132 (owner, 10 Nov), from the owner's own walk of the web app.
- **Found:** `src/features/verify/YourTierScreen.tsx` draws Renew whenever the held tier is sold (`sold ? <Button ... your-tier-renew`), so a person in the middle of an active year is offered Renew. The Hub already says `active`, `ending` (inside its `endingDays` window, `src/plans/maker-tier.service.ts`) or `ended`.
- **Next:** a builder on `wmt/TIER-RENEW` from `wmt/BATCH-1110`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-132, R-47

## Goal

A person on an active tier is never offered Renew; a person whose tier is ending or has ended is.

## Scope

- Your tier: Renew only for `ending` and `ended`; Upgrade as now when a higher tier exists; the highest tier while active shows no buy button.
- Every other place that offers Renew for the held tier (grep: the checkout, Me, the tier offer, notifications) follows the same rule.
- Phone and web alike (shared screens).

## Capability checks

- [ ] A person on an active Verify sees Upgrade and no Renew; on an active Founding Maker sees no buy button.
- [ ] A person whose tier ends within the Hub's window, or has ended, sees Renew with its price.
- [ ] Pictures of each state at 390 light and dark and at 1440.

## Builder report

## Verifier report

## Owner sign-off
