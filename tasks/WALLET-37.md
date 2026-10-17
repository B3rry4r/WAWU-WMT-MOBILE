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

As of 17 Oct 2026, built by a Sonnet builder; waiting for a fresh verifier (V1 to V4, V6 to V9).
- **Status:** verifying. Backend `wmt/WALLET-37` `2f42476` on `a5e48fc` (batch 5 live, WALLET-09 included). Mobile `wmt/WALLET-37` on `7de785d` (this file, BACKEND_GAPS G-58/G-764/G-765, SHARED-CHANGES WALLET-37 #1 to #3, LOG, and the A21 change). No migration, no schema change, nothing in `src/common/**`, `app.module.ts` or the guards of other routes.
- **Built (backend):** `PUT /money/payout-account` refuses a bank name that is not the BVN name (`matchesBvnName` false): `409 account_not_in_your_name` with `accountName`, `bankName` (the bank's) and `verifiedName` (the name on the wallet), nothing stored. A withdrawal (a bank send to the saved payout account, even when the same account is also a beneficiary) whose holder at the bank is not the verified name is the same 409 from `PayoutOwnNameGuard`, after `BankSendTargetGuard` and before the PIN, key given back. A holder that differs from the one kept stays `account_name_changed` first (G-762). Sends to other accounts (W8) are unchanged.
- **Built (name checks):** one hourly count per signed-in person, never per address: `NameCheckBudget` (`NAME_CHECK_PER_HOUR`, launch value 30, stands in for the `name_check_per_hour` admin setting until TIER-06 lands). It covers `POST /money/banks/name-check`, `PUT /money/payout-account` and `POST /money/beneficiaries` for a bank account. The 31st is `429 name_check_rate_limited`, "Try again in N minutes", `Retry-After`, no check made. A 503 gives its place back. Decided in memory in one step: no transaction, connection or lock is held while the bank is asked.
- **Built (app):** A21 shows the reason sentence of `account_not_in_your_name` and `name_check_rate_limited` on the account number field, Save shut until the bank or number is changed (`isRefusedAccount`). No other screen changed.
- **Checked:** backend tsc and lint clean; 16 related money specs (277 tests) pass on a local stack; the 20-parallel measure passes (30 of 60 allowed, another person under 1 s). CI on `2f42476` (runs 38993994694 branch checks, 38993994678 protected routes, 38993994657 gates): all three test shards, contract, protected routes, baseline, netns and deploy-test-in-sync green; executable gates show only main's 5 FAIL lines. Mobile full check (typecheck, lint, 184 suites / 3245 tests, gates 0 fail / 5 warn, tasks) EXIT 0.
- **Lead decisions open:** (1) no kept BVN name (`matchesBvnName: null`: every Nuvion wallet, an old check, no hash key) still saves and withdraws; Nuvion needs a name source before R-51 holds after the move. (2) The name shown beside the bank's is the wallet's account name (the BVN name is only hashes). (3) The count is per process, like the other per-person limits.
- **One existing test rewritten:** `saved-accounts.contract.spec.ts` "flags an account whose name is not the BVN name, and saves it" asserted what R-51 reverses; it now asserts the refusal.
- **Next:** a verifier; at the merge the lead re-syncs `contract/` and `src/api/schema.generated.ts` (SHARED-CHANGES WALLET-37 #3) and moves `NAME_CHECK_PER_HOUR` into the registry when TIER-06 lands (#2).
- **History:** `tasks/history/WALLET-37.md` (the builder report).

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
