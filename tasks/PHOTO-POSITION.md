---
id: PHOTO-POSITION
title: Position the profile picture and the cover the way Facebook and Instagram do (R-96)
owner: YOU
area: ME
order: -138
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-96, R-47, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# PHOTO-POSITION · Position the profile picture and the cover the way Facebook and Instagram do

## Current state

As of 26 Oct 2026, round 2. Built by Sonnet builders; round 2 not verified yet. No task before it is needed, so `depends_on` is empty.
- **Status:** review. Branches pushed, no PR: mobile `wmt/PHOTO-POSITION` (round 1 `a8ad619f`, then `origin/main` `a4b4769e` merged, then round 2; the head is in the hand-back) and backend `wmt/PHOTO-POSITION` (from `97a11d6`, round 1 `51f113b`, round 2 on top).
- **Owner, 26 Oct, on round 1 ("strange controls ... On what app have you ever seen such analog things?"):** the position screen is rebuilt to work exactly like Facebook's and Instagram's profile picture editor. Round 1's slider, plus and minus buttons, arrow pad and Centre button are gone.
- **The editor (`/photo-position`, `PhotoPositionScreen`):** a full-screen dark stage (the camera page's dark ground, in both themes), the photo filling it, a clear circle (the header's banner shape for the cover) with everything outside dimmed, nothing else on the stage. One finger drags (active from the first touch); two fingers pinch, fill to 4x, about the spot between the fingers; on the web the mouse drags and the wheel or a trackpad pinch zooms about the pointer. The frame is never uncovered. The bar is "Cancel", the title ("Profile picture", "Cover photo") and "Save"; under the stage "Drag to reposition" fades after the first move. The stage carries `accessibilityActions` (zoom in, zoom out, move up, down, left, right, reset), a label and a hint; the hint line is hidden from a screen reader (the stage already says it). The only buttons on the screen are Cancel and Save.
- **The flow:** choosing a new profile picture or cover opens the editor straight away from the photo on the phone (`holdPendingPhoto` in `draft.ts`); nothing is uploaded yet. Save hands the position to Edit profile, which uploads the photo and shows it placed while it goes up (its Save stays off until it is up; a failed upload says so and the old picture stays). Cancel drops it (the phone's own copy is deleted) and keeps the old picture. A Save on a photo nobody moved keeps the link exactly as it came. Edit profile: tapping the current profile picture opens a sheet with "Choose a new photo" and "Reposition" (no picture: straight to choosing); round 1's "Reposition" pill beside the avatar is gone; the cover keeps its small glass "Reposition" beside the camera. Without `onPositionPhoto` a chosen photo uploads at once, as before.
- **Verifier findings taken in round 2 (verifier report, lead's message):** M1 (medium): the Hub accepted any shape 0.05 to 20, so `#wmt-pos=0.5,0.5,4,0.05` drew a 384 by 7680 avatar. Fixed at both ends: the Hub keeps 0.2 to 5 (plain-sentence 400 as before; specs written first, red, then green) and the app reads a position outside that as none, and `PositionedImage` believes the loaded photo's own shape over the one the link declares (never stretches; centred when the photo itself is out of range). A photo more than 5 to 1 either way cannot be placed and is kept centred. L1: `MediaCard` draws a string picture through `PositionedImage`, so Explore's and Home's creator cards and the pay sheet's header (tip and ask) wear the position. L2: the editor's drag is active from the first touch.
- **Storage choice kept (R-96):** the position rides on the picture's link as `#wmt-pos=x,y,zoom,ratio`; no new fields, table or contract change. The backend change in round 2 is one range constant.
- **Tests changed because the owner's ruling changed their subject:** the round 1 editor specs (slider, buttons, Done, the avatar "Reposition" pill) are replaced by specs of the new editor, the pending-photo flow and the sheet (`photoPosition.test.tsx`, `photoPositionRoute.test.tsx`); the backend refusal tables of `photo-position.spec.ts` and `photo-position.contract.spec.ts` follow the new range. No gate, baseline or other test was touched.
- **Pictures:** `audits/PHOTO-POSITION/` (5, replacing round 1's six): the profile picture editor before and after a drag and zoom, the saved picture and cover on Me, the Edit profile choice sheet, the cover editor.
- **Not done on purpose:** the web (it draws these photos centred until it reads the fragment); a keyboard control for the editor on the web (a screen reader has the actions; the mouse and wheel work); no PR; no CI watched (the lead watches).

## Read first

- `docs/WORKFLOW.md` and the role file your prompt names
- `DECISIONS.md`: R-96 (the ruling), R-47, R-37
- `wawu-backend` CLAUDE.md (additive only; fenced files)

## Goal

A person places their profile picture and cover the way every app they know does: a dark stage, the photo under a circle, drag and pinch, Cancel and Save. Every avatar and cover in the app then shows that part of the photo.

## Scope

1. Hub: keep the position on `avatarUrl` and `coverUrl` as a fragment, check it on `PATCH /users/me`, keep it when a stored link is signed again, keep the shape to 0.2 to 5.
2. App: `PositionedImage` (one component places the photo from the link at any size), `Avatar`, `MediaCard` and the covers use it; the editor, the pending-photo flow, the Edit profile sheet.

## Capability checks

- [x] A user chooses a profile picture, sees the photo under a circle on a dark stage with only Cancel and Save, drags and zooms it, presses Save, and sees it placed the same on Edit profile, Me and a smaller avatar (a local stack, the web export at 390, dark).
- [x] A user who chooses a new photo and presses Cancel keeps the old picture and nothing is uploaded.
- [x] A user taps the current profile picture, is offered "Choose a new photo" and "Reposition", and Reposition reopens the photo where they left it.
- [x] A user repositions the cover under the banner shape, saves, and sees it on Me.
- [x] A touch screen: one finger drags from the first pixel and two fingers pinch to 4x (CDP touch events in the web export).
- [x] A link that declares a shape the photo does not have, or one far outside 0.2 to 5, never draws a stretched or huge picture.
- [x] A profile that never positioned a photo is served and drawn exactly as before.

## Checks

Each ran to the EXIT shown; logs are in the builder's scratchpad (`pho2-a`, `pho2-b`).

- App (mobile worktree): `tsc --noEmit` EXIT 0; `eslint` on every changed file EXIT 0; jest (`--maxWorkers=2`) profile-edit, me, avatar, photoPosition, route-guard, MediaCard and explore: 30 suites, 671 tests passed, EXIT 0 (the editor and flow specs hold 34 of them); jest over pay-sheet, home, tips, paid-ask, lists, feed, visitor and components: 580 tests passed, EXIT 0. `npm run gates` EXIT 0 (0 fail, 18 warn, 56 gate tests OK, baseline clean); `check_tasks.py` EXIT 0; `npx expo-updates fingerprint:generate --platform android` gives `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged.
- Backend (head `e60ea45`): `tsc --noEmit` EXIT 0; `eslint` on the three changed files 0 errors; `scripts/gates/run.py` EXIT 0 (0 fail, 139 warn, 88 accepted, as on main) and `check_baseline.py` EXIT 0; `photo-position.spec.ts` red first (4 failed) then 26 passed; with the stack's database seeded, `photo-position.contract.spec.ts` and `photo-position.spec.ts`: 41 passed, EXIT 0 (the two refusals for 0.05 and 20 are in it).
- Local stack (`pho2`, Hub 10250, web export 10253; the storage was stood in by the browser only): the editor opened straight from a chosen photo with Cancel and Save as its only buttons; the first 3 px of a mouse drag moved the photo 3 px; the wheel zoomed about the pointer (zoom 2.718); Save then Edit profile's Save stored `#wmt-pos=0.383,0.5,2.718,1.5` on the account, and the picture sat at the same relative place in the 96 (Me), 72 (Edit profile) and 52 (Settings) circles. Cancel after choosing a new photo: 0 uploads, the avatar unchanged, Save off. The cover editor drew the banner; its Save stored `#wmt-pos=0.5,0.5,1.868,1.5` and Me drew it. Touch (CDP): a one-finger drag moved the photo 48 by 16 px for 48 by 16 px of finger, a two-finger pinch out took it to 4x and stopped.
