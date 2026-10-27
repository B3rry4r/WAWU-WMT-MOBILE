---
id: PACK-CAP
title: Only Founding Maker adds products, at most 2 packs (R-100)
owner: YOU
area: VERIFY
order: -1268
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-100, R-65, R-86, R-89]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# PACK-CAP · Only Founding Maker adds products, at most 2 packs

## Current state

As of 27 Oct 2026. Round 1: Hub built by a Sonnet builder (T2), backend `wmt/PACK-CAP` `0bea345` on `origin/main` `02b66b5`. Round 2: the app part, mobile `wmt/PACK-CAP` (see the hand-back for the head). Lead rulings of round 2: the pack is counted on the extras the tier row holds (20 is a hard maximum across renewals; R-100 now says so); an ended Founding Maker's late store purchase is still granted; a flagged purchase is acknowledged in the store and left for an admin. **Apple purchases cannot be refunded by WAWU, so the app must never start a store purchase of the pack that the Hub would refuse: ask the Hub (the quote of the pack) just before opening the store sheet, and open it only if the Hub does not answer `409 pack_not_allowed`.**

- **Settings (R-65):** `plan.extra_products.tiers` (tier ids that may buy; default `founding`) and `plan.extra_products.max_packs` (default 2), in the registry and `plan-settings.defaults.json`; no migration (no row is needed).
- **Rule:** `src/plans/purchases/extra-products-cap.ts`. Packs are counted on the extras the tier row holds (they carry over a renewal), so 20 stays the most a profile can hold; packs bought before the rule stay.
- **Offers:** `limitOffers` leaves the pack out unless the running tier may buy it and fewer than the most packs are held. Verify and Verify Plus get tiers only; Founding Maker gets the pack at 10 of 10 and 15 of 15, nothing at 20 of 20.
- **Error code:** `pack_not_allowed`, 409, in the money error shape (`reason.code`). The quote and `POST /plans/purchases` (kind `extra_products`) answer it before anything moves; a waiting transfer order closes with nothing taken.
- **Store path:** a store purchase of the pack that arrives against the rule is recorded with `flag: pack_not_allowed` and grants nothing (the way a removed member's pass renewal is); the same transaction posted again is the same answer; a refund of it takes nothing back. An admin sees the flag in `admin/store/purchases`.
- **Existing specs:** five specs that test the room logic, the payment or the grant on the first tier now open the rule in the settings for their own run (`test/plans/open-pack-rule.ts`); no assertion was changed. `limit-offers` and `publishing-allowance` call the function through a wrapper with an open rule.
- **Checks (backend):** tsc 0, eslint 0 on changed files, 18 suites (313 tests) of the changed files and their neighbours pass, `contract:build` 0 (3 lines in `contract/openapi.json`), gates 0 fail, `check_baseline` 0. The protected suite ran 248 of 253: the 5 failures are `/learn/*` and `/creators/:id/evg`, on a test database with no seed rows (not a route this task touches).
- **App (round 2):** VF13 (`ProductsFullSheet.tsx`) draws the pack only while the Hub's quote of it (`GET /plans/purchases/quote?kind=extra_products`) is not refused `409 pack_not_allowed`, and waits for that quote before drawing anything. Verify and Verify Plus, full: the title, "Move up a tier to publish another." and "Upgrade instead" (no pack, price or Add button). Founding Maker at the cap: "You have used 20 of 20" and "That's the most products a profile can hold.", no buy button (Open library stays). Paying takes a fresh quote before the PIN (`usePlanPurchase`): a `409 pack_not_allowed` there removes the pack and shows the Hub's sentence (`full-refused`), with nothing bought. `npm run api` against the backend: the generated types are unchanged (only `contract/SOURCE_COMMIT` moved).
- **The app has no store purchase of the pack yet.** The pack is still a wallet payment here (IAP-02 has not moved it to the stores, R-86); when it does, the store sheet opens only after the same quote answers 200, so the app never starts a purchase the Hub would refuse.
- **Round 3 (verifier findings):** (M1) `deliver()` re-checks the pack rule under the tier lock; a wallet or transfer payment that confirms after another channel took the last place is never added and its whole price is refunded through the hold refund path (purchase status `refunded`). (M2) The quote and the purchase answer `pack_not_allowed` before the wallet gate (`ExtraProductsEligibilityGuard`), so a Verify person with no wallet is not shown the pack; the app sheet hides it (test). Lows: specs for a waiting transfer order closing `failed` with nothing sent, and an ended Founding Maker's late store grant (granted; an ended Verify's is flagged); PLANS.md section 11 updated. `GET /plans` is left as it is (sweep). The store path (IAP-02) follows the rule on branch `wmt/PACK-CAP-IAP`, from `wmt/IAP-02` `9ce58f8d`, not merged with main: its sheet asks the Hub's quote of the pack before drawing it and again before opening the store.
- **Protected suite on a seeded database (round 2):** 2 suites, 253 of 253, EXIT 0 (the round 1 failures were the missing seed).
- **Not done:** the cases for Verify Plus in the app (same path as Verify: the Hub's refusal; the stand-in Hub lists two tiers); the store purchase (IAP-02).

## Read first

- `DECISIONS.md` R-100, R-65, R-86, R-89; `docs/WORKFLOW.md`; `tasks/TIER-04.md`; `tasks/IAP-01.md`

## Goal

Only a Founding Maker can add products, two packs at most (20 products). Verify and Verify Plus are led to the higher tiers.

## Capability checks

- [x] Verify and Verify Plus full: offers carry tiers only; quote, purchase and store grant refuse the pack (grant flagged).
- [x] Founding Maker: a first pack, a second pack, then nothing at 20.
- [x] The two settings change the rule.
- [x] App: VF13 and the sheet draw the pack only when the Hub offers it, with the full-state copy.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/PACK-CAP.md](history/PACK-CAP.md).
