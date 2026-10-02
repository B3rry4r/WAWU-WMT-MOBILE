---
id: MONEY-10
title: The ledger
owner: YOU
area: MONEY
order: 62
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: [MONEY-07]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-10 · The ledger

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Our record of every movement of money, mirrored from Fintava, in kobo.

## Scope

Transaction store: amount in kobo, direction, counterparty, category, note, Fintava reference, status.

## Capability checks

- [ ] Every sandbox movement in MONEY-06 to MONEY-08 appears once in the ledger with the right sign.
- [ ] Amounts survive round trips exactly (no floats).

## Builder report

Backend `wmt/MONEY-10` f94f442, origin/main 14a7fb2 merged as da74274; mobile `wmt/MONEY-10` from main ca6d6cb.
- Files: `src/money/ledger/` (service, consumer + sweep, webhook reader, config, module, 2 specs), `FintavaLedgerEntry` + `FintavaLedgerReference` and additive migration `20261002210000_fintava_ledger` (5 enums, 2 tables; diff on a fresh DB shows only the old `ContentPiece_specializations_idx` drift), `money.module.ts` imports it, `account-data-map.ts` classifies the 3 new wawu columns, `.env.example`, `scripts/fintava/ledger-sandbox-check.ts`. No route (history is MONEY-15), contract unchanged (regenerated: order-only diff, not committed).
- Once: every reference a row is known by is a key row (account, direction, value); insert with `ON CONFLICT DO NOTHING`, a collision folds into the holder (locked, re-checked). Deliveries are locked `FOR UPDATE SKIP LOCKED` and marked processed in the same transaction. Tests: 3 shapes x 2 copies consumed concurrently (6 consumes + a sweep), one row per side; 10 racing writers with overlapping references, one row. G-19: a delivery matches on any field (ours, Fintava's, tagapay, id).
- Sign and kobo: out on the sender, in on the receiver; naira to kobo once (`fintavaAmountToKobo`), BIGINT, back exactly (every kobo 1..100000 and edge values round-trip; 3 decimals refused, event `failed`, nothing written). Never a balance (a test greps the ledger code for any sum).
- Reversal: the row becomes `reversed` with Fintava's amounts; replay and a late SUCCESS change nothing; one row, never a second debit. Before its debit it waits; with no debit past the window it fails and writes nothing.
- Unknown: undocumented events stay `unrecognised`, card events stay pending (WALLET-22); no WAWU wallet: processed, nothing written. `{}` lookup: pending, then lands.
- Mutation checks (8): no ON CONFLICT, status moving back, sides swapped, float kobo, reversal not marking, references never colliding, every event swept, reversal writing a debit: each fails the specs.
- Checks: tsc 0; eslint clean on changed files; ledger specs 29/29 (8 repeat runs green). Full `test:contract` on fresh seeded `m10_full_test`, mock WAWU ID on :4761: 101/104 suites, 2013 passed, 3 skipped; 35 failed = `kyc-submission`, `privacy-settings`, `credits-state`, which hardcode `localhost:4001` (fetch failed): NOT RUN on this session's ports. Protected `run.sh --fresh wmt/MONEY-10` on `m10_protected_test`: 253/253 (244 required), lock unchanged. Gates before 16 fail / 3 warn / 76 accepted; after 16 / 5 / 76, the same 16 fails as main 14a7fb2 (main 4 warn; +1 `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`). Mobile `npm run check` before (98ad860) exit 0, gates 0 fail on 75 files; after (main ca6d6cb merged) exit 0: 16 suites / 285 tests, gates 0 fail on 75 files, 201 tasks. `npm run api` not run: no route, contract unchanged.
- Sandbox (`docs/fintava/sandbox/28-money10-ledger.md`): two ₦10 round trips, WAWU to A and back, WAWU to B and back; 8 rows for 4 movements, each once per side with the right sign, from receipt, lookup, history/by-id and locally signed webhooks (no tunnel, R-25) in every order; balances back where they started; 31 + 7 calls, dev host only, no key window in any output. Found and fixed: a delivery whose other side was held waited on Fintava; it now takes the held row's references.
- Default (agent), owner may override: a 30-second sweep, not on receipt (MONEY-07's route stays as built); a w2w delivery with no status is completed; `account_funded` and `virtual_wallet_payment` trusted alone (history lists no credits); confirm window 72 h (PROVISIONAL); ledger rows `OWNED` in account deletion like `WalletLedgerEntry` (retention of money records is the owner's call); MONEY-08 and WALLET-10 work from ledger rows (G-25).
- Gaps: G-19 updated (matching built), G-25 filed. No shared-change request.
- NOT RUN: bank sends, their reversals and bills in the sandbox (question 17); `account_funded` in the sandbox (needs a bank and a tunnel); real deliveries (OPS-10); V10 (no screen).

## Verifier report

Verifier, 2 Oct 2026 (a session that wrote none of this code). **Verdict: 3 defects, back to `building`.**

Checked as it will land. Main moved during verification (KYC-01 merged: backend 14a7fb2 to d27ad37, mobile ca6d6cb to bfdd584), so both were merged into detached local copies (backend 7478d5b, mobile 6e4fe10, never pushed) and the checks below were run on those. Ledger specs, the attack suite and the gates were also run on the branch as it was (da74274): same results.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: `tsc --noEmit` 0; eslint on every changed file 0 problems (the full repo has 4,490 problems, none in a changed file); gates 16 fail / 7 warn / 76 accepted on 592 files scanned, the same 16 fails as new main d27ad37 (6 warn), the extra warn is `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`; `check_baseline.py` clean. Mobile `npm run check` on the merged copy: exit 0, 17 suites / 289 tests, gates 0 fail on 77 files, 201 tasks. |
| V2 Contract | failed (defect 2) | No route; `contract/` unchanged (diff empty). Ledger specs 29/29. Inputs in unexpected formats: 3 decimals, exponents, `+10`, `1,000`, `.5`, `10.`, hex, NaN, booleans, null, past 2^53, `0.1+0.2` are all refused with the event `failed` and no Fintava call. Negative and zero amounts are refused but never settle (defect 2). |
| V3 Regression | passed | `run.sh --fresh` on `vm10_protected_test`, code at the merged copy, lock at origin/main d27ad37: 253/253 (244 required), lock files unchanged against both mains. Full `test:contract` on fresh seeded `vm10_contract_test`, mock WAWU ID on :4791: 107 suites, 103 passed, 2,043 passed, 3 skipped, 40 failed in 4 suites (`account`, `credits-state`, `kyc-submission`, `privacy-settings`), every failure `fetch failed` against a hardcoded `localhost:4001`. Those 4 are NOT RUN: :4001 was held by another agent's process the whole time. On main 14a7fb2 the same setup failed the same suites. |
| V4 Field trace | failed (defect 1) | amountKobo, feeKobo, totalKobo: naira to kobo once (`fintavaAmountToKobo`), BIGINT, read back exactly (A5 edge at 2^53-1 kobo stored exact). References: every one is a key row. The wallet a row belongs to is traced wrong when an account number at another bank equals a WAWU wallet's number (defect 1). Readers: none yet (MONEY-15). Account purge: OWNED / COUNTERPARTY as reported. |
| V6 States | failed (defect 2) | Reached through their real causes: processed, waiting (`{}` lookup, Fintava unreachable, Fintava not configured, merchant account unreadable), failed (unreadable amount; reversal past the window), unrecognised and card events untouched, no WAWU wallet on either side. A delivery with a negative or zero amount reaches no end state (defect 2). |
| V7 Flow walk | passed (backend paths) | Walked against the real sandbox: WAWU to a person and back, each with every path racing (below). A party with no wallet writes nothing. No screen (MONEY-15 serves history), so no screen walk. |
| V8 Money attack | failed (defects 1, 2) | Below. |
| V9 Live seam | passed (partial) | The real server (`dist/src/main.js`, `NODE_ENV=production`) booted with no FINTAVA_* and ran its real sweep against a real database; the sandbox run posted signed deliveries to the real route. Sign-in leg NOT RUN: the ledger has no route until MONEY-15. |
| V10 | NOT RUN | No screen; unblocked by MONEY-15 and OPS-10. |

**V8, pass by pass** (verifier's own suite `vm10-attack.contract.spec.ts`, kept out of the branch, plus real processes):

1. Exactly once: passed. One movement fed through every path at once (the sender's receipt, a lookup sighting, a history sighting, a lost-answer pending row plus `reconcileEntry`, webhooks in both G-19 readings plus a `fin`-only and an `ours`-only delivery, each posted twice and consumed twice concurrently, two sweeps), shuffled into a random order each time, 12 iterations per run, 3 runs (36 movements): always one `out` row on WAWU and one `in` row on the receiver, every delivery `processed`, no discrepancy, no ledger error. Two different ₦10 sends to the same person in the same second, each delivered with only its tagapay reference and resolved through history plus by-id: two rows per side, none shared. Merging different movements through colliding references: the key is exact text per (account, direction); the only collision found is defect 1's, through the account number, not a reference.
2. Mutation checks (each applied alone, the ledger specs and the attack suite run, then restored): dropping the reference primary key in the database: 12 tests fail; skipping the fold of extra holders: caught; reversed may go back to completed: caught; the receiver side dropping the named references: caught; the merge overwriting the stored amount: caught; unsorted key order: caught. Survived (test gaps, not defects): removing the re-check after `FOR UPDATE` in the fold, removing the `direction: 'out'` filter in `debitsFor`, removing `AND "processingStatus" = 'pending'` from the delivery lock.
3. Sign and amount: out rows are on the sender, in rows on the receiver, in every case. Fee columns: `feeKobo` is what Fintava reported (`charges` / `transaction_fee`), `providerFeeKobo` and `wawuFeeKobo` only what the sending feature passes (R-10); no fee figure exists in the ledger code. Amount inputs: see V2; negatives and zero are defect 2. Whitespace around a decimal string (`" 10.00 "`, a tab and newline) is read as exactly 1000 kobo by MONEY-06's shared helper (unclear item U-2).
4. Reversals: passed. The original row becomes `reversed`, never a second row; a `pending` reversal changes nothing and the later `success` applies; a second reversal under another `reversalRef` changes nothing; a late SUCCESS leaves it reversed; a reversal before its debit waits, and past the window is `failed`, writing nothing. A negative reversal amount never settles (defect 2).
5. Never a balance: passed. No sum, aggregate or reduce in `src/money` or `src/fintava`; MONEY-11's balance is `fintava.getWalletBalance`.
6. The sweep in production (rule 6): with no FINTAVA_* (`NODE_ENV=production`), the server boots, the webhook route answers 401, there is no hot loop: 12 deliveries that need Fintava stayed `pending` and were retried at 1, 2, 4 minutes (doubling to an hour), each retry writing its waiting note again and logging one Fintava `not_configured` warning per call (12 warnings per retry); 4 `account_funded` deliveries naming no sender account need no Fintava and were recorded (U-3). With Fintava unreachable (`ECONNREFUSED`), the same backoff, note `(unreachable)`. Two processes (`dist/src/main.js` on :4791 and on a Unix socket) sweeping one database with a slow Fintava double: 240 deliveries, 180 processed, 91 by one and 89 by the other (180 exactly, none twice), 240 ledger rows as expected, no duplicate side, no error; the 60 reversals with no debit stay waiting. Migration `20261002210000_fintava_ledger` is additive (5 enums, 2 tables, one FK on its own table) and applies after main's migrations; drift on a migrated database is only the old `ContentPiece_specializations_idx`. KYC-01's `20261002200000_wallet_identity` is now on main and sorts before it, so the order is already right; the two touch no common table.
7. Sandbox (dev.fintavapay.com only, fetch guard, at most 2 sends): one ₦10 round trip. WAWU to A with the receipt, a lost-answer row plus reconcile, both webhook readings and a duplicate racing; A to WAWU with the documented webhook first, racing a lost-answer row plus reconcile, the receipt last. 4 rows, one per side, 1000 kobo each, fee 0, completed, no discrepancy; balances back where they started (WAWU 4,961,500 kobo, A 25,000). 22 calls: 2 wallet-to-wallet sends, 7 merchant balance, 2 wallet balance, 3 lookups (1 answered 404), 7 by-id, 1 customer history. No customer created, no charged call. Key scan (own scanner, every 8-character window of the key) over both branch diffs, commit messages and every log of this run: 0 hits.

**Findings**

1. `defect` A wallet is matched by account number alone, so money at another bank lands on an unrelated WAWU user. `resolve()` (`src/money/ledger/ledger-consumer.service.ts`) looks a party up as `FintavaWallet.accountNumber IN party.accountNumbers` and ignores the bank, but a NUBAN is unique only within its bank. A `customer_bank_transfer` from Y to `<X's account number>/000013` (GTBank) wrote an `in` row of +10,000 kobo on X's wallet, completed, counterparty Y (attack A3). An `account_funded` whose sender `accountNumber` at bank `000014` equals Z's wallet number wrote an `out` row of -10,000 kobo on Z (attack A4). X and Z moved no money; their history would show it. Fix: a party named with a bank (the destination's bank code, `senderBankSortcode`) is a WAWU wallet only when that bank is Fintava's own (Loma); the sender of `account_funded` is never a WAWU wallet unless the swap rule needs it. Check: A3 and A4 write nothing on X or Z.
2. `defect` A delivery with a negative or zero amount (or a negative fee or total, or amount plus fee past 2^53, or a negative reversal amount) never settles. `readLedgerWebhook` accepts them (the MONEY-06 helper returns signed kobo), the consumer asks Fintava (2 to 7 calls), then `koboBig` throws `RangeError` inside the write: nothing is written (correct, never rounded), but the event stays `pending` for ever, ignores the confirm window, and the sweep retries it on the backoff schedule indefinitely, calling Fintava and logging an error each time (attack A5, A6b). A 3-decimal amount, by contrast, is `failed` at once with no call. Fix: refuse a non-positive amount and a negative fee, total or reversal amount in the reader as `unreadable`, so the event is `failed` with a reason before any Fintava call.
3. `defect` The branch cannot land as it is: main moved (KYC-01). Merge main into both branches (a merge, never a rebase). Backend: conflicts in `src/account-purge/account-data-map.ts` and `src/money/money.module.ts` (keep both sides). Mobile: KYC-01 took **G-25** on main, so MONEY-10's G-25 row needs a new number (G-26 is free) in `BACKEND_GAPS.md` and this task file; and KYC-01 took sandbox file number 28 (`28-kyc01-bvn-check.md`), so `28-money10-ledger.md` needs a new number (29) in the README, the G-19 row and this task file. Then `npm run tasks -- --write` and `npm run check`.

Not defects, for the fix round or later:

- Test gaps (mutants that survived): the re-check after the lock in the fold, the `out` filter in `debitsFor`, and the `pending` re-check in the delivery lock can each be removed with every test green. The two-process run shows the guards work; nothing proves it in the suite.
- U-1 `unclear` A `completed` row becomes `failed` when a later delivery says FAILED (`MAY_BECOME.failed` includes `completed`; attack A7). If Fintava ever says SUCCESS and then FAILED with no reversal, the history shows failed for money that left. MONEY-08's call.
- U-2 `unclear` `" 10.00 "` and `"\t10.00\n"` are read as exactly 1000 kobo (MONEY-06's `fintavaAmountToKobo` trims). Nothing is rounded; refusing them would change MONEY-06's shared helper.
- U-3 With no FINTAVA_* the sweep still writes: the waiting note is rewritten on each backed-off retry (12 rows x 3 retries in 3.5 minutes here), and `account_funded` deliveries that need no Fintava are recorded (correct). `wait()` could skip an unchanged note. No pending deliveries can arrive in that state, because the route answers 401.
- Diff against the report: matches, except `ledger.interface.ts`, which is in the diff but not named in the file list.

**Rulings on the builder's defaults**

- The 30-second sweep, not on receipt: **upheld.** The webhook route stays one insert and a 200, the balance is Fintava's and live, only the history row waits; two processes do not double-apply. The backoff lives in memory, so a restart retries every waiting delivery at once (harmless).
- A wallet-to-wallet delivery with no status counts as completed: **upheld.** It is confirmed with Fintava whenever no side is held, and the documented delivery reports the balances after the move.
- `account_funded` (and `virtual_wallet_payment`) trusted alone: **upheld** for the movement itself (history lists debits only, nothing else can confirm a signed delivery), **with defect 1** on who the parties are.
- The 72-hour window: **upheld** as `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`, Fintava's own webhook retry horizon; the gate lists it. A reversal failed past the window leaves its debit `completed` for MONEY-16 to report.
- G-25 (the ledger marks the shared events `processed`; WALLET-10 and MONEY-08 work from ledger rows): **upheld.** Both depend on MONEY-10, and one consumer marking events is what prevents a second one applying them. WALLET-10's and MONEY-08's task files do not mention it yet; add a pointer when the row is renumbered (defect 3).
- Ledger rows deleted with the account: **not ruled; owner question.** Today, when an account is purged, every `FintavaLedgerEntry` on that person's wallet is deleted (OWNED, like `WalletLedgerEntry`), with its `FintavaLedgerReference` rows (cascade). Rows on other people's wallets that name them as the counterparty are kept. Deletion needs an empty wallet first (R-17). Fintava keeps its own records. Owner: how long must WAWU keep a deleted person's money records?

NOT RUN: the 4 contract suites hardcoding `localhost:4001` (port held by another agent; unblocked by a free :4001); bank sends, their reversals, bills, `account_funded` and `virtual_wallet_payment` against the sandbox (sandbox payouts refused, question 17; no tunnel); real deliveries (OPS-10); V10 (no screen).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
