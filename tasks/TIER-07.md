---
id: TIER-07
title: A person's tier badge on their public profile
owner: YOU
area: VERIFY
order: 263
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [TIER-03, TIER-02]
decisions: [R-43]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-07 · A person's tier badge on their public profile

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying.
- **Branches:** backend `wmt/TIER-07` `493a276` on `origin/main` `a5e48fc`; mobile `wmt/TIER-07` on `origin/main` `7de785d` (docs only: this file, history, SHARED-CHANGES, BACKEND_GAPS, LOG).
- **Migration:** `20261024090000_maker_badge_number` (nullable unique `MakerTier.badgeNumber`, one-row `BadgeNumberCounter`, and the Founding Makers that exist are numbered oldest first). Additive; rollback is in the file.
- **Built:** `badge` (`PersonBadgeView`: `id`, `numbered`, `name`, `number`) is `null` unless the person's tier is running (`active` or `ending`, `tierStateAt`, the publishing gate's own test). On: `GET /users/{id}/profile-fields` and `GET /users/me/profile-fields` (M1, M5), the feed creator and professional cards (`GET /feed/entries`), `GET /explore/creators` and `/explore/featured-creators`, `GET /professionals/directory` and `/directory/{id}`.
- **The number:** taken inside the tier grant's transaction (`ensureBadgeNumber`), after the points, once per person, kept through renewal, an ended tier and a stop at another tier, gap-free on rollback, never reissued; a repeated payment confirmation allocates nothing.
- **Not changed, on purpose:** `GET /users/{id}/public-profile`, `GET /users/me`, `GET /professionals`, `GET /professionals/{id}` (the web reads them; protected suite and the directory spec pin their keys), `GET /creators` (the web and the app's Home read it), `GET /me/tier` (`plans.contract.spec.ts` pins `tier.badge`), the byline on content cards.
- **Checks:** backend CI on `a8d103d`: see the hand-back for run ids. Local: `tsc` 0, eslint 0 errors on changed files, 3 new specs (11 + 6 + 8 tests) pass on the stack `tier_07`; 7 mutants, each killed by a spec.
- **Open for the lead (merge):** `contract/openapi.json` and `plans.service.ts` also change on `wmt/TIER-06`: regenerate the contract after the merge (`npm run contract:build`). `scripts/enrich-contract.js` gains `NULLABLE_TARGET_AS_ALLOF_DIRS` (SHARED-CHANGES TIER-07 #1).
- **For the app builders:** read the buyer's own number from `badge.number` on `GET /users/me/profile-fields` (VF7a, VF14); `GET /me/tier` stays as it is. Search hits and the byline on content cards carry no badge yet (G-803 notes it).
- **Not done:** `?include=badge` on the web's routes (nothing asked for it); ranking by tier in search (G-420, the task says only if the owner asks).
- **Open findings:** none (not yet verified).
- **Next:** a verifier checks it; the lead merges backend and this branch together, and renames the migration stamp if it clashes.
- **History:** tasks/history/TIER-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Other people see a person's tier badge on their profile and cards (M5, M6, M7), including the numbered Founding Maker badge (VF7a; G-421, G-420).

## Scope

- Additive nullable `badge` (`{ id, numbered }`, `PlanBadgeView`) on the public profile and card views the app reads (users, creators, professionals), served only while the tier is active. A Founding Maker gets a number allocated once at purchase and kept (additive column; G-421).
- "Priority in search" for Verify Plus (G-420): rank by active tier in search and Explore only if the owner asks; this task does not change ranking.
- No existing field is renamed, retyped or widened (web and dashboard keep working, V3).

## Capability checks

- [ ] A person with an active Verify tier shows the badge on their public profile; with an ended tier it disappears.
- [ ] Two Founding Makers get different numbers, each kept for life, allocated once even if the payment confirmation repeats.
- [ ] The protected route suite passes unchanged.

## Builder report

Builder, 17 Oct 2026 (Sonnet agent). The full report is in [tasks/history/TIER-07.md](history/TIER-07.md); in short:
- **Files:** backend `prisma/schema.prisma` + migration `20261024090000_maker_badge_number`, new `src/plans/tier-badge/`, `src/plans/tier-grant.service.ts`, the profile-fields, feed-card, explore and directory services and their modules, `scripts/enrich-contract.js`, `contract/openapi.json`.
- **Checks:** capability 1 (badge while the tier runs, gone when it ends) by `tier-badge.spec.ts` and `tier-badge-views.contract.spec.ts`; capability 2 (different numbers, kept for life, once per payment) by `tier-badge.spec.ts` (consecutive numbers, a repeat uses none, eight at once, rollback, renewal and ended-tier keep it); capability 3 (protected suite unchanged) by CI's protected route suite and the new spec's key comparison of the web's routes. 7 mutants killed.
- **Gates:** 5 FAIL lines before (main) and after, the same ones; baseline check green.
- **Shared changes filed:** SHARED-CHANGES TIER-07 #1 (schema, contract, enrich script) and #2 (mobile types after merge). Gap G-803 built; G-420 not done.
- **Not done and why:** see Current state.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
