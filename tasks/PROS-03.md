---
id: PROS-03
title: Get listed as a professional
owner: DEV3
area: PROS
order: 40
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [PROS-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [P5, P6, P7, P8, P9, P10]
---
# PROS-03 · Get listed as a professional

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

Builder (resumed after a usage-limit crash), 7 Oct 2026. Mobile branch `wmt/PROS-03` from main with PROS-02 merged in (backend #47, mobile #3); backend unchanged, so no backend branch. Contract regenerated from backend main (`npm run api`).

- **Files:** `src/features/pro-listing/` (`api.ts`, `model.ts`, `ApplyScreen.tsx` P5 P6 P7 P10, `ListingsScreen.tsx` P8 P9 P10, `ProFrame.tsx`, `parts.tsx`, `pickDocument.ts` and `.web.ts`, `upload.ts`, `useRefreshOnFocus.ts`, tests), routes `src/app/professional-apply.tsx` and `professional-listings.tsx`. No `_layout.tsx` edit.
- **Backend:** none needed. PROS-02 serves the fields (with `regulated`), the application, `mine` and the listing switch; the licence file goes through `POST /uploads/presign` with `professional/document`. Apply is one field per call, so the client files one per chosen field (G-324).
- **Checks, how tested:** P5 pick fields, headline, about, services, Continue (boundaries 7/8, 39/40, 120/121, 2000/2001); P6 kind, number, issuer, upload, Send for review; P7 My listings and Done; P8 Hide, Apply again, Apply in another field; P9 Show; P10 gate. Jest `pro-listing/__tests__` (46 tests): per-field posts, partial failure with a field in the middle (third not tried, retry files the rest), double tap, upload and its failure, Send waits for an upload, prefill on Apply again, taken fields not offered, loading, empty, error and Try again on both screens, non-creator sees only the gate. Mutants tried and killed: no break after a failed field, status order, taken-field rule, headline boundary.
- **Pictures (V5):** `render_design.py P5 P6 P7 P8 P9 P10` beside my own 390 px light and dark screenshots from `npm run web` against a local Hub, in `/tmp/claude-0/.../scratchpad/pros03/` (`pair-P*.png`, design then mine, light then dark). I do not say they match. Known differences: no status bar and home indicator on web; the Licence number is not drawn in the kit's letter-spaced mono (the shared TextField takes no style); the Add chip after "What do you take on?" is mine (G-322); P10 and P8 carry no "Become a creator" and no Inbox settings link (added by AUTH-06 and INBOX-12, G-323).
- **V9 live seam:** web build, sign in through the app's real sign-in against the local Hub (WAWU ID is the repo's mock, `mock-wawu-id`, wrapped in `{ data }` as the real one answers; no real WAWU ID here), applied in Accounting & Tax through P5 and P6, the application read back through `GET /applications/mine`, approved in the database, shown Listed on P8, Hide then Show saved (`listed` read back in the database). A `creator` and a `user` account both walked (P10).
- **Probes on the one write route the screens call (not new):** NUL in a text field answers 500 (protected route, left; the app strips NUL, G-325); lone surrogate 201; `[]`, `"x"`, `{}`, wrong types 400; bad id on the listing switch 400.
- **Gaps and shared changes:** BACKEND_GAPS G-320 to G-325; SHARED-CHANGES `PROS-03 #1` (shared Banner with an icon and info tone) and `#2` (screen frame with a foot); row 8 (`expo-document-picker`) is still open.
- **NOT RUN:** the licence upload on a phone (G-321: `expo-document-picker` not installed, row 8 open; the upload row is not drawn on a phone); the upload end to end through real storage (the local Hub has no storage keys and answers 503 on `presign`; for the P6 picture only, the browser intercepted `presign` and the PUT, and the file's address went into the application); V10 (real Android phone); V9 through the real WAWU ID.
- **Defaults (agent), owner may override:** one application per chosen field with the same credentials (G-324); a field with an application under review or listed is not offered again; the claims in P5, P6 and P10 kept as drawn and filed (G-320); P6 is shown for any field (the regulated note only for a regulated one, licence number and issuer optional elsewhere, a regulated field takes only a practising licence); rows on P8 are ordered listed, under review, turned down.
- **Counts:** before (crashed builder, before merging newer main) 46 suites / 797 tests, gates 216 files 0 findings. After: see the PR (final `npm run check` after merging main).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The ME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
