---
id: KYC-03
title: Open your wallet: confirm details and address, selfie
owner: YOU
area: KYC
order: 86
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [KYC-05, MONEY-03, MONEY-12, MONEY-13, KYC-01, KYC-02, UI-02]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [A5, A6, A7, A16]
---
# KYC-03 · Open your wallet: confirm details and address, selfie

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A5 A6 A7 A16` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for A5, A6 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (R-24).

## Artboards

- **A5 · Confirm your details**: Read-only 'From your BVN' card: Name, Date of birth, Gender; then the user's home address (street address, city or town, state, in A20's field style) and Occupation (BRIEF A5); checkbox 'I agree to the terms and privacy policy'; Continue.
- **A6 · Selfie**: Camera oval: 'Fit your face in the oval. It must match your BVN photo.' Nothing says or suggests a liveness check (BRIEF A6).
- **A7 · Matched**: Success state: 'Matched to your BVN. Opening your account' (spinner while the wallet is provisioned).
- **A16 · Face doesn't match**: Selfie failure: 'We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.' Try again.

## Ruling R-6

This flow is not part of sign-up. It starts the first time someone taps Wallet
or anything that moves money, for every user, new or existing. The design draws
these screens inside sign-up; keep their look, change only where they sit. The
BVN and NIN step is A26 (KYC-05); A3 is sign-up and no longer asks for the BVN. Someone without a Nigerian BVN cannot open a Naira wallet; dollar
and crypto accounts are for them and come after launch, so for now the flow
ends with a clear "not available yet" instead of an error.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava needs the NIN and a full address to open an account, and the canvas draws neither. The NIN is taken on A26 (KYC-05). The address is added to A5 in the canvas's own field style, as BRIEF A5 describes. A6 says nothing about blinking or liveness (KYC-02). A5's name, date of birth and gender come from the BVN check; state and occupation are typed by the user.

## Brief changes (build these, not the canvas)

- **A5**: keep the BVN card exactly as is. Below it, add a full **home address**: street address, city or town, and state (the existing "State you live in" picker becomes the state part of the address). Keep Occupation. Use the field style A20 already draws for an address (Home address, City, State). (Why: Fintava fact: an account cannot open without a full address. The BVN check doesn't return an address, state or occupation, so the person types them.)
- **A6**: drop "Then blink slowly". For example: "Fit your face in the oval. It must match your BVN photo." Nothing on this screen, or on A7 and A16, may say or suggest a liveness check. (Why: Fintava fact: Fintava's API matches the selfie against the BVN photo and has no liveness check, so the app cannot claim one.)

## Capability checks

- [ ] From A26 (KYC-05), a user who taps Continue lands on A5 (this task adds that step).
- [ ] **A5**: a user can review the prefilled details; enter their home address (street, city or town, state) and occupation; tick terms/privacy consent; tap Continue (-> A6).
- [ ] **A6**: a user can fit their face in the oval and take the selfie.
- [ ] **A7**: a user can wait while the account opens (MONEY-12).
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
