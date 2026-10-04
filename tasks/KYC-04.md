---
id: KYC-04
title: Open your wallet: account opened, create PIN
owner: YOU
area: KYC
order: 88
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-09, MONEY-12, KYC-03, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [A8, A9, A10]
---
# KYC-04 · Open your wallet: account opened, create PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py A8 A9 A10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A8 · Wallet open**: 'Your wallet is open' card: the bank name from the API (Loma Bank; the long legal name must fit), account name, account number (Copy), Bank row, a Limit row shown only if Fintava returns a limit; Create your transaction PIN (-> A9). No tier and no 'Raise your limits' (BRIEF A8).
- **A9 · Create PIN**: Step 1 of 2: 'Create your transaction PIN. Four digits. It approves every payment and transfer.' Keypad.
- **A10 · Confirm PIN**: Step 2 of 2: 'Enter it again'. Then the user returns to where Open your wallet started.

## Ruling R-6

This flow is not part of sign-up. It starts the first time someone taps Wallet
or anything that moves money, for every user, new or existing. The design draws
these screens inside sign-up; keep their look, change only where they sit. The
BVN and NIN step is A26 (KYC-05); A3 is sign-up and no longer asks for the BVN. Someone without a Nigerian BVN cannot open a Naira wallet; dollar
and crypto accounts are for them and come after launch, so for now the flow
ends with a clear "not available yet" instead of an error.

## Brief changes (build these, not the canvas)

