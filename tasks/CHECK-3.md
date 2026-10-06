---
id: CHECK-3
title: Checkpoint 3: full verification and QA (nothing new is built)
owner: YOU
area: CHECK
order: 181
priority: launch
repo: all
type: ops
status: todo
depends_on: [CHECK-2, RELEASE-01, ADS-01, ADS-02, BILLS-05, EVENTS-08, INBOX-14, INBOX-18, LEGAL-07, ME-03, ME-13, OPS-08, SCHOOLS-05, SETTINGS-05, SUPPORT-01, WALLET-01, WALLET-11]
decisions: [R-24, R-27]
passes: [V10, V11]
artboards: []
---
# CHECK-3 · Checkpoint 3: full verification and QA (nothing new is built)

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. An independent AUDITOR session checks everything built: every artboard picture
against picture, every hub against its artboard in full, every flow as every type of user, every payment path
attacked, release builds on the owner's Android phone. Its defects are fixed in RELEASE-02.

## Scope

An AUDITOR session over the whole app: every launch artboard compared picture against picture, every flow walked
as every type of user, release builds on the owner's Android phone (R-24). Every hub and menu matches its artboard
in full: every row, tile, tab and button the artboard draws is there and leads where it should (R-27). The only
entries allowed missing are those whose destination is an after-launch task, listed in `docs/designer/BRIEF.md`,
"Not built at launch".

## Capability checks

- [ ] Every launch artboard is either compared and conforming, or listed with a reason.
- [ ] Every hub and menu matches its artboard in full, apart from the entries `docs/designer/BRIEF.md` lists as not built at launch, and every entry leads where the artboard says.
- [ ] No open defects.
- [ ] Release builds work on the owner's Android phone (network, camera, push, deep links).

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
