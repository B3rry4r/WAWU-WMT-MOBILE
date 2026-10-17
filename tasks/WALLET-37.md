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

As of 17 Oct 2026, round 4 built by a Sonnet builder; waiting for a fresh verifier (V1 to V4, V6 to V9).
- **Status:** verifying. Backend `wmt/WALLET-37` `ff2b81f` on `86a3183` (round 3) on `7a366d0` (round 2) on `2f42476` (round 1) on `a5e48fc` (batch 5 live, WALLET-09 included). Mobile `wmt/WALLET-37` on `f88136f` plus this round's docs commit. No migration, no schema change, nothing in `src/common/**`, `app.module.ts` or the guards of other routes. Rounds 2 to 4 changed no app code.
- **Built (backend, round 1):** `PUT /money/payout-account` refuses a bank name that is not the verified name: `409 account_not_in_your_name` with `accountName`, `bankName` (the bank's) and `verifiedName` (the name on the wallet), nothing stored. A withdrawal (a bank send to the saved payout account, even when the same account is also a beneficiary) whose holder at the bank is not the verified name is the same 409 from `PayoutOwnNameGuard`, after `BankSendTargetGuard` and before the PIN, key given back. A holder that differs from the one kept stays `account_name_changed` first (G-762). Sends to other accounts (W8) are unchanged.
- **Built (backend, round 2, the lead's ruling on the no-BVN-name case):** the verified name has three sources in order: (1) the BVN name kept by the check (`matchesBvnName` true or false); (2) when none is kept (every Nuvion wallet, an old check, no hash key, a check behind another wallet), the wallet's own account name as the provider gave it, compared by the wallet-name rule (below) and refused the same way (`409 account_not_in_your_name` at save, before the PIN with the key back at withdrawal); (3) neither exists: the save and the withdrawal are refused with the same code and a plain reason ("We cannot check the name on your wallet yet, so we cannot tell whether this account is yours..."), no `verifiedName`. `matchesBvnName` on the view is unchanged (null without a BVN name).
- **Built (backend, rounds 3 and 4, the lead's rulings on the wallet-name match):** `accountNameIsWalletName(walletName, bankName)` in `src/money/identity/bvn-name.ts` replaces the round 2 test. Round 4 rule: every word of the SHORTER of the two names (wallet name, bank name) is a word of the longer one (any order; case, spacing, punctuation and accents ignored, as `matchesBvnName` reads names; repeats count once) AND at least two words match. Either side may leave a middle name out: wallet `Okoro Chidinma` with bank `CHIDINMA ADAEZE OKORO` is accepted, and so is the reverse. A different surname, or one shared word alone, is refused. A bank name that only ADDS a word to a wallet name of two words or more (wallet `Ada Sandbox`, bank `ADA SANDBOX VENTURES`) is accepted too, because the wallet name is then the shorter and all its words are in the bank's. `docs/contract/CONVENTIONS.md` states the rule. `matchesBvnName` and the BVN rule are untouched.
- **Built (name checks):** one hourly count per signed-in person, never per address: `NameCheckBudget` (`NAME_CHECK_PER_HOUR`, launch value 30, stands in for the `name_check_per_hour` admin setting until TIER-06 lands). It covers `POST /money/banks/name-check`, `PUT /money/payout-account` and `POST /money/beneficiaries` for a bank account. The 31st is `429 name_check_rate_limited`, "Try again in N minutes", `Retry-After`, no check made. A 503 gives its place back. Decided in memory in one step: no transaction, connection or lock is held while the bank is asked.
- **Built (app):** A21 shows the reason sentence of `account_not_in_your_name` and `name_check_rate_limited` on the account number field, Save shut until the bank or number is changed (`isRefusedAccount`). The round 2 reasons use the same code, so the app shows them unchanged. No other screen changed.
- **Checked (round 4):** table spec `bvn-name.spec.ts` (`accountNameIsWalletName`) red first (3 failing), then green (39 of 39); route case added to `saved-accounts.contract.spec.ts` (wallet `Okoro Chidinma Adaeze`, bank `OKORO CHIDINMA` saved). Backend tsc and eslint clean on the changed files; `contract/openapi.json` unchanged (no route or schema change). Unit spec and 4 contract specs (saved-accounts, bank-transfer, nuvion payouts, name-check concurrency; 142 tests) pass on a local stack (`wallet_37`, ports 7480-7487, stopped). Round 1 measure (20 parallel name checks by one person, 3 s provider: exactly 30 an hour allowed, another person's `GET /users/me` under 1 s) is the concurrency spec, still passing. CI on `ff2b81f`: branch checks run 38997709550 (3 shards, contract, netns, deploy-test-in-sync green), protected routes run 38997709579 green, gates run 38997709545 (baseline green; executable gates show only main's 5 FAIL lines). Mobile full check: typecheck, lint, 184 suites / 3245 tests, gates 0 fail / 5 warn, tasks (after `check_tasks.py --write` regenerated PROGRESS.md) EXIT 0.
- **Tests changed in round 4:** the round 2 wallet name `Okoro Chidinma` is back in `saved-accounts.contract.spec.ts` (the no-BVN-name test) and `bank-transfer.contract.spec.ts` (the withdrawal test), with the messages that quote it; round 3 had widened it only because of the old rule. Two cases of my own round 3 table spec assert the new rule instead: `CHIDINMA ADAEZE OKORO JR` (bank adds a word) and `ADA SANDBOX VENTURES` are now accepted, not refused. No gate or baseline touched.
- **Tests changed because round 2 reverses what they asserted** (a person with no name was saved and withdrawn to): `saved-accounts.contract.spec.ts` ("matchesBvnName is null when...", and the two bank-list tests) and `bank-transfer.contract.spec.ts` (FIX-41 N3 payout case, and the round 1 "no BVN name is not refused" case) now name the wallet before saving a payout account; `nuvion-payouts.contract.spec.ts` ("a payout account has its own pair of payee ids...") names its wallet for each account. No gate or baseline touched.
- **Lead decisions open:** none. One note for the verifier: the round 4 rule as worded accepts a bank name that adds a word to the wallet name (see Built, rounds 3 and 4).
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
