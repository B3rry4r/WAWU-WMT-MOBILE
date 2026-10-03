---
id: SCHOOLS-11
title: Pay schools their share of course fees
owner: DEV3
area: SCHOOLS
order: 145
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [SCHOOLS-07, WALLET-09]
decisions: [R-12, R-10, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-11 · Pay schools their share of course fees

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Enrolment money reaches the school at the ruled split.

## Scope

School payee details and verification; settlement from WAWU's merchant wallet at R-12's split. A school that isn't
on WAWU is paid by bank transfer (WALLET-09; Fintava's ₦40 is WAWU's, R-31). Paid at intake start; a cancelled
intake refunds the student's course fee to their wallet (the R-10 refund default).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Capability checks

- [ ] After an enrolment, the school's settlement equals the ruled amount and the ledger shows WAWU's share.
- [ ] V8: a replayed settlement does not pay twice.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
