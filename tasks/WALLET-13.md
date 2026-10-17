---
id: WALLET-13
title: Earnings breakdown
owner: YOU
area: WALLET
order: 157
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [WALLET-16, UI-02, KYC-05]
decisions: [R-11, R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W39]
---
# WALLET-13 · Earnings breakdown

## Current state

As of 17 Oct 2026, built by a Sonnet builder (T1), waiting for a verifier.
- **Status:** verifying.
- **Branch:** mobile `wmt/WALLET-13` on origin/wmt/MERGE-10 `4b854ee4` with origin/wmt/WALLET-16-R55 `e0f033e` merged (merge `70fc120e`); code head `7e4098e7`. No backend change: it reads WALLET-16's `GET /money/earnings` and `/content` (backend wmt/WALLET-16-R55 `9580bb0`). No migration, no fenced-file change, no SHARED-CHANGES row.
- **Built:** W39 at `/earnings` (`src/features/wallet/earnings/`, `src/app/earnings.tsx`). This month's earnings big with all time under it (the Hub's figures, nothing added up here); the month by Unlocks, Tips and Paid DMs and any other stream the Hub lists; the month piece by piece with Show more (the Hub's cursor); no Move to wallet, no Ready to move (R-11). Money still waiting (the Hub's `waiting`): no wallet leads to "Open your wallet" and says it lands the moment one is opened; with a wallet it says once a day (R-55). States: loading, error with Try again, offline, nothing earned yet, a month with nothing, pieces failing alone.
- **Not drawn (R-47):** the calendar button (no board draws the month chooser, G-WALLET-13-1); pieces' pictures and format line (not served, G-WALLET-13-2); the next move's time and the floor (G-WALLET-13-3); `held` money and sales from before the sweep start (G-WALLET-13-4).
- **Entry:** the Earnings row on M18 (Creator dashboard) is ME-07's (it depends on this task). Until it lands the screen opens by `/earnings` only.
- **Checks:** typecheck EXIT 0; eslint on the 5 changed paths EXIT 0; jest earningsModel (6) and earningsScreen (11) plus history specs: 4 suites, 83 tests EXIT 0; `npm run gates` EXIT 0 (886 files, 0 fail, 9 warn of other tasks, none in these files).
- **Stack `w13` (ports 7880-7887, Nuvion stand-in), walked:** a creator with a wallet whose move landed (nothing waiting); the same with a small tip after the day's move (waiting, once a day); a creator with no wallet (waiting, Open your wallet opens A31, back returns); a creator with nothing earned; sales completed before the sweep start (two unlocks) are in no figure and unpaid, as the Hub says; loading and error through held and failed requests. Month with nothing: no real cause on the stack (an earning's date is guarded), picture fed by the Hub's own answer with the month emptied; covered by a jest test.
- **Pictures:** `scratchpad/wallet-13-b/pics/` (every state, 390 px, light and dark, beside `W39-board-*.png`).
- **Open findings:** none graded yet.
- **Next:** a lean verifier (V1, V5, V6, V9 on the stack); ME-07 adds the entry.
- **History:** tasks/history/WALLET-13.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-11 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W39` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W39 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W39 · Earnings**: Creator-only earnings screen: what was earned (all time and this month), stream split (Unlocks, Tips, Paid DMs) and per-content earnings this month. No 'Ready to move' and no Move to wallet button (R-11, BRIEF W39).

## Ruling R-11

Earnings go into the wallet automatically. W39 is built without its 'Move to wallet' button, and W40 is not built.

## Brief changes (build these, not the canvas)

- **W39**: no button and no "Ready to move". Earnings land in the wallet by themselves. Lead with what was earned (for example "₦312,800 earned all time", or this month) and keep the breakdown by stream and by content. For a creator who hasn't opened a wallet yet, a short note: the money is waiting and lands the moment they open one, with a link to Open your wallet. (Why: R-11.)

## Capability checks

- [ ] **W39**: a user sees what they earned (all time and this month), split by Unlocks, Tips and Paid DMs, and per piece; a creator without a wallet sees that the money is waiting and can tap Open your wallet (A26).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **W39**: partial. Missing: Earnings exist but are swept automatically into the wallet, so there is no 'ready to move' balance concept and no per-content aggregation (unlocks/tips/sales per piece). The response also carries community_credits and 'held' DM money that the canvas does not show.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W39: Ready to move ₦84,500.00
- W39: ₦312,800 earned all time
- W39: Unlocks ₦61,500
- W39: Tips ₦14,000
- W39: Paid DMs ₦9,000
- W39: How I light a night shoot +₦42,000
- W40: 'It's instant and free.'

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-13.md](history/WALLET-13.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
