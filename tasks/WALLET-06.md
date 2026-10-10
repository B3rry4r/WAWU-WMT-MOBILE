---
id: WALLET-06
title: Wallet settings, change and reset the PIN
owner: YOU
area: WALLET
order: 126
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-09, MONEY-14, WALLET-14, UI-02, SETTINGS-01]
decisions: [R-1, R-16, R-26, R-10, R-6]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W35, W36, W37]
---
# WALLET-06 · Wallet settings, change and reset the PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W35 W36 W37` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W35, W36 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W35 · Wallet settings**: Settings hub: a limits row the app fills from Fintava or hides (no tier, BRIEF W35), Transaction PIN (last changed), fingerprint or face for payments (R-26), Cards, Beneficiaries count, Statements, Account details (the bank name from the API, Loma Bank), Help with a payment.
- **W36 · Change the transaction PIN**: drawn as 'create'; a wallet holder already set a PIN on A9, so here it is changed. Step 1 of 2: a new 4-digit PIN used for every payment, transfer and withdrawal; then confirm.
- **W37 · Transaction PIN · reset**: Forgot PIN: OTP to phone on file with resend timer, then W36.

## Launch scope

Statements (W38) are built whole by WALLET-35 after launch, which adds the Statements row. Cards come after launch
(R-16): WALLET-22 adds the Cards row. Help with a payment is added by SUPPORT-01. Until those land, the rows are
not built (docs/WORKFLOW.md section 7, "Links between screens").

## Brief changes (build these, not the canvas)

