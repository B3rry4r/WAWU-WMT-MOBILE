---
id: EVENTS-07
title: Buy event tickets from the wallet (backend)
owner: DEV3
area: EVENTS
order: 101
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-18, MONEY-13, MONEY-16, WALLET-15, EVENTS-02]
decisions: [R-8, R-10, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# EVENTS-07 · Buy event tickets from the wallet (backend)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

Tickets are paid from the buyer's wallet with the PIN; the money waits in WAWU's merchant wallet until the event (R-19); a ₦0 ticket needs no debit (R-8). The web keeps Flutterwave until after launch.

## Scope

Buying tickets pays from the wallet (E3-E5, E10); the order reference stops being Flutterwave-specific (additive column, old one kept until after launch). The web stays on Flutterwave until after launch; V3 checks it still works.

Also: basket order lines, so Regular and VIP are bought in one payment (E2); ₦0 orders issue tickets without a debit.

## Capability checks

- [ ] A user buys a Regular and a VIP ticket in one payment (E2 basket) and is debited the quoted total once.
- [ ] A user gets a ticket to a ₦0 event without a wallet or a PIN (R-8).
- [ ] Ticket money waits in WAWU's merchant wallet until the event (R-19).
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
