---
id: X-00
title: One line, what a user gets
owner: YOU | DEV
area: e.g. WALLET, HOME, EVENTS
order: a number after every task it depends on
priority: launch | after-launch
repo: wawu-wmt-mobile | wawu-backend | wawu-id | wawuafrica | wawu-dashboard
type: setup | contract | ops | component | mobile-screen | flow | backend-endpoint | migration | third-party | money-path | removal | admin-screen | web-port | backend-refactor
status: todo | building | verifying | review | done
depends_on: [task ids]
decisions: [D or R ids]
passes: [at least what the type requires, docs/WORKFLOW.md section 5]
artboards: [ids from design/canvas-inventory.json]
tier: T0 | T1 | T2 (optional line; if missing the tier comes from type, docs/WORKFLOW.md section 4a)
---
# X-00 · Title

## Current state

At most 60 lines, rewritten at the end of every round: status, branches and hashes per repo, what is merged and live, open findings by severity (blocker, high, medium; lows point to `tasks/SWEEP-<AREA>.md`), the next step. Round reports move to `tasks/history/<ID>.md` with `python3 scripts/tasks/compact_task.py <ID>`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/<OWNER>.md`
- anything specific to this task

## Goal

What is true for a user when this is done, and why it matters.

## Scope

The files or modules this task may change. Everything else is out of bounds.

## Capability checks

- [ ] A user can ...

## Builder report

## Verifier report

## Owner sign-off
