# WALLET-02 · round history

Moved out of [tasks/WALLET-02.md](../WALLET-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder (Sonnet), 16 Oct 2026. Mobile `wmt/WALLET-02` on `wmt/MERGE-4` `74b1edb`; backend `wmt/WALLET-02` `577c35e` on `wmt/EXPLORE-05` `649187a`. No migration. Dependencies MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, WALLET-06, WALLET-07, WALLET-08, WALLET-14, UI-02 and UI-03 are `done`.
- **Files (app).** New: `src/features/send/` (`api.ts`, `model.ts`, `parts.tsx`, `RecipientScreen.tsx`, `AmountScreen.tsx`, `ReviewScreen.tsx`, `ReceiptScreen.tsx`, tests), `src/components/amount-entry/` (`AmountKeypad`, `amount.ts`, tests), `src/app/send/{index,amount,review,receipt}.tsx`, `src/features/wallet/home/WalletActions.tsx`. Changed: `WalletScreen.tsx` (the Send button), Home's `MoneyCard.tsx` and `TodayScreen.tsx` (Send first, accent), the contract copy, and three tests that asserted Send was absent (SHARED-CHANGES WALLET-02 #6). Backend: `transfer-presets.ts`, the controller route, the view type, three route inventories, `contract/openapi.json`, `docs/contract/WALLET.md`, one spec.
- **Capability checks.** From W1 (and H1): a user taps Send and lands on W7: passed in jest on the real router (`sendFlow.test.tsx`, `WalletScreen.test.tsx`) and in the web export. W7 type, pick a recent, pick a result: passed (jest; the Hub is asked with the typed text). W9 enter, quick amount, note, Continue: passed. W10 sending ₦25,000 shows ₦15.75 + ₦10 = ₦25.75, total ₦25,025.75 on the button and "They get ₦25,000": passed (jest and picture). W11 four digits, Forgot PIN: passed; fingerprint or face: NOT BUILT (above). W12 save as beneficiary (on and off), share (text and reference), Done to W1: passed.
- **States by real cause (V6).** Wrong PIN, no answer, short balance, fees changed, a refusal, `pending` then completed, no PIN set, no wallet, empty and failed searches, a failed quote: each entered by the Hub's real answer in the stand-in (`sendFlow.test.tsx`), same key asserted where it matters.
- **Pictures (V5).** From the web export of this branch through the stack (`--with mobile`, own Metro cache, ports 7320 to 7327), 390 px at 2x, light and dark, the Hub's money routes answered by fixtures in the browser (the stack's Hub has no wallet provider); sign-in through the stack's mock WAWU ID. Files under `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-02-b/pics/` (`W7`, `W7-results`, `W9-empty`, `W9`, `W10`, `W11`, `W12`, `W12-saved`, each `-light` and `-dark`) beside `build/design_shots/` from `render_design.py W7 W9 W10 W11 W12`. Differences I know of: the web export draws no status bar; W7 and W9 say who the person is by handle and tick (the canvas's bank line is a bank send); the quick-amount chips are the shared bills chips (equal width).
- **Checks.** Backend: `tsc --noEmit` 0, eslint 0 on the changed files, the new spec (12 tests) and the three inventories plus the gate specs (68 tests) pass; `contract:build` twice-built before copying. Mobile: see the line at the end of this report for the full local check.
- **Not done.** Fingerprint or face (G-788). A real Fintava or Nuvion send (R-20: the stack has no provider): V9 against a provider is NOT RUN; the Hub's own send path was verified by WALLET-07. V10 on a phone: NOT RUN.
- **Filed.** SHARED-CHANGES WALLET-02 #1 to #6; BACKEND_GAPS G-785 (W7's profession line), G-786 (quick amounts: owner ruling), G-787 (the reference's format), G-788 (biometric).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 and WALLET-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

