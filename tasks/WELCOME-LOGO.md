---
id: WELCOME-LOGO
title: The welcome screen draws the app's mark centred in the room above the words, with one line and the two buttons, and no video (R-119)
owner: YOU
area: AUTH
order: -1275
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: []
decisions: [R-119, R-98, R-111, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# WELCOME-LOGO · The welcome screen draws the mark, not the video

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/WELCOME-LOGO` on `origin/wmt/STORE-BUY-APP` `0d730a7a` (what the phones run). Held for the next batch, never sent. App only: no Hub change, no native change, `package.json` and `app.json` untouched; fingerprints stay Android `e871fe1a355ac5a50d47a0b1325fe54fc159c80b`, iOS `e8e7de8550c68bf499b295c2b0ed6414e50d12b8` (`npx expo-updates fingerprint:generate`, before and after, logs `fp-before.log` and `fp-after.log`). Ruling: R-119 (owner, 31 Oct 2026, relaying his boss: a logo instead of the video, "properly centralized ... so upwards"). Status building (a separate verifier is still to run).

| # | Before (`0d730a7a`) | After |
|---|---|---|
| 1 | the approved 15 s video fills the screen (R-98, R-111), `expo-video` player, a lift (`welcomeLift`) that moves the video so the orbit clears the words | no video: no player is asked for, no `VideoView`, no lift, no layout state. `assets/video/welcome-loop.mp4` stays in the repo, untouched (same 4160801 bytes, same hash), and no screen reads it |
| 2 | no logo drawn by the app (the video carried it) | the app's own mark: `<BrandMark layout="submark" surface="dark">`, the sticker cut the Explore header draws on a dark page, 120 wide (the owner's picture shows it 359 of 1125 pixels wide), centred across. Not a new or redrawn logo; no asset added |
| 3 | headline "The creators and professionals ecosystem." (24, bold) and the line "Create. Sell. Get paid. Grow." (15 at 80 percent), left aligned | the one line "Create. Sell. Get paid. Connect. Grow." (15, line height 1.45, white, centred, no opacity) and no other title |
| 4 | the page is the video's base purple (`surfaceWelcomeVideoBase`) | the app's darkest surface, `surfacePage` `#0B0A0D`, in both themes (the screen is always dark; the status bar stays light) |
| 5 | n/a | the mark is centred down in the room between the top safe area and the words: the same two flex spacers as ONBOARD-LOGO (commit `f5d923fc`, R-90), the lower one with a 16 minimum so a short phone moves the mark up and never onto the words |
| 6 | buttons: Create an account (accent), Sign in (glass), 20 from the sides, 10 apart, words 28 above them | unchanged (the same `Button`s, the same spacing, `welcome-create` and `welcome-sign-in` test ids kept) |

Unchanged on purpose: the status bar is light only while A1 is in front, the two buttons open A2 and A22 and Back returns, the screen makes no request, Android's Back is not taken by the screen (it leaves the app at the root, and returns from A22 to A1), the route (`src/app/welcome.tsx`) and the signed-in redirects. The WAWU theme button (R-99) is a floating button of the tab screens, not of A1: A1 never drew one, so there is none to keep.

### Where the mark sits (web export, Playwright's Chromium, device scale 2; boxes read from the rendered page; the stage starts at 0 because the web has no safe area)

| Phone | Mark box (x, y, w x h) | Room above the mark | Room below it, to the words | Mark centre across | Clear of the words |
|---|---|---|---|---|---|
| 390 x 844 | 135, 264.7, 120 x 130.8 | 264.7 | 264.7 | 195.0 (screen 195.0) | yes, 264.7 |
| 360 x 800 | 120, 242.7, 120 x 130.8 | 242.7 | 242.7 | 180.0 (screen 180.0) | yes, 242.7 |
| 430 x 932 (tall) | 155, 308.7, 120 x 130.8 | 308.7 | 308.7 | 215.0 (screen 215.0) | yes, 308.7 |
| 360 x 640 (short) | 120, 162.7, 120 x 130.8 | 162.7 | 162.7 | 180.0 (screen 180.0) | yes, 162.7 |

Light and dark read the same numbers (the page is dark in both). In the owner's picture the mark's centre is at the screen's middle, which looks low because the words and buttons fill the foot; here at 390 x 844 its centre is at 330 of 844 (39 percent of the height, the middle of the room above the words), so it sits 92 higher. The line is 262 wide at 390, so it stays on one line down to a 320 wide phone (272 of room); not shot at 320. The web page requested no `.mp4` and no host but its own, and holds no `<video>` element.

### Pictures (owner hard rule 1), in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/welcome-logo/shots/`

`vs-A1-and-reference-<w>x<h>-<dark|light>.png`, each with the board A1 (`render_design.py A1`), the built screen and the owner's reference side by side, at 390 x 844, 360 x 800, 430 x 932 (tall) and 360 x 640 (short), dark and light (8 files; beside them are the 8 bare built pictures `built-<w>x<h>-<dark|light>.png` and the 2 bare boards `board-A1-<dark|light>.png`). Board A1 is the original design (green picture, "wawu", "Get paid for what you know"), which R-90, R-98, R-111 and now R-119 each replaced; it is shown for the buttons and the foot's spacing, which match it, and not for the top, which the owner's picture decides. The light pictures show the same dark page: the welcome screen has no light look (R-98 onward). Sign in is the glass pill the board draws; the owner's picture draws it darker (about `#1A191E`, a hairline ring), a difference the lead's default leaves ("buttons as today"): owner may override.

### Tests

`src/__tests__/auth-welcome.test.tsx` (33 tests) and `src/features/auth/__tests__/welcomeBuffer.test.tsx` (3), both pass; run against the old screen's code, 24 of the 36 fail (`jest-red.log`), so they test the change. New: a person opening the app sees the mark, the one line and both buttons on the darkest page, with no video, headline or panel, in light and dark; the screen module reads no video file or player and the owner's file is byte for byte as approved; the mark is centred across and down (the spacers, the 16 minimum, the 120 width, no transform); on Android (`Platform.OS` android, the real router and handlers, `BackHandler` registrations captured): the mark, the line and the buttons draw with no player and a light bar, a phone with a 28 status bar and a 48 navigation bar keeps the room under the status bar and the buttons clear of the bar (16 with none), the phone's Back is not taken at the welcome screen and goes from A22 back to it; the line is centred, white, 15 on 1.45, the buttons keep their fills and spacing.

Assertions changed, each because R-119 removes what it pinned (everything else in the two files is untouched):
1. `a user who opens the app signed out sees the headline, the line under it and both buttons`: now the mark and the one line (the line "Create. Sell. Get paid. Grow." and the headline are gone).
2. `a person opening the app sees the welcome video fill the screen ... (R-111)` (light and dark): replaced by the mark-on-the-darkest-page case (the root's layers are `welcome-stage`, `welcome-content`; the page colour is `surfacePage` and no longer `surfaceWelcomeVideoBase`; no player, no `welcome-video`, `welcome-video-view`, panel, fade).
3. `plays the file the owner approved, byte for byte`: kept (same size and hash) inside the new "no longer read by the screen" case, which also greps the screen's source for the video, the player and the lift.
4. `the video plays while the welcome screen is in front and pauses ...`: removed; there is no player to pause. The status bar cases below it (light on A1 only) are unchanged.
5. `nothing sits between the video and the words`: removed with the video; the no-panel, no-gradient, no-blur lines live on in case 2's new form.
6. The `the mark and its orbit stay above the title (R-111)` block (`welcomeLift` at four phones, never lowers, follows layout events): removed with `welcomeLift`; replaced by the centring case (the mark is clear of the words by structure and by the measured gaps above).
7. `on Android (R-111, phone paths)`: the video-layer assertions are replaced by the Android cases above; its light status bar line is kept.
8. `the words and buttons keep their copy, sizes and spacing, now straight over the video`: the headline's 24 size and tracking and the line's `opacity 0.8` are gone; the line's 15 on 1.45 is kept and the buttons and spacing (28 under the words, 10 between the buttons, 20 from the sides) are asserted.
9. The marker text in six other files, `getByText('The creators and professionals ecosystem.')` to `getByText('Create. Sell. Get paid. Connect. Grow.')`, only as "the welcome screen is showing": `auth-guard` (4 lines), `auth-sign-in` (3), `auth-signup` (3), `route-guard`, `route-graph` (4) and `open-wallet/__tests__/routeGuard` (1). No other line of those files changed.
10. `welcomeBuffer.test.tsx` (PREVIEWS-APP's 2 s and 20 s read-ahead of the welcome loop's player): both cases replaced by "no player is asked for" (opened, under another screen, and in front again) and the status-bar and navigation-bar insets case.

### Checks (EXIT lines in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/welcome-logo-b/logs/`)

`tsc` EXIT 0 (`tsc3.log`); eslint on the nine changed code files EXIT 0 (`lint2.log` for all nine with one unused import, then `lint3.log` for the three files edited after it, 0 problems; without `--fix`); jest `src/__tests__` and `src/features/auth`, 54 suites and 1252 tests, EXIT 0 (`jest-batch.log`); the two welcome files alone, 36 tests, EXIT 0 (`jest-final2.log`, after the last edit); the six files whose marker text changed, 531 tests, EXIT 0 (`jest-6files.log`); the gates, the baseline check and the gate tests (63) EXIT 0 (`gates.log`); `check_tasks` below. Not run: the full `npm run check` (the merge agent runs it once per batch).

### Found and not fixed (for `tasks/SWEEP-APP.md`)

(a) The token `surfaceWelcomeVideoBase` (`design/_ds/wawu/tokens/colors.css`, `tokens.generated.ts`) and `assets/video/welcome-loop.mp4` (4.2 MB, in the bundle's assets only if something requires it; nothing does now) are unused; removing them is its own task. (b) `docs/release/PLAY-LISTING.md` line 133 still gives the store's short description as "The creators and professionals ecosystem. Create. Sell. Get paid. Grow."; that is store copy, not the app's screen, so it was left for the lead to rule. (c) `tasks/WELCOME-VIDEO.md`, `WELCOME-TEXT.md` and `WELCOME-FULL.md` describe the video screen; they are history and were not edited.

## Read first

- `docs/WORKFLOW.md`, `DECISIONS.md` R-119, R-111, R-98, R-99
- `src/features/auth/WelcomeScreen.tsx`, `src/components/BrandMark.tsx`, `src/__tests__/auth-welcome.test.tsx`, commit `f5d923fc` (ONBOARD-LOGO)

## Goal

A signed-out person opens the app and sees the Who Made This? mark, centred across and centred down in the room above the words, the line "Create. Sell. Get paid. Connect. Grow." and the two buttons, on a dark page, with no video.

## Scope

`src/features/auth/WelcomeScreen.tsx`, `src/features/auth/__tests__/welcomeBuffer.test.tsx`, `src/__tests__/auth-welcome.test.tsx` and the six marker-text lines named above, `DECISIONS.md` (R-119, a line each under R-98 and R-111), `docs/release/SCREENSHOTS.md` (one caption), this file, `docs/LOG.md` (one line) and the files `check_tasks.py --write` keeps. Nothing else.

## Capability checks

- [x] The screen shows the app's mark, one line and both buttons, with no video, headline, panel or shade (tests; pictures at 390 x 844 and 360 x 800 dark and light, 430 x 932 and 360 x 640, beside A1 and the owner's picture).
- [x] The mark is centred across and centred down between the top safe area and the words, and never touches the words, on a short phone (measured 162.7 above and below at 360 x 640; the 16 minimum is pinned in a test).
- [x] Android layout and Back (jest on `Platform.OS` android, the real router and handlers).
- [x] Fingerprints unchanged (Android `e871fe1a`, iOS `e8e7de85`).
- [ ] PHONE CHECK (a phone only shows these), on the next build or over-the-air update: (1) a notch or camera cut-out: the mark starts under the safe area and is centred in the room under it, nothing touches the words; (2) the Android three-button and gesture navigation bars: the buttons stand above the bar and the page runs under it in the same dark colour with no strip; (3) a very tall phone (20:9 and taller): the mark stays in the middle of the room above the words; (4) a phone with the system font set larger: the line wraps to two lines and the mark moves up, never onto it; (5) the first frame after opening: the page is dark at once with no purple or white flash; (6) the Android Back button at this screen leaves the app, and from Sign in returns here.
- [ ] Verifier: pictures and a read of the code (a separate Sonnet verifier, not the builder).

## History

The earlier layouts: [WELCOME-VIDEO](WELCOME-VIDEO.md) (panel, 27 Oct), [WELCOME-TEXT](WELCOME-TEXT.md) (words and the 15 s file, 29 Oct) and [WELCOME-FULL](WELCOME-FULL.md) (the whole-screen video, 30 Oct); the mark's own first layout is ONBOARD-LOGO (R-90, 26 Oct).
