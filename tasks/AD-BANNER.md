---
id: AD-BANNER
title: The ads on Explore and Today take the owner's wide banner shape, 1350 x 400, the whole picture
owner: YOU
area: APP
order: -10990
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-92, R-116, R-118, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# AD-BANNER · The Explore slider's advert and Today's sponsored card are the owner's banner

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/AD-BANNER` on `origin/wmt/STORE-BUY-APP` `0d730a7a`; a second commit on the same branch (AD-SLIDE, below) makes the Explore slider slide by itself. App only: no backend change, no new package, no native change (fingerprints unchanged, android `e871fe1a`, ios `e8e7de85`). Held for the next batch; nothing sent to a phone. Status verifying.

Owner, 31 Oct 2026, sending his 1350 x 400 "10 Prizes for Creators" banner: "the ads on the app both explore and home should be reduced to this orientation". Recorded as R-116 in `DECISIONS.md`.

| # | Before (`0d730a7a`) | After |
|---|---|---|
| 1 | Explore slider advert: 196 high, the picture cropped to fill (`cover`) under a fade, with the headline and line drawn over it | the banner's own shape, 27 by 8 (1350 x 400), at the full width the screen gives it (350 on a 390 phone, 103.7 high); the whole picture (`contain` on the exact shape, nothing cropped) |
| 2 | Today sponsored card: the same 196 high card with a white pill for the button words | the same card, the same shape; no pill |
| 3 | headline and line drawn as text over the picture | not drawn; they are the card's accessibility label (`Sponsored. Headline. Line. Button words`) |
| 4 | the picture sits under a fade | nothing sits on the picture but the chip |
| 5 | the SPONSORED chip: 26 high, white at 20%, top left | the same chip, smaller (18 high, 9 at 700), the page colour at 55% behind white words so it reads on a light picture and a dark one, top right (the banners paint their logo top left) |
| 6 | slider frame: always 196 | the banner shape on an advert, 196 on a featured event (unchanged); between two slides of different heights the frame grows or shrinks with the swipe, so nothing jumps |
| 7 | slider dots: 16 in from the right, 14 up, level with the words | on an advert: 8 in, 8 up, on a small pill of the page colour so white dots read on a light picture; on an event: unchanged (16 in, 18 up) |
| 8 | a `link` card: whole card taps, plus a drawn pill | whole card taps (phone's browser, one tap counted); no pill, the painted button is the call |
| 9 | a `none` card: not tappable, no role | unchanged |
| 10 | the TGIF card (portrait 1080 x 2340, words, pill, Skip) | unchanged: R-92 stands there (picture `shots/tgif-{dark,light}.png`) |

One shared card (`src/features/explore/AdSlide.tsx`), used by both places; no fork. `SponsoredSlot` (Today) lost its `button` prop; `look.ts` lost the pill's three metrics; the card's fade, words and pill code is removed with the thing it replaces.

**Default (lead), owner may override** (from the brief): the app draws the picture and only the SPONSORED chip; the headline and line stay as the card's label; a `link` campaign keeps its whole-card tap and drops the drawn pill on these two cards; a `none` campaign stays not tappable. Builder choices inside that: the chip goes top right and is smaller and darker than the old one (the owner's banners paint their logo top left and the chip must read on his light pictures); the dots get a small dark pill on an advert for the same reason; the frame follows the swipe between slides of different heights (the Hub serves events and adverts in one slider, and an event is still 196).

### Changed assertions (named, with why)

All are R-116 consequences: the card is a different shape and draws no words. No assertion was loosened to pass; each now pins the new behaviour.

| Test | Was | Now |
|---|---|---|
| `ads/__tests__/adCardSize.test.tsx` | Today and Explore cards `height` 196 and equal | `aspectRatio` 27 / 8 and equal, `height` undefined at both places (jest has no layout engine, so the shape is what can be pinned; the screenshots measure the real 350 x 103.7) |
| `ads/__tests__/adLink.test.tsx` "a link ad is one button" | read `today-sponsored-cta` as "Visit us" | the button is still named "Sponsored. Shop with Acme. Lagos. Visit us"; no `-cta` and no `-button` is drawn |
| same, "an ad that does nothing" | read `today-sponsored-headline` as "Shop with Acme" | no headline text is drawn; the label assertion that was already there still holds |
| same, "is the Explore slide at the Explore size" | 196 high, corner 24, the same fade (`-shade`), no `explore-ad-button` | `aspectRatio` 27 / 8, no height, corner 24, `contentFit` contain, no `-shade`, no `explore-ad-button`; both places equal |
| same, "an event ad is still one button with its pill" | `today-sponsored-button` present | still one button; the pill is not drawn |
| `ads/__tests__/TodaySponsored.test.tsx` (two tests) | read `-headline`, `-subline`, `-cta`, `-button` as drawn text | none of them is drawn; the card's `accessibilityLabel` carries the same words (exact strings pinned); the artwork source is still pinned |
| `explore/__tests__/slider.test.tsx` "an advert, then an event, then an advert" | `getByText('Gospel Night Live')` and its line; dots `bottom: 14` | those words are not drawn (label pinned instead); dots `right: 8, bottom: 8` on an advert; the 18 up on an event is the untouched next test |

New tests: `slider.test.tsx` (the frame is the banner shape on an advert, 196 on an event, the blend between, and the same height for a pager of adverts only), `ads/__tests__/bannerAndroid.test.tsx` (4 cases, `Platform.OS` android).

### AD-SLIDE · the Explore slider slides by itself (owner, 31 Oct 2026: "Ads should be sliding automatically"; R-116 point 4)

**Default (lead), owner may override** (the lead's brief; every number is the brief's): every 5 seconds, the swipe's own animated scroll, back to the first slide after the last; only with two or more slides, while Explore is the screen on show (the slider's `showing`), with the app in front and the phone's reduce-motion setting off; a touch or a drag pauses it and it starts again 5 seconds after the finger lifts; it never moves a screen reader's focus; the dots follow. Today's card is one card and never slides.

What changed (the row-by-row table is in [history/AD-BANNER.md](history/AD-BANNER.md), AD-SLIDE builder report): one new file, `useSliderAutoplay.ts`, holds the timer, the touch and drag pause, the reduce-motion and AppState reads and the hold on views during the slide back; `ExploreSlider.tsx` uses it; the Explore loading block is the banner's height and the unused 196 skeleton is removed.

Views and taps are counted as before (one view per advert per person per day at the Hub, taken when its slide is on screen; an automatic move is never a tap). No Hub change, no new package, no native change.

### Changed assertions, AD-SLIDE (named, with why)

| Test | Was | Now |
|---|---|---|
| `explore/__tests__/screens.test.tsx` "a user sees the slider block, at the advert banner height, while Explore loads (X14, R-116)" (renamed from "...the featured event block...") | the loading view held `"height":196` | the loading slider block (`explore-loading-slider`) is the banner's shape at the slider's width, `(window width less two gutters) x 8 / 27`, and is not 196 |
| same file, "keeps X14, hero block included, while the events read is held, then draws the tiles once" | the loading view held `"height":196` | the same banner height |

Both pinned the defect the verifier named (a low on AD-BANNER: the skeleton's slider block is 196 where the first slide is the banner), which the lead's brief rules a fix; no other assertion changed. New tests: `explore/__tests__/sliderAuto.test.tsx`, 19 cases run on `Platform.OS` android and again on ios (38), with fake timers and the pager's real handlers: advances at 5 s with `scrollTo({ x, animated: true })` and the label and dots follow; loops from the last to the first; takes an advert, an event and an advert in turn; the slide back does not count the adverts it passes, only the one it lands on, and releases after 1 s if the landing is never seen; one view per advert and never a tap over two laps; pauses on touch and resumes 5 s after `touchEnd`; pauses for a whole drag, including a `touchCancel` that arrives after `scrollBeginDrag`, and resumes 5 s after `scrollEndDrag` from the slide the person is on; a cancelled tap resumes; stops while `showing` is false and starts 5 s after it is back; stops on `background` and `inactive` and starts 5 s after `active`; does not start when the app opens in the background; nothing with one slide (no timer at all); nothing with reduce motion on, stops when it is turned on mid-run and carries on when it is turned off, and waits for the phone's answer; never touches the screen reader's focus or announcements; every timer and listener is cleared on unmount, also in the middle of the slide back. Each behaviour was also checked by removing it and seeing its tests fail (held views, touch pause, reduce motion).

## Pictures

390 px (2x), dark and light, the built screen beside its board, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ad-banner/shots/`:

