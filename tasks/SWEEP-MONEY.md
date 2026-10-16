---
id: SWEEP-MONEY
title: Money sweep: the low findings of the money tasks
owner: YOU
area: SWEEP
order: 248
priority: launch
repo: all
type: backend-refactor
status: todo
depends_on: [MONEY-16, NUV-06, WALLET-07, WALLET-04, WALLET-16, TIER-02]
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-MONEY · Money sweep: the low findings of the money tasks

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 67, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** MONEY-16, NUV-06, WALLET-07, WALLET-04, WALLET-16, TIER-02 (not merged yet; its lows are listed now so none is lost), and WALLET-23 and FIX-26 (batch 3, not merged yet), and WALLET-35 and WALLET-09 (batch 4, not merged yet).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Money, wallets, bills and tiers: MONEY, NUV, WALLET, BILLS and TIER tasks. Backend, wawu-id and mobile. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| MONEY-16 | RF-1 | Any HTTP 200 from the mail route counts as mailed; require `emailed === true`. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 181 |
| MONEY-16 | RF-2 | `giveUp` misses a lease whose `leaseUntil` is already past. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 182 |
| MONEY-16 | RF-3 | A body key named `constructor` makes wawu-id answer 500. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 183 |
| MONEY-16 | RF-4 | A bare domain or phone number inside a sentence is not handled. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 184 |
| MONEY-16 | RF-5 | A newline in a logged value can forge a log line. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 185 |
| MONEY-16 | RF-6 | docs/LOG.md says G-680 for what was renumbered G-690. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 186 |
| MONEY-16 | RF-7 | Test gaps M10, M13, M18, M32 and W16 (surviving mutants). | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 187 |
| NUV-06 | F1 | The WALLET-09 lead note names the private `prepare`; callable are `forBeneficiary` and `forPayoutAccount`. The seam's `reconcileSend` needs a SHARED-CHANGES NUV-06 #2 row. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 293 |
| NUV-06 | F2 | `nuvion-adapter.spec.ts` was edited (three methods added to its filled-by-a-task list) and no SHARED-CHANGES row says so. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 294 |
| NUV-06 | F3 | A ledger row of another provider on the same reference waits forever here; NUV-05 stops for review. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 295 |
| NUV-06 | F4 | The changed NUV-05 test can no longer tell `done` from `failed` for a bank-transfer stranger (mutant T04 survives). | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 296 |
| NUV-05 | N1 | Seven of 37 mutants survive the builder's specs (all killed by the verifier's probes). | `tasks/NUV-05.md`, Verifier report, line 162 |
| NUV-05 | N2 | `reconcileSend` starts its walk at `since` minus ten minutes, not at the row's `sentAt` (latent, no caller reaches it). | `tasks/NUV-05.md`, Verifier report, line 163 |
| NUV-05 | N3 | A `refunded` event whose `payment_type` is not `book-transfer` is answered `done` before `meta.source_payment_id` is read (needs the sandbox). | `tasks/NUV-05.md`, Verifier report, line 164 |
| NUV-03 | N1 | Low. The boot refusal for `IDENTITY_HOLD_DAYS` above 30 applies under every `WALLET_PROVIDER`: with `IDENTITY_HOLD_DAYS=40` on fintava the branch refuses to boot where main boots. Accept, or gate the check on the Nuvion provider. | `tasks/NUV-03.md`, Verifier report, round 4, line 419 |
| NUV-03 | N2 | Low, test gap: mutant C1 survives. Removing `bvnVerifiedAt: startedAt` from the `failed` branch of `ReviewedOpening.claim()` passes every spec of the area. | `tasks/NUV-03.md`, Verifier report, round 4, line 420 |
| WALLET-06 | T4 | Test gap: the `pin_changed_again` branch of W36 and W37 re-reads the wallet, and nothing asserts it. | `tasks/WALLET-06.md`, Verifier report, round 3, line 410 |
| WALLET-06 | T5 | Test gap: the old-row mutant VB08 is killed by one test only. | `tasks/WALLET-06.md`, Verifier report, round 3, line 412 |
| WALLET-07 | D1 | Spec gap: `completeFromRecord`'s fresh re-read for a send no longer `pending` is pinned by no spec (mutant M02). | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 98 |
| WALLET-07 | D2 | Spec gap: the sweep's backoff and the 72 hour lower bound are pinned by no spec (M20, M21). | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 99 |
| WALLET-07 | D3 | Wording: a request that never left answers 503 `provider_unreachable` with "We are still confirming this payment". | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 100 |
| WALLET-07 | D4 | Ungraded (the next sweep grades it): `PushStoppedAccount` is never cleared after a cancelled deletion. The send to a closed account (G-712) leans on it; a person who cancels a deletion stays stopped for push and counts as closed. | `tasks/history/WALLET-07.md`, Verifier report, line 48 |
| WALLET-09 | F8 | Inherited from WALLET-07's ledger code, not WALLET-09: a SUCCESS webhook after the send was marked `failed` leaves the transfer and the ledger `failed` with a ledger discrepancy and no review flag (a late success after a failure is not put in front of a person); a reversal after it still ends `reversed` once. FIX-41 (16 Oct 2026) closes the silence: a SUCCESS seen on a failed bank send (webhook, or the sweep's one read by our reference within 48 hours) sets the review flag and the discrepancy and logs once; the transfer and the ledger stay `failed` for a person to decide. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`, finding 8 (spec X8 in `scratchpad/wallet-09-v/v09-attack.contract.spec.ts`) |
| FIX-41 | F1 | Tighten the refusal classifier of a bank send to Fintava's exact sentences once G-767 is answered. It tests the words anywhere in a 400's messages ("insufficient balance", "unable to find customers", "kindly confirm both customer accounts are active"), so any 400 whose text contains them is failed at once. FIX-41 makes the failure visible if the transfer later completes (F8); it does not make the classifier exact. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`, finding 2 |
| FIX-41 | F2 | A new `nameToken` on a retried bank send that was kept (pending or in progress) changes the body fingerprint, so the same key answers `409 idempotency_key_reused`. By design, like the quote token; the app resends the SAME body on a retry of a kept send. A refused try gives the key back, so the normal re-check flow is fine. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`, finding 4 |
| WALLET-04 | D2 | Test gap: the debit total could be summed on the phone and no test would notice (M09). | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 142 |
| WALLET-04 | D3 | Test gap: the search wait and the search key are pinned by no test (M13, M14). | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 143 |
| WALLET-04 | D4 | W27's Account line loses the last four digits for a long bank name. | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 144 |
| WALLET-16 | F6 | An earning does not check that payer and payee differ (nor does the database). | branch `wmt/WALLET-16`, `tasks/WALLET-16.md`, Verifier report, line 113 |
| WALLET-16 | F7 | The trigger that keeps a landed row from changing covers UPDATE, not DELETE. | branch `wmt/WALLET-16`, `tasks/WALLET-16.md`, Verifier report, line 114 |
| BILLS-01 | R4-1 | More spellings of "n/a" (`N-A`, `N A`, `N_A`) and look-alikes (`nu1l`, Cyrillic u) draw a green name. | `tasks/BILLS-01.md`, Verifier report, round 4, line 437 |
| BILLS-01 | R4-2 | A failure signal the reader does not walk (`result`, `outcome`, `isError` and others) leaves a green name beside it. Low, as ruled. | `tasks/BILLS-01.md`, Verifier report, round 4, line 438 |
| BILLS-01 | R4-3 | A real owner is refused (502 `meter_unconfirmed`) when a success body says "without errors". Low, fails safe. | `tasks/BILLS-01.md`, Verifier report, round 4, line 439 |
| BILLS-01 | R4-4 | The placeholder rule reads only the first 2,000 characters before dropping invisible ones. Hostile input only. | `tasks/BILLS-01.md`, Verifier report, round 4, line 440 |
| BILLS-01 | R4-5 | Trailing invisible characters are not stripped from a real name. Info. | `tasks/BILLS-01.md`, Verifier report, round 4, line 441 |
| BILLS-01 | R4-6 | Backspace after a comma and Delete before one are dead keys in the amount box. Low now, medium when the web follows. | `tasks/BILLS-01.md`, Verifier report, round 4, line 442 |
| BILLS-01 | R4-7 | A refused paste over a selection collapses the selection; a digit beside a dropped leading zero. Cosmetic. | `tasks/BILLS-01.md`, Verifier report, round 4, line 443 |
| TIER-02 | D11 | The owner question's item 7 has the wrong numbers: with 15 places "remove some" is the whole truth at 15 up, and the worst case is 5. Info; fix at the mobile sign-off. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 918 |
| TIER-02 | T14 | No route-level test reaches a tier the config does not name (mutant M1 survives all 125 tests). Info. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 919 |
| TIER-02 | N18 | The new ended-plan sentence drops "Everything you published stays up." Wording; the owner may want it back. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 920 |
| TIER-02 | N19 | An ended tier that held extras: the sentence says a bigger plan has room and does not say to renew. Never false. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 921 |
| WALLET-10 | L2 | Plain `CREATE INDEX` on `FintavaLedgerEntry` (migration `20261021300000_money_in_notices`, line 31) blocks writes while it builds. Negligible at today's size. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-10.md`, finding 2 |
| WALLET-10 | L3 | G-734: the ledger fold of two rows of one movement does not carry the money-in mark, so a fold can tell a credit twice. Rare, recorded. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-10.md`, finding 3 |
| WALLET-10 | L5 | Pre-existing (MONEY-10), not this task: a second signed delivery with the same reference and another amount flips a completed `in` row back to `pending` with a recorded discrepancy. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-10.md`, finding 5 |
| POINTS-04 | L1 | A 500 "Something went wrong" after the conversion exists (an error after the cash moved, `points-cash-out.service.ts` `start`): it self-heals (the conversion stays `held` and the sweep finishes it), but answer the pending view instead. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-04.md`, finding 1 |
| POINTS-04 | L2 | The in-progress answer for the conversion route reads "This payment is still going through" (the shared idempotency wording); a conversion is not a payment. Wording. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-04.md`, finding 2 |
| POINTS-04 | L3 | The unreachable-provider refusal before anything is written says "Your money is safe" where the person's points are what is at stake. Wording. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-04.md`, finding 3 |
| FIX-20 | L1 | CONVENTIONS section 21 and `WEBHOOK_STATE_RULES.failed.why` call a held `failed` delivery "a stop for review (a reversal with no debit, a disagreement)", but the code marks a disagreement delivery `processed` (`ledger-consumer.service.ts` lines 413, 487 to 495, and 253), so it is cleared at day 90 while its ledger row may still await MONEY-16 review. Fix the sentence or hold a `processed` row whose ledger row carries an open `discrepancy`. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-20.md`, finding 1 |
| FIX-20 | L2 | G-750: only `processed` (and Nuvion `test`) bodies are cleared; `failed`, `unrecognised` and `pending` bodies are kept for ever. If NUV-10 subscribes the Nuvion webhook to the 15 events with no handler, those rows (names, account numbers) stay for ever. Subscribe only handled events, or add a rule that clears a pending row no handler lists. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-20.md`, finding 2 |
| FIX-20 | L3 | `docs/release/DATA-INVENTORY.md` rows I-092 and I-281 (provider webhook payload stored whole) do not say "cleared after 90 days". | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-20.md`, finding 3 |
| WALLET-23 | L1 | A balance answer with no tier keeps the old copy for good: `src/fintava/fintava-wallet-provider.ts` omits `accountLimits` when the tier is null and `AccountLimits.record` returns on undefined, so a TIER_1 copy keeps being enforced and shown if Fintava stops sending a tier. Safe side. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`, finding 1 |
| WALLET-23 | L2 | The day counts the amount before fees, so the last purchase can pass WAWU's check while price plus fee takes the wallet one fee over the limit (49,999,000 plus a 1,575 fee is 50,000,575 of 50,000,000). Whether Fintava counts the fee is open (question 16). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`, finding 2 |
| WALLET-23 | L3 | The copy is filled only by a balance read and opening a wallet reads none (`wallet-opening.service.ts` line 321 only reads the copy), so A8's Limit row is hidden right after opening and W35's row until the first balance read. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`, finding 3 |
| WALLET-23 | L4 | Mobile, docs only: stale comment at `src/features/wallet/settings/WalletSettingsScreen.tsx:44` says the server "sends none today, BACKEND_GAPS G-7". | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`, finding 4 |
| WALLET-23 | N5 | Note: only wallet payments call `MoneyLimits.assertMayMove` today; transfers and bills are not served yet, so they must call it when they are. A trailing comma in FINTAVA_TIER_DAILY_LIMITS_KOBO stops the app at boot (documented fail-fast). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`, finding 5 |
| FIX-26 | L1 | The deny-by-default list misses a write at exactly `money` (no sub-path): `unnamedMoneyWrites` and the stale-name test match `/^\w+ money\//`, so `@Controller('money') @Post()` passes with no guard and no documented code. Fix: `/^\w+ money(\/\|$)/` in `src/money/limits/tests/money-moving-coverage.spec.ts` (about lines 340 and 900). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-26.md`, finding 1 |
| FIX-26 | L2 | The deny list stops at `money/`: a debit outside it (for example `@Controller('payouts') @Post('send')` with no PIN guard and no debit code) passes. In scope as built ("under money/"); `POST plans/purchases` already shows a payment route outside money/. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-26.md`, finding 2 |
| FIX-26 | L3 | Informational: a mutant that reads the daily total through the service's own client instead of `tx` survives all four limits specs. Near-equivalent today (the lock is taken first and no caller writes before the check). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-26.md`, finding 3 |
| WALLET-35 | V-5 | A statement mail that fails (503 `statement_email_failed`) still uses one of the 5 a minute / 30 an hour statement slots (`limiter.take` runs before the send and only `statement_too_large` gives it back). Low; no code changed in round 2. | branch `wmt/WALLET-35`, report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`, finding 5 |
| WALLET-35 | R2-4 | A burst of simultaneous oversize statement mails can see 429 before their 400 (10 in parallel gave 6 x 400 and 4 x 429; the slot is taken before the build and given back after). Only a person sending more than 5 at once. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`, finding 4 (round 2) |
| WALLET-35 | R2-5 | Capacity, not new: 4 parallel 12 MiB mails to wawu-id peaked at 837 MB RSS (idle 204), about 160 MB each; the Hub's limit is per person, so many people can stack them. Only the key holder can do it. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`, finding 5 (round 2) |
| WALLET-35 | R3-1 | wawu-id: a keyless POST to a sub-path of /internal/mail/send (/send/x) now answers 401 where it was 404 (src/mail/mail-relay-body.ts:39). Match req.path === '/' if it matters. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`, finding 1 (round 3) |
| WALLET-35 | R3-2 | wawu-id: one src/mail spec failed once under load on a cold cache (44 of 44 on 4 reruns). Name it if it fails again. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`, finding 2 (round 3) |
| WALLET-09 | R2-2 | Hub: `payouts_blocked` keeps `recordMayExist` true in the Fintava client while `wallet-transfer.service.ts` `afterRefusal` (NO_TRANSFER_REFUSALS) fails the send at once, so the flag is ignored for these kinds; safe only because of the sandbox evidence (G-767). The classifier's looseness is FIX-41 F1. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`, finding 2 (round 2) |
| FIX-41 | F3 | Hub: `wallet-transfer.service.ts` `sweep()` (~line 850) runs `lookForLateSuccess` inside the `sweeping` flag, one send at a time, up to 50 per minute. No transaction, connection or lock is held, but 20 sends x 3 s kept the sweep busy 60.6 s, so the next cron tick's pending-send settlement is skipped meanwhile; with a hung provider (30 s check timeout) 50 sends is about 25 minutes. An unreachable provider also puts every send back to checks 0, so the same 50 oldest are tried first every minute for up to 48 h. Add a time budget per sweep, or run the failed-send lookups after the flag is released. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-41.md`, finding 1 |
| FIX-41 | F4 | Hub: nothing outside the service reads `WalletTransfer.reviewSince` for a failed send, so 'put in front of a person' today is the log line, the discrepancy column and the nightly money check. A dashboard list for it is a later task. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-41.md`, finding 2 |
| FIX-40 | F1 | Hub: `src/money/limits/account-limits.service.ts` `movedToday` (unchanged) still counts a refunded payment toward the provider's own daily limit on the account (by design: the debit counted at the provider), so a person near that limit still gets `limit_reached` after a failed bill. WAWU's own limits are fixed. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-40.md`, finding 1 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
