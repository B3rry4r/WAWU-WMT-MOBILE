---
id: HOME-02
title: For you feed: video, photo set, book, locked, audio
owner: YOU
area: HOME
order: 85
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

**Files.** New `src/features/feed/`: `FeedScreen.tsx` (tabs, pager, loading, empty, error), `PostFrame.tsx` and `parts.tsx` (scrim, rail, pill, byline, offer bar, scrubber), `VideoPost.tsx` (H2, H5), `PhotoSetPost.tsx` (H3), `PdfPost.tsx` (H4), `AudioPost.tsx` (H6), `engagement.ts` (like, save, follow, one counted view), `api.ts` (`GET /feed/entries`, `/content/{id}/detail`, `/users/me`, `/feed/following/count`, like, save, follow, view), `model.ts` (every rule, pure), `look.ts` (tokens and the canvas's sizes), `player/` (web `<video>`/`<audio>`; phone: none yet), `reader/` (web: the browser's PDF view; phone: the phone's viewer), tests `__tests__/model.test.ts` (17), `__tests__/FeedScreen.test.tsx` (14). Route `src/app/(tabs)/feed.tsx` (`/feed`, inside the tabs so the bottom bar shows; nothing links to it until HOME-01, SHARED-CHANGES HOME-02 R1). Also `BACKEND_GAPS.md` G-203 to G-208, `SHARED-CHANGES.md` HOME-02 #1 to #4, F1 to F3 and R1, `docs/LOG.md`.

**Capability checks** (web export on :8191, opened at `/feed` after signing in, local Hub :5091 at backend origin/main a94f338, DB `h02_hub_test`, stand-in WAWU ID :5092, signed in through the app's own sign-in screen; Playwright 390 px, light and dark; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/tools/drive.py`, call log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/h02/drive-log.jsonl`):
- H2 tap to pause/play, scrub, swipe up: the scrubber read 0:04, then paused 0:05 and still 0:05 1.5 s later, a click at 70% of the track 1:03, tap to play 1:05; a wheel swipe brings the next post. Shots `H2-playing`, `H2-paused` (play mark shown), `H2-scrubbed`.
- H3 sideways frames, swipe up: counter 1 / 6 then 2 / 6 after a sideways swipe, the next frame peeks at the right. A paid set shows its locked frames (no url from the Hub) frosted with a lock, and its offer bar. Shots `H3-frame1`, `H3-frame2`, `H3-paid-set`, `H3-paid-set-locked-frame`.
- H4 read the free pages in place: "12 pages free" and its stretch of the bar come from `GET /content/{id}/detail` (freePreview.pages); pressing the book opens the 12-page preview file over the feed (`H4`, `H4-reading`). Phone build: opens the phone's PDF viewer (NOT RUN, see below).
- H5 frame frosts when the preview ends, swipe on: the 8 s public preview plays (`H5-preview-playing`), then frosts with "Preview ended" and "The full 18-minute video is one tap away." (`H5-preview-ended`). The offer bar shows the lock and ₦2,500 from the Hub and starts nothing (jest: no unlock, pay or money call; it has no press handler).
- H6 play/pause, scrub waveform, swipe on: the big button reads Pause, then Play after a press; a click at the waveform's middle fills 22 of 44 bars; reached by swiping on the Following tab, "· Following" beside the name, no follow badge (`H6-playing`, `H6-paused`, `H6-scrubbed`, `H6-following`, `following-first`).
- Every value from the API or the user: names (WAWU ID lookup), ticks, captions, counts, lengths, page and frame counts, prices (naira converted to kobo once, G-207), free pages. Not served and left out: the saves count (G-203), H3's linked offer (G-204), waveform peaks on a phone (G-205), cover pictures (G-206), "Yours forever" and "2026 edition" (G-208).
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
- Lengths under 10 minutes are a clock ("1:50"), longer in minutes ("18 min"). Skip buttons move 15 s. The waveform is the file's loudness in 44 bars (web).
- The video plays muted when the browser refuses sound before a first touch.
- The feed is drawn the same in both themes (the artboards' two phones are identical); the bottom bar keeps its theme colours until SHARED-CHANGES #4.

**NOT RUN.**
- Phone playback, scrubbing and in-place PDF (H2, H5, H6, H4 on Android): no player is installed. Unblocked by SHARED-CHANGES HOME-02 #2 (`expo-video`, `expo-audio`, `react-native-webview` in a development build), then the phone player files.
- V10 on a device: unblocked when the backend with HOME-04/05/06 is on the droplet and a tester build carries this branch.
- Picture match (V5) is the verifier's; known differences: Today tab, search, Create, Tip absent (later tasks); avatar hues are picked per person; the bar under the feed is not see-through (SHARED-CHANGES #4); H3 offers the set itself, not a linked template (G-204); the H4 cover purple is `accentDeep` (SHARED-CHANGES #1).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
