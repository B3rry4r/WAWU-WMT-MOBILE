---
id: MONEY-03
title: The pay-from-wallet sheet
owner: YOU
area: MONEY
order: 12
priority: launch
repo: wawu-wmt-mobile
type: component
status: building
depends_on: []
decisions: []
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

## Goal

One payment sheet: what you're paying for, the amount, the wallet balance, and what happens when it's not enough.

## Scope

src/components/pay-sheet/ with states: enough, not enough (top-up path), paying, still confirming, failed.

## Capability checks

- [ ] With too little money, the sheet shows the shortfall and a way to add money.
- [ ] It matches H14 in light and dark.

## Builder report

Builder session, 2 Oct 2026, branch `wmt/MONEY-03`, origin/main ab2df44 (SHELL-01) merged in.
- Files: `src/components/pay-sheet/` (`PaySheet.tsx`, `money.ts`, `glyphs.tsx`, `index.ts`, `__tests__/PaySheet.test.tsx`, `__tests__/money.test.ts`); `src/app/preview/pay-sheet.tsx` (dev-only state gallery, `?state=enough|short|paying|confirming|failed|no-wallet|loading|zero-fee|send`, redirects home when `__DEV__` is false); `SHARED-CHANGES.md` (2 rows).
- Props in, UI out: item, price (kobo), detail rows, fee lines (label + kobo, any can be 0), wallet (`loading` / `none` / `open` with Fintava's balance), status (`review` / `paying` / `confirming` / `failed`), callbacks. The total is price + fee lines added in integer kobo inside the sheet, so the Total row, the pay button, "This costs" and the shortfall can't disagree (brief rule 5). Enough vs not enough comes from balance against that total.
- Check "with too little money, the sheet shows the shortfall and a way to add money": jest `PaySheet.test.tsx` (₦1,200.00 balance against ₦2,523.25 shows "Top up at least ₦1,323.25", the Unlock button is gone, and "Add ₦1,323.25" calls `onAddMoney(132325)`; a bank-send case adds ₦40 + ₦25 to the shortfall). Screenshot `pay-sheet-short-*`.
- Total = amount + fees in kobo, ₦0 fee included: `money.test.ts` and `PaySheet.test.tsx` (₦0 fee line shows "₦0", Total and button show ₦2,500). Non-integer, negative and unsafe amounts throw.
- Other states, each tested: paying (button disabled, no second `onPay`), still confirming (Refresh, Contact support), failed (server message, Try again, Cancel), no wallet (hands over via `onOpenWallet`, MONEY-13), loading balance (pay disabled), send ("They get ₦25,000", "Send · ₦25,065").
- "Matches H14 in light and dark": NOT claimed here; for the verifier. Evidence: `build/screens/MONEY-03/` has 18 state shots (9 states, light and dark, 390 px, from `npx expo export --platform web --dev`, then Playwright and Chromium) plus `side-H14-enough-*`, `side-H17-short-*`, `side-W10-send-*` beside `build/design_shots/` renders. Built to the BRIEF changes (H14: Fintava's charge row and Total, button shows the total; H17: charge under the price, shortfall includes it), not the canvas's "No fee".
- Known differences: icons are drawn from Views (no icon shapes outside TabIcon yet); the thumbnail in the preview is the app icon; the verified tick in the subtitle isn't drawn; type sizes use the nearest `@/theme` sizes (e.g. 13.5 for the canvas's 13). The "still confirming" and "failed" copy is my own, following H18, and makes no promise about refunds (rule 6).
- Gates before: tests 5 passed (2 suites); gates 9 run, 6 files, 0 fail, 0 warn, 0 accepted; tsc and lint clean. After (with main merged): tests 22 passed (5 suites); gates 9 run, 23 files, 0 fail, 0 warn, 0 accepted; tsc and lint clean; `npm run check` exit 0.
- Shared-change requests: icon shapes added to TabIcon or a general Icon; adopt UI-02's sheet and UI-01's buttons, text and money display once they land. No backend gap: the fee quote and balance are inputs, served by MONEY-core tasks.

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
