---
id: LEGAL-04
title: Legal: book and pay a consultation
owner: DEV3
area: LEGAL
order: 126
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [LEGAL-03, LEGAL-05]
decisions: [R-14]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [S18, S19, S20, S25]
---
# LEGAL-04 · Legal: book and pay a consultation

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py S18 S19 S20 S25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **S18 · Book**: Booking: Video call 30 min ₦15,000, Phone call 20 min ₦10,000, In person 'Arranged by email, fee per matter · On request'; day strip (Tue 30–Mon 6) and times 09:00/10:30/12:00/14:00/15:30/17:00; 'Thu 2 Oct, 12:00 (Lagos time)', Pay ₦15,000.
- **S19 · Pay**: Pay sheet over S18: Video consultation Thu 2 Oct 12:00 · 30 min ₦15,000, Pay from wallet; then PIN accepted.
- **S20 · Booked**: Matter tracker 'Tenancy agreement review': steps Request sent → Answers read → Consultation Thu 2 Oct 12:00 video → Quote and agreement → Pay and start → Documents delivered; 'Details are in your email.' Add to calendar.
- **S25 · No slots**: 'No slots in the next three weeks · Choose in person and we'll arrange a time by email.' Request in person.

## Capability checks

- [ ] **S18**: a user can pick medium; pick day/time; Pay (S19).
- [ ] **S19**: a user can Pay ₦15,000; enter PIN.
- [ ] **S20**: a user can Add to calendar.
- [ ] **S25**: a user can Request in person.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S19, S25.

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

- S18: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.”
- S19: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
