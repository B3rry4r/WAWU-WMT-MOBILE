---
id: SERVICES-FEEDBACK
title: Listing a service stops feeling dead (tap feedback on the two doors, a pending listing on Me, back to the form after Become a creator)
owner: YOU
area: APP
order: -1258
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-29, R-41, R-47, R-6]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# SERVICES-FEEDBACK · Listing a service stops feeling dead

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/SERVICES-FEEDBACK` on `origin/main` `bc525c61`. App only: no backend change, no native or package change, no new route (the Android fingerprint is unchanged). Status verifying. Cause: the owner's boss said tapping to list a service "does nothing"; the SERVICES-CHECK audit found the flow works but three places feel dead.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | The Create hub's Service tile and Explore's "List your services" door ran two reads one after the other (`door.ts`) with nothing on screen, and a second tap started two more | the tile and the door show the app's own spinner and keep their pressed look the moment they are tapped; a second tap while the reads run does nothing; a read that fails leaves the person where they are with the shared bottom Toast (alert tone): "No connection. Check your internet and try again." or "Something went wrong. Try again." The reads are no longer retried behind the spinner |
| 2 | After "Send for review", Me's Services tab said "No services yet" (`liveListings` drops a pending listing) | the person's own pending listing is a row on Me, Services, after the live ones: its headline, the P8 "Under review" chip where the chevron is, "Only you can see it" under it; it opens Your listings (P8). Turned-down and hidden listings are still not drawn; "No services yet" shows only when nothing is live, pending or paid |
| 3 | A buyer who tapped "Become a creator" on the listing gate (P10) went to A11 (Set up your account) with nothing saying where to return; Later called `back()`, or went Home when no history was held | P10 opens A11 with `?next=professional-apply`; A11's Later returns to the listing form (P5), by popping to it, or replacing A11 with it when no history is held. A `next` that is not on the short list in `setupReturn.ts` is ignored (a path is never followed) |

Only the owner sees a pending listing: it is read from `GET /professionals/applications/mine` (the person's own list), which a visitor's profile never calls; a visitor still gets the Hub's live listings only (test: the visitor Services tab shows no "Under review" and asks for no own list).

Defaults chosen (lead), owner may override:
- Default (lead), owner may override: the failure line uses the app's own words, never the Hub's sentence (as Explore's follow notice does), at the bottom as a Toast, not a full-screen error; the screen stays and a tap asks again.
- Default (lead), owner may override: the door's spinner takes the place of its icon (the Create button floats over the row's right end, which hid a spinner placed there); the Create tile's spinner sits in its top right corner.
- Default (lead), owner may override: the pending row's line is "Only you can see it" and the whole row opens Your listings, where the status card is; "Under review" is P8's own word and tone (warning).
- Default (lead), owner may override: "creator setup finishes" is A11's Later, its only exit; the rows inside A11 (paid messages, profile, publish, community, wallet) keep their own backs.

Gap rows (R-29, no board draws these states): G-SERVICES-FEEDBACK-1 (M2's pending row), G-SERVICES-FEEDBACK-2 (the tile and door working and failed states), both for the designer in `BACKEND_GAPS.md`.

Three existing assertions were changed, each pinning the defect the brief names (the sweep rule): `MeScreen.test.tsx` (the pending l2 row is now drawn; its headline is on two rows, so `getByText` became `getAllByText(...).toHaveLength(2)`) and `afterSignup.screens.test.tsx` (P10's push now names `next`). Everything else is new tests.

Tests, red first on `bc525c61` then green: `pro-listing/__tests__/doorFeedback.test.tsx` (6: both doors, real routes: working at once, second tap does nothing, a failed first and a failed second read), `me/__tests__/servicesPending.test.tsx` (6, 4 red), `pro-listing/__tests__/becomeCreatorReturn.test.tsx` (4, real router, 2 red), one added test in `visitor/__tests__/VisitorProfileScreen.test.tsx`.

Pictures (390 px web export, light and dark pairs, local stack `svcfb`): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/services-feedback/pics/` (01 and 02 Create tile working and failed, 03 and 04 Explore door working and failed, 05 and 06 Me Services under review and its row opening Your listings, 07 to 09 buyer gate, A11 and back on the form).

NOT RUN: a phone (the web export only); the long-press and keyboard ring on the working tile; the screen reader announcement of `busy`.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, `DECISIONS.md` R-27, R-29, R-41, R-47
- boards P4 to P8 (`python3 scripts/design/render_design.py P4 P5 P7 P8 P10 M2`), `docs/designer/BRIEF.md` (M2 only: tabs; no entry for P4 to P8)
- `src/features/pro-listing/door.ts`, `useListServicesDoor.ts`, `ApplyScreen.tsx`, `src/features/me/ServicesTab.tsx`, `src/app/creator-setup.tsx`

## Goal

A person who taps to list a service sees something happen at once, sees their own listing under review on their profile, and after becoming a creator lands back on the listing form.

## Scope

`wawu-wmt-mobile` only: `src/features/pro-listing/` (`door.ts`, `useListServicesDoor.ts`, `ApplyScreen.tsx`), `src/features/create/CreateScreen.tsx`, `src/features/explore/` (`DoorsCard.tsx`, `ExploreScreen.tsx`), `src/features/me/` (`ServicesTab.tsx`, `MeScreen.tsx`, `model.ts`), `src/features/after-signup/setupReturn.ts`, `src/app/` (`create.tsx`, `(tabs)/explore.tsx`, `creator-setup.tsx`), their tests, `BACKEND_GAPS.md`.

## Capability checks

- [x] A user can tap Service on Create or "List your services" on Explore and see it working at once, and a second tap while it runs does nothing.
- [x] A user whose connection fails on that tap is told so, stays on the screen, and can tap again.
- [x] A creator who sent a listing for review sees it on Me, Services, marked "Under review", and the row opens Your listings.
- [x] A visitor on somebody else's profile sees live listings only.
- [x] A buyer can tap Become a creator, finish A11 with Later, and be back on the form to offer services (also when no history is held).
- [ ] On a phone: NOT RUN.
