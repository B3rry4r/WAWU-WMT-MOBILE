---
id: WALLET-10
title: Money in: bank transfers to the account
owner: YOU
area: WALLET
order: 150
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-07, MONEY-10, MONEY-12, INBOX-03, SETTINGS-07]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-10 · Money in: bank transfers to the account

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Verified once: the money path held (49 live attacks, 0 failed); by the 15 Oct rule the verdict is merge, nothing medium or worse. Stacked on WALLET-07 (this branch contains `wmt/WALLET-07`, which contains NUV-06 and MONEY-16); backend main `18ac5f9` is merged in.
- **Branches:** mobile `wmt/WALLET-10` (this branch; WALLET-07's mobile head merged, API types regenerated from backend `wmt/WALLET-10`). Backend `wmt/WALLET-10` (main `18ac5f9` merged; migration renamed to `20261021300000_money_in_notices`, contents unchanged). No PRs yet.
- **Merged and live:** nothing of this task.
- **Open findings:** blocker 0, high 0, medium 0. The lows (plain `CREATE INDEX` blocks writes while it builds; the ledger fold does not carry the mark, G-734; a re-signed delivery flips a completed row to pending, MONEY-10) are in tasks/SWEEP-MONEY.md. G-732 (transfers, earnings and refunds tell nobody) is a lead ruling on record, not a defect.
- **Next:** the lead opens one backend pull request from the FIX-20 head (WALLET-10, POINTS-04 and FIX-20 stacked) for the owner to merge, then mobile sign-off.
- **Records:** the round history is in tasks/history/WALLET-10.md.

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
