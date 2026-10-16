---
id: SWEEP-JOIN
title: Join sweep: the low findings of /join, referral codes and campaign mail
owner: YOU
area: SWEEP
order: 249
priority: launch
repo: all
type: backend-refactor
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-JOIN · Join sweep: the low findings of /join, referral codes and campaign mail

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 5, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
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

The /join page, referral codes, the waitlist and campaign mail: JOIN, REF and EMAIL tasks. Web, backend and wawu-id. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| REF-01 | D3 | Hold spam: the places of a limited code can be held up by repeated holds. | the lead's log, 14 Oct; the report text is not in the task file |
| REF-01 | D4 | Code probing: a guessable free code can be found with the public check, and nothing slows someone trying codes one after another. | the lead's log, 14 Oct; the report text is not in the task file |
| REF-01 | D5 | `flutterwaveConfig` is optional in the contract. | the lead's log, 14 Oct; the report text is not in the task file |
| REF-01 | r2-1 | At 320 px a number with a leading zero scrolls before the field blurs. | the lead's log, 14 Oct, round 2; the report text is not in the task file |
| EMAIL-02 | JSDoc | The contract summary still says "409 when RESEND_API_KEY is unset"; the relay answers otherwise. Needs a SHARED-CHANGES row. Not a verifier finding. | the lead's log, 14 Oct, merge note; EMAIL-02 had no verifier session; the report text is not in the task file |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
