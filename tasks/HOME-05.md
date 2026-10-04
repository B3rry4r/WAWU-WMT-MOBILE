---
id: HOME-05
title: Feed: creator and professional cards, media details
owner: DEV
area: HOME
order: 81
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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

**Builder report, round 2 (verifier finding 1, frame ownership).** Fixed in `content-media.service.ts` and `dto/set-media.dto.ts`, reusing the chat attachment rule (`isChatKey` plus a `StorageObject` row of the caller's that is not abandoned) and `objectKeyFrom`, no new scheme. `PUT /content/:id/media`: each frame is resolved to an object key (a bare key, or a signed url of one) and must be `content/<preview|full>/<caller wawuId>/<uuid>.<ext>` with a `StorageObject` row owned by the caller, status pending or confirmed; anything else (`notaurl`, `ftp://`, another creator's key, `..`, a key never uploaded, an abandoned upload) is 400 and nothing is written. The key is stored, so reads sign it fresh. Read path: `forPieces` drops any frame whose key is not under the piece owner's own prefix, so a stored row can never make the server sign someone else's object. Default (agent), owner may override: pending uploads count (the reconcile job confirms them later; requiring confirmed would refuse a picture uploaded a minute ago), as chat does.
- Tests ("a creator cannot use a frame that is not their own upload", "a creator can use their own uploaded keys, and a signed url of their own upload", "a user is never given a signed link to a frame the piece owner does not own"): spec 25/25 with HOME-04's 22 (47 together), lint-clean. Revert proofs: prefix check removed fails 2, StorageObject lookup removed fails 1, read-path filter removed fails 2. The `..` guard is also caught by the key grammar, so removing it alone fails nothing (belt and braces).
- `tsc` clean; `run.sh --fresh` 244/244; `contract:build`: 0 paths removed, 0 operations changed, only the `SetMediaDto` schema changed; mobile `npm run check` exit 0.

## Verifier report

