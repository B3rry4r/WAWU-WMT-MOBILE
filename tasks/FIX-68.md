---
id: FIX-68
title: CHECK-1's findings: the Tip button wins its taps, no tier is not an error, one write per sign-up, Explore and the cards as drawn
owner: YOU
area: FIX
order: -68
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T1
depends_on: []
decisions: [R-47, R-10, R-6]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-68 · CHECK-1's findings: the Tip button wins its taps, no tier is not an error, one write per sign-up, Explore and the cards as drawn

## Current state

As of 18 Oct 2026, built, awaiting a lean verifier (T1). Mobile `wmt/FIX-68` from `origin/wmt/MERGE-15` `6535bb83`; no backend change (F-5 is a record).
- **F-1 (medium), fixed:** the scrub bar's own box now ends where the rail starts (`marginRight` of `barRight`), and the rail sits above the foot (zIndex 7 over 6), so a rail button wins every tap inside its box and the bar still seeks outside it. `VideoPost.test.tsx` (3 new cases; 2 failed on the base).
- **F-2 (medium), fixed:** no tier is a plain state ("You have no tier yet", button "See tiers" opens the tier chooser), no alert, no "Try again". A Hub failure keeps its error and its real retry (reads the tier again). Lead default: VF14 draws active, ending and ended only, no "no tier" state. `publishAndTier.test.tsx` (2 new; the no-tier one failed on the base).
- **F-3:** the owner's (terms text). No change.
- **F-4 (low), fixed:** a finished sign-up no longer writes the account type on every start. It asks the Hub (`GET /users/me`) and writes only when the Hub holds neither that type nor `creator`; a read that fails sends nothing. While the steps are open the write is as before. `hubAccountType.test.tsx` (4 new; 3 failed on the base).
- **F-5 (low), record only:** see G-FIX-68-3. No backend change.
- **F-6 (low), fixed:** the board draws no empty state for Featured creators or Upcoming events, so a row the Hub has nothing for is left out, heading included (R-47). The neutral frames are deleted. `explore` specs (the ones that asserted the frames now assert the rows are absent; rows come back with data).
- **F-7 (low), fixed:** a creator with no photo draws the canvas's portrait tile (the `--hue-*` token as the ground, a pale head and shoulders, a light top-left corner) on Explore and Home's rail; no initials. `PortraitTile.tsx`; `sharedToastFollow.test.tsx` case rewritten.
- **F-8 (low), no change:** already ruled in WALLET-05 (G-WALLET-05-5, -3) and re-checked at MERGE-15: no route serves a transfer-in fee, no `docs/nuvion/`, no arrival field. G-FIX-68-1 and -2.
- **Pictures** (390 px, light and dark; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-68-b/pics/`): Your tier (no tier), Explore with nothing, the no-photo cards, Add money.
- **Open findings:** none. Lows: none.
- **Next:** the lean verifier; then the batch.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`

## Goal

The eight CHECK-1 findings are each fixed, ruled or recorded, with a test that fails on the base where one can.

## Scope

`src/features/feed` (VideoPost, parts, PostFrame), `src/features/verify/YourTierScreen.tsx`, `src/features/after-signup/hubAccountType.ts` and `src/features/auth/signupGate.ts`, `src/features/explore` (ExploreScreen, parts, CreatorCard, PortraitTile), `src/features/home/CreatorRail.tsx`, their specs, `BACKEND_GAPS.md` rows G-FIX-68-1 to -3. No `src/components/**`, no theme, no contract.

## Capability checks

- [x] A tap in the middle of the Tip button opens Tip, not a seek; the scrub bar still seeks along its own track.
- [x] A person with no tier sees a state that is not an error, and its one button opens the tiers; a failed read keeps "Try again" that reads again.
- [x] A finished sign-up sends no account-type write when the Hub already holds the type.
- [x] Explore with nothing served draws no placeholder rows; with data the rows are back.
- [x] A creator with no photo draws a hue tile with a head and shoulders, in both themes.
- [x] Add money draws no "Free" and no arrival line, because the Hub serves neither (G-FIX-68-1, -2).

## Owner sign-off

Not needed.
