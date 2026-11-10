---
id: WELCOME-FULL
title: The welcome video is the whole screen, with the words and buttons over it: no panel, no shade, no gradient (R-111)
owner: YOU
area: AUTH
order: -1273
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: []
decisions: [R-111, R-98, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# WELCOME-FULL · The welcome video fills the screen

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/WELCOME-FULL` on `origin/wmt/STORE-BUY-APP` `a77f50bb` (what the phones run). Held for the next batch, never sent. App only: no Hub change, no native change, `package.json` and `app.json` untouched; fingerprints stay Android `c2474bd9`, iOS `240378f1`. Ruling: R-111 (owner, 30 Oct 2026, on a phone screenshot). Status building (a separate verifier is still to run).

| # | Before (`a77f50bb`) | After |
|---|---|---|
| 1 | the video in a box above a solid bottom panel in the video's base purple, a 16 high fade at the panel's top edge | the video is the whole screen (cover, edge to edge, from the top of the screen under the status bar to its foot); the words and both buttons sit over its lower part; no panel, no fade, no shade, no blur |
| 2 | the words in the panel (`welcome-panel`, `welcome-fade`, `welcome-stage`) | one layer over the video (`welcome-content`), the words pushed to its foot at the same spacing (title top is where it was) |
| 3 | the video was scaled to the room above the panel, so the mark was always above the words | the loop at the screen's height can put the foot of the orbit on the title (390 x 844: the foot would be 29 px below the title's top edge), so `welcomeLift` lifts the video's layer by exactly the room that is missing, from the layout (the title's top edge), never lower than the top, a translation only (no crop, no scale). Lifts at the four sizes below |
| 4 | `expo-linear-gradient` imported by the screen | not imported by the screen (the package stays: other screens read it) |
| 5 | token `surfaceWelcomeVideoBase` read by the root, the panel and the fade | read by the root only (nothing flashes before the first frame; the strip a lift leaves is that purple). The token stays in `colors.css` and `tokens.generated.ts` because the screen still reads it; nothing was removed from either |

### Where the mark ends and what the words sit on (web export, Chromium 1248, device scale 2, the loop played as a VP9 copy because this Chromium cannot decode H.264; the numbers are from the original file's frames mapped through the rendered geometry, and agree with the web pictures to 2 levels on average)

| Phone | Lift | Title top | Lowest sticker's foot (all 90 frames) | Room between | Sticker clipped by the side at the extreme frame |
|---|---|---|---|---|---|
| 320 x 568 | 113 | 316.8 | 301.4 | 15.5 | none (the loop's width is the screen's) |
| 360 x 780 | 58 | 528.8 | 510.8 | 18.1 | 10 left, 9 right (one frame) |
| 390 x 844 | 41 | 592.8 | 574.4 | 18.4 | 11 left, 9 right (one frame) |
| 430 x 932 | 18 | 680.8 | 661.6 | 19.3 | 12 left, 10 right (one frame) |

The loop's mark and orbit span 0.260 to 0.729 of its height and 0.067 to 0.930 of its width (every pixel more than 220 away from the base purple in the sum of its channels, 90 frames at 6 a second). On a tall phone `cover` shows the central 82 percent of the width, so for one or two frames the outermost sticker's edge leaves the screen by 9 to 12 px; the logo itself (0.137 to 0.863 at its largest) is never cut. The seam where the lifted video's own bottom row meets the screen's purple steps by at most 4 levels in a channel (mean 2 over 15 s at each size, measured in the bare frames), so it does not show. On 320 x 568 the lift is 113: the orbit's top then sits 35 px from the top of the screen.

### Contrast of the words against the video behind them (WCAG, lowest pixel behind each text box, at 0, 3, 6, 9, 12 and 14 s, original frames under both colour matrices a player may assume; the line is white at 80 percent, the Sign in label sits on the glass button's 14 percent white)

| Phone | Title | Line | Sign in | (Create an account, fixed accent: 6.60) |
|---|---|---|---|---|
| 320 x 568 | 9.47 | 10.20 | 11.63 | |
| 360 x 780 | 8.91 | 9.07 | 11.63 | |
| 390 x 844 | 7.66 | 8.96 | 10.73 | |
| 430 x 932 | 9.73 | 7.27 | 10.73 | |

The lowest of all is 7.27 (the line at 430 x 932, 12 s, BT.709). Nothing is under 4.5:1, so no shade is needed (the owner ruled none). The same numbers in light and dark: the welcome screen is dark in both themes.

### Tests (`src/__tests__/auth-welcome.test.tsx`, 39 tests pass; red first: on the old screen 10 of the new cases fail)

New: a person opening the app sees the video fill the screen with the words and buttons over it, no panel, no logo (light and dark); nothing sits between the video and the words (no panel, no gradient, no blur, no colour on the words' layers); `welcomeLift` at the four sizes (exact lift, the foot above the title, no more than needed), never lowers; the lift follows real layout events (before layout none; on the screen's and the words' layout the video's layer moves by the exact room, a home bar lifts it more, roomy again puts it back; size, cover and the 100 percent layer never change); Android (`Platform.OS` android): the layer is the screen's four edges from the top, a texture view, cover, no black anywhere in the tree, light status bar, the lift moves it and leaves purple.

Assertions changed (all R-98's own, pinned the panel the owner has now removed): "filling the screen above a bottom panel" is now "filling the screen with the words and buttons over it" (the root's children `welcome-video`, `welcome-content`, no `welcome-stage`, no panel margin); "the words and buttons sit in a solid panel ... with a short fade" is now "nothing sits between the video and the words"; "keep their copy, sizes and spacing, now inside the panel" no longer asserts the panel (the copy, sizes and spacing assertions are the same). Unchanged: the headline and buttons case, the file case (15 s, size and sha256), play and pause, Create an account and Sign in going where they went, the status bar cases, every A2 and A22 case.

## Read first

- `docs/WORKFLOW.md`, `DECISIONS.md` R-111, R-98
- `tasks/WELCOME-VIDEO.md`, `tasks/WELCOME-TEXT.md`, `src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`

## Goal

A signed-out person opens the app and sees the approved loop fill the whole screen, with the headline, the line and both buttons over its lower part, and the mark and its orbit never under the words.

## Scope

`src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`, `DECISIONS.md` (R-111, R-112, one line under R-98), this file, `tasks/TIER-COUNTS.md`, `docs/LOG.md` (one line) and the files `check_tasks.py --write` keeps. Nothing else.

## Capability checks

- [x] The video fills the whole screen with the words and buttons over it; no panel, shade or gradient (tests; pictures at 390 light and dark, 320, 360 and 430 dark, 0, 6 and 12 s, beside A1).
- [x] The mark and its orbit stay above the title at 320, 360, 390 and 430 (computed on all 90 frames, confirmed in the pictures).
- [x] The words' lowest contrast is 7.27:1, above 4.5:1 everywhere.
- [x] Android layout props (jest on `Platform.OS` android).
- [ ] PHONE CHECK (a phone only shows these): (1) a notch or camera cut-out: the video is under it, nothing of the words is; (2) the Android navigation bar, three buttons and gestures: the buttons stand above it and the video runs under it with no black strip; (3) a very tall phone (20:9 and taller): the title block and the lift, the orbit still clear; (4) the first second after opening: no jump when the screen is laid out and the lift is applied (the video's first frame comes after layout); (5) a small phone: 320 wide with a larger system font, the title on 2 lines and the lift.
- [ ] Verifier: pictures and a read of the code (a separate Sonnet verifier, not the builder).

## History

The earlier layouts: [WELCOME-VIDEO](WELCOME-VIDEO.md) (panel, 27 Oct) and [WELCOME-TEXT](WELCOME-TEXT.md) (words and the 15 s file, 29 Oct).
