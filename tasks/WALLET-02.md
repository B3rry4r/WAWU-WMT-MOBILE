---
id: WALLET-02
title: Send to a WAWU user
owner: YOU
area: WALLET
order: 140
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, WALLET-06, WALLET-07, WALLET-08, WALLET-14, UI-02, UI-03]
decisions: [R-10, R-26, R-33, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W7, W9, W10, W11, W12]
---
# WALLET-02 · Send to a WAWU user

## Current state

As of 16 Oct 2026. Status: verifying. Built by a Sonnet builder; the verifier is a different session.
- **Where:** mobile `wmt/WALLET-02` (from `wmt/MERGE-4` `74b1edb`), backend `wmt/WALLET-02` `577c35e` (from `wmt/EXPLORE-05` `649187a`, the batch 4 head). wawu-id unchanged. Migration: none (the stamp `20261023220000` is not used).
- **Built (app):** W7 `/send` (search by name, @handle or phone with a 350 ms rest, Recent, results with the purple or blue tick), W9 `/send/amount` (the shared amount keypad, kobo typed whole, the bank's balance beneath, the Hub's quick amounts, a note), W10 `/send/review` (PaySheet's send variant: Fintava's charge, WAWU's fee, Fees, Total, "They get", the total on the button), W11 (the PIN sheet over it), W12 `/send/receipt` (reference with copy, Lagos date, charges, Total paid, save as beneficiary, Share receipt through the phone's share sheet, Done to the Wallet tab). Send is added on W1 (`WalletActions`) and on H1's balance card, as drawn (R-41).
- **Built (backend, additive):** `GET /money/transfers/presets` (quick amounts from `TRANSFER_AMOUNT_PRESETS_KOBO`, PROVISIONAL(TRANSFER-PRESETS); the note's length). No new money-out route, so WALLET-23's limit check is the existing one on `POST /money/transfers/wawu`; the review reads the quote's `withinDailyLimit` and `remainingTodayKobo` and never sends a send the Hub would refuse.
- **One key per intent:** a wrong PIN, no answer and a retyped PIN send the SAME `Idempotency-Key`; a changed quote, or Try again after a failure, takes a new one. `pending` (G-710) is "still confirming", read again by id every 4 s, never sent again. `402` shows the bank's figures; `409 pin_not_set` opens A9 and comes back; `409 wallet_not_open` opens A26.
- **Not built, and why:** fingerprint or face on W11 (needs SHARED-CHANGES WALLET-06 #1 and a W35 switch that registers a phone key; G-43, G-788; the sheet's `biometric` prop is left out, R-47). W7's Bank account tab (WALLET-03). W14 (not this task's artboard).
- **Decisions (Default (agent), owner may override):** (1) the beneficiary switch on W12 starts OFF unless the person is already saved (the canvas draws it on): a save counts toward a limit and is the person's own act. (2) The canvas's "On WAWU" list under Recent is the search result; the Hub serves no suggestions, so with nothing typed the screen shows Recent, or what to type. (3) A send over today's limit shows PaySheet's failed state with the Hub's own figure ("Try again", "Cancel"); its title says the payment did not go through although nothing was tried. (4) The not-enough state's "Add" button takes the person to the Wallet tab (their account number and Copy) until Add money (WALLET-05) exists (SHARED-CHANGES WALLET-02 #4). (5) Amount text is at most 9 whole digits and 2 decimals.
- **Shared changes filed:** WALLET-02 #1 to #6 (the route, the contract copy, the amount keypad, PaySheet's optional `onAddMoney`, the biometric hold-back, and the three existing tests that asserted Send was absent). Gaps: G-785 to G-788.
- **Next:** a verifier. Backend CI runs on the push (the full suite, gates, protected routes, contract). Mobile CI cannot run (billing), so the full mobile check ran locally (see the Builder report).
- **History:** the builder report is in [history/WALLET-02.md](history/WALLET-02.md).

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

- [ ] **From W1:** a user on the Wallet tab taps Send and lands on W7 (this task replaces `unbuilt('WALLET-02')` in `src/features/wallet/home/` with the real navigation; COMPLETE-05).
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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
