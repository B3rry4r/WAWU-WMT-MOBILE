---
id: AUTH-04
title: Sign-up: email and phone
owner: DEV
area: AUTH
order: 50
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [AUTH-02, AUTH-03, AUTH-05, UI-02]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A3, A4, A15]
---
# AUTH-04 · Sign-up: email and phone

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A3 A4 A15` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for A3, A4 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A3 · Email, phone, BVN**: Create account form, heading along the lines of 'Create your account': Email, Phone number, Password ('At least 8 characters'); Continue. No BVN field and no NIBSS line (BRIEF A3, R-6).
- **A4 · Phone code**: Verify your phone: 6-digit code 'Sent by SMS to 0803 ••• 4412' (without 'the number on your BVN': there is no BVN at sign-up; recorded in BRIEF), resend countdown 0:42, numeric keypad.
- **A15 · Wrong code**: A4 with 6 digits entered and 'That code isn't right'.

## Ruling R-6

Sign-up asks for no BVN. A3 is built without its BVN field; the BVN is asked when the user first opens a wallet (A26, KYC-05). A14 (phone doesn't match BVN) moved there too.

## Brief changes (build these, not the canvas)

- **A3**: sign-up only: Email, Phone number, Password. No BVN field, and no line about NIBSS. Heading along the lines of "Create your account". (Why: R-6.)
- **A4**: "Sent by SMS to 0803 ••• 4412". No BVN at sign-up. (Why: R-6.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A4: the accepted code (opens A11): added by AUTH-06

## Capability checks

- [ ] **A3**: a user can enter email, phone and password and tap Continue (-> A4).
- [ ] **A4**: a user can enter 6-digit code; resend after countdown.
- [ ] **A15**: a user can re-enter; resend.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as is the drawn state A15.
- [ ] From A2 (AUTH-02), a user who taps Continue reaches A3 (this task adds that step).

## What the backend serves today (from the analysis)

- **A3**: partial. Missing: No BVN field, no BVN lookup, no phone-vs-BVN match anywhere. Register requires `country` (not on board) and has no place to store BVN or a BVN-verified flag. Names are required for wallet opening (wallet.service.ts openForAccount) but the board collects none; they must come from the BVN response.
- **A4**: partial. Missing: otp/verify is a phone-LOGIN: it find-or-creates a phone-only WawuUser and issues tokens (auth.service.ts:713-748); it does not mark a registering account's phone as verified - WawuUser has no phoneVerified column. Delivery is WhatsApp, not SMS. No resend throttle beyond replacing the previous code. Separately: WAWU ID login refuses accounts with an unverified email (auth.service.ts:206-213 EMAIL_NOT_VERIFIED), and this board path never verifies the email, so a user created this way cannot sign in on A22 later.
- **A15**: partial. Missing: Error exists, but see A4: the route is a phone login, not registration phone verification; no attempt counter/lockout.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A3: 'Must be the number on your BVN'
- A3: 'Dial *565*0# to get it' (USSD code)
- A3: 'Checked with NIBSS. We never see your balances.'
- A3: password 'At least 8 characters' (matches WAWU ID MinLength(8))
- A4: 'Enter the 6-digit code'
- A4: 'Sent by SMS'
- A4: 'Resend in 0:42'
- A14: phone must equal the BVN-registered phone

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
