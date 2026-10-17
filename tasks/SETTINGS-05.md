---
id: SETTINGS-05
title: Delete account
owner: YOU
area: SETTINGS
order: 179
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SETTINGS-06, SETTINGS-08, MONEY-11, MONEY-13, UI-02, SETTINGS-01, WALLET-05]
decisions: [R-17, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [Z6, Z7, Z8]
---
# SETTINGS-05 · Delete account

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): SETTINGS-06, SETTINGS-08, WALLET-05.
- **History:** none yet. Reports go to tasks/history/SETTINGS-05.md.

## Current state

As of 17 Oct 2026, built (Sonnet builder, T2 identity; mobile `wmt/SETTINGS-05` on `origin/wmt/MERGE-11` `47555987` with `origin/wmt/WALLET-05` `8f2efc8d` merged, commit `c7b90b61`; backend `wmt/SETTINGS-05` `56c4b61` on `origin/wmt/SETTINGS-08` `4491120`; wawu-id run only at `01b751f`; status verifying).
- **Merge:** conflicts in SHARED-CHANGES, SOURCE_COMMIT, PROGRESS, MoneyCard, TodayScreen, HomeScreen.test, send model.test. Every side kept: WALLET-05's Add action stays, Bills stays gone (DV2-RM, R-52); recorded as SHARED-CHANGES SETTINGS-05 #3.
- **Built:** Z2's muted "Delete account" under Sign out (drawn because Z6 exists), Z6 (`/settings/delete-account`: the bank's balance read as the Wallet tab reads it; money shows the figure and Withdraw (W17) and holds Continue; no wallet (R-6) shows no warning and no wallet row and Continue is open; a balance that cannot be read says so and is never taken as empty), Z7 (`/confirm`: optional reason, type DELETE, one request per tap; the Hub's refusal shown in its words, with Withdraw when the wallet holds money), Z8 (`/scheduled?on=`: the Hub's date; Done and Android back sign out, gesture back is off). Feature code `src/features/delete-account/`.
- **Backend (additive):** `AccountDeletion.leavingReason` (nullable, migration `20261025181000`), `DELETE /account` takes optional `reason` (five codes, validated; no body is what it always was); spec `account-deletion-reason.contract.spec.ts` (7). Contract regenerated; the app's copy updated by the delta (SHARED-CHANGES SETTINGS-05 #1).
- **Decisions:** the select's five choices are mine (the board shows only "I don't use it enough"); tapping the chosen one clears it; "Your wallet and cards" reads "Your wallet" (BRIEF Z6) and is left out when there is no wallet; the board's "30 days" is not drawn (G-SETTINGS-05-1); Z8's 88 tile uses tone `neutral`, which the design system has no colour for, so the board draws no circle or mark: built as the picture (room kept, nothing drawn), designer note below.
- **Checks:** mobile tsc EXIT 0; eslint on 71 changed files EXIT 0; jest delete-account (2 suites, 34 tests) and settings, home, send model, withdraw, addmoney (10 suites, 234) pass; `npm run gates` EXIT 0 (0 fail, 11 warn, 926 files; the 11 are PROVISIONAL notes, none mine; count before not run, the base's last record was 0 fail, 11 warn). Backend: tsc EXIT 0, eslint on changed files EXIT 0, reason spec 7 pass, `account.contract.spec` 6 pass on the stack's mock WAWU ID, `zz-v2-nuvion` and `round9` pass, gates and baseline EXIT 0 (0 fail, 127 warn).
- **On the stack set05_test** (real wawu-id `01b751f`, Hub on the Nuvion stand-in, ports 7850-7857, down and dropped): wallet with the board's ₦485,250.75: Z6 warning and Withdraw (opens W17), Continue closed; Z7 refused in the Hub's words, nothing scheduled, Withdraw opens W17. Owed earning: the Hub's refusal in its words, no Withdraw, no row. Nothing in the way: scheduled with reason `privacy` stored, Hub and wawu-id hold the same date, Z8 reads "On 16 November", Done signs out to the welcome screen; signing in again at WAWU ID cancelled once (Hub `cancelled`, WAWU ID `active`), a second sign-in changed nothing. Double tap on Delete my account: one DELETE, one row, one window.
- **Pictures:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/set05-b/pics/` 390 wide, light and dark: `board-*` and `side-*` (board left, built right) for Z2 foot, Z6, Z7, Z8; Z6 loading, error and no wallet; Z7 empty, sheet, refused (wallet, earning), error. Not run: V10 (phone), a real bank outage (the unreachable pictures answer the Hub's own 503 body in the browser).
- **Gaps and shared changes:** G-SETTINGS-05-1 (no served waiting period), G-SETTINGS-05-2 (no read says a deletion is waiting); SHARED-CHANGES SETTINGS-05 #1 (contract copy), #2 (Banner action, Button danger), #3 (merge). **Next:** the verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-17 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py Z6 Z7 Z8` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z6 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **Z6 · Delete account**: 'Delete your account? This can't be undone after 30 days.' Warning card 'Empty your wallet first. You have ₦485,250.75. Withdraw it to your bank before deleting.' Withdraw. Lists what goes: profile, content and communities; purchases and tickets; wallet (no cards at launch; recorded in BRIEF). Continue (enabled when wallet empty).
- **Z7 · Confirm**: 'Why are you leaving? (optional)' select (I don't use it enough); 'Type DELETE to confirm'; Delete my account.
- **Z8 · Scheduled**: 'Scheduled for deletion. On 26 October. Sign in before then to cancel.' Done.

## Brief changes (build these, not the canvas)

- **Z6**: "wallet". No cards at launch. (Why: R-16.)

## Capability checks

- [ ] **Z6**: a user can tap Withdraw (-> wallet); tap Continue (-> Z7).
- [ ] **Z7**: a user can pick reason (optional); type DELETE; confirm.
- [ ] **Z8**: a user can Done (signs out).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states Z8.
- [ ] From Z2 (SETTINGS-01), a user can tap Delete account and reach Z6 (this task adds the row, as Z2 draws it).
- [ ] A user without a wallet sees no wallet warning and can continue.

## What the backend serves today (from the analysis)

- **Z6**: partial. Missing: No wallet-empty precheck on delete; grace is 48h not 30 days; content is removed immediately (not restorable); cards do not exist.
- **Z7**: partial. Missing: No place to send or store the leaving reason.
- **Z8**: partial. Missing: No cancel path: WAWU ID login does not check or clear pending_deletion, and the hub has no cancel endpoint; content already marked removed would not come back.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z6: 'This can't be undone after 30 days.'
- Z6: 'You have ₦485,250.75.'
- Z6: 'Empty your wallet first'
- Z8: 'On 26 October' (≈25 days after board date; implies 30-day window)
- Z8: 'Sign in before then to cancel.'

## Designer notes (⚠, unresolved)

- Z8: the tile is drawn with tone `neutral` (`result('neutral', 'Clock', ...)`), a tone the design system has no colour for, so the board shows no circle and no clock (the 88 of room is there). Built as the picture. If a neutral tile with a clock is wanted, the designer names its colours.

## Builder report

Mobile: `src/features/delete-account/` (api, model, WalletNotice, DeleteAccountScreen, ConfirmDeletionScreen, ReasonSheet, ScheduledScreen, two test files), routes `src/app/settings/delete-account/{index,confirm,scheduled}.tsx`, the row in `src/features/settings/SettingsScreen.tsx` and `src/app/settings/index.tsx`, the contract copy. Backend: `src/account/{account.controller,account.service}.ts`, `dto/delete-account.dto.ts`, schema column and migration `20261025181000`, one spec, regenerated contract. Each capability check and how it was tested is in Current state above (jest cases are written as "a user can ..."; the stack run drove the built screens against the real Hub and wawu-id). Not run: V10, the gate count before the change.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
