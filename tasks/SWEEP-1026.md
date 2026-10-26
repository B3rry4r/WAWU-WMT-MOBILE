---
id: SWEEP-1026
title: App sweep: the low rows independent verifiers logged on 26 Oct 2026 (ads tap, paid-question lines, strip, Nuvion line, Passes card, pinch, records)
owner: YOU
area: SWEEP
order: -161
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-92, R-91, R-95, R-96, R-97, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# SWEEP-1026 · App sweep: the 26 Oct lows

## Current state

As of 26 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/SWEEP-1026` from `origin/main` `662d8dd7`. App and records only; no backend or dashboard change.

| # | Row (source) | Outcome | Commit |
|---|---|---|---|
| 1 | ADS-LINK: a tap on a no-link ad is counted (POST) | Fixed. `useAdReports` sends a tap only for a card that opens something (`adOpensSomething`), for both `tap` and `tapOf`; `tapOf` now takes the card, not its id. A view is still counted. Test `adLink.test.tsx` "what the Hub is told about a tap" (fails before) | SWEEP-1026 commit |
| 2 | ADS-LINK: an old build shows nothing when the heaviest ad is link or none | Ruled no (report only). The old reader drops a card it does not know, so the place shows nothing on a build that predates R-92 until it updates; the Hub cannot tell an old build from a new one on `GET /ads` (no build or version is sent), so serving old builds another card is not a trivial Hub change and none is made | none |
| 3 | PAY-FX: the paid thread flashes naira wording (stamp "₦ paid", "comes back to your wallet") for about 1.6 s before the buyer's own currency | Fixed. Which account paid comes from two reads (the question's record, then its payment). Until both are over, the stamp is the time alone and the waiting card's words are the loading line; a read that fails is over and reads as naira, as before. `PaidFromState`, `SOURCE_PENDING` in `paid-ask/model.ts`; `PaidThreadScreen.sourceOf` counts a record still on its way as unknown. Test `askFlow.test.tsx` "holds the stamp's amount and the card's words" (fails before) | SWEEP-1026 commit |
| 4 | PAY-FX: a paid-question card keeps "on its way back" until the thread is reopened | Fixed. The thread is read again every 15 s while any question of theirs is still open at the Hub, also past its time (`isOpen`; it stopped at the deadline); a question that turns from open to refunded has its wallet record read again once (it was cached for a minute) so the card names the amount and time. Test `askFlow.test.tsx` "turns to the refund when it lands, without reopening the thread" (fails before) | SWEEP-1026 commit |
| 5 | FX-POLISH: after "+ Add" from the end of the strip the new tab is out of view | Fixed. `ScrollTabs` brings the tab in front into view when its own layout arrives, not only when the strip's size changes (a new tab has no place when it is chosen, and its layout can arrive after the strip's). Test `fxStrip.test.tsx` "a tab added from + Add is brought into view" (fails before) | SWEEP-1026 commit |
| 6 | POWERED-NUVION: a sheet opened over a tab shows the line twice | Fixed. `PoweredByNuvion` takes `hidden`: the page under an open details sheet (`FxTabBody`, `WorldHome`) keeps the line's room and draws nothing, so the sheet's own line is the one in view. Test `fxTabs.test.tsx` "a details sheet opened over the account shows the line once" (fails before) | SWEEP-1026 commit |
| 7 | POWERED-NUVION: a 27 px jump when GET /about answers late | Fixed. While the read is pending the line's room (the caption line height) is kept as an empty, screen-reader-hidden view; once the Hub has said it is not Nuvion, or the read failed, there is no room. Test `fxTabs.test.tsx` "keeps the line's room until GET /about answers" (fails before) | SWEEP-1026 commit |
| 8 | POWERED-NUVION: tests cover the naira card only | Added: `fxTabs.test.tsx` "draws the line once under a dollar account card, and not under it when the Hub names another bank" (a coverage test, passes before and after) | SWEEP-1026 commit |
| 9 | CAPITAL-OFF: the empty Passes card title is 15 px, Points uses 18 | Fixed in two rounds. Round 1 set the empty title to 18 and let it wrap, which orphaned "yet" and grew both cards from 104 to 128 (verifier, medium). Round 2 (lead ruling on copy): the empty title is "No pass yet" and the empty line "With Founding Maker" (`PASSES_EMPTY`), the title 18 / 700 and both lines on one line (`numberOfLines` 1). Pictures `pics/row9-after-360-dark.png` and `pics/row9-after-390-dark.png`; the W1 design render is `pics/row9-design-W1-dark.png`. Test `passEvent.test.tsx` "the empty card title is the same size" (fails before); the strings are updated in the three tests that pinned them (`passEvent`, `passFlow`, `WalletScreen`) and nothing else in them | SWEEP-1026 commits |
| 10 | TIER-OFFER: dashboard `tier_offer.close_button_on` is a plain number box (1/0) | Ruled no here (report only): the dashboard is another repo. For a dashboard sweep: draw it as an on/off switch that sends 1 or 0, as the other on/off settings do | none |
| 11 | PHOTO-POSITION L-a: on the web a touch pinch zooms about a point 56 px below the fingers | Fixed. gesture-handler on the web reports the focal point in page coordinates; the stage's place on the page is read when it is laid out (web only) and taken off the pinch's focal point. A phone is unchanged. Test `photoPosition.test.tsx` "on the web a touch pinch zooms about the spot between the fingers" (fails before) | SWEEP-1026 commit |
| 12 | Records: SHARED-CHANGES rows TIER-OFFER #1 to #3 and PHOTO-POSITION #1 to #5 are not in the table's column order | Fixed. The eight rows are rewritten as `# | from task | file | exact change | status`, content unchanged | SWEEP-1026 commit |

