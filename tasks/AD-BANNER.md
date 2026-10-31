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
decisions: [R-92, R-116, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# AD-BANNER · The Explore slider's advert and Today's sponsored card are the owner's banner

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/AD-BANNER` on `origin/wmt/STORE-BUY-APP` `0d730a7a`. App only: no backend change, no new package, no native change (fingerprints unchanged, android `e871fe1a`, ios `e8e7de85`). Held for the next batch; nothing sent to a phone. Status verifying.

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

## Pictures

390 px (2x), dark and light, the built screen beside its board, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ad-banner/shots/`:

- Today beside H1: `board-today-{dark,light}.png` (single: `today-{dark,light}.png`, card only `today-card-{dark,light}.png`).
- Explore beside X1 and X17: `board-explore-{dark,light}.png` (single: `explore-{dark,light}.png`); each of the owner's four banners on the slider: `explore-{dark,light}-slide{1,2,3,4}.png`, and the four stacked: `explore-strip-{dark,light}.png`.
- TGIF unchanged: `tgif-{dark,light}.png` (the sponsored step: tall portrait, words, "Register now", Skip).

Taken from this branch's web export against a LOCAL Hub (backend `origin/main` `66f1e05`, `scripts/dev/stack.sh`, ports 11840 to 11849 plus a storage stand-in on 11850, database `test_adbanner`, `npm run db:seed`), the four campaigns made by the lead's `create-ads.mjs --art-set original --destination link` ("every campaign reads back right"), the owner's original files as the landscape and portrait pictures. Scripts: `.../ad-banner/tools/shoot.py`, `compose.py` (not committed). Measured on the page: the Today card and the Explore card are both 350 x 103.703 at 390 wide (350 x 8 / 27 = 103.704); the frame holds that height on all four slides. The web build runs with web security off in the test browser only because the stack's CORS list does not include a stand-alone export port.

Look: the whole banner is shown with no crop on all four; the chip is small, top right, and legible on the light banners (1 and 3) and the dark one (2); on banner 1 it sits over the right edge of the painted "One SOUEAST Car" stamp (it hides part of the word "One"). That is the owner's art under the chip he asked for; moving the chip to another corner would cover the painted logo or the "Powered by" line, so it is left in the corner that covers least. The board H1 and X1 still draw the old 196 high card with words (they are not redrawn: R-116 overrides them, as BRIEF rule 1 allows for a ruling; the designer's boards are the lead's to update).

## PHONE CHECK (owner's phone list, before the update)

- Explore: swipe the slider through the four banners with a thumb while the page is at the top: it pages one banner at a time, never sticks halfway, and the page behind does not scroll sideways or jump.
- Explore with a featured event running (event, advert, event, advert): the frame grows and shrinks smoothly under the thumb between the 196 event card and the shorter banner; the rows under it move with it and nothing flickers.
- Today and Explore: the banner shows whole (no cropped text), sharp, with only SPONSORED in the corner; the painted "REGISTER NOW" is readable at the phone's size.
- Tap a banner (a link campaign): the phone's browser opens the advertiser's address and Back returns to the app on the same screen. Tap the banner of a campaign set to "Does nothing": nothing happens, no ripple.
- A screen reader (TalkBack): the card reads "Sponsored. Win a car and more. Enter WHO MADE THIS? today. Register now" as a button.
- Dark and light theme: the chip and the dots stay readable on the light banners.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`; `DECISIONS.md` R-92, R-116, R-47.
- `src/features/explore/AdSlide.tsx`, `ExploreSlider.tsx`, `src/features/ads/SponsoredSlot.tsx`, `look.ts`, and `src/features/ads/__tests__/*`.

## Goal

The owner's wide banner is what a person sees on Explore and on Today: the whole picture, full width, with only the SPONSORED chip over it.

## Scope

`wawu-wmt-mobile` only: `src/features/explore/AdSlide.tsx`, `ExploreSlider.tsx`, `src/features/ads/SponsoredSlot.tsx`, `look.ts`, the tests above, `DECISIONS.md` (R-116), `docs/LOG.md`, this file. Not touched: the TGIF reader and `SponsoredStep`, the Hub, the dashboard (its landscape hint, 1920 x 1080, is the Hub's and is for the lead to change), the Explore skeleton's 196 block (X14: it holds the place of whatever comes first).

## Capability checks

- [x] A user on Explore sees each advert as the banner's shape at the slide's full width with the whole picture, and only the SPONSORED chip over it (`slider.test.tsx`; page measure 350 x 103.703 in the pictures).
- [x] A user on Today sees the same card at the same shape (`adCardSize.test.tsx` at 360 and 390 wide; `adLink.test.tsx`; pictures).
- [x] A user swiping the slider on Android pages between an advert and an event and the frame follows (`bannerAndroid.test.tsx`, `Platform.OS` android, the real `onScroll` handler, nested scrolling and paging on).
- [x] A user tapping a link card on Android opens the address in the phone's browser (expo-linking) and one tap is counted; a card that does nothing opens nothing and counts no tap; no pill is drawn on either (`bannerAndroid.test.tsx`, `adLink.test.tsx`).
- [x] The card's words are its accessibility label; a `none` card is read as an ad, not a button.
- [x] The TGIF card is unchanged (`ReaderSponsored.test.tsx` passes untouched; picture).
- [ ] On a phone: NOT RUN (no device in this session); see PHONE CHECK. The Android back button, the keyboard and permissions do not touch these two cards (no screen opens, no input, no permission), so they are not on the list.

## Proof of the ruling (grep, R-116 carried out everywhere)

- The only users of the shared card are Today (`TodayScreen.tsx` via `SponsoredSlot`) and the Explore slider (`ExploreSlider.tsx`); the only places the app asks for an ad are `today_slot`, `explore_slider` and `tgif_card` (the last is the unchanged reader). `rg "slotButton|button=|-shade|contentFit=\"cover\""` over the card files finds nothing; the card's style is `aspectRatio: 1350 / 400` with `contentFit="contain"`.
- Pictures above show it on both screens in both themes.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AD-BANNER.md](history/AD-BANNER.md).

