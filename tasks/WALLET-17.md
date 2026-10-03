---
id: WALLET-17
title: Hosts receive their share: community credits and event tickets
owner: YOU
area: WALLET
order: 157
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-18, WALLET-16, EVENTS-07, INBOX-16]
decisions: [R-5, R-11, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-17 · Hosts receive their share: community credits and event tickets

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Community hosts' share of credits spent in their room, and event hosts' 85% of ticket sales, are computed today
but never paid. This is the one task that pays both (Lead, 2 Oct 2026); EVENTS-10 keeps the refunds.

## Scope

Fund CreditSpendEarning.hostShareKobo into the community host's wallet as credits are spent, and pay each event
host 85% of the ticket price for the tickets sold, from WAWU's merchant wallet once the event has taken place
(EVENTS-07 holds the ticket money there, R-19). A host without a wallet keeps the share, which lands when they
open one (R-11, WALLET-16). Fintava's charge on each payout is WAWU's (R-31).

## Capability checks

- [ ] After members spend credits in a community, the host's wallet grows by their share.
- [ ] After an event, the host's wallet receives 85% of ticket sales once, even if the payout job runs twice.
- [ ] A host without a wallet keeps the share, and it lands once when they open one.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
