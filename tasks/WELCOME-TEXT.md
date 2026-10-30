---
id: WELCOME-TEXT
title: The welcome screen says "The creators and professionals ecosystem." and "Create. Sell. Get paid. Grow." on two lines, over the owner's 15 s video
owner: YOU
area: AUTH
order: -163
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-98, R-37, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T0
---
# WELCOME-TEXT · New words on the welcome screen

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T0, copy, one size and one asset; no verifier), mobile `wmt/WELCOME-TEXT` on `origin/main` `6e5df4ec`, round 1 (copy), then lead rulings 1 and 2 the same day. App only: no backend change, no native change, `package.json` and `app.json` untouched; Android fingerprint recomputed after the asset change: `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged. Ruling: owner, 29 Oct 2026 (copy and video), under R-98; lead ruling 1: R-98 wins, the mark and the whole orbit stay clear of the words on 360 and 390. Status review.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Title "Get paid for what you know" (34, two lines), line "Sell your work and answer paid questions." | Title "The creators and professionals ecosystem.", line "Create. Sell. Get paid. Grow." |
| 2 | Title 34 px: the longer words take 3 lines (107.1 high), which pushes the video's bottom sticker under the panel on 360 and 320 | Title 24 px (line 1.05 and tracking -0.04em as before, only `WORDS.title` changed): 2 lines (50.4 high) at 320, 360 and 390 |
| 3 | `assets/video/welcome-loop.mp4` the 8 s file (sha256 `7635695f...`, 2,248,484 bytes) | the owner's 15 s file, byte for byte (sha256 `fc533cb4ab104a9306e755c859c48c8b6817227980d4343e4eecebac79acd624`, 4,160,801 bytes, H.264, 1080 x 1920, 30 fps, 450 frames, no audio) |
| 4 | Panel token `surfaceWelcomeVideoBase` `#280C41` | Unchanged. The new file's edge reads rgb(41, 11, 65) (`#290B41`), the same as the 8 s file by the same method (ffmpeg decode, bottom rows and sides of 30 frames); the panel is rgb(40, 12, 65), one level apart. Picture check: the row 1 px above the panel's top edge is rgb(41, 12, 66) at 320 and 360 and rgb(40, 11, 65) at 390, so no seam. No `SHARED-CHANGES.md` row |

### Fit (web export, Chromium 1248, device scale 2, light; the loop played as a VP9 copy because this Chromium cannot decode H.264; pictures in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/weltext/`: `welcome-320-light.png`, `welcome-360-light.png`, `welcome-390-light.png`, and `welcome-<w>-light-t1.png` at 1.0 s, where the mark is largest)

Measured on the new loop (90 frames, bright pixels): the mark and its stickers span 25.0 to 73.5 percent of the video's height at most. Video box above the panel, then where the content ends in it (the 16 high fade starts at the panel's top minus 16):

| Phone | Box above the panel | Content (top to foot) | Result |
|---|---|---|---|
| 390 x 844 | 575.8 | 118.6 to 454.9 | clear of the fade (559.8) and the panel |
| 360 x 640 | 371.8 | 29.9 to 340.3 | clear of the fade (355.8) and the panel |
| 320 x 568 | 299.8 | 11.7 to 287.7 | clear of the panel; the lowest sticker's foot is 4 into the fade (283.8), a little dimmed. The video's faint big outer ring runs under the fade on every phone |

The title never reaches a third line on a phone this wide: "The creators and" / "professionals ecosystem." at 320 and 360 (line 2 ends 12 short of the right edge at 320), "The creators and professionals" / "ecosystem." at 390. The panel is 268.2 high at every width; its buttons end at 552 of 568, 624 of 640 and 828 of 844. No horizontal overflow. If a phone draws the line wider than Chromium and it wraps to 3 lines, the box loses 25 and the orbit's foot reaches the fade on 360 (a size of 22 would leave more room).

### Tests changed (owner and lead rulings pinned by the old values)

Old title and line strings in `auth-welcome.test.tsx` (`HEADLINE`, the line twice), `auth-guard`, `auth-sign-in`, `auth-signup`, `route-guard`, `route-graph` and `src/features/open-wallet/__tests__/routeGuard.test.tsx`: same assertions, new words. In `auth-welcome.test.tsx` two more assertions change with the rulings: the title's size case (34 to 24, line height and tracking follow) and the file case (8 s file's size and sha256 to the 15 s file's). The comment and R-98's one number "8 s" now say 15 s. Release docs: `docs/release/PLAY-LISTING.md` short description (71 of 80) and `docs/release/SCREENSHOTS.md` (two captions) quote the new words. Not changed: `design/` boards and `tasks/AUTH-02.md` (earlier design record), `tasks/WELCOME-VIDEO.md` (its own record).

## Read first

- `docs/WORKFLOW.md`, `DECISIONS.md` R-98
- `src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`

## Goal

A signed-out person sees the owner's two lines and the owner's video on A1, and the mark and its orbit stay clear of the words.

## Scope

`src/features/auth/WelcomeScreen.tsx` (two strings, one size, one comment), `assets/video/welcome-loop.mp4`, the tests above, `DECISIONS.md` (R-98, "8 s" to "15 s"), the two release docs, this file, `docs/LOG.md` (one line) and the files `check_tasks.py --write` keeps. Nothing else.

## Capability checks

- [x] A1 shows the new title and line, and plays the 15 s file (the file case pins its size and sha256).
- [x] The title is 2 lines at 320, 360 and 390; the panel holds the words and both buttons.
- [x] The mark and the whole orbit are clear of the fade and the panel at 360 and 390 (calculated from the loop's measured span and confirmed in the pictures, also at 1.0 s).
- [ ] 320: the lowest sticker's foot is 4 px into the fade (recorded above).
- [ ] On a phone: NOT RUN (no device in this session).
