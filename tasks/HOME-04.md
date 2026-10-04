---
id: HOME-04
title: Feed: following, likes, views, shares
owner: DEV
area: HOME
order: 78
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-04 · Feed: following, likes, views, shares

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

The Following tab, likes, views and shares are recorded per viewer (H2, H12, H19). Additive only.

## Scope

Following scope on the feed, likes, view counting on open, share counts, liked and saved flags per viewer.

## Capability checks

- [ ] The Following tab shows only people the user follows.
- [ ] Liking twice counts once.

## Builder report

Backend `wmt/HOME-04` (wawu-backend, worktree lanes/h04/wawu-backend). Not committed; the lead commits.

**Built (all new, additive).** `GET /feed?scope=for_you|following` (cards carry `likedByMe`, `savedByMe`, `followsCreator`, `shares`); `GET /feed/following/count`; `GET /content?scope=following` (same shape as before, widened enum only); `POST` and `DELETE /content/:id/like`; `POST /content/:id/view`; `POST /content/:id/share`; `GET /content/:id/engagement`. Tables `ContentLike`, `ContentView`, `ContentShare` (migration `20261003200000_content_engagement`, no existing column, index or row touched; `ContentPiece` gains no column so no live content response gains a key, protected-registry H-1). Files: `prisma/schema.prisma`, the migration, `src/content-piece/` (`content-engagement.service.ts`, `content-engagement.controller.ts`, `feed-query.dto.ts`, edits to `content-piece.service.ts`, `.module.ts`, `list-content-query.dto.ts`, new `tests/feed-engagement.contract.spec.ts`), `src/account-purge/account-data-map.ts` (three OWNED rows), `contract/openapi.json` (npm run contract:build: 6 paths added, 1 enum value added, 0 removed).

**Capability checks.**
- The Following tab shows only people the user follows: `feed-engagement.contract.spec.ts` "a user sees only live pieces by people they follow, newest first", "follows nobody", "unfollows a creator". Revert proof: removing the `creatorWawuId in followed` filter fails 4 tests.
- Liking twice counts once: "likes a piece twice counts once", "taps like many times at once" (8 parallel requests, 1 row, +1). Revert proof: incrementing without checking the row was created fails 3 tests.
- Also proven, each with a revert (owner views counted: 1 fail; every open counted: 1 fail; every share counted: 1 fail; liked flag read for anyone: 2 fail): one counted view per person per day and never the owner's; one share per person per day; flags are the viewer's own.

**What ran.** New spec 22/22 (own DB `h04_contract`, own mock WAWU ID on :4741; :4001 belongs to another agent and was not touched). Full `npm run test:contract`, same environment, branch vs origin/main (checkout lanes/h04/main-src, DB `h04_main_contract`, mock :4742): main 3010 passed, 287 failed, 3 skipped (3300 tests, 8 suites failed); branch 3032 passed, 287 failed, 3 skipped (3322 tests, 8 suites failed). The 287 failing test names are identical in both runs (diffed): the protected-route suite refuses a database whose name has no "test" in it, and six suites sign in against a hard-coded :4001 mock whose keys are not mine (401). So 0 new failures, 22 new passes. Protected-route suite `scripts/protected-routes/run.sh --fresh` on branch: 244/244 required (253 tests); on origin/main: 244/244 (253). Gates `python3 scripts/gates/run.py`: main 16 fail, 14 warn, 76 accepted; branch the same, finding lists identical; baseline check passes. `npx tsc --noEmit` clean; new files lint clean (eslint, 0 errors, 0 warnings). Mobile `npm run check`: exit 0 (485 tests; the first run had one timeout in the unrelated A26 open-wallet test while the machine was loaded, the rerun passed with no change). `npm run tasks -- --write` done.

**NOT RUN.** Live check against a deployed hub and a real device (no deployment from this lane); unblocked by the lead running the app against the merged backend. Concurrent like from two devices of one person on a real network (the parallel test is in-process).

**Gaps and requests.** G-85 (creator name and avatar on a feed card, HOME-05), G-86 (account purge does not walk counters back). SHARED-CHANGES: HOME-04 #1 (schema, migration, contract), HOME-04 #2 (mobile contract regeneration).

