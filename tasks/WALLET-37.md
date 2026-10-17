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

As of 17 Oct 2026, round 5 built by a Sonnet builder; waiting for a fresh verifier (V1 to V4, V6 to V9).
- **Status:** verifying. Backend `wmt/WALLET-37` round 5 on `ff2b81f` (round 4) on `86a3183` on `7a366d0` on `2f42476` on `a5e48fc` (batch 5 live, WALLET-09 included). Mobile `wmt/WALLET-37` on `0680e18` plus the round 5 commit. No migration, no schema change, nothing in `src/common/**`, `app.module.ts` or the guards of other routes. App code changed in rounds 1 and 5 only.
- **Built (backend, round 1):** `PUT /money/payout-account` refuses a bank name that is not the verified name: `409 account_not_in_your_name` with `accountName`, `bankName` (the bank's) and `verifiedName`, nothing stored. A withdrawal (a bank send to the saved payout account, even when it is also a beneficiary) whose holder at the bank is not the verified name is the same 409 from `PayoutOwnNameGuard`, after `BankSendTargetGuard` and before the PIN, key given back. A holder that differs from the one kept stays `account_name_changed` first (G-762). Sends to other accounts (W8) are unchanged.
- **Verified name, three sources in order (round 2):** (1) the BVN name kept by the check; (2) when none is kept (every Nuvion wallet, an old check, no hash key), the wallet's own account name as the provider gave it, compared by the wallet-name rule; (3) neither: the save and the withdrawal are refused with the same code and a plain reason, no `verifiedName`.
- **Wallet-name rule (rounds 3 and 4):** `accountNameIsWalletName` in `src/money/identity/bvn-name.ts`: every word of the SHORTER of the wallet name and the bank name is a word of the longer one (any order; case, spacing, punctuation, accents ignored; repeats once) and at least two words match. Either side may leave a middle name out. A different surname, or one shared word, is refused. Two given names without the surname are accepted as ruled (SWEEP-MONEY). `docs/contract/CONVENTIONS.md` states it.
- **Name checks (round 1, widened in round 5):** one hourly count per signed-in person, never per address: `NameCheckBudget` (`NAME_CHECK_PER_HOUR`, launch value 30, stands in for the `name_check_per_hour` admin setting until TIER-06 lands). It covers `POST /money/banks/name-check`, `PUT /money/payout-account`, `POST /money/beneficiaries` for a bank account, and (round 5) `POST /money/transfers/bank`. The 31st is `429 name_check_rate_limited`, "Try again in N minutes", `Retry-After`, no check made; a 503 gives its place back. Decided in memory in one step: no transaction, connection or lock is held while the bank is asked.
- **Built (backend, round 5, verifier finding 1):** `BankSendTargetGuard` asked the bank for any unsaved account and answered a token that did not fit with `409 account_name_changed` and the live holder name, a way round the limit. Now that enquiry goes through `NameCheckBudget` (`BankSendTargets.resolve` takes an `unsavedEnquiry` wrapper the guard supplies): past the budget it is `429 name_check_rate_limited` with `Retry-After`, before the PIN, key given back, and the bank is NOT asked, so no name comes back. Uncounted: a send to a saved account, and a send whose `nameToken` this person got for this bank code and account number and is under 15 minutes old (`NameCheckTokenService.issuedFor`). That token with a holder the bank has since renamed stays `409 account_name_changed` (the person did check this account). A send with no token at all, another person's token, a token for another account or bank, or an old one is a counted enquiry. `POST /money/transfers/bank` declares the 429 in the contract.
- **Built (app, round 5, finding 3):** A21 opens again by itself when a 429 `name_check_rate_limited` wait has passed (the Hub's `reason.retryAfterSeconds`, kept by `unwrapKeepingWait` in `src/features/wallet/api/payoutAccount.ts`; one minute if it names none): a refused name check is made again for the same number, a refused save is cleared so Save opens. Nothing is edited by the person. No shared file touched.
- **Built (app, round 1):** A21 shows the reason sentence of `account_not_in_your_name` and `name_check_rate_limited` on the account number field, Save shut until the bank or number is changed or the wait ends (`isRefusedAccount`). No other screen changed.
- **Tests changed because later rounds reversed what they asserted** (all this task's own): `saved-accounts.contract.spec.ts`, `bank-transfer.contract.spec.ts`, `nuvion-payouts.contract.spec.ts` name the wallet before saving a payout account (round 2) and use the wallet name `Okoro Chidinma` (round 4); two cases of `bvn-name.spec.ts` assert the round 4 rule. Round 5 only adds tests. No gate or baseline touched.
- **Checked (round 5):** red first: 4 of 5 new backend cases failed (the 40-send reproduction answered 40 x 409 with names, 40 bank enquiries), then green. New: 5 cases in `bank-transfer.contract.spec.ts` (40 parallel sends at the limit: 40 x 429, no enquiry, no name, no PIN try used; below the limit an unfitting token spends one and so does no token; matching token and saved account uncounted at the limit; other person's, other account's, other bank's, missing and malformed tokens counted; a 503 gives the place back and a refused send gives its key back, replayed after the hour with 201) and `name-check-token.spec.ts` (5). Backend tsc and eslint clean; specs touching the bank send and name checks (10 suites, 188 tests) pass on a local stack (`wallet_37`, ports 7480-7487, stopped). The round 1 measure (20 parallel name checks, 3 s provider: exactly 30 an hour, another person's request under 1 s) is `name-check-concurrency.contract.spec.ts`, still passing. App: 3 new cases in `payoutAccountScreen.test.tsx`, red first (2 failed), now 20 of 20. CI and the mobile check: see `tasks/history/WALLET-37.md`, Builder report, round 5.
- **Lead decisions open:** none.
- **Next:** a verifier; at the merge the lead re-syncs `contract/` and `src/api/schema.generated.ts` (SHARED-CHANGES WALLET-37 #3, #4) and moves `NAME_CHECK_PER_HOUR` into the registry when TIER-06 lands (#2).
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
