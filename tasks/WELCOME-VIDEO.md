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

As of 27 Oct 2026, round 2, built by a Sonnet builder (T1), mobile `wmt/WELCOME-VIDEO` (round 1 head `64a0d4e4` on `origin/main` `564c8c28`; round 2 continues from it, nothing merged or rebased). Status: review. Ruling: R-98 (owner, 27 Oct 2026), amended in place for the owner's second message the same day; R-90 carries the line that R-98 replaces it.

| # | Part | Outcome |
|---|------|---------|
| 1 | The asset (round 2) | `assets/video/welcome-loop.mp4` is the owner's new file byte for byte (sha256 `7635695f56be909a...`, 2,248,484 bytes, H.264, 1080 x 1920, 8 s, 30 fps, no audio track); never re-encoded or trimmed. Round 1's 15 s file is gone |
| 2 | `WelcomeScreen` layout (round 2) | The words and both buttons sit in a solid panel at the bottom (same copy, sizes and spacing; 20 above the headline). The video's box is the room above the panel from the top of the screen (under the status bar) plus 8 behind the panel's top edge (the panel's negative top margin), `contentFit` cover in that box, so the mark and its orbit are never under the words. The screen behind everything is the video's base purple, so nothing flashes before the first frame |
| 3 | The seam | A 16 high fade from that purple at strength 0 to the purple lies on the video's last rows and ends at the panel's top edge. The loop's own edge is that purple, so the seam does not show (picture, median of a row: rgb(41, 12, 67) 4 to 8 above the panel's top edge, rgb(40, 12, 65) at it and below, at 390, 360 and 430) |
| 4 | The token (round 2) | One new token, `--surface-welcome-video-base: #280C41` (`surfaceWelcomeVideoBase`), set once in `design/_ds/wawu/tokens/colors.css` (dark; light inherits), `tokens.generated.ts` regenerated with `scripts/design/gen_tokens.py` (`--check` passes). Sampled from the loop's edge pixels: rgb(40, 12, 65), the most common of 109,440 (the file names no colour matrix; a player reads its edge as rgb(41, 11, 65) to rgb(43, 17, 67)). `SHARED-CHANGES.md` row WELCOME-VIDEO #1 |
| 5 | Round 1, kept | `expo-video` plays the loop (loop, muted, no controls, no touches, texture view as the feed's) in a layer that is an image named for the app; plays while A1 is in front and pauses when another screen is on it. The app draws no logo. The web `<video>` needs width and height 100% (a replaced element keeps its own size otherwise) |

Not changed: `app.json`, `package.json` (Android fingerprint stays `17ffb13d520882bf144982b61d03f3994c6e40e4`). The R-90 mark pictures (`assets/images/welcome-mark*.png`, `scripts/design/make_welcome_mark.py`) and their `brand-assets.test.ts` cases stay, unused by the screen (removing them is its own task). The native phone: NOT RUN (no phone or emulator here).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `DECISIONS.md` R-98, R-90, R-37, R-47
- `src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`, `src/features/feed/player/index.tsx`

## Goal

A signed-out person opens the app and sees the approved loop playing silently, edge to edge, with the headline, the line under it and both buttons at the bottom on a dark fade so they read on every frame, and no logo of the app's own on top of the one in the video.

## Scope

`src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`, `assets/video/welcome-loop.mp4`, `DECISIONS.md` (R-98, one line under R-90), `design/_ds/wawu/tokens/colors.css` and the regenerated `src/theme/tokens.generated.ts` (one token, lead-authorised), `SHARED-CHANGES.md` (WELCOME-VIDEO #1), `docs/LOG.md` (one line), this file and the files `check_tasks.py --write` keeps. Nothing else.

## Capability checks

- [x] A1 plays the approved video, cropped to fill its box and never stretched, looping and silent (tests: source, loop, muted, cover, no controls, fill; the file's sha256 and size; web render at 390 x 844, 360 x 640 and 430 x 932: one `<video>`, the size of the box, `object-fit: cover`, muted, looping, no controls).
- [x] It plays only while A1 is on screen: it plays on focus, pauses when Create an account or Sign in opens another screen, and plays again on Back (test; web: paused after Create an account).
- [x] The video fills the screen above the bottom panel from the top of the screen, so the mark and its orbit sit fully above the headline on every phone size (web, one frame each, panel top and box: 390 x 844 box 562.8 high, panel from 554.8; 360 x 640 box 358.8, panel from 350.8; 430 x 932 box 650.8, panel from 642.8). On the loop's 16 sampled frames the orbit's stickers span 25.8 to 74.2 percent of its height, so at 360 x 640 (the tightest) they fall between 24.7 and 334.1 of the box, and the fade starts at 334.8 and the panel at 350.8.
- [x] The app draws no logo: no mark picture, no glow, no spacers, one image role named for the app (the video's layer).
- [x] The headline, the line and both buttons keep their words, sizes and spacing, in a solid panel in the video's base purple; a short fade meets the panel's top edge with no visible seam; no blur.
- [ ] On a phone: NOT RUN.

## Builder report

Round 2 (owner, 27 Oct 2026: a new video, and a panel so the video does not sit under the words). Red first: with the new tests and the round 1 screen and file, five of the A1 cases failed (the box and panel, the 8 s file's hash and size, the panel and fade, the words inside the panel, the token); they pass after the change.

Changed assertions in `src/__tests__/auth-welcome.test.tsx`, all round 1's own R-98 cases, which pinned what the owner has now changed: "approved video full screen behind everything, over the dark page colour" is now "filling the screen above a bottom panel" (the root and stage are the base purple, the video is in `welcome-stage`, the panel's top margin is negative, `welcome-bottom` is gone); the file case pins the 8 s file (2,248,484 bytes, new sha256); the fade case pins the panel (solid, the new token) and a fade of at most 24 that ends at its top edge (round 1 pinned a fade from the page colour starting 120 or more above the headline); the words case adds that the words and both buttons are inside the panel. Unchanged: the play and pause case, every other A1, A22, A2 and status bar case; `brand-assets.test.ts` is untouched.

Screenshots (web export of the app, Playwright Chromium 141, device scale 2): `welcome2-390-a.png` (2 s), `welcome2-390-b.png` (6 s), `welcome2-360-b.png` (6 s), `welcome2-430-b.png` (6 s), plus `welcome2-360-a.png`, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/welcome-video-b/`. This Chromium cannot decode H.264, so the harness served a VP9 WebM copy of the loop (720 x 1280, made with ffmpeg, kept in that folder, never committed) at the video's address. In each the whole mark and its orbit are above the headline and the seam is a soft change in the purple, not a line. The video's own glow under the orbit is a little lighter than the base at 360 x 640 (rgb(47, 15, 75) at the box's foot), so there the 16 high fade is a soft step over a few levels.

Round 1 (earlier the same day): the first video full screen under a fade; its pictures are `welcome-390-a.png`, `welcome-390-b.png`, `welcome-360-a.png`, `welcome-360-b.png` in the same folder.

## Verifier report

## Owner sign-off
