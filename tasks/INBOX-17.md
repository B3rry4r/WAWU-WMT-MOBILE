---
id: INBOX-17
title: Paid questions: pay, hold, pay out and refund through the wallet (backend)
owner: DEV2
area: INBOX
order: 110
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-18, MONEY-13, MONEY-16, WALLET-15, WALLET-16, INBOX-08, INBOX-09]
decisions: [R-10, R-11, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-17 · Paid questions: pay, hold, pay out and refund through the wallet (backend)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A fan pays for a paid question from their wallet; the money waits in WAWU's merchant wallet (R-19) until the creator answers (85% to the creator, R-11) or the window passes (the price back to the fan, R-10). The web keeps Flutterwave until after launch.

## Scope

Sending a paid DM holds the money; a reply releases it to the creator; expiry refunds it to the sender's wallet (I3-I11). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A fan pays a paid question and the money sits in WAWU's merchant wallet, not the creator's (R-19).
- [ ] The creator replies and 85% of the price lands in the creator's wallet, or waits until they open one (R-11).
- [ ] No reply by the deadline and the fan gets the price back, not Fintava's charge (R-10).
- [ ] A creator switched off by INBOX-09 cannot receive a new paid question.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
