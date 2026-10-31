# AD-BANNER · round history

Moved out of [tasks/AD-BANNER.md](../AD-BANNER.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/features/explore/AdSlide.tsx` (rewritten to the banner card), `ExploreSlider.tsx` (frame follows the swipe, dots pill on an advert), `src/features/ads/SponsoredSlot.tsx`, `look.ts`; tests: `adCardSize`, `adLink`, `TodaySponsored`, `slider` (changed, listed above) and `bannerAndroid` (new); `DECISIONS.md` R-116; `docs/LOG.md`; this file.
- Not done: nothing from the brief. Not run: a real phone (PHONE CHECK).
- No `SHARED-CHANGES.md` row: no fenced file changed. No `BACKEND_GAPS.md` row: the Hub already serves the banner as the landscape picture.

## AD-SLIDE builder report (31 Oct 2026, second commit on this branch)

- Files: `src/features/explore/useSliderAutoplay.ts` (new), `ExploreSlider.tsx` (the hook, the pager's touch and drag handlers, views held while the slide back passes slides), `ExploreSkeleton.tsx` (the loading block at the banner's height), `src/features/events/ExploreEvents.tsx` (the unused `ExploreFeaturedEventSkeleton` removed), `explore/__tests__/sliderAuto.test.tsx` (new, 38 cases on android and ios), `explore/__tests__/screens.test.tsx` (two assertions, the 196), `DECISIONS.md` (R-116 point 4), `docs/LOG.md`, `tasks/AD-BANNER.md`, this file.
- Not done: nothing from the brief. Not run: a real phone (PHONE CHECK, six lines for AD-SLIDE). The machine's root volume ran out of space once while the stack was building (0 MB free for a moment, other agents' files); my own Metro cache was deleted to carry on and nothing was lost.
- No `SHARED-CHANGES.md` row: no fenced file changed. No `BACKEND_GAPS.md` row.

### AD-SLIDE, what changed row by row (moved out of the task file's Current state)

| # | Before | After |
|---|---|---|
| 1 | the slider moved only by a swipe | `src/features/explore/useSliderAutoplay.ts` (new) moves it by itself: one timer, set again 5 s after each move of its own, after a finger lifts, after Explore comes back to the front and after the app comes back; cleared on every pause and on unmount |
| 2 | one pager, no touch handlers | the pager's own `onTouchStart` / `onTouchEnd` / `onTouchCancel` and `onScrollBeginDrag` / `onScrollEndDrag`: held while either a touch or a drag is on, so a cancelled touch (the phone cancels it when the pager takes the drag) does not start it mid-swipe |
| 3 | the slide back across several slides would have counted a view for every advert it passes | the views are held while the slide back to the first passes two or more slides, until the pager lands (or 1 s): an advert passed on the way is not an advert seen. A forward move is one slide and counts as a swipe does |
| 4 | reduce motion not read | `AccessibilityInfo.isReduceMotionEnabled` plus the `reduceMotionChanged` event; until the phone has answered, and if it cannot, nothing moves by itself (a swipe still pages it) |
| 5 | AppState not read | `AppState` `change`: `background` and `inactive` (iOS) stop it; back to `active` starts 5 s later |
| 6 | the Explore loading block (X14) 196 high (`ExploreFeaturedEventSkeleton`) | the banner's shape (27 by 8) at the slider's width, the screen less the body's two gutters (350 by 103.7 on a 390 phone), so the page does not jump when an advert arrives first (the verifier's low on AD-BANNER). `ExploreFeaturedEventSkeleton` is removed with what it replaces (nothing else used it) |
| 7 | no screen-reader work | nothing calls `setAccessibilityFocus`, `sendAccessibilityEvent` or `announceForAccessibility`, and a test pins that |
