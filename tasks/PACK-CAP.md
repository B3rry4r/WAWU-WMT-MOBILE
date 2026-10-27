---
id: PACK-CAP
title: Only Founding Maker adds products, at most 2 packs (R-100)
owner: YOU
area: VERIFY
order: 2111
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: [TIER-04, IAP-01]
decisions: [R-100, R-65, R-86, R-89]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# PACK-CAP · Only Founding Maker adds products, at most 2 packs

## Current state

As of 27 Oct 2026. Hub built by a Sonnet builder (T2): backend `wmt/PACK-CAP` `0bea345` on `origin/main` `02b66b5`. The app screens are NOT done (budget): see "Not done".

- **Settings (R-65):** `plan.extra_products.tiers` (tier ids that may buy; default `founding`) and `plan.extra_products.max_packs` (default 2), in the registry and `plan-settings.defaults.json`; no migration (no row is needed).
- **Rule:** `src/plans/purchases/extra-products-cap.ts`. Packs are counted on the extras the tier row holds (they carry over a renewal), so 20 stays the most a profile can hold; packs bought before the rule stay.
- **Offers:** `limitOffers` leaves the pack out unless the running tier may buy it and fewer than the most packs are held. Verify and Verify Plus get tiers only; Founding Maker gets the pack at 10 of 10 and 15 of 15, nothing at 20 of 20.
- **Error code:** `pack_not_allowed`, 409, in the money error shape (`reason.code`). The quote and `POST /plans/purchases` (kind `extra_products`) answer it before anything moves; a waiting transfer order closes with nothing taken.
- **Store path:** a store purchase of the pack that arrives against the rule is recorded with `flag: pack_not_allowed` and grants nothing (the way a removed member's pass renewal is); the same transaction posted again is the same answer; a refund of it takes nothing back. An admin sees the flag in `admin/store/purchases`.
- **Existing specs:** five specs that test the room logic, the payment or the grant on the first tier now open the rule in the settings for their own run (`test/plans/open-pack-rule.ts`); no assertion was changed. `limit-offers` and `publishing-allowance` call the function through a wrapper with an open rule.
- **Checks (backend):** tsc 0, eslint 0 on changed files, 18 suites (313 tests) of the changed files and their neighbours pass, `contract:build` 0 (3 lines in `contract/openapi.json`), gates 0 fail, `check_baseline` 0. The protected suite ran 248 of 253: the 5 failures are `/learn/*` and `/creators/:id/evg`, on a test database with no seed rows (not a route this task touches).
- **Not done:** (1) the app: VF13 and the "used N of N" sheet (`src/features/verify/ProductsFullSheet.tsx`, `planParts.tsx`, `purchaseModel.ts`) must draw the pack only when the Hub's `product_limit_reached` offers carry `extraProducts`, start a store purchase of `wawu.more.products.5` only then, and for a Founding Maker at the cap read "You have used 20 of 20" and "That's the most products a profile can hold." (2) `npm run api` against the backend contract (the new `pack_not_allowed` code), then the app tests, tsc, gates, eslint. (3) The protected suite on a seeded database.

## Read first

- `DECISIONS.md` R-100, R-65, R-86, R-89; `docs/WORKFLOW.md`; `tasks/TIER-04.md`; `tasks/IAP-01.md`

## Goal

Only a Founding Maker can add products, two packs at most (20 products). Verify and Verify Plus are led to the higher tiers.

## Capability checks

- [x] Verify and Verify Plus full: offers carry tiers only; quote, purchase and store grant refuse the pack (grant flagged).
- [x] Founding Maker: a first pack, a second pack, then nothing at 20.
- [x] The two settings change the rule.
- [ ] App: VF13 and the sheet draw the pack only when the Hub offers it, with the full-state copy.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/PACK-CAP.md](history/PACK-CAP.md).
