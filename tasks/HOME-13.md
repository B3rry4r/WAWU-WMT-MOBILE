---
id: HOME-13
title: Tip a creator
owner: YOU
area: HOME
order: 118
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, HOME-14, UI-02, HOME-02]
decisions: [R-6, R-10, R-64, R-53, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [H26, H27, H28]
---
# HOME-13 · Tip a creator

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (every attack pays once; the 85% once) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S1.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main. Built: Mobile `wmt/S1` (from `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/B1` merged, never rebased). Backend: none changed; used `wmt/B1` `e41210e` (HOME-14).
- **Built:** H2's rail `₦ Tip` (not on your own post), H26 (Tip sheet), H27 (shared PIN sheet), H28 (Tip sent, "Total paid"), and the pay sheet's states between them (Not enough, Still confirming, Didn't go through). Files: `src/features/tips/`, `src/features/feedpay/` (shared with HOME-12), the rail in `src/features/feed/`.
- **Not drawn (R-47, R-64):** the Naira/Dollar/USDT picker. The Add button leads to the Wallet tab, as the ticket checkout's does.
- **Open for the lead:** SHARED-CHANGES HOME-13 #1 (export the pay sheet's wallet card; `WalletLine` copies it meanwhile); BACKEND_GAPS G-1721 (the quick amounts are the board's, PROVISIONAL TIP-QUICK-AMOUNTS).
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-APP (S1 L1 to L3).

Status set to review by the records sync, 25 Oct 2026: merged as app 099cf130, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-13.md](history/HOME-13.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
