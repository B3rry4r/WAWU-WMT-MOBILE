---
id: INBOX-12
title: Paid message settings, warning, switched off
owner: DEV3
area: INBOX
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: blocked
blocked_by: "until D8 is ruled in DECISIONS.md"
depends_on: [INBOX-09]
decisions: [D8]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I21, I22, I23]
---
# INBOX-12 · Paid message settings, warning, switched off

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: D8 (open: this task is blocked until they are ruled)
- The design: `python3 scripts/design/render_design.py I21 I22 I23` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| I21 | Settings | Paid messages settings: toggle, price per message with presets, reply window, "You earn per message ₦1,275 · Your share 85%", "Unanswered, last 30 days 4%", Save. |
| I22 | Warning | Settings in the "warned" state: "You missed 4 of your last 18. Past 30% and paid messages switch off for 7 days." with Raise to ₦2,500. Board says the state triggers over 20% unanswered. |
| I23 | Switched off for 7 days | Settings locked: "Paid messages are off for 7 days. Back on 3 October." toggle locked until the date; publishing, communities, tips and shop keep working. |

## Capability checks

- [ ] **I21**: a user can toggle on/off; pick price preset or type; pick reply window; Save.
- [ ] **I22**: a user can Raise to ₦2,500; Save.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I22, I23.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| I21 | partial | Settings write is served. The unanswered rate is never computed: CreatorNoResponseTrackerService only upserts a zero row on read, and no cron or sweep writes noResponseRatePct. |
| I22 | partial | Nothing ever sets warned (no writer of CreatorNoResponseTracker). "Missed 4 of last 18" counts are not returned (only a percent). No warning notification kind. |
| I23 | partial | Nothing writes disabled_7d; PATCH /creator/dm-settings does not refuse turning DMs back on during a lock; sendInit does not enforce dmDisabledUntil. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I21: lowest ₦50
- I21: presets ₦100, ₦500, ₦1,000, ₦2,500
- I21: 24 hours / 2 days / 3 days / 1 week
- I21: You earn per message ₦1,275
- I21: Your share 85%
- I21: Unanswered, last 30 days 4%
- I22: over 20% unanswered
- I22: You missed 4 of your last 18
- I22: Past 30% ... switch off for 7 days
- I22: Unanswered 22%
- I22: Raise to ₦2,500
- I23: off for 7 days
- I23: Back on 3 October
- I23: Unanswered 34%

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