**Defaults (agent), owner may override.**
- Views: one counted per person per piece per UTC day; the owner's own opens and signed-out reads count nothing (same rule as ProfileView). The app calls `POST /content/:id/view` when a piece is opened.
- Shares: one counted per person per piece per UTC day; the owner sharing their own piece counts. No channel is recorded.
- Likes: allowed on any live piece including your own; liking or unliking is idempotent; the counter never goes below zero (seeded pieces carry counts no row backs).
- The Following tab is newest first, ignores `sort`, shows live pieces only, and a signed-out caller gets an empty page. Nobody can follow themselves, and blocking severs the follow, so blocked people never appear.
- `GET /feed` pages with `page` and `perPage` like `GET /content`, not a cursor. Following people count is its own small route because the page envelope cannot carry it; the empty state reads it to tell "you follow nobody" from "they have posted nothing".
- Per-viewer flags are on new routes only: `GET /content` and `GET /content/:id` keep their exact shape (the web and the protected suite pin it).
- Like, view and share on a piece that is not live answer 404; reading engagement is allowed to the owner for non-removed pieces.

## Verifier report

**Verdict: PASS.** No open defect. Verifier: a separate session; it wrote none of the code and changed none (backend `wmt/HOME-04` at 441ba12, base origin/main 1e6b807; the mobile commit 88e37c0 is docs only). Evidence is in `/home/user/lanes/h04v/` (logs) and was produced in own worktrees `h04v/main` and `h04v/branch` (removed after), own DBs `h04v_*` (dropped after), own mocks :4851 to :4853 and hubs :4854 (branch) and :4855 (origin/main). :4001 was not touched.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Mobile `npm run check` exit 0 (tsc clean, 28 suites, 485 tests, gates 123 files scanned, 0 fail; task check 205 tasks). Backend `tsc --noEmit` clean; eslint (no --fix) on the 7 touched source files and the new spec: 0 problems; `scripts/gates/run.py` main 656 files, branch 660 files (the 4 new), both 16 fail / 14 warn / 76 accepted and the output diff is only the file count (the 16 fails are main's, not this task's); `check_baseline.py` exit 0. `h04v/gates_*.txt`, `baseline_*.txt` |
| V2 Contract | passed | Own black-box run of 69 checks against the branch hub (script kept in the verifier scratchpad): 68 passed, 1 failed on my own wrong request body (block call used `wawuId`; DTO is `blockedWawuId`), rerun with the right body passed. Full list below. Builder's spec 22/22 passes (re-run). Revert proofs, in my own worktree, copy aside and restored (git status clean after): like counts without checking the row was created fails 3; owner views counted fails 1; Following filter removed fails 4. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` on branch: "all 244 required tests passed" (253 tests); same on origin/main. Full `npm run test:contract`, own DBs and mocks, both seeded, same env: main 3010 passed / 287 failed / 3 skipped (137 suites, 8 failed); branch 3032 passed / 287 failed / 3 skipped (138 suites, 8 failed). Suite results and the 287 failing test names are identical (diffed); no suite passes on main and fails on branch; branch has 22 more passes and one more passing suite. The builder's claim reproduces exactly. The 8 failing suites on both are environment: they sign in to a hard-coded :4001 mock whose keys are not this run's. `h04v/contract_*.log`, `fail_*.txt`, `suites_*.txt`, `v3_*.log` |
| V4 Field trace | passed | like: writer `POST /content/:id/like`, storage `ContentLike` row + `ContentPiece.likes`, readers `GET /content/:id` `likes`, `GET /feed` card `likes` and `likedByMe`, `GET /content/:id/engagement`: DB 2, content 2, card 2. view: `ContentView` + `views` read back in `GET /content/:id` (3 = 3). share: `ContentShare` rows read as `shares` on feed card and engagement (4 after a day rollover). save and follow flags read from `SavedItem` and `FollowRelationship` on the card. |
| V9 Live seam | passed | Against a real running hub (built `dist`, real JWT check against a mock WAWU ID, Postgres, registered users, not the in-process test app): the same 69 checks. |

**Capability checks, as written.**
- The Following tab shows only people the user follows: passed. A follows A: `GET /feed?scope=following` returns only A's live pieces, newest first, no pending, rejected or removed pieces; a user who follows nobody gets an empty page and count 0; unfollow empties it; fan who follows only A never sees B; after fan blocks B the follow is severed and B's pieces are gone from Following.
- Liking twice counts once: passed. Two sequential likes: 1. Ten parallel likes by one user: all 200, 1 row, counter 1. Ten parallel likes by each of two more users: counter 3. Ten parallel unlikes: all 200, counter 2. Unlike when not liked: 200, still 2. Twenty mixed parallel like and unlike by one user: counter equals row count (2 = 2).

