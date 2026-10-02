---
id: OPS-09
title: Set WAWU's fees as merchant charges in the Fintava sandbox dashboard
owner: YOU
area: OPS
order: 41
priority: launch
repo: fintava-dashboard
type: ops
status: todo
depends_on: []
decisions: [R-10]
passes: []
artboards: []
---
# OPS-09 · Set WAWU's fees as merchant charges in the Fintava sandbox dashboard

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/fintava/fees.md` (the dashboard rates, final; "Where WAWU's fee is added: the dashboard")
- `DECISIONS.md`: R-10

## Goal

WAWU's own fee (₦10 on a send to a WAWU user, ₦25 on a send to a bank, R-10) is added by Fintava to the same
transaction and paid into WAWU's merchant wallet. The backend then never makes a second transfer for it, which
would cost a second Fintava charge (`docs/fintava/fees.md`). This is an owner action in the sandbox dashboard;
the live dashboard is set the same way in OPS-10.

## Scope

The sandbox dashboard's "Merchant charges": ₦25 on bank transfers; ₦10 on wallet to wallet sends between two
customers. A purchase (a customer paying into WAWU's merchant wallet) carries no WAWU fee (R-10), so before
setting the wallet to wallet charge, check whether the dashboard can apply it to customer-to-customer sends only.
If it can't, set the bank charge only and stop: that question goes to the owner with what the dashboard offers
(docs/WORKFLOW.md section 10). The backend's config holds the same numbers for the fee quote (WALLET-15).

## Capability checks

- [ ] The sandbox dashboard shows WAWU's merchant charges (₦25 on bank transfers, ₦10 on sends between customers), with a screenshot saved under `docs/fintava/sandbox/`.
- [ ] It is recorded whether the wallet to wallet charge can leave transfers into WAWU's merchant wallet (purchases) untouched.
- [ ] A sandbox bank send shows the ₦25 merchant charge in `merchantComm` and it lands in WAWU's merchant wallet. Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off
