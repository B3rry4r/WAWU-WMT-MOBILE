# TIER-07 · round history

Moved out of [tasks/TIER-07.md](../TIER-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/TIER-07` `493a276` (first push `a8d103d`) on `origin/main` `a5e48fc`. Mobile `wmt/TIER-07` on `origin/main` `7de785d`, docs only.

Files (backend): `prisma/schema.prisma` and migration `20261024090000_maker_badge_number`; new `src/plans/tier-badge/` (`PersonBadgeView`, `TierBadgeService`, `TierBadgeModule`, `ensureBadgeNumber`); `src/plans/tier-grant.service.ts` (takes the number in `grant` and `upgrade`, before the points); `badge` added to `profile-details.service.ts` and `profile-fields.type.ts`, `feed-cards.service.ts` (creator and professional cards), `explore.service.ts` and `professional.service.ts` (directory extras only), each module importing `TierBadgeModule` (a leaf with no routes, like `WaitlistCoreModule`, so no route moves); `data-export-sections.ts` (the number joins the person's own export); `scripts/enrich-contract.js` (`NULLABLE_TARGET_AS_ALLOF_DIRS`); `contract/openapi.json` regenerated (+79 lines, none removed or retyped).

Decisions (recorded here, no owner needed):
- Shape: `badge` is `PersonBadgeView` = `PlanBadgeView` (`id`, `numbered`) plus `name` (the tier's name from the plan, R-65: the app prints no tier name of its own) and `number` (Founding Maker number, null when the badge is not numbered). Null unless the tier is `active` or `ending`: the same `tierStateAt` test `MakerTierService.hasActiveTier` uses.
- Where: only on views the web does not read. `GET /users/{id}/public-profile`, `GET /users/me` (protected suite: a new key fails it), `GET /professionals` and `/{id}` (`professional-directory.contract.spec.ts` pins their keys) and `GET /creators` (the web's Explore and the app's Home read it) are untouched. M5 reads `GET /users/{id}/profile-fields` (ME-05 made it the profile fields route for exactly this reason). `GET /me/tier` is untouched because `plans.contract.spec.ts` pins `tier.badge`; the buyer's own number is `badge.number` on `GET /users/me/profile-fields`.
- The number: `MakerTier.badgeNumber` (nullable unique, G-421) from `BadgeNumberCounter`, taken by one `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` inside the grant's transaction after the person's tier lock. A repeated payment confirmation returns before it (the event pass is the anchor), a person who has a number keeps it (also across an ended tier, Verify in between, and a renewal), a rolled-back grant gives it back, the counter is never below the highest number held, and a deleted account's number is not handed out again. The migration numbers the Founding Makers that exist (`tierId = 'founding'`), oldest first.
- Order: the number is taken BEFORE the points, which stay the last write (the TIER-03 round 2 spec caught the first version, which took it after them; CI shard 1 on `a8d103d`).
- No network call is made inside the transaction; the badge reads are one query per page of people.

Checks:
- `src/plans/tier-badge/tests/tier-badge.spec.ts` (11, real database and the real grant): Verify and Plus show the Verify badge; ended at the exact millisecond and shown while ending; no tier or a retired tier has none and the rest of a page keeps theirs; two Founding Makers get different consecutive numbers; the same payment again uses no number; a renewal, an ended tier and a Verify in between keep it; an upgrade numbers once; a Founding Maker held before numbers existed shows none until the next grant; eight at once get eight numbers with no gap; a rolled-back grant gives its number back; the counter behind the highest number still gives a new one.
- `tier-badge-views.contract.spec.ts` (6, HTTP on the mock WAWU ID): profile fields as visitor and as the person, ended tier null, the explore cards, the feed creator and professional cards, the directory rows and detail; GET `/users/me`, the public profile, `/professionals` and `/professionals/{id}` have the same keys with and without a tier.
- `tier-badge-contract-shape.spec.ts` (8): every `badge` is `{ allOf: [{ $ref }], nullable: true }` and required, `number` is a nullable integer, and the web's schemas have no `badge`.
- Mutants (7), each killed by a spec: keep-number removed, ended shown, state test removed, profile `badge` null, card `badge` null, number shown on a non-numbered badge, no number on upgrade.
- Also green locally: `tier-grant.spec.ts`, `plans-contract-shape.spec.ts`, `plan-purchase-grant.contract.spec.ts`, `profile-fields.contract.spec.ts`. `data-export.contract.spec.ts` could not run on this stack (its mock WAWU ID outbox needs a service key the stack's mock does not share: 15 fail before and after, at `outbox()`); CI runs it.
- Backend CI on `493a276`: branch checks run 38991057829 green, protected route suite run 38991057824 green, baseline run 38991057843 green, executable gates red with the same 5 FAIL lines as main. Mobile full check: EXIT 0 (184 suites, 3243 tests).

Not done: ranking by tier in search and Explore (G-420; the task says only if the owner asks); `?include=badge` on the web's routes; the badge on search hits and on the byline of a content card.

## Builder report

Builder, 17 Oct 2026 (Sonnet agent). The full report is in [tasks/history/TIER-07.md](history/TIER-07.md); in short:
- **Files:** backend `prisma/schema.prisma` + migration `20261024090000_maker_badge_number`, new `src/plans/tier-badge/`, `src/plans/tier-grant.service.ts`, the profile-fields, feed-card, explore and directory services and their modules, `scripts/enrich-contract.js`, `contract/openapi.json`.
- **Checks:** capability 1 (badge while the tier runs, gone when it ends) by `tier-badge.spec.ts` and `tier-badge-views.contract.spec.ts`; capability 2 (different numbers, kept for life, once per payment) by `tier-badge.spec.ts` (consecutive numbers, a repeat uses none, eight at once, rollback, renewal and ended-tier keep it); capability 3 (protected suite unchanged) by CI's protected route suite and the new spec's key comparison of the web's routes. 7 mutants killed.
- **Gates:** 5 FAIL lines before (main) and after, the same ones; baseline check green.
- **Shared changes filed:** SHARED-CHANGES TIER-07 #1 (schema, contract, enrich script) and #2 (mobile types after merge). Gap G-803 built; G-420 not done.
- **Not done and why:** see Current state.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