- Today beside H1: `board-today-{dark,light}.png` (single: `today-{dark,light}.png`, card only `today-card-{dark,light}.png`).
- Explore beside X1 and X17: `board-explore-{dark,light}.png` (single: `explore-{dark,light}.png`); each of the owner's four banners on the slider: `explore-{dark,light}-slide{1,2,3,4}.png`, and the four stacked: `explore-strip-{dark,light}.png`.
- TGIF unchanged: `tgif-{dark,light}.png` (the sponsored step: tall portrait, words, "Register now", Skip).

AD-SLIDE pictures, 390 px (2x), dark and light, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ad-banner/shots-slide/`:

- Explore beside X1: `board-slide-explore-{dark,light}.png` (X1 design | slide 1 at 2 s | slide 2 at 6 s | back on slide 1 at 22 s). Single shots: `explore-{dark,light}-t02s-slide1.png`, `explore-{dark,light}-t06s-slide2.png`, `explore-{dark,light}-t22s-slide1-again.png`.
- The loading skeleton beside X14: `board-slide-loading-{dark,light}.png` (X14 design | built loading | the advert arrived); single `loading-{dark,light}.png`. The loading block and the first slide are both 350 x 103.703 at the same place (measured on the page), so nothing moves when the advert arrives.

Taken from this branch's web export against a LOCAL Hub (backend `origin/main` `66f1e05`, `scripts/dev/stack.sh` `--with mobile`, ports 11840 to 11849 plus a storage stand-in on 11850, database `test_adslide`, `npm run db:seed`, the four campaigns made by `create-ads.mjs --art-set original --destination link`: "every campaign reads back right"; stack down, database dropped, nothing listening). The script watched the pager's own label on the page and logged each change: slide 2 at 5.15 s, slide 3 at 10.16 s, slide 4 at 15.24 s (dark; light 5.17, 10.13, 15.13), then back across 3 and 2 to slide 1 by 20.49 s (20.50 light): five seconds a slide, then the slide back, then slide 1 again. Scripts: `.../adslide-b/tools/shoot_slide.py`, `compose_slide.py` (not committed). The boards X1 and X14 still draw the old 196 card and the 196 loading block (not redrawn: R-116 overrides them; the designer's boards are the lead's to update).

Taken from this branch's web export against a LOCAL Hub (backend `origin/main` `66f1e05`, `scripts/dev/stack.sh`, ports 11840 to 11849 plus a storage stand-in on 11850, database `test_adbanner`, `npm run db:seed`), the four campaigns made by the lead's `create-ads.mjs --art-set original --destination link` ("every campaign reads back right"), the owner's original files as the landscape and portrait pictures. Scripts: `.../ad-banner/tools/shoot.py`, `compose.py` (not committed). Measured on the page: the Today card and the Explore card are both 350 x 103.703 at 390 wide (350 x 8 / 27 = 103.704); the frame holds that height on all four slides. The web build runs with web security off in the test browser only because the stack's CORS list does not include a stand-alone export port.

Look: the whole banner is shown with no crop on all four; the chip is small, top right, and legible on the light banners (1 and 3) and the dark one (2); on banner 1 it sits over the right edge of the painted "One SOUEAST Car" stamp (it hides part of the word "One"). That is the owner's art under the chip he asked for; moving the chip to another corner would cover the painted logo or the "Powered by" line, so it is left in the corner that covers least. The board H1 and X1 still draw the old 196 high card with words (they are not redrawn: R-116 overrides them, as BRIEF rule 1 allows for a ruling; the designer's boards are the lead's to update).

### WALK1031-FIX · the Fable walk of the phone update (F1, F3 here; F2 and F5 below) (31 Oct 2026; R-116, R-118)

Built by a Sonnet builder (T1), mobile `wmt/WALK1031-FIX` on `origin/wmt/BATCH-1031` `41427d6f`. App only: no Hub change, no new package, no native change (fingerprints unchanged, android `e871fe1a`, ios `e8e7de85`, read with `npx expo-updates fingerprint:generate`). Held for the next batch; nothing sent to a phone. Pictures: at the end of this section. **Supersedes rows 5 and 7 of the table above** (the chip's 9 px and the dots' pill on the picture).

**Default (lead), owner may override** (the lead's brief; recorded under R-116): on an advert slide nothing of ours is drawn on the picture except the SPONSORED chip.

| # | Walk finding | Before (`41427d6f`) | After |
|---|---|---|---|
| F1 MEDIUM | the pager dots, on a small dark pill 8 in and 8 up, sat on the banner's painted "REGISTER NOW" (bottom right, where the owner's banners paint it) and hid part of it | dots and pill on the picture at the bottom right | on an advert the dots are off the picture: a centred row under the card, in the page's colours (the current dot `accent`, the rest `textMuted`, 6 high, the current one 16 wide), and the slider is that row taller (8 gap + the 6 dot = 14) only while an advert is the slide on show; between an advert and an event the row grows and shrinks with the swipe, exactly as the frame does (`sliderRowHeight` beside `sliderFrameHeight`, one straight line, never a jump); a pager of adverts only keeps the row all the way; an event slide keeps its white dots on the card (16 in, 18 up, as drawn, X16); one slide has no dots and no row; Today's single card is unchanged |
| F3 LOW | the SPONSORED chip's words were 9 px | 9 | `type.size.label`, 11, the app's smallest type token; the chip is still 18 high, 6 in from the top and the right (the corner the banners leave bare: logo top left, call bottom right) |
| F2 LOW | course step 2 said "The first lesson is free. The rest unlock when someone buys the course." beside step 3's "Your preview is the first 30 seconds of your first lesson" | the old line | `lessonsLine` (`create/model.ts`): "Your preview is the first 30 seconds of your first lesson, made for you. With two or more lessons, the first plays free and the rest unlock when someone buys the course." The first sentence is step 3's own words (`previewLine('course', 'cut')`; with a first lesson that is not a video it is step 3's cover words). See the finding below |
| F5 records | `DECISIONS.md` at `41427d6f` had no heading for R-109, R-113, R-114 | none | R-109 and R-113 added word for word from `origin/wmt/STUDIO-HOME` (R-109 is also on `origin/wmt/STUDIO2-CUT` and the S2 branches); R-114 had no DECISIONS entry on any of the 556 remote branches, so the lead gave its wording (lead ruling, 30 Oct 2026, 08:06, after the owner's "if videos don't show preview what else doesn't show preview": "an optional cover on every piece") and the heading says exactly that |

**Finding for the lead (F2, hard rule 4: the live system first).** The brief's line for F2 said every lesson unlocks when someone buys the course. The live Hub (backend `origin/main` `37bbe96`, `src/content-piece/course-lessons.service.ts` `freeLessonCount`, and `content-detail.service.ts`) makes the first lesson of a course of two or more lessons free to play IN FULL for anyone who may open the piece (`isFree`, the app's "Free" tag on lesson 01 and its play, `ContentDetailScreen.tsx`), while the piece's PREVIEW (the card and the listing) is the first 30 seconds of that lesson (R-118). A course of one lesson has none free. So "every lesson unlocks when someone buys" would have been false, and the old line was true for two lessons or more and false for one. The new line is true for both, in step 3's words. If the owner wants the first lesson locked (preview only), that is a Hub change to `freeLessonCount`, the "Free" tag on a lesson card (`LessonCard`, M21) and this line together; it is not made here.

### Changed assertions, WALK1031-FIX (named, with why)

| Test | Was | Now |
|---|---|---|
| `explore/__tests__/slider.test.tsx` "a user sees an advert, then an event, then an advert, with a dot for each and the first long" | dots `opacity` `[1, 0.45, 0.45]` and the dots container `right: 8, bottom: 8` (on the picture, on a pill) | dots have no opacity (page colours: the current one a different colour from the rest), the container is not placed on a corner, it is not inside `explore-hero` (the picture's frame) and is inside `explore-hero-dots-row` under it. F1 names the defect this pinned |

No other assertion changed; `adCardSize`, `adLink`, `bannerAndroid`, `sliderAuto` and `screens` pass untouched. New tests: `explore/__tests__/sliderDots.test.tsx` (17 cases, run on `Platform.OS` android and again on ios, fake timers, the pager's own scroll handler and the slider's own autoplay: the dots are in a row under the card and not on the picture, the card holds only the picture and SPONSORED, the colours in both themes, the height is a straight line between an advert (banner + 14) and an event (196) with no jump, a pager of adverts keeps its height, the event's white dots stay on the card and come back to the row, the long dot follows the autoplay and the slide back, one slide has no dots and no row, the chip's size is the smallest type token and its corner); `create/__tests__/model.test.ts` (4, `lessonsLine`); `create/__tests__/lessons.test.tsx` (1, run on android and ios: the line on the screen, the old line gone).

Proof of the ruling (hard rule 3): `rg "bannerRight|bannerBottom|bannerPadX|bannerPadY|dotsOnBanner" src` finds nothing; `rg "chipWords: 9"` finds nothing; the only places dots are drawn are `SliderDots` in `ExploreSlider.tsx` (Today has one card and never draws them); `rg "The first lesson is free" src` finds nothing.

**Pictures (31 Oct 2026, second pass, on the lead's paths).** In `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/walk1031-fix/shots/`: `board-explore-{dark,light}.png` (X1 design, advert 1, the event slide, advert 2, 390 x 844), `board-explore-360x640-light.png`, `board-explore-430x932-light.png`, `board-today-{dark,light}.png` (H1 beside Today, unchanged), `board-course-step2-{dark,light}.png` (M21 beside the built course step 2); single shots `explore-<w>x<h>-<scheme>-<n>-<advert1|event|advert2|advert3|advert4>.png`, the slider block alone `explore-390x844-light-{1-advert1,2-event}-block.png`, `today-390x844-{dark,light}.png`, `course-step2-390x844-{dark,light}.png`. Taken from the web export of `aaf3ee9c` against a LOCAL Hub (backend `origin/main` `37bbe96`, `scripts/dev/stack.sh` `--with mobile`, ports 11960 to 11969 plus a storage stand-in on 11970, database `test_w1031fix`, `npm run db:seed`, one featured event added to that database, the four campaigns made by `create-ads.mjs --art-set original --destination link`: "every campaign reads back right"; reduced motion on in the browser so the slider stays on the slide shot; stack down, database dropped, nothing listening). Scripts: `.../walk1031-fix/tools/shoot_walkfix.py`, `compose_walkfix.py` (not committed). Measured on the page (reports in `.../walk1031-fix/logs/shoot-report-*.json`): on an advert the dots row starts exactly at the card's foot (row 14 high, the dots 8 below the card, 6 high, centred), the slider block is the card plus 14 (117.7 at 390, 108.8 at 360, 129.5 at 430) and 196 on the event with no row; the SPONSORED chip is 86.4 x 18 with 11 px words, 6 in from the top and right of the card at all three widths; the Today card is 350 x 103.7 as before. Seen (banners 1 to 3 by eye, at 390, 360 and 430; banner 4's shots are in the folder): nothing but the chip is on the picture, and the owner's painted "REGISTER NOW" button (banners 2 and 3, bottom left under the words) and the logo are whole; the dots are accent and grey under the card, the event's white dots are on its card at the bottom right, and the page under the slider moves by the row only on an advert. One thing off, not new and not fixed: on banner 1 ("10 Prizes for Creators") the chip, now 86 wide (it was narrower at 9 px), covers the word "One" and the top of the painted "SOUEAST Car" stamp at the top right; the other corners hold the painted logo and "Powered by", so the corner stays. The old board X1 still draws the 196 card with words (R-116 overrides it).

## PHONE CHECK (owner's phone list, before the update)

- Explore: swipe the slider through the four banners with a thumb while the page is at the top: it pages one banner at a time, never sticks halfway, and the page behind does not scroll sideways or jump.
- Explore with a featured event running (event, advert, event, advert): the frame grows and shrinks smoothly under the thumb between the 196 event card and the shorter banner; the rows under it move with it and nothing flickers.
- Today and Explore: the banner shows whole (no cropped text), sharp, with only SPONSORED in the corner; the painted "REGISTER NOW" is readable at the phone's size.
- Tap a banner (a link campaign): the phone's browser opens the advertiser's address and Back returns to the app on the same screen. Tap the banner of a campaign set to "Does nothing": nothing happens, no ripple.
- A screen reader (TalkBack): the card reads "Sponsored. Win a car and more. Enter WHO MADE THIS? today. Register now" as a button.
- Dark and light theme: the chip and the dots stay readable on the light banners.
- AD-SLIDE, auto-slide feel (the one thing jest cannot show): open Explore with the four banners and leave the phone alone. Each banner stays about 5 seconds, then slides in the way a swipe does, the dots follow, and after the fourth it slides back to the first (a quick slide back across the others is expected) and carries on.
- AD-SLIDE, thumb: put a thumb on the slider (a hold, a swipe, a tap that opens a banner's link): it stops while the thumb is on it and moves again about 5 seconds after the thumb lifts, never mid-swipe. This is the one place a phone must show that a thumb on a banner reaches the pager's touch events (they bubble from the card to the pager; on Android the touch is cancelled when the pager takes a drag, which the drag events cover).
- AD-SLIDE, leaving: switch to another tab, open a banner's link, pull the notification shade down, or lock the phone: it stops, and starts again about 5 seconds after Explore is in front again. Count: the Hub's views for an advert go up once per day for the person, not per slide change.
- AD-SLIDE, reduce motion: turn on "Remove animations" (Android) or "Reduce Motion" (iOS) in the phone's settings: the slider never moves by itself, a swipe still pages it. Turn it off again while Explore is open: it starts moving (5 s after).
- AD-SLIDE, screen reader: with TalkBack or VoiceOver on and the focus on a banner, the slider still slides every 5 seconds; the screen reader's focus stays where it was and says nothing new when the slide changes. (If the owner finds an automatic slide unwelcome with a screen reader on, the lead's default can stop it there; it is not stopped today.)
- WALK1031-FIX, dots: open Explore with the four banners: the little dots are in a row under the banner (the current one purple and long, the rest grey), centred; nothing but SPONSORED is on the banner, and the painted "REGISTER NOW" is whole and readable in both themes. Swipe to a featured event: the dots move onto the event card (white, bottom right) and the page under it moves smoothly with your finger, no jump; swipe back: they return to the row. With only one banner there are no dots and no gap under it.
- WALK1031-FIX, chip: SPONSORED is readable at the phone's size (11) and never touches the banner's logo (top left) or its painted button (bottom right) on a small phone (360 wide) and a large one (430 wide).
- WALK1031-FIX, course step 2: add the lessons: the line under "Add the lessons" reads as step 3 does (the preview is the first 30 seconds of the first lesson) and says the first lesson plays free once there are two lessons.
- AD-SLIDE, loading: open Explore on a slow connection: the grey block where the slider will be is the banner's height, and the first banner arrives into it without the page jumping.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`; `DECISIONS.md` R-92, R-116, R-47.
- `src/features/explore/AdSlide.tsx`, `ExploreSlider.tsx`, `src/features/ads/SponsoredSlot.tsx`, `look.ts`, and `src/features/ads/__tests__/*`.

