---
id: WALLET-10
title: Money in: bank transfers to the account
owner: YOU
area: WALLET
order: 150
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [MONEY-07, MONEY-10, MONEY-12, INBOX-03, SETTINGS-07]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-10 · Money in: bank transfers to the account

## Current state

live: money in by bank transfer, backend PR #137 (3797fb2), batch 2 with POINTS-04 and FIX-20.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W15: money sent to the user's account number shows up and notifies them.

## Scope

Inbound credit webhook to ledger to a 'money in' notification, honouring the user's Z3 switch (SETTINGS-07) and
sent as a push (INBOX-03).

Money in comes from the ledger (MONEY-10): MONEY-10 marks `account_funded` deliveries `processed` once they are ledger rows, so this task notifies from new `in` rows (`FintavaLedgerEntry`, `category: top_up`, `sourceEventId` names the delivery) with its own marker of what it has notified, never from the event row (`BACKEND_GAPS.md` G-33).

## Capability checks

- [ ] A sandbox transfer into the account appears in history and as a notification once.
- [ ] With "Money in" turned off in Z3, no notification is sent.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-10.md](history/WALLET-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
