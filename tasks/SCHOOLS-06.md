---
id: SCHOOLS-06
title: Enrol and pay, class full
owner: YOU
area: SCHOOLS
order: 129
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, SCHOOLS-03, SCHOOLS-07, UI-02]
decisions: [R-12, R-1, R-6, R-10, R-33, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [SC4, SC5, SC6, SC7, SC11]
---
# SCHOOLS-06 · Enrol and pay, class full

## Current state

As of 17 Oct 2026, after the first build (Sonnet builder, branch `wmt/S5`, one branch with SCHOOLS-08).
- **Status:** verifying. Mobile `wmt/S5` from `origin/wmt/MERGE-9` 72bc8d6c with `origin/wmt/B2` (be8d9cb) merged; no backend change, no migration, no contract change (types are the merged ones).
- **Built (all `src/features/schools/`):** SC4 `EnrolScreen` (details from `GET /users/me`, the classes not yet begun as a radio list, "<school> gets these details...", Continue holds a place with `POST /schools/enrolments`); SC5 and SC6 `EnrolmentScreen` over the shared `PaySheet` and `PinSheet` (a fresh `GET /money/payments/quote?kind=school_fee` per tap on Pay, one `Idempotency-Key` per attempt kept across a wrong PIN and a lost answer, written to the phone before it is sent: `enrolIntent.ts`, `useEnrolPay.ts`); SC7 the receipt (Share receipt opens the phone's share sheet with text and reference); SC11 class full on SC3's bar and on SC4 when Continue answers `409 class_full`. Also kept, undrawn on the boards: paid-still-confirming (Refresh, never pays again), a place that went back, a refunded enrolment, no wallet (Open your wallet), no PIN, short balance, over today's limit, price moved.
- **Words from the 16 Oct boards:** "Bank charge" (never Fintava), "Who Made This?". SC5 button reads "Pay · ₦150,015.75" until the shared prop lands (SHARED-CHANGES SCHOOLS-06 #1). SC7 leaves out "within 2 working days" (G-850). "One payment" under the fee is added (G-626): drawn when the course has a fee and a class to join.
- **Attacks, once each on the stack (`/tmp/claude-0/.../s5-b/logs/live-attacks.txt`, stack s5_test on ports 7700-7707, Nuvion stand-in):** double Continue 201 and 201, one order, seats 20 to 19; double Pay one key 409 `idempotency_in_progress` and 201, one debit; wrong PIN 403 `pin_incorrect`, no debit, same key right PIN 201; short balance 402 `insufficient_funds` with the bank figures, no debit, enrolment still reserved; lost answer then retry 201 and 201 `Idempotent-Replayed: true`, one payment, one debit, one My courses row; class filled between view and Continue 409 `class_full` with `nextIntake`, no debit, no enrolment; free course 201 `enrolled` at once, no PIN, no payment, no quote. All also in `enrolFlow.test.tsx`.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest `src/features/schools`, `src/features/me` and `buyTickets` green (see the final log line in the hand-back); `npm run gates` EXIT 0 (0 fail, 0 accepted; the new PROVISIONAL(SCHOOL-ENROL-POLL) is a warn).
- **Pictures** (390 px, light and dark, beside the boards as `board-SC*`): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s5-b/pics` (SC3, SC4, SC5, SC5-short-balance, SC6, SC6-wrong-pin, SC7, SC11-course-full, SC11-on-SC4).
- **Fee on the stack:** the stand-in's Bank charge is ₦0, so the pictures read "Bank charge ₦0"; the tests use the 16 Oct figure (₦15.75, total ₦150,015.75).
- **NOT RUN:** the still-confirming and "place went back" screens on the stack (the stand-in settles at once and a place takes 30 minutes to go back): tests only; no real device or Fintava; the unit tests of the shared sheets are untouched.
- **Open:** the sheet's logo tile (G-853) and the dot-less button (SHARED-CHANGES SCHOOLS-06 #1).
- **Round 2 (17 Oct 2026, builder, from be5454f2; fixes the verifier's F1 medium and F2 low):** a payment the Hub answered `pending` that then FAILS now ends the "Paid, still confirming" wait. The phone keeps the payment id from the pay answer (and from `409 payment_in_progress` `reason.paymentId`; `enrolIntent.ts` `paymentId`, older entries read as none) and, while confirming, reads `GET /money/payments/{id}` beside the order. On `failed` or `reversed` it lets the attempt go, asks a fresh quote and draws the pay sheet's "Payment didn't go through" with the Hub's reason and "Your money is back in your wallet."; Pay then runs again with the new quote and a new key. A reload in between finds the id on the phone and tells the same. F2: a second phone is named the open payment when the Hub refuses the quote or the Pay (`payment_in_progress`) and draws "still confirming", no Pay; the Hub does not refuse the quote yet (G-SCHOOLS-06-1), so until it does the second phone meets it at the PIN tap. F3 and F5 stay with their SHARED rows.
- **Round 2 checks:** `tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest `src/features/schools` 5 suites, 156 tests, EXIT 0 (5 new in `enrolFlow.test.tsx`: pending then failed, pending then paid, a reload in between, a second phone, a Pay refused as in progress). NOT RUN: the stand-in settling a transfer failed on a stack (tests only).
- **Round 3 (17 Oct 2026, builder, from 309abf74; the two lows F6, F7):** a failed payment the Hub was confirming draws the Hub's reason alone when it gave one; "Your money is back in your wallet." (with "The payment didn’t go through.") only when it gave none (`enrolModel.ts` `failedLine`, new `enrolModel.test.ts`); the "second phone" test and the other round 2 Refresh presses wait for the settled button name. `tsc` EXIT 0, eslint EXIT 0, jest `src/features/schools` 6 suites, 159 tests, EXIT 0 five runs in a row.
- **Next:** the verifier again on F6 and F7.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py SC4 SC5 SC6 SC7 SC11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A7.json`
- `docs/designer/BRIEF.md`: its entries for SC5, SC6, SC7 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The money goes to the school at the 85/15 split (R-12; the school is the payee, SCHOOLS-11). SC4's "Greenfield gets these details so they can follow up with you" and SC7's "Greenfield will contact you within 2 working days" are legal and service lines: config slots the owner fills, like the licence lines (R-1).

## Artboards

- **SC4 · Your details**: Enroll step 1: 'Prefilled. Nothing to type.' Name, email, masked phone from the WAWU account; 'Pick a class' radio list of intakes (Starts 3 November · Weekend class · 8 seats left; Starts 12 January · Weekday evenings). Disclosure: 'Greenfield gets these details so they can follow up with you.' Continue.
- **SC5 · Pay**: Enroll payment summary: name, course card, Course fee ₦150,000, Fintava's charge ₦15.75, Total ₦150,015.75, source 'Pay from wallet · Naira wallet · balance available', CTA 'Pay ₦150,015.75' (BRIEF SC5).
- **SC6 · PIN**: PIN sheet: 'Enter your PIN · Approve ₦150,015.75 to Greenfield Tech Academy' (BRIEF SC6), numeric keypad.
- **SC7 · Enrolled**: Receipt: You're enrolled · course · starts 3 Nov; School; Class 'Weekend · Yaba'; Paid ₦150,015.75 (BRIEF SC7); Reference WAW-SC4K-81PQ; 'Greenfield will contact you within 2 working days. We've sent them your details.' Share receipt (the phone's share sheet at launch, R-33) / My courses (added by SCHOOLS-08). Then: 'WAWU sends the school a report with your details'.
- **SC11 · Class full**: From SC3 class full: banner 'The November class is full · The next one starts 12 January.' CTA 'Enroll for January'.

## Brief changes (build these, not the canvas)

- **SC5**: the breakdown: Course fee ₦150,000, Fintava's charge ₦15.75, Total ₦150,015.75; button "Pay ₦150,015.75". (Why: R-10 and the purchases default (₦15.75 from ₦5,000).)
- **SC6**: "Approve ₦150,015.75 to Greenfield Tech Academy". (Why: rule 5, following SC5.)
- **SC7**: "Paid ₦150,015.75" (or the course fee and Fintava's charge as two rows). (Why: rule 5.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- SC7: My courses (opens SC8): added by SCHOOLS-08

## Capability checks

- [ ] **SC4**: a user can confirm prefilled details; pick a class/intake; Continue.
- [ ] **SC5**: a user sees ₦150,000 + ₦15.75 = ₦150,015.75 and pays "Pay ₦150,015.75" from the wallet.
- [ ] **SC6**: a user can enter their 4-digit PIN.
- [ ] **SC7**: a user can Share receipt through the phone's share sheet (text and reference).
- [ ] **SC11**: a user can Enroll for January (next intake).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states SC11.
- [ ] From SC3's Enroll (SCHOOLS-03), a user reaches SC4 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **SC4**: missing. Missing: Needs CourseIntake model (capacity, seatsTaken) and an enrollment draft; needs a consent flag/timestamp for sharing PII with the school (data-protection).
- **SC5**: missing. Missing: No buyer-side wallet, no debit-to-merchant route, no enrollment order model (amount snapshot, commission snapshot, payee). Also no rule for where ₦150,000 goes (school payee) or WAWU's share.
- **SC6**: missing. Missing: No transaction PIN anywhere (set, verify, reset, lockout). Payee is the school, which is not an account in the system.
- **SC7**: missing. Missing: Needs SchoolEnrollment order with reference generator, receipt endpoint, and a school-report delivery (email to school contact or school dashboard), plus a 2-working-day follow-up SLA tracker if WAWU promises it.
- **SC11**: missing. Missing: Needs CourseIntake capacity + seat claim at payment time (not at SC4), with 'full' derived server-side and next-intake lookup.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- SC4: 8 seats left
- SC4: 'Greenfield gets these details so they can follow up with you.' (data-sharing disclosure, legal/NDPR wording unverified)
- SC5: Course fee ₦150,000
- SC5: Fee: No fee
- SC5: Naira wallet · ₦485,250.75 available (kobo shown; backend amounts are whole-naira Int)
- SC5: recipient and split of enrollment money unstated
- SC6: 'Approve ₦150,000 to Greenfield Tech Academy' (school named as payee)
- SC7: Paid ₦150,000
- SC7: Reference WAW-SC4K-81PQ
- SC7: 'Greenfield will contact you within 2 working days' (SLA WAWU would be promising on a school's behalf)
- SC11: November class full; next starts 12 January

## Designer notes (⚠, unresolved)

- None.

## Builder report

Files (mobile only): `src/features/schools/` new `enrolApi.ts`, `enrolModel.ts`, `enrolIntent.ts`, `useEnrolPay.ts`, `enrolParts.tsx`, `EnrolScreen.tsx`, `EnrolmentScreen.tsx`; edited `CourseScreen.tsx` (Enroll, "One payment", the class-full bar, the apply link); routes `src/app/schools/enrol/[courseId].tsx`, `src/app/schools/enrolments/[id].tsx`, and `courses/[id].tsx` (gives `onEnroll`); test `__tests__/enrolFlow.test.tsx` (26 cases: SC4 6, pay 12, SC8 2, course page 4, plus the empty and closed states).
Capability checks: SC4 pick and Continue, SC5 total and Pay from the wallet, SC6 PIN, SC7 Share receipt (spy on `Share.share`: text and reference), SC11 Enroll for January, no wallet leads to Open your wallet: each is a test in `enrolFlow.test.tsx`; the attacks also ran once each on the stack (see Current state).
Decisions: Continue replaces SC4 with SC5 so Back lands on the course; closing the pay sheet leaves the screen (the place stays held); the PIN sheet hides the page's words as SC6 draws; a place held and unpaid opens the pay screen from My courses; "will contact you" stays, the two-day figure is out (G-850); a student with details not loaded cannot Continue (the disclosure names what is shared).
Gate counts: `npm run gates` before: 0 fail (MERGE-9); after: 0 fail, 0 accepted, 11 warn (one new PROVISIONAL). No assertion of another task's test was edited (SHARED-CHANGES SCHOOLS-06 #2).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
