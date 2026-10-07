---
id: SHARED-03
title: Shared-change pass after the tab hubs (one toast, chip padding, card placeholder)
owner: YOU
area: SHARED
order: 184
priority: launch
repo: wawu-wmt-mobile
type: component
status: review
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

6. **One Follow button on creator cards** (HOME-01 round 2 D3 ruling): MediaCard's `action` is THE Follow button for creator cards. Make its look match the canvas's creator-card Follow (label 13, not 13.5; Following on white at 20% with no ring) through MediaCard's props, so no screen styles it by hand. Then switch Explore's `CreatorCard` from its `footer` + styled Button to `action`, and check Home's creator rail (already on `action` after HOME-01 round 3) picks up the look. Both cards draw Follow identically.
7. **Follow button test gaps** (HOME-01 round 3 survivors T3 and T4): add tests that fail when `action.on` is ignored (Following must draw on glass, not the accent) and when `action.loading` is ignored (the spinner must show while a follow is in flight). Re-apply both mutants and show each test failing.

## Capability checks

- [ ] No feature keeps a copy of the toast; both notices look as before (pictures, light and dark).
- [ ] The All chip matches X3's spacing; every other chip on every screen is unchanged.
- [ ] A creator with no photo shows initials on Home and Explore.
- [ ] The Z3 test passes 20 runs in a row.
- [ ] Home and Explore draw Follow through `action` only, identically, matching the canvas (pictures).
- [ ] Mutants T3 (`on` ignored) and T4 (`loading` ignored) each fail a test.
- [ ] `npm run check` exits 0.

## Builder report

Built by the lead's agent, 7 Oct 2026, on `wmt/SHARED-03` from origin/main `ee28b75` (all four tab hubs merged; main has not moved since). Own worktree with its own `npm ci` (nothing hard-linked). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bs03/` (`shots/before`, `shots/after`, `pairs/`, `diff.json`, `design/`, `mut/`, `z3/`, `tools/`).