**Other checks run.** `GET /feed` scopes for_you (default) and following with `likedByMe`, `savedByMe`, `followsCreator`, `shares` on each card and the flags are the caller's own (the other user sees false); bad scope 400. `GET /feed/following/count` 1 and 0. `GET /content?scope=following` 200, same shape. Auth: all 7 new routes 401 signed out. 404 for like, view, share on pending, rejected, removed and missing pieces; unlike on a missing piece 404; bad uuid 400; engagement on a pending piece is 404 for a stranger and 200 for its owner, 404 for a removed piece even for its owner. Views: first open counted (1), repeat same day not counted, ten parallel opens by one person +1, the owner's single and ten parallel opens add nothing, the same person after the UTC day rolls over (row moved back one day) counts again. Shares: once per person per day (twenty parallel by one person: 1 row), the owner's own share counts, counts again after the day rolls. No widening: `GET /content` (feed, mine, sort=recent, perPage 100) and `GET /content/:id` return byte-identical JSON from the branch hub and an origin/main hub on the same DB; main answers `scope=following` with 400, the branch with 200.

**Contract diff** (`npm run contract:build` on the branch, regenerated file equals the committed one; diffed against origin/main): 6 paths added (`/content/{id}/like`, `/view`, `/share`, `/engagement`, `/feed`, `/feed/following/count`), 6 schemas added, 0 paths removed, 0 operations removed or changed, 0 schemas changed; the only change to an existing operation is `GET /content` `scope` enum gaining `following`. Additive.

**Migration.** Fresh replay of all 86 migrations on an empty DB succeeded. The rollback in the migration header (`DROP TABLE "ContentLike","ContentView","ContentShare"`) ran: only those 3 tables went, the other 99 stayed; re-applying the migration restored them. `prisma migrate diff` DB vs schema shows only main's own `ContentPiece_specializations_idx` drift (same on main, not this task's). Note the rollback exists only as a comment in the migration file, not as a separate file. Coexistence with ME-05 (`20261003200000_profile_details`, branch bace01a): different names (`content_engagement` sorts before `profile_details`), ME-05 creates only `ProfileDetails`; both applied in that order on a fresh DB with no error, merged schema shows no drift beyond main's, and `git merge-tree` of the two branches has no conflict (schema.prisma edits are in different regions). They can coexist.

**NOT RUN.**
- Deployed hub and a real device (no deployment from this lane); same as the builder's NOT RUN.
- Concurrent like from two devices of one person over a real network (my parallel runs are from one machine over localhost).
- The 8 suites that sign in against :4001 (account, blocked-account, credits-state, kyc-submission, notification, privacy-settings, saved-item, plus the protected suite when run bare): they fail identically on main and branch under my mocks; the protected suite itself passes via `run.sh --fresh`. `follow-relationship` and `content-piece` suites pass on both.
- Mobile screens: none in this task (backend-endpoint; no V5, V6, V7).

**Process note.** Mid-run I applied the migration's rollback to the DB a first, unseeded full-suite run was using (my error, a wrong database). That run was discarded; the numbers above are from a clean seeded rerun after it, which gave the same 287 on both.

**Findings** (no defect).
1. unclear, low, Default (agent), owner may override: the builder report says a signed-out caller of `GET /content?scope=following` gets an empty page. In fact `GET /content` needs a token (401, same as main), so signed out is 401. The report line is inaccurate; behaviour is the existing one. No code change needed.
2. differs-for-recorded-reason, low, Default (agent), owner may override: Pieces by an account the viewer has blocked still appear in `for_you` and `GET /content`, and can be liked, viewed or shared. That is main's existing behaviour for `GET /content` (the content module has no block check), not added by this task. Following is clean because blocking severs the follow.
3. differs-for-recorded-reason, low, Default (agent), owner may override: counters are not walked back when an account is purged (G-86, recorded by the builder, same as `CommentLike`).
4. cosmetic, Default (agent), owner may override: the rollback SQL is a comment in `migration.sql` only; the task could carry it as a file if the owner wants one per migration.
5. cosmetic, Default (agent), owner may override: the same person liking, viewing and sharing a paid piece they have not bought is allowed (live is the only gate). Consistent with the builder's recorded default.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
