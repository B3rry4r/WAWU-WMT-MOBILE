---
id: KYC-04
title: Open your wallet: account opened, create PIN
owner: YOU
area: KYC
order: 88
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: done
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

**Main moved during the round.** Mobile main moved to 26cf830 (FIX-05: docs and task files, nothing under `src/` or `contract/`). It is merged in as 6662f9f: SHARED-CHANGES kept rows from both sides, and PROGRESS was regenerated. `npm run check` on the merged tree: exit 0, 40 suites, 711 tests, gates 0/0/0 on 183 files, 206 tasks.

**Filed:** BACKEND_GAPS G-116. BRIEF section 12, A10: the already-set and the unknown-state wording.

**Not built (Lead):** nothing for `409 pin_not_set` from a payment.

**NOT RUN:**
- Capability check 8 on screen (pay sheet: SHARED-CHANGES KYC-05 #1; Wallet tab: WALLET-01).
- V10 (OPS-10).
- A real Fintava sandbox opening (questions 6 and 11, G-25).
- A sign-out from a button: none on main. Jest and `signout_mid` from round 1 cover a sign-out.

## Verifier report, round 2

Verifier, 4 Oct 2026 (fresh session; wrote none of this code, and none of round 1's code or round 1's report). Mobile `wmt/KYC-04` at da7cecd in a detached worktree (builder's round 2 code 44c6cd7, mobile main 26cf830 merged in). Mobile main has since moved to 7c6c7b2, so it was also trial-merged in a throwaway worktree. Backend: a detached worktree of backend origin/main dfaa53b, Hub `dist` built there with a fresh `vk04r2_test` (87 migrations, seeded); no backend change in this task. Evidence `$V2` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk04r2/`:
- screenshots `$V2/shots/<name>-<theme>.png` (390 px at 2x), renders `$V2/design/`, sheets `$V2/sheet-a10-states-{light,dark}.png` and `$V2/side-A9-A10-{light,dark}.png`;
- browser driver `$V2/drive.py` (round 1's scenarios plus my own: `dup_answer`, `lost_press`, `unchecked_back`, `unchecked_back_fast`, `checking_back`, `switch_a10_bopen`, `switch_unchecked`, `switch_a9_bpin`, `switch_a10_bpin`, `switch_a9_bnopin`, `switch_a9_bnowallet`, `post401_same`, `post401_switch`), runs `$V2/results.jsonl` (49 runs), pass-through `$V2/web-server.js` (plus `/__post401`), request log `$V2/calls.jsonl` (key names and lengths only);
- jest probes `$V2/probe-pin-r2.test.tsx` with `$V2/probe-pin-r2.full.log` (run in place, then removed from the worktree) and `$V2/probe-on-round1-code.log`;
- mutants `$V2/mutate.py`, `$V2/mutate2.py`, results `$V2/mutants.txt`; privacy scan `$V2/vk04r2_test.dump.sql` and the logs; `npm run check` logs `$V2/check-branch.log`, `$V2/check-trial-merge.log` and, on the tree that carries this report, `$V2/check-final.log` (last line `CHECK_EXIT=0`).

**Verdict: 1 defect open (A10, the already-set sentence). Status back to `building`.** Round 1's defect 1 and defect 2 are both fixed as ruled: no path ends the flow as "set" on a PIN the server held before, a failed re-read keeps A10 with a Try again that only reads, and a session change drops everything and leaves the flow. The defect below is a different path to a false sentence that the lead's ruling also rules out.

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed. `npm run check` exit 0 on the branch: typecheck and lint clean, 40 suites, 711 tests (open-wallet 163), gates 9 run, 183 files scanned, 0 fail, 0 warn, 0 accepted, 206 tasks. Trial merge of origin/main 7c6c7b2 into da7cecd: two docs conflicts (BACKEND_GAPS: kept both sides' rows; PROGRESS: regenerated), then `npm run check` exit 0 with the same counts (40 suites, 711 tests, gates 183 files 0/0/0, 206 tasks; main's contract and `schema.generated.ts` changes typecheck). Note: origin/main now tracks a stray `web.pid` (HOME-06 merge 66389ea), not from this branch | `$V2/check-branch.log`, `$V2/check-trial-merge.log`, `$V2/check-final.log` |
| Diff vs report | passed. Round 2 changed `CreatePinScreen.tsx`, `pin.ts`, `src/app/open-wallet-pin.tsx`, three test files, BRIEF section 12 and G-116, exactly the builder's list. No local copy of a shared component | `git diff --stat eece9fc..da7cecd` |
| V4 values | passed. Unchanged since round 1 except: a limit of 0 or not whole kobo shows no Limit row (mutant V4 now killed). The already-set and unknown-state wording is recorded in BRIEF section 12; no em-dash and no colour literal in any added string or style | mutants, `git diff` scan |
| V5 picture | passed for the drawn states, 1 defect (below) on wording and 2 `unclear` (findings 3 and 4). A9 and A10 (3 typed) against the renders, light and dark, 390 px: same parts in the same order and sizes (only the render's status bar differs). New A10 states against W11's wrong-PIN style (CircleAlert in danger under the dots, same type): unknown state (`a10-unchecked-*`: "2 of 2", four dots filled, keys dimmed and off, the line, a secondary Try again), already-set end (`a10-already-set-*`: the canvas result layout, warning tone, lock, Done), server error (`a10-server-error-*`), mismatch (`a10-mismatch-*`, ring in danger). Theme tokens only in light and dark | `$V2/side-A9-A10-*.png`, `$V2/sheet-a10-states-*.png` |
| V6 states | passed, each by its real cause, light and dark: lost answer then re-read dropped (`lost_retry`, `lost_reread_fails`, `lost_reread_fails_mismatch`, `lost_press`: keys `aria-disabled`; the 4 taps of `lost_retry` are refused, and in `lost_press` every key, Delete, the dots and the title pressed with force send nothing), Hub 500 on the set and the read (`server_error`: Try again, table restored, "not set", A9 again, set), already set (`already_set`), checking (`checking_back`) | `$V2/results.jsonl` |
| V7 flow | passed. `full` in both themes: A26, A5, A6, A7, A8, A9, A10, back on `/`, `GET /money/pin` `isSet: true`, stored hash verifies the PIN typed. Back from the unknown state goes to A8 (`unchecked_back`, finding 2) | `full`, `unchecked_back` |
| V8 money | passed for what applies. One POST per A10 in every run; a second PIN can never replace the first: the Hub answered every later POST `409` and the stored hash stayed the first PIN (`lost_reread_fails`, `already_set`, `unchecked_back_fast`, `dup_answer`). A 401 on the set followed by a refresh for the same account is sent once more, once (`post401_same`: 1 forwarded POST, hash is the PIN typed) | `$V2/calls.jsonl` |
| V9 seam | passed as a harness; the defect below is reproduced on it. Hub from backend origin/main dfaa53b on :4953, stand-in WAWU ID on :4954 (`mock-wawu-id/server.js`, people registered there and signed in on the app's A22, no injected token), Fintava stand-in (made-up numbers, started with `env -i`; the Hub had a made-up key), web export of da7cecd on :8153 (`--clear`, 0 `wawuafrica.com` in the bundle, 0 requests to `wawuafrica.com` or `fintavapay.com`). 49 browser runs, 23 scenarios: 20 in both themes, 3 variants (`switch_a9_bnopin`, `switch_a9_bnowallet`, `switch_a10_bpin`) in light only. 66 wallets opened, 38 PINs set. The stored hash verified (argon2 with the backend's own module) after every set and for the lost, already-set and switch rows | `$V2/results.jsonl` |
| Lead ruling 1 (409 never "your PIN is set"; A10 stays when the re-read fails) | passed with the defect below. `lost_retry`, `lost_reread_fails` and `_mismatch`: A10 stays, "2 of 2", 1 POST in all, second PIN never sent, hash is the first PIN; Try again with the connection back ends on `/` (`lost_retry`), and a double click on it ends on `/` with 0 further POSTs (`lost_press`). `already_set`: the end screen, hash still the earlier PIN, Done to `/` | `$V2/results.jsonl` |
| Lead ruling 2 (any change of account or session) | passed. Each scenario, both themes, B with an open wallet: mid-A9 (`switch_a9_bopen`), mid-A10 (`switch_a10_bopen`), unknown state (`switch_unchecked`: Try again answered 401, the refresh answered B), set in flight (`late_after_switch_bopen`: A's late 201 lands, A's hash is set, B has no row, the screen is on `/` and not on "Setting your PIN" at 13 s), a 401 on the set with the refresh answering B (`post401_switch`: the Hub saw 0 forwarded POSTs, so nothing of A was re-sent for B; no row for A or B), B with a PIN already (`switch_a9_bpin`, `switch_a10_bpin`) and B with no wallet (`switch_a9_bnowallet`): in every one the flow is left to `/`, 0 POSTs go from the screen after the switch, 0 rows for B. Where the browser history was instrumented (`switch_a9_bpin`, `switch_a10_bpin`, `switch_a9_bnopin`, `switch_a9_bnowallet`) the calls were `go(-1)` then `replaceState('/')`, the same whether B has a PIN, none or no wallet. Sign-out mid-A10 goes to `/welcome` and B then gets an empty A26 (`signout_mid`) | `$V2/results.jsonl` |
| Probes P1 to P6 (round 1) | passed. Re-run as assertions (`$V2/probe-pin-r2.test.tsx`) on da7cecd: P1 (refresh answering B mid-A9: "0 of 4", `onLeave` once, B's own `{1358, 1358}` is the only POST), P2 (late answer after the switch moves nothing, no money invalidation), P3 (lost answer, lost read, then 5555 twice: 1 POST, no `onDone`), P4 (1111 then 2222 answered 409: the already-set end, no `onDone`), P5 (no PIN in the query cache, mutation cache, secure store or the tree after a set), P6 (sign-in as B on A10: A9 again, 4 digits send nothing). 14 of 14 probes pass. The same file on round 1's `CreatePinScreen.tsx`, `pin.ts` and route: 11 of 14 fail (P1, P2, P3, P4, P6 among them; P5 passes, it is a positive privacy probe) | `$V2/probe-pin-r2.full.log`, `$V2/probe-on-round1-code.log` |
| Privacy | passed. 16 distinct 4-digit PINs typed. 0 hits in a full `vk04r2_test` dump (305 KB) and in the Hub, stand-in WAWU ID, Fintava stand-in and pass-through logs, `calls.jsonl` and every log of mine; 0 in any navigation URL, 0 pin POSTs with a query string; localStorage held only `wawu.session.access` and `.refresh`, no sessionStorage, IndexedDB or cookie in 49 runs; the 47 POST bodies the browser sent were each exactly `{pin, pinConfirmation}` (positive control: 47 captured). `TransactionPin` holds 38 rows, all `$argon2id$v=19$`. Jest N8: no PIN in `console.log`, `error` or `warn` across a mismatch, a lost answer, an already-set and a done. In memory only: finding 5 | `$V2/vk04r2_test.dump.sql`, `results.jsonl` |
| Mutations | 15 new mutants of mine on round 2's code plus round 1's V4, V6, V10 re-applied. **Round 1's three: all killed** (V4 `<= 0` to `< 0`: the limit-0 test; V6 a failed re-read treated as set: 2 tests; V10 a session end keeps A9's entry: the P6 test). **New: 9 killed by the builder's suite, 2 more killed only by my probes, 4 survived everything.** Killed by the suite: M1 a failed re-read offers a new entry, M2 "not set" treated as set, M9 a 5xx from the set treated as a refusal, M10 leave only on the second session end, M11 Back from the unknown state to A9, M12 Try again with a stale visit, M13 the already-set sentence says "was saved", M14 unmount does not void the visit, M15 a "set" read never finishes. M4 (a session end leaves `inFlight` set, so B can never send) and M6 (a read from an earlier visit acts on "set") survived the builder's suite and are killed by my probes N4 and N3: a gap in the builder's tests, not in the product. Survivors: M3 (the already-set end skips the money invalidation) and M5 (a session end keeps the line) survive everything: nothing observable, the flow leaves in the same tick. M7 (a failed read from an earlier visit draws its Try again) and M8 (leave on any session end, also signed out) also survive: unobservable on the app's routes, the screen is gone or redirected | `$V2/mutants.txt` |
| Secret scan | passed. Every 8-character window of the Fintava key (58 windows) against `git diff origin/main...origin/wmt/KYC-04` (159 KB): 0 hits; 0 PEM blocks | the scan printed counts only |
| V10 | NOT RUN. No device. Unblocked by a tester build with the backend on the droplet (OPS-10) | |

### Defect

**Defect 1 (A10): when the person's own set landed and its answer arrived twice, the already-set end says the PIN just typed was not saved.**
1. The Hub sets the PIN and the answer is lost.
2. The platform re-sends the same request. Chromium does it here (round 1's finding 3, restated in the builder's correction (e)); OkHttp can do the same on a stale pooled connection (NOT RUN on a device, below).
3. The Hub answers the re-send `409 pin_already_set`, and the app ends on "You already have a transaction PIN" over "A PIN was already set on this account, so the one you just entered was not saved. Your earlier PIN is the one that approves payments."
4. The stored hash verifies the PIN the person just typed, and the person has no earlier PIN. The sentence is false on both counts: it was saved, and nothing earlier exists. They may go looking for a PIN they never made, and five wrong tries lock it.

BRIEF section 12 and G-116 list "the network sending the same request twice" among the causes and call the sentence true in each. It is not true for this one. The lead's ruling asks for a true sentence that the earlier PIN stands, without lying either way.

- **Reproduce (real seam, both themes), `dup_answer`.**
  1. A9 and A10 with 8642.
  2. `/__losepin?n=1`: the pass-through lets the Hub set it (201) and drops that answer.
  3. The Hub saw `[201 (answer dropped), 409]`.
  4. The screen text is the sentence above; Done goes to `/`.
  5. The stored hash verifies 8642 (`hash_is_8642: true`).
  - `dup_answer-*` shots: `shots/dup-answer-light.png`, `shots/dup-answer-dark.png`.
- **Jest:** probe N7 prints the same text for a single `409` after one typed pair.

Closed when:
- the sentence on that end is true both when the earlier PIN is the one just typed (an own request that landed first) and when it came from another phone or visit, so it does not say the typed PIN was not saved (for example it says a PIN is set on the account and that the PIN set first is the one that approves payments);
- a jest test with a `409` pins the new wording, and the `dup_answer` seam run shows it;
- BRIEF section 12 and G-116 carry the same wording.

### Findings (not defects)

**Finding 2 (`unclear`, low): Back from the unknown state lands on a stale A8.** The builder's report says Back goes to A8 "which reads the wallet before offering anything". It does not: A8 stays mounted under A9 and nothing refreshes its cached wallet, so it still offers "Create your transaction PIN" when the PIN is set (`unchecked_back`, `unchecked-back-a8-*`). No double set follows. Tapping it opens A9, which reads and leaves with 0 POSTs. With a slow Hub (`unchecked_back_fast`, answers held 6 s) A9 opens on the cached wallet with live keys; typing 3579 twice sends a POST that answers 409, and the already-set end shows (true there: 8642 is the earlier PIN, hash unchanged). An A8 that reads again when it comes back into view, or the unknown state invalidating the wallet read on Back, would remove the stale offer.

**Finding 3 (`unclear`, low): Back is a dead control while "Checking your PIN".** During the re-read Back carries no `aria-disabled` (in "Setting your PIN" it does) and a press does nothing (`checking_back`, both themes: `back_aria_disabled_while_checking` null, `back_moved_while_checking` false). Only the keys' look is dimmed; Back looks live. The platform back still leaves.

**Finding 4 (`unclear`, cosmetic): a wrapped line detaches its icon.** The unknown-state line is two lines at 390 px, and CircleAlert sits at the left gutter far from the centred text (`a10-unchecked-*`, `a10-server-error-*`); the one-line mismatch keeps the icon beside its text. W11 draws no wrong-PIN state, so the picture does not settle it.

**Finding 5 (not a defect): the second entry stays in React state until the screen unmounts.** In the unknown, already-set and done states `digits` keeps the second entry (the dots read "4 of 4"); the `CreatePinScreen` comment says both entries are dropped when the request is answered. Memory only, nothing reads it, and nothing was stored or logged (privacy row).

**Finding 6 (residual, not a defect):** "set" from a re-read cannot tell the person's own PIN from one another phone set in the same window after a lost request that never reached the server. The window is the length of one request and nothing in the app or the contract can close it.

**Checked and not a defect:**
- A late answer, a late read and a late 401 refresh from an earlier session change nothing (probes N3, N4, N5; `late_after_switch_bopen`; `post401_switch`).
- Two Try again taps in one render batch call `onDone` twice in a jest `act` that batches the renders (N1 with both presses in one `act`); each tap is its own event on a device and the button is gone after the first, and `lost_press` (double click) ended once.
- Round 1's finding 4, the arrow on "Create your transaction PIN": the shared `Button` has `iconRight`, the canvas source passes it (`design/_gen/auth.js` line 45), and the render shows none because the kit's `Btn` ignores it. Recorded, not a defect.

**NOT RUN:**
- V10 on a device, and with it the native stack's exit animation under two leaves in a row and OkHttp's own re-send of a dropped POST (the seam used Chromium's). Unblocked by OPS-10's tester build.
- Capability check 8 on screen (the pay sheet and the Wallet tab returns). Unblocked when SHARED-CHANGES KYC-05 #1 (pay sheet) or WALLET-01 (Wallet tab) merges with a call to `useOpenWalletEntry().open`.
- A real Fintava sandbox opening (G-25, questions 6 and 11): the stand-in answered.

Clean-up: the Hub, stand-in WAWU ID, Fintava stand-in and pass-through stopped (PIDs and command lines checked), `vk04r2_test` dropped, the three worktrees removed.

## Builder round 3

Builder, 4 Oct 2026. Mobile `wmt/KYC-04` from the verifier's edfdccb, with `origin/main` 7d0e538 merged in first as 7e7a7df (BACKEND_GAPS: both sides' rows kept, sorted by number; PROGRESS regenerated). Backend main is 38bbe4c (WALLET-18); the seam Hub was built from it, no backend change. Evidence `$K3` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc04/r3/`:
- shots `$K3/shots/<name>-<theme>.png`;
- the verifier's driver with my ports and the changed scenarios (`$K3/drive.py`), the pass-through (`$K3/web-server.js`), runs `$K3/results.jsonl` and `$K3/runall.log`, request log `$K3/calls.jsonl`;
- mutants `$K3/mutate3.py` with `$K3/mutants.txt` and `$K3/mutate3.out`; jest logs `$K3/../r3-jest*.log`.

**Defect 1, fixed as ruled: the already-set sentence is true in both cases.** The app cannot tell (a) this person's own set landed first and its answer arrived twice (the typed PIN IS the stored one) from (b) a PIN set earlier or on another phone. The end now reads, under the same title "You already have a transaction PIN" and with Done: "Your account has a transaction PIN. If you just set it, it is the one you typed. If you set one before, that earlier PIN still approves payments." It never says the typed PIN was not saved, nor that it was.
- Wording recorded in BRIEF section 12, A10 (Default (agent), owner may override; round 2's wording is replaced) and in G-116's text, which no longer claims the old sentence is true.
- **Proof, jest:** `CreatePinScreen.test.tsx` "a 409 pin_already_set ends on a sentence that is true...": one `409` after one typed pair shows the exact sentence, none of `not saved`, `was not`, `did not save`, no em-dash, no digit of the PIN, `onDone` not called until Done, and `invalidateQueries(['money'])` called. Mutant M13 (the sentence says "The one you typed was not saved.") is killed by it.
- **Proof, seam (`dup_answer`, light and dark, both `ok`):** A9 and A10 with 8642, the pass-through lets the Hub set it (201) and drops that answer, the browser re-sends, the Hub answers 409. Hub saw `[201 (answer dropped), 409]`; the screen carries the new sentence and not "not saved"; the stored hash verifies 8642. Shots `$K3/shots/dup-answer-{light,dark}.png`. `already_set` (a PIN set through the API while A9 shows, then 2749 twice): the same sentence, hash still 1111, Done to `/`.

**Finding 2, fixed as ruled: A8 and A9 never offer or open on a stale wallet.**
- **A8** (`WalletOpenScreen.tsx`): it stays mounted under A9, so it now notes when it loses focus (`useIsFocused`) and, on coming back, reads the wallet again. While that read is in flight (and on any in-flight read while it is in front) it shows its loading view, never the cached "Create your transaction PIN". A read that fails shows A8's error view with Try again, never the cached offer. A read that says a PIN is set shows Done, as in round 1. First arrival still reads once, and being in front again with no trip away reads nothing more.
- **A9** (`CreatePinScreen.tsx`): it shares A8's cache entry, so it opened with live keys on A8's cached wallet while its own read ran. Now only a settled read counts: while A9's read is in flight it shows "Loading" with the keys off, if the read fails it shows the "We couldn't open this step" view with Try again (keys off), and only a read that answers moves on (set: the flow ends; not open: A8; not set: the keys come on).
- **Proof, jest:** `WalletOpenScreen.test.tsx` 3 new (return with a gated read: loading view, offer absent, then Done after "set", `onCreatePin` not called; return with "not set" offers Create again, and a failed return read offers nothing stale and says why; no read without a trip away). `CreatePinScreen.test.tsx` 2 new (a cached wallet with a held read: loading, keys `aria-disabled`, 2749 typed twice sends 0 POSTs, then "set" ends with 0 POSTs; a failed read behind a cached wallet keeps the keys off and Try again brings them on). Mutants X3 to X6 and X8 (below) killed.
- **Proof, seam (light and dark, all `ok`):**
  - `unchecked_back`: the set landed, its answer and the re-read were lost; Back goes to A8, which shows Done (not the offer), `GET /money/pin` `isSet` true.
  - `unchecked_back_fast` (the Hub answers 6 s late): A8's loading view shows (`$K3/shots/a8-return-loading-{light,dark}.png`), the offer is never in the page text, then Done; hash 8642.
  - `unchecked_back_notset` (the Hub down for the set and the read, nothing set): Back with a 5 s Hub shows A8's loading view, then A8 offers Create; Create opens A9 on a slow Hub with `open-wallet-pin-loading` and every key `aria-disabled`, a forced tap leaves "0 of 4 digits entered"; the keys come on only when the read answers, 2468 twice sets it (hash 2468, 1357 never stored). Shot `a9-loading-on-return-*.png`.

**Finding 3, fixed: Back during "Checking your PIN" looks and acts disabled.** `IconButton` already has a `disabled` prop (glyph in the disabled text colour, `accessibilityState={{ disabled: true }}`, the Pressable disabled), and the screen passed it for "Setting your PIN" only. It now passes it for both (`waiting`). No shared change, no SHARED-CHANGES row. Proof, jest: `accessibilityState.disabled` true, the glyph drawn in `textDisabled`, a press moves nothing, and it is enabled again once the check has answered and in plain entry (mutant X1 killed). Proof, seam (`checking_back`, light and dark): the button is `disabled` with `aria-disabled="true"`, its glyph stroke `#B4B3BB` (the disabled grey) and a forced click leaves the path unchanged until the check answers.

**Finding 4, fixed: the two-line line keeps its icon beside its text.** The wrong-PIN line (W11, and this screen's mismatch) is a row of the icon and its text; the text was `flexShrink: 1` and centred, so once the sentence wrapped to two lines the text box filled the row and the icon sat at the far left gutter. The text is no longer centred inside that box: a one-line sentence still sits centred as a whole (the row centres it, as W11 does), a wrapped one starts beside its icon. Proof, jest: the row is the same row (`row`, `center`, `center`) and its text has `flexShrink: 1` and is not `center`-aligned (mutant X7 killed). Proof, seam: `a10-unknown-light.png` and `-dark.png` (390 px at 2x), the icon at the left of "We couldn't check whether your PIN was set. No connection..." on both lines.

**Finding 5, fixed: the second entry leaves React state when the request has answered.** `submit` now clears `digits` the moment the set has answered (landed or refused), in every end state, before it acts on the answer; `startAgain` still clears it too. The dots read from the phase, not from `digits`, so nothing on screen changes. Proof, jest: with `useState` watched for the calls that come from `CreatePinScreen.tsx`, the latest render holds no 4-digit string in the unknown, already-set and done states, and a control test shows `2749` held while "Setting your PIN" is out (mutant X2 killed, 2 tests fail).

**Tests that kill M4 and M6 (the verifier's survivors), and four more that had survived everything.**
- M4 (a session end leaves `inFlight` set): "a session end while A's set is out frees the screen for B": B's own two entries are sent (`{6060, 6060}` is the 2nd POST) and A's late 201 then moves nothing.
- M6 (a read from an earlier visit acts on "set"): "a wallet read of an earlier visit that says set acts on nothing": a sign-in as B while A's read is out, then A's read answers "set": no `onDone`, no money invalidation, still A9.
- Also killed now: M3 (the `['money']` invalidation on the already-set end, in the 409 test), M5 (A's sentence shown to B after a session end), M7 (a failed read of an earlier visit draws its Try again), M8 (leave on a sign-out: it must not, the route sends the visitor away).

**Mutants (jest suites CreatePinScreen, pin and WalletOpenScreen, `$K3/mutants.txt`):** M1 to M15, V4, V6 and V10 all KILLED (M1 to M15: 15 of 15; V4, V6, V10: 3 of 3), and 8 new round 3 mutants X1 to X8 killed (X1 Back disabled only while setting, X2 second entry kept, X3 A9 trusts the cached wallet, X4 A8 never re-reads, X5 A8 shows the cached offer while reading, X6 a failed return read answered with cached data, X7 centred line text, X8 a failed read behind a cached wallet leaves the keys live). M13's anchor was changed to the new sentence. The first pass left M3, M5, M7 and M8 alive; they were killed by tests added afterwards and re-run (4 of 4).

**V9 against the real seam, light and dark, 40 runs (20 scenarios per theme), all `ok`:** `full`, `dup_answer`, `lost_press`, `unchecked_back`, `unchecked_back_fast`, `unchecked_back_notset`, `checking_back`, `lost_retry`, `already_set`, `lost_reread_fails`, `lost_reread_fails_mismatch`, `server_error`, `lost_reread_ok`, `post401_same`, `post401_switch`, `switch_a9_bopen`, `switch_a10_bopen`, `switch_unchecked`, `late_after_switch_bopen`, `signout_mid`.
- **Setup:** a Hub `dist` from backend main 38bbe4c on :4951 with a fresh `k04r3_test`, migrated and seeded (`npm ci` was needed: the copied `node_modules` lacked `@resvg/resvg-js`); the stand-in WAWU ID on :4952, sign-in through the app's A22; a Fintava stand-in (made-up numbers); this branch's web export on :8151, 0 `wawuafrica.com` in it.
- **Results:** browser storage held only `wawu.session.access` and `.refresh` (no sessionStorage, IndexedDB or cookie) in all 40; 0 blocked requests; 0 requests to `wawuafrica.com` or `fintavapay.com`; the only console error is the 500 that `server_error` causes. Every set ended with one POST per A10 and the stored hash was the first PIN typed.

**A8's re-read was reshaped after the first seam pass (lint refused a state set inside an effect):** "away" is now remembered while rendering and the effect only reads and clears it. The jest suites, the A8 mutants (X4 to X6 re-run on the new code, all killed) and the seam were run again on the final code: 16 runs (`full`, `dup_answer`, `unchecked_back`, `unchecked_back_fast`, `unchecked_back_notset`, `checking_back`, `already_set`, `lost_retry`, light and dark), all `ok`, storage only the two session keys, 0 blocked requests.

**Counts and checks.** `npm run check` exit 0: typecheck and lint clean, 40 suites, 725 tests (open-wallet 177, up from 163), gates 9 run, 183 files, 0 fail, 0 warn, 0 accepted, 206 tasks (`$K3/check-r3.log`). Secret scan: every 8-character window of the Fintava key against the staged diff: 0 hits.

**Clean-up:** the Hub, stand-in WAWU ID, Fintava stand-in and pass-through stopped (PIDs and command lines checked), `k04r3_test` dropped, the backend worktree removed.

**Filed:** nothing new. G-116's text and BRIEF section 12 changed (above). No SHARED-CHANGES row: the shared `IconButton` already has `disabled`.

**NOT RUN:**
- V10 on a device (OPS-10), and with it OkHttp's own re-send of a dropped POST: the seam used Chromium's.
- Capability check 8 on screen (the pay sheet and the Wallet tab returns): waits on SHARED-CHANGES KYC-05 #1 or WALLET-01.
- A real Fintava sandbox opening (G-25, questions 6 and 11): the stand-in answered.
- The platform (hardware) back during "Checking your PIN": the ruling covered the on-screen Back; the native back gesture is the navigator's and is not changed here.

## Verifier report, round 3

Verifier, 4 Oct 2026 (fresh session; wrote none of this code). Mobile `wmt/KYC-04` at f8f7cf1 in a detached worktree (builder's round 3 code on top of my round 2 report edfdccb, mobile main 7d0e538 merged). Mobile main has since moved to 9b4f9ac (docs and task files), so it was trial-merged in a throwaway worktree too. Backend: a detached worktree of backend origin/main 38bbe4c (`npm ci` was needed there, the copied `node_modules` lacked `@resvg/resvg-js`), Hub `dist` built, fresh `vk04r3_test` (89 migrations, seeded); no backend change in this task. Evidence `$V3` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk04r3/`:
- screenshots `$V3/shots/<name>-<theme>.png` (390 px at 2x) and sheets `$V3/sheet-r3-{light,dark}.png`;
- browser driver `$V3/drive.py` (round 2's scenarios, with `already_set`, `dup_answer`, `unchecked_back`, `unchecked_back_fast` and `checking_back` rewritten for round 3, and new `unchecked_back_notset`, `a9_read_fails`, `a8_return_read_fails`), runs `$V3/results.jsonl` (66 runs), pass-through `$V3/web-server.js`, request log `$V3/calls.jsonl` (key names and lengths only);
- jest probes `$V3/probe-pin-r3.test.tsx` with `$V3/probe-r3.full.log` (run in place, then removed from the worktree);
- mutants `$V3/mutate3.py`, results `$V3/mutants.txt`, `$V3/mutate-y.out`, `$V3/mutate-y2.out`, `$V3/mutate-m.out`; privacy scan `$V3/vk04r3_test.dump.sql` and the logs; `npm run check` logs `$V3/check-branch.log`, `$V3/check-trial-merge.log`.

**Verdict: no defect open. Status `review`.** Round 2's defect is fixed: the already-set sentence is true for both `dup_answer` and `already_set`, it never says the typed PIN was not saved, and a jest test pins it. Findings 2 to 5 are fixed as ruled. One new low `unclear` finding (finding 7, a web-only trigger) is recorded below.

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed. `npm run check` exit 0 on the branch: typecheck and lint clean, 40 suites, 725 tests (open-wallet 177), gates 9 run, 183 files scanned, 0 fail, 0 warn, 0 accepted, 206 tasks. Trial merge of origin/main 9b4f9ac into f8f7cf1 (one docs conflict, `docs/PROGRESS.md`, taken from main and regenerated): `npm run check` exit 0, 40 suites, 725 tests, gates 183 files 0/0/0, 207 tasks. My first run on the branch exited 1: one A26 test (`OpenWalletScreen.test.tsx`, "a user sees a loading view first", not touched by this task) exceeded its 20 s timeout while two checks, a web export and browsers ran together (load average about 10); the rerun alone exited 0 | `$V3/check-branch.log`, `$V3/check-trial-merge.log` |
| Diff vs report | passed. Round 3 changed `CreatePinScreen.tsx`, `WalletOpenScreen.tsx`, `pin.ts`, two test files, BRIEF section 12 and G-116, plus the merged main files, as the builder lists. No colour literal and no em-dash in any added string or style; no SHARED-CHANGES row needed (the shared `IconButton` already has `disabled`) | `git diff --stat edfdccb..f8f7cf1` |
| Defect 1 (round 2): the already-set sentence | passed. `dup_answer`, light and dark: A9 and A10 with 8642, the Hub set it (201, answer dropped), the browser re-sent, the Hub answered 409 (`hub_posts` `[201, 409]`); the screen reads "Your account has a transaction PIN. If you just set it, it is the one you typed. If you set one before, that earlier PIN still approves payments." under "You already have a transaction PIN" with Done; neither "not saved" nor "was not" appears; the stored hash verifies 8642. `already_set` (a PIN set through the API while A9 shows, then 2749 twice): the same sentence, hash still 1111, 2749 never stored, Done to `/`. The sentence is true in both: own request landed (the PIN typed is stored) and earlier PIN (still approves payments). BRIEF section 12 and G-116 carry the new wording and G-116 no longer calls the old one true. Jest probe R6 (one 409 after one typed pair): both clauses present, no "not saved", "was not", "did not save", "was saved" or em-dash, no digit of the PIN, `onDone` only after Done, `['money']` invalidated | `dup_answer`, `already_set` rows, `$V3/probe-r3.full.log` |
| Finding 2: A8 re-reads, A9 never opens live on a cached wallet | passed. `unchecked_back` (the set landed, answer and re-read lost; Back to A8): the page text sampled 12 times over 3 s never held "Create your transaction PIN", A8 ends on Done, `GET /money/pin` `isSet` true. `unchecked_back_fast` (Hub 6 s late): A8's loading view shows (`a8-return-loading-*`), the offer is never in the text, then Done, hash 8642. A re-read that fails (`a8_return_read_fails`, Hub down on Back): A8 shows "We couldn't show your account" with Try again, the offer never appears, and Try again with the Hub up shows A8 with Create. `unchecked_back_notset` (nothing set, Hub down for the set and the read, then a 5 s Hub): A8 loads and never offers Create before the answer, then offers it; Create opens A9 with `open-wallet-pin-loading` and every key `aria-disabled`, two forced taps leave "0 of 4 digits entered" (`a9-loading-on-return-*`), the keys come on when the read answers, 1357 twice sets it (1 POST, hash 1357, 2468 never stored). A9's read failing behind A8's cache (`a9_read_fails`): "We couldn't open this step", no keypad drawn, Try again brings the keys on, 1470 sets. Jest probes R2 (cached wallet, held read: loading, keys `aria-disabled`, 2749 typed twice sends 0 POSTs, then "set" ends with 0 POSTs) and R3 (cached wallet, failing read: error view, no keypad, Try again brings the keys on) | rows above, `$V3/shots/` |
| Finding 3: Back while "Checking your PIN" | passed. `checking_back`, light and dark: Back has `disabled` and `aria-disabled="true"`, its glyph stroke is `rgb(180, 179, 187)` (light) and `rgb(74, 73, 82)` (dark), the disabled greys, and a forced click leaves the path unchanged until the check answers. Jest probe R4: `accessibilityState.disabled` true, `onBack` not called by a press, enabled again after the answer | `checking_back` rows, `a10-checking-*` |
| Finding 4: the two-line line | passed. `lost_retry` measured the line in the browser: icon right edge 35 px, text left edge 41 px (gap 6 px), 2 lines, text `text-align: start`; `a10-unchecked-{light,dark}.png` show CircleAlert beside the first line. The one-line mismatch (`a10-mismatch-*`) still sits centred as a whole with its icon beside it | `$V3/sheet-r3-*.png`, `lost_retry` rows |
| Finding 5: the second entry | passed through mutation, not by direct inspection: my own try to read the hook state from the fiber failed (the test renderer exposes no fiber), so the claim rests on the builder's two tests, which kill my mutant Y6 (the `setDigits('')` after the answer removed: 2 tests fail). The dots read from the phase, so nothing on screen changed in any seam run | `$V3/mutants.txt` |
| V5 picture | passed. A9 and A10 base states unchanged from round 2 (same parts, same order and sizes as the renders; only the render's status bar differs). New or changed states in light and dark: unknown state, checking (4 dots filled, spinner, Back dimmed), A8 return loading skeleton, A9 loading on return (4 empty dots, spinner, keys dimmed), already-set end (warning-tone lock, the new sentence, Done). Theme tokens only | `$V3/sheet-r3-{light,dark}.png`, `a9-read-fails-*`, `a8-return-error-*` |
| V6 states | passed, each by its real cause, light and dark: A8 return loading and error, A9 loading on return and error behind a cache, unknown state, checking, already set, Hub 500 (`server_error`), A8 and A9 loading and error on arrival (`a8_states`, `a9_states`) | `$V3/results.jsonl` |
| V7 and V8 | passed. `full` in both themes: A26 to A10, back on `/`, `GET /money/pin` `isSet: true`, stored hash verifies the PIN typed. One POST per A10 in every run; a second PIN never replaced the first (every later POST answered 409, the hash stayed the first PIN in `lost_*`, `unchecked_back*`, `already_set`, `dup_answer`). A 401 on the set with a refresh for the same account was sent once more, once (`post401_same`) | `$V3/results.jsonl`, `$V3/calls.jsonl` |
| V9 seam | passed as a harness. Hub from backend origin/main 38bbe4c on :4953, stand-in WAWU ID on :4954 (`mock-wawu-id/server.js`, people registered there and signed in on the app's A22, no injected token), Fintava stand-in (made-up numbers, started with `env -i`; the Hub had a made-up key), web export of f8f7cf1 on :8153 (`--clear`, 0 `wawuafrica.com` in the bundle, 0 requests to `wawuafrica.com` or `fintavapay.com`). 66 browser runs, 32 scenarios per theme, 64 scenario and theme combinations, **all `ok` on their last run**; 2 early runs failed in my harness, not the app (`checking_back` clicked a button that is now genuinely disabled without `force`; `unchecked_back_notset` waited on a container that A9 now draws while its read is out), fixed and rerun. 80 wallets opened, 43 PINs set, all `$argon2id$v=19$` | `$V3/results.jsonl`, `$V3/runall.log` |
| Regression: round 2's scenarios | passed. Switches mid-A9 (`switch_a9_bopen`), mid-A10 (`switch_a10_bopen`), in the unknown state (`switch_unchecked`), with the set in flight (`late_after_switch_bopen`), with a 401 on the set answered by B's refresh (`post401_switch`: 0 forwarded POSTs), B with a PIN already (`switch_a9_bpin`, `switch_a10_bpin`), none (`switch_a9_bnopin`) and no wallet (`switch_a9_bnowallet`), sign-out (`signout_mid`): in every one the flow is left to `/`, 0 POSTs go from the screen after the switch, 0 rows for B, A's late answer sets A only. Lost answers (`lost_retry`, `lost_press`, `lost_reread_fails`, `_mismatch`, `lost_reread_ok`), mismatch and server error: unchanged. A8 and A9 states (`a8_states`, `a9_states`, `pin_set`, `no_wallet`, `limit`, `long_bank`) unchanged | `$V3/results.jsonl` |
| Probes (jest) | passed. `$V3/probe-pin-r3.test.tsx` on f8f7cf1: P1 to P6 and N1 to N8 (rounds 1 and 2) plus R2 to R6 (round 3), 19 of 19 pass; R1, my fiber inspection, was dropped (above) | `$V3/probe-r3.full.log` |
| Mutations | **Round 2's M1 to M15 and round 1's V4, V6, V10: 18 of 18 killed** by the builder's suite (CreatePinScreen, pin and WalletOpenScreen tests, 52 tests; M3, M4, M5, M6, M7 and M8, which survived round 2, are all killed now). **New, aimed at round 3: 12, 11 killed, 1 survived.** Killed: Y1 A8 never re-reads on return, Y2 A8 shows the cached offer while it re-reads, Y3 A8 answers a failed return read with the cache, Y4 A9 trusts the cached wallet, Y6 the second entry is not cleared, Y7 Back disabled only while setting, Y8 the line text centred again, Y9 the sentence drops "if you set one before", Y10 it drops "if you just set it", Y11 A9's failed-read view only without data, Y12 A8's return read never clears "away". Survived: Y5 (A9 keeps the keys live behind a failed read, `isError` dropped from the settled-read rule): equivalent in the app, because a failed read shows the error view with no keypad (`failed`) whatever `read` says, and my probe R3 agrees. My run was interrupted once by a full disk after Y4; the file was restored from git (sha1 checked) and Y5 to Y12 re-run | `$V3/mutants.txt`, `$V3/mutate-*.out` |
| Privacy | passed. 16 distinct 4-digit PINs typed. 0 hits in a full `vk04r3_test` dump (328 KB) and in the Hub, stand-in WAWU ID, Fintava stand-in and pass-through logs, `calls.jsonl` and `runall.log`; 0 in any navigation URL; 0 pin POSTs with a query string; the 52 POST bodies the browser sent were each exactly `{pin, pinConfirmation}` (positive control: 52 captured); localStorage held only `wawu.session.access` and `.refresh`, no sessionStorage, IndexedDB or cookie in 66 runs; 0 blocked requests; the only console errors are the 500s `server_error` causes. Jest N8: no PIN in `console.log`, `error` or `warn` | `$V3/vk04r3_test.dump.sql`, `$V3/results.jsonl` |
| Secret scan | passed. Every 8-character window of the Fintava key (58 windows) against `git diff origin/main...origin/wmt/KYC-04` (219 KB): 0 hits; 0 PEM blocks | the scan printed counts only |
| V10 | NOT RUN. No device. Unblocked by a tester build with the backend on the droplet (OPS-10) | |

### Findings (not defects)

**Finding 7 (`unclear`, low, web trigger only): a failed background read of the wallet mid-entry replaces A9 or A10 with the error view.** A9's query is `staleTime: 0` and shared with A8; since round 3 a failed read always shows "We couldn't open this step" in place of the keypad, also on A10 with A9's entry held (jest probe R5: `open-wallet-pin-error` drawn, the entry still held, 0 POSTs; Try again reads again). Today the only triggers are `invalidateQueries` after a set and the browser's focus and reconnect refetches; no `focusManager` or `onlineManager` is wired in `src/` for the phone, so on Android nothing triggers a refetch while A9 or A10 is up. If one is wired later, a transient failure would interrupt a person mid-entry; keeping the entry and showing the line instead would avoid it.

**Checked and not a defect:**
- A8 shows its loading view on every return from A9 (a plain Back from A9's first step too), and behind a refetch from any other cause; that is the ruled behaviour.
- Round 2's finding 6 (the residual window where "set" from a re-read cannot tell the person's own PIN from another phone's) stands and cannot be closed from the app.

**NOT RUN:**
- V10 on a device, and with it OkHttp's own re-send of a dropped POST (the seam used Chromium's), the native stack's exit animation under two leaves in a row, `useIsFocused` on a device, and the platform (hardware) back during "Checking your PIN" (the ruling covered the on-screen Back). Unblocked by OPS-10's tester build.
- Capability check 8 on screen (the pay sheet and the Wallet tab returns). Unblocked when SHARED-CHANGES KYC-05 #1 (pay sheet) or WALLET-01 (Wallet tab) merges with a call to `useOpenWalletEntry().open`.
- A real Fintava sandbox opening (G-25, questions 6 and 11): the stand-in answered.
- A direct look at the second entry in React state (finding 5): see its row.

Clean-up: the Hub, stand-in WAWU ID, Fintava stand-in and pass-through stopped (PIDs and command lines checked), `vk04r3_test` dropped, the three worktrees removed.

## Lead merge note (4 Oct 2026)

Merged to main by the lead after three rounds (round 3 verifier: no defect
open). Mobile only; no backend change. Follow-ups, none blocking:
- **Lead ruling on `409 pin_not_set` from a payment** (raised by the round 1
  verifier): a money action that answers `pin_not_set` opens A9 (the
  `open-wallet-pin` route) and returns to where it started once the PIN is
  set. It is built where the pay sheet and the transfer screens are built
  (SHARED-CHANGES KYC-05 #1 for the pay sheet, WALLET-01 for the Wallet tab,
  WALLET-07 and WALLET-09 for sends); each of those tasks must handle it.
- Round 3 finding (low, unclear): a failed background re-read of the wallet
  mid-entry replaces A9 or A10 with the error view (the entry stays held, Try
  again reads again). Only web focus and reconnect refetches trigger it; no
  `focusManager` or `onlineManager` is wired on Android today. Revisit if one
  is added.
- V10 on a device (OPS-10's tester build): OkHttp's own re-send of a dropped
  POST, hardware back during "Checking your PIN", `useIsFocused` on a device.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
