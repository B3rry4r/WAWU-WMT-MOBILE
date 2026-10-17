# DV2-COMP verifier report (mobile wmt/DV2-COMP 51235be on wmt/SHARED-06 d563eb3, app only)

Verdict: fix (two mediums). Evidence folder: .../scratchpad/dv2-comp-v/ (shots/, logs/).

## Findings
1. MEDIUM, ProductsMeter.tsx:28,36 (dayFormat / productsMeterCaption): `Intl.DateTimeFormat('en-GB', month 'short')` writes September as "Sept".
   productsMeterCaption('Verify','2026-09-30T12:00:00Z') -> "Verify · ends 30 Sept" (Node 22 and jest; newer ICU on a phone does the same).
   The board writes three letters ("ends 30 Sep 2027", PT5) and the repo's own Lagos formatter uses a MONTHS table
   (src/features/wallet/history/lagosTime.ts). The test only covers 26 Nov. Fix: read day and month from the Lagos clock with the
   MONTHS table, no Intl; add a September (and 30 Sep 22:59Z / 23:00Z) test.
2. MEDIUM, PointsFigure.tsx:60-75,82: the figure neither wraps nor scales. "1,250,000 points" at hero is 195 px wide (star 20, count 113, word 52);
   in a parent of 150 or 200 px it keeps 195 px and runs past the edge (measured in the dev export). PT5's balance sits beside "Buy points":
   its left column is about 182 px on a 360 px phone, so a 7-digit balance overflows there (about 212 px at 390). Needs flexShrink on the row and
   numberOfLines + adjustsFontSizeToFit (or a wrapping word). The brief asked for "wraps or scales, never clips".
3. LOW, VoicePlayer.tsx:176-180: the error text says "Tap to try again." but only the 36 px circle is pressable; clicking the text does nothing
   (checked: URL state unchanged after clicking the text, changed after clicking the button). Make the whole error row the Pressable.
4. LOW, VoicePlayer.tsx:34,55-58: "fewer bars, never thinner" holds down to about 300 px. At 280 px the floor of 8 bars draws them 1.23 px wide;
   at 240 px the strip is 0 wide and barCountFor(0) returns all 26. First frame always draws 26 bars before onLayout trims them (a flash on narrow phones).
   390 px: 26 bars at 3.2 px; 360: 26 at 2.08; 320: 16 at 2.13.
5. LOW, TierBadge.tsx:61: VF14's chip is full width on the board (inline-flex in a column flex card); TierBadge is alignSelf flex-start with no prop to stretch,
   and the report says VF14 matches. The VERIFY-04 screen cannot match the board without changing this shared piece. Not in the recorded differences.
6. LOW, PointsFigure.tsx:68,73: line height is a bare `* 1.2` and styles are built inline each render (no gate flags it); not a named metric.
   `accessibilityValue` on the meter and the wave is not exposed as aria-valuenow on web (the meter's label carries "2 of 3 products", so it is read out; native is fine).

## Not findings (checked)
- Pictures at 390 px light and dark from a `expo export --platform web --dev` build (own TMPDIR; only localhost:7620/7627 baked), beside M1, VF11, VF14, M19, PT5, VF7a:
  meter (M1, M19) identical; points hero, line (PT5) and chip (M19) match; player idle/playing/label-above (M1, VF11) match apart from the recorded AI voice tag; VF7a dark pill
  uses surfaceCardInk (lead ruled not a finding); every preview state (tier x5, meter x7, points x8, voice x7) drawn in both themes without errors.
- Lagos caption across midnight and month/year ends correct: 30 Sep 22:59:59Z -> 30, 23:00Z -> 1 Oct; 31 Dec 23:59Z -> 1 Jan; 28 Feb 2026 23:30Z -> 1 Mar; 28 Feb 2028 -> 29 Feb; offsets -05:00 and +01:00 read right; bad date -> tier name alone.
- allowed 0 draws nothing; used > allowed bar stops at full ("4 of 3 products"); loading is a block of the meter's size. Values by props only: no fetch, no @/api, no naira sign, no Date.now, no audio call.
- Points never naira (formatPoints floors, clamps negatives, 1 point singular, 1,234,567,890,123 commas). Accessibility on web DOM: meter progressbar label "2 of 3 products. Verify · ends 26 Nov"; player button
  "Play Bio, 0:22" / "Pause Bio" / "Loading Bio" (disabled+busy) / "Try again"; tag "AI voice" is plain text a reader reaches; contrast of the tag 6.0:1 light, 6.7:1 dark.
- Gates: `npm run gates` EXIT 0 (10 run, 0 fail, 5 warn as on the base, 710 files, baseline 0). Gap literals are named metrics (iconToNumber, iconToName, between, barGap, iconToWord,
  captionGap, trackGap) as Button.iconGap and FilterChips.chipIconMetrics do; no eslint-disable, ts-ignore or hex outside comments; no outside brand name; no em-dash or en-dash.
- Scope: changes outside the four pieces, four previews and dv2-comp.test.tsx are only bookkeeping (tasks/, docs/LOG.md, docs/PROGRESS.md, SHARED-CHANGES.md); no theme, api or backend change.
- Builder's test file: 43 passed (EXIT 0); eslint on the 9 files EXIT 0. Full suite not re-run (builder reports EXIT 0; mobile CI is off for billing).
- Production export (`expo export --platform web`, own cache, ports 7620/7627 only): /preview/tier-badge, products-meter, points-figure, voice-player, each with and without ?state=, all land on /welcome with 0 piece nodes.
  (The preview code is in the bundle, as the pay-sheet preview's is; the routes are not served.)
- Nothing is pre-existing: every finding is in files new on this branch (base d563eb3 has none of them).