## Goal

The owner's wide banner is what a person sees on Explore and on Today: the whole picture, full width, with only the SPONSORED chip over it.

## Scope

`wawu-wmt-mobile` only: `src/features/explore/AdSlide.tsx`, `ExploreSlider.tsx`, `src/features/ads/SponsoredSlot.tsx`, `look.ts`, the tests above, `DECISIONS.md` (R-116), `docs/LOG.md`, this file. Not touched: the TGIF reader and `SponsoredStep`, the Hub, the dashboard (its landscape hint, 1920 x 1080, is the Hub's and is for the lead to change). The Explore skeleton's 196 block was left at first (it held the place of whatever comes first) and is the banner's height since AD-SLIDE. AD-SLIDE adds `src/features/explore/useSliderAutoplay.ts`, `ExploreSkeleton.tsx` and `src/features/events/ExploreEvents.tsx` (its unused skeleton removed).

## Capability checks

- [x] A user on Explore sees each advert as the banner's shape at the slide's full width with the whole picture, and only the SPONSORED chip over it (`slider.test.tsx`; page measure 350 x 103.703 in the pictures).
- [x] A user on Today sees the same card at the same shape (`adCardSize.test.tsx` at 360 and 390 wide; `adLink.test.tsx`; pictures).
- [x] A user swiping the slider on Android pages between an advert and an event and the frame follows (`bannerAndroid.test.tsx`, `Platform.OS` android, the real `onScroll` handler, nested scrolling and paging on).
- [x] A user tapping a link card on Android opens the address in the phone's browser (expo-linking) and one tap is counted; a card that does nothing opens nothing and counts no tap; no pill is drawn on either (`bannerAndroid.test.tsx`, `adLink.test.tsx`).
- [x] The card's words are its accessibility label; a `none` card is read as an ad, not a button.
- [x] The TGIF card is unchanged (`ReaderSponsored.test.tsx` passes untouched; picture).
- [x] AD-SLIDE: a user on Explore with two or more slides sees them move by themselves every 5 seconds with the swipe's animation, the dots following, and the last go back to the first (`sliderAuto.test.tsx`, android and ios, fake timers; the pictures' timeline 5.15 s, 10.16 s, 15.24 s, back on slide 1 by 20.49 s).
- [x] AD-SLIDE: a user who touches or swipes the slider stops it and it starts again 5 seconds after the finger lifts; it does not move while Explore is not on show, while the app is in the background or inactive, or with reduce motion on; with one slide there is not even a timer; nothing is left running after the screen goes (`sliderAuto.test.tsx`).
- [x] AD-SLIDE: a user's views are counted as before: the slide back to the first counts only the advert it lands on, never a tap (`sliderAuto.test.tsx`).
- [x] AD-SLIDE: a user sees Explore's loading block at the banner's height, the same as the first slide (`screens.test.tsx`, the pictures' measure 103.703 both).
- [ ] On a phone: NOT RUN (no device in this session); see PHONE CHECK. The Android back button, the keyboard and permissions do not touch these two cards (no screen opens, no input, no permission), so they are not on the list.

## Proof of the ruling (grep, R-116 carried out everywhere)

- The only users of the shared card are Today (`TodayScreen.tsx` via `SponsoredSlot`) and the Explore slider (`ExploreSlider.tsx`); the only places the app asks for an ad are `today_slot`, `explore_slider` and `tgif_card` (the last is the unchanged reader). `rg "slotButton|button=|-shade|contentFit=\"cover\""` over the card files finds nothing; the card's style is `aspectRatio: 1350 / 400` with `contentFit="contain"`.
- Pictures above show it on both screens in both themes.
- AD-SLIDE (R-116 point 4): the only pager of adverts is `ExploreSlider` (Today's `SponsoredSlot` is one card, and the TGIF reader steps by its own taps), and the only place a slide moves by itself is `useSliderAutoplay.ts`: `rg "setTimeout|setInterval" src/features/explore src/features/ads --glob '!**/__tests__/**'` finds only that file's two timers (the 5 s move and the 1 s held-views release). `rg "ExploreFeaturedEventSkeleton" src` finds nothing; `rg "196" src/features/explore/ExploreSkeleton.tsx` finds only the comment saying the board draws it. Pictures above show it on Explore in both themes.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AD-BANNER.md](history/AD-BANNER.md).

