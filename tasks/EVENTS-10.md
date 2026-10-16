---
id: EVENTS-10
title: Refund ticket buyers when an event is called off
owner: YOU
area: EVENTS
order: 149
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [EVENTS-07, MONEY-18]
decisions: [R-10, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# EVENTS-10 · Refund ticket buyers when an event is called off

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs EVENTS-07, MONEY-18 built first.
- **History:** none yet. Reports go to tasks/history/EVENTS-10.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Calling an event off (E25) returns each buyer's ticket price to their wallet (E11). Host payouts are WALLET-17's (Lead, 2 Oct 2026).

## Scope

Refunds from WAWU's merchant wallet, where ticket money waits (R-19): the ticket price comes back, not Fintava's charge (R-10), and Fintava's charge on the refund is WAWU's (R-31). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] Calling an event off returns each buyer's ticket price to their wallet once (R-10).
- [ ] Running the refund twice pays each buyer once (V8).
- [ ] The ledger and Fintava agree after the refunds (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
