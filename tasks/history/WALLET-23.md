# WALLET-23 · round history

Moved out of [tasks/WALLET-23.md](../WALLET-23.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

**Builder report: WALLET-23 (Sonnet builder session, 16 Oct 2026).** Backend `wmt/WALLET-23` `4b844fa` on main `56f94d0`; mobile `wmt/WALLET-23` (docs only, no app code). No PR.

**How the task was read.** Fintava publishes no limit, but its balance read reports the wallet's tier (`data.tier`, `limits.md`), and the tier's daily limit is Fintava's wallet policy (shared by the owner on 2 Oct 2026). "Limits from Fintava" is therefore: the tier read from Fintava on every balance read, and the daily limit that goes with it from a setting. A17 to A20 (the tier-upgrade screens) are untouched: they wait on the owner's ruling, as the task says.

**Built (wawu-backend).**
- Seam: `ProviderBalance.accountLimits?` (`{ tier, dailyKobo }`), absent when the answer names none. The Fintava adapter fills it from the tier (`src/fintava/fintava-account-limits.ts`); the table is the setting `FINTAVA_TIER_DAILY_LIMITS_KOBO` (empty: Tier 1 5,000,000, Tier 2 50,000,000, Tier 3 500,000,000 kobo, `limits.md`; a bad value stops the app at boot). A tier not in the table, or an answer with no tier, names no limit. Nuvion is unchanged (it names no account limit).
- Storage (additive migration `20261022010000_wallet_account_limits`, SHARED-CHANGES WALLET-23 #1): `FintavaWallet.accountTier`, `dailyLimitKobo`, `limitsReadAt`, all nullable, written by every balance read (`WalletBalanceService`), only on a wallet of the provider the server runs.
- W35: `GET /money/wallet` fills `limits` from that copy (`AccountLimits.view`): the limit, used today, left, `resetsAt` (next Lagos midnight), `tier: null` (BRIEF W35 names no tier; Fintava's own name stays on the row for ops). It never calls Fintava. Null (row hidden) before a balance read has kept a limit, for an unknown tier, and under Nuvion.
- Debits: `MoneyLimits.assertMayMove` also holds a movement to the account's limit, inside the same per-person lock: every kind out of the wallet today in Lagos counts together (transfer, purchase, hold, bill), pending or completed, by amount before fees. Over it: `403 limit_reached`, `limit: daily`, `limitKobo`, `remainingTodayKobo`, and a sentence with the limit and what is left in naira (`accountLimitReached`). WAWU's own per-kind limits (NUV-07) are unchanged and answer first when they are the tighter. The quote's `withinDailyLimit` and `remainingTodayKobo` use the tighter of the two; `quote()` now reads the balance before the standing so the copy is fresh.
- Contract (SHARED-CHANGES WALLET-23 #2): one optional field `limitKobo` on `MoneyErrorReason`, regenerated `contract/openapi.json` (+5 lines, -1). `docs/contract/WALLET.md` section 5, `.env.example`, `docs/fintava/limits.md` and BACKEND_GAPS G-7 say what is built.

**Checks and how each was tested.**
- Capability: a debit over the account's limit is refused with the limit shown. `src/money/limits/tests/account-limits-http.contract.spec.ts` (4 tests, real app module, real database, real Fintava client against the sandbox-body double): a Tier 2 buyer pays N499,000, a N2,000 item is refused 403 `limit_reached` with `limitKobo` 50,000,000, `remainingTodayKobo` 100,000 and the sentence "This would pass your daily limit of N500,000.00. You can still move N1,000.00 today." (naira sign in the code), no send reached Fintava, the balance and payment rows unchanged; exactly the N1,000 left then goes through; then "Try again tomorrow."
- W35 row: same spec, `GET /money/wallet` is `limits: null`, then after one balance read it is the limit with `tier: null` and no tier name anywhere in the body; an unknown tier and no tier leave it null.
- `src/money/limits/tests/account-limits.contract.spec.ts` (19 tests, database): keeping the read (and not on another provider's row), what counts toward the day (each category, status, direction and the Lagos midnight edges), the next-midnight maths across month and year ends, the refusal figures and sentences, exactly-the-limit passes, three at once with the person lock (one passes), beside WAWU's own limits, the quote's tighter-of-two standing. `src/fintava/tests/fintava-account-limits.spec.ts` (20 tests): the setting's reading and every bad form, the adapter's balance.
- Existing suites touched by the change (seam, limits, balance, payments, holds, opening, gate, fees, history): 25 suites, 560 tests green locally before the last edits; the whole suite is green in CI (below).
- Backend CI on `4b844fa` (run 38897806764; the first push `7f202f1`, run 38895826680, was green the same way): suite shards 1, 2, 3 passed (4,025, 2,694 and 2,264 tests, 4 skipped), contract, protected routes, netns, baseline and deploy-in-sync passed. Executable gates failed with the same 16 FAIL lines as main (compared line by line with the first push), none in a file this task touched. `4b844fa` only makes the tier setting unread under nuvion (a spec for it).
- Mobile full check, once at the end (no app code changed): typecheck and lint passed; jest under a load average of 20 to 36 ran 152 suites and 2,724 tests with 3 timeouts and one worker SIGKILL (memory); the 8 suites involved (HomeScreen, TgifReader, CommunitiesView, LegalChatScreen, hostScreens, components, billsScreens, auth-signup) rerun alone passed, 394 tests; gates 10 run, 569 files, 0 fail, 5 warn (none new); baseline 0 entries; tasks 283 ok.
- Mobile: no app code changed. The W35 row (WALLET-06) already draws the contract's `limits` as sent and hides it on null (`WalletSettingsScreen.test.tsx`, `walletSettingsModel.test.ts`); it reads exactly the shape the server now sends.

**Gaps and requests filed.** SHARED-CHANGES WALLET-23 #1 (schema and migration) and #2 (contract). After the backend merges the owner runs `npm run api -- --backend ../wawu-backend`; nothing in the app reads `limitKobo` yet.

**Not done, and why.**
- No picture of W35 at 390 px: the stack's Fintava points at a closed port, so a wallet with a kept limit cannot be reached through the app without seeding rows; the row itself is unchanged WALLET-06 code and no app code moved. The verifier can seed `FintavaWallet.dailyLimitKobo` in a stack database and draw W35.
- Fintava's own refusal for a limit has never been seen (`limits.md`), so it is not mapped; WAWU's early refusal is what a person sees. Transfers (WALLET-07, WALLET-09) are not served yet; they will call `assertMayMove` and inherit the check, and they decide whether to keep `daily_limit_exceeded` on their routes.
- Whether a wallet to wallet purchase counts toward Fintava's own tier limit is still question 16; WAWU counts it (lead ruling, MONEY-04).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

