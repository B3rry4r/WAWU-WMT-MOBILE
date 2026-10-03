---
id: WALLET-15
title: Fee quotes
owner: YOU
area: WALLET
order: 90
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-04, OPS-09]
decisions: [R-10, R-31]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-15 · Fee quotes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Every fee shown before paying comes from the server, never from the app.

## Scope

GET a fee quote, from configuration set per R-10 (Fintava's charge plus WAWU's fee), for:
- a purchase (unlock, tip, tick, ticket, paid DM, credits, course, legal service): Fintava's balance-transfer
  charge by amount band, no WAWU fee;
- a bill: Fintava's bill charge by category (₦100 electricity or cable, ₦0 airtime or data) plus WAWU's bill fee
  (₦0 today), and the payer's balance-transfer charge into WAWU's wallet (R-31);
- a send to a WAWU user: Fintava's balance-transfer charge by band + WAWU's ₦10;
- a send or withdrawal to a bank: ₦40 + ₦25.
Card top-up and card order are added by WALLET-25 and WALLET-31 after launch. The rates are the dashboard ones in
`docs/fintava/fees.md` (final).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

The user pays Fintava's fee plus WAWU's fee (R-10). The quote is Fintava's fee for that action plus WAWU's fee from config, shown as one total with both parts in the breakdown. Fintava's charges are in `docs/fintava/fees.md`. WAWU's fee is set as a merchant charge in Fintava's dashboard; config holds the same numbers so the quote shows the total before the user confirms.

## Capability checks

- [ ] A user sending ₦10,000 to a bank sees ₦40 + ₦25 = ₦65 and a total of ₦10,065 before confirming, and Fintava's record of that transfer debits ₦10,065. A difference between config and the dashboard is reported by MONEY-16.
- [ ] A user sees the same total on the review screen and in the debit for a ₦4,999 and a ₦5,000 purchase (₦23.25 and ₦15.75 charges).
- [ ] An electricity bill of ₦10,000 quotes its ₦100 bill charge and the payer's balance-transfer charge, each as its own part.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
