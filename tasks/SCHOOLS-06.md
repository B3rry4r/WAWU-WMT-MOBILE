---
id: SCHOOLS-06
title: Enrol and pay, class full
owner: DEV3
area: SCHOOLS
order: 129
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, SCHOOLS-07]
decisions: [R-12]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [SC4, SC5, SC6, SC7, SC11]
---
# SCHOOLS-06 · Enrol and pay, class full

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py SC4 SC5 SC6 SC7 SC11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A7.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **SC4 · Your details**: Enroll step 1: 'Prefilled. Nothing to type.' Name, email, masked phone from the WAWU account; 'Pick a class' radio list of intakes (Starts 3 November · Weekend class · 8 seats left; Starts 12 January · Weekday evenings). Disclosure: 'Greenfield gets these details so they can follow up with you.' Continue.
- **SC5 · Pay**: Enroll payment summary: name, course card, Course fee ₦150,000, Fee 'No fee', Total ₦150,000, source 'Pay from wallet · Naira wallet · ₦485,250.75 available', CTA 'Pay ₦150,000'.
- **SC6 · PIN**: PIN sheet: 'Enter your PIN · Approve ₦150,000 to Greenfield Tech Academy', numeric keypad. (Present on the board but NOT in MANIFEST.json; added so it is not a hole.)
- **SC7 · Enrolled**: Receipt: You're enrolled · course · starts 3 Nov; School; Class 'Weekend · Yaba'; Paid ₦150,000; Reference WAW-SC4K-81PQ; 'Greenfield will contact you within 2 working days. We've sent them your details.' Share receipt / My courses. Then: 'WAWU sends the school a report with your details'.
- **SC11 · Class full**: From SC3 class full: banner 'The November class is full · The next one starts 12 January.' CTA 'Enroll for January'.

## Capability checks

- [ ] **SC4**: a user can confirm prefilled details; pick a class/intake; Continue.
- [ ] **SC5**: a user can review total; Pay ₦150,000 from wallet.
- [ ] **SC6**: a user can enter transaction PIN.
- [ ] **SC7**: a user can Share receipt; My courses.
- [ ] **SC11**: a user can Enroll for January (next intake).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states SC11.

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
