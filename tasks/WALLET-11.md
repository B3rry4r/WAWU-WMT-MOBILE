---
id: WALLET-11
title: Payout bank account
owner: YOU
area: WALLET
order: 120
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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
- **Check A21, a user can choose bank, enter account number, see resolved name and BVN match, save: passed against the contract, partly NOT RUN on today's Hub (G-57).** Unit-tested end to end (pick ACCESS BANK from the sheet, type `0987 654 321` (kept as ten digits), name shown, Save, `LENNOX EMMANUEL · matches your BVN` from the PUT's answer). On the built Hub (V9 below): edit the number, save, see the server's name and match, read back on reload: passed. Choose a bank and see the name before saving: NOT RUN on the Hub, because `GET /money/banks` and `POST /money/banks/name-check` answer 404 (WALLET-09 serves them; unblocked when WALLET-09 merges). Shown with those two routes answered by Playwright (`standin-*.png`, labelled stand-in, not V9 evidence).
- **Check V5 (pictures):** screenshots taken, light and dark, beside the render (`w11/shots/design-A21-*.png`); the verifier compares. Differences on purpose: the muted line "Creators only. The account must be in your own name." is left out (not a fact, G-58); bank and account names show as Fintava returns them (capitals); the account number has no .04em tracking (TextField has no `mono`, SHARED-CHANGES WALLET-11 #1); Save is shut while the form holds exactly the saved account (Default (agent), owner may override), so the drawn moment (purple Save under a resolved name) is the pre-save state, `standin-name-checked-*.png`, or `edit-unchecked-*.png` on today's Hub.
- **Check, every value from the API or the user:** passed. Bank name, number, account name and the BVN clause come from `PayoutAccountView`; "matches your BVN" shows only for `matchesBvnName: true`, "not the name on your BVN" for false, the name alone for null (G-46's default); before saving no BVN claim is made (G-58). No figure, fee or naira amount on this screen.
- **Check V6, states by their real cause** (all in `w11/shots/`, `-light` and `-dark`): loading (`loading`, the GET held at the network); empty (`empty`, a wallet and nothing saved: GET answers null); saved and matching (`a21-saved-match`); after a save (`saved-after-put`, `read-back`); flagged (`flagged`, saved to a number the bank names SIMI MICHELLE for Ada Okoro); no BVN to compare (`no-bvn-name`, null); no wallet (`no-wallet`, 409 `wallet_not_open`); wallet opening (`opening`, 409 `wallet_opening`, "Check again"); load error (`error-offline`, the request's connection dropped; Try again then loads); bank list error (`bank-sheet-error`, the real 404); name not checkable (`edit-unchecked`, the real 404); save refused (`save-refused-422`, the bank has no account for that number: `name_check_failed` on the field, Save shut); bank unreachable on save (`save-unreachable-503`, the Fintava stand-in's name check failing: `provider_unreachable` above Save). Bank list loading, empty and no-match: unit tests only (the Hub cannot serve a list, G-57).
- **V4 (fields):** `MoneyPayoutAccount` written by this screen's PUT, read by its GET (reload shows it); `matchesBvnName` worked out by the Hub from KYC-01's BVN check. Other readers (W8's "My payout account", W17's "To") are WALLET-09's and WALLET-05's screens, not built.
- **V9 (real seam): passed for load, save and read back.** Built Hub `a055b4f` on :4971 against fresh migrated and seeded `w11_test`, stand-in WAWU ID (`mock-wawu-id/server.js`, unchanged) behind :4972, web export on :8171, Chromium 390 px. Every person signed in through the app's own sign-in screen (A22, `POST /auth/login`, no injected token). People were made through the real routes (register, `POST /money/identity/bvn` with the Fintava stand-in's BVN record, `PUT /money/payout-account`); only the `FintavaWallet` rows and one in-flight `FintavaWalletOpening` were written to `w11_test` by hand (opening a wallet needs Fintava's account creation). Calls per run in `w11/v9-drive.txt`, people in `w11/v9-setup.txt`. Fintava was a local stand-in only (documented sandbox shapes): 0 sandbox calls, 0 live calls, no id/api.wawuafrica.com. Harness note: the stand-in answers `/auth/login` with the token pair at the top level, while WAWU ID and the app use `{ statusCode, message, data }`; a 30-line front on :4972 (`w11/harness/wawuid.js`) wraps only those answers and passes everything else through.
- **Tests:** 21 in 2 suites (form rules, the calls, and the screen through its states with a fetch stand-in). Mutations (7, by hand): Save open for a refused account, BVN match claimed before saving, unchanged account savable, flag shown for null, PUT carrying a name, a framework message shown to the user, more than ten digits kept: all 7 killed.
- **Gates:** before (main `68c68ba`): `npm run check` exit 1 only because `docs/PROGRESS.md` was out of date on main (typecheck, lint, 21 suites / 377 tests, gates 0 fail / 0 warn on 98 files, 203 tasks). After (this branch, main unmoved): `npm run check` exit 0: typecheck, lint, 23 suites / 398 tests, gates 9 run / 107 files / 0 fail / 0 warn, 203 tasks (`w11/check-before.txt`, `w11/check-after.txt`).
- **Filed:** G-57 (bank list and name check unserved, WALLET-09), G-58 (the BVN match before saving, and the "Creators only" line, owner and WALLET-09). SHARED-CHANGES WALLET-11 #1 (TextField: tap-to-choose, `ok` hint tone, `mono`; `BankField` and `NameLineView` go then), #2 (`_layout.tsx`: list `payout-account` under the signed-in guard).
- **Defaults (agent), owner may override:** the "Creators only" line left out (G-58); after a save the route goes back when it can, but stays when the name is not the BVN name so the flag is seen; Save shut while nothing changed; Save open when the name check could not run (the PUT checks with the bank anyway), shut when the bank refused the account; names shown in the bank's capitals; with no wallet the screen says "Open your wallet first" with no button (Open your wallet, A26, is not built yet: KYC-05 adds the way in when it exists, as section 7 says).
- **Copy not drawn (canvas tone, no em-dashes, for the owner to read):** "Choose your bank", "Search", "Bank name", "The bank list did not load", "No banks to show", "The bank list came back empty. Try again in a moment.", "No bank by that name", "Check the spelling, or try part of the name.", "Checking the account with the bank", "We could not check the name now. Saving checks it with the bank.", "· not the name on your BVN", "Open your wallet first", "Your payout account is kept with your Naira wallet. Once your wallet is open, you can add it here.", "Your wallet is still opening", "You can add your payout account as soon as it is open.", "Check again", "Your payout account did not load", "Something went wrong. Try again.".
- **Entry points:** none built. The canvas opens A21 from Me · Verification · Identity check (M14) and from A11; neither hub exists yet, so per WORKFLOW section 7 those tasks add the row when they are built. Reached today at `/payout-account`.
- **NOT RUN:** choosing a bank from the list and the name before saving on the real Hub (unblocked when WALLET-09 serves `GET /money/banks` and `POST /money/banks/name-check`); a Fintava sandbox run (not needed: no new Fintava call, WALLET-14's V9 covers the three it makes); V10 phone check (not in this task's passes).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
