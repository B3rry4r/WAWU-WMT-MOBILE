---
id: WELCOME-VIDEO
title: The welcome screen plays the approved video full screen, with the words and buttons over a dark fade and no logo drawn by the app
owner: YOU
area: AUTH
order: -162
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-98, R-90, R-37, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# WELCOME-VIDEO · The welcome screen plays the approved video

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/WELCOME-VIDEO` from `origin/main` `564c8c28`. Status: review, nothing merged. Ruling: R-98 (owner, 27 Oct 2026), added to `DECISIONS.md` after R-97; R-90 carries the line that R-98 replaces it.

| # | Part | Outcome |
|---|------|---------|
| 1 | The asset | `assets/video/welcome-loop.mp4` is the approved file byte for byte (sha256 `fc533cb4ab104a93...`, 4,160,801 bytes, H.264, 1080 x 1920, 15 s, 30 fps, no audio track); never re-encoded or trimmed |
| 2 | `WelcomeScreen` | The mark, its glow and its two spacers are gone. `expo-video` plays the loop (`useVideoPlayer`: loop, muted) in a `VideoView` (cover, no controls, no touches, edge to edge from the top of the screen, texture view as the feed's) inside a layer that is an image named for the app. It plays while A1 is the screen in front (`useIsFocused`) and pauses when another screen is on it. The words and buttons keep their copy, sizes and places at the foot |
| 3 | The fade | An `expo-linear-gradient` from the page colour at strength 0 to the page colour (`darkColors.surfacePage`, built from the token) starts 180 above the headline and reaches the screen's foot, behind the words and the buttons. No blur. The root stays the page colour, so nothing flashes before the first frame |
| 4 | Web fix found by the export | On the web the `<video>` kept its own size (a replaced element is not stretched by `top/right/bottom/left: 0`), so the loop showed its top left corner. The `VideoView` now also has width and height 100% |

Not changed: `app.json`, `package.json` (Android fingerprint stays `17ffb13d520882bf144982b61d03f3994c6e40e4`). The R-90 mark pictures (`assets/images/welcome-mark*.png`, `scripts/design/make_welcome_mark.py`) and their `brand-assets.test.ts` cases stay, unused by the screen (removing them is its own task). The native phone: NOT RUN (no phone or emulator here).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `DECISIONS.md` R-98, R-90, R-37, R-47
- `src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`, `src/features/feed/player/index.tsx`

## Goal

A signed-out person opens the app and sees the approved loop playing silently, edge to edge, with the headline, the line under it and both buttons at the bottom on a dark fade so they read on every frame, and no logo of the app's own on top of the one in the video.

## Scope

`src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`, `assets/video/welcome-loop.mp4`, `DECISIONS.md` (R-98, one line under R-90), `docs/LOG.md` (one line), this file and the files `check_tasks.py --write` keeps. Nothing else.

## Capability checks

- [x] A1 plays the approved video full screen behind everything, cropped to fill and never stretched, looping and silent (tests: source, loop, muted, cover, no controls, fill; the file's sha256 and size; web render at 390 x 844 and 360 x 640: one `<video>`, the size of the screen, `object-fit: cover`, muted, looping, no controls).
- [x] It plays only while A1 is on screen: it plays on focus, pauses when Create an account or Sign in opens another screen, and plays again on Back (test; web: paused after Create an account).
- [x] The app draws no logo: no mark picture, no glow, no spacers, one image role named for the app (the video's layer).
- [x] The headline, the line and both buttons keep their words, sizes and places, over a fade from clear to the dark page colour that starts above the headline; no blur.
- [x] The words read on every frame: with the fade, white text over the brightest 1 in 100 pixels of the 30 frames sampled every 0.5 s keeps a contrast of 7.9 or more at 390 x 844 and at 360 x 640 (1.0 with no fade; measured with `analyze.py` in the builder's folder, on the loop's frames).
- [ ] On a phone: NOT RUN.

## Builder report

Changed assertions in `src/__tests__/auth-welcome.test.tsx` (lead ruling: they pin the behaviour R-98 replaces): the two R-90 cases, "a user sees the vertical mark with its glow in the middle of the dark page, and no logo strip or photo, in the %s theme (R-90)" and "a user sees the mark centred between the top safe area and the headline: equal room above and below, at least 16 below on a short phone" (the mark picture, its source, the stage and its spacers, the 190 x 207 box, the glow offsets). Replaced by: the approved video is full screen behind everything over the dark page colour in both themes, with no mark, spacer or photo drawn; the file is the approved one (sha256, size); it plays on focus, pauses off focus and plays on Back; the fade; the words and buttons unchanged. Kept as they were: the first A1 case (headline, line, both buttons, one image named "Who Made This?", no Back), the no-bank-claim case, every navigation, status bar and A2 case. `brand-assets.test.ts` is untouched and passes.

Screenshots (web export of the app, Playwright Chromium 141 at 390 x 844 and 360 x 640, device scale 2): `welcome-390-a.png` (2 s into the video), `welcome-390-b.png` (8 s), `welcome-360-b.png` (8 s), plus `welcome-360-a.png`, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/welcome-video-b/`. This Chromium cannot decode H.264, so the screenshot harness served a VP9 WebM copy (720 x 1280, made from the approved file with ffmpeg, kept in the builder's folder, never committed) at the video's address; the app, its source and the committed file are unchanged. The words read, the buttons sit where they were, one logo (the video's).

## Verifier report

## Owner sign-off
