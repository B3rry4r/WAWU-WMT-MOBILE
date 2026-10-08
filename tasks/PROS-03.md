---
id: PROS-03
title: Get listed as a professional
owner: YOU
area: PROS
order: 40
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [PROS-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [P5, P6, P7, P8, P9, P10]
---
# PROS-03 · Get listed as a professional

Taken over by the lead's agents on 8 Oct 2026 (owner: carry on with the tasks of developers who are delaying; Developer 3 had not pushed since about 02:00 UTC). The branch's rounds and rulings carry on as they stand.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py P5 P6 P7 P8 P9 P10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for P5, P6, P7, P8, P9, P10, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Inbox settings (P8) is added by INBOX-12 and Become a creator (P10) by AUTH-06 (docs/WORKFLOW.md section 7).

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-document-picker` (P6 licence upload). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **P5 · Offer your services**: Application step 1: 'People find you here and pay to send the first message.' Which fields? (Accounting & Tax, Add), one-line headline, about, what you take on (chips).
- **P6 · Credentials**: Step 2 for a regulated field: 'This field is regulated · We check your licence with the body that issued it.' Kind (Practising licence / Qualification / Work samples), Licence number ICAN/2016/40921, Who issued it ICAN, uploaded ican-licence.pdf, Send for review.
- **P7 · Under review**: 'Under review · Accounting & Tax · A person checks it. You'll see the outcome in your listings.' My listings / Done.
- **P8 · Your listings**: Listings per field: Listed (Hide), Under review, Turned down with reason 'This field needs a practising licence.' + Apply again; Apply in another field; note 'People reach you through paid messages · Set your price and reply time in Inbox settings (I21).'
- **P9 · Hidden**: Listing hidden: 'Hidden. Nobody can find you' with Show.
- **P10 · Needs a creator account**: Gate: 'This needs a creator account · Setting one up is free.' Become a creator.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- P8: Inbox settings (opens I21): added by INBOX-12
- P10: Become a creator (opens A11): added by AUTH-06

## Capability checks

- [ ] **P5**: a user can pick one or more fields; enter headline/about/services; Continue (P6).
- [ ] **P6**: a user can pick credential kind; enter licence number + issuer; upload document; Send for review (P7).
- [ ] **P7**: a user can My listings (P8); Done.
- [ ] **P8**: a user can Hide a listing (P9); Apply again; Apply in another field.
- [ ] **P9**: a user can Show.
- [ ] **P10**: a user without a creator account sees the gate.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states P9, P10.

## What the backend serves today (from the analysis)

- **P5**: partial. Missing: Board lets the user Add several fields in one pass; backend takes one category per application (unique wawuUserId+category), so the client must post once per field. Board fields 'Accounting & Tax', 'Legal & Compliance', 'Design & Creative', 'Technology & IT', 'Engineering', 'Healthcare', 'Business & Consulting' do not match PROFESSIONAL_CATEGORIES slugs (finance, legal_services, entertainment_creative, technology, healthcare, business_entrepreneurship, professional_services …, 25 total); there is no 'engineering' slug.
- **P6**: served.
- **P7**: served.
- **P8**: served.
- **P9**: served.
- **P10**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- P5: 'pay to send the first message'
- P6: 'We check your licence with the body that issued it' (verification claim)
- P6: Licence number ICAN/2016/40921, issuer ICAN
- P10: Creator account setup is free

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The ME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
