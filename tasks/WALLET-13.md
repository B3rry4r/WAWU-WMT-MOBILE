---
id: WALLET-13
title: Earnings and move to wallet
owner: DEV1
area: WALLET
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: blocked
blocked_by: "until D6 is ruled in DECISIONS.md"
depends_on: [WALLET-16]
decisions: [D6]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W39, W40]
---
# WALLET-13 · Earnings and move to wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- `DECISIONS.md`: D6 (open: this task is blocked until they are ruled)
- The design: `python3 scripts/design/render_design.py W39 W40` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| W39 | Earnings | Creator-only earnings screen: 'Ready to move' amount, all-time earned, Move to wallet button, stream split (Unlocks, Tips, Paid DMs) and per-content earnings this month. |
| W40 | Earnings · move to wallet | Sheet to move ready earnings into the Naira wallet, 'instant and free'; KYC-not-approved shows the W18 banner instead; then PIN, then W1 with new balance. |

## Capability checks

- [ ] **W39**: a user can tap Move to wallet; view per-content earnings.
- [ ] **W40**: a user can Move ₦84,500; enter PIN.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| W39 | partial | Earnings exist but are swept automatically into the wallet, so there is no 'ready to move' balance concept and no per-content aggregation (unlocks/tips/sales per piece). The response also carries community_credits and 'held' DM money that the canvas does not show. |
| W40 | missing | No user-initiated move; funding is a background sweep that does not check KYC. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W39: Ready to move ₦84,500.00
- W39: ₦312,800 earned all time
- W39: Unlocks ₦61,500
- W39: Tips ₦14,000
- W39: Paid DMs ₦9,000
- W39: How I light a night shoot +₦42,000
- W40: 'It's instant and free.'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
