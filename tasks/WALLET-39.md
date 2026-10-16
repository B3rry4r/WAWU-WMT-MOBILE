---
id: WALLET-39
title: A notice for all money in
owner: YOU
area: WALLET
order: 261
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [INBOX-03, WALLET-10, NUV-05, MONEY-10]
decisions: [R-54]
passes: [V1, V2, V3, V4, V7, V8, V9]
artboards: []
---
# WALLET-39 · A notice for all money in

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/WALLET-39.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-54 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Every credit to a wallet sends the person a notice: money from a Who Made This? user, earnings that land, refunds, and bank transfers in (R-54). Tapping it opens the right screen (W46 for a bank transfer in).

## Scope

- One `money_in` notification kind written from the ledger credit (one per ledger entry, idempotent), in the app's notification list and as a phone push (INBOX-03). Text names the amount and the source ("from Tolu B.", "earnings", "refund", "from GTBank ••0921") and never prints a full account number. No em-dash in any text.
- Sources covered: wallet-to-wallet receipts (NUV-05), earnings landed (WALLET-16 when it merges: register the hook, do not wait), refunds and releases (NUV-05 holds), bank transfers in (WALLET-10, NUV-04 `account_funded`).
- The notice carries the transaction id so the app opens the receipt (WALLET-04) or, for a bank transfer in while the person is on W45, the W46 screen.

## Capability checks

- [ ] A friend's send, a landed earning, a refund and a bank transfer each make exactly one notice; a repeated delivery makes none more.
- [ ] The notice shows the amount and source, no account number.
- [ ] A reversed credit does not leave a "received" notice standing without a following correction notice.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