- **A8**: the subtitle and the Bank row show the bank name as a slot the app fills. Sample: "Loma Bank", and make sure the long legal name "Iyin Ekiti Microfinance Bank Limited (Loma Bank)" also fits (wrap or truncate). No "Tier 1". Draw the Limit row as a slot that can be hidden. Remove the "Raise your limits" link; "Create your transaction PIN" stays. (Why: R-1 and a Fintava fact: the bank is Loma Bank and its name comes from the API. Fintava's API has no tiers, so there is nothing to raise; limits are still a question for Fintava.)
- **A10**: a mismatch uses the PIN sheet's wrong-PIN line in W11's style; KYC-04 records its wording here. (Why: every state needs a real look; the canvas's own style is used.)

## Capability checks

- [ ] **A8**: a user can copy the account number and tap Create your transaction PIN; the bank row shows the name from the API (Loma Bank); the Limit row shows only if Fintava returns a limit.
- [ ] **A9**: a user can enter 4 digits.
- [ ] **A10**: a user can re-enter the 4 digits; a mismatch uses the PIN sheet's wrong-PIN line (W11 style), with its wording listed in `docs/designer/BRIEF.md`.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] After A7 (KYC-03), a user lands on A8 (this task adds that step).
- [ ] After A10, a user who started from Pay returns to that pay sheet, and one who started from the Wallet tab lands on W5.

## What the backend serves today (from the analysis)

- **A8**: partial. Missing: Wallet is Flutterwave (payout subaccount at Flutterwave MFB), opened only for accountType=creator; no tier, no limits, no Fintava integration; a 'discover' user gets no wallet.
- **A9**: missing. Missing: No transaction PIN anywhere: no column, no route, no hashing, no lockout. Wallet withdraw (POST /api/hub/wallet/withdraw) approves on bearer token alone. HIGH PRIORITY: every Wallet flow money movement (W11 etc.) depends on this.
- **A10**: missing. Missing: Same as A9. No mismatch state is drawn.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A8: 'Tier 1 · Fintava MFB'
- A8: 'Bank Fintava MFB'
- A8: 'Limit ₦300,000 balance'
- A8: sample NUBAN 812 345 6789
- A9: PIN is 'Four digits'
- A9: 'It approves every payment and transfer.'
- A10: 'Four digits'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

Builder, 4 Oct 2026. Mobile `wmt/KYC-04` from main `2c99b2f` (main has not moved). No backend change: the Hub already serves `GET /money/wallet` (MONEY-12) and `POST /money/pin` (MONEY-09). Evidence `$K` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc04/`: shots `$K/shots/<name>-<theme>.png` (390 px at 2x), side by sides `$K/side-{A8,A9,A10}-{light,dark}.png` (render left), state sheets `$K/sheet-{a8,pin}-states-{light,dark}.png`, driver `$K/drive.py`, pass-through `$K/web-server.js`, runs `$K/results.jsonl`, request log `$K/calls.jsonl` (key names and lengths only), mutants `$K/mutants.txt`.
- **Files:** `src/features/open-wallet/` new `WalletOpenScreen.tsx` (A8), `CreatePinScreen.tsx` (A9 and A10, one screen in two steps), `api/wallet.ts` (`fetchOpenedWallet`, `openedWalletQuery`, `setTransactionPin`), `pin.ts` (length line from `PIN_LENGTH`, refusal outcomes, NUBAN grouping), `copy.ts` and `copy.web.ts`, 4 test files; changed `SelfieScreen.tsx` (an open account calls `onOpened` once, in place of its own "Your wallet is open" end), `leave.ts` (`opened()`: dismiss A26 to A6, push A8; A8 and the PIN route are flow screens, so `leave()` dismisses them), `entry.ts` (paths), `OpenWalletEnd.tsx` (`actionIcon`, `top`, `between`), the selfie test. Routes `src/app/open-wallet-account.tsx`, `open-wallet-pin.tsx`; `open-wallet-selfie.tsx` passes `onOpened`.
- **After A7, a user lands on A8:** V9 `full` (both themes): the real flow (A26, A5, A6 with the stand-in selfie match, A7, opening) ends on A8 (`a8-*`). Jest: `onOpened` once; `opened()` dismisses 3 and pushes A8; on the real Expo Router (`flowReturn.test.tsx`) A8 sits straight on the screen that started the flow, and Back from A8 goes there, never to A26 to A7.
- **A8:** V9 `full`: subtitle and Bank row show the server's `bankName` ("Loma Bank", 2 occurrences), account name and the NUBAN grouped 3-3-4, all equal to `GET /money/wallet`; no Tier, no "Raise your limits", no Limit row (`limits` is null from the Hub). Copy puts the digits as sent on the browser clipboard (read back: equal) and the button reads "Copied" (`a8-copied-*`). Create your transaction PIN opens A9. `states`: the long legal name from the Hub's own `WALLET_BANK_NAME` (Hub restarted with it) wraps to two lines (`a8-long-bank-*`); the Limit row with a limit set by the pass-through on the Hub's real answer (logged `standin-limits`, the Hub sends none, G-114): "₦300,000 a day" (`a8-limit-standin-*`). A PIN already set (G-41): Done, back to Home (`a8-pin-set-*`). Jest: 12 tests (copy refused, opening, no wallet, unreadable answer).
- **A9:** V9: "1 of 2", "Create your transaction PIN", "Four digits. It approves every payment and transfer." (`a9-*`, `a9-two-typed-*`), 4 digits move to A10 with nothing sent. Jest: Delete, Back to A8.
- **A10:** V9: "2 of 2", "Enter it again" (`a10-*`, 3 typed as the canvas draws); a mismatch (2749 then 2740) answered by the real Hub `400 pin_mismatch`: its sentence under the dots in W11's CircleAlert line, empty dots ringed in danger, back to step 1 (`a10-mismatch-*`, `a10-mismatch-typing-again-*`); the same PIN twice: `201`, `GET /money/pin` reads `isSet: true`, every PIN body exactly `{pin, pinConfirmation}`. Wording recorded in `docs/designer/BRIEF.md` (section 12, A10).
- **After A10, back where the flow started:** jest on the real Expo Router (stand-in Wallet tab and payer screens calling the real `useOpenWalletEntry().open`, stand-in flow screens moving with the real `useOpenWalletWay`): from the Wallet tab, back on `/wallet` with the Wallet tab selected; from a payer screen with its pay sheet open, back on it with the sheet still open. In the browser the flow ends on Home (`after-a10-home-*`). **NOT RUN on screen** for the pay sheet and the Wallet tab: neither has a way into the flow on main (pay sheet: SHARED-CHANGES KYC-05 #1; Wallet tab and W5: WALLET-01, which owns "after A10 lands on W5"). The browser harness cannot stand in: its history push rebuilds the stack from the URL (A26's own Back then lands on Home too), so `wallet-tab` runs in `results.jsonl` failed for the harness, not the app. On the way out the app asks every `['money']` read again.
- **V5:** for the verifier; not claimed. `side-*` are mine.
- **Values:** bank name, account name and number, limit, PIN state: `GET /money/wallet`; every refusal sentence the server's; "Four digits." from `PIN_LENGTH` (the PIN sheet's, the contract's `^[0-9]{4}$`). "It approves every payment and transfer." is kept, backed by contract CONVENTIONS section 5 (the PIN on every request that moves money, held by the backend's coverage test; a biometric approval stands in for it, MONEY-14); listed for the verifier. Gaps: G-114 (Limit row: the canvas's balance cap has nothing behind it; the contract has a daily limit, null today, G-7), G-115 (the bank name is the Hub's provisional `WALLET_BANK_NAME`, owner to set on the droplet).
- **V6 states, each by its cause, light and dark:** A8 loading (Hub answers held 6 s, `a8-loading`); A8 error (the Hub drops connections, `a8-error`), Try again recovers; A9 loading (`a9-loading`), A9 error (`a9-error`), Try again recovers; A10 setting (answer held 5 s, keys off, `a10-setting`); empty: A9 with nothing typed, A8 with no Limit row; a lost answer (`lost`: the Hub set the PIN, the pass-through dropped its answer): the app read the wallet, found the PIN set and ended, 1 POST; no wallet (`no-wallet`): `/open-wallet-account` by link goes to A26. Jest: opening, unreadable, refusals, keys off while setting, PIN set on arrival.
- **Privacy:** PINs typed (6 values) 0 hits in a full `k04_test` dump, the Hub, stand-in WAWU ID, Fintava stand-in and pass-through logs; `TransactionPin` holds 8 argon2id hashes only. Browser after every run: only the two session keys, no sessionStorage, IndexedDB or cookie; 0 console errors; 0 requests to `wawuafrica.com` or `fintavapay.com` (0 in the bundle). The PIN lives in screen memory only; both entries are dropped when the request answers, on Back from A10, on unmount and on a session end. Jest: a late answer after sign-out or after the screen closed moves nothing.
- **V9:** Hub `dist` from backend main 95d8bd4 on :4951, fresh `k04_test` (migrated, seeded); stand-in WAWU ID :4952 (people registered there, signed in on A22, no injected token); Fintava stand-in (KYC-03's, made-up numbers, `env -i`); web export of this branch on :8151. Rows: 10 wallets opened, 8 PINs set, 10 BVN checks, 10 selfie matches. No sandbox or live Fintava call.
- **Mutants:** 11 on the new logic, 10 killed (flow end leaving A9, A8 on top of A26, late answer after session end, mismatch look, Limit row with no limit, bank name typed in, PIN set on arrival, copy grouped, A7 not handing over, lost answer not checked). 1 equivalent: M9 (first entry kept after Back from A10): A9's next four digits overwrite it and unmount clears it, so nothing observable changes.
- **Counts:** `npm run check` before (main 2c99b2f): exit 0, 36 suites 666 tests, gates 9 run 172 files 0 fail 0 warn 0 accepted, 205 tasks. After (this branch, main unchanged): exit 0, typecheck and lint clean, 40 suites 704 tests (open-wallet 156), gates 9 run 183 files 0 fail 0 warn 0 accepted, 205 tasks.
- **Filed:** BACKEND_GAPS G-114, G-115. SHARED-CHANGES KYC-04 #1 (`expo-clipboard`, row 8's batch; RN's own `Clipboard` until then), #2 (`Keypad` and a shared `PinDots` from the pin-sheet barrel), R1 (the two routes under the signed-in guard).
- **Defaults (agent), owner may override:** A8 replaces A26 to A7 (`opened()`); Done in place of the button when a PIN is already set (G-41); "Copied" for 2 s; Limit row "₦X a day"; a mismatch starts again at A9 (neither entry kept); an unanswered set reads the wallet before asking again; A9 and A10 are one route with two steps (Back from A10 to A9). Copy not drawn: "Your account is open" (A7's handover), "We couldn't show your account", "Your account is opening", "Check again in a moment.", "We couldn't open this step", "We couldn't set your PIN. Try again.", "Copied".
- **Finding:** A26's "Your wallet is open" end (wallet open, KYC-05) offers Done only; a person whose wallet opened but who left before A9 is not led to A8 from there. W36 or a debit's `409 pin_not_set` will lead them to create it; A26 could send them to A8 instead (KYC-05's screen, not changed here).
- **NOT RUN:** the pay sheet and Wallet tab returns on screen (above); V10 (no device; OPS-10); a real Fintava sandbox opening (no sandbox selfie passes, questions 6 and 11, G-25); sign-out from a button (none on main; jest covers it).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
