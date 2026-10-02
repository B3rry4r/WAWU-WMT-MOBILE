---
id: KYC-03
title: Open your wallet: BVN, confirm details, selfie
owner: YOU
area: KYC
order: 69
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-03, KYC-01, KYC-02]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [A5, A6, A7, A14, A16]
---
# KYC-03 · Open your wallet: BVN, confirm details, selfie

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A5 A6 A7 A14 A16` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A5 · Confirm your details**: Read-only 'From your BVN' card: Name, Date of birth, Gender, State you live in, Occupation; checkbox 'I agree to the terms and privacy policy'; Continue.
- **A6 · Selfie**: Camera oval: 'Fit your face in the oval. It must match your BVN photo. Then blink slowly' (liveness).
- **A7 · Matched**: Success state: 'Matched to your BVN. Opening your account' (spinner while the wallet is provisioned).
- **A16 · Face doesn't match**: Selfie failure: 'We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.' Try again.

## Ruling R-6

This flow is not part of sign-up. It starts the first time someone taps Wallet
or anything that moves money, for every user, new or existing. The design draws
these screens inside sign-up; keep their look, change only where they sit. The
BVN entry is A3's BVN field on its own step (A3 itself is sign-up and no longer
asks for it). Someone without a Nigerian BVN cannot open a Naira wallet; dollar
and crypto accounts are for them and come after launch, so for now the flow
ends with a clear "not available yet" instead of an error.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava needs the NIN and a full address to open an account, and the canvas draws neither. Add both in the canvas's own field style (NIN beside the BVN step, address on A5) and ask the designer to draw them (OPS-04). A6 says nothing about blinking or liveness (KYC-02). A5's name, date of birth and gender come from the BVN check; state and occupation are typed by the user.

## Capability checks

- [ ] A user who has never opened a wallet taps Wallet and lands in this flow; after it, they land on W5.
- [ ] **A5**: a user can review prefilled details; tick terms/privacy consent; tap Continue (-> A6).
- [ ] **A6**: a user can position face; blink (liveness); auto-capture.
- [ ] **A7**: a user can wait.
- [ ] **A16**: a user can retry.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states A7, A16.

## What the backend serves today (from the analysis)

- **A5**: partial. Missing: No dateOfBirth column in WAWU ID or Hub. Occupation is silently dropped today. No BVN source to prefill from. Consent route exists but is not called by any client (grep '/policies' wawuafrica/src -> none).
- **A6**: missing. Missing: No liveness or face-match capability or provider anywhere; no place to store the result.
- **A7**: missing. Missing: No face-match result; account opening at Fintava does not exist (see A8).
- **A16**: missing. Missing: No face match; no retry/lockout policy; no fallback to manual review is drawn.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A5: 'From your BVN' includes 'State you live in' and 'Occupation' (claim that a BVN record carries these is unverified)
- A6: 'It must match your BVN photo'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
