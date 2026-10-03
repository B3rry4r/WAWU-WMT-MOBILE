---
id: WALLET-02
title: Send to a WAWU user
owner: YOU
area: WALLET
order: 137
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, WALLET-06, WALLET-07, WALLET-08, WALLET-14, UI-02, UI-03]
decisions: [R-10, R-26, R-33, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W7, W9, W10, W11, W12]
---
# WALLET-02 · Send to a WAWU user

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W7 W9 W10 W11 W12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W10, W11, W12 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The amount keypad (W9) goes in `src/components` (a `SHARED-CHANGES.md` request) so INBOX-19's send-in-chat reuses it, never a copy.

## Artboards

- **W7 · Send · to a WAWU user**: Recipient picker: search by name, @handle or phone; recent recipients; WAWU user results with purple (creator) or blue (professional) ticks.
- **W9 · Send · amount**: Custom keypad amount entry with balance beneath, quick amounts, optional note.
- **W10 · Send · review**: Review card: recipient, amount, note, the fee breakdown (Fintava's charge + WAWU's ₦10, then Fees and Total), Pay from wallet; the button shows the total and a line says what they get (BRIEF W10, rule 5).
- **W11 · Send · PIN**: PIN bottom sheet over review: 4-digit transaction PIN approves every money movement; the phone's fingerprint or face unlock can stand in (R-26); Forgot PIN. Reused by Home, Inbox, Swap, Withdraw, Cards, Earnings.
- **W12 · Send · success receipt**: Receipt: amount sent, recipient + bank, Completed, reference, date, source, the fee breakdown and Total paid; save as beneficiary; share (the phone's share sheet at launch, R-33); Done returns to W1 with new row on top.

## Brief changes (build these, not the canvas)

- **W10**: the fee breakdown (rule 3). For this bank send: Fintava's charge ₦40 + WAWU's fee ₦25 = ₦65, Total ₦25,065.00. If you also draw the WAWU-user version: ₦15.75 + ₦10 = ₦25.75, Total ₦25,025.75. The button shows the total, "Send ₦25,065", and a line above it says what arrives: "They get ₦25,000" (rule 5). Your note on W10, "The button shows the amount the person receives", changes to match. (Why: R-10, Fintava's price list.)
- **W11**: the same rows as the new W10 (₦40 + ₦25 = ₦65, Total ₦25,065.00), and the sheet's line "Approve ₦25,000 to Chidinma Okoro" becomes "Approve ₦25,065 to Chidinma Okoro". (Why: R-10 and rule 5.)
- **W11**: the phone's own fingerprint or face unlock, whichever it has; the label names it ("Use fingerprint" on most Android phones). When it fails: "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use your PIN."), and no PIN try is used up. The same on H15, M13 and every PIN sheet. (Why: R-26. Testing is Android first (R-24); Face ID is Apple's.)
- **W12**: the fee breakdown: ₦40 + ₦25 = ₦65 for the bank send shown, and a "Total paid ₦25,065.00" row. The heading "₦25,000 sent" stays. (Why: R-10 and rule 5.)
- **W12**: at launch, Share receipt opens the phone's share sheet with the receipt's text and reference. The same on W19, W27, S7 and SC7. The W41 image and PDF come after launch (WALLET-12). (Why: R-33.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W7: the Bank account tab (opens W8): added by WALLET-03

## Capability checks

- [ ] **W7**: a user can type name/@handle/phone; pick a recent; pick a result.
- [ ] **W9**: a user can enter amount; tap quick amount; add note; Continue.
- [ ] **W10**: a user sending ₦25,000 to a WAWU user sees ₦15.75 + ₦10 = ₦25.75, a total of ₦25,025.75 on the button and "They get ₦25,000".
- [ ] **W11**: a user can enter the 4-digit PIN; tap Forgot PIN? (W37); approve with fingerprint or face where the phone has it.
- [ ] **W12**: a user can Save as beneficiary; Share receipt through the phone's share sheet (text and reference); Done.
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
