---
id: WALLET-37
title: Withdraw only to your own name, and 30 name checks an hour
owner: YOU
area: WALLET
order: 255
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [WALLET-09, WALLET-14]
decisions: [R-51, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-37 · Withdraw only to your own name, and 30 name checks an hour

## Current state

As of 17 Oct 2026, round 3 built by a Sonnet builder; waiting for a fresh verifier (V1 to V4, V6 to V9).
- **Status:** verifying. Backend `wmt/WALLET-37` `86a3183` on `7a366d0` (round 2) on `2f42476` (round 1) on `a5e48fc` (batch 5 live, WALLET-09 included). Mobile `wmt/WALLET-37` on `566c5d3` plus this round's docs commit. No migration, no schema change, nothing in `src/common/**`, `app.module.ts` or the guards of other routes. Rounds 2 and 3 changed no app code.
- **Built (backend, round 1):** `PUT /money/payout-account` refuses a bank name that is not the verified name: `409 account_not_in_your_name` with `accountName`, `bankName` (the bank's) and `verifiedName` (the name on the wallet), nothing stored. A withdrawal (a bank send to the saved payout account, even when the same account is also a beneficiary) whose holder at the bank is not the verified name is the same 409 from `PayoutOwnNameGuard`, after `BankSendTargetGuard` and before the PIN, key given back. A holder that differs from the one kept stays `account_name_changed` first (G-762). Sends to other accounts (W8) are unchanged.
- **Built (backend, round 2, the lead's ruling on the no-BVN-name case):** the verified name has three sources in order: (1) the BVN name kept by the check (`matchesBvnName` true or false); (2) when none is kept (every Nuvion wallet, an old check, no hash key, a check behind another wallet), the wallet's own account name as the provider gave it, compared by the round 3 rule (below) and refused the same way (`409 account_not_in_your_name` at save, before the PIN with the key back at withdrawal); (3) neither exists: the save and the withdrawal are refused with the same code and a plain reason ("We cannot check the name on your wallet yet, so we cannot tell whether this account is yours..."), no `verifiedName`. `matchesBvnName` on the view is unchanged (null without a BVN name).
- **Built (backend, round 3, the lead's ruling on the wallet-name match):** `accountNameIsWalletName(walletName, bankName)` in `src/money/identity/bvn-name.ts` replaces the round 2 test. The wallet name matches when EVERY word of the bank's name is a word of the wallet name (any order; case, spacing, punctuation and accents ignored, as `matchesBvnName` reads names) AND at least two words match. A middle name left out by the bank: accepted. Swapped order: accepted. A different surname, one word alone, or any word of the bank's name that the wallet name lacks: refused. The reverse of round 2 follows: a bank name with a word the wallet name lacks (wallet `Okoro Chidinma`, bank `CHIDINMA ADAEZE OKORO`) is now refused, as the ruling words it. `docs/contract/CONVENTIONS.md` states the rule. `matchesBvnName` and the BVN rule are untouched.
- **Built (name checks):** one hourly count per signed-in person, never per address: `NameCheckBudget` (`NAME_CHECK_PER_HOUR`, launch value 30, stands in for the `name_check_per_hour` admin setting until TIER-06 lands). It covers `POST /money/banks/name-check`, `PUT /money/payout-account` and `POST /money/beneficiaries` for a bank account. The 31st is `429 name_check_rate_limited`, "Try again in N minutes", `Retry-After`, no check made. A 503 gives its place back. Decided in memory in one step: no transaction, connection or lock is held while the bank is asked.
- **Built (app):** A21 shows the reason sentence of `account_not_in_your_name` and `name_check_rate_limited` on the account number field, Save shut until the bank or number is changed (`isRefusedAccount`). The round 2 reasons use the same code, so the app shows them unchanged. No other screen changed.
- **Checked (round 3):** table spec `bvn-name.spec.ts` (`accountNameIsWalletName`, 17 new cases) red first (17 failing), then green; route-level cases added to `saved-accounts.contract.spec.ts` (middle name left out saved, a different surname refused). Backend tsc and eslint clean on the changed files, `contract:build` leaves `contract/openapi.json` unchanged; 5 contract specs (109 tests: saved-accounts, bank-transfer, name-check budget and concurrency, nuvion payouts) and the unit spec pass on a local stack (`wallet_37`, ports 7480-7487, stopped). CI on the pushed head: see the builder report, round 3 (history).
- **Checked (round 2):** backend tsc clean, eslint clean on the changed files, `contract:build` leaves `contract/openapi.json` unchanged; 6 specs (119 tests: saved-accounts, name-check concurrency and budget, bank-transfer, nuvion payouts, bank-send-target) pass on a local stack, the new specs red first (5 failing) then green. CI on `7a366d0`: branch checks run 38995316107 (3 shards, contract, netns, deploy-test-in-sync green), protected routes run 38995316090 green, gates run 38995316095 (baseline green; executable gates show only main's 5 FAIL lines). Round 1 measure (20 parallel name checks by one person, 3 s provider: 30 of 60 allowed, another person under 1 s) still passes. Mobile full check (typecheck, lint, 184 suites / 3245 tests, gates 0 fail / 5 warn, tasks) EXIT 0.
- **Tests changed because round 3 reverses what they asserted** (a bank name with a word the wallet name lacks was accepted): the wallet name in `saved-accounts.contract.spec.ts` (the no-BVN-name test) and `bank-transfer.contract.spec.ts` (the round 2 withdrawal test) is `Okoro Chidinma Adaeze`; the bank names and every other assertion are unchanged.
- **Tests changed because round 2 reverses what they asserted** (a person with no name was saved and withdrawn to): `saved-accounts.contract.spec.ts` ("matchesBvnName is null when...", and the two bank-list tests) and `bank-transfer.contract.spec.ts` (FIX-41 N3 payout case, and the round 1 "no BVN name is not refused" case) now name the wallet before saving a payout account; `nuvion-payouts.contract.spec.ts` ("a payout account has its own pair of payee ids...") names its wallet for each account. No gate or baseline touched.
- **Lead decisions open:** none. Round 3 took the lead's three rulings: the wallet-name match above; the no-name refusal reuses `account_not_in_your_name`; the per-process count stays a SWEEP-MONEY row.
- **Next:** a verifier; at the merge the lead re-syncs `contract/` and `src/api/schema.generated.ts` (SHARED-CHANGES WALLET-37 #3) and moves `NAME_CHECK_PER_HOUR` into the registry when TIER-06 lands (#2).
- **History:** `tasks/history/WALLET-37.md` (the builder reports).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-51, R-10 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person can set a payout account only in their own verified name, and a withdrawal to any other name is refused before the PIN. Bank name checks are limited to 30 an hour per person (R-51; G-765, G-764). Sends to other people are unchanged.

## Scope

- `PUT /money/payout-account` refuses an account whose holder name does not match the verified name (the rule `matchesBvnName` uses today): `409` with a plain-words reason and the bank's name beside the verified name, nothing saved. A saved payout account that no longer matches (the bank now names it differently) is refused at withdrawal time, before the PIN, with the key given back (WALLET-09 pattern, G-762).
- `POST /money/banks/name-check` allows 30 checks an hour per signed-in person (not per address, G-764). The number is an admin setting (`name_check_per_hour`, launch value 30). Over it: `429` with the minutes left in plain words, no check made.
- The app side is one change in A21 (WALLET-11's `src/features/wallet/PayoutAccountScreen.tsx`): show the refusal reason and let the person fix the account. No other screen changes.

## Capability checks

- [ ] A person saves a payout account in their own name; saving one in another name is refused and nothing is stored.
- [ ] A withdrawal to a payout account the bank now names differently is refused before the PIN and the key is given back.
- [ ] The 31st name check in an hour from one person answers 429 and a second person on the same address is not blocked.
- [ ] A bank send to someone else's account (W8) still works and still confirms the name.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-37.md](history/WALLET-37.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
