---
id: AUTH-03
title: Phone check at sign-up, and the email trap
owner: DEV
area: AUTH
order: 30
priority: launch
repo: wawu-id
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-6]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-03 · Phone check at sign-up, and the email trap

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

A4 verifies the phone. The canvas never verifies email, but login refuses unverified email today, so a new user could never sign back in.

## Scope

Phone code at registration; fix the login rule so a phone-verified account can sign in even without a verified email (the design never verifies email, but login refuses it today); store account type (A2). No BVN here (R-6); occupation is asked on A5, inside Open your wallet, and stored by KYC-01.

BACKEND_GAPS G-2 (register issues tokens before anything is confirmed) is this task's to settle: tokens are issued once the sign-up proof the design draws, the phone code on A4, is done.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava has `GET /compliance/verify/phone-number` and `POST /sms/send`. Codes go by SMS through `POST /sms/send` (₦7 each, `docs/fintava/fees.md`); MONEY-14 reuses the same route for PIN resets.

## Capability checks

- [ ] A user who signs up on mobile can sign out and sign back in.
- [ ] A wrong code shows A15 and a fourth wrong code waits before retrying.
- [ ] A user who registers but never enters the phone code holds no token that the Hub accepts (G-2).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
