---
id: SHARED-03
title: Shared-change pass after the tab hubs (one toast, chip padding, card placeholder)
owner: YOU
area: SHARED
order: 184
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [SHARED-02]
decisions: [R-41]
passes: [V1, V5, V6]
artboards: []
---
# SHARED-03 · Shared-change pass after the tab hubs (one toast, chip padding, card placeholder)

## Read first

- `docs/WORKFLOW.md` section 4 (fenced files) and `SHARED-CHANGES.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/SHARED-02.md`, `tasks/EXPLORE-01.md` (Verifier report, round 2: R2-1, R2-3, R2-5, R2-6), `tasks/HOME-01.md` (round 2: HOME-01 #3)

## Goal

Close the shared-component items the hub checks found, so no feature keeps a local copy of a shared piece.

## Scope

1. **One shared toast.** `src/features/explore/FollowNotice.tsx` is a structural copy of ME-06's `src/features/profile-edit/SavedToast.tsx` (EXPLORE-01 R2-3, accepted at merge by the lead on the condition this task removes it). Make one shared toast in `src/components/` (placement top or bottom, tone success or alert, one or two lines, duration), and make both features use it. Each looks exactly as it does today.
2. **FilterChips padding without an icon** (EXPLORE-01 R2-1): the canvas draws the All chip at 11 start and 14 end with no icon; FilterChips gives 15 and 15. Match the canvas for an item that sits beside icon chips, without changing any other screen's chips (prove with pictures).
3. **MediaCard placeholder** (SHARED-CHANGES HOME-01 #3): a `placeholder` slot (initials for a creator with no photo), used by Home's creator rail and Explore's creator card.
4. **Test gaps** (EXPLORE-01 R2-5): the follow notice's duration (4 s), and Categories passing `revealSelected`.
5. **Flaky test** (EXPLORE-01 R2-6): SETTINGS-01's `settingsScreens.test.tsx` "Z3 · Notifications › shows the loading view" fails about one run in three without load. Find the cause and make it deterministic without weakening what it checks.

## Capability checks

- [ ] No feature keeps a copy of the toast; both notices look as before (pictures, light and dark).
- [ ] The All chip matches X3's spacing; every other chip on every screen is unchanged.
- [ ] A creator with no photo shows initials on Home and Explore.
- [ ] The Z3 test passes 20 runs in a row.
- [ ] `npm run check` exits 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
