---
id: MONEY-12
title: Open a Fintava account when someone opens a wallet
owner: YOU
area: MONEY
order: 79
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-06, KYC-01, KYC-02]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-12 · Open a Fintava account when someone opens a wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A8: when a user finishes Open your wallet, they get their own Fintava account (R-6: never at sign-up).

## Scope

Account opening after BVN, NIN and address, safe to retry, a visible 'still opening' state, the account number shown on W1.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /create/customer` requires first and last name, phone, email, `fundingMethod: STATIC_FUND`, address, date of birth, BVN **and NIN**, and returns the account number at once. Store customerId (`userInfo.id`), walletId (`wallet.id`) and the account number. There is no tier in the API: open a normal account; limits are a question for Fintava.

## Capability checks

- [ ] A sandbox user who finishes Open your wallet has an account number that Fintava also reports.
- [ ] Retrying a failed opening never opens two accounts.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
