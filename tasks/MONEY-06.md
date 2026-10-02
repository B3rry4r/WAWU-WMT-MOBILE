---
id: MONEY-06
title: Fintava client
owner: YOU
area: MONEY
order: 49
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-04, OPS-02]
decisions: [R-25]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-06 · Fintava client

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A new Fintava gateway beside the Flutterwave one: one place in the backend that talks to Fintava. Fintava
goes beside Flutterwave until the web has no callers (CLAUDE.md rule 6); the web's Flutterwave paths keep working
until WALLET-30 removes them.

## Scope

Bearer-key auth (Fintava has no request signing), sandbox and live config, error mapping to our error shape,
timeouts. The Fintava variables are added to the `hub-api.env` list in wawu-backend `deploy/README.md` (step 4).
Local values live in the backend's `.env`; production values are put in `/etc/wawu/hub-api.env` on the
DigitalOcean droplet by OPS-10 (deploys go through GitHub Actions; there is no staging, R-25).

Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Base URLs: sandbox `https://dev.fintavapay.com/api/dev`, live `https://live.fintavapay.com/api/dev`. Bearer key, no request signing. Errors are `{ statusCode, message, error }` with `message` a string or an array. `/single/transfer` is deprecated: use `/transaction/wallet-to-wallet`. `/bank/credit` takes no `CustomerReference`, so a timed-out bank send is checked with Fintava before any retry (question 1 in `docs/fintava/naira-api.md`).

## Capability checks

- [ ] Against the sandbox, each call in `docs/PLAN.md` items 1 to 13 returns a typed result through the client, and a bad key gives a clear typed error. Calls refused with `403 Merchant is not active` are reported NOT RUN with that reason.
- [ ] No Fintava secret appears in logs.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