**1. One shared toast.** New `src/components/Toast.tsx`: `message` (nothing drawn while null), `tone` (`success`: CircleCheck in positive; `alert`: CircleAlert in danger), `placement` (`top` 60 / `bottom` 24), `offset`, `lines` (1: 48 high; 2: at least 48, 12 above and below, two lines), `duration` with `onHide` (the clock restarts on each new line), `testID`. M10's metrics (48, 16 corner, 20 in, 18 icon at 2.2, 10 gap, 14.5 at 600). `SavedToast.tsx` (ME-06) and `FollowNotice.tsx` (EXPLORE-01) are deleted; the Me tab, M8 and Change password draw `Toast` (top, success), Explore and Categories draw it (bottom, alert, two lines, `duration={FOLLOW_NOTICE_MS}`, `onHide={follow.dismiss}`; the timer moved from `useFollow` into the toast). Default (agent), owner may override: every toast takes no presses (`pointerEvents="none"`, as the follow notice already did); Password changed's test id is `password-changed` (it was `profile-saved` through the copy).
**2. FilterChips beside icon chips.** When any chip in a row has an icon, every chip in that row pads 11 at the start and 14 at the end (`chipRow`); the icon still draws only where given. No other screen has an icon row, so every other chip keeps 15/15. Measured at 390 (CSS px): the All chip on X2 is 45 wide (main 50, canvas 43) and the next chip starts at 77 (main 82, canvas 75). The 2 left over is the 1 px outline each row chip draws as a layout border, which the canvas draws as an inset shadow; it is on every row chip on every screen since SHARED-02 (Music & Audio is 131.5 against the canvas's 129.5), so it is not changed here (it would move Inbox's and M34's chips too). Default (agent), owner may override.
**3. MediaCard `placeholder`.** Drawn on the sunken block only when there is no picture, under the scrim, hidden from a screen reader (`<testID>-placeholder`); on a stacked card centred in the room above the caption (the caption's height is read from its layout). Home's rail and Explore's card pass `<Avatar name hue={hueFor(wawuId)} size={mediaMetrics.placeholderAvatar} decorative />` (64, the size Today's card drew before HOME-01 round 2; not on the canvas, Default (agent), owner may override).
**4. Test gaps.** Explore: "the refusal line stays up for 4 seconds, then goes by itself" (fake clock from the press: present at 3.9 s, gone at 4.1 s); Categories: "opens with the chosen chip scrolled into view" (Gaming & Esports at 1500 in a 390 row is scrolled to 1480); Categories' refusal line sits 24 above the safe area.
**5. Flaky Z3.** Cause: the first `GET /settings/notifications` answered at once, and RNTL 14's `await render(...)` flushes inside `act`, so whether React Query's batched notify (a 0 ms timer) landed before the test looked depended on timing; the failure log shows `notify-error` already drawn when `notify-loading` was looked for. Run alone it failed 7 of 8 runs on main (`z3-before-*.log`). Fix: the first read is held until the loading view has been seen, then released; the test now also checks the error view replaces the loading view. Nothing it checked is dropped. 20 runs in a row of the test alone, the mode that failed: 20 of 20 passed (`z3/summary.txt`).
**6. THE creator-card Follow.** `Button` gains size `card` (32 high, 13 at 700, no letter-spacing: `cCard`'s Follow) and variant `veil` (white at 20% drawn as its own layer from `textOnAccent` at opacity 0.2, no ring, no pressed colour beyond the press scale; no colour literal and no string surgery on a token). `MediaCard`'s `action` draws `size="card"` with `primary`, or `veil` when `on`; its old height override is gone. Explore's `CreatorCard` now passes `action={{ label, on, onPress, testID }}` (the `footer` + styled `Button` and `whiteAt` are deleted). Home's rail picks the look up unchanged. Test: the Following and Follow buttons, words and veil of Home's and Explore's cards are deep-equal, and equal to a bare `Button variant="veil" size="card" full`. Label glyphs on X1: canvas 39 by 9 px, app now 39 by 9 (main 40 by 10).
**7. T3 and T4** (HOME-01's survivors): Home tests "draws a creator already followed as Following on white at 20%, not on the accent" and "shows the spinner on Follow while the follow is on its way, and only on that card".

**Mutants** (`mut/results.json`; each one change to the committed source, the named suites run, then `git restore`, file checked byte-identical): 15 of 15 killed. T3 `on: false` on Home and T4 `loading: false` on Home each fail their new test (1 of 23); R2-5a (Explore's duration 400000, and `FOLLOW_NOTICE_MS = 400000`) and R2-5b (Categories without `revealSelected`) each fail their new test; own: action ignores `on`, action back to `sm`, veil at 14%, Toast ignores `duration`, bottom drawn at the top, chips padded only with an icon, no placeholder drawn, Explore passes no placeholder, Explore drops `on`, Z3's loading view never drawn.

**Pictures, nothing else moved.** Users found by grep: `MediaCard` (pay sheet, showcase, works, Home, Explore, Categories), `FilterChips` (Inbox, M34, Categories, showcase), `Button` (every auth screen, settings, M1, M8, M9, works, TGIF, wallet, Open your wallet, payout, `StateViews`), the toasts (M1, M8, Change password, Explore, Categories). Web exports of main `ee28b75` and of this branch (`npx expo export --clear`, private TMPDIR, prod and `--dev`), served on :5451 with a stand-in Hub on :5452 (answers from the contract's schemas, plus fixed creators: one with a photo, one Following, two without photos, and a refused Follow) and a stand-in WAWU ID on :5453; session seeded in localStorage; every non-localhost request aborted (none was made). Playwright Chromium, 390 x 844 at 2x, light and dark, each scrolling screen a viewport at a time, plus six pressed states (refused Follow on Home, Explore and Categories, Profile saved on M1 and M8, Password changed). **148 pairs: 132 identical to the pixel, 16 differ, all items 2, 3 and 6:** Home (light and dark, 31,286 / 31,290 px: initials on the three cards without a photo, Follow 13, Following without its ring at 20%), Explore (15,399 / 15,400: Chidi's initials, Follow labels 13), Categories All, Photography and Gaming & Esports (52,771 / 52,599, 41,942 / 41,943, 56 / 57: the chip row from the 45-wide All on, initials, labels), and the same three screens in the pressed shots (inside the cards only; the refusal toasts are identical). The six toast pairs (Profile saved twice, Password changed, each theme) and both follow-notice toasts are identical to the pixel. Pairs: `pairs/` (before, after, changed pixels).

**Checks.** Before (main `ee28b75`, HOME-01's final run on the same tree): jest 75 suites, 1,350 tests; gates 346 files, 0 findings; 212 tasks. After: `npm run check` exit 0 as one command (numbers in the LOG line); typecheck and lint clean; jest 76 suites, 1,377 tests, 0 failed (+1 suite `src/__tests__/sharedToastFollow.test.tsx`, 21 tests; +6 elsewhere); gates 9 run, 0 findings. Two tests in SHARED-02's `hubSharedProps.test.tsx` and one in EXPLORE-01's suite changed with the behaviour they describe (Following was glass, then a `style` override; a no-icon chip in an icon row was 15/15), each now asserting the new look. No em-dash added; staged diff scanned for key-shaped strings: none.

**Files.** `src/components/Toast.tsx` (new), `Button.tsx`, `FilterChips.tsx`, `MediaCard.tsx`; `src/features/explore/CreatorCard.tsx`, `ExploreScreen.tsx`, `CategoriesScreen.tsx`, `follow.ts`, `FollowNotice.tsx` (deleted); `src/features/home/CreatorRail.tsx`; `src/features/me/MeScreen.tsx`; `src/features/profile-edit/EditProfileScreen.tsx`, `SavedToast.tsx` (deleted); `src/features/settings/ChangePasswordScreen.tsx`; tests `src/__tests__/sharedToastFollow.test.tsx` (new), `hubSharedProps.test.tsx`, `explore/__tests__/screens.test.tsx`, `home/__tests__/HomeScreen.test.tsx`, `settings/__tests__/settingsScreens.test.tsx`; `SHARED-CHANGES.md` (HOME-01 #3 `applied by SHARED-03`; R2-1, R2-3 and the Follow ruling had no rows), `docs/LOG.md`, generated `docs/PROGRESS.md` (`tasks/INDEX.md` regenerated, unchanged). `docs/CONVENTIONS.md`, named in the brief, does not exist; `CLAUDE.md` and `docs/WORKFLOW.md` were followed.

**NOT RUN.** A phone (the veil layer, the placeholder's measured centring and the toasts on iOS and Android): unblocked by a development build with this branch. A real Hub and WAWU ID (no route changed; the stand-in served the contract's shapes): unblocked by nothing this task needs. V5 against the canvas is the verifier's.

## Verifier report

Independent verifier, 7 Oct 2026, on `wmt/SHARED-03` at `1b64a8f` against main `ee28b75`. I wrote none of this task's code. Two fresh detached worktrees, each with its own `npm ci` (nothing hard-linked). My own tools: a contract-driven stand-in Hub on :5462 and WAWU ID on :5463 (five fixed creators: a photo with a refused Follow, no photo and Following, no photo and no handle, a photo and Following, no photo with a held Follow), web exports on :5461. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vs03/` (`shots/main`, `shots/branch`, `pairs/`, `diff.json`, `facts-*.json`, `design/`, `mutants.json`, `mut/`, `z3/`, `logs/`, `tools/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` as one command on 1b64a8f: exit 0. Typecheck and lint clean; jest 76 of 76 suites, 1,377 of 1,377 tests; gates 9 run, 346 files scanned, 0 findings, baseline 0; 212 tasks (`logs/check-branch.log`). No timeout. The branch's diff adds no em-dash; no colour literal outside tests (the three `#FFFFFF` are expected values in assertions); new sizes are named metrics with their canvas line (`toastMetrics`, Button `card`, `mediaMetrics.placeholderAvatar`). Scope: exactly the builder's file list (shared `Toast`, `Button`, `FilterChips`, `MediaCard`; the callers the items name; their tests; SHARED-CHANGES, LOG, PROGRESS). |
| Item 1, toast | passed | One `src/components/Toast.tsx`; `SavedToast.tsx` and `FollowNotice.tsx` are deleted and nothing imports them. All six toast pairs (Profile saved on M1 and M8, Password changed, refused Follow on Explore and Categories, light and dark) are identical to the pixel inside the toast. Times on screen, main then branch: Profile saved on M1 2.49/2.50 s and 2.48/2.48 s, on M8 1.23/1.23 s and 1.25/1.27 s, Password changed 1.23/1.23 s and 1.26/1.24 s, Couldn't follow on Explore 4.02/4.02 s and 4.02/4.02 s, on Categories 4.02/3.99 s and 4.02/4.01 s (`facts-*-prod.json`). |
| Item 2, chips | passed with a recorded difference | See R1. Inbox's chips are unchanged (All 49.64 wide on both); every pair of Inbox, M34 and the showcase is identical. |
| Item 3, placeholder | passed (see N1 for web) | Initials only on the three cards with no photo, on Home and Explore (`EN`, `HM`, `UO`); none on the two with a photo; drawn under the scrim and centred above the caption (`pairs/home-*`, `pairs/categories-*`). |
| Item 6, Follow | passed | Home and Explore draw Follow and Following with the same computed style: 32 high, label 13 at 700 with no letter-spacing, accent fill; Following transparent with no border and a white layer at 0.2. Matches `cCard` in both `home.js` and `explore.js` (identical CSS: 32 high, 13 at 700, `rgba(255,255,255,.2)`). Label glyphs on X1: canvas 39 x 9, branch 39 x 9 on Home and Explore, main 40 x 10. Explore's `CreatorCard` has no `footer`, no `Button` import, no `style` and no `whiteAt`. `veil` and `card` are used only by `MediaCard`; no existing size or variant changed (`sm` 34/13.5 still tested; every non-card Button pair is identical). |
| Item 4 and 7, tests | passed | T3 and T4 re-applied by me: each fails exactly its new test (1 of 23 in `HomeScreen.test.tsx`). |
| Item 5, Z3 | passed | Reproduced on main: run alone, 9 of 12 failed, each with `notify-error` already drawn when `notify-loading` was looked for (`z3/main-alone-*.log`). Branch: 20 of 20 alone and 5 of 5 whole-file runs passed. The hold is what fixes it: with only `await held` removed from the branch's test, 7 of 10 runs failed again. The fix checks everything the old test did (loading, then error, then Try again loads the switches) and adds two checks (no error while loading, no loading once the error is up). The whole file does not exit for about 5 minutes after it passes ("Jest did not exit"); main does the same, so it is not this task's. |
| Nothing else moved | passed | 150 pairs (prod: 10 signed-out, 25 signed-in screens with every scroll page, 7 pressed states plus a held Follow; dev: showcase, ten pay sheets, PIN sheet, eight auth previews; light and dark): 130 identical, 20 differ. 18 are items 2, 3 and 6 only: Home 31,236 / 31,278 px, Explore 15,354 / 15,392, Categories All 53,657 / 53,501, Photography 42,829 / 42,876, Gaming & Esports 56 / 57 (sub-pixel edge of the revealed chip, the row moved by All), the same in the pressed shots (inside the cards; the toasts themselves identical), and the held Follow (42,508 / 42,515, the same cards). The other 2 (`dev_components-s3/s4-light`, 735 px) are the 34 px brand mark, a downscale of the same 1009 x 1100 PNG: same rect and asset on both builds, main re-shot identical to itself, and the two builds are identical when shot after a 4 s settle (`tools/bm2.py`), so it is decode timing, not a change. |
| V5 picture | passed with R1 | X1 and X2 against Home, Explore and Categories, as above. H1 draws its cards under the tab bar, so its Follow is not visible; its `cCard` CSS is identical to X1's. |
| V6 states | passed | Refused Follow (403 from the stand-in Hub) on Home, Explore and Categories; a Follow held in flight shows the spinner on that card only, on both builds; no-photo cards; Profile saved, Password changed; Z3 loading and error in jest. |
| Mutants | 20 of 20 killed | Mine, each one change, the named suites run, the file restored and checked byte-identical, tree clean after (`mutants.json`, `mut/`): T3, T4; toast duration doubled, clock not restarted on a new line, toast takes presses, top 64; chip rule `every` instead of `some`, start and end padding swapped, icon padding on every row; placeholder drawn with a picture, placeholder not hidden, Home passes no placeholder; veil at 25%, veil drawn when disabled, card label 13.5, card height 34, card tracking back to the kit's, action back to `sm`; Z3: loading view left up beside the error, loading view never drawn. |

**Builder defaults judged**

- Toasts take no presses. Main's top toasts did take them: on main the centre of Profile saved (M1, M8) and Password changed hits the toast (`pointer-events: auto`), so a tap there was swallowed; on the branch it reaches what is under it (`me-scroll`, `edit-cover`, `password-screen`). Under all three, at rest, there is no control (the cover is not pressable; its camera button is below the toast). Explore's notice already passed presses through. A behaviour change, not a look or timing change; acceptable as recorded (Default (agent), owner may override). Not a defect.
- `password-changed` test id: no test, e2e flow or doc names the old `profile-saved` id for Change password (the Change password tests find the words). Not a defect.

**Findings**

R1. **differs-for-recorded-reason (builder's Default (agent); pre-existing on main).** X2/X3's All chip is 43 wide; the branch draws it 44.64 (main 49.64) and the next chip starts at 72.64 (main 77.64; canvas about 71). Cause confirmed: computed `padding-left` 11px, `padding-right` 14px and `border-width` 1px; `chipRow` and the kit `Chip` both draw their outline as an inset shadow that takes no room, while `FilterChips` draws a 1 px layout border on the row variant (`StyleSheet.hairlineWidth` is 1 on web; about 0.33 on a 3x phone) and subtracts the border only for `option` chips (`border = variant === 'option' ? 1 : 0`). Main already had it on every row chip: Music & Audio is 141.56 on main and branch (11/14 plus two 1 px borders), and Inbox's kit chips are 2 wider than the kit's 15/15. So it is not introduced here. Two corrections to the builder's reasoning: a fix scoped to icon rows (subtract the hairline only when `iconRow`) would not move Inbox's or M34's chips, which have no icon; and `chipIconMetrics`' comment "(the outline counted in, as above)" is not true for row chips. Owner may override.

N1. **note, web preview only (not a defect).** On Expo web the initials are read: Playwright's accessibility snapshot of a no-photo card reads `text: EN @emeka`. react-native-web 0.21 ignores `accessibilityElementsHidden` and `importantForAccessibility` (only `aria-hidden` reaches the DOM), so the slot, and `Avatar decorative` everywhere, are hidden on iOS and Android but not on web. That is the same for every `decorative` Avatar on main. `StatusPill` adds `aria-hidden` beside them, which would cover web too.

**No defect is open, so the status is `review`.**

**NOT RUN**

| Item | What unblocks it |
|---|---|
| A phone: the veil layer, the placeholder's centring after layout, the native screen-reader hiding, the toasts on iOS and Android | A development build with `wmt/SHARED-03` on a device |
| A real Hub and WAWU ID | Nothing this task needs: no route or contract changed (`contract/openapi.json` identical on both trees); the stand-ins served the contract's shapes |

Note: `render_design.py` binds an ephemeral port on 127.0.0.1 of its own (outside 5461 to 5463); it was run as the brief asks.

Cleanup: every server this session started was stopped by its PID; no database was used; exports, worktree `/home/user/wt/vs03main` and (after the push) `/home/user/wt/vs03m` removed.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
