# ADS-01 verifier report (mobile wmt/ADS-01 2ad9e47, on main 3117807; verified 16 Oct 2026)

Evidence folder: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ads-01-v (logs/, pics/, py/).
Verdict: merge (nothing medium or worse). Five lows, listed below as SWEEP-APP rows.

## Passes
| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | typecheck, lint, gates (10 gates, 590 files, 0 fail, 5 warn, 0 accepted, same warns as builder), tasks (283) EXIT 0: logs/check-branch.log. Jest: tgif + home + ads 9 suites 150 tests pass (HomeScreen, TgifReader, ShareSheet, model tests are main's, unchanged); two other suites that import the touched files pass (24 tests). Not re-run: the other ~150 suites (builder: 159 suites, 2878 tests; typecheck clean covers the contract refresh). |
| V4 | passed, one low | admin-written fields headline, subline, ctaLabel, ctaDestinationId, artworkUrl are each read by a screen; `advertiser` is served and read by none (low 4). |
| V5 | passed | pics/cmp-H33-dark.png, cmp-H33-light.png, cmp-H36-dark.png, cmp-H36-light.png (artboard left, built right, 390 px). Differences: phone status bar, "Ads keep TGIF free" (G-760, owner), Hub data (series name, no wallet, Schools vs Shop tile). Progress bar is 6 segments with 5 lit as drawn. |
| V6 | passed | every state entered by its cause (route held, 500, 403, aborted, HTML body, data null, {}, array, no data key, unknown destination, no headline, no button word, no event id): reader keeps 5 segments and no POST; Today with TGIF off shows nothing, no gap, no banner (logs/t2.log, pics/T2-today-500.png). |
| V9 | passed | real wawu-id (no injected token): two accounts registered, email verified from the id's log code, signed in through the app's own Sign in screen; the card text, event and price came from the Hub's database (pics/H33-*.png). |

## Attacks run (stack ads_01, real wawu-id, Hub on backend main 3797fb2)
- No campaign: reader 5 segments, Done on card 5; Today TGIF on asks no `today_slot`; TGIF off draws nothing. Same as main.
- Late campaign: arrives on the takeaway -> never shown, no POST, still 5 of 5. Arrives on the prayer (card 4) -> 6 segments, next shows the card, skip lands on the takeaway. Arrives on card 1 -> 6 segments.
- Counting: one session = exactly one view, one tap, one skip POST (reader), one view and one tap (Today). Two people + a second session by the first: Hub holds 2/2/2 (AdEvent per person, AdDailyTotal 2,2,2). Paused campaign: tap and skip are answered 404, swallowed, event still opens, skip still goes on, no alert on screen.
- Today not in front: slot response held, switched to Explore, response lands -> no POST; back on Home -> one view. Four tab switches -> still one POST. Double-click on the slot pushes one event page.
- Mutants (jest src/features/ads, 46 tests): view without the in-front test, no once-guard, no late-arrival guard, skip not reported, today asked while switch pending, unknown destination drawn: all six killed (1 to 3 failures each).
- Contract refresh (SHARED-CHANGES ADS-01 #1): 417 -> 438 paths, 0 paths and 0 schemas removed, no method set changed.
- Labelled: "SPONSORED" chip on H33 and label on H36, present in every state with a card, light and dark. No literal figure or em-dash in src/features/ads.

## Findings (all low; owner questions G-760 and G-761 are not findings)
1. low, SponsoredStep.tsx:66-67 with TgifReader.tsx:309: Skip (x 332-366, y 767-784 at 390x844) sits under Next (card 4) and Done (card 5), same spot as main's Next-to-Done overlap. A double tap on Skip lands on Done and closes the reader before the takeaway; a double tap on Next at card 4 skips the ad unseen (view and skip counted). Repro: sponsored step, dblclick `sponsored-skip` (logs/t1d.log, pics/T1d-takeaway-after-skip.png).
2. low, SponsoredSlot.tsx:42,70: at 320 px with a picture the words column is so narrow that "SPONSORED" breaks letter by letter ("SPON / SORE / D"). Repro: viewport 320x568, TGIF off, card with artwork (pics/M-320.png, panel 3).
3. low, SponsoredSlot.tsx:43,52,71: Hub-allowed maximum text (headline 60, button word 24, ADS-06 limits) is cut at 390 px: with a picture the headline reads "Gospel Ni..." and the button word "Get your tickets n..." (pics/M-today-dark.png, panel 3). ADS-06's limits say the card holds them; it does not.
4. low, api.ts:37: `advertiser` is served by the Hub (ads-text-limits.ts calls it "SPONSORED · <advertiser>") and kept by `drawable()` but no screen shows it; the artboards draw "SPONSORED" alone. Lead to rule whether the name belongs on the chip.
5. low, SponsoredStep.tsx:17-22, SponsoredSlot.tsx:40 (next to G-761): an artwork link that is set but will not load leaves an empty 104-wide column on Today (pics/M-today-dark.png panel 2) and a near-black shaded ground on the reader (M-reader-dark.png panel 2). With no artwork the reader card sits on the takeaway's own purple ground (G-761, owner) and differs from the takeaway only by the SPONSORED chip and the button.

## SWEEP-APP rows (paste into tasks/SWEEP-APP.md)
| ADS-01 | 1 | Skip on the sponsored step sits under Next and Done: a double tap on Skip closes the reader, a double tap on Next at card 4 skips the ad unseen. | `verify/ADS-01.md`, finding 1 |
| ADS-01 | 2 | At 320 px with a picture the Today slot's SPONSORED label breaks letter by letter. | `verify/ADS-01.md`, finding 2 |
| ADS-01 | 3 | The Today slot cuts the longest words the Hub allows (headline to "Gospel Ni...", button word to "Get your tickets n..."); ADS-06's limits and the slot disagree. | `verify/ADS-01.md`, finding 3 |
| ADS-01 | 4 | `advertiser` is served and read by no screen; the Hub's own comment says "SPONSORED · <advertiser>". | `verify/ADS-01.md`, finding 4 |
| ADS-01 | 5 | An artwork link that will not load leaves an empty picture column (Today) and a near-black ground (reader). | `verify/ADS-01.md`, finding 5 |

## Not run
Full jest of the other suites (CI cannot run mobile; the builder's local run is theirs), iOS and Android devices (web export at 390 px only), push of anything.

## Clean-up
Stack ads_01 down, artwork static server stopped, worktrees v-ads-01-* removed, ports 7280-7287 checked.
