---
id: WALLET-11
title: Payout bank account
owner: YOU
area: WALLET
order: 120
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [WALLET-14, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A21]
---
# WALLET-11 · Payout bank account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py A21` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A21, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A21 · Payout bank**: 'Where you get paid. Creators only. The account must be in your own name.' Bank Access Bank, Account number, resolved 'Lennox Emmanuel · matches your BVN'. Save payout account.

## Capability checks

- [ ] **A21**: a user can choose bank; enter account number; see resolved name + BVN match; save.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **A21**: partial. Missing: No standalone saved payout account (no model; withdraw takes the account every time); no automated name-vs-BVN match (no BVN name on file); KYC stores bank NAME not bank code.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A21: 'Creators only. The account must be in your own name.'
- A21: 'matches your BVN'

## Designer notes (⚠, unresolved)

- None.

## Builder report

Builder, 3 Oct 2026. Branch `wmt/WALLET-11` from main `68c68ba` (WALLET-14 merged; backend main `a055b4f`, which includes `ad1e515`). Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet11/` (below, `w11/`).
- **Files (new):** `src/app/payout-account.tsx` (route `/payout-account`, signed in only); `src/features/wallet/PayoutAccountScreen.tsx` (A21 and its states), `BankField.tsx`, `BankSheet.tsx` (the bank list, searchable), `NameLineView.tsx` (the line under the number), `payoutForm.ts` (the form's rules), `api/payoutAccount.ts` (the four calls, typed from `schema.generated.ts`, envelope read here as in `src/api/money.ts`); tests `src/features/wallet/__tests__/payoutForm.test.ts`, `payoutAccountScreen.test.tsx`. Reuses AUTH's `AuthFrame` and `AuthField` (same nav, scroll and pinned footer A21 draws) and the shared `BottomSheet`, `ListRow`, `StateViews`, `Skeleton`. Also `BACKEND_GAPS.md` (G-57, G-58), `SHARED-CHANGES.md` (WALLET-11 #1, #2), `docs/LOG.md`.
- **What it calls:** `GET /money/payout-account` on open (null starts an empty form; a saved account fills bank, number and the server's name and match); `GET /money/banks` only while the bank sheet is open; `POST /money/banks/name-check` once the form holds a bank and ten digits that are not the saved account; `PUT /money/payout-account` with `bankCode` and `accountNumber` only (the name is always the bank's). Nothing is retried by itself (the name check is a call to the bank); every failure has Try again or says what to change.
- **Check A21, a user can choose bank, enter account number, see resolved name and BVN match, save: passed against the contract, partly NOT RUN on today's Hub (G-57).** Unit-tested end to end (pick ACCESS BANK from the sheet, type `0987 654 321` (round 1 claimed this kept ten digits; it did not on a real paste, see round 2), name shown, Save, `LENNOX EMMANUEL · matches your BVN` from the PUT's answer). On the built Hub (V9 below): edit the number, save, see the server's name and match, read back on reload: passed. Choose a bank and see the name before saving: NOT RUN on the Hub, because `GET /money/banks` and `POST /money/banks/name-check` answer 404 (WALLET-09 serves them; unblocked when WALLET-09 merges). Shown with those two routes answered by Playwright (`standin-*.png`, labelled stand-in, not V9 evidence).
- **Check V5 (pictures):** screenshots taken, light and dark, beside the render (`w11/shots/design-A21-*.png`); the verifier compares. Differences on purpose: the muted line "Creators only. The account must be in your own name." is left out (not a fact, G-58); bank and account names show as Fintava returns them (capitals); the account number has no .04em tracking (TextField has no `mono`, SHARED-CHANGES WALLET-11 #1); Save is shut while the form holds exactly the saved account (Default (agent), owner may override), so the drawn moment (purple Save under a resolved name) is the pre-save state, `standin-name-checked-*.png`, or `edit-unchecked-*.png` on today's Hub.
- **Check, every value from the API or the user:** passed. Bank name, number, account name and the BVN clause come from `PayoutAccountView`; "matches your BVN" shows only for `matchesBvnName: true`, "not the name on your BVN" for false, the name alone for null (G-46's default); before saving no BVN claim is made (G-58). No figure, fee or naira amount on this screen.
- **Check V6, states by their real cause** (all in `w11/shots/`, `-light` and `-dark`): loading (`loading`, the GET held at the network); empty (`empty`, a wallet and nothing saved: GET answers null); saved and matching (`a21-saved-match`); after a save (`saved-after-put`, `read-back`); flagged (`flagged`, saved to a number the bank names SIMI MICHELLE for Ada Okoro); no BVN to compare (`no-bvn-name`, null); no wallet (`no-wallet`, 409 `wallet_not_open`); wallet opening (`opening`, 409 `wallet_opening`, "Check again"); load error (`error-offline`, the request's connection dropped; Try again then loads); bank list error (`bank-sheet-error`, the real 404); name not checkable (`edit-unchecked`, the real 404); save refused (`save-refused-422`, the bank has no account for that number: `name_check_failed` on the field, Save shut); bank unreachable on save (`save-unreachable-503`, the Fintava stand-in's name check failing: `provider_unreachable` above Save). Bank list loading, empty and no-match: unit tests only (the Hub cannot serve a list, G-57).
- **V4 (fields):** `MoneyPayoutAccount` written by this screen's PUT, read by its GET (reload shows it); `matchesBvnName` worked out by the Hub from KYC-01's BVN check. Other readers (W8's "My payout account", W17's "To") are WALLET-09's and WALLET-05's screens, not built.
- **V9 (real seam): passed for load, save and read back.** Built Hub `a055b4f` on :4971 against fresh migrated and seeded `w11_test`, stand-in WAWU ID (`mock-wawu-id/server.js`, unchanged) behind :4972, web export on :8171, Chromium 390 px. Every person signed in through the app's own sign-in screen (A22, `POST /auth/login`, no injected token). People were made through the real routes (register, `POST /money/identity/bvn` with the Fintava stand-in's BVN record, `PUT /money/payout-account`); only the `FintavaWallet` rows and one in-flight `FintavaWalletOpening` were written to `w11_test` by hand (opening a wallet needs Fintava's account creation). Calls per run in `w11/v9-drive.txt`, people in `w11/v9-setup.txt`. Fintava was a local stand-in only (documented sandbox shapes): 0 sandbox calls, 0 live calls, no id/api.wawuafrica.com. Harness note: the stand-in answers `/auth/login` with the token pair at the top level, while WAWU ID and the app use `{ data: <token pair> }` (corrected in round 2: the verifier read wawu-id `auth.controller.ts`; the answer is `{ data }` only, not `{ statusCode, message, data }`); a 30-line front on :4972 (`w11/harness/wawuid.js`) wraps only those answers and passes everything else through. Its extra `statusCode` and `message` keys were ignored by the app, which reads `data` alone.
- **Tests:** 21 in 2 suites (form rules, the calls, and the screen through its states with a fetch stand-in). Mutations (7, by hand): Save open for a refused account, BVN match claimed before saving, unchanged account savable, flag shown for null, PUT carrying a name, a framework message shown to the user, more than ten digits kept: all 7 killed.
- **Gates:** before (main `68c68ba`): `npm run check` exit 1 only because `docs/PROGRESS.md` was out of date on main (typecheck, lint, 21 suites / 377 tests, gates 0 fail / 0 warn on 98 files, 203 tasks). After (this branch, main unmoved): `npm run check` exit 0: typecheck, lint, 23 suites / 398 tests, gates 9 run / 107 files / 0 fail / 0 warn, 203 tasks (`w11/check-before.txt`, `w11/check-after.txt`).
- **Filed:** G-57 (bank list and name check unserved, WALLET-09), G-58 (the BVN match before saving, and the "Creators only" line, owner and WALLET-09). SHARED-CHANGES WALLET-11 #1 (TextField: tap-to-choose, `ok` hint tone, `mono`; `BankField` and `NameLineView` go then), #2 (`_layout.tsx`: list `payout-account` under the signed-in guard).
- **Defaults (agent), owner may override:** the "Creators only" line left out (G-58); after a save the route goes back when it can, but stays when the name is not the BVN name so the flag is seen; Save shut while nothing changed; Save open when the name check could not run (the PUT checks with the bank anyway), shut when the bank refused the account; names shown in the bank's capitals; with no wallet the screen says "Open your wallet first" with no button (Open your wallet, A26, is not built yet: KYC-05 adds the way in when it exists, as section 7 says).
- **Copy not drawn (canvas tone, no em-dashes, for the owner to read):** "Choose your bank", "Search", "Bank name", "The bank list did not load", "No banks to show", "The bank list came back empty. Try again in a moment.", "No bank by that name", "Check the spelling, or try part of the name.", "Checking the account with the bank", "We could not check the name now. Saving checks it with the bank.", "· not the name on your BVN", "Open your wallet first", "Your payout account is kept with your Naira wallet. Once your wallet is open, you can add it here.", "Your wallet is still opening", "You can add your payout account as soon as it is open.", "Check again", "Your payout account did not load", "Something went wrong. Try again.".
- **Entry points:** none built. The canvas opens A21 from Me · Verification · Identity check (M14) and from A11; neither hub exists yet, so per WORKFLOW section 7 those tasks add the row when they are built. Reached today at `/payout-account`.
- **NOT RUN:** choosing a bank from the list and the name before saving on the real Hub (unblocked when WALLET-09 serves `GET /money/banks` and `POST /money/banks/name-check`); a Fintava sandbox run (not needed: no new Fintava call, WALLET-14's V9 covers the three it makes); V10 phone check (not in this task's passes).

### Builder round 2 (3 Oct 2026)

Branch `wmt/WALLET-11` on the verifier's `835ac2c`, with mobile main `0b83be8` merged in `0c0f5e1` (conflict only in the generated `docs/PROGRESS.md`, regenerated). Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet11/r2/` (below, `r2/`).
- **Defect 1, a pasted account number with spaces was cut to 8 digits: fixed.** `PayoutAccountScreen.tsx` no longer puts `maxLength` on the raw input; `digitsOnly` (`payoutForm.ts`) takes the digits out of whatever was typed or pasted (spaces, hyphens, no-break spaces, anything) and then keeps ten. A21's account number is the only digits field this task owns.
  - Real Ctrl+V in the web export against the built Hub, light and dark (`r2/paste-before.txt`, `r2/paste-after.txt`). Before (the round-1 build): `maxlength` 10; `0987 654 321` and `0987-654-321` became `09876543`, ` 0987654321 ` became `098765432`, with no name line and Save shut. After: no `maxlength`; all four pastes (those three and `09876543210123`) hold `0987654321`, the name line shows and Save opens. Typing 15 digits key by key holds the first ten. A pasted `0123 456 789` saved and read back as `0123456789` after reload (`r2/type-and-save.txt`). Pictures: `r2/shots/paste-spaced-number-before-*.png`, `paste-spaced-number-after-*.png`.
  - Test: `payoutAccountScreen.test.tsx`, "a user can paste an account number with spaces or hyphens". It applies what the platform does with the input's `maxLength` before `onChangeText`, so a raw cap shorter than a spaced number fails it. Mutants: `maxLength={10}` back on the input, and `maxLength={12}`: both killed (1 test fails each).