- **W35**: "Account details · Loma Bank · 812 345 6789" (bank name slot). The top row can't name a tier: draw it as a limits row that the app can fill or hide. (Why: R-1; Fintava fact: no tiers in the API, limits still to come from Fintava.)
- **W35**: "Fingerprint or face for payments" (what the phone has). Cards and Statements are not built at launch (below). Help with a payment opens the support chat (SUPPORT-01). (Why: R-26, R-16, R-30.)
- **W36**: "change" the PIN: a wallet holder already set one on A9. (Why: R-6: the PIN is created when the wallet opens.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W35: Cards (opens W31): added by WALLET-22 after launch; not built at launch (BRIEF, "Not built at launch")
- W35: Statements (opens W38): added by WALLET-35 after launch; not built at launch (BRIEF, "Not built at launch")
- W35: Help with a payment (opens the support chat): added by SUPPORT-01

## Capability checks

- [ ] **From W1:** a user on the Wallet tab taps the settings icon and lands on W35 (this task replaces `unbuilt('WALLET-06')` in `src/features/wallet/home/`; COMPLETE-05).
- [ ] **W35**: a user can open Transaction PIN (W36); turn on fingerprint or face for payments; see Beneficiaries; open Account details.
- [ ] **W36**: a user can enter a new PIN and confirm it.
- [ ] **W37**: a user can enter OTP; Resend.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From Z2 (SETTINGS-01), a user can tap Wallet and PIN and reach W35 (this task adds the row, as Z2 draws it).

## What the backend serves today (from the analysis)

- **W35**: missing. Missing: No tiers, limits, PIN, beneficiaries or settings aggregate.
- **W36**: missing. Missing: No PIN set/confirm.
- **W37**: missing. Missing: No PIN reset; OTP must come from WAWU ID or a new SMS provider.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W35: Tier 2 account ₦5,000,000 daily · BVN + NIN verified
- W35: Fintava MFB · 812 345 6789
- W36: 'Four digits.'
- W37: 'Resend in 0:42'
- W37: +234 803 ••• 4412 (sample)

## Designer notes (⚠, unresolved)

- W35: “⚠ The tiers and limits follow CBN KYC levels. The real numbers come from Fintava.”

## Builder report

Builder session, 10 Oct 2026. Mobile branch `wmt/WALLET-06` from main 5de924a (main unchanged at the end, so nothing to merge). Backend branch `wmt/WALLET-06` from backend main 7b4ffef, one commit, 469ce08. Pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet06/shots/<name>-<light|dark>.png` (390 px) and, beside the rendered artboard, `.../wallet06/pairs/<W1|W35|W36|W37|Z2>-<light|dark>-beside-artboard.png`.

**Built.** New: `src/features/wallet/settings/` (`WalletSettingsScreen` W35, `AccountDetailsSheet`, `ChangePinScreen` W36, `ResetPinScreen` W37, `PinFrame`, `model.ts`, `pinFlow.ts`), `src/features/wallet/api/settings.ts` (the reads and writes, typed from the contract), routes `src/app/wallet-settings.tsx`, `change-pin.tsx`, `reset-pin.tsx`, and 85 new test cases in six files (`walletSettingsModel`, `WalletSettingsScreen`, `ChangePinScreen`, `ResetPinScreen`, `walletSettingsFlow` on the real Expo Router, `createPinForgotPin`). Entries added as drawn (SHARED-CHANGES WALLET-06 F1): the settings icon on W1's bar, "Wallet and PIN" on Z2 (no tier), "Forgot PIN?" on A10's already-set end (G-116 closed). Two existing WALLET-01 tests had asserted that W1 draws no settings button (R-47 before W35 existed): that and three exact button lists were changed to expect it, nothing else in them. Contract synced from backend main (WALLET-06 #3). Backend: `PUT /money/pin` now ends every live reset in the same transaction (BACKEND_GAPS G-50, closed) with three contract specs (stale code refused and the chosen PIN stays; another person's reset untouched; PIN stored only as an argon2id hash).

**Capability checks** (jest = `npx jest`; live = web export at 390 px, light and dark, from a private Metro cache whose bundle holds only `localhost:6131` and `:6132`, signed in through the app's own A22 against a local wawu-id and a local Hub from backend `wmt/WALLET-06`, made-up wallets in `bw06_hub_test`, Fintava replaced by a small local stand-in for `POST /sms/send` and the balance read; every browser request went to ports 6131, 6132 and 6134):
- From W1 the settings icon lands on W35: jest (real router, `walletSettingsFlow`), live (`W1-*`, `W35-*`). From Z2, Wallet and PIN reaches W35: jest (real router) and live (`Z2-*`).
- W35 open Transaction PIN (W36): jest and live. See Beneficiaries ("6 saved", the server's `beneficiaryCount`): jest and live. Open Account details (holder, number with Copy, bank): jest (Copy puts the digits as sent on the clipboard) and live (`W35-account-details-*`). Bank name "Loma Bank" is the server's.
- W35 turn on fingerprint or face for payments: NOT BUILT, NOT RUN (below).
- W36 enter a new PIN and confirm it: jest (14 cases) and live against the real PIN routes: wrong current PIN (the server's "Wrong PIN. 4 tries left."), the right one, a mismatch (the server's sentence), then the change lands and W35 reads "Changed just now" (`W36-*`, `W35-after-change-*`). Five wrong PINs lock it and W36 shows the countdown from the server's lock (`W36-locked-*`), keys off.
- W37 enter the OTP, Resend: live end to end: Forgot PIN? from the locked screen, a text through the stand-in carrying a 6-digit code, a wrong code refused with the server's sentence (`W37-wrong-code-*`), Resend after the 60 s clock (`W37-resent-*`), the right code then the new PIN twice resets it, the lock is gone and the new PIN works. Text that could not be sent: the stand-in stopped, W37 shows the server's sentence with Try again, then restarted and Try again shows the boxes (`W37-not-sent-*`). Jest: 16 cases.
- G-50 live: a code texted, then `PUT /money/pin`, then confirm with the code answers `400 reset_code_invalid`, the chosen PIN verifies (200), the stale code's PIN does not (403).
- Each artboard against its render, light and dark: pictures taken beside `build/design_shots`; the comparison is the verifier's (V5). Known differences, by decision: W35 omits the rows R-47 leaves out; W36's title is "Change" (BRIEF) and a current-PIN step comes first; the web export has no status bar.
- Loading, empty, error: W35 loading by a wallet read that never answers (`W35-loading-*`), error by stopping the Hub (`W35-error-*`, then Try again shows the rows), no wallet (creator-pro, `W35-no-wallet-*`, Open your wallet opens A26), no PIN yet (creator-basic, `W35-no-pin-*`; tapping opens A9); A9 then a PIN set meanwhile ends on "You already have a transaction PIN" with Forgot PIN? (`A10-already-set-*`), which opens W37 (`W37-from-A10-*`). Offline by the browser's offline switch is not a real cause here: the app's cache pauses a query while the browser says offline; a phone's failed request is the same as the stopped Hub.

**NOT RUN / NOT BUILT, with what unblocks each.** (1) W35's fingerprint or face switch and the check "turn on fingerprint or face": needs SHARED-CHANGES WALLET-06 #1 (a P-256 signer and `expo-crypto` in `package.json`, and a PIN sheet variant with no amount); then a round adds the row, `PUT`/`DELETE /money/device` and the key; G-43. The row is not drawn (R-47). (2) W37 by email under `WALLET_PROVIDER=nuvion`: jest only (the email wording); live needs WAWU ID's `pin-reset-code` route (G-400) and a Nuvion sandbox key. (3) A real text: G-42 (Fintava's sandbox refuses texts), so the live text path ran against the local stand-in. (4) V10 on a phone: needs a tester build with the live backend. (5) A phone-sized pass of W35 with limits: the server sends none (G-7), so the limits row is jest only. (6) Beneficiaries opens nothing until WALLET-03 (G-632).

**Left out as R-47 asks, each added by the task named:** Cards (WALLET-22), Statements (WALLET-35), Help with a payment (SUPPORT-01), the scan icon on W1 (WALLET-20), the fingerprint or face row (above).

**Decisions (Default (agent), owner may override):** (a) W36 asks for the PIN in use first, in W36's layout with no step number, because `PUT /money/pin` needs it and the canvas draws no step for it (G-630); the two drawn steps keep "Step 1 of 2" and "Step 2 of 2". (b) W36's title is the canvas's with "create" changed to "change" (BRIEF); its line is the canvas's. (c) Account details opens a sheet with the holder, the number (Copy) and the bank, plus the licence and deposit-insurance wording when the server sends it; the canvas draws no destination. (d) Beneficiaries is a row with no chevron that opens nothing (G-632). (e) "Changed 3 months ago" is written for a PIN set when the wallet opened too (G-633); "Not set yet" and a way to A9 when none is set. (f) The Z2 row's line is "PIN and account details" (the brief's "PIN, statements, limits" would name Statements and limits, which are not built). (g) W37 holds the six digits and sends the code only with the new PIN (the server checks it nowhere else, G-631); a wrong code goes back to the boxes with the server's sentence; a reset or change that got no answer is checked by reading the PIN's `changedAt`. (h) W37 says "To your email, a***@example.com" when `sentTo` is an address (G-402). (i) After a reset or a change the person is back on W35; "Forgot PIN?" on W36 replaces W36 with W37 so Back from W37 is W35. (j) The PIN state W36 reads is never from the cache (a lock seen before a reset must not show after it); a mutant that kept it was killed by a test. (k) Copy that the canvas does not draw: "Enter your current PIN", "To change it, first enter the PIN you use now.", "We couldn't change your PIN. Try again.", "We couldn't check whether your PIN was changed." and its reset twin, "We couldn't send your code", "Not set yet", "None saved", "We sent a new code.".

**Gaps and shared changes filed.** BACKEND_GAPS: G-630, G-631, G-632, G-633 new; G-7, G-43 updated; G-50 and G-116 closed; G-402 handled. SHARED-CHANGES: WALLET-06 #1 (biometric key and the amount-free PIN sheet), #2 (`ApiError` keeps `reason`), #3 (contract sync, done), F1 (entries added in other tasks' files, done), R1 (the three routes under the signed-in guard).

**Gates.** Before (main 5de924a): tsc 0 errors; lint 0 errors, 7 warnings; jest 118 suites, 2004 tests; gates 10 run, 469 files, 0 fail, 1 warn (PROVISIONAL HOST-PICKER, not mine); baseline ok; tasks 273. After (branch, `npm run check` as one command, EXIT 0, log `.../wallet06/check-after.log`): tsc 0 errors; lint 0 errors, the same 7 warnings; jest 124 suites, 2089 tests (+6 suites, +85 tests); gates 10 run, 486 files, 0 fail, 1 warn (the same); baseline ok; tasks 273. Backend (branch 469ce08 on main 7b4ffef): `npx tsc --noEmit` 0; eslint (no fix) and prettier clean on the two changed files; `src/money/pin` (the module touched) 5 suites, 120 tests pass on a fresh migrated database (`bw06_spec_test`); protected suite in a private network namespace on a fresh migrated and seeded database: 253 of 253 jest tests, "all 244 required tests passed" against the main lock; gates 16 FAIL, the same 16 lines as main (1057 files); `check_baseline` ok (108 entries, as main); `npm run contract:build` run twice byte-identical (sha256 e170486ba673dd57...), and equal to backend main's committed contract (WALLET-06 adds no route or field). Mutation check of the new code: 24 hand-made mutants, 23 killed, 1 equivalent (A10's "Forgot PIN?" label drawn without a handler: `OpenWalletEnd` hides a secondary with no handler).

**Process.** Ports 6131 to 6134 only (Hub, wawu-id, a stand-in for Fintava's text and balance reads, the web export); the export used `--clear` and a private TMPDIR and its bundle held only my two API ports; databases `bw06_hub_test`, `bw06_id_test`, `bw06_spec_test`, `bw06_prot_test` (dropped at the end); a private-network-namespace helper copied from an earlier verifier's scratch (`.../wallet06/ns/`). No provider, Flutterwave, production or `*.wawuafrica.com` host was called. Servers were stopped by PID, and the worktrees and databases removed, after the push.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The WALLET-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
