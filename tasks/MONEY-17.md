---
id: MONEY-17
title: Pay from wallet
owner: YOU
area: MONEY
order: 90
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-09, MONEY-10, MONEY-13, WALLET-15]
decisions: [R-5, R-10, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-17 · Pay from wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

One shared way to take a payment from a user's wallet for anything WAWU sells.

## Scope

A debit from the buyer's wallet to WAWU's Fintava merchant wallet (R-19), with the 85/15 split on the ledger
and an Idempotency-Key. The buyer pays the price plus Fintava's balance-transfer charge from the fee quote
(WALLET-15), and the seller's 85% is of the price (R-10). A user with no wallet gets the `no_wallet` answer
(MONEY-13). Fintava's charge on WAWU's own later movements (releases, refunds, payouts) is paid by WAWU from its
15% (R-31).

## Capability checks

- [ ] A buyer paying for a ₦1,000 item is debited ₦1,023.25 once (₦1,000 + Fintava's ₦23.25 from the fee quote); the ledger shows the creator's ₦850 and WAWU's ₦150.
- [ ] The same request sent twice debits once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
