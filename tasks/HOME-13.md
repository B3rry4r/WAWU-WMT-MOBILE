---
id: HOME-13
title: Tip a creator
owner: YOU
area: HOME
order: 118
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, HOME-14, UI-02, HOME-02]
decisions: [R-6, R-10, R-64, R-53, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [H26, H27, H28]
---
# HOME-13 · Tip a creator

## Current state

As of 17 Oct 2026, built (bundle S1, Sonnet builder), waiting for a verifier.
- **Status:** verifying. Mobile `wmt/S1` (from `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/B1` merged, never rebased). Backend: none changed; used `wmt/B1` `e41210e` (HOME-14).
- **Built:** H2's rail `₦ Tip` (not on your own post), H26 (Tip sheet), H27 (shared PIN sheet), H28 (Tip sent, "Total paid"), and the pay sheet's states between them (Not enough, Still confirming, Didn't go through). Files: `src/features/tips/`, `src/features/feedpay/` (shared with HOME-12), the rail in `src/features/feed/`.
- **Not drawn (R-47, R-64):** the Naira/Dollar/USDT picker. The Add button leads to the Wallet tab, as the ticket checkout's does.
- **Open for the lead:** SHARED-CHANGES HOME-13 #1 (export the pay sheet's wallet card; `WalletLine` copies it meanwhile); BACKEND_GAPS G-1721 (the quick amounts are the board's, PROVISIONAL TIP-QUICK-AMOUNTS).
- **Next:** a verifier; passes V1, V4, V5, V6, V7, V8, V9. Records: this file and `docs/LOG.md`.

## Design v2 update (16 Oct 2026)

- The tip sheet's currency picker (Naira, Dollar, USDT) drawn on H26 is not built until dollar and crypto accounts exist (R-16, R-64). Quick amounts, the note and the breakdown stay. The provider's part of the breakdown is labelled "Bank charge" (R-53); the app name is "Who Made This?" (R-69).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H26 H27 H28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H26, H27, H28 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H26 · Tip sheet**: Tip sheet: 'Goes straight to their wallet. They see your name and note.' Quick amounts ₦500/₦1,000/₦2,000/₦5,000, other amount, note, the breakdown (Tip, Fintava's charge, Total), Pay from wallet, 'Tip ₦2,023.25' (BRIEF H26).
- **H27 · PIN**: PIN sheet 'Approve ₦2,000 to Tife Adeola'.
- **H28 · Tip sent**: '₦2,000 sent to Tife', note echoed. a 'Total paid ₦2,023.25' row (BRIEF H28). 'The creator gets a notification and an Inbox money bubble' (the bubble is drawn by INBOX-19). Done returns to the feed.

## Brief changes (build these, not the canvas)

- **H26**: add the breakdown above Pay from wallet: Tip ₦2,000, Fintava's charge ₦23.25, Total ₦2,023.25; button "Tip ₦2,023.25". (Why: R-10 and the purchases default; rule 5.)
- **H27**: "Approve ₦2,023.25 to Tife Adeola". (Why: rule 5, following H26.)
- **H28**: keep the heading, and add a row "Total paid ₦2,023.25". (Why: rule 5.)

## Capability checks

- [ ] **H26**: a user can pick an amount or enter another; write a note; see ₦2,000 + ₦23.25 = ₦2,023.25 and tap "Tip ₦2,023.25".
- [ ] **H27**: a user can enter PIN.
- [ ] **H28**: a user sees "Total paid ₦2,023.25" and can tap Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From H2's ₦ Tip (HOME-02), a user can reach H26 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Tip lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **H26**: partial. Missing: Tip + note exist via Flutterwave; no wallet-debit tip, no PIN; tip is not tied to a content piece (no contentId in CreateTipDto).
- **H27**: missing. Missing: No PIN.
- **H28**: partial. Missing: Notification exists; no Inbox money-bubble message type (DM model is paid questions).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H26: ₦500 / ₦1,000 / ₦2,000 / ₦5,000 presets
- H26: 'Goes straight to their wallet'

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Files.** New: `src/features/tips/` (`api.ts`, `model.ts`, `useTip.ts`, `TipSheets.tsx`, tests) and `src/features/feedpay/` (`payCall.ts`, `usePaymentFlow.ts`, `StatusSheet.tsx`, `useFeedPay.tsx`, `useKeyboardLift.ts`, shared with HOME-12). Edited: `src/features/feed/{FeedScreen,PostFrame,parts,look}`, `src/features/home/HomeScreen.tsx`, `src/app/(tabs)/index.tsx` (the handlers). With no handlers the feed draws no Tip (R-47).
**How it pays.** The breakdown is the Hub's quote for the amount, asked again on every change; Tip asks a FRESH quote before the PIN and shows, never pays, a moved total; ONE Idempotency-Key per attempt, kept (with its quote) across a wrong PIN, a lost answer and a closed sheet; `pending` is only read.
**Checks.** `npx tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest tips+unlock+feed+home+shell, route-graph, focus, auth-guard, open-wallet guards: 17 suites, 266 tests EXIT 0 (18 new tip tests); `npm run gates` EXIT 0, 0 fail (was 0). Tests attack: double tap, wrong PIN, short balance (quote and payment), lost answer then retry, quote changed (before and at the PIN), pending, refused, no wallet.
**On the stack** (backend `e41210e` + STACK-NUV, `s1_test`, ports 7700-7707, Nuvion stand-in at ₦23.25): through the app's own screens, once each. Double tap: 1 payment, debit 202,325. Wrong PIN: nothing moved, same key, 1 debit. Short balance: sheet "You have ₦1,000.00", no payment, no debit. Lost answer (Hub took it, answer dropped) then retry: same key, no new quote, 1 debit. Quote changed: not drawable on the stack (the stand-in's fee is fixed); covered by tests.
**Pictures** (390 px, light and dark, beside the boards H2, H26, H27, H28): `.../scratchpad/s1-b/pics/beside-*.png`.
**Not done.** An attempt is kept for the app's run only (a force-quit after a lost answer gets a new key); the quote-changed attack on the stack; the Android and iOS phones (web export only).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