- **Verifier finding 4, the route had no test: closed.** New `src/features/wallet/__tests__/payoutAccountRoute.test.tsx` (4 tests): signed out goes to `/welcome`, nothing shows while the session is read; after a save in the BVN name or with null it goes back; after a flagged save it stays; with nothing behind it a save stays and Back goes Home. Mutants: "goes back even when flagged" (the verifier's survivor) and "no signed-out redirect": both killed (1 test fails each).
- **Report line corrected:** real WAWU ID answers login and refresh as `{ data: <token pair> }` (above). `mock-wawu-id` is not changed.
- **Screenshots:** every state re-taken on the fixed build, light and dark, at 390 px, against the built Hub (backend main `c197d58`, fresh `w11_test`, same ports and harness): `r2/shots/` (32 state pictures plus the two A21 renders and the four paste pictures), calls in `r2/v9-drive.txt`. The fix changes no picture except the paste result.
- **Runs:** `npm run check` exit 0 (typecheck, lint, 24 suites / 403 tests, gates 9 run / 108 files / 0 fail / 0 warn, 203 tasks), `r2/check-after.txt`. Fintava: local stand-in only; 0 sandbox, 0 live calls.
- NOT RUN is unchanged from round 1.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier, round 1, 3 Oct 2026 (fresh session; wrote none of this task). Mobile `wmt/WALLET-11` at `e8b0027` (worktree from `origin/wmt/WALLET-11`), merged for the check with mobile main `9d43d9d` (main moved one commit since `68c68ba`: a PROGRESS regeneration). Hub: backend main `a055b4f`, built. Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw11/` (below, `vw11/`); screenshots in `vw11/shots/`.

**Verdict: 1 defect open, status `building`.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Branch: `npm run check` exit 0 (typecheck, lint, 23 suites / 398 tests, gates 9 run / 107 files scanned / 0 fail / 0 warn, 203 tasks). Branch merged with main `9d43d9d` (scratch commit, not pushed): one conflict, in the generated `docs/PROGRESS.md` only; regenerated, identical to the branch's; `npm run check` exit 0 with the same counts. Scope fence held: 14 files, all `src/features/wallet/**`, `src/app/payout-account.tsx`, its tests and task docs; no `_layout.tsx`, `src/components/**`, `src/api/**` or theme edits; the diff matches the builder's file list. No em-dashes, no hex/rgb, no "Flutterwave"/"WAWU" in copy; "Creators only..." not in code; "matches your BVN" only as the label of the server's `matchesBvnName: true`. One `style={{ maxHeight: height * LIST_SHARE }}` (`BankSheet.tsx:78`, computed from the window, not a literal; the gates allow it and 8 files on main do the same): noted, not a defect | `vw11/check-branch.txt`, `vw11/check-merged.txt` |
| V4 Field trace | passed. Writer: this screen's `PUT /money/payout-account` (body `bankCode`, `accountNumber` only). Storage: `MoneyPayoutAccount` (bank name and account name are the bank's, from Fintava's list and name check). Reader: this screen's `GET` (reload shows it). On screen: Bank field = `PayoutAccountView.bankName` (or `BankView.name` once picked); number = `.accountNumber` (or the user); name line = `.accountName`; clause = `.matchesBvnName` (true "· matches your BVN", false "· not the name on your BVN", null none); before saving `AccountNameView.accountName` alone, no BVN claim (G-58). No naira figure, fee or limit on the screen. The account is the owner's only; nobody else reads it (checked: second person sees `null`) | `vw11/v4-db.txt`, `vw11/v9-drive.txt`, `vw11/v9-drive-2.txt` |
| V5 Picture | passed with recorded differences (below). A21 rendered (`vw11/shots/A21-light.png`, `-dark.png`); my screenshots at 390 px, light and dark. Pairs compared: A21 vs `standin-name-checked-*` (the drawn moment: bank chosen, name back, Save open; the two unserved routes answered by Playwright in the contract's shapes, labelled stand-in, used for V5 only) and A21 vs `saved-match-*` (real Hub). Side by side: `vw11/v5-compare-light.png`, `-dark.png` | `vw11/shots/` |
| V6 States | passed. Each by its real cause on the built Hub, light and dark: loading (GET held at the network), empty (wallet, nothing saved: `200 null`), saved-match, flagged, no-BVN-name (`null`), no wallet (`409 wallet_not_open`), opening (`409 wallet_opening`; Check again stays while opening and shows the form once the wallet row exists, `opening-then-open-light.png`), load error (the Hub process stopped: "No connection..."; Try again after restart loads), bank list error (the real 404), name not checkable (the real 404), save refused (`422 name_check_failed`: on the field, Save shut, row unchanged), unreachable (Fintava stand-in 502 on the name check: `503 provider_unreachable` above Save, Save open, row unchanged). No state shows "Cannot GET", "Not Found", "null", "undefined" or an em-dash (checked in every capture's text) | `vw11/v6-drive-full.txt`, `vw11/shots/*-light.png`, `*-dark.png`, `vw11/opening-check.txt` |
| V7 Flow walk | passed for what exists; entry NOT RUN. Signed out, cold start at `/payout-account`: lands on `/welcome`, no Hub call. Signed in through A22 as: no wallet, wallet opening, wallet without a BVN check, BVN-checked wallet with nothing saved, with a matching and with a flagged account. Resume: reload keeps the session and reads the account back. NOT RUN: reaching A21 from Me · Verification (M14) or A11, because neither hub exists (WORKFLOW section 7); unblocked when those tasks add the row | `vw11/v6-drive-full.txt`, `vw11/v9-drive.txt` |
| V9 Live seam | passed. Built Hub `a055b4f` on :4973, fresh migrated and seeded `vw11_test`, stand-in WAWU ID behind :4974, web export on :8173 (Chromium 1194, 390 px). Every person signed in through A22 (`POST /auth/login`, no injected token). Load, save, reload, edit, save, reload: `1111111110` EMMANUEL LENNOX (true) then `1111111111` LENNOX EMMANUEL (true) then `1111111112` LENNOX O EMMANUEL (true, middle name not needed) then `2222222220` SIMI MICHELLE (false), each read back. PUT bodies captured at the network, all exactly `{"bankCode":"000014","accountNumber":"..."}` (4 of 4). Second person: `200 null` from the Hub with their own token, empty form, no trace of the first. Fintava: local stand-in only (`vw11/fintava-calls.txt`: 3 bank list, 21 name checks, 5 BVN checks, 17 customer look-ups by the opening sweeper); 0 sandbox, 0 live, no id/api.wawuafrica.com | `vw11/v9-setup.txt`, `vw11/v9-drive.txt`, `vw11/v9-drive-2.txt` |

**Behaviour checks.** Save: shut while empty, partial (5 digits), equal to the saved account, checking, or refused (422); open for a complete, changed account when the name came back or could not be asked; stays open after a 503. Back after save: arriving from Home inside the app, a matching save returns to `/`; a flagged save stays on A21 showing the flag, and the back button then returns to `/` (`vw11/v9-drive-2.txt`). Signed-out visit goes to `/welcome`. Logs: the Hub log (1,484 lines) holds no BVN, NIN, full account number or account name; the browser console holds none either; the feature has no `console` calls.

**Mutations (8, mine, one at a time, file restored byte for byte, tree clean after):** Save open for a refused account; flag shown as a match; `wallet_opening` read as no wallet; any error message shown (framework text); route goes back even when flagged; saved account not filling the bank; PUT carrying a bank name; null BVN answer shown as a match. **7 killed, 1 survived:** "route goes back even when flagged" (`src/app/payout-account.tsx` has no test; the behaviour is right live, so this is a test gap, not a defect). `vw11/mutations.txt`.

**WAWU ID shape (the harness front).** Real WAWU ID answers `POST /auth/login` and `/auth/refresh` with `{ data: <token pair> }` (wawu-id `dbcb2f8`, `src/auth/auth.controller.ts` lines 191 and 210; no global interceptor), and the committed contract's `SessionAnswer` requires `data`. The app reads `payload.data.accessToken` (`src/api/identity.ts` `readTokenPair`): the app is right; the stand-in (`wawu-backend` `mock-wawu-id/server.js` line 237, `res.json(tokenPairFor(user))`) is wrong. Not this task's defect. The builder's note that the real answer is `{ statusCode, message, data }` is slightly off: it is `{ data }` only. My front wraps in `{ data }` only.

### Findings

1. **defect: an account number pasted with spaces is cut to 8 digits.** The field keeps `maxLength={ACCOUNT_NUMBER_LENGTH}` (`PayoutAccountScreen.tsx:202`) on the raw input, so the platform truncates what is pasted to 10 characters BEFORE `digitsOnly` strips the spaces. Reproduce: sign in, open `/payout-account`, clear the number, paste `0987 654 321` (how banking apps copy a NUBAN): the field holds `09876543`, no name line, Save shut, and nothing says why. Typed key by key it works (`0987654321`); pasted without spaces it works. Web export, Chromium, Ctrl+V from the clipboard (`vw11/paste-check.txt`, `vw11/shots/paste-spaced-number-light.png`); React Native's `maxLength` also truncates a paste on Android and iOS. The builder's report says `0987 654 321` is "kept as ten digits": the unit test uses `fireEvent.changeText`, which bypasses `maxLength`. A user would notice.
2. **differs-for-recorded-reason** (V5): the muted line "Creators only. The account must be in your own name." is left out (the task lists it as not a fact; G-58). Bank and account names show in the bank's capitals (`ACCESS BANK`, `LENNOX EMMANUEL`): they are Fintava's values, not literals. Before saving the name shows without "· matches your BVN" (G-58). The account number has no .04em tracking (rendered digits 194 px wide at 2x against 183 px built; `TextField` takes no style, SHARED-CHANGES WALLET-11 #1). Save is grey on a saved, unchanged account (builder default, owner may override); the drawn purple Save is the pre-save moment, which matches (`standin-name-checked-*`). "Open your wallet first" has no button (A26 not built; WORKFLOW section 7). Device status bar and home indicator are the render's frame.
3. **differs-for-recorded-reason** (V5, minor): label to box is 1 to 2 pt taller than drawn (Bank: 78 to 82 px at 2x; Account number: 85 to 87); the gaps between fields and to the name line match within 1 pt. Both come from the shared field metrics (`TextField`/`AuthField`, fenced), the same as the verified AUTH screens.
4. **unclear (test gap, not a defect):** the survived mutant above. The route's back-after-save rule has no test.
5. **Noted:** `BankField.tsx` and `NameLineView.tsx` are local because `TextField` on main has no tap-to-choose, `ok` hint tone or `mono` (SHARED-CHANGES WALLET-11 #1). Main has nothing they copy, so this is not a stand-in for something main has.

**NOT RUN:** choosing a bank and seeing the name before saving on the real Hub (`GET /money/banks` and `POST /money/banks/name-check` answer 404; unblocked when WALLET-09 serves them, G-57; pictured with a labelled stand-in only); reaching A21 from M14 or A11 (neither hub built); a Fintava sandbox run (not needed: no new Fintava call; WALLET-14's V9 covers them); V10 (not in this task's passes).

**Clean-up:** Hub, Fintava stand-in, WAWU ID front and web server stopped by their own PIDs (command line and working directory checked first); `vw11_test` dropped; both worktrees removed.

### Verifier report, round 2

Verifier, round 2, 3 Oct 2026 (fresh session; wrote none of this task). Mobile `wmt/WALLET-11` at `dbd990a` (fresh worktree from `origin/wmt/WALLET-11`). Mobile `origin/main` is `0b83be8`, already merged into the branch (`0c0f5e1`), so the merge check is the branch itself. Hub: backend `origin/main` `c197d58` (`a055b4f` plus SCHOOLS-01, which adds only a migration), built. Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw11r2/` (below, `vw11r2/`); screenshots in `vw11r2/shots/`.

**Verdict: no open defect, status `review`.** Round 1's defect is fixed, and so is its test gap.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. `npm run check` exit 0 (typecheck, lint, 24 suites / 403 tests, gates 9 run / 108 files scanned / 0 fail / 0 warn, 203 tasks). `origin/main` `0b83be8` is an ancestor of `dbd990a`, so a merge changes nothing. Round 2 changes three things: it removes `maxLength` from `PayoutAccountScreen.tsx`, adds a test in `payoutAccountScreen.test.tsx`, and adds `payoutAccountRoute.test.tsx`. The scope fence holds. Against main the branch changes 15 files: `src/features/wallet/**`, `src/app/payout-account.tsx`, tests, task docs, BACKEND_GAPS, SHARED-CHANGES and LOG. Nothing in `_layout.tsx`, `src/components/**`, `src/api/**` or the theme. None of these files has an em-dash in user copy, a hex or rgb value, the "Creators only" literal or a `console` call. There is one computed `style={{ maxHeight: height * LIST_SHARE }}` (`BankSheet.tsx:78`), the same as round 1; it is not a defect | `vw11r2/check-branch.txt` |
| V4 Field trace | passed, unchanged from round 1. Bank = `PayoutAccountView.bankName` (`BankView.name` once picked); number = `.accountNumber` or what the user typed or pasted (digits only, ten kept); name line = `.accountName`; clause = `.matchesBvnName`; before saving, `AccountNameView.accountName` alone. `MoneyPayoutAccount` rows after the run: the 422 and 503 people still hold their earlier account, unchanged | `vw11r2/v4-db.txt`, `vw11r2/v9-drive.txt` |
| V5 Picture | passed with the round-1 recorded differences only. A21 rendered (`shots/A21-light.png`, `-dark.png`). I took my own screenshots at 390 px, light and dark. I compared A21 with `standin-name-checked-*` (the drawn moment; the bank list and the name check came from Playwright stand-ins, used for V5 only) and with `saved-match-*` (real Hub). Side by side: `vw11r2/v5-compare-light.png`, `-dark.png`. The differences are the ones round 1 recorded (findings 2 and 3 there): no "Creators only" line (G-58), names in the bank's capitals, no .04em tracking on the number, Save grey on an unchanged saved account, label-to-box 1 to 2 pt taller. The fix changes no picture except the paste result (`shots/paste-spaced-number-*.png`) | `vw11r2/shots/` |
| V6 States | passed. I entered each state through its real cause on the built Hub, light and dark: loading (GET held at the network), empty (`200 null`), saved-match, flagged, no-BVN-name (`null`), no wallet (`409`), opening (`409`; Check again stays while the wallet is still opening and shows the form once it is open), load error (Hub process stopped: "No connection..."; Try again after a restart loads), bank list error (the real 404), name not checkable (the real 404), save refused (`422`: the message shows on the field, Save shut, row unchanged), unreachable (`503`: the message shows above Save, Save stays open, row unchanged). No capture shows "Cannot GET", "Not Found", "undefined", "null" or an em-dash. Montage: `vw11r2/v6-montage-light.png`, `-dark.png` | `vw11r2/v6-drive.txt`, `vw11r2/opening-check.txt`, `vw11r2/shots/` |
| V9 Live seam | passed. Built Hub `c197d58` on :4973 against a fresh migrated and seeded `vw11r2_test`, the stand-in WAWU ID behind my `{ data }` front on :4974, the web export on :8173 (Chromium 1194, 390 px). Every person signed in through A22 (`POST /auth/login`, no injected token). I loaded, saved, reloaded, edited, saved and reloaded again (`1111111111` LENNOX EMMANUEL true, then `1111111112` LENNOX O EMMANUEL true); each value read back. I captured 7 PUT bodies at the network, all exactly `{"bankCode":"000014","accountNumber":"..."}`; one of them followed a pasted `1111-111-112`. A second person gets `200 null` from the Hub with their own token and sees an empty form with nothing of the first person's account. Fintava ran on a local stand-in only (`vw11r2/fintava-calls.txt`: 1 bank list, 19 name checks, 5 BVN checks, 11 customer look-ups): no sandbox calls, no live calls, no id/api.wawuafrica.com | `vw11r2/v9-setup.txt`, `vw11r2/v9-drive.txt`, `vw11r2/v9-drive-2.txt`, `vw11r2/paste-check.txt` |

**Round 1's defect, re-run first: fixed.** I repeated round 1's reproduction with real Ctrl+V from the clipboard in the web export, signed in as a person with a saved account, light and dark (`vw11r2/paste-check.txt`). The input has no `maxlength` attribute. Each paste went over a select-all of the saved number:

| Pasted | Field holds | Name line | Save |
|--------|-------------|-----------|------|
| `0987 654 321` | `0987654321` | the "could not check" line | open |
| `0987-654-321` | `0987654321` | the same | open |
| ` 0987654321 ` | `0987654321` | the same | open |
| `  0987 654 321  ` | `0987654321` | the same | open |
| `09876543210123` | `0987654321` | the same | open |
| `0987<nbsp>654<nbsp>321` | `0987654321` | the same | open |
| `0987.654.321` | `0987654321` | the same | open |
| `Acct: 0987654321` | `0987654321` | the same | open |

The "could not check" line appears because the Hub does not serve the name check yet (G-57). Other inputs, light and dark:
- A paste into an empty field holds `0987654321`.
- Fifteen digits typed key by key hold the first ten.
- `0987 654-321` typed key by key holds `0987654321`.
- Five digits, then a pasted `67890 999` at the end, hold `1234567890`.

Round 1 cut the same pastes to `09876543`. With the bank list and name check answered by stand-ins, a pasted `0987 654 321` sends the name check `{"bankCode":"000014","accountNumber":"0987654321"}`, shows the name and opens Save (`vw11r2/standin-drive.txt`). A pasted `1111-111-112` saved, and after a reload it read back as `1111111112` (PUT body above). I did not run this on a phone; React Native's `maxLength` is no longer on the input, so nothing truncates a paste there either.

**Behaviour checks.**
- Save is shut while the form is empty, partial (5 digits), equal to the saved account, or refused (422). It opens for a complete, changed account when the name could not be asked, and stays open after a 503.
- Going back after a save, arriving from Home inside the app: a matching save returns to `/`. A flagged save stays on A21 with "SIMI MICHELLE · not the name on your BVN", and the back button then returns to `/` (`vw11r2/v9-drive-2.txt`).
- A signed-out visit to `/payout-account` lands on `/welcome` with no Hub call.
- Logs: the Hub log (994 lines) has no BVN, NIN, account number or account name. The browser console has none either.

**Mutations (10, mine, one at a time; each file restored byte for byte; tree clean after): 10 killed.**
- `digitsOnly` caps before stripping (round 1's bug, in the logic): 3 tests fail.
- Only spaces stripped: 2 fail.
- A raw `maxLength={11}` back on the input: 1 fails (the new platform-cut test).
- The last ten digits kept instead of the first: 2 fail.
- The route stays after a null-BVN save: 1 fails.
- A signed-out visit sent to `/sign-in`: 1 fails.
- Back with nothing behind it does nothing: 1 fails.
- The saved account compared by number only: 1 fails.
- A name check before saving claims a BVN match: 5 fail.
- Round 1's survivor, the route going back even when flagged: now killed (`payoutAccountRoute.test.tsx`, "after a save in another name, the user stays on A21").

Evidence: `vw11r2/mutations.txt`.

**WAWU ID shape (the harness front).** I checked this again. Real WAWU ID (wawu-id `dbcb2f8`, `src/auth/auth.controller.ts` lines 191 and 210) answers login and refresh as `{ data: <token pair> }`, and the mobile `contract/identity/openapi.json` `SessionAnswer` requires `data`. The app reads `payload.data` (`src/api/identity.ts` `readTokenPair`), so the app is right. The stand-in (`wawu-backend` `mock-wawu-id/server.js` line 237, `res.json(tokenPairFor(user))`) is wrong; that is not this task's defect. The builder's round-2 correction to `{ data }` is accurate.

### Round 2 findings

1. **Closed:** round 1's defect 1 (a pasted spaced number cut to 8 digits) and finding 4 (the route had no test).
2. **differs-for-recorded-reason:** the same V5 differences as round 1's findings 2 and 3, with the same reasons (G-58; SHARED-CHANGES WALLET-11 #1; builder defaults; shared field metrics).
3. **Noted (harness, not this task):** my first `expo export -p web` without `--clear` reused Metro's cache. The bundle it produced had `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_ID_URL` inlined from an earlier build (`localhost:4971`/`:4972`), even though the variables were set to :4973/:4974. With `--clear` the right addresses were inlined. Every capture above comes from the `--clear` export (`vw11r2/export.txt`). Builds pointed at a new address need `--clear`.

**NOT RUN:**
- Choosing a bank and seeing the name before saving on the real Hub: `GET /money/banks` and `POST /money/banks/name-check` answer 404. Unblocked when WALLET-09 serves them (G-57).
- Reaching A21 from M14 or A11: neither hub is built yet.
- A paste on an Android or iOS device: unblocked by a device build of `dbd990a` (V10 is not in this task's passes).
- A Fintava sandbox run: not needed, because this task adds no Fintava call.

**Clean-up:** I stopped the Hub, the Fintava stand-in, the WAWU ID front and the web server by their own PIDs, after checking each command line and working directory. Ports 4973, 4974 and 8173 are free. `vw11r2_test` is dropped. Both worktrees are removed.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
