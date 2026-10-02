---
id: MONEY-03
title: The pay-from-wallet sheet
owner: YOU
area: MONEY
order: 12
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
