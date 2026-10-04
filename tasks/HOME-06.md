---
id: HOME-06
title: Content detail: previews, fair ratings, counts
owner: DEV
area: HOME
order: 83
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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
- **Check "A user who didn't buy a piece cannot rate it":** spec "a user who did not buy a paid piece cannot rate it" (403 on the new route only; the web route is unchanged, round 2; a pending or failed payment counts as not bought, no row written, `ratingPct` untouched). Revert proof: purchase check disabled gives 1 failing test.
- **Check "Rating twice updates, not adds":** spec "a buyer rating twice updates their rating, it does not add a second one" (one row, stars replaced, average from rows). Race proofs against the real DB: 12 buyers at once (12 rows, right average), 1 buyer tapping 12 times (1 row, `myRating` equals it), 6 people x 2 rounds (6 rows, no stale average). Revert proofs: (round 1 proofs of the old row lock and the blended average no longer apply: round 2 removed both); own-piece check off, block check off (both directions), one-direction-only block, creator check off on preview, counting pending payments: each fails its test.
- **Blocked people (both directions):** the same 404 and wording as a random missing id on rating, detail and preview, for someone the creator blocked and for someone who blocked the creator. A buyer keeps the detail of what they bought after a block (as SETTINGS-04's `findOne`), but cannot rate.
- **Live responses unchanged:** a test asserts `GET /content/:id` and `GET /content` still return exactly the registry's 23 keys after previews and ratings exist. Protected route suite `scripts/protected-routes/run.sh --fresh` (branch code, fresh DB): 244/244, before and after.
- **Gates (backend):** `tsc --noEmit` 0 errors; eslint on every file I touched or added: 0 errors, 0 warnings; `scripts/gates/run.py` 16 fail / 21 warn on main and on this branch, identical findings (accepted 76 on main, 75 here: the removed `rate()` comment drained one accepted deferral, baseline entry `5e176427b3deedd7` now matches nothing; baseline not edited); `check_baseline.py` passes.
- **`npm run test:contract` (whole suite, branch and `origin/main` 9a370c0 in `/home/user/lanes/h06/main-src`, each on its own database and mock WAWU ID):** branch 43 failed, 3 skipped, 3368 passed (142 suites, 7 failed); main 43 failed, 3 skipped, 3342 passed (141 suites, 7 failed). Compared by test name: the same 43 fail on both (env-caused, from the shared mock), none only on the branch; the branch has 26 more passing, the new spec. Protected-route probe `POST /payments/hosted-link` needs `CORS_ORIGIN` unset, as in CI.
- **NOT RUN:** V9 live seam against a real login (no mobile screen calls the routes yet: the screens are HOME-02 and HOME-03; unblocked when they are built); V5 and V6 do not apply (no screen); the purge of a rater's account end to end (the purge service needs WAWU ID deletion, which the mock refuses; the map spec covers the classification); wallet-unlocked buyers (G-125) because no wallet unlock writes a `Purchase` yet.
- **Gaps and shared-change requests:** G-120 to G-126; SHARED-CHANGES HOME-06 #1 (schema, migration, contract, purge map), #2 (mobile contract sync after merge), #3 (overlaps with `wmt/SETTINGS-04`).

### Round 2 (fix for verifier finding 1 and 6)

- **Legacy route restored byte for byte.** `ContentPieceService.rate()`, the `RateContentDto` import and `ContentPieceController.rate` are identical to origin/main c4d17bb (`git diff origin/main` shows no line of either; the controller file equals main's). Same statuses, bodies, 50/50 `ratingPct` blend and side effects (it writes `ratingPct` only, no `ContentRating` row, no block or purchase check).
- **The new rules live only on `PUT /content/:id/rating` and `GET /content/:id/detail`.** The new route writes `ContentRating` only (one `INSERT ... ON CONFLICT (user, piece) DO UPDATE`, so simultaneous taps share one row) and never writes `ContentPiece`. Average and count are computed from the rows. The per-piece row lock is gone (nothing on `ContentPiece` is written). `ContentPiece` still has no new column; `GET /content` and `/content/:id` keep their 23 keys.
- **New tests (spec now 29):** "the web rating route is unchanged": non-buyer, pending-payment buyer, creator, a blocked person each get 201 and the old blend step by step (5, 1, 3, 4, 2 give 100, 60, 60, 60, 40 by the origin/main formula); free, pending, removed and rejected pieces are still rated; missing 404, rating 6 400, no token 401; the legacy route writes no row; the new route leaves `ratingPct` alone and the legacy route leaves the rows alone. Revert proofs: legacy blend changed to the last star only fails 2 tests; legacy route made to refuse the creator fails 1; the new route's `ON CONFLICT` removed fails the 12-at-once tests.
- **Re-run after merging origin/main (backend e638ffb plus this fix):** new spec 29/29 (3 runs); `src/content-piece` and `src/account-purge` 165 tests pass; `tsc` 0; eslint on touched files 0; `contract:build` additive (267 lines added, 0 removed against origin/main); protected suite `run.sh --fresh` 244/244; full `test:contract` and mobile `npm run check`: branch (clean, run alone, own DB and mock) 3468 passed, 3 skipped, 1 failed (`fintava-stall.spec.ts` "a balance whose body lands at half the timeout", a load-timing test: 120/120 when that file runs alone, three times, on branch and on main); origin/main c4d17bb (run alone, own DB and mock) 3397 passed, 3 skipped, 43 failed (account, blocked-account, credits-state, kyc-submission, notification, privacy-settings, saved-item suites, from the shared-mock/WAWU ID deletion environment). Compared by test name: 1 test fails only on the branch (the timing flake above, passes alone), 43 only on main in this run; no failure is in a file this task touches. An earlier concurrent run of both gave branch 43 vs main 43 identical, so the environment-caused set moves between runs; the new spec passes in all of them. Mobile `npm run check`: exit 0 (206 tasks, gates 0 findings)
- **Data export (finding 5 / G-126):** `data-export-map.spec.ts` and `data-export-sections.ts` do not exist in this tree (they are on the local `wmt/SETTINGS-04` only; not merged). FOLLOW-UP for whoever merges second: in `src/data-export-request/data-export-sections.ts` add a section with `models: ['ContentRating']` exporting the person's own rows (`contentId`, `stars`, `createdAt`, `updatedAt` where `userWawuId` is them); `ContentDetail` has no person column and needs nothing. SHARED-CHANGES HOME-06 #3 is rewritten: the `rate()` overlap is gone; the module-import overlap remains.

Defaults 2, 3 and 4 below are superseded by these lines:

- **Two stores until the web moves over (Default (agent), owner may override).** The web rates through `POST /content/:id/rate` into `ContentPiece.ratingPct` (anyone, blended); the app rates through `PUT /content/:id/rating` into `ContentRating` (buyers only, one each). They do not feed each other. `detail.rating` is row-based (`average`, `count`); `ratingPct` in `GET /content` and the feed ranking stays the web route's number. Owner must decide (G-122, G-127): when the web moves to the new route, whether to clear or keep legacy `ratingPct` and whether the ranking reads the rows.
- **Rules on the new route:** paid piece needs a completed purchase; free piece any signed-in non-creator; creator cannot rate own; piece must be live; one row per person, edits replace; 1 to 5 (also a database CHECK); no remove-rating route.
- **Blocked:** hidden in both directions on the new routes only (same 404 as a missing id; the detail read keeps a buyer's copy; writes have no exception). **The legacy route does not hide blocked people, and it cannot be changed here because it is protected.** SETTINGS-04 adds `assertVisible` inside `rate()`, which would change that protected route's behaviour as well: owner decision (G-127), not made here.

### Defaults (agent), owner may override (round 1; see round 2 above)

1. **Free preview is a creator-declared count on a side row**, not a column on `ContentPiece` (a column would widen every live content response). One kind per type: pages for a pdf, seconds for a video or audio file, lessons (the first N by order) for a course; images and templates have none. It must be smaller than the piece (pages against `pageCount`, lessons against the lesson count); free content has none. H4's "12 pages free" and H19's "pages 1 to 4" are therefore one piece's data, not a rule. Upper bounds (10000 pages, 86400 seconds, 1000 lessons) are typo guards, not business limits.
2. **Who can rate:** paid piece, only with a completed purchase; free piece, any signed-in person except its creator; always once, edits replace, 1 to 5 stars (also a database CHECK), piece must be live. No route to remove a rating. Free-piece risk is G-124.
3. **The web's `POST /content/:id/rate` is hardened, not left open:** a non-buyer of a paid piece now gets 403 instead of moving the rating. Buyers get the same 201 and the same piece shape; `ratingPct` is now the rounded mean of the rows times 20, not the old 50/50 blend (G-122 for pieces rated before this).
4. **Blocked:** hidden in both directions with the missing-id 404; the detail read keeps a buyer's copy (SETTINGS-04's rule); writes have no exception. Uses `isBlockedEitherWay` (on main), not `hiddenFrom` or `assertVisible` (SETTINGS-04 only).
5. **updatedAt** is the creator's last edit, resubmit or preview change, else the creation time. Live pieces are not editable, so it moves only while a piece is pending or rejected, or when the preview changes.
6. **Counts:** `buyerCount` is distinct people with a completed content purchase; `studentCount` is the same number for a paid course and null for anything else (a free course has no enrolment record, so no number is made up). `average` is one decimal.
7. No fee, price or rate is involved; money fields are untouched.

## Verifier report

**Verdict: FAIL** (one defect: a protected, web-called route changed behaviour). Verifier session, 4 Oct 2026. Branch `wmt/HOME-06` at 766189f (merge base 9a370c0; origin/main has since moved to c4d17bb). Evidence: `/home/user/lanes/h06v/` (logs), scratch scripts in the session scratchpad.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed with a note | backend `tsc --noEmit` exit 0; eslint (no-fix) on the 4 changed src files clean; `scripts/gates/run.py` 677 files, 16 fail / 21 warn / 75 accepted, main (673 files) 16 / 21 / 76 (same findings; one accepted deferral drained by the deleted `rate()` comment); `check_baseline.py` ok. Mobile `npm run check` exit 0 (gates 135 files scanned, 0 findings; 205 tasks). |
| V2 Contract | passed for the new routes; full-suite comparison NOT RUN | `src/content-piece` + `src/account-purge` specs on the branch: 137/137 pass (includes the 26 new tests and the old `POST /rate` tests). Revert proofs (file copied aside, restored byte for byte): purchase check off = 1 failing test; own-piece check off = 1; block check off on rate = 2; row lock off = 2. Full `test:contract`: I could not get a clean side-by-side. My runs gave branch 758 failed / main 298 failed; money suites fail with 401 / `prisma.fintavaWallet.create` P1010 in this worktree set-up, and the same 11 fees tests fail even on a scratch worktree holding main's code, so it is my environment, not the branch. The builder's own lists (`/home/user/lanes/h06/fail_branch.txt`, `fail_main.txt`) are 43 vs 43 and identical, not reproduced by me. |
| V3 Regression | passed, but does not cover the change (finding 1) | `scripts/protected-routes/run.sh --fresh HEAD`, fresh DB: "all 244 required tests passed" (`h06v/v3_branch.log`). Its only probe of `POST /content/:id/rate` is "as buyer, rating 5, expect 201 and 23 keys with `ratingPct: number`". |
| V4 Field trace | passed | Writer `PUT /rating` (and the web `POST /rate`) writes `ContentRating` plus `ratingPct` in one locked transaction; readers `GET /content/:id/detail` (rows) and `GET /content`, `GET /content/:id` (cache). `ContentDetail` written by `PUT /preview` and the creator edit/resubmit stamp; read by detail. |
| V9 Live seam | NOT RUN | no mobile screen calls the routes yet (HOME-02, HOME-03). Black-box over real HTTP with real mock-WAWU-ID tokens was run instead (below). |

### What I ran

- Two hubs (main-src at origin/main 9a370c0 on :3971, branch on :3972), on two copies of one seeded database (`h06v_base` -> `h06v_main`, `h06v_branch`; the branch copy migrated afterwards), one mock WAWU ID, identical tokens and identical requests (script `bb.js`).
- Migration on a copy of the seeded DB: `ContentPiece` rows hashed (md5) before, after deploy, after `DROP TABLE "ContentRating","ContentDetail"` (the stated rollback) and after replaying the SQL by hand: all four equal; seeded `ratingPct` 96, 91, 73 untouched. `prisma migrate diff` after deploy: only main's own `DROP INDEX "ContentPiece_specializations_idx"`. HOME-05's `20261004100000_content_frames` (table `ContentFrame`) applied beside it on one DB with no error: different names and tables, coexist.
- Races on the branch hub: 14 buyers at once (14 rows, 14 distinct users, cache 61 = round(mean 3.071 x 20)); 1 buyer x 14 parallel (one row); forged `average`, `count`, `ratingPct`, `userWawuId` in the body: 400 "property ... should not exist"; rating 0, 6, "5", null, {} : 400; direct SQL with stars 0, 6, -1 refused by the CHECK, a duplicate (user, piece) refused by the unique index.

### Findings

1. **defect (FAIL): the web's `POST /content/:id/rate` changed behaviour and nothing authorises it.** The route is in `.pipeline/protected-registry.json` (route 42, caller `src/lib/api/content.ts:378`); `wawu-backend/CLAUDE.md` says additive only and that nothing in the registry changes behaviour; the task says "Additive only", names only new capability checks, lists no decision and no `SHARED-CHANGES` row approving the change, and `DECISIONS.md` has no ruling about it ("the web follows after launch" is about the web adopting the app, not about breaking the web today). Also `ContentPieceService.rate()` was deleted, a removal outside a removal task. Black-box, main vs branch, same requests (all other cases identical):

   | Request | main | branch |
   |---|---|---|
   | buyer of a paid piece, rating 1 to 5 | 201, piece (23 keys) | 201, same keys; only `ratingPct` differs (value, below) |
   | anyone rates a free piece | 201 | 201 (same) |
   | non-buyer of a PAID piece | 201, moves the rating | **403** "Only people who bought this can rate it." |
   | buyer with only a pending purchase | 201 | **403** |
   | creator rates own piece (paid or free) | 201 | **403** "You cannot rate your own content." |
   | piece pending or removed | 201 | **404** |
   | rater blocked by the creator, or who blocked the creator | 201 | **404** |
   | no token / missing id / bad uuid / rating 0, 6, 2.5, "4", no body / extra field | 401 / 404 / 400 ... | same |
   | `ratingPct` after a rating | `round((old + 20 x stars) / 2)`, any rater, repeated | `round(mean of rows x 20)`, one row per person; the first row on a piece rated before HOME-06 replaces the old number (96 became 100, 60 became 100) |
   | side effects | writes `ratingPct` only | writes a `ContentRating` row and `ratingPct`, locks the piece row |

   Status code (201), envelope and keys are unchanged, so a web client that only rates after buying would not notice; a web page that lets anyone rate a paid piece, lets a creator rate their own, or rates a piece still pending would now get 403 or 404 where it got 201. The 244/244 suite cannot see any of this: its single probe is the buyer's happy path and checks only that `ratingPct` is a number (and the old `content-piece.contract.spec.ts` rate tests only cover a free seeded piece, 400, 404, 401). To unblock: either keep the old route's behaviour until a removal task (add the new rules only on `PUT /content/:id/rating`), or an owner ruling in `DECISIONS.md` that this route may change, with a V3 probe for each new refusal.
2. **unclear (owner), builder's G-122:** the migration is safe (rows byte-identical), but legacy aggregates become inconsistent: `GET /content/:id/detail` says average null, count 0 while `ratingPct` still shows 96; the first new rating discards the old number. Needs the owner's call (builder asked it). Not a defect of the migration.
3. **Block hiding passed.** For a person the creator blocked, a person who blocked the creator, and a stranger on a pending or removed piece, `detail`, `PUT rating` and `PUT preview` answered byte-identical (ids masked) to a random missing id: 404 `Content not found`. Unauthenticated: 401. A buyer blocked after buying keeps `detail` (200) and `GET /content/:id`, but `PUT rating` and `POST /rate` answer 404. Enumeration: a live paid piece answers a non-buyer 403, but live pieces are public in the feed, so no existence is leaked that is not already shown; non-live and blocked pieces never differ from missing.
4. **Preview and counts passed.** `detail` has no asset URL key (`fullAssetUrl` string "SECRET" absent from the whole body for a non-buyer); lessons carry only id, title, order, duration, `isFree`. `PUT /preview`: non-creator and buyer get 404; 0, negative, float, 10000+, whole piece (84 of 84), wrong kind for the type, on free content, unknown key: all 400; the lessons rule (4 of 4 refused, 2 ok, `isFree` true for 1 to 2 only). Counts: a buyer with two completed purchases counts once; pending and failed purchases not counted; `studentCount` is a number for a paid course only, null for free course and pdf. Content purchases have only pending, completed, failed (no refund state), so refunds cannot inflate counts. No fee, price or rate involved.
5. **Overlap claims, SHARED-CHANGES HOME-06 #1 to #3: confirmed with one correction.** Scratch merge of branch + local `wmt/SETTINGS-04` (76df651; no `origin/wmt/SETTINGS-04` exists to fetch) in `/home/user/lanes/h06v/merge`: exactly one conflict, in `content-piece.service.ts`, the `rate()` hunk (HOME-06 deletes it, SETTINGS-04 adds `assertVisible`); `content-piece.module.ts` auto-merged with one `BlockedAccountModule` import. After taking the deletion `tsc` is clean, `src/account-purge` passes, and `data-export-map.spec.ts` fails with `ContentRating` undecided (G-126 is true: the second merger must add the export entry). If finding 1 is fixed by keeping `rate()`, that conflict changes and #3 must be redone.
6. **defect (low), branch is behind main:** origin/main is now c4d17bb (HOME-05, KYC-03, FIX-05 merged). Merging it conflicts in `contract/openapi.json` (regenerate, never hand-merge) and `src/content-piece/content-piece.module.ts` (both add imports/providers), because HOME-05 touched the same files; `schema.prisma` merges cleanly. Needs the merge, `contract:build` and a re-run of V3 before the PR.
7. **Defaults (agent), owner may override:** all seven builder defaults reviewed; nothing here contradicts them except that default 3 (harden the web route) is the unauthorised change in finding 1.

### NOT RUN

V9 (no screen yet); full `test:contract` side-by-side by test name (environment, see V2); the account purge end to end (mock refuses WAWU ID deletion, as the builder said); wallet-unlocked buyers (G-125); a third round with origin/main merged in (branch is behind, finding 6).

Result: status set back to `building` for finding 1 (and 6).

## Verifier report (round 2)

**Verdict: PASS** (round-1 finding 1 and 6 closed; no code defect; two low documentation findings below for the builder or lead to correct before merge). Fresh verifier session, 4 Oct 2026. Backend `wmt/HOME-06` at 4ce079a (origin/main c4d17bb merged), mobile branch at 1f55b31. Evidence: `/home/user/lanes/h06/w_bb.txt`, `w_nb2.txt`, `w_v3.log`, `w_contract_branch.log`, `w_contract_main.log`, `w_mobile_check.log`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | backend `tsc --noEmit` exit 0; mobile `npm run check` exit 0 (206 tasks); `contract:build` regenerated gives a file byte-identical to the committed one, and against origin/main it is 267 lines added, 0 removed, no existing path or schema key changed or removed (new paths: `/content/{id}/detail`, `/rating`, `/preview`). |
| V2 Contract | passed | new spec 29/29. Mutations (file copied aside, restored byte for byte, md5 checked): new controller unregistered = 24 failed (the other 5 are the legacy-route tests, which correctly still pass because that route is main's); purchase check off = 1 failed; own-piece check off = 1; block check off = 2; `ON CONFLICT` removed = 4 (the race tests); legacy blend changed to last star = 2. Full `test:contract` below. |
| V3 Regression | passed, and now covers the change | `scripts/protected-routes/run.sh --fresh HEAD`: "all 244 required tests passed" (`w_v3.log`). The black-box below is what that suite cannot see. |
| V4 Field trace | passed | `ContentPiece` is read by the new service (3 `findUnique`), never written (grep of the diff: no `contentPiece.update/create/upsert/delete`, only the migration's FK). The legacy `rate()` is the only writer of `ratingPct`. |
| V9 Live seam | NOT RUN | no mobile screen calls the routes yet (HOME-02, HOME-03). Black-box over real HTTP with real mock-WAWU-ID tokens instead. |

### Finding 1 (round 1) closed: the web's `POST /content/:id/rate` behaves exactly as on origin/main

- `git diff origin/main` on `content-piece.service.ts` shows only `stampUpdated` (two call sites, a new private method); `rate()` has no changed line. `content-piece.controller.ts` and `dto/` (the rate DTO) show no change (only the new `set-preview.dto.ts` is added). The module diff adds the new controller, service and `BlockedAccountModule`.
- Black-box, two hubs (origin/main build on :3981, branch build on :3982), two copies of one seeded database, one mock WAWU ID, same tokens and requests, 27 cases: unauthenticated; buyer rating 5 then 1 (re-rate); second buyer; first rating ever on an unrated piece; non-buyer of a PAID piece; pending-purchase payer; non-buyer on free (twice); buyer on free; creator on own paid and own free; buyer and creator on a PENDING piece; buyer on a REMOVED piece; missing id; bad uuid; rating 0, 6, 2.5, "4"; no body; extra forged fields (`ratingPct`, `average`); caller blocked by the creator; caller who blocked the creator; seeded buyer on a seeded paid course; non-buyer on a seeded free video. Result: 27 of 27 SAME status and SAME full body (timestamps masked). After EVERY step the `ratingPct` read from the database and from `GET /content/:id` was identical on both hubs (final 98, 96, 73, 85, 98, 100, 100, null, 60 on both). The branch wrote 0 `ContentRating` rows through the legacy route. Non-buyers, pending payers, creators, pending and removed pieces and blocked callers all got 201 on both, as on main.
- New routes never write `ContentPiece`: md5 of every `ContentPiece` row of the run's creator, before and after all calls to `GET /detail`, `PUT /rating` (including 14 parallel users, 14 parallel taps by one user) and `PUT /preview`: UNCHANGED. Only the later legacy `POST /rate` by a blocked buyer changes it (201, `ratingPct` moves), as on main.

### Regression sample of what round 1 verified (all still true)

Block hiding: for a person blocked by the creator, one who blocked the creator, and a stranger on pending and removed pieces, `detail`, `PUT rating` and `PUT preview` answered the same 404 `Content not found` as a random missing id (18 of 18 identical; unauthenticated 401). A buyer blocked after buying keeps `detail` (200) and `GET /content/:id`, `PUT rating` is 404. Races: 14 buyers at once gave 14 rows and 14 distinct users, average from rows (3.143, shown as 3.1); one buyer tapping 14 times at once gave one row, all 200. Forged `average`, `count`, `ratingPct`, `userWawuId` in the body: 400 "property average should not exist"; rating 0, 6, "5", null, `{}`: 400; direct SQL with stars 0, 6, -1 refused by the CHECK and a duplicate by the unique index. Locked URL: `detail` keys are contentId, contentType, updatedAt, purchasedAt, buyerCount, studentCount, freePreview, lessons, rating; the string "SECRET" from `fullAssetUrl` is absent for a non-buyer, lessons carry no URL. Preview: non-creator and buyer 404; 0, negative, float, 999999, the whole piece (84 of 84), wrong kind for the type, on free content, unknown key: 400; lessons 4 of 4 refused, 2 ok with `isFree` true for 1 and 2 only; video seconds ok, video pages 400. Counts: a buyer with two completed purchases counts once, pending and failed not counted, `studentCount` null for a pdf and a free course. Creator, non-buyer (failed payment) and pending payer on `PUT rating`: 403 each.

### Owner-decision records

- **G-122, G-123, G-127 are honest.** Checked against behaviour: pieces rated before HOME-06 keep `ratingPct` while `detail.rating` says average null count 0 (true); the new route leaves `ratingPct` alone (md5 proof); the legacy route does not hide blocked callers (201 both ways, proof above); each names the owner decision that unblocks it.
- **Finding 2 (low, defect): the LOG line is false after round 2.** `docs/LOG.md` line 6 (and its copy in `docs/PROGRESS.md`) still says "the web's `POST /content/:id/rate` now needs a purchase for paid pieces and keeps one rating per person". Round 2 restored the route to main's behaviour, so a reader is told the opposite of the truth. To correct: drop that clause (the web route is unchanged) and run `npm run tasks -- --write`. Also `SHARED-CHANGES.md` HOME-06 #1 says "268 lines added"; it is 267. Default (agent), owner may override: the builder or lead corrects both before merge.
- **Finding 3 (low, defect): SHARED-CHANGES HOME-06 #3 / G-126 is not "exact" and omits one consequence.** Scratch merge of `origin/wmt/SETTINGS-04` into the branch in a throwaway worktree (`/home/user/lanes/h06v2/merge`, since removed): the merge is CLEAN (no conflict; `content-piece.module.ts` and `content-piece.service.ts` auto-merge, SETTINGS-04's `assertVisible` lands inside `rate()`). `tsc` 0 after `prisma generate`. `data-export-map.spec.ts` then fails (`ContentRating` undecided), as G-126 says. Applying the section as described (one entry in `EXPORT_SECTIONS`, `models: ['ContentRating']`, `findMany` where `userWawuId` is the requester, select `contentId`, `stars`, `createdAt`, `updatedAt`, newest first; I used the key `piecesRated` because the text gives none) makes `data-export-map.spec.ts` 5/5 and `tsc` 0. But (a) the text gives no key name and no code, so the claim of "exact text" is not met; (b) after that merge HOME-06's own spec "the web rating route is unchanged: a non-buyer, a pending-payment buyer, the creator and a blocked person all still get 201" FAILS (`expected 201, got 404`), because SETTINGS-04 hides blocked callers inside the legacy `rate()`. #3 and G-127 name the behaviour change but not that this spec must be adjusted by whoever merges second once the owner decides. To correct: add the key and snippet, and one sentence that the blocked-caller case in that test changes with the owner's G-127 decision. (`data-export.contract.spec.ts` failures in that scratch tree came from my older mock lacking SETTINGS-04's mock additions, not from the section.)

### Full `test:contract`, branch vs clean origin/main c4d17bb (own DBs `h06w_*`, own mocks on :4983 and :4984, run concurrently; :4001 belongs to another session and was left alone)

- Branch: 144 suites, 143 passed, 1 failed; 3225 passed, 3 skipped, 244 failed. All 244 failures are `protected-routes.regression.spec.ts`, which refuses a database name without "test" or "protected" (`h06w_contract_branch`); main fails the same 244 for the same reason. The same suite passes 244/244 via `run.sh --fresh` above, so this is my database name, not the code.
- Main: 143 suites, 134 passed, 9 failed; 3149 passed, 3 skipped, 291 failed = the same 244 plus 47 in account, blocked-account, credits-state, fintava-stall, kyc-submission, notification, privacy-settings, saved-item.
- Compared by test name: 0 tests fail only on the branch; 47 fail only on main. `fintava-stall` passes alone on the branch (120/120).
- **Finding 4 (unclear, not a branch defect): the main-only failures reproduce on a clean main in this setup and I could not explain them.** The same suites pass on the branch tree and fail in the main tree on fresh databases and a mock started in each tree's own directory (A/B repeated: branch 42/42, main 11 failed, branch 42/42, main 11 failed; a clean `git worktree` of origin/main also failed). A built main hub verifies the same mock tokens (200 on `/credits`), so main's code is fine; the failing part is the in-process jest harness in a tree other than `wawu-backend` (tests read `mock-wawu-id/private.pem` beside the tree). Builder's round 2 saw the same 43 on main. It does not affect this task (nothing fails only on the branch) but the main-side counts are not a clean baseline.

### NOT RUN

V9 (no screen yet); account purge end to end (mock refuses WAWU ID deletion); wallet-unlocked buyers (G-125, no unlock writes a `Purchase` yet); a clean main baseline for the 47 main-only failures (finding 4); `data-export.contract.spec.ts` in the scratch merge (needs SETTINGS-04's mock).

Result: status `review`.

## Lead merge note (4 Oct 2026)

Merged to main by the lead (Developer 1's task). Backend PR #63 (030d789).
Lead changes on the backend branch: the migration was renamed from
`20261004100000_content_detail_ratings` to `20261004113000_content_detail_ratings`
(it shared HOME-05's applied timestamp and sorted before it); then main dfaa53b
(WALLET-27, SETTINGS-04) was merged in (cffe63c). Running both tasks' specs on
the merged tree found the two interactions this task's verifier foresaw
(finding 3): `ContentRating` added to the data export as
`contentRatingsGiven` (G-126 closed), and SETTINGS-04's 404 for a blocked
person on the protected `POST /content/:id/rate`, which this task's spec now
asserts instead of main's older 201 (kept, and put to the owner under G-127).
Full suite on the merged tree in its own network namespace: 148 of 149 suites,
the last (`hub-rate-limits`) 22/22 on the host network. Verifier finding 2
(the LOG line): the line on main already says the web route is unchanged by
this task. Mobile contract synced from backend main 030d789.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
