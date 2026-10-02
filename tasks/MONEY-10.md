---
id: MONEY-10
title: The ledger
owner: YOU
area: MONEY
order: 62
priority: launch
repo: wawu-backend
type: money-path
status: review
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

**Round 2** (backend 11c6602: main d27ad37 merged as 5252d33, fixes 11c6602; mobile main bfdd584 merged).
- Defect 1 fixed: an account number alone never names a WAWU wallet. Each party says where it is (`fintava_wallet`, `bank_account`, `merchant`); one named with Fintava's customerId is found by that id only; a `bank_account` (a bank send's destination, `account_funded`'s sender) is a WAWU wallet only at Fintava's bank `090620` (`FINTAVA_WALLET_BANK_CODE`, from Fintava's bank list); the `account_funded` swap is gone (receiver by `userId`, else `beneficiaryAccountNumber`). Tests reproduce A3 (GTBank `000013` destination = X's number: nothing on X) and A4 (Access `000014` sender = Z's number: nothing on Z), plus the same send at `090620` landing, and an unknown customerId with a WAWU number beside it writing nothing. Each fails with the old matching (mutants D1a, D1b killed).
- Defect 2 fixed: the reader refuses a non-positive amount or total, a negative fee, amount plus fee past 2^53, and a non-positive reversed amount or total or negative reversed charges as `unreadable`, so the event is `failed` with the reason and no Fintava call (tested per case, call count unchanged); a `RangeError` in a write is a backstop that also fails the event.
- Test gaps closed, each mutant now killed: the re-check after the fold's lock (a holder folded away while the writer waits on its lock, interleaved through `pg_stat_activity`); the `out` filter in `debitsFor` (a reversal reverses A's debit, never B's in row holding the same reference); the `pending` re-check in the delivery lock (a stale read: nothing is written again). U-3: a waiting note is written only when it changes (row `xmin` unchanged), and with no Fintava config nothing is asked.
- Checks: tsc 0; eslint clean on changed files; ledger specs 38/38; the verifier's attack spec 7/7 (A3, A4: none; every A5 bad amount `failed` with 0 calls; A6b `failed`; A5 whitespace and A7 unchanged, U-2 and U-1). Full `test:contract` on fresh seeded `m10_full_test`, mock on :4761: 104/107 suites, 2057 passed, 3 skipped, 35 failed, all `fetch failed` in the 3 suites hardcoding :4001; those 3 plus `account` then run on fresh `m10_p4001_test` with a mock on :4001 (free per `lsof` before and after): 4/4 suites, 40/40. Protected `run.sh --fresh` 253/253 (244 required), lock unchanged. Gates 16 fail / 7 warn / 76 accepted, the same 16 fails as main d27ad37 (6 warn; +1 LEDGER-CONFIRM-WINDOW). Mobile `npm run check` (main bfdd584 merged): exit 0, 17 suites / 289 tests, gates 0 fail on 77 files, 201 tasks; a conflict-marker slip in `BACKEND_GAPS.md` from the merge was caught by it and fixed.
- Renumbered: the gap row is G-28 (KYC-01 took G-25, INBOX-01 G-26 and G-27), the sandbox file is `30-money10-ledger.md` (28 is KYC-01's, 29 KYC-02's); WALLET-10 and MONEY-08 now point at G-28. No new sandbox call this round.

**Round 1**: backend `wmt/MONEY-10` f94f442, origin/main 14a7fb2 merged as da74274; mobile `wmt/MONEY-10` from main ca6d6cb.
- Files: `src/money/ledger/` (service, consumer + sweep, webhook reader, config, module, 2 specs), `FintavaLedgerEntry` + `FintavaLedgerReference` and additive migration `20261002210000_fintava_ledger` (5 enums, 2 tables; diff on a fresh DB shows only the old `ContentPiece_specializations_idx` drift), `money.module.ts` imports it, `account-data-map.ts` classifies the 3 new wawu columns, `.env.example`, `scripts/fintava/ledger-sandbox-check.ts`. No route (history is MONEY-15), contract unchanged (regenerated: order-only diff, not committed).
- Once: every reference a row is known by is a key row (account, direction, value); insert with `ON CONFLICT DO NOTHING`, a collision folds into the holder (locked, re-checked). Deliveries are locked `FOR UPDATE SKIP LOCKED` and marked processed in the same transaction. Tests: 3 shapes x 2 copies consumed concurrently (6 consumes + a sweep), one row per side; 10 racing writers with overlapping references, one row. G-19: a delivery matches on any field (ours, Fintava's, tagapay, id).
- Sign and kobo: out on the sender, in on the receiver; naira to kobo once (`fintavaAmountToKobo`), BIGINT, back exactly (every kobo 1..100000 and edge values round-trip; 3 decimals refused, event `failed`, nothing written). Never a balance (a test greps the ledger code for any sum).
- Reversal: the row becomes `reversed` with Fintava's amounts; replay and a late SUCCESS change nothing; one row, never a second debit. Before its debit it waits; with no debit past the window it fails and writes nothing.; unknown: undocumented events stay `unrecognised`, card events stay pending (WALLET-22); no WAWU wallet: processed, nothing written. `{}` lookup: pending, then lands. Mutation checks (8): no ON CONFLICT, status moving back, sides swapped, float kobo, reversal not marking, references never colliding, every event swept, reversal writing a debit: each fails the specs.
- Checks: tsc 0; eslint clean on changed files; ledger specs 29/29 (8 repeat runs green). Full `test:contract` on fresh seeded `m10_full_test`, mock WAWU ID on :4761: 101/104 suites, 2013 passed, 3 skipped; 35 failed = `kyc-submission`, `privacy-settings`, `credits-state`, which hardcode `localhost:4001` (fetch failed): NOT RUN on this session's ports. Protected `run.sh --fresh wmt/MONEY-10` on `m10_protected_test`: 253/253 (244 required), lock unchanged. Gates before 16 fail / 3 warn / 76 accepted; after 16 / 5 / 76, the same 16 fails as main 14a7fb2 (main 4 warn; +1 `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`). Mobile `npm run check` before (98ad860) exit 0, gates 0 fail on 75 files; after (main ca6d6cb merged) exit 0: 16 suites / 285 tests, gates 0 fail on 75 files, 201 tasks. `npm run api` not run: no route, contract unchanged.
- Sandbox (`docs/fintava/sandbox/30-money10-ledger.md`): two ₦10 round trips, WAWU to A and back, WAWU to B and back; 8 rows for 4 movements, each once per side with the right sign, from receipt, lookup, history/by-id and locally signed webhooks (no tunnel, R-25) in every order; balances back where they started; 31 + 7 calls, dev host only, no key window in any output. Found and fixed: a delivery whose other side was held waited on Fintava; it now takes the held row's references.
- Default (agent), owner may override: a 30-second sweep, not on receipt (MONEY-07's route stays as built); a w2w delivery with no status is completed; `account_funded` and `virtual_wallet_payment` trusted alone (history lists no credits); confirm window 72 h (PROVISIONAL); ledger rows `OWNED` in account deletion like `WalletLedgerEntry` (retention of money records is the owner's call); MONEY-08 and WALLET-10 work from ledger rows (G-28). Gaps: G-19 updated (matching built), G-28 filed (filed as G-25, renumbered); no shared-change request.
- NOT RUN: bank sends, their reversals and bills in the sandbox (question 17); `account_funded` in the sandbox (needs a bank and a tunnel); real deliveries (OPS-10); V10 (no screen).

## Verifier report

### Verifier report (round 2)

Verifier, 2 Oct 2026 (a session that wrote none of this code and did not verify round 1). **Verdict: PASS, no open defect; status `review`.** Round 1's defects 1 to 3 are fixed and none reopened under attack.

Checked at backend `wmt/MONEY-10` 11c6602 and mobile `wmt/MONEY-10` f2c3a27, and as it will land: backend main moved to 368fab0 (INBOX-01), so the branch was merged into a detached local copy (7e302e4, never pushed). That merge is clean (no conflict, `prisma validate` passes). Evidence files are in the verifier session's scratchpad `v10r2/` (named below). The verifier's attack suite `vm10r2-attack.contract.spec.ts` (14 tests) is kept out of the branch.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | On the merged copy: `tsc --noEmit` 0; eslint on the 11 changed `.ts` files exit 0. Gates: main 368fab0 16 fail / 6 warn / 76 accepted on 589 files; merged 16 / 7 / 76 on 597 files, with the same 16 fails line for line (`gates-main.list` = `gates-merged.list`). The extra warn is `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`. `check_baseline.py`: 108 entries, clean. CI tripwire: 0 added lines (merged copy vs main) match `test/protected-routes`, `src/protected-routes`, `compareShape` or `protected-registry`. Mobile `npm run check` at f2c3a27: exit 0, 17 suites / 289 tests, gates 0 fail on 77 files, 201 tasks (`mobile-check-before.txt`). |
| V2 Contract | passed | No route; contract unchanged. Ledger specs 38/38 on the branch and on the merged copy. Unexpected input formats: 32 bad amounts on a wallet-to-wallet delivery (`0`, `-0`, `"-0"`, `"0.00"`, `"-0.00"`, `-1`, `"-0.01"`, `"NaN"`, `"Infinity"`, `"-Infinity"`, `"1e3"`, `"1E3"`, `1e21`, `"0x10"`, `""`, `" "`, `null`, `true`, `false`, `[10]`, `{v:10}`, `"10.001"`, 20 nines, `Number.MAX_VALUE`, `"+10"`, `"1,000"`, `".5"`, `"10."`, Arabic-Indic and full-width digits, `"10 00"`, `"10.0.0"`) all end `failed`, with a reason and 0 Fintava calls. Nothing is written. |
| V3 Regression | passed | `run.sh --fresh` with lock origin/main 368fab0: merged copy 7e302e4 253/253 (244 required); branch 11c6602 253/253 (244 required). Lock files differ from main by 0 lines. Full `test:contract` on fresh seeded `v10r2_contract_test`, mock WAWU ID on :4832: 108 suites, 104 passed, 2,081 tests passed, 3 skipped, 40 failed. All 40 are in the 4 suites that hardcode `localhost:4001` (`account`, `credits-state`, `kyc-submission`, `privacy-settings`; 80 `ECONNREFUSED 127.0.0.1:4001` lines). Those 4 were then run on fresh `v10r2_p4001_test` with a mock on :4001 (`lsof` free before and after; stopped after): 4/4 suites, 40/40. |
| V4 Field trace | passed | Which wallet a row lands on now follows the bank (below). amountKobo, feeKobo, totalKobo: still BIGINT and exact, including at 2^53-1. Example: amount `90071992547409.90` with fee `0.01` is stored as 9007199254740990 + 1 = 9007199254740991. Counterparty of an `in` from another bank: `bank_account`, with the sender's number and bank code and no WAWU user id. |
| V6 States | passed | Every bad figure reaches `failed` at once. `processed` with nothing written for a party at another bank or an unknown customerId. Waiting / failed / unrecognised are unchanged from round 1 (ledger specs). |
| V7 Flow walk | passed (backend paths) | Bank send to a WAWU number at 090620 is money in for that person. The same send at any other bank code writes nothing on them. Money in from another bank lands on the receiver only. No screen (MONEY-15). |
| V8 Money attack | passed | Below. |
| V9 Live seam | passed (partial) | The real server, `dist/src/main.js` built from the merged copy, ran on :4831 against migrated `v10r2_live_test`. It had a webhook secret and no Fintava key. It ran with `NODE_ENV=development` because production refuses to boot without a Flutterwave key, which is unrelated to this task. An unsigned and a forged post each got 401. 4 signed deliveries were each posted twice: 4 stored, and the route refused the duplicates. The real 30-second sweep then settled all 4. A3 shape (GTBank destination = victim's number, sender not ours): `processed`, "no WAWU wallet on either side". A4 shape (Access sender = victim's number): one `in` row of 10,000 kobo on A only, counterparty `bank_account` at 000014. A negative `account_funded`: `failed`, "the amount is not above 0". A zero reversal: `failed`. No Fintava call was attempted (`live-db.txt`, `live-server.log`). Sign-in leg NOT RUN: the ledger has no route until MONEY-15. |
| V10 | NOT RUN | No screen; unblocked by MONEY-15 and OPS-10. |

**V8, pass by pass**

1. Defect 1, who the parties are: passed (attack suite `D1 party matching`, 9 tests).
   - A bank send from a WAWU sender to X's number at `000013`, `000014`, `999999`, `90620`, `0906200`, `090621`, `100004` and `000`: nothing on X. All 8 out rows are on the sender.
   - A destination with no bank, an empty half (`X/`, `/X`), or the bank only in other fields (`beneficiaryAccountNumber` + `bankCode: 090620`): nothing on X.
   - ` X / 090620 ` with spaces: lands on X (positive control).
   - customerId not ours with a WAWU `senderAccountNumber` beside it: nothing on that sender, "no WAWU wallet on either side".
   - customerId X with sender number Y: out on X only.
   - `account_funded` from a WAWU number with `senderBankSortcode` `000014`, missing, `""`, numeric `90620`, `"90620"`, `"0090620"` or `"LOMA"`: nothing on that number; one `in` per delivery on the receiver.
   - No `userId`: the receiver is found by `beneficiaryAccountNumber`, and the sender at another bank is never matched.
   - `userId` A with `beneficiaryAccountNumber` B: in on A only.
   - An unknown `customerId` key with B's number beside it: nothing.
2. Defect 2, bad figures: passed (`D2 bad amounts`, 3 tests).
   - Wallet-to-wallet: the 32 amounts in V2.
   - Bank send: amount `0` and `-100.00`, charges `-0.01`, `NaN` and `1e2`, total `0`, `-130.75` and `Infinity`. Amount plus fee at 2^53 (`90071992547409.91` + `0.01`, `90071992547409.90` + `0.02`).
   - `account_funded`: `0`, `-1`, `1e5`, `90071992547409.92`.
   - `virtual_wallet_payment`: `0`, `-5`, `NaN`.
   - Reversal: amount `0`, `-1`, `NaN` and `1e3`; charges `-0.01` and `x`; total `0`, `-1.00` and `10.001`; 20 nines.
   - Every one is `failed` with a reason, 0 Fintava calls and nothing written.
   - Exactly 2^53-1 (amount alone, and amount + fee) is accepted and stored exactly.
   - RangeError backstop: the reader's amount and total guards were reverted together, then a zero amount was sent. The event ends `failed`, "ledger: amountKobo must be a positive whole number of kobo." (after 2 Fintava calls, so the reader is what saves the calls). With the backstop also reverted, the RangeError escapes `consume` again (round 1's stuck state). The backstop works but is unreachable from a delivery while the reader guards stand.
3. Mutation checks: 16 one-line reverts, each applied alone. sha1 was recorded before, mutated and after, and every file was restored by copy to its original sha1 (`ledger.service.ts` b146d62f, `ledger-consumer.service.ts` 01c267a8, `ledger-webhook.ts` ed9e4cd1; `mutants-result.txt`). The builder's 38 specs then killed 15 of 16:
   - The three round-1 survivors, each killed by its new test: the fold re-check (`const now = ownerIds`), the `direction: 'out'` filter in `debitsFor`, and `AND "processingStatus" = 'pending'` in the delivery lock.
   - Defect 1: the bank check (`false &&`), customerId-only (fall through to the number), `account_funded`'s sender as a Fintava wallet, and the bank send's destination as a Fintava wallet.
   - Defect 2: each of the 4 movement guards and the 3 reversal guards.
   - U-3: the unchanged-note guard in `wait()`.
   - Survived: removing the RangeError backstop (see 2; a test gap, not a defect).
4. Exactly once under races: passed. 5 iterations of one wallet-to-wallet movement in 4 shapes with distinct delivery keys and overlapping references, each posted twice to the real route. That is 8 posts, 4 stored. They were consumed by two consumer instances (two Nest apps on one database), each consuming every delivery, plus two sweeps, all at once. Each iteration ended with one `out` row (725 kobo) and one `in` row, every delivery `processed`. `account_funded` posted 6 times in 3 keys sharing one sessionID and raced the same way: 3 stored, one `in` row. The attack suite was green 3 times on the branch and once on the merged copy.
5. Never a balance: passed. No `_sum`, `SUM(`, `aggregate(`, `groupBy(` or `.reduce(` in `src/money` or `src/fintava` outside tests. Nothing outside `src/money/ledger` reads `FintavaLedgerEntry` except account purge. MONEY-11's balance is `fintava.getWalletBalance` (`wallet-balance.service.ts`).
6. Migrations, both landing orders, fresh databases (`mig/`):
   - Order A: main + MONEY-10, then KYC-02's `20261002210000_selfie_match`.
   - Order B: main + KYC-02, then MONEY-10. `20261002210000_fintava_ledger` is applied after `selfie_match`, out of name order, and `migrate deploy` accepts it.
   - C: all at once.
   - Every run applies 75 migrations. The sorted `pg_dump -s` of A, B and C are identical. `migrate status`: up to date. `migrate diff` against the merged schema shows only the old `ContentPiece_specializations_idx` (and `SelfieMatchAttempt`, whose model is not in this schema).
   - Note for the lead: three migrations now share the timestamp `20261002210000` (INBOX-01's `community_links_and_reads`, this one, KYC-02's `selfie_match`). They touch no common table, so order does not matter, and Prisma keys on the full name.
7. Sandbox: no call this round (none needed). The Fintava key was not read.

**Findings**

No defect.

- Test gap (not a defect): no test reaches the RangeError backstop. Removing it leaves all 38 green; it is proven only by the combined mutant above.
- U-4 `unclear`: an `account_funded` that carries a `userId` is matched by it alone (the builder's default, recorded as owner may override). If `userId` turns out not to be the receiver's Fintava customerId, every such delivery is `processed` with nothing written. That is the safe side: no wrong person is credited, the balance stays Fintava's, and the payload stays stored. But top-ups would be missing from history and from WALLET-10's notices. Unblocked by one real `account_funded` delivery whose `userId` is compared with `FintavaWallet.customerId` (OPS-10), or by Fintava saying what `userId` is.
- Recorded behaviour, not defects:
  - `account_funded` whose sender is at `090620` with a WAWU number writes an `out` on that sender, as the rule says. A WAWU-to-WAWU transfer through the bank rail would also arrive as `customer_bank_transfer`; the two merge only if they share a reference such as the sessionID, which is unseen until real deliveries (OPS-10).
  - A wallet-to-wallet delivery whose `source_customer_accno` is not ours but whose `source_customer_wallet` is takes the second field (both are Fintava wallets by definition).
  - A total below the amount (positive) is stored as reported with no discrepancy note (MONEY-16's reconciliation).
  - The Fintava bank is one code, `090620`. If WAWU wallets ever sat at another partner bank, sends to them would be unrecorded (safe side).
- Diff against the report: round 2 changes the 5 files named (`ledger-config.ts`, `ledger-consumer.service.ts`, `ledger-webhook.ts`, both specs); the numbers reported (38/38, 253/253, 16 fails) reproduce.
- Landing (not failed, per the lead):
  - Mobile f2c3a27 does not merge cleanly onto main 2ccaab7. There are conflicts in `BACKEND_GAPS.md`, where this branch's G-28 row collides with main's G-26 to G-32 (AUTH-01 took G-28), and in the generated `docs/PROGRESS.md`. The lead renumbers MONEY-10's row to G-33.
  - Every place that names it on the branch: `BACKEND_GAPS.md` line 38 (the row itself); `tasks/MONEY-10.md` lines 47 and 56 (builder report); `tasks/MONEY-08.md` line 37; `tasks/WALLET-10.md` line 36; `docs/LOG.md` lines 6 and 8; `docs/PROGRESS.md` lines 60 and 62 (generated from LOG). The round-1 report's "G-25" and "G-26" mentions are history.
  - No backend file names the gap.
  - Sandbox file `30-money10-ledger.md` does not collide: main has up to 28, and 29 is KYC-02's.

NOT RUN:
- Bank sends, their reversals, bills, `account_funded` and `virtual_wallet_payment` against the sandbox. Sandbox payouts are refused (question 17) and there is no tunnel; unblocked by a sandbox that accepts a bank payout, and a public URL for deliveries.
- Real deliveries (OPS-10).
- V9 sign-in leg and V10: no route or screen until MONEY-15.

### Verifier report (round 1)

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
