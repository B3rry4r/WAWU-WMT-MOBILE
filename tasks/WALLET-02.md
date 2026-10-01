---
id: WALLET-02
title: Send to a WAWU user
owner: YOU
area: WALLET
order: 136
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, WALLET-07, WALLET-08]
decisions: [D5]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W7, W9, W10, W11, W12]
---
# WALLET-02 · Send to a WAWU user

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D5 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- The design: `python3 scripts/design/render_design.py W7 W9 W10 W11 W12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W7 · Send · to a WAWU user**: Recipient picker: search by name, @handle or phone; recent recipients; WAWU user results with purple (creator) or blue (professional) ticks.
- **W9 · Send · amount**: Custom keypad amount entry with balance beneath, quick amounts, optional note.
- **W10 · Send · review**: Review card: recipient, amount, bank, account, fee shown separately, total, note, Pay from wallet; button shows amount received.
- **W11 · Send · PIN**: PIN bottom sheet over review: 4-digit transaction PIN approves every money movement; Face ID can stand in; Forgot PIN. Reused by Home, Inbox, Swap, Withdraw, Cards, Earnings.
- **W12 · Send · success receipt**: Receipt: amount sent, recipient + bank, Completed, reference, date, source, fee; save as beneficiary; share; Done returns to W1 with new row on top.

## Capability checks

- [ ] **W7**: a user can type name/@handle/phone; pick a recent; pick a result; switch to Bank account tab.
- [ ] **W9**: a user can enter amount; tap quick amount; add note; Continue.
- [ ] **W10**: a user can Send ₦25,000.
- [ ] **W11**: a user can enter 4-digit PIN; Forgot PIN? (W37); Face ID.
- [ ] **W12**: a user can Save as beneficiary; Share receipt (W41); Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **W7**: partial. Missing: Search covers creators/content/communities only; no buyer or phone lookup, no recents, and no wallet-to-wallet (book) transfer endpoint at all.
- **W9**: partial. Missing: Balance exists (whole naira); no note field on transfers, kobo not supported (amounts are Int naira).
- **W10**: missing. Missing: No fee quote endpoint or fee in the transfer model.
- **W11**: missing. Missing: No transaction PIN anywhere: no storage, verify, lockout, or binding to a debit.
- **W12**: partial. Missing: Withdraw returns a pending stub only; no completed receipt read, no fee, no beneficiary create. WAWU reference format differs (wawu-wd-<uuid> vs WAW-XXXX-XXXX).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W9: quick amounts ₦5,000 / ₦10,000 / ₦25,000 / ₦50,000
- W10: Fee ₦10.00
- W10: Total ₦25,010.00
- W11: 'Face ID can stand in once it's set up'
- W12: Reference WAW-8F2K-91QX
- W12: Fee ₦10.00

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
