---
id: WALLET-36
title: Add money by card: the screen
owner: YOU
area: WALLET
order: 256
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-25, WALLET-05]
decisions: [R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W16]
---
# WALLET-36 · Add money by card: the screen

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- `docs/designer/BRIEF.md`: its entries for W15 and W16 (the brief is part of the design: build its version)
- The design: `python3 scripts/design/render_design.py W15 W16` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A user can top up their wallet with a debit card (W16), built whole once WALLET-25 takes card payments.
Moved out of WALLET-05, which builds only bank transfer at launch.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`. This task also adds the Debit card option to W15 (WALLET-05), exactly as W15 draws it.

## Artboards

- **W16 · Add money · card**: Card top-up: amount with quick picks, saved Verve card or new card, card fee added on top as a breakdown (card provider's charge + WAWU's 1.5%), you pay / wallet gets; then 3-D Secure then receipt (BRIEF W16).

## Brief changes (build these, not the canvas)

- **W16**: the card fee as a breakdown: card provider's charge + WAWU's 1.5% (₦150 on ₦10,000) = card fee, then You pay and Wallet gets. The provider's charge isn't known yet, so draw it as an obvious sample. The button shows what the card is charged ("Pay ₦10,150" plus the provider's part), not "Add ₦10,000"; "Wallet gets ₦10,000" stays as its own line. (Why: R-10 and rule 5.)

## Capability checks

- [ ] From W15, a user can pick Debit card and reach W16 (this task adds the option).
- [ ] **W16**: a user can pick an amount; pick a saved card or use a new one; see the card provider's charge and WAWU's 1.5% as a breakdown with what the card is charged and what the wallet gets; pay.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W16: Card fee ₦150.00 (1.5%)
- W16: You pay ₦10,150.00
- W16: Wallet gets ₦10,000.00
- W16: Verve ••7710 GTBank · expires 04/28 (sample)

## Designer notes (⚠, unresolved)

- W16: “⚠ A 1.5% card fee, added on top.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
