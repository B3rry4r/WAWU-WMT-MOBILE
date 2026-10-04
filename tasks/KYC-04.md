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
- **V6 states, each by its cause, light and dark:** A8 loading (Hub answers held 6 s, `a8-loading`); A8 error (the Hub drops connections, `a8-error`), Try again recovers; A9 loading (`a9-loading`), A9 error (`a9-error`), Try again recovers; A10 setting (answer held 5 s, keys off, `a10-setting`); empty: A9 with nothing typed, A8 with no Limit row; a lost answer (`lost`: the Hub set the PIN, the pass-through dropped its answer): the app read the wallet, found the PIN set and ended, 1 POST (corrected in round 2: that run ended through `pin_already_set`, see below); no wallet (`no-wallet`): `/open-wallet-account` by link goes to A26. Jest: opening, unreadable, refusals, keys off while setting, PIN set on arrival.
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

Verifier, 4 Oct 2026 (fresh session; wrote none of this code). Mobile `wmt/KYC-04` at dbc4e33 in a detached worktree, merge base = mobile main 2c99b2f (main has not moved). Backend: a detached worktree of backend main 95d8bd4, Hub `dist` built there (no backend change in this task). Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk04/`:
- screenshots `$V/shots/<name>-<theme>.png` (390 px at 2x), renders `$V/design/`, side by sides `$V/side-{A8,A9,A10}-{light,dark}.png` (render left), state sheets `$V/sheet-states-{light,dark}.png`;
- browser driver `$V/drive.py` (my own scenarios; the App helper adapted from the builder's), runs `$V/results.jsonl` (38 runs), pass-through `$V/web-server.js` (the builder's, plus my controls: `/__thendown`, `/__pinhold`, `/__get401`, `/__deny`, `/__refreshas`), its request log `$V/calls.jsonl` (key names and lengths only);
- jest probe `$V/probe-pin.test.tsx` with `$V/probe-pin.log` and `$V/probe-pin-p3.log` (run in place, then removed);
- mutants `$V/mutants.txt` (`$V/mutate.py`); privacy scan `$V/privacy-scan.txt`; `npm run check` log `$V/check-branch.log`.

**Verdict: 2 defects open (both on A10, below). Status back to `building`.**

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed. `npm run check` exit 0: typecheck and lint clean, 40 suites, 704 tests (open-wallet 156), gates 9 run, 183 files scanned, 0 fail, 0 warn, 0 accepted, 205 tasks. Jest printed "A worker process has failed to exit gracefully" once; the run still exits 0 | `$V/check-branch.log` |
| Diff vs report | passed. `git diff --stat origin/main...HEAD` lists exactly the builder's files (25). No local copy of a shared component: A9 and A10 import `Keypad`, `DOTS` and `ALERT` from `@/components/pin-sheet` by path and draw their own dots row, which SHARED-CHANGES KYC-04 #2 asks to share (the barrel does not export them on main) | `git diff --stat` |
| V4 values | passed, with defect 1 for the PIN outcome. Against the built Hub: bank name "Loma Bank" twice (subtitle and Bank row), account name and the NUBAN grouped 3-3-4, each equal to `GET /money/wallet`; the long legal name from the Hub's own `WALLET_BANK_NAME` (Hub restarted with it) shows twice and wraps to exactly two lines in the Bank row, inside the card (text box 272 px wide, height = 2 line heights) (`a8-long-bank-*`). `limits` is null from the Hub, so no Limit row; with the pass-through setting `dailyLimitKobo` 30000000 on the Hub's real answer: "₦300,000 a day" (`a8-limit-standin-*`). No "Tier", no "Raise your limits". "Four digits." comes from `PIN_LENGTH` (mutant V5 killed). Copy put exactly the 10 digits as sent on the clipboard (read back equal, length 10), the label read "Copied" and back to "Copy" after about 2 s. Server sentences: `pin_mismatch` "The two PINs do not match. Enter the same PIN twice.", a Hub 500 "Something went wrong. Please try again." (`AllExceptionsFilter`'s own), "No connection..." is the client's `networkError()`. "It approves every payment and transfer." is a literal; it is backed by contract CONVENTIONS section 5 (PIN or the biometric approval standing in for it on every debit route, held by `wallet-gate-coverage.spec.ts`), so I accept it | `full`, `long_bank`, `limit` in `results.jsonl` |
| V5 picture | passed, one `unclear` (finding 4). A8, A9, A10 side by side in light and dark: same parts in the same order and sizes (result circle, title, subtitle slot, card rows, Copy pill, footer button; bar with Back and "n of 2", LockKeyhole tile, title, line, dots, keypad). The built screens sit about 50 pt higher because the render draws a phone status bar. Brief applied: no tier, no "Raise your limits", Limit row hidden (and shown when sent), bank name a slot. A10's mismatch (`a10-mismatch-*`): the sentence under the dots with CircleAlert in danger and all four empty dots ringed danger (computed border `rgb(217, 58, 58)`), back to "1 of 2", as BRIEF section 12 records. No em-dash in any added user-facing string; no colour literal in the diff | `$V/side-*.png`, `$V/shots/` |
| V6 states | passed (each by its real cause, light and dark, `$V/sheet-states-*.png`): A8 loading (Hub answers held 6 s) `a8-loading`; A8 error (Hub connections dropped) `a8-error`, Try again recovers; A8 opening (Fintava stand-in answers the account creation after 8 s, past the Hub's 3 s timeout, so the Hub holds the wallet as opening; A8 opened in a second tab meanwhile) `a8-opening`; A9 loading `a9-loading`; A9 error `a9-error`, Try again recovers; A10 setting (POST answer held 5 s: spinner, keys off, Back `aria-disabled`) `a10-setting`; A10 mismatch (real `400 pin_mismatch`) `a10-mismatch`; A10 server error (my `vk04_test`'s `TransactionPin` table renamed, so the Hub answers 500 to the POST and to the re-read) `a10-server-error`, then the table restored and the same PIN set (201, hash verifies); PIN already set: A8 Done (`a8-pin-set`, `pin-set-a8-link`), `/open-wallet-pin` by link leaves to Home with 0 new POSTs; no wallet: `/open-wallet-account` by link goes to `/open-wallet`, and so does `/open-wallet-pin` (through A8). My first "opening" try used a stand-in answer without `pin` and the app refused it as unreadable: the contract requires `pin`, so that was my harness, not the app (`opening` row in `results.jsonl`) | `$V/shots/` |
| V7 flow | passed, except defect 2 and the NOT RUN rows below. Fresh user signed in on A22, `/open-wallet` pushed from Home: A26, A5, A6 (stand-in selfie match), A7, then A8. Browser Back from A8 lands on `/` with no Open your wallet screen left (`back-from-a8-*`). A8's Create opens A9; A9's Back goes to A8; A10's Back goes to A9 with "0 of 4" and nothing sent. After A10: `/`, no flow screen left (`after-a10-*`), `GET /money/pin` `isSet: true`, and the stored hash verifies against the PIN typed. Jest on the real Expo Router (`flowReturn.test.tsx`) covers the Wallet-tab and pay-sheet returns; my mutant V7 (A9's route left off the flow list) fails 4 of its tests | `full` rows, `$V/mutants.txt` |
| V8 money | passed for what applies; the rest is not applicable because this task moves no money (no debit, webhook or ledger). One POST per A10 (keys off and `inFlight` while setting). Two first PINs cannot both land: the Hub's primary key answers the second `pin_already_set`. Chromium itself re-sent a POST whose connection dropped (finding 3); the Hub answered it `409`, never a second hash. Defect 1 is the money-adjacent fault | `calls.jsonl` |
| V9 seam | passed (as a harness); defects 1 and 2 are both reproduced on it. Hub `dist` from 95d8bd4 on :4953 with a fresh `vk04_test` (migrated, seeded), stand-in WAWU ID :4954 (people registered there and signed in on the app's A22, no injected token), Fintava stand-in (made-up numbers, started with `env -i`, no key in its environment; the Hub had a made-up key), web export of dbc4e33 on :8153 (`--clear`, 0 `wawuafrica.com` in the bundle; 0 requests to `wawuafrica.com` or `fintavapay.com`). 38 browser runs across 23 scenarios. Rows: 38 wallets opened, 20 PINs set. The server-only values on screen: the NUBAN Fintava's stand-in issued and the Hub recorded | `results.jsonl`, `calls.jsonl` |
| Privacy | passed for storage and logs; failed for in-memory state across an account change (defect 2). 13 distinct 4-digit PINs typed (plus partial entries). 0 hits in a full `vk04_test` dump, the Hub, stand-in WAWU ID, Fintava stand-in and pass-through logs and `calls.jsonl`; 0 in any navigation URL, request URL, console line or browser storage across 36 browser runs. localStorage held only `wawu.session.access` and `.refresh`; no sessionStorage, IndexedDB or cookie. 42 `POST /money/pin` reached the pass-through, each body exactly `{pin, pinConfirmation}`, 4 digits each, no query string (positive control: the browser captured 29 of the app's own POST bodies carrying the PIN). `TransactionPin` holds 20 rows, all `$argon2id$v=19$`. Jest: no PIN in the query cache, mutation cache (A10 uses no `useMutation`) or secure store after a set (probe P5); 0 jest snapshots in the repo. No error reporter exists | `$V/privacy-scan.txt`, `probe-pin.log` |
| Mutations | 11 of my own, each restored and sha1-checked. **Killed (7):** V1 a late answer after a session end still finishes; V2 the mismatch without the wrong-PIN ring; V3 Copy puts the grouped number on the clipboard; V5 the length word off by one; V7 A9's route left off the flow list; V8 A8's Done and Create swapped; V11 `pin_already_set` treated as a refusal. **Survived (4):** V6 a lost answer whose re-read also fails treated as set (no test covers a failed re-read: part of defect 1); V10 a session end that keeps A9's first entry (part of defect 2); V4 a limit of 0 kobo shows "₦0 a day" (a test gap; no server sends 0, and the contract does not exclude it, recorded, not a defect); V9 A7 handing over on every render (equivalent: `way.opened` is memoised on the router, so the effect runs once; the guard matters only if the callback changed) | `$V/mutants.txt` |
| Secret scan | passed. Every 8-character window of the Fintava key (58 windows) against `git diff origin/main...origin/wmt/KYC-04` (112 KB): 0 hits | the scan printed counts only |
| V10 | NOT RUN. No device. Unblocked by a tester build with the backend on the droplet (OPS-10) | |

### Capability checks

1. A8 copy, Create, bank name from the API, Limit row only when sent: passed (V4).
2. A9, 4 digits: passed.
3. A10, re-enter; mismatch in W11's look, wording in the brief: passed (`a10-mismatch-*`, BRIEF section 12). The other outcomes fail under defect 1.
4. V5 light and dark: passed, one `unclear` (finding 4).
5. Values from the API or the user: passed (V4).
6. States by their real cause: passed (V6).
7. After A7, a user lands on A8: passed in the browser (`full`, both themes).
8. After A10, back to the pay sheet or W5: passed in jest on the real Expo Router only. **NOT RUN on screen:** neither the pay sheet (SHARED-CHANGES KYC-05 #1) nor the Wallet tab (WALLET-01) has a way into the flow on main. Unblocked when either merges with a call to `useOpenWalletEntry().open`.

### Findings

**Defect 1 (A10): after an unanswered set, A10 can end the flow as if the PIN just typed were set, when the server holds an earlier one.**
The steps that cause it:
1. `afterPinRefusal` maps no answer (network, 5xx) to `unknown`, and `submit` then re-reads the wallet.
2. If that re-read also fails, which is likely when the connection is what dropped, the `catch` falls through to `startAgain` with "No connection. Check your internet and try again." The person is sent back to A9 to choose a PIN, though the first one may well be set.
3. The next POST answers `409 pin_already_set`. The service checks that before the mismatch: `transaction-pin.service.ts`, `set`.
4. `afterPinRefusal` maps `pin_already_set` to `done`, so `finish()` ends the flow as a success. That holds even when the two new entries differ.

The person leaves believing their PIN is the one they typed last. Their first payment then answers `pin_incorrect`, and the PIN is locked after five tries.

- **Reproduce (real seam, both themes), `lost_reread_fails`.**
  1. A9 and A10 with 8642.
  2. The pass-through lets the Hub set it (201), drops the answer, and then drops every Hub connection (`/__losepin?n=1`, `/__thendown?on=1`). The browser's own re-sends and the app's re-read are dropped too.
  3. A9 shows "No connection..." (`lost_reread_fails-told-*`).
  4. Connection back; the person types 5555 twice. The Hub answers `409`, and the app goes to `/` with no flow screen left (`lost_reread_fails-after-second-*`).
  5. The stored hash verifies 8642, not 5555.

  `lost_reread_fails_mismatch` types 5555 then 5556. It also ends on `/` as done (both themes).
- **Jest:** probe P3 (re-read lost, second PIN 5555: one POST, `onDone` called) and P4 (entries 1111 and 2222, server `pin_already_set`: `onDone` called). Both are in `$V/probe-pin.log` and `-p3.log`.
- **Tests miss it:** mutant V6 (a failed re-read treated as set) survives the suite.

Closed when:
- no path ends the flow, or tells the person their PIN was not set, unless the server said which PIN is set;
- a failed re-read keeps asking where the PIN stands (read again, or "We couldn't check your PIN" with Try again) and never offers a new entry;
- a `pin_already_set` that answers a PIN other than one this visit sent, or two entries that differ, does not end as success;
- a jest test kills V6, plus one for P3 and one for P4.

**Defect 2 (A9 and A10, privacy and a stuck screen): a session end that keeps the app signed in does not start A9 and A10 over.**
FIX-04 counts two session ends that keep the status `signedIn`: a refresh answering another account, and a sign-in that replaces a session. `CreatePinScreen`'s `onSessionEnd` only sets `live = false` and nulls `first`. It keeps `digits`, `step`, `phase` and the line, and `live` never turns true again while the screen stays mounted.

What happens when A is on A9 and the session becomes B's:
- A's typed digits stay on B's dots.
- B's next digits are appended to them, so B sets a PIN that is partly A's input.
- B's request is sent, and its answer is dropped by `!live.current`.
- The screen stays on "Setting your PIN" with the keys off and Back disabled, with no way out but the platform back.
- If the switch happens on A10, `first` is null, so four digits typed there send nothing and the screen sits full (probe P6).

A26 handles the same session ends by starting a new visit (KYC-05 rounds 5 to 7). Reach is the same as KYC-05's defect 2: nothing in the UI offers these switches today, and KYC-05 treated that as in scope.

- **Reproduce (real seam, both themes), `switch_a9_bopen`.**
  1. B already has an open wallet and no PIN.
  2. A signs in on A22, reaches A9 and types 2 and 7 ("2 of 4").
  3. The next Hub GET answers 401 and the refresh answers B's pair (`/__get401?n=1`, `/__refreshas`; the token's `sub` is now B's).
  4. A9 still shows "2 of 4" (`switch_a9_bopen-b-*`). B types 1 and 3, which moves on to A10, then types 2713.
  5. The Hub stores B's PIN as 2713: the hash verifies, and A typed the "27".
  6. Twenty seconds later the screen is still on "Setting your PIN" with Back `aria-disabled` (`switch_a9_bopen-b-20s-*`).
- **Jest:** probe P1 (with the app's own `createQueryClient`, the POST body is A's two digits joined with B's, and the screen is stuck) and P6 (sign-in as B on A10: four digits typed, 0 POSTs sent).
- **Tests miss it:** mutant V10 survives.
- **Late answer, not a defect:** a late answer itself changes nothing. In `late_after_switch_bopen` and `late_after_switch` (both themes), A's set lands 6 s after the switch. A's hash verifies, B has no PIN row, and B's screen moves only on B's own reads. Jest P2 shows the same.
- **Sign-out, not a defect:** a refused refresh mid-A10 goes to `/welcome`. B then signs in and gets an empty A26, because B has no wallet (`signout_mid`, both themes).

Closed when A9 and A10 start over on every `onSessionEnd`. Starting over means:
- step 1, nothing typed, no line, keys live;
- the screen reads again as the new account;
- a test with the app's real session and query client shows "0 of 4" after a refresh answering B, and a set by B then ending normally, with V10 killed.

**Finding 3 (evidence, not a product defect): the builder's `lost` run did not take the re-read path.** Chromium re-sent the POST when the pass-through destroyed the socket. The Hub answered that re-send `409 pin_already_set`, and the app ended through `done`. The builder's `$K/calls.jsonl` lines 71 and 112 show 2 POSTs each, not the "1 POST" reported. My `lost_reread_ok` drops every answer (3 POSTs reached the Hub: the app's own and 2 browser re-sends). The app then read the wallet, found the PIN set and ended (both themes), so the re-read path itself works. Platform re-sends of a dropped POST are why `pin_already_set` answering the app's own first request is real, and correctly ends as done.

**Finding 4 (`unclear`): the arrow on "Create your transaction PIN".** The canvas source passes `iconRight: 'ArrowRight'` (`design/_gen/auth.js` line 45), but the kit's `Btn` ignores `iconRight`, so the rendered A8 has no arrow. The built button has one. Picture and source disagree; the brief does not say.

**Finding 5 (`unclear`, the builder's finding about A26's "Your wallet is open" end).** My judgement: not a defect of this task, but a follow-up that has no owner today.
- **Why not this task:** the capability check "After A7, a user lands on A8" is the hand-over out of A7, and it passes on the seam.
- **Who could own it:** a person whose wallet opened but who left before A9 needs a way back in. Two ways would serve, and neither belongs to this task:
  - A26's open end, which is KYC-05's (merged).
  - The ways into the flow, which are not built: `leadIfNoWallet` routes only `wallet_not_open`, the Wallet tab is WALLET-01, and the pay sheet is SHARED-CHANGES KYC-05 #1.
- **Why it is unowned:** nothing in the backlog creates a first PIN after A8. WALLET-06's W36 is "change" only (its BRIEF entry: "a wallet holder already set one on A9"), and a debit answers `409 pin_not_set` with nowhere to go. So such a person has no in-app way to create a PIN. It needs an owner and a ruling on where `pin_not_set` leads (A8 or A9 would serve).

**Checked and not a defect:**
- The PIN appears in no route param or URL.
- A8 and A9 by link with no wallet go to A26.
- Back from A8 never lands on an earlier step.
- Leaving after A10 or A8's Done dismisses every flow screen.
- After a set, the second entry stays in `digits` until the screen unmounts (the dots show "4 of 4"). It is dropped with the screen, nothing reads it, and the leave runs straight after.

**NOT RUN:**
- Capability check 8 on screen. Unblocked when the pay sheet's or the Wallet tab's way in merges (SHARED-CHANGES KYC-05 #1, WALLET-01).
- V10. Unblocked by OPS-10's tester build.
- The A7 hand-over frame ("Matched to your BVN, Your account is open") as a picture. It lasts one render before A8 replaces it; A7 itself is KYC-03's and was verified there.

Clean-up: the Hub, stand-in WAWU ID, Fintava stand-in and pass-through stopped (PIDs and command lines checked), `vk04_test` dropped, both worktrees removed.

## Builder round 2

Builder, 4 Oct 2026. Mobile `wmt/KYC-04` from the verifier's eece9fc (mobile main still 2c99b2f, nothing to merge). Code commit 44c6cd7. Backend main moved to c4d17bb (FIX-05, per-caller rate-limit store), and the seam Hub was built from it. No backend change. Evidence `$K2` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc04/r2/`:
- shots `$K2/shots/<name>-<theme>.png` and `$K2/sheet-r2-states.png`;
- the verifier's driver with my ports and two added scenarios (`$K2/drive.py`) and the verifier's pass-through (`$K2/web-server.js`);
- runs `$K2/results.jsonl`, request log `$K2/calls.jsonl`;
- mutants `$K2/mutants2.txt` (`mutate2.py`), the new tests run on the round-1 code `$K2/old-code-run.txt`, `npm run check` `$K2/check-r2.log`.

