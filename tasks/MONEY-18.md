---
id: MONEY-18
title: Hold, release and refund
owner: YOU
area: MONEY
order: 91
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17]
decisions: [R-19, R-10, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-18 · Hold, release and refund

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Paid DMs and tickets hold money until something happens, then pay out or refund.

## Scope

Hold (a transfer into WAWU's merchant wallet, R-19), release to the payee, refund to the payer.

Fintava's charge on a release or a refund is WAWU's to pay (R-31).

Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava's API can't reserve part of a balance, so a hold is a transfer into WAWU's merchant wallet (`/transaction/wallet-to-wallet` with our `CustomerReference`), released by a transfer to the payee or refunded by a transfer back (R-19). The nightly check (MONEY-16) also checks that held money in WAWU's wallet equals the open holds in our ledger.

## Capability checks

- [ ] A held payment is not spendable by the payer and not yet paid to the payee.
- [ ] A refund returns the price (not Fintava's charge) to the payer's wallet once, even if requested twice (R-10).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
