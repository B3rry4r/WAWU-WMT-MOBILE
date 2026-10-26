---
id: TIER-OFFER
title: Right after sign-up a full screen offers the three tiers, once; it always has a way out (R-94)
owner: YOU
area: VERIFY
order: -153
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-94, R-89, R-86, R-47, R-6]
passes: [V1, V2, V3, V4, V5, V6, V9]
artboards: []
---
# TIER-OFFER · Right after sign-up a full screen offers the three tiers, once

## Current state

As of 26 Oct 2026, round 2. Built by Sonnet builders (T2); round 2 is not verified yet. The groundwork (TIER-02 to TIER-07, VERIFY-01) is merged, so `depends_on` is empty (their orders are all above this task's).
- **Status:** verifying. Branches pushed, no PR: backend `wmt/TIER-OFFER` (head in the hand-back; has backend `origin/main` `bbdde99` merged in) and mobile `wmt/TIER-OFFER` (head in the hand-back; has mobile `origin/main` `a4b4769e` merged in). No native change: the fingerprint is `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged.
- **Migration:** `20261208090000_tier_offer_seen` (one new table, `TierOfferSeen`, a person and when the offer was drawn), after `20261207090000_ads_two_shapes`. Rollback is in the file and refuses while any row exists. `prisma/schema.prisma` keeps both `WalletPaymentFx` (PAY-FX) and `TierOfferSeen` at its end.
- **Hub (round 1):** `GET /me/tier-offer` (`show`, `closeButton`) and `POST /me/tier-offer/seen`. The Hub decides who is shown it: a creator account that was never shown it and holds no running tier. The admin setting `tier_offer.close_button_on` (default on) says whether the app draws the close X or "Not now". The purge map and the data export carry the new table.
- **App (round 1):** `/tier-offer` draws the three tiers with a Subscribe each (VF6 checkout, or the tiers sheet for a dollar-billed person), the X or "Not now", shown after the sign-up steps and before Home. The Hub is asked once per start, at most 2.5 s.
- **Round 2, finding F1 (medium, fixed at the root).** 8 of 14 fresh creator sign-ups reached Home with no offer. `PUT /users/me/account-type` ran as a look and an insert (the upsert had nothing to update) and lost a Prisma P2002 race to the sign-up's other first writes, so the profile stayed `user`, a new creator was stored as a fan for a while, and `GET /me/tier-offer` answered `show: false`. Backend `SignupProfileService.setAccountType` now reads the row the winner made and carries on from it (a `user` row still moves to `creator`), or tries the upsert again, three attempts at most. Spec `signup-first-writes-race.contract.spec.ts` (red on the old code in 3 of 3 runs: 4 unit tests and the 60-sign-up concurrency test; green after).
- **Other first-write paths checked:** `PATCH /users/me` had the same race when its body updated nothing (it answered the false 400 "handle is already taken", red in the same spec); it now runs the upsert once more when the row exists, and a handle another person holds fails as before. `PUT /users/me/identity` (inside a lock; its update is never empty), `PUT /users/me/interests` (has its own P2002 fallback) and `GET /users/me` (writes nothing) do not have it; `POST /policies/accept` writes no profile. All five were sent at once with the account type in the spec: no failure.
- **Round 2, app (F1):** the sign-up gate notes how its account-type write ended (`src/features/auth/accountTypeWrite.ts`); when the Hub does not say show while a creator was just written, the offer step asks once more, in one more bounded wait that also covers a write still on its way. An answer that already says show is never asked twice; a start that wrote nothing asks once.
- **Round 2, records (F2, F3):** this file; SHARED-CHANGES rows #1 to #3 have the same five columns as the others. Backend `origin/main` merged into the backend branch (schema conflict: both models kept; `contract/openapi.json` regenerated with `npm run contract:build`); mobile `origin/main` merged into the mobile branch (R-90 to R-94 in order).
- **Checks (each to the EXIT shown):** backend `tsc` EXIT 0; race spec EXIT 0 (6 tests; red before: 5 failed); signup-first-writes-race, signup-profile, signup-identity, user-profile, tier-offer and the plan-settings specs, the purge and export maps, on a seeded test DB, run by name (none imports the Fintava double): 12 suites, 126 tests, EXIT 0; protected route suite 253 tests, EXIT 0; `contract:build` EXIT 0; gates EXIT 0 (0 fail, 139 warn, 88 accepted, as main); `check_baseline` EXIT 0. App `tsc` EXIT 0; `eslint` EXIT 0; jest (`--maxWorkers=2`) tier-offer (3 files, the new `tierOfferWalk.route.test.tsx` among them), sign-up walks, `route-guard` and the gate's other tests: 12 suites, 480 tests, EXIT 0; `npm run gates` EXIT 0 (0 fail, 18 warn); `check_tasks.py` EXIT 0; fingerprint unchanged.
- **Walk on a local stack** (Hub, WAWU ID, app web export; mail stand-in): 10 fresh creator sign-ups in a row, 10 of 10 saw the offer on their first start: the account type was written with 200 each time and the first ask of the Hub already said show (the app's second ask never had to run on the stack; the unit and walk tests cover it).
- **Open findings:** none known after round 2 (high 0, medium 0). Lows: none.
- **Owner questions:** none.
- **Next:** the lead has a verifier check round 2, then merges backend first (the migration), then `npm run api -- --backend ../wawu-backend` in the app.

## Read first

- `docs/WORKFLOW.md` and the role file your prompt names
- `DECISIONS.md`: R-94 (the ruling), R-89 (the three tiers), R-86 (store prices), R-6
- `wawu-backend` CLAUDE.md (additive only; fenced files)

## Goal

Right after a person finishes signing up, before Home, a full screen ("Choose your tier") offers Verify, Verify Plus and Founding Maker once, each with its own Subscribe, and it always has a way out: a close X, or a "Not now" button when the admin setting is off (R-94).

## Scope

1. Hub: `GET /me/tier-offer`, `POST /me/tier-offer/seen`, the table `TierOfferSeen` (one row per person, so "shown once" holds across phones), the setting `tier_offer.close_button_on`, the contract, the purge map and the export.
2. App: the `/tier-offer` screen, the step in the root layout (asks once per start, waits at most 2.5 s, no answer means no offer), Subscribe opening the existing checkout.
3. A new creator is always offered it: the first writes of a new profile do not lose each other (round 2).

## Capability checks

- [x] A new creator, after the sign-up steps and before Home, sees the three tiers with a Subscribe each (10 of 10 fresh sign-ups on a local stack).
- [x] The X closes it and Home opens; with the setting off "Not now" does; the Hub is told once it was drawn, so it never returns, on any phone.
- [x] A fan, a person who holds a running tier, and a person who has seen it are not shown it; a Hub that cannot be reached means no offer this start, and nothing is marked.
- [x] The first writes of a new person, sent at once, all succeed and a creator is stored as a creator (60 sign-ups, five writes each).
- [x] The protected route suite passes unchanged.

## History

Builder and verifier reports: `tasks/history/TIER-OFFER.md` (not written yet; the first round's verifier report is in the lead's scratchpad).