Changed assertions: none. No existing test pinned a defect. `useAdReports.tapOf` takes the card instead of its id (its one caller, `ExploreSlider`, is updated).

**NOT RUN:** the pictures of rows 5, 6, 7 and 11 by this builder (the verifier took rows 5 to 7 on its own stack); rows 3 to 7 and 11 are proved by tests that fail before and pass after. A phone: NOT RUN.

**Round 2 (26 Oct 2026, verifier FIX on row 9, medium):** copy per the lead's ruling (row 9); both cards are 88 high at 360 and at 390 in dark (the board's own tile is 88; limit 104), the Passes title and line each on one line at 360 and 390 with nothing cut, the font unchanged at 18 / 700 and 12. Pictures from the real components in the web dev server on a temporary preview page (not committed), Alan Sans loaded. Also `settingsAccountsRow.test.tsx` test 4 (lead ruling, the only other test edit): it now holds the wallet read until after the "row absent" assertion and then releases it, no assertion changed (it asserted "absent" while its mock fetch was free to answer, a race under load); run alone 10 times with `--maxWorkers=1`, all EXIT 0.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/ADS-LINK.md`, `tasks/PAY-FX.md`, `tasks/PHOTO-POSITION.md`, `tasks/TIER-OFFER.md`; `DECISIONS.md` R-92, R-91, R-95, R-96, R-97

## Goal

The low rows the 26 Oct verifiers logged are fixed, or have a written reason they stay.

## Scope

App (`src/features/ads`, `paid-ask`, `wallet`, `profile-edit`, `src/components/PoweredByNuvion.tsx`) and `SHARED-CHANGES.md` only.

## Capability checks

- [x] An ad that does nothing sends a view and never a tap.
- [x] The paid thread names the money (stamp and waiting card) only once the account that paid is known.
- [x] A question paid back after its time turns to the refund card without reopening the thread.
- [x] A currency added from + Add is brought into view in the strip.
- [x] A details sheet over an account shows "Powered by Nuvion" once, and the page does not move when the Hub answers late.
- [x] The empty Passes card title is the Points card's size.
- [x] A touch pinch on the web zooms about the fingers.
