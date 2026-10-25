---
id: FIX-69
title: The school places take their locks in one order, and the release sweep logs why it failed
owner: YOU
area: FIX
order: -69
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
tier: T1
depends_on: []
decisions: [R-12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-69 · The school places take their locks in one order, and the release sweep logs why it failed

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 17.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-69.md`: the lock order holds at every site in `src/schools`; the 7 lock tests fail on the old code with real `40P01` deadlocks and pass now; the log names codes only). Backend `wmt/FIX-69` `1ddf5b1`, this record `8fd7e86a`. Stacked in batch 17 by MERGE-17 (backend `wmt/MERGE-17`, mobile `wmt/MERGE-17`); not on main.
- **Merge (MERGE-17):** no code conflict. BACKEND_GAPS.md keeps G-FIX-68-3 (marked closed by G-FIX-69-1) and G-FIX-69-1. The verifier's lows are SWEEP-MONEY rows FIX-69 L1, L2 and N1.
- **Branches:** backend `wmt/FIX-69` from `origin/wmt/MERGE-15` `a6071fb` (head in the lead's hand-back); this record on mobile `wmt/FIX-69` from `origin/wmt/MERGE-15` `6535bb83`. No schema, no migration, no route, no money rule, no app code, no Fintava file.
- **Why:** CHECK-1 saw one `release of unpaid school places failed (PrismaClientKnownRequestError)` (F-5). The line printed the class name only, so a timeout could not be told from a deadlock; and the code could deadlock for real (G-FIX-68-3, row on `wmt/FIX-68` `17b9466a`).
- **The log:** the line now names the Prisma code, the Postgres state and the model (`PrismaClientKnownRequestError, prisma P2010, postgres 40P01; models SchoolEnrolment and CourseIntake`). It never prints the message, the query or the arguments (they can hold a person's details); each part is checked against a strict shape first. `school-enrolment-failure.ts`.
- **The lock order found and fixed:** the student's advisory lock, then enrolment rows, then class (intake) rows lowest id first, in one statement (`lockIntakes`, `FOR NO KEY UPDATE`).
  - Swap (`claim`): released the old place and gave back its class, then took the new class: old class, then new, so A to B against B to A crossed. Now the old and new class are locked together, id order.
  - Sweep (`releaseExpired`) and `giveBack`: went through classes in the order the database returned them (a hash order). Now id order, and nothing is locked when there is nothing to give back.
  - Payment arriving for a released place (`retake`): took the class, then the order row, and had no student lock, so it could cross a swap by the same student on the one-live-order index. Now the student's lock, the order row, then the class.
  - Settlement refund (`decide`, SCHOOLS-11) and the admin intake edit: one enrolment then one class, one class: already in the order, unchanged.
- **Specs (new):** `school-enrolment-failure.spec.ts` (5, no database); `school-enrolment-locks.contract.spec.ts` (7, real database, Nuvion at the seam): the order shown by holding one class from outside and asking which rows the blocked call holds (swap, sweep over 8 pairs of classes, retake); 20 rounds of a payment against the same student's swap; 25 rounds of 6 crossed swaps and 2 sweeps at once with 2 paid places and 2 in-flight payments among them (no error, seats equal places, one place per student, every hold, payment and paid place identical before and after); the log; a real deadlock read as `40P01`. On the old code 5 of the 7 fail, the stress one with a real `40P01` in its first run.
- **Not run (rule):** `school-enrolment.contract.spec.ts` and `school-settlement.contract.spec.ts` use the Fintava double. They cover `retake` and the refund; CI runs them.
- **Open findings:** none. Lows: none.
- **Next:** the batch 17 pull request (the lead). `wmt/FIX-68` and `wmt/FIX-69` both append to `BACKEND_GAPS.md`; MERGE-17 kept both rows.

Status set to review by the records sync, 25 Oct 2026: merged as backend 33b627f0, verifier PASS in the lead's merge log, 18 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `BACKEND_GAPS.md` G-FIX-68-3 (on `wmt/FIX-68`); DECISIONS R-12; `src/schools/enrolment/school-enrolment.service.ts` in `wawu-backend`

## Goal

Two swaps on the same two classes, a swap against the sweep, and two sweeps at once can no longer deadlock, and a failure of the sweep says whether it was a timeout or a deadlock.

## Scope (backend only)

`src/schools/enrolment/school-enrolment.service.ts` (lock order, sweep log), `school-enrolment-failure.ts` (new), two new specs. Nothing else.

## Capability checks

- [x] A swap from the higher class to the lower holds the lower class while it waits for the higher one.
- [x] The sweep holds the lower class while it waits for the higher one, in 8 of 8 pairs of classes.
- [x] A payment arriving for a released place holds its order row while it waits for the class.
- [x] 25 rounds of crossed swaps and two sweeps: no deadlock, no place lost or doubled, every held fee where it was.
- [x] The log names the code and model and none of an error's text.

## Owner sign-off

Not needed.
