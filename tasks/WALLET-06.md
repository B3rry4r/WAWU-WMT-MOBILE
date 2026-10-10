---
id: WALLET-06
title: Wallet settings, change and reset the PIN
owner: YOU
area: WALLET
order: 126
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
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

Verifier session, 10 Oct 2026, independent (it wrote none of this). Checked: mobile `wmt/WALLET-06` `7e3182a`, backend `wmt/WALLET-06` `469ce08`. Both mains moved after the builder: mobile `origin/main` `90bdbfc` (NUV-03), backend `origin/main` `181ee5d` (NUV-02 + NUV-03, #103). Scratch, scripts and pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vwallet06/` (`shots/` the 390 px captures, `pairs/` each beside its rendered artboard, `logs/`, `mut/` the mutant logs).

**Verdict: status `building`.** The screens match their artboards but for recorded differences, every state is entered by its real cause, and G-50 holds in every sequential order against a real Hub. Open: **D1** (the "no answer" check can report a change that did not happen), **D2** (the G-50 transaction can deadlock against a reset: a 500), **D3** to **D5** (three false or stale claims on screen), **D6** and **D7** (two surviving mutants that break stated behaviours). None is a rewrite; each fix is a few lines (named below). The rest of what is built is additive and safe to keep.

### Passes

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (branch and both trial merges, see Checks) | `logs/check-branch*.log`, `logs/merged/` |
| V4 Field trace | passed, one leg NOT RUN | PIN age: writers `PUT /money/pin` and `/reset/confirm` set `TransactionPin.setAt`, read by `GET /money/wallet` `pin.changedAt` and `GET /money/pin`, W35 "Changed 3 months ago" then "Changed just now" after each writer (live, `W35-after-change`, `W35-after-reset`). Lock: wrong tries write `failedTries`/`lockedUntil`, W36 draws the countdown, a reset clears both and W36 then draws no lock (live). Account (bank, number, holder): `FintavaWallet` row, W35 and the sheet (live). Beneficiaries: `MoneyBeneficiary` rows read as 6, 7, 6 as rows were added and removed by SQL; the writer route (`POST /money/beneficiaries`) needs a bank lookup from Fintava, so that leg is NOT RUN |
| V5 Picture | passed, differences listed below, all recorded | `pairs/W1-*`, `W35-*`, `W36-new-*`, `W36-confirm-*`, `W37-*`, `Z2-*`, `A10-already-set-*` (light and dark, beside the artboard), `m-*` montages for states |
| V6 States | passed | W35: loading (the wallet read held open), error (request aborted: "No connection" is the real cause) then Try again shows the rows, no wallet (creator-pro, Open your wallet opens `/open-wallet`), no PIN (creator-basic, "Not set yet" opens A9), limits (the response edited on the wire: the server sends none, so the row is a picture only, `W35-limits-intercepted`). W36: wrong PIN, five wrong (lock), mismatch, change landed but answer lost, never sent, no answer to the check, request never answered. W37: sending, wrong code, expired code (DB time moved), old code after Resend, text refused by the stand-in and Try again, A10 entry. `reset_codes_exhausted` live: NOT RUN (jest and the backend spec cover it) |
| V7 Flow walk | passed | user with PIN (W1 icon, Z2 row, W35, W36, W37, back stack), creator-basic (wallet, no PIN: W35 "Not set yet" to A9, another phone sets a PIN, A10 end, Forgot PIN?, W37, Back to A10), creator-pro (no wallet), cold start (reload on `/change-pin` keeps the lock), signed-out visit to the three routes goes to `/welcome` with no money request and no text sent |
| V8 Money | passed for W36/W37, D1 and D2 found | wrong PIN 5 times locks (4, 3, 2, 1 tries left, then lock), the right PIN is refused while locked (423), keys off and Forgot PIN? on, the lock survives a reload, a reset clears it; last digit double-tapped makes one request (verify and PUT, both live); race of a change against a reset (below) |
| V9 Live seam | passed | real A22 sign-in against a local wawu-id (no injected token); values only the server could have: bank "Loma Bank", `810 000 0417`, holder, `changedAt`, the masked phone `+234 *** *** 4412`, a six-digit code from the local text stand-in |

### Rulings asked

1. **Fingerprint or face row left out.** The check "turn on fingerprint or face for payments" is **unmet (NOT BUILT)**. It is **not a blocker for merging what is built**: R-47 forbids the switch with nothing behind it, `docs/WORKFLOW.md` section 4 tells a task that needs a fenced file to file the row and build everything else, SHARED-CHANGES WALLET-06 #1 names the exact change, and G-43 records it. What the lead must do: assign #1 (open, NO OWNER); a later WALLET-06 round (and WALLET-02 for W11) then adds the row as drawn. WALLET-06 is not complete, and R-26's carrier is still open, until then. (This status is `building` for D1 to D7, not for this.)
2. **G-630, the current-PIN step before the two drawn steps: accepted, differs-for-recorded-reason** (BRIEF W36 "change", CONVENTIONS section 5: `PUT /money/pin` needs the PIN in use in `X-Transaction-Pin`, MONEY-09). The canvas draws no such step, and dropping the requirement would weaken the guard on money, which no ruling allows, so "never change the screen to fit the API" does not apply. The unnumbered step keeps "Step 1 of 2" and "Step 2 of 2" on the drawn ones, checks the PIN at once (`POST /money/pin/verify`, one try on a wrong PIN as on a payment) and its Forgot PIN? is the only way from W35 to W37. Owner may override (the alternative, the PIN sheet over W35, needs #1's amount-free variant).
3. **A change that got no answer, resolved by `changedAt`: it CAN report success for a change that did not happen. Defect D1.**
4. **The WALLET-01 tests the builder changed: all follow the task, none weakens a guard.** `WalletScreen.test.tsx`: `Wallet settings` moves out of the "not built" lists (the icon is built now) and each exact button list gains it (W1, W4, W5, W6, every no-balance state, the narrow phone); the others in the lists (Scan to pay, Send, Add money, Swap, bills, cards, See all) are still asserted absent. `walletTabFlow.test.tsx`: the same, plus a positive assertion that the icon exists. Nothing else in either file changed (`git diff` read line by line).
5. **Beneficiaries row with no chevron that opens nothing (G-632): differs-for-recorded-reason, flagged unclear for the lead.** The task's check says "see Beneficiaries", the row is not a button (jest and the browser: no button role, a tap does nothing), it shows a real server count (`beneficiaryCount`), and WALLET-03 adds the chevron. A strict reading of R-47 ("no inert entries") would leave the row out until W8 exists; recommended: keep.

### Findings

**D1 · defect · medium (rare trigger, a wrong claim about a credential): W36 and W37 `check()` can say done when the PIN they typed is not the PIN.** `movedOn(baseline, changedAt)` is true for any change of the PIN's time, not this request's. Reproduced live (`logs/drive.jsonl`, case `FALSE-SUCCESS`, `s4.py d`): at W36's second step the `PUT /money/pin` is dropped before it reaches the Hub while another phone changes the PIN (`PUT` with the PIN in use); W36 reads `changedAt` moved, goes back to W35 which says "Transaction PIN, Changed just now", the typed PIN `1111` then verifies `403` and the other phone's `7777` verifies `200` (`W35-false-success-*`). The same happens with no second phone whenever the server answers 500 for this request while a reset lands (D2), and on W37 for a change made elsewhere. The landed cases are right (`landed-answer-lost`: the change reached the Hub, the answer was dropped, W35 reads "just now" and the new PIN verifies 200; `never-sent`: "We couldn't change your PIN. Try again." and the old PIN still works). Fix: after a request with no answer, ask the Hub whether the NEW PIN is the PIN (`POST /money/pin/verify` with `X-Transaction-Pin: <the new PIN>`: 200 landed, 403 not, and only the "not" case costs a try); keep `changedAt` only to show the time. Sites: `ChangePinScreen.tsx` `check()`, `ResetPinScreen.tsx` `check()`, `pinFlow.ts` `movedOn`. Test that kills it: a fake whose `GET /money/pin` time moves for another reason while the `PUT` never lands, asserting the screen does not finish.

**D2 · defect · low (needs one account to change and confirm in the same few milliseconds; fails safe, no state corrupted): the G-50 transaction can deadlock against `/reset/confirm`.** `PUT /money/pin` now takes the PIN row, then the reset rows; `/reset/confirm` takes the reset row, then the PIN row. Racing one change against one confirm for one account, 80 attempts in two runs (a spec of mine, `mut/vw06-race.spec.ts`, run through the repo's harness): 9 answered 500 (`change=500` 3 times, `confirm=500` 6 times), the log naming `tx.transactionPinReset.updateMany()` at `transaction-pin.service.ts:180` and `tx.transactionPin.updateMany()` at `pin-reset.service.ts:306`; every run ended with no live reset and one valid PIN (`live resets left 0`). Before this task `change` never touched a reset row, so this is new. Fix: take the same per-person advisory lock `start()` takes (`pin-reset:<id>`) in `change` and in `confirm`'s transaction, or update the reset rows before the PIN row in `change`. Test that kills it: my `R2` (40 simultaneous pairs, expect no 500).

**D3 · defect · low: W37 Resend says "We sent a new code." when it sent nothing, with the phone's clock ahead.** The countdown is `resendAvailableAt` against the phone's `Date.now()`. Clock +10 min (reproduced, `W37-skew600000-*`): no countdown, Resend shows at once; a tap makes the Hub answer the same reset (no text: the stand-in's outbox did not grow), and the screen says "We sent a new code." and clears the digits. Clock -10 min: "Resend in 11:00". Counted on the server's configured gap otherwise (live with `PIN_RESET_RESEND_SECONDS=45`: "Resend in 0:45", the link opened after 44.8 s; at the default "1:00", 61.5 s and 60.8 s). Fix: say it only when `started.resetId` differs from the held reset; offset the countdown by the response's `Date` header.

**D4 · defect · low: W36 dead end after "We couldn't check whether your PIN was changed."** Back from step 2 returns to step 1 with the keypad off, no line and no Try again (`busy` stays `unchecked`); only Back out of the screen leaves (`W36-unchecked-after-back-*`). Fix: put `busy` back to idle when Back leaves `unchecked`.

**D5 · defect · low: A10's end tells a falsehood after a reset made from it.** W37 opened from A10, a reset completed, Back lands on "You already have a transaction PIN ... If you set one before, that earlier PIN still approves payments" with Forgot PIN? again, while the earlier PIN no longer verifies (`old_pin` 403, `A10-end-after-reset-light`). Fix: after a finished reset leave (`way.leave`) or go to W35, instead of `back()`.

**D6 · defect (test gap, kills a stated behaviour) · low: mutant M13 survives all 85 WALLET-06 tests.** `src/app/open-wallet-pin.tsx` `onForgotPin` pushing `/change-pin` instead of `/reset-pin`: nothing walks A10 to W37 on the real router (`createPinForgotPin` tests the screen with a prop). Kills: a router test from A10's already-set end asserting the pathname `/reset-pin`.

**D7 · defect (test gap, kills a stated behaviour) · medium: mutant M17 survives all 85 tests.** `ChangePinScreen.tsx` sending the first entry as both `newPin` and `newPinConfirmation` (the second entry ignored, so a mistyped PIN is accepted unconfirmed): the tests' fake answers `pin_mismatch` without comparing, and the happy path types the same PIN twice. Kills: a test typing two different entries and asserting the `PUT` body carries both, and a fake that refuses only when they differ. (The real code sends both entries, verified in the live mismatch case: the Hub's sentence came back and the old PIN still worked.)

**Test-gap notes (not defects).** (a) Backend: removing only the final-transaction `supersededAt` guard in `confirm` (B4) survives the three new specs because `claimTry` guards the same thing; a change landing between `claimTry` and the final write is the only order that needs it. My race `R1` kills it (the stale code overwrote the chosen PIN: `chosenApproves=403 attackerApproves=200`); the unmutated code refuses that confirm (400) every time. Removing only `claimTry`'s (B5) is equivalent. (b) The leak scan in `pin-reset.contract.spec.ts` looks for codes and PINs, not phone numbers: logging the full proved phone (B13) survives. The real code logs none (see Checks). (c) A request that never answers (no timeout in the shared API client, `src/api/**` fenced) leaves W36's "Changing your PIN" spinner with Back disabled for good (reproduced 15 s, `W36-hang-light`): app-wide, `unclear`, the lead's call (a SHARED-CHANGES row for a client timeout). (d) `WalletScreen.tsx` line 34 still says the settings icon is left out; the three route files cite "SHARED-CHANGES WALLET-06 #2" where the guard row is R1. (e) W37's "We couldn't send your code" draws the WifiOff icon for a text the Hub (not the phone's network) could not send. (f) The existing `money-pin.contract.spec.ts` test "the PIN never reaches a log or a response" exceeds jest's 5 s default when the machine's load average is about 20 (it fails the same way on the unmerged branch at that load, and passed 120 of 120 earlier at low load); with `--testTimeout=60000` all 120 pass.

**differs-for-recorded-reason (checked):** W35 omits the limits card (the server sends none: G-7; the row is built and drawn from a server limit, picture only), the Face ID row (above), Cards, Statements and Help with a payment (R-47, R-16, the task's own "Added by later tasks"); "Loma Bank . 810 000 0417" for "Fintava MFB . 812 345 6789" (the brief's bank slot, server values); Z2's row line "PIN and account details" (BRIEF Z2 says "for example"; Statements and limits are not built); W36's title "Change your transaction PIN" and its unnumbered current-PIN step (ruling 2); W37's "To +234 *** *** 4412" for "+234 803 ... 4412" (the Hub masks, the app writes what it is told); the Account details sheet (the canvas draws no destination, decision (c)); "Forgot PIN?" as a secondary button under Done on A10's end (G-116); the web export has no status bar. Nothing on screen is a literal figure or a name: every value is the server's or the user's.

**Checked and CONFIRMED (no defect):**
- W35: every value from `GET /money/wallet`; "Not set yet" opens A9; the sheet shows holder, number with Copy (digits as sent), bank; limits row hidden while the server sends none and drawn as sent when it does (picture only); no do-nothing button drawn (Beneficiaries aside, ruling 5); the settings icon on W1 and the Wallet and PIN row on Z2 open W35 and Back returns to where they came from.
- W36: the current-PIN step first; "Wrong PIN. 4 tries left." and down to 1 (the server's sentences); the fifth wrong PIN locks with "Too many wrong tries. Try again in 30:00." (the PIN sheet's own words, from the server's `lockedUntil`), keypad off, Forgot PIN? on, the lock survives a reload; new PIN twice; mismatch is the server's "The two PINs do not match. Enter the same PIN twice." back at step 1 with the PIN in use kept and the old PIN unchanged; a changed PIN reads "Changed just now"; one request for a double-tapped last digit.
- W37: arrival sends one text; the masked phone is the server's; Resend on the server's clock (above); the six digits are held and go only with the new PIN; a wrong code goes back to the boxes with "That code is not right or has expired. Check it, or ask for a new one."; an expired code the same; after Resend the old code is refused and the new one works; after a reset the lock is gone (`failedTries` 0, `lockedUntil` null, W36 draws no lock), the new PIN verifies 200 and the old one 403; the text refused by the provider shows the server's sentence with Try again, which then shows the boxes.
- G-50 on the backend: a code texted before a change is refused after it (`400 reset_code_invalid`), the chosen PIN verifies 200 and the stale code's PIN 403 (live and the spec); another person's reset is untouched; the stored hash starts `$argon2id$`.
- No PIN, code or full phone number in the Hub's log: after 15 texts (2 of them refused by the stand-in), the locks, resets and changes of this session, `grep` of the Hub's whole log (1466 lines, two runs of the server) for every PIN typed (11 of them), all 15 codes the stand-in received and 13 forms of the accounts' phone numbers (`+234803...`, `803...`, `0803...`, `+234800...` and the national forms) found none. The log's only lines about the flow are `send SMS: HTTP 200 in N ms` and `pin reset <id>: the text was not sent (refused)`.

### Trial merges (throwaway worktrees, never pushed)

- **Mobile `7e3182a` + `origin/main` `90bdbfc`: 3 conflicts, all in generated or shared-log files.** `BACKEND_GAPS.md` (G-402: the branch's "Handled by WALLET-06" text and main's new rows G-470 to G-499 in the same hunk: kept both), `contract/SOURCE_COMMIT` (took main's `181ee5d`), `docs/PROGRESS.md` (generated: regenerated with `npm run tasks -- --write`). `docs/LOG.md`, `SHARED-CHANGES.md`, `contract/openapi*.json` and `src/api/schema.generated.ts` merged cleanly, and the merged `contract/openapi.json` is byte-identical to the backend merge's.
- **Backend `469ce08` + `origin/main` `181ee5d`: 0 conflicts** (a real merge, no conflict, `tsc` and the checks below ran on it).

### Checks

- Merged backend (`a708038`): `npx tsc --noEmit` 0 errors; `src/money/pin` 5 suites, 120 of 120 on a fresh migrated database (with `--testTimeout=60000`, see note f; one test at the 5 s default under load); the protected suite `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace: 253 of 253, "all 244 required tests passed" against the `origin/main` lock; gates 9 run, 1084 files scanned, 16 fail 88 warn 76 accepted, the identical 16 FAIL lines as main (`181ee5d`); `check_baseline` ok (108 entries); `npm run contract:build` twice, sha256 `da995a85...` both, equal to the merged tree's committed `contract/openapi.json`.
- Backend branch alone (`469ce08`): `src/money/pin` 120 of 120 at low load.
- Merged mobile (resolved as above): `npm run check`, first run 124 of 126 suites (OpenWalletScreen and settingsScreens, both known load flakes, both pass alone: 37 and 91 tests); second run, at load average 30, 5 suites timed out in `beforeAll` (walletTabFlow, eventsScreens, session-cache, ticketsFocus, works/failure), all five pass alone (3, 46, 11, 1, 13 tests). Typecheck 0 errors and lint 0 errors with the same 7 warnings in both. `npm run check` chains with `&&`, so gates and the task check did not run behind the failed tests: run on their own on the merged tree, gates 10 run, 489 files scanned, 0 fail, 1 warn (the known PROVISIONAL HOST-PICKER), baseline 0 entries, and the task check passes (273 tasks).
- Branch mobile: `npm run check` as one command, **EXIT 0** (`logs/check-branch-5.log`): typecheck 0 errors, lint 0 errors and the same 7 warnings, jest 124 suites and 2089 tests (the builder's counts), gates 10 run, 486 files scanned, 0 fail, 1 warn (PROVISIONAL HOST-PICKER, not this task's), baseline ok, tasks 273. It took five runs: runs 1 to 4 each failed only `eventsScreens.test.tsx`, the known timing flake (a different test each time: the `(D8)` tier-dates test in runs 1 to 3, two `E1` tests in run 4, which used `--maxWorkers=4`); it passes alone, 47 of 47, and run 5 passed in full. This report was typed into the task file after run 5 (text only); `npm run gates` and `npm run tasks` were run again after it.

### Mutants (mine: 37 plus a no-op control)

Backend (`mut/*.log`): B1 change does not end resets, B2 it ends every person's resets, B3 reset stores the PIN unhashed, B6 supersede filter matches nothing, B7 both guards in confirm removed: **killed** by the three new G-50 specs (each by the spec meant for it). B4 and B5 alone: survive the specs (test-gap note a); with my race `R1`, B4 and B5 die. B8 lock after 6 wrong tries, B9 reset keeps the lock, B10 change leaves `changedAt`, B11 masked phone shows 6 digits, B12 the reset code written to the log, B14 the new PIN written to the log: **killed** (B8 by 5 tests). B13 the full phone written to the log: **survived** (note b).
Mobile (`mut/M*.mlog`, 24 with a no-op control): killed M1 keypad on while locked, M2 lock words not drawn, M3 and M4 `movedOn` always true or true without a baseline, M5 and M6 the check claims success on any time, M7 held code dropped, M8 wrong code goes to the new-PIN step, M9 masked phone replaced, M10 resend clock a constant 60, M11 W1 icon opens Settings, M12 Z2 row opens W36, M14 W35 PIN row swaps A9 and W36, M15 PIN line hard-coded, M16 current-PIN step skipped, M18 Z2 row never drawn, M19 PIN state read from the cache, M20 no-PIN stays on W36, M21 limits row hidden when sent, M22 limits row drawn from nothing, M23 Beneficiaries opens something. **Survived: M13 (D6), M17 (D7)**, and M24 the control (a no-op, as it must). Totals: 37 mutants (14 backend, 23 mobile), 32 killed by the repo's own tests, 3 survive them (B13, M13, M17), 1 survives the repo's specs but dies to my race (B4), 1 equivalent (B5), and the control survives as it must.

### NOT RUN

(1) The fingerprint or face switch and its check: NOT BUILT (ruling 1; unblocked by SHARED-CHANGES WALLET-06 #1). (2) A real text: G-42 (Fintava's sandbox refuses texts), so every text went through a local stand-in on port 6133; unblocked when Fintava sets the text price. (3) W37 by email under `WALLET_PROVIDER=nuvion`: jest only; needs WAWU ID's `pin-reset-code` route (G-400) and a Nuvion sandbox key. (4) V10 on a phone (not in this task's passes); needs a tester build with the live backend. (5) `reset_codes_exhausted` and `provider_unreachable` "maybe sent" live: jest and the backend spec only. (6) The beneficiary writer route into W35's count (needs a Fintava bank lookup): the reader was run with SQL rows. (7) A phone-sized pass with limits on a real server: the server sends none (G-7). Servers, databases and worktrees were removed at the end; ports 6131 to 6134 only; no provider, Flutterwave, production or `*.wawuafrica.com` host was called.

## Hub entries this task adds (R-41)

The WALLET-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
