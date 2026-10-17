# WALLET-37 · round history

Moved out of [tasks/WALLET-37.md](../WALLET-37.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, 17 Oct 2026. Backend `wmt/WALLET-37` `2f42476` on `a5e48fc` (batch 5 live), mobile `wmt/WALLET-37` on `7de785d`. No migration, no schema change.
- **Files (backend):** new `src/money/saved-accounts/name-check-budget.ts` (the per-person hourly count) and `src/money/transfers/payout-own-name.guard.ts` (the withdrawal check); changed `payout-account.service.ts` (refuses a name that is not the verified name), `money-banks.controller.ts`, `money-saved-accounts.controller.ts`, `money-transfers.controller.ts` (guard added after `BankSendTargetGuard`), `bank-send-target.ts` (two `export`s), `money.module.ts`, the error code enum, status map and `MoneyErrorReason.verifiedName`, `docs/contract/CONVENTIONS.md`, `WALLET.md`, `.env.example`, `contract/openapi.json` (regenerated).
- **Files (mobile):** `src/features/wallet/PayoutAccountScreen.tsx`, `api/payoutAccount.ts` (`isRefusedAccount`), `__tests__/payoutAccountScreen.test.tsx`; BACKEND_GAPS (G-58, G-764, G-765), SHARED-CHANGES (WALLET-37 #1 to #3), LOG, this file.
- **Check 1 (own name saved, another name refused, nothing stored):** `bank-transfer.contract.spec.ts` and `saved-accounts.contract.spec.ts` over HTTP with the Fintava double: 409 `account_not_in_your_name`, the bank's name, bank name and the wallet's name in `reason`, the earlier account still the only row.
- **Check 2 (withdrawal to a payout account no longer in the verified name, before the PIN, key back):** a wrong PIN leaves `triesLeft` unchanged, nothing sent or taken, then the same Idempotency-Key sends once the bank names the person again; the same account also saved as a beneficiary is still refused. A holder that differs from the one kept is still `account_name_changed` first (G-762).
- **Check 3 (31st name check 429, second person on the same address not blocked):** exactly 30 allowed and the 31st is `429 name_check_rate_limited` with `Retry-After` and "Try again in N minutes"; no 31st call reaches the bank; a second person's check answers 200. The measure (20 parallel by one person, provider answering in 3 s, three rounds): exactly 30 of 60 allowed, another person's request under 1 s (`name-check-concurrency.contract.spec.ts`).
- **Check 4 (a send to someone else's account still works and confirms the name):** unchanged tests pass, plus a new one (name token still required, the friend's name shown is the name sent to).
- **Tests:** 13 new backend tests (5 in `bank-transfer.contract.spec.ts`, 1 in `saved-accounts.contract.spec.ts`, the concurrency spec, 6 unit tests in `name-check-budget.spec.ts`) and 2 new mobile tests plus one new assertion block. ONE existing test was rewritten because R-51 reverses what it asserted: `saved-accounts.contract.spec.ts` "flags an account whose name is not the BVN name, and saves it" now asserts the refusal. No gate or baseline touched.
- **Gate counts:** backend gates on the branch show the same 5 FAIL lines as main (admin-notifications x2, notification-event, flutterwave-wallet.gateway, content-piece.service). Mobile: see the check log in Current state.
- **Gaps and shared changes filed:** SHARED-CHANGES WALLET-37 #1 (contract), #2 (`NAME_CHECK_PER_HOUR` stands in for the `name_check_per_hour` setting until TIER-06), #3 (mobile contract re-sync at the merge). G-764 and G-765 updated.
- **Not done / decisions for the lead:** (1) `matchesBvnName: null` (no BVN name kept: every wallet opened under Nuvion, an old check, no `IDENTITY_HASH_KEY`) still saves and withdraws, because a refusal needs a name known to differ; Nuvion needs a name source before R-51 holds after the move (R-42). (2) The "verified name" shown beside the bank's is the wallet's account name (the BVN name is kept only as hashes, section 8); it is left out when the wallet holds none. (3) The count is in memory, one process, like the other per-person limits. (4) No pictures: the one app change is a refusal sentence on A21's account number field, covered by tests; no artboard draws it.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

