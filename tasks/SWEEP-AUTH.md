---
id: SWEEP-AUTH
title: Auth sweep: the low findings of sign-up and sign-in
owner: YOU
area: SWEEP
order: 252
priority: launch
repo: all
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-AUTH · Auth sweep: the low findings of sign-up and sign-in

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 4, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** nothing (every source task is merged).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Sign-up, sign-in and account recovery screens: AUTH tasks, and the findings of the CHECK-1 audit that belong to them. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| AUTH-07 | N-2 | `knownSignupChannel()` is last-writer-wins at module level, so a late answer from an earlier visit can set what a newly mounted A3 draws first. | `tasks/AUTH-07.md`, Verifier report, round 4, line 517 |
| AUTH-07 | N-3 | Nit: `sign-up.tsx`'s header comment says the line is asked on arrival; it is asked on each focus. | `tasks/AUTH-07.md`, Verifier report, round 4, line 518 |
| CHECK-1 | F-6 | A3's heading sits 9 px lower than the render, the phone number is not grouped as drawn, A8's button carries an arrow the render does not. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 54 |
| CHECK-1 | F-8 | An account whose email was never confirmed signs in to a message with no screen to finish confirming. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 56 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
