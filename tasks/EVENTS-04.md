---
id: EVENTS-04
title: Host an event: basics, when and where, tickets, review
owner: DEV3
area: EVENTS
order: 52
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EVENTS-02, UI-02, EVENTS-01]
decisions: [R-8]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [E13, E14, E15, E16, E21, E22]
---
# EVENTS-04 · Host an event: basics, when and where, tickets, review

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py E13 E14 E15 E16 E21 E22` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E13, E14, E15, E16, E21, E22, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

My events (E16) is added by EVENTS-08 and Get verified (E21) by ME-12 (docs/WORKFLOW.md section 7).

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-image-picker` (E14 banner). They are in `SHARED-CHANGES.md` row 7 (one batch for Developers 2 and 3, one new development build); if row 7 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E13 · Basics**: Host wizard step 1 of 3 (Basics / When and where / Tickets): event name, what happens at it, who is running it (Adeyemi & Co), Format In person / Online / Hybrid.
- **E14 · When and where**: Step 2: starts/ends, street address with hint 'Missing addresses are the top reason events get sent back.', banner image upload, Category 'Business & Finance'.
- **E15 · Tickets**: Step 3: ticket types (name, price, quantity): Regular ₦5,000 × 100, VIP ₦12,000 × 20, Add a ticket type; note 'You keep 85% of every ticket. Set price to ₦0 for a free event.'; Send for review.
- **E16 · Sent for review**: Confirmation: 'A person checks it. It goes live on its own once approved.' My events / Done.
- **E21 · Needs a tick**: Gate: 'Hosting needs a verified tick · A creator or professional tick, ₦2,000 a year.' Get verified.
- **E22 · Sent back**: Rejected event: 'Sent back · Add the street address, then send it again.' with the address field flagged 'Needed before it can go live' and Send again.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- E16: My events (opens E17): added by EVENTS-08
- E21: Get verified (opens M11): added by ME-12

## Capability checks

- [ ] **E13**: a user can enter name, description, organiser; pick format; Continue (E14).
- [ ] **E14**: a user can set start/end; enter street address; upload banner; pick category; Continue (E15).
- [ ] **E15**: a user can edit tier name/price/quantity; add a tier; Send for review (E16).
- [ ] **E16**: a user can tap Done.
- [ ] **E21**: a user without a tick sees the gate when they try to host.
- [ ] **E22**: a user can fix field; Send again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E21, E22.
- [ ] From E1's Host your event (EVENTS-01), a verified user reaches E13 and an unverified one E21 (this task adds it, as drawn).

## What the backend serves today (from the analysis)

- **E13**: partial. Missing: Format 'Hybrid' does not exist: enum EventFormat = in_person|online. CreateEventDto also REQUIRES `type` (EventType) and `location`, which no board step collects (board has Category, and Street address only).
- **E14**: partial. Missing: Category label 'Business & Finance' has no matching enum (EventCategory.business); labels need a mapping table. `location` (required) has no field on the board.
- **E15**: partial. Missing: Two calls today (POST /events then PUT /events/{id}/tickets) where the board submits once; backend needs a `tier` enum per type (regular|vip|vvip|early_bird|group|free) the board never asks for, and rejects ₦0 unless tier='free' (client must map). Ticket tiers are not part of admin review (AdminEventReview covers the event only).
- **E16**: served.
- **E21**: served. Missing: Gate fires only on submit; a pre-check (GET /api/hub/verification/me) is needed to show this before the wizard starts.
- **E22**: served. Missing: No per-field flag: the reason is free text, so 'Needed before it can go live' on a specific field cannot be driven by data.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E14: 'Missing addresses are the top reason events get sent back.'
- E15: You keep 85% of every ticket
- E15: Regular ₦5,000 × 100
- E15: VIP ₦12,000 × 20
- E15: Set price to ₦0 for a free event
- E21: Verified tick ₦2,000 a year (creator or professional)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
