---
id: PROS-01
title: Find a professional
owner: DEV3
area: PROS
order: 51
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, SHELL-02]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [P1, P2, P3, P4]
---
# PROS-01 · Find a professional

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py P1 P2 P3 P4` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **P1 · Professionals**: Directory: 'Vetted practitioners. Pay to send the first message.' Field chips (All, Accounting & Tax, Legal & Compliance, Design & Creative), rows with name, headline incl. years, field, price per message.
- **P2 · Profile**: Professional profile: name, headline, field, 'Ask a question · ₦5,000', 'Funmi replies within 24 hours, or you're refunded automatically.', About, What they take on (Tax filing, CAC annual returns, Bookkeeping, Payroll), Credentials 'Practising licence · Issued by ICAN · checked by WAWU'. Then Ask a question opens the paid DM (I3, Inbox flow).
- **P3 · Not taking messages**: Profile with button replaced: 'Not taking messages · Check back later, or find someone else in this field.'
- **P4 · Empty field**: Empty category: 'Nobody listed in Engineering yet · If you do this work, apply to be listed here.' Offer your services.

## Capability checks

- [ ] **P1**: a user can filter by field; tap a professional (P2).
- [ ] **P2**: a user can Ask a question (→ I3 paid DM).
- [ ] **P4**: a user can Offer your services (P5).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states P3, P4.

## What the backend serves today (from the analysis)

- **P1**: partial. Missing: Board fields 'Accounting & Tax', 'Legal & Compliance', 'Design & Creative', 'Technology & IT', 'Engineering', 'Healthcare', 'Business & Consulting' do not match PROFESSIONAL_CATEGORIES slugs (finance, legal_services, entertainment_creative, technology, healthcare, business_entrepreneurship, professional_services …, 25 total); there is no 'engineering' slug. Years of experience is free text inside headline (no field).
- **P2**: served. Missing: Data served. The paid DM it opens is still a Flutterwave charge (direct-message.service.ts initCharge) and its refund is a Flutterwave refund; moving to the wallet is the Inbox flow's change (I3).
- **P3**: served.
- **P4**: partial. Missing: 'Engineering' is not in PROFESSIONAL_CATEGORIES, so this exact field cannot exist without adding a slug.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- P1: Funmi Adeyemi ₦5,000 a message
- P1: Tunde Bakare ₦7,500 a message
- P1: Ngozi Umeh ₦2,500 a message
- P1: Emeka Obi ₦3,000 a message
- P1: 'Pay to send the first message'
- P2: Ask a question · ₦5,000
- P2: Replies within 24 hours, or you're refunded automatically
- P2: Practising licence · Issued by ICAN · checked by WAWU

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
