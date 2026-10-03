---
id: HOME-04
title: Feed: following, likes, views, shares
owner: DEV
area: HOME
order: 78
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
