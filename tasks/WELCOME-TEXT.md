---
id: WELCOME-TEXT
title: The welcome screen says "The creators and professionals ecosystem." and "Create. Sell. Get paid. Grow."
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

As of 29 Oct 2026, built by a Sonnet builder (T0, copy only, no verifier), mobile `wmt/WELCOME-TEXT` on `origin/main` `6e5df4ec`. App code only: no backend change, no native change, `package.json` and `app.json` untouched (Android fingerprint stays `17ffb13d520882bf144982b61d03f3994c6e40e4`). Ruling: owner, 29 Oct 2026, a copy change to A1 under R-98 (no new R- number: the words are not a ruling's subject). Status review.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Title "Get paid for what you know" (two lines), line "Sell your work and answer paid questions." | Title "The creators and professionals ecosystem.", line "Create. Sell. Get paid. Grow." |
| 2 | Sizes, spacing, panel, fade and video | Unchanged (title 34 bold, line 15 at 80%, panel and video as R-98) |

### Fit (web export, Chromium 1248, device scale 2, light; pictures in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/weltext/`: `welcome-320-light.png`, `welcome-360-light.png`, `welcome-390-light.png`)

The title is 3 lines at 320, 360 and 390 ("The creators and" / "professionals" / "ecosystem."), 107.1 high (3 x 35.7), never 4. The words block is 170.9 high and the panel 324.9 high at every width; the panel holds the title, the line and both buttons (last button's foot 552 of 568 at 320 x 568, 624 of 640 at 360 x 640, 828 of 844 at 390 x 844). No horizontal overflow. The video's mark (the P with "WHO MADE THIS") is fully above the panel at all three.

| Phone | Video box above the panel | Orbit (stickers span 25.8 to 74.2 percent of the video) |
|---|---|---|
| 390 x 844 | 519 | fully clear: 96 to 431 of 519 |
| 360 x 640 | 315 | palette clear; the camera's foot is 1 under the panel's top edge, inside the 16 fade (a little dimmed) |
| 320 x 568 | 243 | palette's top about 12 cropped by the screen's top; the camera sticker is mostly under the fade and the panel |

The third line costs 35.7 of the video's box (before, at 360 x 640 the whole orbit sat in the box, 24.5 to 334.3 of 350.8). R-98 says the mark and its orbit are never under the words; the mark holds on all three, the orbit's bottom sticker does not on the two smaller phones. Not changed here (the brief keeps the layout, sizes and video). Open low for the lead: if the owner wants the orbit whole on 320 and 360, the levers are the title's size on narrow phones (a two-line title needs a size near 24) or the panel's 20 top gap.

### Tests changed (an owner copy ruling pinned the old words; no behaviour assertion changed)

The old title and line strings in `src/__tests__/auth-welcome.test.tsx` (`HEADLINE`, the line under it twice), `auth-guard.test.tsx`, `auth-sign-in.test.tsx`, `auth-signup.test.tsx`, `route-guard.test.tsx`, `route-graph.test.tsx` and `src/features/open-wallet/__tests__/routeGuard.test.tsx` (their "the welcome screen is showing" waits). Same assertions, new words.

Not changed (record only): `docs/release/PLAY-LISTING.md` short description and `docs/release/SCREENSHOTS.md` caption still quote the old words; `design/` boards and `tasks/AUTH-02.md` are the earlier design record.

## Read first

- `docs/WORKFLOW.md`, `DECISIONS.md` R-98
- `src/features/auth/WelcomeScreen.tsx`, `src/__tests__/auth-welcome.test.tsx`

## Goal

A signed-out person sees the owner's two lines on A1, and the longer title fits.

## Scope

`src/features/auth/WelcomeScreen.tsx` (two strings), the tests above, this file, `docs/LOG.md` (one line) and `tasks/INDEX.md`. Nothing else.

## Capability checks

- [x] A1 shows the new title and line (7 suites, 563 tests pass).
- [x] The title fits at 320, 360 and 390 wide (3 lines, panel holds it).
- [ ] The orbit's bottom sticker clear of the panel at 320 and 360: NOT MET (see Fit).
- [ ] On a phone: NOT RUN (no device in this session).
