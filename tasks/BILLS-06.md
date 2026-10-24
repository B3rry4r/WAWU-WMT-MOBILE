---
id: BILLS-06
title: Bill reminders
owner: YOU
area: BILLS
order: 342
priority: after-launch
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

## Current state

As of 16 Oct 2026.
- **Priority:** after-launch, set by OPS-R0 (records pass, 17 Oct 2026). Not launch work by R-42 and R-52 (owner, 7 and 16 Oct 2026): bills are switched off at the Nuvion move, not deleted, and the app draws no bill entry.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): BILLS-04.
- **History:** none yet. Reports go to tasks/history/BILLS-06.md.

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
