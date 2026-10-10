---
id: BILLS-06
title: Bill reminders
owner: YOU
area: BILLS
order: 128
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [INBOX-03, BILLS-04]
decisions: [R-33]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
On hold since 6 Oct 2026: the wallet provider is moving from Fintava to Nuvion, which has no bill payments. The owner decides whether bills stay (drop, or a separate bills provider).

# BILLS-06 · Bill reminders

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S27-S32: reminders for bills on and off WAWU, with a month view.

## Scope

BillReminder with create, edit, delete; paid state from real bill payments; a daily job that sends reminders.

Built at launch (R-33). Reminders go out as pushes through INBOX-03.

## Capability checks

- [ ] A reminder due today sends one push.
- [ ] Paying the bill on WAWU marks that month paid.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
