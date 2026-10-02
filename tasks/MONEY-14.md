---
id: MONEY-14
title: Reset the PIN, and approve with fingerprint or face
owner: YOU
area: MONEY
order: 102
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-09, AUTH-03]
decisions: [R-24, R-26, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9, V10]
artboards: []
---
# MONEY-14 · Reset the PIN, and approve with fingerprint or face

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W37: reset the PIN by a code to the phone. W35: the phone's own biometric prompt (fingerprint or face unlock,
whichever it has; `expo-local-authentication`, R-26) can stand in for the PIN.

## Scope

PIN reset by a code sent through the same SMS route as AUTH-03 (Fintava's `POST /sms/send`); device key
registration so a biometric approval on a known device counts as the PIN. A failed biometric prompt never uses up
a PIN try.

V10 runs on a real Android phone only (R-24).

## Capability checks

- [ ] A user who forgot their PIN can reset it with a code and pay again.
- [ ] An approval from an unregistered device is refused.
- [ ] A user whose fingerprint fails sees "Fingerprint failed. Use your PIN." and still has all five PIN tries.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
