---
id: WALLET-19
title: Account limits screens (A17 to A20)
owner: YOU
area: WALLET
order: 308
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-23, WALLET-24]
decisions: [R-67]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A17, A18, A19, A20]
---
# WALLET-19 · Account limits screens (A17 to A20)

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): WALLET-23, WALLET-24.
- **History:** none yet. Reports go to tasks/history/WALLET-19.md.
- **Design v2 (16 Oct 2026, DESIGN-V2-CUT):** A17 and A19: "Limits set by the CBN" and the provider name in the footnote stay hidden until the owner confirms the words (R-67).

## Design v2 update (16 Oct 2026)

- The limits footnote reads "Limits set by the CBN" and names Nuvion on the 16 Oct boards; both are settings and stay hidden until the owner confirms the exact words (R-67). The Hub serves the limit figures only (NUV-07).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py A17 A18 A19 A20` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A17, A18, A19, A20, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A17 · Account limits**: Tier ladder: Tier 1 BVN and a selfie (₦50,000 per deposit · ₦300,000 balance) Done; Tier 2 Your NIN (₦100,000 per deposit · ₦500,000 balance) Upgrade; Tier 3 Proof of address (₦5,000,000 per deposit · no balance cap). 'Limits set by the CBN.'
- **A18 · Tier 2 · NIN**: 'Upgrade to Tier 2. Verify your NIN. Dial *346# from the phone on your NIN to get it.' NIN field. 'Checked with NIMC against your BVN details.' Verify NIN.
- **A19 · Tier 2 done**: A17 with Tier 1 and Tier 2 Done, Tier 3 Upgrade.
- **A20 · Tier 3 · address**: 'Upgrade to Tier 3': Home address, City, State, Proof of address upload (ikeja-electric-aug.pdf, 'Utility bill · last 3 months'). Submit. Then reviewed, Tier 3 shows Done.

## Waiting on

This waits for the owner's ruling on what A17 to A20 become (BRIEF, "A17 to A20"; after launch). Fintava's API has no tiers.

## Capability checks

- [ ] **A17**: a user can tap Tier 2 Upgrade (-> A18).
- [ ] **A18**: a user can enter NIN; tap Verify NIN.
- [ ] **A19**: a user can tap Tier 3 Upgrade (-> A20).
- [ ] **A20**: a user can enter address; upload PDF; submit.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states A19.

## What the backend serves today (from the analysis)

- **A17**: missing. Missing: No KYC tier state, no limits source, no upgrade endpoints.
- **A18**: partial. Missing: No standalone NIN check, no NIMC lookup, no cross-check with BVN, no tier change.
- **A19**: missing. Missing: No tier state.
- **A20**: partial. Missing: No address model/fields, no Tier 3 submission type, no review queue for proof of address, no tier change at provider.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A17: Tier 1: BVN and a selfie, ₦50,000 per deposit, ₦300,000 balance
- A17: Tier 2: NIN, ₦100,000 per deposit, ₦500,000 balance
- A17: Tier 3: Proof of address, ₦5,000,000 per deposit, no balance cap
- A17: 'Limits set by the CBN.'
- A18: 'Dial *346#' (USSD code)
- A18: 'Checked with NIMC against your BVN details.'
- A19: same tier table as A17
- A20: 'Utility bill · last 3 months'

## Designer notes (⚠, unresolved)

- A17: “⚠ Final numbers from Fintava.”
- A19: “⚠ Final numbers from Fintava.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