**Verdict: FAIL (one open defect, finding 1). Status set back to `building`.** Verifier: separate session, 4 Oct 2026. Backend judged on its own commit 8891dea only (`git log wmt/HOME-04..HEAD`, base 441ba12 = wmt/HOME-04). Own worktrees `lanes/h05v/{branch,base}`, own DBs `h05v_*`, own mocks :4781 to :4784 and hubs :4793/:4794; :4001 untouched. Nothing was fixed; mutation checks used copy-aside and restore with `cp`, tree clean afterwards.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (backend: tsc clean, eslint clean on touched files, `check_baseline` exit 0; gates 16 fail identical to base, warns 14 to 17 = the 3 new PROVISIONAL rows, 666 vs 660 files). Mobile `npm run check` exit 0 (123 files, 0 findings, 205 tasks) | `lanes/h05v/gates_{base,branch}.txt`, `lanes/h05v/mobile_check.log` |
| V2 Contract | failed on finding 1; otherwise passed. New spec 22/22, a user can ... wording. Fails on revert: no interleave 6 fail, locked frames leaked 1, owner check removed 1, blocks ignored 3. Own live probe against a running hub: 78 checks, 2 failed (both finding 1) | `lanes/h05v/probe.py`, `probe_branch.out`, `p2.py` |
| V3 Regression | passed. `run.sh --fresh HEAD`: 244/244 required (253 total). Full `test:contract` branch vs HOME-04 base, same env: failing suites 43 and 43, identical; every failing test on the branch also fails on base (0 new, 0 pass-on-base-fail-on-branch). Counts: branch 411 failed / 2930 passed, base 426 / 2893 (see finding 2). Contract diff (`contract:build`, committed file equals regenerated): +3 operations (`GET /feed/entries`, `GET` and `PUT /content/{id}/media`), 0 removed, 0 changed, +8 schemas, `FeedItem` (HOME-04's, unmerged) gains `creator`, `media`. `GET /content` and 12 `GET /content/:id` byte-identical branch vs base; `/feed` items equal base after stripping `creator` and `media`, envelope equal | `v3_branch.log`, `contract_{branch,base}.log`, `fail_*.txt`, `cmp.py` |
| V4 Field trace | passed. `durationLabel` and `pageCount`: sole writer is `PUT /content/:id/media` (grep: admin only reads), readers: feed card, creator-card strip, GET media, same on both sides (owner writes, other user reads). Frames: owner PUT, buyer/owner/non-buyer GET | grep, probe |
| V9 Live seam | passed against a local hub with the mock WAWU ID (real register and JWT through the real guard, no injected token; signed out is 401 on all four routes). NOT RUN against a deployed hub or real WAWU ID | `probe_branch.out` |

**Checked and fine.** Cards: creator after the 5th piece, professional after the 10th, alternating (also perPage 5); none on Following; no card repeats across 7 pages; creator order by followers, professional by reviews; followed, blocked-by-viewer, blocked-viewer and self excluded; DM-off and blocked professionals excluded; no trust score key. Media: frames in PUT order, 1 to 20 (0 and 21 refused, failed PUTs leave the old set), locked set shows frame 1 (preview asset) plus url-null placeholders and no locked frame URL appears in media, feed, entries or `/content/:id`; buyer and owner see all; non-owner creator 403, non-creator 403, empty body 400, unknown field 400; durationLabel `4:12`, `1:20:05`, `0:59` ok, `1h 20m`, `4:75`, `4`, number refused; pageCount 1 and 5000 ok, 0, 5001, -3, 2.5, "12" refused; wrong-type fields 400; unknown id 404, removed 404, pending 404 to others and 200 to owner; non-uuid 400; frames cascade on piece delete. Migration `20261004100000_content_frames`: applies on a full replay (86 migrations), rollback (`DROP TABLE` plus delete of the migrations row) then redeploy clean; applies beside `20261003200000_content_engagement` (same tree) and `20261003200000_profile_details` (ME-05, applied by hand onto the full tree, no conflict, different tables).

**Findings.**
1. `defect` (security, low likelihood, medium impact): `PUT /content/:id/media` accepts any string `IsUrl({require_tld:false})` passes: `notaurl`, `localhost`, `ftp://x.y/a.jpg`, and storage-key shapes such as `content/other-user/full.mp4`. `ContentMediaService.forPieces` returns `StorageService.freshUrlFor(url)`, which turns any key it can extract into a freshly signed read URL. A creator who knows another creator's object key could expose that paid object through their own free frame. The signing was not exercised locally (no storage client configured), so the exploit is read from code (`storage.service.ts` `objectKeyFrom`/`freshUrlFor`), not demonstrated. Unblocks: require `https` and that the key belongs to the caller's own confirmed upload, or refuse non-https and non-own-upload urls.
2. `unclear` (not a defect): the builder's "287 identical failures" does not reproduce as a count here (411 branch, 426 base, unseeded DBs on a loaded host; base lost 15 extra timing-sensitive wallet tests). The set claim holds: branch failures are a subset of base failures, failing suites identical.
3. `Default (agent), owner may override`: `durationLabel` pattern refuses `90:00` (minutes above 59 without hours); players write that as `1:30:00`. Cosmetic.
4. `Default (agent), owner may override`: `creatorCards` drops a candidate with neither name nor handle after slot choice, leaving that slot empty instead of taking the next candidate. Unreachable with a handle present.
5. `Default (agent), owner may override`: `prisma migrate diff` shows an existing drift (index on `ContentPiece.specializations`) on HOME-04's base as well; not caused by this branch.
6. `Default (agent), owner may override`: three new PROVISIONAL rows (FEED-CARD-EVERY, PDF-MAX-PAGES, PHOTO-SET-MAX-FRAMES) are warns with owner=YOU, as the builder said.

**NOT RUN.** Deployed hub and real device; real WAWU ID login; real storage signing (finding 1); V5 to V8, V10 (not in `passes`).

## Verifier report (round 2)

**Verdict: PASS. Defect 1 is closed; no open defects. Status `review`.** Verifier: fresh session, 4 Oct 2026, focused re-verification. Backend at 8da711f (d354d77 round-2 fix merged with origin/main 9a370c0). Own worktrees `lanes/h05v2/{branch,base}` (base = 9a370c0, origin/main with HOME-04, per the lead's note), DBs `h05w_*`, mocks :4811 to :4814, hub :4821; :4001 untouched, only my own processes stopped. Nothing fixed; reverts by copy-aside and restore, tree clean after.

| Pass | Result | Evidence |
|------|--------|----------|
| Defect 1 attack (black-box, running hub, real JWT through the guard) | passed: 0 failures | `lanes/h05v2/attack.py`, `attack2.py` |
| V3 protected routes `run.sh --fresh 8da711f` | passed 244/244 required (253 total) | `lanes/h05v2/v3.log` |
| Contract | passed: `contract:build` exit 0, committed file equals regenerated; vs 9a370c0: +2 paths, 0 removed, 0 operations changed, +8 schemas, `FeedItem` (HOME-04's, widened with `creator`, `media`); round 2 changed only `SetMediaDto` (`format: uri` dropped from `frames` items) | `cb.log` |
| New spec | passed 25/25 | jest |
| Revert proofs | see finding 2 | |
| tsc | clean | |
| Full `test:contract`, clean env, one run at a time | branch 325 failed / 3085 passed / 44 failing suites; base 329 / 3056 / 44 (3413 vs 3388 tests = the 25 new). By test name: 0 fail on branch that pass or are absent on base; 4 fail on base only (timing); failing suites identical | `full_br.json`, `full_ba.json` |
| Mobile `npm run check` | exit 0 (205 tasks) | log |

**Defect 1 attack (what was tried).** `PUT /content/:id/media` returned 400 with the stored frames unchanged for every one of: `notaurl`, empty, space, `ftp://`, `javascript:`, `data:`, another creator's key (bare, as a signed url, inside another host's query, `http://`), `../` traversal (bare, leading, absolute, own-prefix-to-other, in a url), `%2e%2e`, `%66ull`, `%2f`, double-encoded `%252e`, backslashes, `//` (bare and url), leading and trailing space, trailing newline, NUL and tab, unicode lookalikes (U+2215, Cyrillic c, fullwidth g), uppercase and mixed-case folder, never-uploaded key, abandoned StorageObject, owner segment = caller but row belongs to the other creator, owner segment = other but row is the caller's, wrong folder, extra segment, no or long extension, `?x=../`, `%` and `_` wildcards, non-string members (number, null, object, nested array), `frames` as a string, invalid UTF-8, a random uuid, and a mix of own and foreign (no partial write). Valid own keys, confirmed and pending, return 200; a signed url of an own key returns 200 and stores the bare key. A foreign host embedding an own key is accepted but stores only the own key (harmless, finding 3). A second creator PUTting onto the piece is 403. After all attacks every stored frame is the caller's own key.
**Read path.** Bad rows inserted directly (another creator's key, `..` key, `notaurl`, a signed url of another's key, a traversal) on a free and a paid set: read as buyer (a real completed Purchase), non-buyer, owner and a third user, `GET /content/:id/media`, `GET /content/:id`, `/feed`, `/feed/entries` never return any of them; the buyer and owner see only the own frames; the non-buyer sees frame 1 (preview) and a url-null locked placeholder.

**Findings.**
1. No open defect. Defect 1 closed. Signing itself (real storage client) still NOT RUN: no storage configured locally, so the server returns the stored key unsigned; the guarantee shown is that no foreign key reaches `freshUrlFor`.
2. `unclear`, doc accuracy, not a defect: the builder says "prefix check removed fails 2". Removing the whole key-grammar check at write time fails 0 (the StorageObject ownership lookup also refuses it); removing only the owner segment test (`parts[2] === wawuId`) fails 2, which is what the claim matches. StorageObject lookup removed fails 1 and read-path filter removed fails 2, as stated. The `..`/`//` guard alone fails 0, as the builder said. Layers overlap by design.
3. `Default (agent), owner may override`: a url on any host that embeds the caller's own key is accepted and stored as the bare key (the key is what is validated and stored, so no foreign host is ever kept).
4. `Default (agent), owner may override`: when a bad row is filtered on read, remaining frames keep their stored position numbers (1 and 6 in my probe), so positions can have gaps. Only reachable with bad data written outside the PUT.
5. `Default (agent), owner may override`: round-1 findings 3 to 6 stand unchanged (duration `90:00`, empty card slot, existing migration drift, three PROVISIONAL warns). The `format: uri` removal in `SetMediaDto` is a loosening on a new schema, not on a live one.

**NOT RUN.** Real storage signing; deployed hub and device; real WAWU ID login; V5 to V8, V10 (not in `passes`).

## Lead merge note (4 Oct 2026)

Merged after verifier round 2 found no open defect (Developer 1's task). The lead reworded two comments that named the protected route registry file (the protected routes CI refuses that; comment-only). Backend PR #58 (e6bd701); mobile contract synced.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
