---
id: TIER-COUNTS
title: Products each tier allows are 4, 8 and 15, and a running tier gets the new count at once (R-112)
owner: YOU
area: VERIFY
order: -1274
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: []
decisions: [R-112, R-100, R-65, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# TIER-COUNTS · Products each tier allows: 4, 8 and 15

## Current state

As of 30 Oct 2026, a Hub task taken by the lead, status building. Ruling: R-112 (owner, 27 Oct 2026 message forwarded 30 Oct): Verify 4, Verify Plus 8, Founding Maker 15 (they are 3, 6 and 10 today). Lead ruling: a person who already holds a running tier gets the new count at once (raise only, never lower); prices, lengths, points and every other figure stay as they are.

To build (backend `wmt/TIER-COUNTS` on `origin/main` `d8bc065`, a Sonnet builder, T2):

| # | What |
|---|------|
| 1 | Defaults: `src/plans/plans.config.json` products verify 4, plus 8, founding 15 (the seed a database with no saved setting follows) |
| 2 | One data-only migration (`20261224090000_tier_counts`): saved `PlanSetting` rows `plan.tier.verify.products`, `plan.tier.plus.products` and `plan.tier.founding.products` set to 4, 8 and 15 where a row exists and differs; running tiers' `MakerTier.productsIncluded` raised to the new count where lower (never lowered; ended tiers untouched); a rollback that says what it can and cannot restore (TIER-YEARLY's pattern) |
| 3 | Proof as a creator would see it: a running Founding Maker with 10 published products can publish an 11th (allowance 15 plus any extra products bought); Verify allows a 4th; `GET /plans` and the tier offer show 4, 8 and 15; `/me/tier` shows the new count; an admin's later saved setting still wins for new buyers; a tier bought after the migration copies the new count; extra products bought still add on top |
| 4 | Every spec and string that pins 3, 6 or 10 tier products changed, each named (only those that state a tier's product count) |

The app reads the counts from the Hub (the tier cards, the meter), so no app change is needed for the counts themselves.

## Read first

- `DECISIONS.md` R-112, R-100, R-65
- The Hub's TIER-YEARLY migration, its rollback and its spec (the pattern to copy)

## Goal

A person sees and gets 4, 8 or 15 products on Verify, Verify Plus or Founding Maker, a person who already holds a running tier gets the new count today, and nothing else about a tier changes.

## Scope

`wawu-backend` only: `src/plans/plans.config.json`, one migration with its rollback and a spec, and the specs and strings that state the old counts.

## Capability checks

- [ ] Defaults and migration (up, down, up on a scratch database holding saved settings and running tiers).
- [ ] The creator proofs of item 3.
- [ ] The specs and strings of item 4.
- [ ] Verifier (a separate Sonnet verifier; the Branch checks run green).
