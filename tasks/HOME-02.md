---
id: HOME-02
title: For you feed: video, photo set, book, locked, audio
owner: YOU
area: HOME
order: 85
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [HOME-04, HOME-05, HOME-06, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [H2, H3, H4, H5, H6]
---
# HOME-02 · For you feed: video, photo set, book, locked, audio

Taken over by the lead's agents on 6 Oct 2026 (unstarted by DEV).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H2 H3 H4 H5 H6` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for H2, H3, H4, H5, H6, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H2 · For you · video**: Full-bleed dark video post in the For you feed with a right rail (avatar, 12.4K, 340, 1.1K, ₦ Tip), tap-to-pause and a scrubber above the caption.
- **H3 · Photo set**: Photo-set post ('Approved F1'): sideways frames with the next frame peeking, 1/6 counter, and a paid offer bar 'Golden Hour presets · Template · 12 presets ₦2,500'.
- **H4 · PDF / book**: PDF post ('Approved F2'): cover, '12 pages free', read in place, offer bar 'Read the full playbook · Yours forever · Pay from wallet ₦3,000'.
- **H5 · Locked**: Locked video ('Approved F3, with Subscribe removed'): frame frosts when the preview ends, 'Preview ended' message, offer bar 'Unlock the full video · 18 min · Pay from wallet ₦2,500'.
- **H6 · Audio · Following**: Audio post ('Approved F6') with a scrubbable waveform; author tagged 'Following'.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- H2: ₦ Tip (opens H26): added by HOME-13
- H2: the caption (opens H19): added by HOME-03
- H2: the avatar (opens M5): added by ME-02
- H4: the offer bar (H3, H4, H5) (opens H14): added by HOME-12

## Capability checks

- [ ] **H2**: a user can tap to pause/play; scrub; swipe up to the next post.
- [ ] **H3**: a user can swipe sideways through frames; swipe up.
- [ ] **H4**: a user can read the free pages in place.
- [ ] **H5**: a user sees the frame frost when the preview ends; swipe on.
- [ ] **H6**: a user can play/pause; scrub waveform; swipe on.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **H2**: partial. Missing: Feed list exists (trending sort). Missing: content like/unlike route and liked-by-me state, share counter, view counting, mixed card kinds; no streaming/transcoding metadata beyond durationLabel.
- **H3**: partial. Missing: No multi-asset (photo set) storage on ContentPiece; no link from a free post to a separate paid offer piece (offer bar).
- **H4**: partial. Missing: No free-page-range field (e.g. freePages) and no paged in-place reader asset; unlock is Flutterwave not wallet.
- **H5**: partial. Missing: Locked state and preview asset exist; preview end time not modelled; unlock path is Flutterwave hosted/inline charge not wallet+PIN.
- **H6**: partial. Missing: No waveform data; follow state per item needs batch lookup (only single GET .../follow status).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H2: rail counts 12.4K / 340 / 1.1K
- H2: Video · 1:50
- H3: Golden Hour presets ₦2,500
- H3: Photo set · 6
- H4: ₦3,000
- H4: 84 pages · 12 pages free
- H4: 'Yours forever'
- H5: ₦2,500
- H5: Locked · 18 min
- H5: 'How I built a ₦2M a month agency from Enugu'
- H6: Audio · 12 min

## Designer notes (⚠, unresolved)

- None.

## Builder report

Built by the lead's agents, 6 Oct 2026, mobile only (no backend change: HOME-04, HOME-05 and HOME-06 serve every route used). Branch `wmt/HOME-02` from origin/main 8484195.

**Files.** New `src/features/feed/`: `FeedScreen.tsx` (tabs, pager, loading, empty, error), `PostFrame.tsx` and `parts.tsx` (scrim, rail, pill, byline, offer bar, scrubber), `VideoPost.tsx` (H2, H5), `PhotoSetPost.tsx` (H3), `PdfPost.tsx` (H4), `AudioPost.tsx` (H6), `engagement.ts` (like, save, follow, one counted view), `api.ts` (`GET /feed/entries`, `/content/{id}/detail`, `/users/me`, `/feed/following/count`, like, save, follow, view), `model.ts` (every rule, pure), `look.ts` (tokens and the canvas's sizes), `player/` (web `<video>`/`<audio>`; phone: none yet), `reader/` (web: the browser's PDF view; phone: the phone's viewer), tests `__tests__/model.test.ts` (17), `__tests__/FeedScreen.test.tsx` (14). Route `src/app/(tabs)/feed.tsx` (`/feed`, inside the tabs so the bottom bar shows; nothing links to it until HOME-01, SHARED-CHANGES HOME-02 R1). Also `BACKEND_GAPS.md` G-215 to G-220, `SHARED-CHANGES.md` HOME-02 #1 to #4, F1 to F3 and R1, `docs/LOG.md`.

**Capability checks** (web export on :8191, opened at `/feed` after signing in, local Hub :5091 at backend origin/main a94f338, DB `h02_hub_test`, stand-in WAWU ID :5092, signed in through the app's own sign-in screen; Playwright 390 px, light and dark; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/tools/drive.py`, call log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/drive-log.jsonl`):
- H2 tap to pause/play, scrub, swipe up: the scrubber read 0:04, then paused 0:05 and still 0:05 1.5 s later, a click at 70% of the track 1:03, tap to play 1:05; a wheel swipe brings the next post. Shots `H2-playing`, `H2-paused` (play mark shown), `H2-scrubbed`.
- H3 sideways frames, swipe up: counter 1 / 6 then 2 / 6 after a sideways swipe, the next frame peeks at the right. A paid set shows its locked frames (no url from the Hub) frosted with a lock, and its offer bar. Shots `H3-frame1`, `H3-frame2`, `H3-paid-set`, `H3-paid-set-locked-frame`.
- H4 read the free pages in place: "12 pages free" and its stretch of the bar come from `GET /content/{id}/detail` (freePreview.pages); pressing the book opens the 12-page preview file over the feed (`H4`, `H4-reading`). Phone build: opens the phone's PDF viewer (NOT RUN, see below).
- H5 frame frosts when the preview ends, swipe on: the 8 s public preview plays (`H5-preview-playing`), then frosts with "Preview ended" and "The full 18-minute video is one tap away." (`H5-preview-ended`). The offer bar shows the lock and ₦2,500 from the Hub and starts nothing (jest: no unlock, pay or money call; it has no press handler).
- H6 play/pause, scrub waveform, swipe on: the big button reads Pause, then Play after a press; a click at the waveform's middle fills 22 of 44 bars; reached by swiping on the Following tab, "· Following" beside the name, no follow badge (`H6-playing`, `H6-paused`, `H6-scrubbed`, `H6-following`, `following-first`).
- Every value from the API or the user: names (WAWU ID lookup), ticks, captions, counts, lengths, page and frame counts, prices (naira converted to kobo once, G-219), free pages. Not served and left out: the saves count (G-215), H3's linked offer (G-216), waveform peaks on a phone (G-217), cover pictures (G-218), "Yours forever" and "2026 edition" (G-220).
- Loading, empty, error by real cause: `loading` (the pass-through held every Hub answer 6 s), `error` (Hub connection dropped) then `error-retried` (Try again with the Hub back), `empty-for-you` (an account that blocked every creator, through `POST /settings/privacy/blocked`), `empty-following` (an account that follows nobody, `GET /feed/following/count` 0).
- V9: real sign-in (no injected token); like and save pressed in the app (`H2-liked-saved`); read back through the Hub: `likes 12401, likedByMe true, savedByMe true, views 1` (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/v9-readback.txt`); rows `ContentLike` 1, `SavedItem` 1.
- Revert proofs: follow-self check removed fails 1 test; offer bar shown for unlocked pieces fails 2.

Screenshots (all `-light.png` and `-dark.png`) in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/shots/`: H2-playing, H2-paused, H2-scrubbed, H2-liked-saved (dark), H3-frame1, H3-frame2, H3-paid-set, H3-paid-set-locked-frame, H4, H4-reading, H5-preview-playing, H5-preview-ended, H6-playing, H6-paused, H6-scrubbed, following-first, H6-following, loading, error, error-retried, empty-for-you, empty-following. Seed (scratch, not committed): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/tools/seed.py`, `gen_media.py`, `gen_pdf.py`.

**Counts.** Before: typecheck and lint clean, jest 754 tests (1 failed: the known A26 OpenWalletScreen timeout under load), gates 195 files 0 findings. After (`npm run check`, exit 0): typecheck and lint clean, jest 785 tests 785 passed (31 new), gates 215 files 0 findings, task check 207 tasks. Merged origin/main 6df916d (contract source 872cf45; the feed's types are unchanged by it) and ran `npm run check` again: exit 0, the same counts. The seam run was against backend a94f338, before that contract moved.

**Defaults (agent), owner may override.**
- The feed is its own route `/feed` inside the tabs, opening on For you. It is not put on the Home tab: H1 (Today, HOME-01) is Home's hub and is listed after this task, so HOME-01 wires the Following and For you tabs to it as drawn (R-27, lead default; route-graph row HOME-02 R1). Putting it on the Home tab now would also replace the Home placeholder that seven shared shell and sign-in tests read. No tab is lit on `/feed` until then. Today, search, Create (+), ₦ Tip, the caption, avatar and offer-bar presses are not drawn or not pressable until their tasks add them (R-27, F2). The rail keeps Tip's place so it sits where the canvas draws it.
- Like, save and follow (+) on the rail work in place (HOME-04 routes; follow never offered on your own post); a view is counted once when a post fills the screen.
- Courses, templates and the creator and professional cards (HOME-07) are skipped; a page holding only those reads on.
- The offer bar offers the locked piece itself: "Unlock the full video / audio", "Read the full PDF", "Unlock the full set", then the length, pages or photo count and "Pay from wallet". Copy the canvas does not draw: the empty and error words, the reader's title bar.
- Lengths under 10 minutes are a clock ("1:50"); from 10 minutes up they are whole minutes, rounded to the NEAREST minute with halves up ("18 min", 45:30 is "46 min", 1:50:00 is "110 min", and "The full 46-minute video" says the same figure). Skip buttons move 15 s. The waveform is the file's loudness in 44 bars (web).
- The video plays muted when the browser refuses sound before a first touch.
- The feed is drawn the same in both themes (the artboards' two phones are identical); the bottom bar keeps its theme colours until SHARED-CHANGES #4.

**NOT RUN.**
- Phone playback, scrubbing and in-place PDF (H2, H5, H6, H4 on Android): no player is installed. Unblocked by SHARED-CHANGES HOME-02 #2 (`expo-video`, `expo-audio`, `react-native-webview` in a development build), then the phone player files.
- V10 on a device: unblocked when the backend with HOME-04/05/06 is on the droplet and a tester build carries this branch.
- Picture match (V5) is the verifier's; known differences: Today tab, search, Create, Tip absent (later tasks); avatar hues are picked per person; the bar under the feed is not see-through (SHARED-CHANGES #4); H3 offers the set itself, not a linked template (G-216); the H4 cover purple is `accentDeep` (SHARED-CHANGES #1).

## Builder round 2

Resumed by the lead's agents, 7 Oct 2026, from the verifier's report (D1, D2, test gaps M7, M12, M18, U2). Merged mobile origin/main `642a060` (contract source 84eda6d). Mobile only; no backend change. The merge moved this task's gap rows: ME-10 took G-201 to G-207 on main and the highest on any branch is G-214 (AUTH-07), so HOME-02's gaps are now **G-215 to G-220** (were G-203 to G-208) in BACKEND_GAPS, SHARED-CHANGES HOME-02 #3, the LOG line and the code comments that cite them.

**D1 closed (offer bar clips).** `OfferBar` (`parts.tsx`) no longer has `numberOfLines` or a fixed height: the bar is `minHeight 56` with 8 above and below, the title and subtitle wrap, and the price chip is `flexShrink: 0` so it stays whole. "Pay from wallet" is written with non-breaking spaces (`offerFor` in `model.ts`), so the subtitle breaks before "Pay", never inside it (the canvas's H4 bar wraps the subtitle the same way). Under 360 wide the bar goes compact (smaller icon, tighter gaps, 13 pt price) so the words get more room. Measured in Chromium against the local Hub, every offer text sits inside the bar, none is clipped (`scrollWidth`/`scrollHeight`), "Pay from wallet" is one whole line, the price sits inside its chip, at 320 x 568, 360 x 640, 390 x 845 and 430 x 932, light and dark: H3 paid at ₦1,999, H4 at ₦4,750 and ₦12,000, H5 at ₦12,000 ("46 min") and ₦250,000 ("110 min"): 40 of 40 shots pass (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02r2/run2.log`, `results.json`).

**D2 closed (small phones).** H4's book was at a fixed top (128). `PostFrame` now measures the words at the foot (`onLayout`) and hands the post's middle the room between the tabs and the words (`MiddleSpace`, `middleTop` 100, `middleGap` 12). `bookPlacement` (`model.ts`, pure) keeps the canvas place and full size when the book fits, else scales it down (never past the rail: `bookReachRight` 126, `railClear` 68) and slides it into the room; the book's 4 degree back page is part of its extent (`bookExtentH` 310). Same for H5's "Preview ended" block (`roomPlacement`, measured height). Two more collisions found while measuring at 320 x 568 and fixed in the same way: H5's body words ran under the rail (`endedBodyWidth`: stops 64 from the middle short of the rail, so the canvas phone keeps the canvas's 260), and H3's frame counter sat on the rail's avatar when a short phone lifts the rail to it (`counterRight`: steps left of the rail only when the measured rail top reaches it). Measured at the four sizes, both themes: the book box (with its back page) hits neither the pill, the "N pages free" bar nor the offer bar, ends left of the rail, and starts under the tabs; the H5 block hits neither the pill nor the bar: no overlap in any of 40 shots. Smallest book scale at 320 x 568 is shown in `sheet-320x568-*.png`.

**Tests (all in `src/features/feed/__tests__`), each shown failing on its mutant and passing on the fix** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02r2/mutate.out`, `mutate-d2.out`; the mutation runs the whole feed suite, 43 tests):
- M7 (view counted once, only when the post fills the screen): `FeedScreen.test.tsx` "counts a view only for the post that fills the screen, and only once (M7)": post B is drawn but not on screen (no view call for it), scrolling to it counts it, going back to A and on to B again counts neither a second time. Mutants: `!active` check removed (1 failed), `counted.current = true` removed (1 failed), both on that test. Fixed: 43 passed.
- M12 (a locked piece never plays `fullAssetUrl`): `model.test.ts` "a locked piece never plays the full file, even when a full url is sent with it (M12)" and `VideoPost.test.tsx` "plays only its public preview, even when the Hub sends a full file with it (M12)" (the post's player is given the preview, never the full url; a watchable video is given the full file). Mutant `playableUrl` ignoring the lock: 2 failed. Fixed: passed.
- M18 (a locked video frosts at its preview end): the player is the browser's `<video>`, which jest cannot run, so `VideoPost.test.tsx` stands in a player with the same props (`player/index.web.tsx`'s `VideoSurfaceProps`) and ends the file through the `onEnded` the post gave it: before the end `frosted` is false, "Preview ended" is absent and the scrubber is there; after it `frosted` is true, "Preview ended" and "The full 18-minute video is one tap away." show, the scrubber is gone and playback is off; a free video just stops (no frost, no message). Mutants `previewEnded = false` and `onEnded` doing nothing: 1 failed each. Fixed: passed.
- D2 (pure placement): `bookPlacement` on the canvas phone stays at the canvas place, full size; from 320 x 568 to 430 x 932 and for four word heights the drawn book (with back page) stays inside the room and left of the rail; with no room it shrinks to nothing. `roomPlacement` for H5; `endedBodyWidth` and `counterRight`. Mutants: book scale ignoring the room (3 failed), book not slid into the room (2), H5 words ignoring the rail (1), counter never stepping off the rail (1). Fixed: passed. The wrap of the offer bar itself is real layout, so its proof is the Chromium measurement above, not jest.

**U2 (rounding rule, stated).** A length under 10 minutes is a clock ("1:50", "9:59"). From 10 minutes up it is whole minutes, rounded to the NEAREST minute with halves up: 18:00 is "18 min", 45:30 is "46 min", 45:29 is "45 min", 1:50:00 is "110 min", and "The full 46-minute video is one tap away" uses the same figure. The rule is in the Defaults list above. Default (agent), owner may override (round down would read "45 min" for 45:30).

**Proof.** Web export of this branch (head after the fixes) on :8341, local Hub on :5241 at backend origin/main `84eda6d` (fresh migrated database `h02r2_hub_test`, stand-in WAWU ID :5242, signed in through the app's own sign-in screen), Playwright Chromium at 320 x 568, 360 x 640, 390 x 845, 430 x 932, light and dark. Shots in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02r2/shots/` as `<case>-<w>x<h>-<theme>.png` (cases `H3-1999`, `H4-4750`, `H4-12000`, `H5-12000`, `H5-250000`: 40 files) and per-size contact sheets `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02r2/sheet-<w>x<h>-<theme>.png` (8 files). Driver and seed (scratch, not committed): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02r2/tools/shoot.py`, `seed.py`, `mutate.py`, `mutate-d2.py`.

**Counts.** `npm run check` exit 0: typecheck and lint clean, jest 46 suites, 797 tests passed (the feed's own tests 43, were 31), gates 216 files 0 findings, task check 207 tasks. No timeout under load this run (the known A26 one did not occur).

**NOT RUN.** Phone playback, scrub, in-place PDF and the real preview end on a phone (no player installed): unblocked by SHARED-CHANGES HOME-02 #2 applied (`expo-video`, `expo-audio`, `react-native-webview` in a development build). The offer bar's wrap and the book placement were measured on the web export only; on a phone they use the same React Native layout, but no phone build was shot (unblocked by a development build). iOS and tablets not shot. Sizes between 320 and 430 wide other than the four were not shot (the unit test sweeps six sizes).

## Verifier report

Verifier session, 6 Oct 2026, independent of the builder. Head `b4b32bd` (it contains origin/main `6df916d`, so "branch" and "merged with main" are the same tree). Backend: origin/main `872cf45`, built in a detached worktree on a fresh migrated and `db:seed`ed database `vh02_test`, stand-in WAWU ID :5172, Hub :5171, web export :8271 (a small pass-through server maps the stand-in's login body to the real WAWU ID's `data` envelope and serves seeded media; the Hub and the app are untouched). Chromium at 390 x 845 (the artboard's size), light and dark. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vh02/` (`shots/`, `pairs/` design-beside-built, `design/`, `tools/`, `check-branch2.log`, `mutate.out`, `drive-log.jsonl`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 code | passed | `npm run check` exit 0 on the head (`check-branch2.log`): typecheck and lint clean, jest 785 of 785 (45 suites), gates 215 files scanned, 0 findings, 0 baseline entries, tasks 207. A first run under load failed only the known A26 OpenWalletScreen timeout; rerun on a quiet machine it passed. Scope: diff touches only `src/features/feed`, `src/app/(tabs)/feed.tsx`, tests and task docs (no `_layout.tsx`, no `src/components`, `src/api`, `package.json`). No hex, em-dash, or `Flutterwave` in user copy; two `style={{ width, height }}` runtime-size objects in `PhotoSetPost.tsx` and `FeedScreen.tsx` (gate passes, not a literal). Money: the offer bar is a plain `View` with no press handler; jest asserts no unlock, pay or money call; mutant M17 (adding a wallet-pay press) is caught. Price is `ContentPiece.price` whole naira (Hub's unlock charges `amount: content.price` in naira), converted once by `nairaToKobo` (`Math.round(n * 100)`): the screen showed 1,999 / 4,750 / 12,000 from the Hub for pieces priced 1999 / 4750 / 12000. |
| V4 data trace | passed (one note) | Rail likes and comments, name, tick, caption, pill lengths and counts, frame counts, page counts, prices and "N pages free" were each changed in the seed to values that are not the canvas's (12,345, 7, 987, 41, 1.2M, 31 pages, 5 free, 3:07, 45:30, 4 photos, 1999, 4750, 12000) and the screen followed every one. "5 pages free" comes from `GET /content/{id}/detail`; the filled share was 5/31. Saves count, Tip, the linked template offer, "Yours forever", "2026 edition", covers and waveform peaks on a phone are absent and filed (G-215 to G-220); I confirmed against the contract that `FeedItem`, `MediaDetails` and the schema carry no saves count, cover or peaks. Note: the pill's length is the piece's `durationLabel` while the scrubber's is the file's own length (my seed made them differ: "Video 3:07" over "0:04 / 1:50"); that is the API's label versus the player, not a fabrication. |
| V5 picture | failed (see D1, D2) | 12 pairs in `pairs/` (design left, built right): H2 light and dark, H3 (paid set) light and dark, H3b (free set) light and dark, H4 light and dark, H5 light and dark, H6 light and dark. Classification below. |
| V6 states | passed | Each entered by its cause against the real Hub, both themes (`shots/S-*`, `pairs/states-*.png`): loading (Hub answers held 6 s), error (Hub connection dropped, then Try again with the Hub back loads the posts), empty For you (an account that blocked every creator), empty Following with "You're not following anyone yet" (a creator who follows nobody), empty Following with "No new posts yet" (a fan whose one followed creator has no posts), locked preview ended (H5, the 8 s preview played to its end), own post (a creator on their own video: no follow badge; a creator on their own locked video: no lock, no offer bar, no "Locked" pill, the full file). |
| V9 seam | passed | Real sign-in screen (no injected token). On the seeded Orbit post: like (12,345 to 12,346), save, follow (badge gone, post by the creator no longer offers follow) pressed in the app; reload shows Unlike / Saved / no badge; read back through the Hub as the viewer: `likes 12346, likedByMe true, savedByMe true, followsCreator true`; rows in `ContentLike`, `SavedItem`, `FollowRelationship`; one `ContentView` row per post that filled the screen (and none for posts only rendered nearby), `ContentPiece.views` counted once per person per day. Also: pagination (14 extra posts: pages 1, 2 and 3 fetched on swiping, 21 unique posts, no duplicate, the last post is a normal post), real touch (swipe up and down one page each, sideways frames 1/4 to 2/4 and back with the page not moving vertically, tap pauses and plays the video). |

**Mutants (20 of my own on the feature logic, jest `src/features/feed`, 31 tests; `mutate.out`).** 17 caught: isLocked ignoring `fullAssetLocked`, naira x10, rail count rounding up, follow badge on own post, refused like not put back, free-page fraction inverted, length threshold 600 to 60, follows-nobody test flipped, course drawn as video, ticks swapped, offer bar on every piece, save using the wrong verb, offer price from likes, For you asking for the Following scope, a wallet-pay press on the offer bar, creator name falling back wrongly, seek share unclamped. 3 SURVIVED (test gaps, product behaviour verified live instead): M7 a view counted for a post that is not on screen (the "once, when it fills the screen" rule has no test), M12 a locked piece playing `fullAssetUrl` when the Hub sent one (the test's locked item has a null full url; the Hub never sends one, but nothing pins the rule), M18 a locked video never frosting (the player is web only and jest runs without it, so H5's frost has no automated test).

**Screenshot pairs and classification.**
- H2 (light, dark): matches in composition, scrubber (track end, time label), pill, name, tick, caption wrap, rail order. Differs for a recorded reason: Today tab and search (HOME-01), the + Create button (HOME-01), ₦ Tip (HOME-13), saves count under the bookmark (G-215, which also moves the rail 20 px down), bottom bar white and not see-through (SHARED-CHANGES HOME-02 #4), avatar hue picked per person, the device frame and 9:41 are the canvas's drawing, no tab lit on `/feed` (R1).
- H3 free set: matches (counter, dots, next frame peeking, pill). H3 paid set: the canvas draws a linked template offer under a free set ("Golden Hour presets, Template, 12 presets, ₦2,500"); the build offers the locked set itself ("Unlock the full set / 4 photos · Pay from wallet / ₦1,999"), recorded as G-216. D1 applies to this bar.
- H4: book, back page, 4-line title, "N pages free" bar with the right share, pill, caption match. Differs for a recorded reason: "84 pages · 2026 edition" is "31 pages" (G-220), the blurred cover backdrop is the plain dark ink (G-218), the cover purple is `accentDeep` (SHARED-CHANGES #1). D1 applies to the bar (the canvas wraps the subtitle to two lines; the build cuts it).
- H5: lock circle, "Preview ended", frosted frame, pill, caption, bar match. Differs: body copy says "video" where the canvas says "breakdown" (the canvas's word is its sample title; unclear, see U2); D1 applies.
- H6: square art tile, waveform, three controls, "Following" tag next to the tick, no follow badge match. Differs for a recorded reason: the square is a tile with the audio mark, not a cover picture (G-218), the blurred backdrop is plain ink.

**Findings.**
- **D1 defect (offer bar clips its words).** The title and "Pay from wallet" are single lines, so at ordinary prices they are cut: seeded video at ₦12,000 reads "Unlock the full vid..." over "46 min · Pay from wall...", photo set at ₦1,999 reads "4 photos · Pay from wall...", PDF at ₦4,750 reads "31 pages · Pay from wall...". The canvas's own H4 bar shows the subtitle wrapped to two lines with "Pay from wallet" whole; only a ₦2,500 video fits on one. Repro: open `/feed`, swipe to a paid piece priced above ₦2,500 (`shots/H5-ended-light.png`, `shots/H3-paid-light.png`, `shots/H4-light.png`). Fix direction: let the subtitle wrap (as H4 draws) and give the title two lines, keeping the price chip whole.
- **D2 defect (small phones).** At 360 x 640 (a common Android size; `pairs/small360.png`) H4's book is placed at a fixed top and overlaps the "5 pages free" bar and the "PDF · 31 pages" pill, and D1's clipping worsens ("Unlock the ful...", "Pay fro..."). Repro: sign in, open `/feed` at 360 x 640, swipe to the PDF post. 430 x 932 was also shot (`pairs/sz430.png`): there the bars fit whole and nothing overlaps, so D1 and D2 are width-dependent (390 and below).
- **differs-for-recorded-reason:** everything listed under each pair above; phone playback and phone PDF reading absent (SHARED-CHANGES HOME-02 #2; on a phone H2, H5 and H6 draw no play, scrub or frost, so those capability checks are NOT RUN there); `nairaToKobo` lives in the feed's data layer and `PostFrame` calls it while R-21 puts it in `src/api` (SHARED-CHANGES HOME-02 #3, G-219).
- **Dead-end judgement (route `/feed`).** Nothing in the app links to `/feed`: `grep` finds no `router.push('/feed')`, no link, no tab for it; the five-tab bar is unchanged and none is lit on it. So until HOME-01 lands no user can reach H2 to H6 (only by typing the web URL or a deep link). Once on it, there is no dead end: the bottom bar is present and every tab leaves it. Recorded by the builder (R-27, route-graph row HOME-02 R1); the consequence is that a build cut between HOME-02 and HOME-01 ships these screens unreachable. Left as a product fact for the lead (U1).
- **unclear U1:** the above, whether to ship HOME-02 before HOME-01 reaches users.
- **unclear U2:** H5 says "The full 46-minute video is one tap away" while the offer bar is inert until HOME-12; the line is the canvas's own, and the bar press is listed under "Added by later tasks". Also a length of 45:30 is written "46 min" (rounds to the nearest minute; the canvas's samples do not show the rule).
- **unclear U3:** `loadPeaks` in `player/index.web.tsx` calls `fetch(uri)` on the media file to read the waveform (not an API call, the gate passes, but the house rule says no fetch in components); if the media host sends no CORS headers the web waveform silently stays level.
- **Observation:** on web, when the browser refuses sound the video plays muted and there is no unmute control (the builder recorded the muted fallback).
- **Test gaps:** M7, M12, M18 above.

**NOT RUN.**
- Phone playback, scrub and in-place PDF (H2, H4, H5, H6 on Android): no player installed. Unblocked by SHARED-CHANGES HOME-02 #2 applied (`expo-video`, `expo-audio`, `react-native-webview` in a development build).
- V10 on a device: unblocked when a backend with HOME-04/05/06 is on the droplet and a tester build carries this branch.
- Backend branch checks (none: no backend change on this task); the full backend suite and protected suite were not run.
- iOS and tablets: not shot.

## Verifier report, round 2

Verifier session, 7 Oct 2026, independent of the builder and of round 1's verifier. Head `82b8cfa` (it contains mobile main `642a060`). Backend: origin/main `4892a59` (train 2 and MONEY-20), built in a detached worktree on a fresh migrated and `db:seed`ed database `vh02r2_hub_test`, stand-in WAWU ID :5172, Hub :5171, web export (`expo export --platform web --clear`, private TMPDIR) on :8271 through the same small pass-through server as round 1. The Hub's `contract/openapi.json` is byte-identical between `84eda6d` (this branch's contract source) and `4892a59`, so the feed's types did not move. Seed: 12 paid pieces, one of each (photo set, PDF, locked video) at each of the four prices the brief names (₦1,999, ₦4,750, ₦12,000, ₦250,000), lengths 18:00, 45:30, 45:30 and 1:50:00, 31 and 84 pages, plus a free video, a free photo set and an audio piece. Chromium, device scale 2, light and dark. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vh02r2/` (`shots/` 174 files, `raw2/` every bounding box and verdict as JSON, `pairs/` design beside built, `shots-reg/`, `mutate.out`, `run-*.log`, `v9.out`, `states.out`, `tools/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 code | passed | `npm run check` on the head: typecheck and lint clean, jest 46 suites, 797 of 797, gates 216 files scanned, 0 findings, tasks 207 (`check1.log`; rerun after this report was written, see the commit). Diff against the builder's file list matches (no extra or missing file; round 2 added `VideoPost.test.tsx` and edited `model.ts`, `look.ts`, `parts.tsx`, `PostFrame.tsx`, `PdfPost.tsx`, `PhotoSetPost.tsx`, `VideoPost.tsx`, `FeedScreen.test.tsx`, `model.test.ts`). No `_layout.tsx`, `src/components`, `src/api` or `package.json` touched. |
| D1 re-check | closed | 120 shots, every offer text inside its bar, none clipped or ellipsized, "Pay from wallet" on one whole line, price whole inside its chip (below). |
| D2 re-check | closed | 120 shots, the book (with its back page), H5's "Preview ended" block and H3's counter overlap nothing (below). |
| V4 data trace | passed | Changed in the database to values that are not the canvas's: Orbit likes 20,500, comments 9, length 4:21; the paid set's price 1,999 to 3,333; the PDF's price 4,750 to 7,777, pages 31 to 44, free pages 5 to 9. After a reload the screen read "20.5K", "9", "Video · 4:21", "₦3,333", "₦7,777", "44 pages", "9 pages free". The offer bar pressed three times (left, right, middle): URL unchanged, no network call at all, no PIN or confirm text. |
| V5 picture | passed (differences are the recorded ones) | `pairs/H2-*.png`, `H3-*`, `H3free-*`, `H4-*`, `H5-*`, `H6-*` (design left, built right, 390 x 845, light and dark; `pairs/ov1-light.png`, `ov2-light.png`). The layout changes do not drift from the canvas at full size: the book is at the canvas's top 128 and 200 x 280 (measured 95 to 320.5 across, 128 top at 390 x 845), the "Preview ended" block at the canvas's top 150, 260 wide, the offer bar one line at ₦1,999 and ₦4,750 for a video (the canvas draws the same), the counter top right at 100. |
| V6 states | passed | Each entered by its real cause, both themes (`shots-reg/S-*`, `states.out`): loading (Hub answers held 6 s), error (Hub connection dropped) then Try again with the Hub back (2 posts load), empty For you (an account that blocked every creator), empty Following "You're not following anyone yet" (an account that follows nobody), empty Following "No new posts yet" (follows a creator with no posts), a creator on their own locked video (no offer bar, no follow badge, scrubber present, pill "Video · 46 min"). |
| V9 seam | passed | Real sign-in (no injected token). Like, save and follow pressed in the app on Orbit; reload shows Unlike, Saved, no follow badge; Hub read back as the viewer: `likes 20501, likedByMe true, savedByMe true, followsCreator true`; one `ContentLike`, one `SavedItem`; one `ContentView` row per post that filled the screen, `ContentPiece.views` 1 (`v9.out`). |

**D1 and D2 measurements (my own driver `tools/measure.py`, bounding boxes from `getBoundingClientRect` and per-text-node ranges).** Widths 320 x 568, 360 x 640, 390 x 845, 414 x 896, 430 x 932, light and dark, four prices, three kinds: 120 of 120 pass. Then four more phone sizes in light (320 x 700, 360 x 800, 375 x 812, 412 x 915): every geometry check passes (48 shots; the only "failures" in those runs are my price check, because I had already changed two prices for the data trace, and the shots show the new price whole). Per check, all 120: every text node of the bar inside the bar rectangle; no ancestor with `overflow` hidden cutting a text rectangle; no element whose `text-overflow` is ellipsis or line clamp is actually truncated (the price chip's own text line box is 2 px short of its glyph line, which is Money's own style and clips no glyph: I checked the crop); "Pay from wallet" measured as a range from the "P" to the end: 1 line in every shot; the price text inside its chip. Bar height wraps as designed: 56 at one line (not seen), 58 (one line plus border), 68 (subtitle on two lines), 86 (title and subtitle both on two lines). Book at 320 x 568: 83 x 109 px (scale 0.35), 11.8 px above the pages-free bar, 20.5 px under the tabs, 51.8 px left of the rail; at 360 x 640: 135 x 178, 11.4 above the bar, 42.7 from the rail; 390 x 845: 225 x 297 at the canvas place, 7.5 from the rail, 96.8 above the bar; 414 x 896: 19.5 from the rail; 430 x 932: 27.5. 360 x 800: book 200 x 264, 6.4 from the rail; 375 x 812: 6.4. H5 block: at least 12.4 px above the pill at 320 x 568, 25 at 360 x 640, and in every size 2 to 23 px left of the rail (2 px at 360 wide, the words stop short of the rail but only just). H3 counter: at 320 x 568 it steps left of the rail's avatar, 6 px clear; at every other size it is above the rail's top (no overlap). Nothing overlaps the pill, the pages-free bar, the offer bar, the name, the caption or the rail in any of the 168 shots; the book starts under the tabs (20 to 43 px).

**Calibration (the driver can fail).** The same driver against round 1's export (`vh02/dist`, head `b4b32bd`), same Hub and seed: 22 of 24 shots FAIL at 360 x 640 and 390 x 845 (clipped offer text, book over the rail by 7.5 px at 360, H5 words over the rail by 12 px), the two passes are the H5 video at ₦1,999 and ₦4,750 at 390 wide, which fit on one line (`raw-old/`). So the 120 passes are not a driver that cannot fail.

**Mutants.** 30 run against the 43-test feed suite (`tools/mutate.py`, `mutate.out`): 16 killed, 14 survived.
- The builder's three, re-run by me: M7 (view counted for a post not on screen, and counted again on re-entry): both killed, 1 test each. M12 (a locked piece plays `fullAssetUrl`): killed, 2 tests. M18 (locked video never frosts; `onEnded` does nothing; a free video frosts too): all three killed, 1 test each. The new tests do kill them.
- Mine on the placement logic, killed (10): roomPlacement without its bottom clamp, scale uncapped at 1, scale from the box height not the extent, `endedBodyWidth` on one side only and without the canvas cap, `counterRight` flipped comparison, always stepping aside, never stepping aside, and `endedRailClear` 0 (killed through the `endedBodyWidth` test); the nbsp in "Pay from wallet" replaced by plain spaces.
- Mine, SURVIVED (14), grouped: (a) width-bound logic never exercised by the sweep (V1 `bookPlacement` width scale with the wrong sign, V4 scale ignoring `maxScale`, V3 top clamp): the sweep's six phones are all room-bound or wide enough that the canvas size fits, so a tall narrow phone such as 360 x 800 (a very common Android size) is where `reachRight` and `railClear` bind; the app is correct there (book 6.4 px from the rail, measured), but a regression would not turn a test red; (b) tests that read the same `metrics` constant they check, so changing the constant is invisible (V15 `bookExtentH` 280, V16 `bookReachRight` 100, V17 `railClear` 20, V18 `middleGap` 0); (c) wiring that jest cannot see because `onLayout` never fires there (V20 `PostFrame` ignoring the measured foot height, V21 `PdfPost` passing a huge `areaBottom`, V22 passing `railClear` 0, V23 `PhotoSetPost` passing `railTop` 0, V24 `VideoPost` ignoring the measured message height); (d) V10 `counterRight` without the 8 px gap (boundary case) and V14 `isLocked` ignoring `accessType` (equivalent: the Hub never sends a free piece with a locked full file). For (c) I put V22, V23 and V24 together into one Chromium export and ran the driver at 320 x 568 and 360 x 640 (`run-mut-*.log`): V23 is caught by the browser (counter 46 px onto the rail at 320 x 568, fail), V22 and V24 are NOT caught at those two sizes (equivalent there: the room, not the width or the measured height, decides). V1 and V16 to V17 I judged by arithmetic, not run in Chromium: with the sign flipped the book's right edge at 360 x 800 would be 306 against a rail at 292.

**Findings.**
- **No open defect.** D1 and D2 are closed on the measurements above.
- **differs-for-recorded-reason:** Today tab and search, the + Create button, ₦ Tip, the saves count (G-215 in this branch's numbering), the white bottom bar (SHARED-CHANGES HOME-02 #4), avatar hue picked per person, no tab lit on `/feed` (R1), H3's linked template offer (the build offers the set itself, G-216 in this branch's numbering), "84 pages · 2026 edition" and "Yours forever" (G-220), the cover picture and blurred backdrop (G-218), the book's purple (`accentDeep`, SHARED-CHANGES #1). Unchanged since round 1.
- **finding (merge time, not a defect in the code): gap numbers clash with LEGAL-01.** G-217 to G-220 collide with nothing on mobile main (its table ends at G-207) or on any `wmt/*` branch. G-215 and G-216 are ALSO defined by `origin/wmt/LEGAL-01` (`f5be9d6`: G-215 the dashboard Legal consultant screen, G-216 `LegalChatMessage` left behind by the account purge), whose merge from main was at 00:53 UTC, before this branch's renumber (01:07 UTC). Highest defined anywhere is G-220 (this branch); other claims: ADS-05 G-200, ME-10 G-201 to G-207, LEGAL-01-b G-210 and G-211, AUTH-07 G-212 to G-214. Next free numbers: G-221 and G-222. Default (agent), owner may override: LEGAL-01 moves its two rows to G-221 and G-222 (touches BACKEND_GAPS, its task file and `SHARED-CHANGES`, the LOG line and code comments that cite them), because this branch's six rows are cited in four code files, SHARED-CHANGES, BACKEND_GAPS and its task file, against two rows for LEGAL-01; if the lead prefers LEGAL-01 to keep G-215 and G-216, this branch's six rows become G-217 to G-222 (G-215 to G-217, G-216 to G-218, and so on). Recheck every branch at merge.
- **observation (not a defect): the book is small on a 320 x 568 phone** (83 px wide, scale 0.35, its title about 9 pt). Nothing overlaps; it is the cost of fitting a 310 px tall book between the tabs and the words on a 568 px tall phone.
- **observation: "Unlock the full set" wraps a lone "set" onto its own line** at 320 and 360 wide (the title wraps by words, as the brief for D1 asked).
- **observation: H5's body words stop 2 px short of the rail** at 360 x 640 and 360 x 800 (the rail's top is level with the message there); nothing touches.
- **Test gaps (above, group a to c):** the sweep should include one narrow tall phone (360 x 800), and the checks for the book's extent and reach should assert fixed numbers, not read `metrics`; neither is an open product defect.
- **unclear U1, U2, U3 from round 1:** unchanged (route `/feed` still unreachable until HOME-01; U2's "breakdown" word: the build says "video"; U3 `loadPeaks` calls `fetch` on the media file). The rounding rule for lengths (45:30 reads "46 min", halves up) is now stated in the task's Defaults; it stands as a default for the owner to override.

**NOT RUN.**
- Phone playback, scrub and in-place PDF (H2, H4, H5, H6 on Android): no player installed. Unblocked by SHARED-CHANGES HOME-02 #2 applied (`expo-video`, `expo-audio`, `react-native-webview` in a development build).
- The offer bar's wrap and the book's placement on a phone (React Native, not react-native-web): only the web export was shot; unblocked by a development build on a device.
- V10 on a device: unblocked when the backend with HOME-04/05/06 is on the droplet and a tester build carries this branch.
- Backend branch checks (no backend change on this task): the full backend suite, the protected suite and the gates were not run.
- Mutants V1, V16 and V17 in Chromium (arithmetic only): unblocked by one more export with those edits.
- iOS and tablets; sizes other than the nine shot (320 x 568, 320 x 700, 360 x 640, 360 x 800, 375 x 812, 390 x 845, 412 x 915, 414 x 896, 430 x 932; the last four phones' dark theme was not shot at the four extra sizes).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