**Defect 1, fixed as ruled.** `409 pin_already_set` is never shown as "the PIN you just typed is set".

(a) **A set that got no answer.** A10 reads the wallet.
- If the read says the PIN is set, the flow ends: this screen arrived with none, so the PIN typed twice is the one set.
- If it says not set, the person starts again at A9 with the line.
- If the read gets no answer either, A10 stays: "2 of 2", the keys off, and W11's line "We couldn't check whether your PIN was set." followed by the read's own words. A Try again under it repeats only the read, never a new entry, until a read answers.
- Back from that state goes to A8, which reads the wallet before offering anything.

(b) **`409 pin_already_set` to a screen that knew of no PIN.** The step ends on the canvas's result layout (warning tone, lock): "You already have a transaction PIN" over "A PIN was already set on this account, so the one you just entered was not saved. Your earlier PIN is the one that approves payments." with Done.
- The sentence is true however the earlier PIN got there: another phone, an earlier visit, or the network sending the same request twice (the verifier's finding 3).
- There is no reset screen or route in the app (W37 is WALLET-06's, `todo`), so this is filed as **BACKEND_GAPS G-116**.
- The wording is recorded in `docs/designer/BRIEF.md` (section 12, A10), Default (agent), owner may override.

A PIN known to be set on arrival still goes on as done (G-41), unchanged.

**Defect 2, fixed as ruled.** On every `onSessionEnd` (sign-out, refused refresh, a sign-in that replaces a session, a refresh answering another account), A9 and A10 drop:
- the typed digits;
- A9's entry (now state, and the step is derived from it: while it is held the screen is A10);
- the phase, the line and the in-flight mark.

They also void the visit, so an answer or a re-read from before the end moves nothing, and nothing is sent or re-sent for the new account. The screen re-reads as whoever is signed in. While still signed in it leaves the flow (`useOpenWalletWay().leave`, a new `onLeave` prop); signed out, the route sends the person to `/welcome`, as before. It is never left on "Setting your PIN".

**(c) The arrow.** Kept. The canvas source passes `iconRight: 'ArrowRight'` (auth.js line 45), and the shared `Button` already has `iconRight`, so nothing is forked. The render shows none only because the kit's `Btn` ignores it.

**(d) A limit of 0.** A new test: a limit of 0, or one that is not whole kobo, shows no Limit row and never "₦0 a day".

**(e) Correction to round 1.** The `lost` run did not take the re-read path. Chromium re-sent the POST when the pass-through destroyed the socket, and the Hub answered that re-send `409`. So round 1's "1 POST" was wrong: `$K/calls.jsonl` holds 2 POSTs per run. Round 2's `lost_reread_ok` and `lost_retry` lose every answer, so they do take the re-read path.

**Tests.**
- Jest: 7 new or changed in `CreatePinScreen.test.tsx`, 1 in `WalletOpenScreen.test.tsx`, 1 in `pin.test.ts`. They cover:
  - the already-set end;
  - P4 (1111 then 2222 answered 409: the already-set end, not done);
  - P3 (no answer, then no answer to the read: A10 stays with Try again, the keys are off, 5555 typed twice sends nothing, 1 POST in all, and Try again ends only once a read says set);
  - Back from that state to A8;
  - P1 with the app's real query client (a refresh answering B mid-A9: "0 of 4", A9, `onLeave`, then B's own `{1358, 1358}` ends normally);
  - P6 (a sign-in as B on A10: back on A9, four digits send 0 POSTs);
  - a session change while setting (the spinner goes, and A's late 201 calls nothing).
- **On the round-1 code** (dbc4e33's `CreatePinScreen.tsx` and `pin.ts`, restored by `cmp`), 7 of these fail, P1, P3, P4 and P6 among them. On this code all pass.
- **Mutants (10, all killed):**
  - the verifier's V6 (failed re-read treated as set), V10 (a session end keeps A9's entry) and V4 (a 0 limit shown);
  - `pin_already_set` as a plain refusal;
  - no leave on a session change;
  - digits kept;
  - phase kept (stuck "Setting");
  - an earlier visit's answer acting;
  - Back from the unknown state to A9;
  - keys live while unknown.

**V9 against the real seam, light and dark, all `ok`.**
- **Setup:**
  - a Hub `dist` from backend main c4d17bb on :4951 with a fresh `k04_r2_test`, migrated and seeded;
  - the stand-in WAWU ID on :4952, with sign-in on A22;
  - a Fintava stand-in;
  - this branch's web export on :8151, with 0 `wawuafrica.com` in it.
- **Scenarios:**
  - `full`.
  - `lost_retry` (every set answer lost and the Hub down for the read): `a10-unchecked-*`, keys `aria-disabled`, 4 taps refused, 1 POST. Connection back and Try again: `/`, and the hash verifies 8642.
  - `already_set` (a PIN set through the API while A9 shows, as another phone would; then 2749 twice): `a10-already-set-*`. The hash is still 1111, not 2749, and Done goes to `/`.
  - The verifier's `lost_reread_fails` and `_mismatch`: the screen stays on `/open-wallet-pin`, the second PIN is never sent (1 POST), and the hash is 8642.
  - `server_error` (the Hub 500s on the set and the read): `a10-server-error-*` with Try again. The table is restored, Try again shows "not set", A9 again, and 3141 sets (2 POSTs).
  - `lost_reread_ok`: ends, hash 8642.
  - `switch_a9_bopen` and `late_after_switch_bopen` (a refresh answering B): the flow is left to `/` with no flow screen. After 20 s B has no PIN row and nothing is stuck. A's late answer sets A's PIN only.
- **Results:** browser storage held only the two session keys, 0 blocked requests, and the only console errors are the 500s that `server_error` causes. My first run of four scenarios failed in the harness, not the app: its key taps waited on keys the app now turns off. The driver now counts a refused tap, and the four were rerun.
- **Note:** after the container restart my Hub first came up with the Fintava stand-in's old port, which gave a BVN check 503. I restarted it and reran.

**Counts and checks.** `npm run check` exit 0: 40 suites, 711 tests (open-wallet 163), gates 9 run, 183 files, 0 fail, 0 warn, 0 accepted, 205 tasks. Secret scan: 58 eight-character windows of the Fintava key against `git diff origin/main...HEAD`: 0 hits; 0 PEM blocks.

**Filed:** BACKEND_GAPS G-116. BRIEF section 12, A10: the already-set and the unknown-state wording.

**Not built (Lead):** nothing for `409 pin_not_set` from a payment.

**NOT RUN:**
- Capability check 8 on screen (pay sheet: SHARED-CHANGES KYC-05 #1; Wallet tab: WALLET-01).
- V10 (OPS-10).
- A real Fintava sandbox opening (questions 6 and 11, G-25).
- A sign-out from a button: none on main. Jest and `signout_mid` from round 1 cover a sign-out.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
