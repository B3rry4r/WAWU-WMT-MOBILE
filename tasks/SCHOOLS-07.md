---
id: SCHOOLS-07
title: Enrol in a course and pay from the wallet (backend)
owner: YOU
area: SCHOOLS
order: 125
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-18, MONEY-13, MONEY-16, WALLET-15, SCHOOLS-04]
decisions: [R-12, R-10, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-07 · Enrol in a course and pay from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** verifying (round 2). Built by a Sonnet builder; round 2 fixes the verifier's medium (a revived payment for a released order after the student chose the course again is now refunded through the hold, once) and two lows (a per-student lock in the claim for the cap and for twin requests); see tasks/history/SCHOOLS-07.md, Builder report, round 2. Backend `wmt/SCHOOLS-07` `87fa39e` (round 1 was `79b24be`), started from `wmt/FIX-42` `73f4eb5` (batches 3 and 4, BILLS-04, FIX-40, FIX-42); mobile `wmt/SCHOOLS-07` from `wmt/FIX-42` `1ca79a3` (docs only). Migration `20261024020000_school_enrolments` (one new table `SchoolEnrolment`). No PR.
- **What is built** (backend `src/schools/enrolment/`): `POST /schools/enrolments { intakeId }` holds a place and answers the order (SC4 Continue: course, school, class, fee, `reference`, `reservedUntil`); `GET /schools/enrolments/{id}` is SC7's receipt (the course, class, fee, Fintava's charge and the total actually debited); the fee is paid by the existing `GET /money/payments/quote` and `POST /money/payments` with `kind: school_fee` and the enrolment id as `targetId` (PIN, `Idempotency-Key` and the wallet gate are the money core's).
- **Seat claim:** one conditional write (`seatsTaken < capacity`, the Product.stock pattern) in a short database-only transaction. Two students racing for the last seat: one `201`, one `409 reason.code class_full` with `reason.nextIntake` (the soonest other class of the course with a seat, or null; SC11). The same request twice is one order and one seat (a partial unique index: one live order per student and course). Another class of the same course moves the place.
- **Money (R-19, R-12, R-10):** `school_fee` is a held kind: the fee moves into WAWU's merchant wallet and waits in a hold (`releaseCondition intake_started`) that carries the 85/15 split (school 12,750,000 of 15,000,000 kobo). The student pays the fee plus Fintava's charge (₦15.75 on ₦150,000), no WAWU fee on top. Nothing is paid to the school here: SCHOOLS-11 releases the hold at intake start or refunds it.
- **Unpaid places go back:** `reservedUntil` passes with no payment started and a minute sweep (and a full class, before it says no) releases the place and its seat. A payment that is pending or completed keeps the seat. A payment that arrives after its place went back takes a seat again, or marks the order `refunded` and refunds the fee through the hold (nothing held across the provider call).
- **Defaults I set** (PROVISIONAL, config): `SCHOOL_RESERVATION_MINUTES` 30; `SCHOOL_MAX_OPEN_RESERVATIONS` 3 unpaid places per student (a second class of the same course does not count twice). A class that started in Lagos is `409 intake_closed`. A ₦0 course enrols at once with nothing to pay. The payment title is the course title; the school is on the enrolment.
- **Fences touched:** SHARED-CHANGES SCHOOLS-07 #1 (schema, contract, `school_fee` as a held kind, `PayableTarget.payeeOutsideWawu`, one line in `wallet-payment.service.ts`, purge map, data export section, two contract docs). `src/app.module.ts` is untouched (mounted from `SchoolsPublicModule`).
- **Checks:** `tsc --noEmit` 0; eslint 0 on touched files; 40 new tests green; CI on `79b24be`: Branch checks run 38974103211 (suite shards 1, 2, 3, contract, netns, deploy-test-in-sync) and Protected routes (V3) run 38974103277 passed; Gates run 38974103634 failed with the same 5 FAIL lines as the base, none in a file this branch touched.
- **NOT RUN:** any call to Fintava or its sandbox (no key here; payments ran against the local double, whose wallet-to-wallet bodies are the sandbox's own); the app (backend task, no screens); the 20-parallel slow-provider measurement (enrolling makes no provider call; the refund is requested holding nothing).
- **Next:** a verifier. Passes V1, V2, V3, V4, V6, V7, V8, V9.
- **For the lead:** merge order note: this branch is built on `wmt/FIX-42`; EVENTS-07 and INBOX-16 also edit the shared lists (`money-enums.ts`, `hold-rules.ts`, `money-view.type.ts`, `WALLET.md`, `contract/openapi.json`), so expect small textual conflicts in those files at merge. SCHOOLS-11 must call `WalletHoldService.release` or `refund` on `SchoolEnrolment.holdId` (a release with no WAWU payee marks the hold released and moves nothing, so the school's 85% is still to be sent by bank transfer from WAWU's account).
- **History:** the builder reports (rounds 1 and 2) are in tasks/history/SCHOOLS-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

SC4-SC7, SC11: enrol in an intake and pay from the wallet, with the seat claimed safely.

## Scope

Enrolment order with amount and commission snapshot, race-safe seat claim (the Product.stock pattern), class-full returns the next intake, receipt; payment through MONEY-17.

The fee waits in WAWU's merchant wallet until it is paid to the school (MONEY-18, R-19). School enrolments never read the old LearnCourse enrolment gate, which references the removed subscription.

## Capability checks

- [ ] Two users racing for the last seat: one enrols, the other is told the class is full and offered the next intake.
- [ ] The same enrol request sent twice charges once.
- [ ] The receipt shows the course, intake and amount actually charged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-07.md](history/SCHOOLS-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
