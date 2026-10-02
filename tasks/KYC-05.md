---
id: KYC-05
title: Open your wallet: enter your BVN and NIN
owner: YOU
area: KYC
order: 81
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [UI-02, MONEY-03, MONEY-13, KYC-01]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A14]
---
# KYC-05 · Open your wallet: enter your BVN and NIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- `docs/designer/BRIEF.md`: "New artboard A26 · Open your wallet: BVN and NIN" and "A14" (the brief is part of the design: build its version)
- The design: `python3 scripts/design/render_design.py A3 A14` then open `build/design_shots/` (A26 is not drawn; it uses A3's field style)
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

The first step of Open your wallet (R-6): a user gives their BVN and NIN, the BVN check confirms who they are,
and a BVN registered to a different phone stops here with A14. Everyone lands on this step the first time they
tap anything that moves money. Fintava won't open an account without both numbers (`docs/fintava/naira-api.md`).

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`. This task also wires the pay sheet's "no wallet yet" state (MONEY-03) and the
`no_wallet` answer (MONEY-13) to this step. The other ways in (the Wallet tab, the Home balance card, the
Getting paid rows, Earnings, A11) are added by the tasks that build those screens (docs/WORKFLOW.md section 7,
"Links between screens").

## Artboards

- **A26 · Open your wallet: BVN and NIN** (new in the brief, not drawn): the first screen of Open your wallet in A3's field style: BVN with the hint "Dial *565*0# to get it", NIN with the hint "Dial *346# from the phone on your NIN to get it", Continue.
- **A14 · Phone doesn't match BVN**: the same error the canvas draws on A3, shown as a state of A26 with A26's fields (BRIEF A14).

## Ruling R-6

Identity is checked when someone opens a wallet, never at sign-up. Someone without a Nigerian BVN cannot open a
Naira wallet; dollar and crypto accounts are for them after launch, so for now the flow ends with a clear "not
available yet" instead of an error.

## Brief changes (build these, not the canvas)

- **A14**: the same error, as a state of the new BVN and NIN step (A26), showing that screen's fields. (Why: R-6.)
- **A26**: the first screen of Open your wallet, in A3's field style: BVN (with the "Dial *565*0# to get it" hint) and **NIN** beside it (the canvas's own hint from A18 works: "Dial *346# from the phone on your NIN to get it"). "Must be the number on your BVN" stays relevant for the phone, so A14's error now belongs to this step.

## Capability checks

- [ ] A signed-in user with no wallet who taps Pay on any pay sheet lands on A26.
- [ ] **A26**: a user can enter their BVN and NIN and tap Continue; the BVN check runs (KYC-01) and its name, date of birth and gender are kept for A5.
- [ ] **A14**: a user whose BVN is registered to a different phone sees A14 on this step, can correct the number and continue.
- [ ] A user without a Nigerian BVN reaches a clear "not available yet" end, not an error.
- [ ] A26 is built in A3's field style and A14 matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as is the drawn state A14.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A26: 'Dial *565*0# to get it', 'Dial *346# from the phone on your NIN to get it' (USSD codes)
- A14: phone must equal the BVN-registered phone

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
