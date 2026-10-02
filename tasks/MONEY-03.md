---
id: MONEY-03
title: The pay-from-wallet sheet
owner: YOU
area: MONEY
order: 45
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [UI-02, MONEY-02, MONEY-04]
decisions: [R-6, R-10]
passes: [V1, V5, V6]
artboards: [H14, W10]
---
# MONEY-03 · The pay-from-wallet sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py H14 W10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H14 and W10, and rules 3 to 5 (the brief is part of the design: build its version)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

One payment sheet: what you're paying for, the amount, the wallet balance, and what happens when it's not enough.

## Scope

src/components/pay-sheet/ with states: enough, not enough (top-up path), paying, still confirming, failed,
and no wallet yet. It shows the price, Fintava's charge and the total from the fee quote (WALLET-15), with one
"Fees" row when there are two or more parts (the owner's ruling on this task's branch, R-23). The button shows
the total the payer pays (BRIEF rule 5). With no wallet yet, the sheet shows no balance and no Pay; KYC-05 adds
the way into Open your wallet (docs/WORKFLOW.md section 7, "Links between screens").

## Brief changes (build these, not the canvas)

- **H14**: the breakdown (rule 3): Price ₦2,500, Fintava's charge ₦23.25, Total ₦2,523.25; button "Unlock · ₦2,523.25". (Why: R-10 and the purchases default: an unlock is a wallet to wallet move, which Fintava charges ₦23.25 for under ₦5,000.)
- **W10**: the fee breakdown (rule 3). For this bank send: Fintava's charge ₦40 + WAWU's fee ₦25 = ₦65, Total ₦25,065.00. If you also draw the WAWU-user version: ₦15.75 + ₦10 = ₦25.75, Total ₦25,025.75. The button shows the total, "Send ₦25,065", and a line above it says what arrives: "They get ₦25,000" (rule 5). Your note on W10, "The button shows the amount the person receives", changes to match. (Why: R-10, Fintava's price list.)

## Capability checks

- [ ] With too little money, the sheet shows the shortfall and a way to add money.
- [ ] A user sees the sheet exactly as H14 draws it with the brief's breakdown, light and dark (V5).
- [ ] With ₦5,000 in the wallet, a user unlocking a ₦2,500 piece sees ₦2,500 + ₦23.25 = ₦2,523.25 and the button "Unlock · ₦2,523.25" (BRIEF H14).
- [ ] A user with no wallet sees no balance and no Pay button.

## Builder report

Builder session, 2 Oct 2026, branch `wmt/MONEY-03`, origin/main ab2df44 (SHELL-01) merged in.
- Files: `src/components/pay-sheet/` (`PaySheet.tsx`, `money.ts`, `glyphs.tsx` (deleted in round 3), `index.ts`, `__tests__/PaySheet.test.tsx`, `__tests__/money.test.ts`); `src/app/preview/pay-sheet.tsx` (dev-only state gallery, `?state=enough|short|paying|confirming|failed|no-wallet|loading|zero-fee|send`, redirects home when `__DEV__` is false); `SHARED-CHANGES.md` (2 rows).
- Props in, UI out: item, price (kobo), detail rows, fee lines (label + kobo, any can be 0), wallet (`loading` / `none` / `open` with Fintava's balance), status (`review` / `paying` / `confirming` / `failed`), callbacks. The total is price + fee lines added in integer kobo inside the sheet, so the Total row, the pay button, "This costs" and the shortfall can't disagree (brief rule 5). Enough vs not enough comes from balance against that total.
- Check "with too little money, the sheet shows the shortfall and a way to add money": jest `PaySheet.test.tsx` (₦1,200.00 balance against ₦2,523.25 shows "Top up at least ₦1,323.25", the Unlock button is gone, and "Add ₦1,323.25" calls `onAddMoney(132325)`; a bank-send case adds ₦40 + ₦25 to the shortfall). Screenshot `pay-sheet-short-*`.
- Total = amount + fees in kobo, ₦0 fee included: `money.test.ts` and `PaySheet.test.tsx` (₦0 fee line shows "₦0", Total and button show ₦2,500). Non-integer, negative and unsafe amounts throw.
- Other states, each tested: paying (button disabled, no second `onPay`), still confirming (Refresh, Contact support), failed (server message, Try again, Cancel), no wallet (hands over via `onOpenWallet`, MONEY-13), loading balance (pay disabled), send ("They get ₦25,000", "Send · ₦25,065").
- "Matches H14 in light and dark": NOT claimed here; for the verifier. Evidence: `build/screens/MONEY-03/` has 18 state shots (9 states, light and dark, 390 px, from `npx expo export --platform web --dev`, then Playwright and Chromium) plus `side-H14-enough-*`, `side-H17-short-*`, `side-W10-send-*` beside `build/design_shots/` renders. Built to the BRIEF changes (H14: Fintava's charge row and Total, button shows the total; H17: charge under the price, shortfall includes it), not the canvas's "No fee".
- Known differences: icons are drawn from Views (no icon shapes outside TabIcon yet); the thumbnail in the preview is the app icon; the verified tick in the subtitle isn't drawn; type sizes use the nearest `@/theme` sizes (e.g. 13.5 for the canvas's 13). The "still confirming" and "failed" copy is my own, following H18, and makes no promise about refunds (rule 6).
- Gates before: tests 5 passed (2 suites); gates 9 run, 6 files, 0 fail, 0 warn, 0 accepted; tsc and lint clean. After (with main merged): tests 22 passed (5 suites); gates 9 run, 23 files, 0 fail, 0 warn, 0 accepted; tsc and lint clean; `npm run check` exit 0.
- Shared-change requests: icon shapes added to TabIcon or a general Icon; adopt UI-02's sheet and UI-01's buttons, text and money display once they land. No backend gap: the fee quote and balance are inputs, served by MONEY-core tasks.
- Round 2 (origin/main e657ad5 merged): defect 1 fixed, `PayItem.by` + `verified` draws the tick after the seller's name (test). Defect 2 fixed, rules, card edges, sheet top edge and Cancel outline are 1 px (`LINE = 1`; no border-width token exists). Owner ruling 3: a "Fees" subtotal row before Total when the fee has two or more parts (₦40 + ₦25 shows Fees ₦65; test). Ruling 4: W10 send variant filed for WALLET-02 (SHARED-CHANGES section 2 row 2). Ruling 5: View icons stay (row 6). Pay ignores a second tap until `status` changes or `onPay`'s promise settles (a short guard for a void callback); 3 tests. The preview drives the tick from the URL (`&tick=off`), not a literal. After: `npm run check` exit 0, jest 6 suites, 54 tests (29 in pay-sheet); gates 9 run, 30 files, 0 fail, 0 warn, 0 accepted; screenshots re-shot in `build/screens/MONEY-03/`.
- Round 3 (origin/main 5d4208f, then 6b7eaff merged). **Owner overruled two deferrals on 2 Oct 2026**: the View-drawn icons (SHARED-CHANGES section 1 row 6) and leaving W10's send styling to WALLET-02 (section 2 row 2). Both rows are removed and both are built here. Icons: `glyphs.tsx` deleted; the sheet uses `Icon` and `VerifiedTick` from `@/components/icon` with the canvas's names, sizes and strokes (CircleCheck 20/2.2, Wallet 19/2.2, Plus and RotateCcw 19/2.2 in buttons, Clock 32/2.4 as H18; `item.verified` is now `'creator' | 'pro'`). The failed mark (no pay-sheet artboard draws it) is `X`, following W14 (Send · failed), at H18's 32/2.4 sheet size; main 9f35e9f added `X` to the icon set, so no request is filed. W10: `variant: 'send'` renders W10's body (avatar, "Sending to", the amount at 40, then Bank, Account, fee parts, Fees, Total and `notes` after Total; every amount with faded kobo as the kit's `Amt`), "They get" and "Send ₦25,065"; compared with `render_design.py W10` light and dark (`side-W10-send-*`). The 360 ms double-tap timer is cleared on unmount (test). Fees-row ruling recorded as DECISIONS R-23 (renumbered from R-21: main took R-21 and R-22). `npm run check` exit 0: jest 7 suites, 63 tests (25 pay-sheet); gates 9 run, 32 files, 0 fail, 0 warn, 0 accepted.
- Round 4 (branch 78f3d87 and origin/main 6b7eaff, both already merged). R3-1: the sheet uses UI-01's `Button` (lg, primary and secondary, `icon`, `loading`), `Money` for every on-screen amount (kobo in, R-21; whole purchase prices without ".00", real kobo always shown) and `Text` (h3 title, secondary lines); the preview's back control is `IconButton`. `PillButton` and `Amount` are deleted, and `formatNaira` now wraps `formatMoney`. Kit sizes with no `Text` variant are named constants citing the kit, filed as SHARED-CHANGES section 1 row 6; the kit's `Av` and `Flag` as row 8. Section 2 row 1 is cut down to the UI-02 sheet host and lists what UI-02 provides. R3-2: measured in the browser, `Money` at 40 px is 44 px tall because its kobo run inherits the absolute 40 px line height; giving that run 28.8 px makes it exactly 40 (the kit's `line-height: 1`). That is inside `Money`, so it is filed as row 7 (with the kit's -0.025em tracking). W10 avatar-top-to-card is 166 CSS px against the canvas's 160 in light and dark; 4 of the 6 px are this line box. `npm run check` exit 0: jest 8 suites, 95 tests; gates 9 run, 40 files, 0 fail, 0 warn, 0 accepted; the 2 lint warnings are in main's `Button.tsx`.
- Round 5 (branch and origin/main 7148749 merged: SHARED-01 and UI-02). No local copies of shared parts remain: the purchase variant opens in UI-02's `BottomSheet` (closing calls `onCancel`; not while paying; new `visible` prop), rows are `GroupedList` + `KeyValueRow` (its label keeps `flexShrink: 0`), the wallet card is `Card` with `CurrencyFlag`, the W10 avatar is `Avatar` (decorative, named from the new `PayItem.displayName`, "Chidinma Okoro" gives "CO"), and copy uses `Text` `meta`, `bannerBody`, `kvValue`, `cardTitle`, `sheetTitle` and `muted`. Deleted: every item in SHARED-CHANGES Applied #6 and #8, plus the local `Card`, `Row`, panel and grabber. W10, avatar top to card: 162 CSS px after `Money`'s fix, 161 after trimming "Sending to" to the kit's normal leading (`SENDING_TRIM`), against the canvas's 160 (light and dark); avatar to text 16 = 16, amount to card 22.5 = 22.5, text block 59 against 58. H14 in the shared sheet: the grabber-to-header space is 2 px more (the sheet's fixed 18 gap), filed as section 1 row 9. Section 2 row 1 is removed (UI-02 is adopted). `npm run check` exit 0: jest 12 suites, 210 tests; gates 9 run, 59 files, 0 fail, 0 warn, 0 accepted; lint 0 warnings.
- Round 6 (origin/main f8d8277 merged: MONEY-02; main's new task body, `depends_on` and `decisions` kept). My request row 9 (the `BottomSheet` gap prop) is applied on main as Applied "MONEY-02 #10" and removed from section 1; the purchase variant passes `gap={16}` and its wrapper View is gone. H14 and H17, grabber to header: 20 = 20 px (was 22), light and dark; edge to grabber is 10 against 9, a `BottomSheet` border detail filed as section 1 row 11. W10, avatar top to card 160 = 160 and text block 58 = 58, light and dark: the canvas's "Sending to" is `line-height: normal`, which the browser makes Alan Sans's ascent and descent each rounded (13 + 4 = 17 px at 13.5), not 1.3 × 13.5; `SENDING_TRIM` now trims to that. No shared variant was needed. Per the task's new scope and R-27, the no-wallet state shows no balance and no Pay; the "Open your wallet" button and `onOpenWallet` are removed (KYC-05 adds the entry). The sheet draws no kit error line and no strong link, so `errorLine` and `linkStrong` have no use here. New tests: no wallet means no balance and no Pay; ₦5,000 in the wallet unlocks ₦2,500 + ₦23.25 = ₦2,523.25. `npm run check` exit 0: jest 13 suites, 245 tests; gates 9 run, 69 files, 0 fail, 0 warn, 0 accepted; lint 0 warnings.
- Round 7 (Lead-authorised row 11, 2 Oct 2026): `BottomSheet` draws its top hairline as an inset shadow inside the 10 px padding, as the kit's `sheet()` does, not a border outside it. Panel edge to grabber, light and dark: H14 9 = 9, H17 9 = 9 (both 10 before); grabber to header still 20 = 20. W11 (PIN sheet): edge to grabber 9 = 9 (was 10), panel top 398 = 398 (was 397); title, dots and keys from the grabber unchanged at 54 / 115 / 190 = canvas. Row 11 moved to Applied. `kitNormalLeading` left as it is (Lead). `npm run check` exit 0: 13 suites, 245 tests; gates 9 run, 69 files, 0 fail, 0 warn.

## Verifier report

Verifier session, 2 Oct 2026, fresh (did not build this task). Checked 988808c in a separate detached worktree; evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money03/` (scratchpad, not committed).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` exit 0: tsc and lint clean; jest 5 suites, 22 tests passed; gates 9 run, **23 files scanned** (all 6 pay-sheet files and the preview route among them), 0 fail, 0 warn, 0 accepted, baseline 0; tasks 187 OK. Log: `check.log` |
| V5 Picture | failed (2 minor defects, below) | H14, H17, W10 rendered (`design_shots/`); my own 390 px light and dark shots of all 9 preview states from `expo export --platform web --dev`, served on 8793, Playwright + Chromium 1194 (`shots/`); side by side `side-H14-enough-*.png`, `side-H17-short-*.png`, `side-W10-send-*.png`, zoom `zoom-H14-*.png`. Spacing, row pitch (50 px), button height (54 px), card and wallet card positions match H14 to within 1 px |
| V6 States | passed | Every state reached through its cause, which for a props-in component is its props: enough, not enough (shortfall ₦1,323.25, "Add ₦1,323.25"), paying (button disabled, spinner), still confirming, failed, no wallet, loading balance (pay disabled), ₦0 fee, send ("They get ₦25,000", "Send · ₦25,065"). No page errors in either theme. Network/server causes belong to the flow tasks that use the sheet (HOME-12, MONEY-19) |

Capability checks, as written:
- "With too little money, the sheet shows the shortfall and a way to add money": **passed**. Screenshot `shots/pay-sheet-short-*.png`: "This costs ₦2,523.25. You have ₦1,200.00.", Fintava's charge under the price, "Top up at least ₦1,323.25", "Add ₦1,323.25", Cancel; the Unlock button is gone. My test: 1 kobo short shows "Add ₦0.01"; exactly enough shows the pay button.
- "It matches H14 in light and dark": **not yet**. Layout, order, copy (as amended by BRIEF H14) and both themes match; two visible differences have no recorded reason (defects 1 and 2).

Diff vs report: `git diff ab2df44...988808c --stat` is 11 files, exactly the builder's list plus LOG, PROGRESS and this file. Nothing in `src/theme`, `src/api`, any `_layout.tsx`, `src/components/pin-sheet/`, TabIcon/TabBar, package.json or app.json. `src/components/pay-sheet/` is inside the ticket's own scope. Note: local main is now 6595e9d (LOG/PROGRESS wording only), one commit past the ab2df44 the branch merged; WORKFLOW 8.4 wants it merged again before the PR.

Money (read `money.ts`, plus my own jest edge tests, `zz-verifier.test.tsx`, `edge-tests.log`, 9 passed): total = price + every fee line as integer kobo sums; shortfall is an integer difference; display splits naira from kobo with `%` and an exact `/100` of a multiple of 100. No float arithmetic on money (the only floats are style sizes). Checked 0 (₦0), 1 (₦0.01), 9, 10, 99, 100 (₦1), 101, 252325 (₦2,523.25), 99999999 (₦999,999.99), 2502575 (₦25,025.75), MAX_SAFE_INTEGER (₦90,071,992,547,409.91); 1,000 one-kobo fees sum exactly; negative, fractional, NaN, Infinity and overflowing totals throw. ₦0 fee shows "₦0" and Total equals the price.

Facts: no fee, rate or amount literal in the component (`PaySheet.tsx`, `money.ts`, `glyphs.tsx`); every amount and label arrives as a prop. The brief's sample values (₦23.25, ₦40 + ₦25) live only in the dev-only preview route and tests. No em-dashes. No refund promise: confirming says "hasn't been confirmed yet. Check again before you pay a second time"; failed says "didn't complete. Check your Naira wallet before you try again" (BRIEF rule 6 respected). Rule 5 respected: Total row, pay button, "This costs" and the shortfall all use the same total.

### Findings

1. **defect** (V5, minor): the creator's verified tick in the sheet header is not drawn. H14 and H17 show a blue tick after "Chidi Eze"; `PayItem` (`src/components/pay-sheet/PaySheet.tsx:11-17`) has no way to say the seller is verified, and `Header` (`PaySheet.tsx:216-240`) draws the subtitle as plain text. The builder lists it as a known difference, but no DECISIONS or BRIEF entry removes it.
2. **defect** (V5, minor): row dividers, card borders, the sheet's top edge and the Cancel button border are twice the canvas's weight. `StyleSheet.hairlineWidth * 2` (`PaySheet.tsx:255, 357, 380, 402`) is 2 px on web, measured 4 device px at 2x against the canvas's 2 (`zoom-H14-*.png`); on a 3x phone it would be about 0.67 px instead, so the weight changes by platform. The canvas draws 1 px.
3. **unclear** (W10, BRIEF rule 3): with two fee parts the sheet shows "Fintava's charge ₦40", "WAWU's fee ₦25", then "Total ₦25,065", but never the total fee (₦65). Rule 3 reads "Fintava's charge + WAWU's fee = total fee, then the Total", and BRIEF W10 writes "₦40 + ₦25 = ₦65, Total ₦25,065.00"; but its layout examples ("two rows plus a total") can be read either way. The component cannot show a total-fee line (`PaySheet.tsx:124-125`), so this needs the owner's reading before WALLET-02 uses it.
4. **unclear** (W10): W10 draws Fee and Total with faded kobo always ("₦25,065.00"), and Note after Total; the sheet uses H14's whole-naira style for every row ("₦25,065", `money.ts:55-59`) and puts detail rows before the fees (`PaySheet.tsx:123-124`). The full W10 screen is WALLET-02's, so whether the sheet should follow H14 or W10 here is the owner's call.
5. **unclear** (icons): the wallet, plus, clock, cross and check-ring marks are drawn from Views (`glyphs.tsx`) and only roughly match the canvas's Lucide shapes (H17 banner wallet most visibly). Requested in SHARED-CHANGES section 1 row 1, which is a request, not a ruling, so it is not a recorded reason yet.
6. **differs-for-recorded-reason**: "Fee: No fee" and "Unlock · ₦2,500" (H14) and "₦2,500 / ₦1,300" (H17) are replaced by the Fintava's charge row, Total and totals on the buttons: BRIEF H14, H17, rules 3 to 5, DECISIONS R-10. The ₦ sign is drawn by the platform fallback font at a different weight from the canvas's: DECISIONS D15 / BRIEF section 1. The thumbnail (app icon) and the grey or black backdrop are preview-route sample data, not the component.

Notes (not defects): the sheet has no latch of its own against a double tap; two taps calls `onPay` twice unless the caller flips `status` to `paying` on the first (my test: one call when the caller does, two when it doesn't). The server's idempotency belongs to the money path's V8. A malformed quote (e.g. a fee of 23.25 kobo) throws during render and the sheet shows nothing (`PaySheet.tsx:87`, `money.ts:15-19`); the host needs an error boundary. `money.ts:2-5` says "Nothing here divides", but line 46 divides (exactly, by 100). Several style sizes are token arithmetic with literal nudges (`+ 0.5`, `* 0.72`, `- 0.01`, `opacity: 0.5`; `PaySheet.tsx:388-450`), which the gates accept.

Verdict: 2 open defects (1, 2), 3 unclear for the owner (3 to 5). Status back to `building`.

### Round 2

Verifier session (the same one, still not the builder), 2 Oct 2026. I checked f890056 (3edc9bd fixes, 970730e merge of origin/main e657ad5, f890056 report) in a fresh detached worktree. I exported to web with `expo export --platform web --dev --clear` (Metro cache cleared), served it on 8793 and shot it with Playwright + Chromium 1194 at 390 px. Evidence is in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money03/` (`shots2/`, `side2-*`, `zoom2-*`, `grid2-*`, `check2.log`, `edge-tests2.log`, `zz-verifier2.test.tsx`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` exit 0 after the merge: tsc and lint clean; jest 6 suites, 54 tests passed; gates 9 run, **30 files scanned**, 0 fail, 0 warn, 0 accepted, baseline 0; tasks 187 OK (`check2.log`) |
| V5 Picture | passed | H14 beside the build, light and dark (`side2-H14-enough-*.png`, `zoom2-H14-header-*.png`); H17 and the send case re-shot (`shots2/pay-sheet-short-*`, `shots2/pay-sheet-send-*`) |
| V6 States | passed | All 9 preview states re-shot in light and dark, with no page errors (`shots2/`, `grid2-others-*.png`) |

- **Defect 1, closed.** The verified tick is drawn after "Chidi Eze" and before "· Video · 18 min" in every state that has a header, matching H14 and H17 in both themes (`zoom2-H14-header-light.png`). `PayItem.by` and `verified` are props; the builder's test covers the case with no tick.
- **Defect 2, closed.** I measured the dividers and card edges at 2 device px at 2x (1 CSS px), the same as the canvas. In round 1 they were 4. `LINE = 1` at `PaySheet.tsx` replaces `hairlineWidth * 2` at every place I listed.
- **Unclear 3, resolved by the owner's ruling.** When there are two fee parts, the send shows "Fintava's charge ₦40", "WAWU's fee ₦25", "Fees ₦65", then "Total ₦25,065" and "Send · ₦25,065". There is no Fees row with one part. The not-enough card uses the same rows. My test with parts of ₦15.75 and ₦0 shows a Fees row of ₦15.75, and the shortfall includes it ("Add ₦2,515.75").
- **Unclear 4, deferred by the owner** to WALLET-02 (SHARED-CHANGES section 2, row 2). Not a finding for this task.
- **Unclear 5, the owner keeps the View icons** until the shared icon request is done (SHARED-CHANGES section 1, row 6). Not a finding for this task.
- **Double-tap guard: tried myself and judged safe for this component.** My jest tests (`edge-tests2.log`, 6 passed):
  - Three taps in one React batch, before any re-render, call `onPay` once. Round 1 called it twice.
  - With a void `onPay` that never changes `status`, taps inside 360 ms are ignored, and a tap after 361 ms calls `onPay` again.
  - With a promise, the guard holds past 5 s until the promise settles. A rejected promise also releases it.
  - The cycle review, then paying, then failed, then review allows paying again.

  In the browser, a double-click on "Unlock · ₦2,523.25" produced one navigation to `state=paying`.

  The 360 ms release only applies to a caller that returns nothing and never sets `paying`. Per the prop's contract, that caller opens the PIN sheet next, so a later tap at worst reopens the PIN step. No debit happens in `onPay` itself. The real protection against a double debit is the money path's own idempotency (its V8). I'd keep it, and have HOME-12 and MONEY-19 return the promise or set `paying` as the contract asks.
- **Merge.** The branch against main e657ad5 changes only the builder's files (`src/components/pay-sheet/`, the preview route, SHARED-CHANGES, LOG, PROGRESS, this file). SHELL-02 and SHELL-03 came in unchanged, and `npm run check` is green. `SHARED-CHANGES.md` has no conflict markers. Its row numbers are unique in each table: section 1 has rows 1 to 6 and section 2 has rows 1 to 2.
- Facts are unchanged from round 1: no literal fee in the component, no em-dashes, and no refund promise.

Notes (not defects):
- The owner's three rulings (Fees subtotal, W10 deferred, View icons) are recorded only in this file and in SHARED-CHANGES, not in DECISIONS.md or the brief. Recording the Fees-row reading of BRIEF rule 3 there would stop the next screen that shows a fee from asking again.
- SHARED-CHANGES section 1 row 6 doesn't list the new View-drawn verified tick (`VerifiedTick` in `glyphs.tsx`) among the shapes to replace.
- `setTimeout(release, motion.slow)` is not cleared on unmount. That is harmless because it only writes a ref.

Round 2 verdict: no open defects. Status `review`.

### Round 3

Verifier session (the same one, still not the builder), 2 Oct 2026. I checked 8b079e4, which sits on main 6b7eaff, in a fresh detached worktree that I removed afterwards. I exported with `expo export --platform web --dev --clear`, served it on 8793, and shot it with Playwright + Chromium 1194 at 390 px in light and dark. All 10 preview states rendered, including `send` and `send-short`. Evidence is in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money03/`: `shots3/`, `design_shots3/`, `side3-W10-send-*.png`, `icons3-*.png`, `plus-and-sendshort.png`, `check3.log`, `edge-tests3.log` and `zz-verifier3.test.tsx`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` exit 0: tsc and lint clean; jest 8 suites, 95 tests passed; gates 9 run, **40 files scanned**, 0 fail, 0 warn, 0 accepted, baseline 0; tasks 187 OK (`check3.log`) |
| V5 Picture | failed (defect R3-2) | W10 beside the send state in light and dark (`side3-W10-send-*.png`); H14 and H17 icons and ticks (`icons3-*.png`) |
| V6 States | passed | All 10 preview states in light and dark, with no page errors (`shots3/`) |

Checks:
1. **Send variant against W10, light and dark.**
   - Matches: the avatar (CO, coral, 64), "Sending to Chidinma Adaeze Okoro", the amount at 40 with faded kobo, and the card rows in the order Bank, Account, fee parts, Fees, Total, Note. Every card amount shows its kobo at 0.72 size and 50% opacity (`Amount`, `KOBO_SCALE`, `styles.kobo`). The wallet card, the 54 px button and the 50 px row pitch also match.
   - Differences with a recorded reason:
     - The Fee row became "Fintava's charge ₦40.00", "WAWU's fee ₦25.00" and "Fees ₦65.00" (BRIEF rule 3, W10 entry, DECISIONS R-23).
     - Total ₦25,065.00 (BRIEF W10).
     - "They get ₦25,000" above the button, and "Send ₦25,065" (BRIEF rule 5, W10 entry).
     - The ₦ sign comes from the platform fallback font (D15).
     - The status bar and the exact top offset belong to the preview route, not the component.
   - One difference without a recorded reason: defect R3-2.
2. **Icons.**
   - Every mark comes from `@/components/icon`, matching the generator's `I()` calls:
     - Wallet 19 / 2.2 (kit `banner`)
     - CircleCheck 20 / 2.2 (kit `fromWallet`)
     - Plus and RotateCcw 19 / 2.2 (kit `Btn` lg)
     - Clock 32 / 2.4 (H18)
     - `VerifiedTick` 'pro' at 13 (H14 and H17: `tick('pro', 13)`)
   - The failed state's X takes W14's icon name at H18's 32 / 2.4 inside H18's 72 px disc. No pay-sheet artboard draws a failed state; the coordinator recorded this, and I accept it.
   - `glyphs.tsx` is gone, and no hand-drawn mark is left in `src/components/pay-sheet/`. The ₦ coin is text, as on the canvas.
   - I checked the tick again: blue, after "Chidi Eze", in H14 and H17, light and dark.
3. **SHARED-CHANGES: failed (defect R3-1).** There are no conflict markers, and row numbers are unique in every table (section 1: 1 to 5; section 2: 1; Applied: 6). But section 2 row 1 is still a MONEY-03 deferral row.
4. **Rulings: passed.** R-21, R-22 and R-23 appear once each in DECISIONS.md, and `git grep '^<<<<<<<\|^>>>>>>>'` finds nothing.
5. **Round 2 behaviour: passed** (`edge-tests3.log`, all passed).
   - Three taps in one batch: one `onPay`.
   - A void caller is held for 360 ms, then released.
   - A promise caller is held until it settles; a rejected promise releases too.
   - The cycle review, paying, failed, review re-arms the button.
   - The Fees row is right.
   - Unmounting with the release timer pending calls `clearTimeout` once (`usePayOnce`'s cleanup effect).
   - A browser double-click on Unlock gave one navigation.
   - Send with ₦15.75 + ₦10 shows "Send ₦25,025.75".
6. **Branch against main: passed.** It changes only `src/components/pay-sheet/`, `src/app/preview/pay-sheet.tsx`, DECISIONS.md (R-23), SHARED-CHANGES.md, LOG, PROGRESS and this file.
7. **`npm run check`: exit 0** (above).

Findings:

- **R3-1, defect (forked shared components, and a deferral row left).** UI-01 is `done` and on main: `src/components/Button.tsx` (lg 54 / 24 / 16 / icon 19, `primary`, `secondary`, `loading`), `src/components/Money.tsx` (kobo at 0.72 and 0.5) and `src/components/Text.tsx`. The pay sheet still carries its own copies:
  - `PillButton` (`PaySheet.tsx:498-540`). Its comment still says "Local to this sheet until UI-01's Button lands".
  - `Amount` (`PaySheet.tsx:417-447`), a copy of `Money`.
  - Local row text styles.

  `SHARED-CHANGES.md` section 2 row 1 (MONEY-03) still defers swapping them in, and the UI-01 half of that row is already due. Adopt `Button` and `Money` (add a prop to them if the sheet needs one, never a fork), then either remove the row or cut it down to the UI-02 sheet host. UI-02 is still `todo`, so that half can't be done yet.
- **R3-2, defect (V5, W10, minor).** The W10 amount block is about 14 CSS px taller than the canvas, so the card and everything below it sit lower.
  - Measured from the avatar's top: the caption is in place (+1 px), the amount's ink is +8 CSS px, and the card's top edge is +14 CSS px (`side3-W10-send-*.png`).
  - Cause: `Amount` (`PaySheet.tsx:421-447`), used at 40 in `SendHeader` (`PaySheet.tsx:377-390`), sets no `lineHeight`. The kit's `Amt` uses `line-height:1`.
  - The row amounts are not affected, because the 50 px row minimum height absorbs it.
  - Adopting `Money` for R3-1 may fix this too, if `Money` sets the kit's line height.

Notes (not defects):
- The send-short state mixes styles: the banner says "This costs ₦25,065. You have ₦25,000.00." and the button says "Add ₦65", while the card shows faded kobo. This follows H17's purchase convention, and no artboard draws a send that is short.
- The 360 ms release for a void `onPay` is unchanged from round 2 and still judged safe: no money moves in `onPay`, and the money path's idempotency is its V8.

Round 3 verdict: 2 open defects (R3-1, R3-2). Status back to `building`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
