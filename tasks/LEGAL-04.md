---
id: LEGAL-04
title: Legal: book and pay a consultation
owner: YOU
area: LEGAL
order: 116
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, LEGAL-02, LEGAL-03, LEGAL-05, UI-02]
decisions: [R-14, R-6, R-10]
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: [S18, S19, S20, S25]
---
# LEGAL-04 · Legal: book and pay a consultation

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV3).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py S18 S19 S20 S25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md`: its entries for S19 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

"Details are in your email" (S20) is sent through the backend's existing mailer.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-calendar` (S20 Add to calendar). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **S18 · Book**: Booking: Video call 30 min ₦15,000, Phone call 20 min ₦10,000, In person 'Arranged by email, fee per matter · On request'; day strip (Tue 30–Mon 6) and times 09:00/10:30/12:00/14:00/15:30/17:00; 'Thu 2 Oct, 12:00 (Lagos time)', Pay ₦15,000.
- **S19 · Pay**: Pay sheet over S18: Video consultation Thu 2 Oct 12:00 · 30 min ₦15,000, Fintava's charge ₦15.75, Total ₦15,015.75, Pay from wallet, 'Pay ₦15,015.75' (BRIEF S19); then PIN accepted.
- **S20 · Booked**: Matter tracker 'Tenancy agreement review': steps Request sent → Answers read → Consultation Thu 2 Oct 12:00 video → Quote and agreement → Pay and start → Documents delivered; 'Details are in your email.' Add to calendar.
- **S25 · No slots**: 'No slots in the next three weeks · Choose in person and we'll arrange a time by email.' Request in person.

## Brief changes (build these, not the canvas)

- **S19**: add the breakdown: Fintava's charge ₦15.75, Total ₦15,015.75; button "Pay ₦15,015.75". (Why: R-10 and the purchases default.)

## Capability checks

- [ ] **S18**: a user can pick medium; pick day/time; Pay (S19).
- [ ] **S19**: a user sees ₦15,000 + ₦15.75 = ₦15,015.75, taps "Pay ₦15,015.75" and enters their PIN.
- [ ] **S20**: a user can Add to calendar.
- [ ] **S25**: a user can Request in person.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S19, S25.
- [ ] From S17 (LEGAL-02), a user can tap Book and reach S18 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **S18**: partial. Missing: Media differ: backend ConsultationMedium = chat|zoom|physical, no phone. Fees differ: CONSULTATION_FEES chat ₦25,000/60 min, zoom ₦45,000/60 min, physical null. Slots differ: CONSULTATION_HOURS 09:00-16:00 hourly (slotMinutes 60), weekdays, 21-day horizon; board shows 90-minute spacing to 17:00.
- **S19**: missing. Missing: Consultation payment is Flutterwave checkout; needs wallet debit + PIN (LegalRequest.consultationTxRef is Flutterwave-shaped).
- **S20**: served. Missing: Email of booking details not verified in this pass.
- **S25**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S18: Video call 30 minutes ₦15,000
- S18: Phone call 20 minutes ₦10,000
- S18: In person: arranged by email, fee per matter, on request
- S18: Slots 09:00, 10:30, 12:00, 14:00, 15:30, 17:00 Lagos time
- S19: ₦15,000 video consultation
- S25: Booking horizon: three weeks

## Designer notes (⚠, unresolved)

- S18: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.
- S19: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
