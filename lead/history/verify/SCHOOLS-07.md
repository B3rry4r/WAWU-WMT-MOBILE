# SCHOOLS-07 verifier report, ROUND 2 (lean) (backend wmt/SCHOOLS-07 87fa39e on 79b24be; mobile 66b674a docs only)

Verdict: MERGE (nothing medium or worse).

Round-1 report (verdict FIX, one medium) is kept below the line for the record.

## Round-2 findings against round 1
1. Finding 1 (MEDIUM, stuck fee after re-enrolling): FIXED. T14 (pay, order set released, enrol same course other class, school_fee
   onCompleted): onCompleted fulfilled, old order refunded, hold refunded, new order stays reserved, exactly 1 refund send; replaying the
   completion twice in parallel plus a sweep: still 1 refund send, 1 live order. T18 (new): revived completion x2 racing 3 enrols of the
   same course, 8 rounds: 0 rejections, 0 5xx, 1 live order, seats = live, old order enrolled/held (retake won every round; the other
   interleaving is T14), no stuck `released`.
2. Finding 2 (LOW, cap race): FIXED. T3 8 parallel enrols for 8 courses: 3x201, 5x409 reservation_limit, reserved = 3, seats = 3 (round 1: 5).
3. Finding 3 (LOW, false payment_in_progress): FIXED. T2b 12 alternating parallel enrols across 2 classes of one course: 12x201, 0 payment_in_progress,
   1 live order, 1 seat. Code: payment_in_progress is thrown only when `openPayment()` finds a pending/completed payment.
4. Finding 4 (LOW, hide while a payment is in the air): moved. Row added to tasks/SWEEP-MONEY.md (SCHOOLS-07 V-4), count 60 to 61.
5. LOW, not new in round 2: eslint --no-fix on the builder's school-enrolment.contract.spec.ts reports 1 error (no-unsafe-assignment on
   `expect.stringMatching`, line 1040; line 913 at 79b24be, same text). No CI job lints specs. Sweep it, no round.

## Checks (all against 87fa39e, real Postgres, in-process harness with the Fintava double; scratch spec
`schools-07-v2/zz-verify-r2.contract.spec.ts.txt`)
- T1 30 parallel for 3 seats: 3x201, 27 class_full, seats 3. T1b expired places + 2 sweeps: 3 in, seats 3.
- T2 same student 10 parallel: 1 order, 1 seat.
- T12 mixed stress (24 students, 6 classes, enrol/pay/expire/sweep at once, 12 rounds), seeds 7, 11, 23, 99: seatsTaken == live orders and <= capacity every round;
  completed payments 16/15/15/15 = enrolled = debits, bad=[].
- T16 lock, in-process: 20 parallel enrols for ONE student (8 courses x 2 classes) + 20 other students' pays + the student's own pay, provider answer 3 s:
  all pays 201 in 4.2 s; other person's read + course read 8 to 13 ms; sampled every 40 ms: longest idle-in-transaction 0.14 s, longest transaction of
  any backend holding an advisory lock 0.13 s (nothing held across the 3 s call); up to 7 backends waiting on the lock at once, cap held (reserved <= 3).
- T17 live stack Hub over HTTP: 20 parallel POST enrols for one student + another person's GET /api/hub/users/me: 12x201/8x409 mix ending reserved = 3;
  users/me 4 to 136 ms (limit 1000), enrol burst done in 0.5 s. Pool not starved.
- Code read: claim() runs only tx statements after the lock (no this.prisma, no provider call inside any of the three transactions); read committed default.
- CI 87fa39e: suite x3, netns, contract, deploy-test-in-sync, baseline, Protected routes success; Executable gates failed with the same 5 FAIL lines as
  79b24be and base (admin-notifications.controller:40, compose-campaign.dto:44, notification-event:496, flutterwave-wallet.gateway:72, content-piece.service:48), none in schools.
- Mobile 66b674a vs aad9af2: 5 doc files only (LOG, PROGRESS, task files), no src or app change.
- Not run: real providers (none), V5 (no screens), the builder's full suite (CI did). Stack schools_07 down, DB dropped, worktree removed, 7420-7427 closed.

---
(Round 1, 79b24be) Verdict FIX: finding 1 medium (stuck fee after the student chose the course again), findings 2 and 3 low, finding 4 low note.
Round-1 attacks that passed are unchanged by this diff (two files only: school-enrolment.service.ts and its spec; no migration, no contract change).
