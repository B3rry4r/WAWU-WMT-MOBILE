---
id: HOME-06
title: Content detail: previews, fair ratings, counts
owner: DEV
area: HOME
order: 83
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-06 · Content detail: previews, fair ratings, counts

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Content detail shows free preview pages or seconds, ratings only from buyers, and real counts (H19, H23, H25). Additive only.

## Scope

Free preview pages or seconds; ratings only from buyers, once each; updated-at, purchased-at and student counts.

## Capability checks

- [ ] A user who didn't buy a piece cannot rate it.
- [ ] Rating twice updates, not adds.

## Builder report

Built by an agent on `wmt/HOME-06` (backend `wawu-backend`, mobile repo for this file). Nothing committed or pushed.

- **Files (backend):** new `src/content-piece/content-detail.{service,controller}.ts`, `dto/set-preview.dto.ts`, `tests/content-detail.contract.spec.ts` (26 tests); migration `20261004100000_content_detail_ratings` (tables `ContentRating`, `ContentDetail`); `schema.prisma` (+44 lines, no column on `ContentPiece`); `content-piece.{controller,module,service}.ts` (old `rate()` removed, `stampUpdated` on edit and resubmit); `account-data-map.ts` (`ContentRating` AUTHORED); `contract/openapi.json` regenerated (268 lines added, 0 removed). Mobile: this file, `BACKEND_GAPS.md` G-120 to G-126, `SHARED-CHANGES.md` HOME-06 #1 to #3, `docs/LOG.md`.
- **New routes:** `GET /content/:id/detail` (updatedAt, purchasedAt, buyerCount, studentCount, freePreview pages/seconds/lessons, lessons with `isFree`, rating state with average, count, myRating, canRate and the reason); `PUT /content/:id/rating`; `PUT /content/:id/preview` (creator only).
- **Check "A user who didn't buy a piece cannot rate it":** spec "a user who did not buy a paid piece cannot rate it" (403 on the new route and on `POST /content/:id/rate`, a pending or failed payment counts as not bought, no row written, `ratingPct` untouched). Revert proof: purchase check disabled gives 1 failing test.
- **Check "Rating twice updates, not adds":** spec "a buyer rating twice updates their rating, it does not add a second one" (one row, stars replaced, `ratingPct` 40, the web route lands on the same row). Race proofs against the real DB: 12 buyers at once (12 rows, right average), 1 buyer tapping 12 times (1 row, cache equals the winning row), 6 people x 2 rounds (6 rows, no stale average). Revert proofs: row lock removed fails the concurrency tests on 3 of 3 runs; average blended instead of from rows fails 5 tests; own-piece check off, block check off (both directions), one-direction-only block, creator check off on preview, counting pending payments: each fails its test.
- **Blocked people (both directions):** the same 404 and wording as a random missing id on rating, detail and preview, for someone the creator blocked and for someone who blocked the creator. A buyer keeps the detail of what they bought after a block (as SETTINGS-04's `findOne`), but cannot rate.
- **Live responses unchanged:** a test asserts `GET /content/:id` and `GET /content` still return exactly the registry's 23 keys after previews and ratings exist. Protected route suite `scripts/protected-routes/run.sh --fresh` (branch code, fresh DB): 244/244, before and after.
- **Gates (backend):** `tsc --noEmit` 0 errors; eslint on every file I touched or added: 0 errors, 0 warnings; `scripts/gates/run.py` 16 fail / 21 warn on main and on this branch, identical findings (accepted 76 on main, 75 here: the removed `rate()` comment drained one accepted deferral, baseline entry `5e176427b3deedd7` now matches nothing; baseline not edited); `check_baseline.py` passes.
- **`npm run test:contract` (whole suite, branch and `origin/main` 9a370c0 in `/home/user/lanes/h06/main-src`, each on its own database and mock WAWU ID):** branch 43 failed, 3 skipped, 3368 passed (142 suites, 7 failed); main 43 failed, 3 skipped, 3342 passed (141 suites, 7 failed). Compared by test name: the same 43 fail on both (env-caused, from the shared mock), none only on the branch; the branch has 26 more passing, the new spec. Protected-route probe `POST /payments/hosted-link` needs `CORS_ORIGIN` unset, as in CI.
- **NOT RUN:** V9 live seam against a real login (no mobile screen calls the routes yet: the screens are HOME-02 and HOME-03; unblocked when they are built); V5 and V6 do not apply (no screen); the purge of a rater's account end to end (the purge service needs WAWU ID deletion, which the mock refuses; the map spec covers the classification); wallet-unlocked buyers (G-125) because no wallet unlock writes a `Purchase` yet.
- **Gaps and shared-change requests:** G-120 to G-126; SHARED-CHANGES HOME-06 #1 (schema, migration, contract, purge map), #2 (mobile contract sync after merge), #3 (overlaps with `wmt/SETTINGS-04`).

### Defaults (agent), owner may override

1. **Free preview is a creator-declared count on a side row**, not a column on `ContentPiece` (a column would widen every live content response). One kind per type: pages for a pdf, seconds for a video or audio file, lessons (the first N by order) for a course; images and templates have none. It must be smaller than the piece (pages against `pageCount`, lessons against the lesson count); free content has none. H4's "12 pages free" and H19's "pages 1 to 4" are therefore one piece's data, not a rule. Upper bounds (10000 pages, 86400 seconds, 1000 lessons) are typo guards, not business limits.
2. **Who can rate:** paid piece, only with a completed purchase; free piece, any signed-in person except its creator; always once, edits replace, 1 to 5 stars (also a database CHECK), piece must be live. No route to remove a rating. Free-piece risk is G-124.
3. **The web's `POST /content/:id/rate` is hardened, not left open:** a non-buyer of a paid piece now gets 403 instead of moving the rating. Buyers get the same 201 and the same piece shape; `ratingPct` is now the rounded mean of the rows times 20, not the old 50/50 blend (G-122 for pieces rated before this).
4. **Blocked:** hidden in both directions with the missing-id 404; the detail read keeps a buyer's copy (SETTINGS-04's rule); writes have no exception. Uses `isBlockedEitherWay` (on main), not `hiddenFrom` or `assertVisible` (SETTINGS-04 only).
5. **updatedAt** is the creator's last edit, resubmit or preview change, else the creation time. Live pieces are not editable, so it moves only while a piece is pending or rejected, or when the preview changes.
6. **Counts:** `buyerCount` is distinct people with a completed content purchase; `studentCount` is the same number for a paid course and null for anything else (a free course has no enrolment record, so no number is made up). `average` is one decimal.
7. No fee, price or rate is involved; money fields are untouched.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
