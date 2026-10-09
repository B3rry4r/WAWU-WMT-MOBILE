---
id: COMPLETE-06
title: Inbox, Settings, the feed and the smaller screens show their whole design
owner: YOU
area: SHARED
order: 242
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [COMPLETE-01, COMPLETE-04]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [I1, I21, Z1, Z2, A2, M8]
---
# COMPLETE-06 · Inbox, Settings, the feed and the smaller screens show their whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/inbox/rows.tsx`, `src/app/settings/*`, `src/features/feed/FeedScreen.tsx`, `src/components/pay-sheet/PaySheet.tsx`, `src/features/auth/AccountTypeScreen.tsx`, `src/features/profile-edit/PictureHeader.tsx`, `src/features/tgif/ShareSheet.tsx`

## Goal

The rest of the places that leave parts out: Inbox rows of kinds with no screen yet, Settings rows whose screens are not built, the feed's course, template, creator and professional cards, the pay sheet's open-wallet entry, A2's button, the profile picture's camera buttons and the share sheet's media options.

## Scope

- Inbox (I1): every kind's row is drawn as designed; a kind whose screen is not built opens nothing. Inbox settings (I21) in full.
- Settings (Z1 Me menu, Z2 Settings and every row on them): drawn in full; rows for unbuilt screens (for example Delete account, SETTINGS-06) are inert.
- The feed (H2 to H6): the course, template, creator and professional cards (HOME-07) drawn as designed with what the Hub serves; their taps inert until HOME-07.
- The pay sheet's "Open your wallet" entry, A2's button, M8's camera buttons, the share sheet's media options: drawn as designed.
- Find any other "not drawn" or "left out" comment in `src/` about an entry or section (`grep -rn "not drawn\|left out" src`) and fix it the same way; list each in the report.
- Starts after COMPLETE-04 (Settings and Me share the menu).
- Explore follow-ups (COMPLETE-02's round 2 verifier, merged by lead ruling): Try again keeps every section drawn with the banner's spinner while it reads (finding 5: today it shows the X14 loading view for about 3 s, because a failed query with no data goes back to pending), and the tests that kill the surviving mutants W1, W2, W4, W5, W6, W16 and W17 (the report names the test for each); at 320 px stack the banner's words above its button; the neutral frames' spoken label must not say "none to show" when the read failed.
- Larger text (COMPLETE-05's round 2 verifier, finding 1): at a phone's text scale of 1.3 and above, the Wallet tab's bills words ("Airtime", "Power") ellipsize at 320 to 360 px and the Add money label crowds its pill. Make `billTileSize` and `actionSize` read the font scale so no word is cut at 1.3 and 1.5; check the other COMPLETE screens the same way. Also COMPLETE-05's surviving test gaps (the glyph size, the retry after a failure drawing the failed card instead of the shapes) and finding 3 (the rows' Try again blinks the card row and heading off while it reads).
- The `unbuilt_entries` gate (COMPLETE-01's verifier findings 1 and 2): fail any `unbuilt` identifier in non-test source that is not directly called, apart from its declaration and the plain import line (closes the alias, `const f = unbuilt`, re-export and `require` holes), and add the tests the verifier listed (nested braces inside `${}`, string escapes, the built-task message's action text "remove unbuilt()", the `TaskId` type, a tap side effect other than a console call).
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [ ] A user sees every Inbox row kind, every Settings row and every feed card kind as drawn.
- [ ] `grep -rn "not drawn\|are not drawn\|left out until" src` finds no entry or section left out (data-only lines are listed and explained).
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
