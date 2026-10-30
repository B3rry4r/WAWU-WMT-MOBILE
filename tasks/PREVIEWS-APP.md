---
id: PREVIEWS-APP
title: A piece, a row or a card never shows an empty box where a picture should be (the app-only fixes, part A)
owner: YOU
area: ME
order: -10979
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47, R-29]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# PREVIEWS-APP · Part A: draw what the piece has, never an empty box

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/PREVIEWS-APP` on `origin/wmt/CREATE-FRAMES` `859cdd18` (CREATE-FRAMES passed its verifier with one LOW, answered below). App only: no Hub change, no new package, no native change (`expo-video` ~57.0.5 already installed; fingerprints android `c2474bd9`, ios `240378f1`, unchanged). Held for the next batch; nothing sent to a phone. Status verifying. Part B (draw `coverUrl`, send a cover from Create) waits for the Hub's CONTENT-COVER contract (R-114); no field is invented here.

Owner, 30 Oct 2026: "if videos don't show preview what else doesn't show preview". The audit is `scratchpad/audit/PREVIEWS.md`. The Hub gives each piece one public file (`previewAssetUrl`: an mp4, an mp3 or a pdf for most kinds), so the app stops handing that file to `Image`, and draws what the piece has.

| # | Rank | Before (`859cdd18`) | After |
|---|---|---|---|
| 1 | 1 | a course page opened on an empty 200 px box (the mp4 went to `Image`); a template with a pdf preview likewise | the course's first frame from its own clip, paused and quiet (`Cover` in `Media.tsx`, a paused `VideoSurface` as `WorkCover` does), the kind mark behind it until `onFirstFrameRender`; a template with a pdf preview draws the generated book as H19 does (a picture, not a button: the template's reader is not built); a picture draws, a picture that fails or no preview gives the kind mark; "From the course" row (H24) tests `isPicture` too |
| 2 | 3 | Search Content rows (X6, X7) were blank squares for video, course, audio, pdf | `ContentRow` draws a picture only for a photo or a file that is one (`rowPicture`), else the kind mark; `onError` falls back to the mark; the lock stays over it |
| 3 | 4 | My content, Rejected card, own and visitor Content tab tested `contentType === 'image'`: a template with an image cover showed a mark | one rule, `rowPicture(contentType, url)` in `feed/model.ts` (a photo always; else `isPicture`), used by the three and by `tileOf`; the kind mark otherwise |
| 4 | 5 | the step-5 card was not drawn for a Free piece | drawn for paid and free; CREATE-FRAMES already covers a course (its preview is mp4, `frameFor` keys on `video/*`): proved by a new test through the real gallery pick and the price step, no code needed |
| 5 | 6 | Purchases and Saved gave clip and pdf URLs to `Image`, then fell back | gated with the same rule first: no clip or pdf is fetched to fail, no flash |
| 6 | 2 | a feed video or course card was plain black until its first frame | the kind mark behind the player until its first frame is in (`onFirstFrame` on `VideoSurface`, expo-video's `onFirstFrameRender` on the phone, `loadeddata` on the web); audio keeps its mark; nothing new plays (a post plays only while it is on screen, as before) |
| 7 | lead add-on | CREATE-FRAMES L1: leaving during the frame read returned before `uploadFile`, so the phone's cache copy of the video (up to 100 MB) was never discarded | `PreviewScreen.send` calls `file.discard?.()` before that early return; test "a person who leaves during the frame read leaves no copy behind" (discard called once) |
| 8 | round 1 F1 | a PAUSED expo-video player still buffers: on Android ExoPlayer's stock 50 s read-ahead (15 to 125 MB a view, no disk cache; the package's documented 20 s is never applied), so the course frame, every feed card waiting its turn, the piece page before the tap and the profile works rows pulled the clip on every view; iOS leaves it to the system | every expo-video player gets one rule (`feed/player/buffer.ts`): not playing = `bufferOptions` 2 s ahead (about 1 to 3 MB), widened once to the documented 20 s when it plays, never narrowed on a later pause. Applied to `VideoSurface` (feed, piece page, course frame, lesson, profile works), the Welcome loop and the CREATE-FRAMES reader; a test pins paused and playing for each (`frameBuffer.test.tsx`, `welcomeBuffer.test.tsx`, `frameReaderBuffer.test.ts`). iOS: the same field is `AVPlayerItem.preferredForwardBufferDuration` (0 = the system decides); expo-video applies it to the current and later items, so the same 2 s and 20 s are set there too, as a preference AVPlayer follows, not a hard cap (PHONE CHECK) |
| 9 | round 1 F3 | in Search a locked row drew the lock on top of the kind mark (one muddled glyph); `PreviewScreen.send`'s refusal path never discarded a refused file's copy | the lock sits in the corner beside the mark (a locked picture keeps the board's centred lock); a refused file's copy is discarded once (test) |
| 10 | round 1 F2 | the price-paid pictures showed "Prices did not load" | retaken with the price list served, both themes (Pictures) |

**Existing assertions changed (two, both named):** (1) `src/features/create/__tests__/details.test.tsx`, "a user can pick Free (M37)...": `queryByTestId('price-piece')` toBeNull is now `getByTestId('price-piece')`; it pinned the defect of rank 5 (lead brief). (2) same file, "a user can pick a price from the list...": the first line `expect(send()...disabled).toBe(true)` right after render raced the answer of `GET /prices`, which seeds the start price (PriceScreen) and so enables Send (the cause found by the verifier); by lead ruling it now waits for the price list (`price-stop-2500` selected) and then asserts Send is enabled. No other existing assertion changed; every other change to existing tests is additive.

**Defaults (lead), owner may override:** (a) M37 draws no piece card; the brief says a Free piece shows it, so it is drawn above the Paid or Free switch, as paid already is. (b) Course frame: a paused player, not CREATE-FRAMES' reader: the reader gives up after 4 s and needs the whole clip header in that time, a player streams. (c) Gap rows (R-29, no board draws them): the feed's loading mark, the course frame's loading mark. Both are the kind's icon, existing parts. (d) The card's position is the design gap row `G-PREVIEWS-APP-1` in `BACKEND_GAPS.md` (M37 draws none, M24 draws it below the earnings card; the app draws it above the switch, paid and free).

## Capability checks

- [x] A user opening a course sees its first frame, paused, no play button that does nothing; a tapped lesson takes the frame over (`mediaFrames.test.tsx`, Android).
- [x] A template with a pdf preview shows the book; with a picture, the picture; neither, the mark; a failed picture, the mark.
- [x] A user searching sees the kind mark on video, course, audio, pdf and pdf-template rows and the picture on a photo and a picture-template (`search/rowPictures.test.tsx`).
- [x] My content, Rejected, the own and visitor Content tab, Purchases and Saved: the same rule, no clip or pdf in any `Image` source (`rowPictures.test.tsx` in library, purchases, saved; `gridPictures.test.tsx`).
- [x] A Free piece's step-5 card with the frame; a course's frames in How it will look and on the card (`framesScreen.test.tsx`).
- [x] A feed video or course card shows its mark until the first frame, then not; unlocking waits for the new file's frame (`videoPostLoading.test.tsx`, `phoneFirstFrame.test.tsx`).
- [x] Red on the base: with the source changes reversed, 33 of the 67 tests in the 10 touched files fail (the rest pin what did not change, e.g. the CREATE-FRAMES course frames). Round 1: the same reversal of the buffer, lock and refusal changes fails the 3 buffer tests' paused and playing pins, the lock test and the refusal test.
- [x] Every expo-video player (`VideoSurface`, the Welcome loop, the frame reader) reads 2 s ahead while not playing and 20 s once it plays; the pause after play keeps 20 s (three tests, Android).
- [ ] On a phone: NOT RUN (no device); see PHONE CHECK.

## Pictures

390 px, dark and light, built beside the board, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/previews-app-b/shots/`: `<name>-vs-<board>-{dark,light}.png` for `course-vs-H25`, `template-pdf-vs-H19`, `template-png-vs-H19`, `search-vs-X7`, `library-vs-M28`, `rejected-vs-M26`, `price-free-vs-M37`, `price-paid-vs-M24`, `purchases-vs-M29`, `saved-vs-M30`, `feed-vs-H2` (a card while its clip loads), `me-vs-M1`; the single shots beside them. Taken from this branch's web export (a Hub stand-in and VP9 test clips on one local port, `stub.py`, `shoot.py`, `compose.py` in `previews-app-b/`; a temporary route for the price step, never committed). The boards draw a real photo on every row; the Hub has no cover (part B), so a video, audio or pdf row shows the kind mark. The phone's player (`expo-video`) cannot run on the web: it is proven in jest and by the PHONE CHECK.

## PHONE CHECK (owner's phone list, before the update)

- A course piece page on Android and on iPhone: the first frame appears within a few seconds on a mobile network, upright, cropped to fill, with no black flash, and the course mark shows until it does. Paused: no sound. Data: with the 2 s bound a paused frame should cost about 1 to 3 MB; measure it (Android Studio Network Profiler, or `adb shell dumpsys netstats` before and after) for one course page view and one feed swipe, and on iPhone with a proxy (iOS treats `preferredForwardBufferDuration` as a preference, not a cap).
- A course whose clip cannot be opened (a dead link): the course mark stays, nothing else.
- The feed on a slow connection: the video mark shows on the black before the first frame, and goes once the frame is in (Android TextureView and iOS player both send `onFirstFrameRender` for a paused player).
- A template with a PDF preview: the book. A template with a picture cover: the picture.
- Search, My content, Purchases, Saved: marks for clips and pdfs, pictures for photos and picture covers, no flash of a failed picture.
- Create, a 100 MB video: Back during the frame read leaves no copy in the app's cache (needs a file browser or the storage figure for the app).
- The welcome loop passes its loop point with no stall.
- A feed swipe on a slow connection does not stall more than before (neighbours now hold a 2 s head start).

## Not done

Part B (Hub cover field, `coverUrl` on every surface, Create sends a cover). Community video and voice notes (rank 7: no board, R-47). Everything that needs the Hub: unlock-sheet thumbnails, chat video frames, earnings and school rows, audio peaks (G-217).

## Read first

- `scratchpad/audit/PREVIEWS.md`, `docs/WORKFLOW.md`, `tasks/CREATE-FRAMES.md`
- `src/features/content-detail/Media.tsx`, `src/features/feed/model.ts` (`rowPicture`), `src/features/feed/VideoPost.tsx`, `src/features/feed/player/`

## Goal

A person meets a picture, a frame or the kind's mark wherever a piece is drawn, and never an empty box.

## Scope

`wawu-wmt-mobile` only: the piece page (`content-detail/Media.tsx`, `Parts.tsx`), the feed (`VideoPost.tsx`, `look.ts`, `model.ts`, the player's `onFirstFrame`), Search (`model.ts`, `parts.tsx`), My content, Rejected, the Content grid, Purchases, Saved, the step-5 card and `PreviewScreen.send`. New tests beside each. No route, no package, no native change.
