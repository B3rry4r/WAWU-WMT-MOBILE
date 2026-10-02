---
id: MONEY-08
title: Status checks and the pending sweep
owner: YOU
area: MONEY
order: 66
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-07, MONEY-10]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-08 · Status checks and the pending sweep

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A transfer stuck 'pending' because a webhook never came gets settled anyway.

## Scope

Port the existing reconcile-pending pattern to Fintava's status endpoint, on a schedule.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

Work from the ledger (MONEY-10), not the event rows: MONEY-10 marks `customer_bank_transfer` and `debit_transfer_reversal` deliveries `processed` once applied, so this task settles `pending` ledger rows (`LedgerConsumerService.reconcileEntry` asks Fintava for one) and reads a reversal as the row's `reversed` status (`BACKEND_GAPS.md` G-28).

## Capability checks

- [ ] A transfer whose webhook is withheld settles correctly within one sweep.
- [ ] A transfer Fintava reports failed is reversed exactly once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
