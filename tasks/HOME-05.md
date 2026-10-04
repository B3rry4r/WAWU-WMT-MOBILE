---
id: HOME-05
title: Feed: creator and professional cards, media details
owner: DEV
area: HOME
order: 81
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-05 · Feed: creator and professional cards, media details

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

The feed mixes in creator and professional cards and returns photo-set frames, durations and page counts (H3, H4, H9, H10). Additive only.

## Scope

Creator and professional cards interleaved in the feed; photo-set frames, durations and page counts.

## Capability checks

- [ ] The feed returns a creator card among content as H9 shows.
- [ ] A photo set returns its frames in order.

## Builder report

Backend `wmt/HOME-05` (wawu-backend, worktree lanes/h05/wawu-backend), not committed; the lead commits. **Built on `wmt/HOME-04`** (commit 441ba12, fast-forwarded, no new commit): the task needs `GET /feed` (not on main) and G-85 asks for a `creator` object on its card. Merge HOME-04 first; this diff is only HOME-05 on top. No HOME-04 code is copied.

**Built (all additive).** `GET /feed/entries` (the For you feed with a creator card after every 5th piece and a professional card after every 10th, alternating; Following has none). `GET /feed` cards gain `creator` (name, handle, avatar, both ticks; resolves G-85) and `media`. `GET` and `PUT /content/:id/media` (frames, `durationLabel`, `pageCount`; owner writes, `PUT` is the only writer of the three). Table `ContentFrame` (migration `20261004100000_content_frames`). Files: `src/content-piece/{feed-cards,feed-entries,content-media}.service.ts`, `content-media.controller.ts`, `dto/set-media.dto.ts`, module and engagement edits, spec `tests/feed-cards.contract.spec.ts`.

**Capability checks.** (1) Creator card among content as H9 shows: spec "a user finds a creator card after the fifth piece" (name, headline, followers, posts, rating, works strip with price, lock, duration, pages, known followers); revert proof: interleave removed fails 6. Professional card as H10 (rating, reviews, `dmPrice`, `dmResponseHours`, services, no trust score key): "next page" test; revert proofs: blocks ignored fails 3, followed not excluded fails 1. (2) A photo set returns frames in order: "a creator can set a photo set and a user gets its frames in order", "sends the frames in a new order"; revert proof: ordering by url fails 2; locked frames leaking fails 1; owner check removed fails 1. Also proven: frame 1 only for a locked set, all for the buyer and owner, wrong-type and bad-format 400s, no card repeats across 8 pages.

**What ran.** New spec 22/22 (own DB `h05_contract`, own mock :4751; :4001 not touched). `tsc --noEmit` clean; eslint (no --fix) clean on every touched file and the spec. Gates: main 656 files 16 fail 14 warn 76 accepted; branch 666 files 16 fail 17 warn 76 accepted (the 3 new warns are PROVISIONAL below; the 4 HOME-04 files and mine are the file count); `check_baseline.py` exit 0. `run.sh --fresh` (working tree, own DBs, `CORS_ORIGIN` empty and 32-char admin secrets, which the suite needs): branch 244/244, origin/main 244/244. Full `npm run test:contract`, same env, split: main 3010 passed, 287 failed, 3 skipped (3300 tests, 137 suites, 8 failed); branch 3054 passed, 287 failed, 3 skipped (3344 tests, 139 suites, 8 failed). The 287 failing test names are identical in both runs (diffed): 287 also on main, 0 new. Mobile `npm run check` exit 0 (below). `npm run contract:build`: 2 paths added, 0 removed, 0 operations changed, 8 schemas added, `FeedItem` (HOME-04's, unmerged) widened.

**NOT RUN.** A deployed hub and a real device (no deployment from this lane; unblocked by the lead running the app against the merged backend). Photo-set upload from the app: ME-04 has to call `PUT /content/:id/media` (SHARED-CHANGES HOME-05 F1). Any mobile screen: none in this task.

**Gaps and requests.** G-100 (place under the name, "near you"), G-101 ("Online now"; reply time is G-76), G-102 ("12 pages free"), G-103 (creator rating is a derivation). SHARED-CHANGES: HOME-05 #1 (schema, migration, contract), #2 (mobile contract regeneration after HOME-04 and HOME-05 merge), F1 (ME-04 calls the media route). G-85 (HOME-04's row, not on this branch) is resolved here: close it when both merge.

**Defaults (agent), owner may override.**
- Cards: one after every 5 pieces (`FEED_CARD_EVERY`, PROVISIONAL), creator then professional alternately, chosen by global slot so a card never repeats across pages. `GET /feed` itself stays pure content; the mixed list is a new route so the app's choice is explicit.
- Creator candidates: creator account with a live piece, not the viewer, not followed, not blocked either way; ordered by followers then id. Professional candidates: approved, listed, paid messages on with a price, not the viewer, not blocked; ordered by reviews, rating, id; one listing per person. A candidate with no name is skipped, not shown as an id.
- Creator card: `rating` is the mean of piece ratings over 5 (G-103); works strip is the 4 newest live pieces; "people you know" is up to 3 people the viewer follows who follow the creator, plus the count. Trust Score is not served (R-18). The refund promise line is the app's, drawn from `dmResponseHours`.
- Frames: image (photo set) pieces only, 1 to 20 (`PHOTO-SET-MAX-FRAMES`, PROVISIONAL), replaced as a whole list, position 1-based. A viewer who has not unlocked a paid set sees the count, frame 1 (the public preview asset) and locked placeholders with no url.
- `durationLabel` is written as `4:12` or `1:20:05` (video, audio, course only); `pageCount` 1 to 5000 (`PDF-MAX-PAGES`, PROVISIONAL), PDFs only. Seeded rows hold older free-text lengths ("1h 20m") and are served as stored.
- A piece's owner may set media on a pending or live piece, not a removed one; 403 for anyone else.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
