---
id: MONEY-02
title: The PIN sheet
owner: YOU
area: MONEY
order: 33
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [UI-01, UI-02]
decisions: [R-22, R-26]
passes: [V1, V5, V6]
artboards: [W11, H15, M13]
---
# MONEY-02 · The PIN sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W11 H15 M13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A3.json`, `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for W11, H15 and M13 (the brief is part of the design: build its version)
- `DECISIONS.md`: R-22 (sizes from the board kit), R-26 (biometric approval)

## Goal

One PIN sheet, reused by every payment (W11 and the same sheet on H15, M13, E4, S6, SC6).

## Scope

src/components/pin-sheet/ with states: entering, wrong PIN with tries left, locked with time, biometric
option, submitting. Built on UI-02's bottom sheet and UI-01's buttons in this task, not a later one; sizes are
the board kit's, as named constants (R-22), never substituted.

The biometric option is the phone's own fingerprint or face unlock, whichever it has (`expo-local-authentication`,
R-26). Its label names what the phone has ("Use fingerprint" on most Android phones). A failed or cancelled
prompt shows "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use your PIN.") and never uses up a
PIN try. Copy for states the canvas doesn't draw is written by the builder in the canvas's voice and listed in
`docs/designer/BRIEF.md`; it is not a question for the owner.

## Brief changes (build these, not the canvas)

- **W11**: the same rows as the new W10 (₦40 + ₦25 = ₦65, Total ₦25,065.00), and the sheet's line "Approve ₦25,000 to Chidinma Okoro" becomes "Approve ₦25,065 to Chidinma Okoro". (Why: R-10 and rule 5.)
- **W11**: the phone's own fingerprint or face unlock, whichever it has; the label names it ("Use fingerprint" on most Android phones). When it fails: "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use your PIN."), and no PIN try is used up. The same on H15, M13 and every PIN sheet. (Why: R-26. Testing is Android first (R-24); Face ID is Apple's.)
- **H15**: "Approve ₦2,523.25 to Chidi Eze". (Why: rule 5, following H14.)
- **M13**: "₦2,023.25 for the professional tick". (Why: rule 5, following M12.)

## Capability checks

- [ ] A user can enter a PIN, see it rejected with tries left, and see the locked state.
- [ ] A user sees the sheet exactly as W11 draws it, with the brief's total on the Approve line, light and dark (V5).
- [ ] A user whose phone has a fingerprint or face unlock set up can approve with it; when it fails they see "Fingerprint failed. Use your PIN." (or Face) and still have every PIN try.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
