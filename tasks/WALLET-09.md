---
id: WALLET-09
title: Send money to a bank
owner: YOU
area: WALLET
order: 139
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-07, MONEY-08, WALLET-15]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-09 · Send money to a bank

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W8, W10-W14, W17-W19: send to any Nigerian bank account, beside today's Flutterwave withdraw, which the web
keeps until WALLET-30.

## Scope

Bank list and name check, NIP transfer with the quoted fee (WALLET-15), note, PIN, Idempotency-Key. A timed-out
send is checked with Fintava's status endpoint before any retry (MONEY-08); a failed send arrives as
`debit_transfer_reversal` (MONEY-07) and is reversed once.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Capability checks

- [ ] The account name is confirmed before the user can send.
- [ ] A failed transfer reverses once.
- [ ] A ₦25,000 bank send shows ₦40 + ₦25 = ₦65 and debits ₦25,065; Fintava's record matches.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
