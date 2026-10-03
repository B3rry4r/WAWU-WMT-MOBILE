---
id: MONEY-08
title: Status checks and the pending sweep
owner: YOU
area: MONEY
order: 67
priority: launch
repo: wawu-backend
type: third-party
status: building
depends_on: [MONEY-07, MONEY-10]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-08 · Status checks and the pending sweep

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A transfer stuck 'pending' because a webhook never came gets settled anyway.

## Scope

Port the existing reconcile-pending pattern to Fintava's status endpoint, on a schedule.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

Work from the ledger (MONEY-10), not the event rows: MONEY-10 marks `customer_bank_transfer` and `debit_transfer_reversal` deliveries `processed` once applied, so this task settles `pending` ledger rows (`LedgerConsumerService.reconcileEntry` asks Fintava for one) and reads a reversal as the row's `reversed` status (`BACKEND_GAPS.md` G-33).

## Capability checks

- [ ] A transfer whose webhook is withheld settles correctly within one sweep.
- [ ] A transfer Fintava reports failed is reversed exactly once.

## Builder report

### Builder report (round 2)

Builder, 3 Oct 2026 (a session that did not write round 1). wawu-backend `wmt/MONEY-08` 2c5dee8 on main `e8535d8`; mobile `wmt/MONEY-08` on main `176a56d` (neither main moved). Every defect was reproduced first with the verifier's own specs (backlog 39 sweeps behind 400 rows; A5 never asked; A6 failed during the history call; A10 failed after 5 pages; A4 and A4b completed on ₦200).
- **Defect 1, backlog starvation:** the schedule is on the row: additive migration `20261003120000_ledger_status_schedule` (nullable `nextCheckAt`, `statusChecks` default 0, `revivedAt`, `revivedBy`, index on `status, nextCheckAt`; no table MONEY-12's `20261003100000_wallet_opening` touches). A row is first due at createdAt (or revivedAt) + 2 minutes; each pass claims up to 50 due rows in one `UPDATE ... FOR UPDATE SKIP LOCKED` that moves `nextCheckAt` on by 1, 2, 4 ... 60 minutes (never `updatedAt`); order: rows recorded or revived in the last hour first, then earliest due. The in-memory `retryAt` is gone. Tests: the rest is 1, 2, 4, 8, 16, 32, 60, 60 on the row and a restarted server keeps it; 3,000 day-old `{}` rows plus a new SUCCESS send, webhook withheld: settled in the first pass, 50 checks a pass, again on a restarted server (which does not re-ask the 49 rows just checked), two servers at once ask 100 different rows. The verifier's backlog spec: settled after 0 extra passes behind 100, 400 and 3,000 rows (was 5, 39, never). A 240-minute run with 3,000 waiting rows, a new send each minute and a restart at minute 120: 240 of 240 settled in their first pass, at most 50 a pass, every backlog row still asked 3 or 4 times.
- **Defect 2, a revival is never swept:** the revival writes `revivedAt` and `revivedBy` and restarts the schedule, never `discrepancy`. Test (the verifier's repro): failed as absent, resent under the same reference, Fintava then SUCCESS with the webhook withheld: not asked within 2 minutes, settled by the next sweep, `discrepancy` null. A5 in the attack spec: settled.
- **Defect 3, absent races a delivery:** `markAbsentFailed(id, version)` is a compare-and-set in one transaction: the row's `xmin` as the check started, still pending with no disagreement, nothing of Fintava's ever merged (`fintavaReference`, `fintavaTransactionId`, `tagapayTransRef`, `sourceEventId` all null), and no stored delivery (consumed or not) naming any of its references. Otherwise the row waits, decision `wait`, and is rescheduled. Test: `/txn` held 1.2 s with the delivery consumed at +300 ms, consumed before, and stored but not consumed: all three end pending, no failure, no note. Plus a version-changed row and a row Fintava once showed PENDING.
- **Defect 4, a cut-off walk:** MONEY-06's `findInHistory` returns `'incomplete'` when it stops at 5 pages with `hasNextPage` true short of `since`; `reconcile` answers `unknown` / `history_incomplete` (new member of both `why` unions), so a retry waits instead of resending: other callers stay the same or safer. Test: our send on merchant page 6 of 8: 5 pages read, pending; on page 4: settled. Every Fintava spec green.
- **Finding 5, aligning MONEY-10's merge with the stop rule (WORKFLOW section 10):** any figure difference in a merge is written on `discrepancy` and moves no status, including a revival; a delivery whose amount Fintava's own record contradicts is written `pending` with the difference on the row. Tests: ₦100 pending row + ₦200 SUCCESS delivery: pending, noted, never asked again; ₦100 absent-failed row + ₦200 delivery: stays failed, noted (same figures: revived, control); w2w ₦15 against Fintava's ₦10: pending, noted. No MONEY-10 spec asserted the old behaviour (38 of 38 unchanged and green).
- **Test gap 6:** a `bill` row with no counterparty, a day old, unknown to Fintava: never failed. Dropping `e.category !== 'bill' &&` is now killed.
- **Mutants** (each alone, restored by sha1): no fresh-first order, no schedule on claim, revival on `discrepancy`, no `xmin` check, no delivery check, no sighting columns, cut-off walk as no row, figures settle status, contradicted delivery settles, bill category ignored: 10 of 10 killed (`no-sighting-columns` first survived; a test was added).
- **Decisions, Default (agent), owner may override:** (1) Fresh rows (recorded or revived within 60 minutes, `LEDGER_STATUS_DEFAULTS.freshMinutes`) go ahead of older ones, so a never-settling backlog cannot delay a new transfer; older rows share what is left, earliest due first. (2) A delivery for a reference, at any time, means Fintava knows it, so absent is never concluded. (3) A fee or total difference is a disagreement as well as an amount (WORKFLOW section 10: any amount). (4) A direct `check()` that waits also moves the row's schedule. Decisions 1 to 6 of round 1 stand; round 1's decision 7 (backoff in memory) is replaced by the schedule on the row.
- **Checks:** `tsc --noEmit` 0; eslint 0 on the 12 changed `.ts` files; `src/fintava src/money` 23 suites, 1,084 passed (ledger 69: status contract 28, ledger contract 26, units 13, status unit 2); the verifier's attack spec 13/13 and backlog spec (100, 400, 3,000) run, not committed; full `test:contract` on fresh seeded `m08b_full_test`, WAWU ID stand-in on :4892: 118 suites, 2,792 passed, 3 skipped, 40 failed, all `fetch failed` in the 4 suites that hard-code `localhost:4001`; those 4 on fresh seeded `m08b_p4001_test` with a mock on :4001 (`lsof` empty before and after, stopped straight after): 40/40, so 2,832 passed, 0 failed; OPS-11 `hub-rate-limits` 10/10; protected `run.sh --fresh 2c5dee8`, lock origin/main e8535d8: 253/253, all 244 required, no lock file touched; gates 16 fail / 9 warn / 76 accepted on 611 files, the same 16 fails as main and round 1, no new warn (the new figures sit under `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)`); `check_baseline.py` passes; CI tripwire 0 added lines; key scan 0 of 58 windows on the backend diff, the sandbox output and the mobile diff. Migrations: main + this then MONEY-12, main + MONEY-12 then this, and all at once: 78 applied each, identical schema dumps. Mobile `npm run check` on the branch: exit 0 (typecheck 0, lint 0, 19 suites / 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks).
- **Sandbox** (`docs/fintava/sandbox/31-money08-status.md`, round 2): 3 GETs; a reference that never existed is still failed as absent in one sweep (the real merchant history gives a complete walk on page 1).
- **Gaps:** G-34 (a revival is not a disagreement and stays swept) and G-35 (webhook disagreements stop too) updated; no new number; no shared-change request.
- **NOT RUN:** bank sends, their FAILURE and `debit_transfer_reversal`, and bills against the sandbox: unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering `400 "Unable to find customers"` (question 17). A real (not locally signed) delivery: unblocked by OPS-10 registering the production webhook URL (G-19). Two built Hub processes: covered in-process by two Nest apps on one database; unblocked by any round that builds `dist/`. A history walk cut off in the real sandbox: the merchant history has never needed more than one page; unblocked by a sender whose history passes 5 pages between a send and its check. V10: no screen.

### Round 1

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-08` 0eb32a9 on main `e8535d8`; mobile `wmt/MONEY-08` on main `176a56d` (neither main moved).
- **Built (`src/money/ledger/`):** `LedgerStatusService` (`ledger-status.service.ts`), exported by `LedgerModule` (no change to `money.module.ts` or `app.module.ts`): `@Cron` every minute over `pending` `FintavaLedgerEntry` rows older than 2 minutes (`LEDGER_STATUS_CHECK_AFTER_MINUTES`, `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)`), oldest first, 50 a pass; `check(entryId)` for one row. Works from the ledger, never the event rows (G-33). The bills sweep's reconcile-pending pattern, on Fintava's status endpoint: our send is asked by our reference through MONEY-06's `reconcile` (lookup, then the sender's history) and `decideFintavaRetry`; anything else (money in, a bill) by its own references (lookup, then by id). `ledger.service.ts`: status rules below, `markAbsentFailed`, `noteDiscrepancy`. `ledger-consumer.service.ts`: `reconcileEntry` now calls `check` instead of duplicating it. `.env.example`; read-only `scripts/fintava/status-sandbox-check.ts`. No route, schema, migration or contract change.
- **What a check does:** SUCCESS: completed. FAILURE/CANCELLED: failed ("Fintava reports this transfer failed."); only Fintava's `debit_transfer_reversal` makes it `reversed`. PENDING, `{}`, unreadable or unreachable: unchanged, asked again after 1, 2, 4 ... 60 minutes (in memory). Fintava's own 404 and no history row for OUR reference, past the money timeout plus resend safety: failed, "Fintava has no record of this transfer, so no money moved." (never for bills, which carry no reference of ours at Fintava, or for references not ours). Another amount at Fintava: a stop: written on `discrepancy`, status not moved, row no longer swept. It never sends money (no resend, no refund) and never sums.
- **Check 1, a withheld webhook settles within one sweep:** `ledger-status.contract.spec.ts` (real database, real MONEY-06 client against the Fintava double with the sandbox's record shapes, deliveries signed locally and posted to MONEY-07's route): WAWU's send found by lookup, completed in one `sweep()` with Fintava's references filled, and the late webhook lands on the same row; a person's bank send with a `{}` lookup found in their history, one sweep; a row under 2 minutes not asked, then settled in the next sweep; money in settled by its own reference; the sweep's check, the webhook and two more checks at once: one row. Sandbox, read only (`docs/fintava/sandbox/31-money08-status.md`): MONEY-10's real ₦10 sends, webhooks withheld, settled in one sweep; a never-used reference failed as absent; a ₦20 row against Fintava's ₦10 recorded, not settled; 8 GETs.
- **Check 2, a transfer Fintava reports failed is reversed exactly once:** same spec: FAILURE with the reversal withheld: one sweep fails it; three checks and a sweep at once change nothing; no POST reached Fintava and no credit row exists; two reversal deliveries consumed at once: one "marked reversed", one "was already reversed", one row with the reversal figures; a late SUCCESS and another check leave it reversed. Reversal first: reversed, then the sweep never asks. Bank sends: NOT RUN in the sandbox (below).
- **Mutations** (each alone, ledger specs re-run, files restored by sha1): absent never failed, completed may become failed, no amount check, bills checked by our reference, no 2-minute age, any non-found answer failed, no revival, a recorded disagreement ignored, no resend window, no failure reason, no rest: 11 of 11 killed.
- **Decisions, Default (agent), owner may override:** (1) U-1: a completed row never becomes `failed`; a later FAILED is recorded on `discrepancy` (`ledgerStatusMayMove('completed','failed')` is false; only a reversal moves a completed row). (2) U-2: `" 10.00 "` stays exactly 1000 kobo (nothing is rounded; MONEY-06's helper unchanged; tested through a status answer). (3) Fintava having no record of our send past the resend window fails the row with no money moved; a later sighting of that reference (a resend under it, or a record Fintava did not serve) undoes it, noted on `discrepancy`. (4) An amount that differs from Fintava's record settles nothing and leaves the row for review. (5) The check returns MONEY-06's decision and never resends; resending under a lock is the sending feature's (G-34). (6) A FAILURE ends `failed`, not `reversed`, until Fintava's reversal arrives (G-35). (7) Every minute, 2 minutes after a row is recorded, backoff in memory (a restart re-checks every waiting row once, harmless).
- **Checks:** `tsc --noEmit` 0; eslint 0 on the 9 changed `.ts` files; ledger, Fintava and webhook specs (`src/money/ledger src/fintava`) 12 suites, 716 passed; the new specs 18 (contract) + 2 (unit); full `test:contract` on a fresh seeded `m08_full_test`, WAWU ID stand-in on :4892: 118 suites, 2,781 passed, 3 skipped, 40 failed, all `fetch failed` in the 4 suites that hard-code `localhost:4001` (`account`, `credits-state`, `kyc-submission`, `privacy-settings`); those 4 on a fresh seeded `m08_p4001_test` with a mock on :4001 (`lsof` empty before and after, stopped straight after): 4/4 suites, 40/40, so 2,821 passed, 0 failed; protected `run.sh --fresh` 253/253, all 244 required (lock `origin/main`; no lock, registry, contract, prisma or protected-suite file touched); gates before 16 fail / 8 warn / 76 accepted (608 files), after 16 / 9 / 76 (611 files): the same 16 fails, the new warn is `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)`; `check_baseline.py` passes; CI tripwire 0 added lines; key scan 0 of 58 windows on the backend diff, the sandbox output and the mobile diff. Mobile `npm run check` on the branch: exit 0 (typecheck 0, lint 0, 19 suites / 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks; the same counts FIX-01 recorded on main, not re-run on main here).
- **Gaps:** G-34 (resends belong to the sending features: WALLET-07, WALLET-09, MONEY-17, MONEY-18), G-35 (a failed bank send whose reversal never arrives, and rows left with a disagreement, for MONEY-16); G-33 notes MONEY-08 is built on the ledger rows. No shared-change request.
- **NOT RUN:** bank sends, their FAILURE and `debit_transfer_reversal`, and bills against the sandbox: the sandbox refuses every payout with `400 "Unable to find customers"` (question 17); unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers". A real (not locally signed) delivery: unblocked by OPS-10 registering the production webhook URL (G-19). V10: no screen.

## Verifier report

### Verifier report (round 2)

Verifier, 3 Oct 2026 (a session that wrote none of this code and did not verify round 1). **Verdict: round 1's 4 defects are closed, but 2 new defects are open; status back to `building`.** The schedule, the revival, the absent compare-and-set and the cut-off walk all hold under attack, and nothing moves money. The new defects are both places where the round-2 rule ("only certain absence fails a row; any figure difference is a recorded stop") still has a gap: a reversal with other figures, and a history page that is empty while Fintava says more pages follow.

Checked at backend `wmt/MONEY-08` 2c5dee8 and mobile `wmt/MONEY-08` caa870c, in fresh detached worktrees. Neither main moved (backend origin/main e8535d8, mobile origin/main 176a56d), so no merge was needed. Round 1's code (0eb32a9) was exported next to it to reproduce each old defect. Evidence is in the verifier session's scratchpad `vm08r2/` (file names below). The attack spec `vm08r2-attack.contract.spec.ts` (20 tests, built on round 1's harness) is kept there, out of the branch. Round 1's `vm08-attack` and `vm08-backlog` specs were rerun on both commits.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | On a clean export of 2c5dee8: `tsc --noEmit` 0 (`tsc.log`); eslint on the 12 changed `.ts` files exit 0 (`eslint.log`). Gates: main e8535d8 16 fail / 8 warn / 76 accepted on 608 files; branch 16 / 9 / 76 on 611 files. The same 16 fails; the only added warn is `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)` (`gates-main.json`, `gates-branch.json`). `check_baseline.py`: 108 entries, exit 0. CI tripwire: 0 added lines outside the protected suite's files match `test/protected-routes`, `src/protected-routes`, `compareShape` or `protected-registry`. Key scan: 0 hits for any of the 58 eight-character windows across the backend diff, the mobile diff, the sandbox output and every evidence log, and the staged commit of this report. Mobile `npm run check` at caa870c: exit 0, typecheck 0, lint 0, 19 suites / 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks (`mobile-check-before.log`). |
| V2 Contract | passed | No route; contract unchanged. Ledger specs on the branch: status contract 29, ledger contract 25, units 13, status unit 2, all green. A Postgres session in `Africa/Lagos` time (not UTC) runs the same 69 green (`tz-ledger.log`), so the `::timestamp(3)` casts in the claim are not hour-shifted. |
| V3 Regression | passed | `run.sh --fresh 2c5dee8`, lock origin/main e8535d8: 253/253, all 244 required (`protected.log`); lock files differ from main by 0 lines. Full `test:contract` on fresh seeded `vm08r2_full_test`, mock WAWU ID on :4912: 118 suites, 2,792 passed, 3 skipped, 40 failed, all `fetch failed` in the 4 suites that hard-code `localhost:4001` (`full.json`). Those 4 on fresh seeded `vm08r2_p4001_test` with a mock on :4001 (`lsof` empty before and after; stopped straight after): 4/4 suites, 40/40 (`p4001.json`). So 2,832 passed, 0 failed. OPS-11 `hub-rate-limits` 10/10. Every Fintava spec green. A first full run was discarded: it overlapped a mutant run in the same export. |
| V6 States | failed (defect 2) | Round 1's 19 answer shapes for our send past the window (`A8`) give the same outcome on 2c5dee8 as on 0eb32a9: only Fintava's 404 "Transaction not found!" plus an empty history fails the row. History walks (`B3`): 8 or 6 pages with our send nowhere: waiting `history_incomplete`, 5 pages read; exactly 5 pages ending with `hasNextPage` false: failed as absent (a complete walk); `since` reached on page 3 of 8: failed as absent after 3 pages; our send on page 5: completed; on page 6: waiting. An empty page while `hasNextPage` is true: defect 2. Bills and references not ours, a day old, never failed (`A9`; `B5` adds category `bill` with no counterparty on a customer wallet: waiting, swept, still pending). |
| V8 Money attack | failed (defects 1, 2) | Below. |
| V9 Live seam | passed (partial) | 3 read-only GETs to dev.fintavapay.com (`sandbox.json`). `/transaction/reference/VM08R2-SBX-20261003065725-ABSENT`: 404 "Transaction not found!" with no `data`. `/txn/merchant?page=1&take=1`: 39 pages, `hasNextPage` true. `/txn/merchant?page=40&take=1` (past the end): no rows, `hasNextPage` false. So the real sandbox ends a walk cleanly, and defect 2 needs a malformed page. A built Hub on :4911/:4913 was not run; two Nest apps on one database stood in for two instances. Sign-in leg: no route. |

**Round 1's defects, reproduced on 0eb32a9 and closed on 2c5dee8** (`attack-old.json` against `attack-new.json`, `backlog-old-*.log`, `backlog-new-*.log`)

1. Backlog starvation: closed. A new send with Fintava at SUCCESS and its webhook withheld settled after 5, 39 and never (75 passes) behind 100, 400 and 3,000 waiting rows on 0eb32a9. On 2c5dee8 it settled after 0 extra passes each time (100 Fintava requests a pass, 50 checks).
   - Right after a restart (`B1a`): 3,000 rows checked 10 times before, all due, and a brand-new instance. Its first pass settled the new row, 50 claims, 100 requests.
   - Steady state (`B1b`, 150 passes, 3,000 waiting rows, one new SUCCESS send a minute, a new instance at pass 75): 150 of 150 settled in the pass they fell due. At most 50 claims a pass. Every backlog row was asked (0 never), at most 3 times, 61 to 62 minutes apart.
2. Revival kept apart: closed. `A5`: 0 Fintava calls and `discrepancy` set on 0eb32a9; one call, completed, `discrepancy` null on 2c5dee8. A webhook revival (`B2`, after the verdict): pending, `revivedAt` set, `revivedBy` webhook, `nextCheckAt` null, `statusChecks` 0, no `discrepancy`.
3. Absent against a racing delivery: closed. `A6` failed the row on 0eb32a9 and leaves it pending on 2c5dee8. `B2`: our bank send past the window, `/txn` held 1.2 s, and a PENDING delivery at +0, 100, 300, 600, 1,000 and 1,150 ms. Consumed: 6 of 6 pending, "seen meanwhile, so not absent". Only stored: 6 of 6 pending. A resend recorded under the same reference: 6 of 6 pending. Control, a delivery naming another reference: 6 of 6 failed as absent, so the check is not over-blocking.
4. Cut-off walk: closed. `A10` failed after 5 pages on 0eb32a9 and waits (`history_incomplete`) on 2c5dee8. One gap remains: defect 2.

**V8, round 2**

- **Claim and `xmin` (`B1f`).** The claim leaves `updatedAt` unchanged. It moves `xmin` (915069 to 915070), `statusChecks` 0 to 1 and sets `nextCheckAt`. The check reads the version after its own claim, so the claim never defeats its own compare-and-set. Absent is reached through `sweep()`:
  - 3 of 3 rows on one instance;
  - 5 of 5 rows with two instances sweeping at once (one instance claimed all 5);
  - a direct `check()` racing a sweep on the same row, 5 times: always failed once. The loser answers `waiting` with decision `wait`, so it never gives resend advice.
- **Backoff (`B1e`).** A recent row was asked at minutes 2, 3, 5, 9, 17, 33, 65, 125, 185. That is the 1, 2, 4 ... 60 schedule, capped at 60. A new instance at minute 20 did not re-ask. In every `B1c` run, 0 recent-row checks came sooner than their rest.
- **Repeated revivals (`B1d`).** The worst case is a send failed as absent and resent at once every time, over 120 passes: 7 revivals, 35 checks, at most 1 check in any pass, one cycle every 17 minutes (the resend window decides it). A revived row is fresh again, but the claim moves its `nextCheckAt`, so it cannot take more than one slot a pass.
- **Opposite starvation (`B1c`, the fresh-first order; `r2-starve.json`).** 100 old rows fall due at passes 61 to 70, once the fresh queue is steady. The oldest due row is due at pass 60 and Fintava says SUCCESS. Inflow lasts 150 passes, then 60 passes with no inflow. The table gives when the old rows were first asked:

  | New rows a minute | Oldest due row settled | All old rows asked by | New rows' first check after falling due |
  |---|---|---|---|
  | 0, 5 (pending at Fintava) | pass 60 | pass 70 | 0 min |
  | 8 (pending) | pass 60 | pass 139 | 0 min |
  | 9 (pending) | pass 160 (10 after the inflow stopped) | pass 166 | median 1, max 3 min |
  | 12 (pending) | pass 180 | pass 187 | median 7, max 11 min |
  | 30 (pending) | not within the 60 passes after | never | median 26, max 31 min |
  | 45 (SUCCESS on first check) | pass 60 | pass 81 | 0 min |
  | 60 (SUCCESS on first check) | pass 180 | pass 181 | median 15, max 30 min |

  A row recorded in the last hour needs 6 checks in that hour. So per instance, older due rows get nothing while either holds: about 8.4 or more new rows a minute stay pending at Fintava for their first hour, or 50 or more new rows a minute need the sweep at all (webhooks down). They get nothing for as long as that lasts, plus up to an hour. The 60-minute cap on the rest does not hold then. Judgement: an acceptable trade-off, not a defect. It needs a sustained overload of 12,000 or more stuck sends a day per instance. In that overload, fresh rows themselves wait 7 to 30 minutes, so no fixed order of 50 slots meets "within one sweep". It moves no money and writes no wrong status. A row Fintava has not settled in an hour is the least likely to settle now, and it is served earliest-due-first once the load drops. Recorded as finding 4.
- **The webhook amount rule (`B4`, `B4b`, `B4d`; a pending ₦100 bank send with fee ₦30.75).**
  - These all end pending, with the difference written on `discrepancy`: ₦100.01; ₦99.99; total 1 kobo off; a fee-inclusive amount (130.75 as `amount`); a fee-exclusive total (total 100); a FAILED delivery for ₦200.
  - The control, same figures, completes.
  - After a stop the sweep never asks again (0 requests).
  - Confirm path (no row held, a w2w delivery of ₦10 that Fintava's record calls ₦10.01): both sides pending, noted.
  - Revival with ₦100.01: stays failed, noted. A resend recorded at ₦10.01 on a ₦10.00 row failed as absent: stays failed, noted.
  - Two deliveries with different amounts: a PENDING ₦200 then a SUCCESS ₦300 stays pending with both notes.
  - Matching after mismatching (PENDING ₦200 then SUCCESS ₦100, or SUCCESS ₦200 then SUCCESSFUL ₦100): completed, with the earlier note kept. Mismatching after matching: completed, noted. Both orders end the same.
  - Race, 5 times: a matching and a mismatching delivery consumed at once with two status checks. Each run: 1 row, completed, noted.
  - Two deliveries with the same status: finding 1.
- **MONEY-10's specs.** Round 2 changed none: `ledger.contract.spec.ts` is identical to main, and `ledger-units.spec.ts` differs only by round 1's two added assertions for U-1 (`completed` never becomes `failed`; `pending` may become `failed`). That addition is justified, because U-1 changed that rule (`MAY_BECOME.failed`). No MONEY-10 spec asserted the old "settle and note" behaviour, so none had to change for the new rule. No MONEY-10 spec pins the new rule either; the builder's status spec does.
- **Old guarantees.**
  - Never a send. Every request in every attack file was a GET: 154 in round 1's attack spec, 358 in the run of `B1a`, `B1d` to `B1f` and `B2` to `B6`, and every request of the schedule runs.
  - One row per movement: round 1's `A1` and `A3` (two instances, webhook, checks) are green on 2c5dee8 with no discrepancy, and so is `B4d`'s race.
  - A failed transfer is reversed once (`A2`, 5 of 5).
  - An amount difference stops (`A7`, unchanged from round 1).
  - Absent happens only on the documented 404 plus a complete walk, with the exception in defect 2. It never happens for bills (`A9`, `B5`) or for references that are not ours.
- **Schedule columns.**
  - The migration is additive: 4 columns and 1 index; no existing column, index or row is touched.
  - It applies on a fresh database, and on a main database holding a pending row, which then reads `nextCheckAt` null and `statusChecks` 0.
  - With MONEY-12 (`wmt/MONEY-12` d056461, `20261003100000_wallet_opening`) it applies in three orders, 78 migrations each: A (main and this, then MONEY-12, applied out of name order), B (main and MONEY-12, then this) and C (all at once). The schema dumps are identical except for pg_dump's random `\restrict` token (`migrations.log`, `schema-mig*.sql`). Drift against the schema is only the old `ContentPiece_specializations_idx`.
  - A local merge of the two branches (tree 7094234, never pushed) has no conflict, and `tsc --noEmit` on it exits 0 (`merged-tsc.log`).
  - Nothing grows without bound: no per-row memory in the service; `statusChecks` grows by at most one an hour per row.
  - `EXPLAIN ANALYZE` of the claim on 213,100 rows (200,000 completed, 12,800 pending, 500 with a disagreement): 9.9 ms (`explain.txt`). The planner uses only the `status` prefix of an index, because `COALESCE(nextCheckAt, ...)` cannot use one: it took `(status, occurredAt)`, and took the new `(status, nextCheckAt)` only when the other was dropped (finding 5).
- **Spot mutants** (each alone in a clean export, `src/money/ledger` and `src/fintava` specs, 727 tests, every file restored to its sha1, `mut-*.log`):
  - Killed: `check()` not moving the schedule (5 fail).
  - Survived, as test gaps: a revival that keeps the old `nextCheckAt` and `statusChecks`; the claim taking rows that hold a disagreement (they then fill slots with no Fintava call); and the walk no longer treating an empty page as complete (defect 2, which no test pins either way).

**Findings**

1. `defect` A reversal with other figures settles silently. `applyReversal` (MONEY-10's, unchanged here) compares nothing. A `debit_transfer_reversal` marks the row `reversed` and stores Fintava's figures in `reversalAmountKobo` and `reversalTotalKobo`, but writes no `discrepancy`. That holds whatever the figures (`B4c`):
   - ₦200 back for a ₦100 send;
   - ₦100.01 or ₦99.99 back;
   - ₦200 back for a send that was `completed`.
   
   These all end `reversed` with `discrepancy` null. The round-2 rule, and WORKFLOW section 10 ("our ledger and Fintava disagree, by any amount"), stop a SUCCESS delivery that is 1 kobo off, while a reversal 100 kobo off passes unrecorded. MONEY-16 reads disagreements from `discrepancy`, so it would not see these. Capability check 2 ("reversed exactly once") is this task's.
   
   Reproduce: our ₦100 bank send, fee ₦30.75; the status check finds FAILED; then consume a reversal with `amount` 200, `charges` 30.75, `total` 230.75. The row ends `reversed` with `discrepancy` null.
   
   A reversal of 100 with charges 0 and total 100 (Fintava keeps its fee) is also unrecorded. Whether a kept fee is a disagreement or the expected behaviour is `unclear` until a real reversal is seen (question 17).
2. `defect` (latent) An empty history page counts as a complete walk even when Fintava says more pages follow. `findInHistory` (`src/fintava/fintava-client.ts`) returns `null` (complete) on `rows.items.length === 0` regardless of `hasNextPage`. With a 404 lookup, `reconcile` then answers `absent`. The check fails the row ("no money moved") and hands MONEY-06's resend advice: `resend_same_reference` for a wallet-to-wallet send, which is a second payment if the first exists further down.
   
   `B3`: page 1 empty with `hasNextPage` true and 8 pages: failed as absent after reading 1 page. Page 3 empty: failed after 3 pages of 8. That is the "an incomplete history walk is unknown, never absent" rule this round set.
   
   The real sandbox answers a page past the end with no rows and `hasNextPage` false (`sandbox.json`). So this needs a malformed page plus a 404 for a send that exists, the same class as round 1's defect 4.
   
   Reproduce: our merchant send past the window, lookup 404, and `/txn/merchant` answering page 1 with `data: []` and `meta.hasNextPage: true`, `pageCount: 8`. `check` gives `failed_absent`. Removing the empty-page condition survives all 727 specs, so no test pins it.
3. `unclear` (MONEY-07's area) A second delivery with the same status and another amount never reaches the ledger. The webhook store's unique key is event, reference and status. A SUCCESS ₦100 then a SUCCESS ₦200 for the same send: the route answers 200 and stores nothing for the second, so the row stays `completed` with `discrepancy` null (`B4`: "not stored (MONEY-07 duplicate key)"). Fintava contradicting itself is then lost without a trace. When the mismatching one comes first, the matching one is dropped and the row stays pending with the note (safe side). Another status (SUCCESSFUL, PENDING) is stored and handled as above. This belongs with MONEY-07 (a gap row for it), not this task's code.
4. `unclear` Under sustained overload the fresh-first order stops checking rows older than an hour (numbers in the `B1c` table). Judged acceptable above. If the owner wants a hard bound, a reserved share of each pass for the earliest due rows gives one. The 60-minute cap ("backoff caps at 60 minutes") holds only while the due demand fits 50 a pass per instance: a never-settling backlog of 3,000 rows per instance with nothing new, or less with inflow. `B1b` measured 61 to 62 minutes at exactly that load.
5. Note: the new index `(status, nextCheckAt)` is not what the claim uses; either `status`-prefixed index serves it, at 9.9 ms for 12,800 pending rows. It costs an index write on every claim. It is harmless, but it does not do what the migration comment says.
6. `unclear` A fee-only difference ends differently depending on which source arrives first (`B4b`: our row fee ₦40, Fintava's charges ₦30.75). If the webhook comes first, the row stays `pending` with the note, and the sweep never asks again. If the sweep comes first, the row is `completed` (lookups carry no fee), and the late webhook adds the note. It is noted either way, which is the builder's decision 3. But it means every bank send whose sender records a fee other than Fintava's charges stays `pending` for review once its webhook arrives. The sending features (WALLET-07, WALLET-09) must record Fintava's charge, not the quoted one, or each such send stops.

**NOT RUN**

- Bank sends, their FAILURE and `debit_transfer_reversal`, and bills against the sandbox: the sandbox refuses every payout. Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering `400 "Unable to find customers"` (question 17).
- A real (not locally signed) delivery: unblocked by OPS-10 registering the production webhook URL (G-19).
- Two built Hub processes on :4911/:4913: covered in-process by two Nest apps on one database. Unblocked by a round that builds `dist/` from this branch.
- A history walk cut off, or an empty page with `hasNextPage` true, in the real sandbox: the merchant history has 39 rows and ends cleanly. Unblocked by a sender whose history passes 5 pages between a send and its check.
- "Ledger equals Fintava balance": the sweep never sums. Unblocked by MONEY-16's reconciliation.
- V10: no screen.

### Verifier report (round 1)

Verifier, 3 Oct 2026 (a session that wrote none of this code). **Verdict: 4 open defects; status back to `building`.** The sweep never moves money, never double-counts under races, and stops on every amount difference. The defects are in when it checks a row and when it may call a send absent.

Checked at backend `wmt/MONEY-08` 0eb32a9 and mobile `wmt/MONEY-08` 20404c1, in fresh detached worktrees. Neither main moved (backend origin/main e8535d8, mobile origin/main 176a56d are the merge bases), so no merge was needed. Evidence is in the verifier session's scratchpad `vm08/` (file names below). The attack specs `vm08-attack.contract.spec.ts` (13 tests) and `vm08-backlog.contract.spec.ts` are kept there, out of the branch.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0; eslint on the 9 changed `.ts` files exit 0 (`tsc.log`, `eslint.log`). Gates: main e8535d8 16 fail / 8 warn / 76 accepted on 608 files; branch 16 / 9 / 76 on 611 files. The same 16 fails line for line; the only added warn is `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)` (`gates-main.log`, `gates-branch.log`). `check_baseline.py` exit 0. CI tripwire: 0 added lines outside the protected suite's files match `test/protected-routes`, `src/protected-routes`, `compareShape` or `protected-registry`. Key scan: 0 of 58 eight-character windows in the backend diff, the mobile diff or the sandbox output. Mobile `npm run check` at 20404c1: exit 0, 19 suites / 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks (`mobile-check-before.log`). |
| V2 Contract | passed | No route; contract unchanged. Builder's status specs 18/18 and 2/2, ledger 25/25, units 13/13, Fintava and webhook specs green in the full run. Unexpected formats through a status answer (`A7`): `"100.01"`, `"99.99"`, fee-inclusive `"130.75"`, `"-100.00"`, `"0.00"` are each `disagrees`, recorded on `discrepancy`, status pending, never asked again by either instance. `"100.001"`, `"1,00.00"`, `""`, `"1e2"` wait unread. `100`, `100.0`, `"100"`, `" 100.00 "` settle as 10,000 kobo (U-2). |
| V3 Regression | passed | `run.sh --fresh 0eb32a9`, lock origin/main e8535d8: 253/253 (244 required) (`protected.log`). Full `test:contract` on fresh seeded `vm08_full_test`, mock WAWU ID on :4912: 118 suites, 2,778 passed, 3 skipped, 43 failed (`full2.json`). All 43 are in 7 suites that mint or check tokens on :4001 (`account`, `credits-state`, `kyc-submission`, `privacy-settings`, `notification`, `saved-item`, `blocked-account`), each a 401. Those 7 then ran on fresh `vm08_p4001_test` with a mock on :4001 (`lsof` empty before and after; stopped straight after): 8 suites, 71/71 (`p4001.json`). So 2,821 passed, 0 failed. OPS-11 `hub-rate-limits` 10/10. |
| V6 States | passed | Every answer shape for our send past the window (`A8`), all left pending and asked again later: a `{}` lookup, `data` missing, `data: null`, HTML 200, 500, 502 HTML, 429, 401, hang-up, a 404 that stalls past the 2 s timeout (ended at 2.0 s, FIX-01), `404 Cannot GET`, 404 "Customer not found", 404 with two messages, an empty 404, a record for another reference, a found PENDING, and a 404 lookup with the history call stalled. Only Fintava's 404 "Transaction not found!" (any case, `!` optional, MONEY-06's rule) with an empty history fails the row. Never failed, even a day old (`A9`): category `bill`; a `biller` counterparty under `purchase`; an out row with only Fintava's reference; an in row; a user out row whose wallet number differs. |
| V8 Money attack | failed | Defects 1 to 4 below. What held is listed after the findings. |
| V9 Live seam | passed (partial) | 3 read-only GETs to dev.fintavapay.com (`sandbox.json`). `/transaction/reference/MONEY08-SBX-20261003053150-ABSENT` answered 404 "Transaction not found!". `.../MONEY10-SBX-20261002201756-1` answered 200 SUCCESS `"10.00"`. Customer A's `/txn` answered newest first (10 rows, 21:11 down to 09:40 on 2 Oct), so MONEY-06's history walk reads the right end. This matches `31-money08-status.md`. A built Hub on :4911/:4913 was not run: two Nest apps on one database stood in for two instances (`A1` to `A3`). Sign-in leg: no route. |

**Findings**

1. `defect`: a backlog starves new rows. The sweep takes the 50 oldest rows that are not resting, and its backoff is held in memory. Rows Fintava cannot settle stay pending and are asked forever at most an hour apart. That includes the orphan `PENDING` records of refused bank sends (`14-`) and money-in rows, which history never lists. With the real service (`vm08-backlog.contract.spec.ts`, `backlog-results.txt`), a new send that Fintava reports SUCCESS, with its webhook withheld, settles after:
   - 5 one-minute sweeps behind 100 waiting rows (fresh process, so after any restart or deploy);
   - 39 sweeps behind 400 waiting rows;
   - not within 75 sweeps behind 3,000 waiting rows.

   The selection model, which matches the real runs exactly (`sim.js`, `sim-output.txt`), gives 2 h behind 1,000 rows and 6 h behind 2,000. In steady state it gives 60 min behind 2,000 rows, and never behind 3,000 (demand 3,000 / 60 = 50 a minute fills every pass). Capability check 1 ("settles within one sweep") then fails. Load on Fintava stays bounded (50 checks a pass per instance, at most about 7 GETs each).

   Reproduce: N pending out rows a day old whose lookup answers `{}`, plus one 3-minute-old row with a SUCCESS lookup. Call `sweep(base + k minutes)` for k = 0, 1, 2 ... and count the passes until the new row is `completed`.
2. `defect`: a resend is never swept. Decision 3 and G-34 name this case: a wallet-to-wallet send failed as absent, then the sending feature resends under the same reference (MONEY-06's `resend_same_reference`). The revival writes "send sighting: status failed (no record at Fintava) vs pending" on `discrepancy`. The sweep skips every row with a discrepancy, and `check` returns `disagrees` without asking. So when Fintava then reports SUCCESS and the webhook is withheld, the row stays `pending` forever: 0 Fintava calls in sweeps at +5 min and +120 min on two instances (`A5`). The note also tells MONEY-16 that our ledger and Fintava disagree when they do not.

   Reproduce: `sent`, age 11 min, `check` → `failed_absent`; `ledger.record({... status: 'pending', references: { customerReference }, source: 'send' })`; lookup now SUCCESS; `sweep()` → nothing is asked and the row stays pending.
3. `defect`: absent races a delivery. `markAbsentFailed` re-checks only `status = 'pending'` and `discrepancy IS NULL`. It does not check whether a sighting landed after the check read the row. Our bank send, past the window: the lookup answers 404, and while the history call is in flight a signed `customer_bank_transfer` delivery with status PENDING is consumed onto the row. The check then marks it `failed`, "Fintava has no record of this transfer, so no money moved.", with no note. The same delivery a moment later instead revives it to `pending` (`A6`), so the final state depends on timing.

   Reproduce: delay `/txn` by 1.2 s, start `check`, consume the delivery at +300 ms, and read the row.
4. `defect` (latent, in MONEY-06's `findInHistory`, made consequential here): a cut-off history walk counts as "no row". The walk stops after 5 pages (`RECONCILE_MAX_PAGES`) and returns null even while `hasNextPage` is true and it has not reached `since`. With a 404 lookup, that reads as `absent`. WAWU's send sat on merchant history page 6 of 8, every row newer than `since`, and the check failed it as "no money moved" after reading 5 pages (`A10`). The documented absent rule needs "no row in the sender's history", and an unfinished walk has not shown that. It needs the lookup to 404 a send that exists, which the sandbox has not shown.
5. `unclear`: a disagreeing figure still settles through a webhook. A SUCCESS delivery for ₦200 on a pending ₦100 row completes it and records the amounts on `discrepancy` (MONEY-10's merge, `A4b`). The revival inherits this: an absent-failed ₦100 row becomes `completed` from a ₦200 delivery, noted (`A4`). The status check itself never settles a difference (decision 4). Whether a delivery with another figure may move the status at all is MONEY-10's rule, not this task's.
6. Test gap, not a defect: dropping `e.category !== 'bill' &&` survives the builder's 18 specs, because its bill row also has a `biller` counterparty. My `A9` covers category `bill` alone. Three other one-line mutants were each applied alone and restored to the same sha1 (`mut-*.log`): no amount check, no 2-minute floor, and no backoff. The builder's specs kill all three.
7. Note: `retryAt` keeps an entry for every row that ever waited, including rows later settled by a webhook. It never shrinks: slow memory growth, and a restart clears it.

**What held (V8)**

- **Never moves money.** The status service calls only `reconcile`, `getTransactionByReference`, `getTransactionById`, `environment` and `settings`. 182 requests across every attack shape, all GET.
- **Exactly once.** These ran in parallel: two instances' sweeps, a check from each, and a w2w SUCCESS delivery, 5 times. Each run ended with one out row `completed`, no discrepancy, and one in row (`A1`).
- **FAILURE and reversal.** FAILURE was swept by two instances while two reversal deliveries were consumed and another check ran, 5 times. Each run ended with one row `reversed` with the reversal figures, one "marked reversed", no credit row and no POST (`A2`).
- **Absent against a SUCCESS delivery.** Raced on two instances, 6 times: every run ended `completed`, one row (`A3`).
- **completed to failed (U-1).** Refused and recorded (builder spec, re-run green).
- **Window boundary.** One millisecond inside 630,000 ms waits (`too_soon`); at the boundary the row fails. A row touched recently (`updatedAt`) waits even when `createdAt` is old (`A11`).

**NOT RUN**

- Bank sends, their FAILURE and `debit_transfer_reversal`, and bills against the sandbox: the sandbox refuses every payout. Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering `400 "Unable to find customers"` (question 17).
- A real (not locally signed) delivery: unblocked by OPS-10 registering the production webhook URL (G-19).
- Two built Hub processes on :4911/:4913: covered in-process as above. Unblocked by any later round that builds `dist/`.
- "Ledger equals Fintava balance": the sweep never sums. Unblocked by MONEY-16's reconciliation.
- V10: no screen.


## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
