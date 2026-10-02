---
id: MONEY-07
title: Fintava webhooks
owner: YOU
area: MONEY
order: 53
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-06]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-07 · Fintava webhooks

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Money that arrives or settles while nobody is looking is still recorded once.

## Scope

Webhook endpoint with signature check, an event store keyed by the transaction reference (Fintava sends no event id), safe to replay.

Webhooks reach the local backend through the tunnel (docs/WORKFLOW.md section 6); the production webhook URL is registered by OPS-10.

Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Signature: HMAC-SHA512 of the raw body with the dashboard webhook secret, hex, in `x-fintava-signature`, compared in constant time. No timestamp and no event id: deduplicate on the transaction reference. Retries: live every 3 minutes for 4 tries, then hourly for 72 hours. Events: `account_funded`, `virtual_wallet_payment` (possibly upper case), `customer_bank_transfer`, `wallet_to_wallet_transfer_v2`, `debit_transfer_reversal` (how a failed bank send shows up), `card_payment`, `dynamic_card_payment`. The name field is `event` in one page and `type` in another: read both.

## Capability checks

- [ ] A forged signature is refused.
- [ ] The same webhook delivered three times is processed once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
