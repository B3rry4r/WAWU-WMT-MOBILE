---
id: SWEEP-INBOX
title: Inbox sweep: the low findings of communities and the Inbox
owner: YOU
area: SWEEP
order: 250
priority: launch
repo: all
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-INBOX · Inbox sweep: the low findings of communities and the Inbox

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

Communities, rooms and the Inbox: INBOX tasks. Mobile, and the backend routes they call. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| INBOX-05 | 34 | I25: when the first POST is stored but its answer is lost, the live socket delivers the stored message while the pending copy still reads "Not sent", so the same words show twice. | `tasks/INBOX-05.md`, Verifier report, finding 34, line 439 |
| INBOX-05 | 36 | The read-on's `!isFetching` is the value from the last render; a refresh landing between a page committing and its effect running is not seen. Shared with FIX-30. Very low. | `tasks/INBOX-05.md`, Verifier report, round 6 findings, line 493 |
| INBOX-05 | 37 | Test gap: nothing pins "a refused next page is asked for once, then the list's Try again" (mutant Dc survives). Very low. | `tasks/INBOX-05.md`, Verifier report, round 6 findings, line 494 |
| INBOX-21 | 4 | A forced session end (the refresh token refused, a live-feed close 4403) leaves the phone registered: the phone has no valid token left to remove itself with, so the signed-out person's sale, tip, refund and paid-question pushes keep reaching it. The fix belongs on the Hub (backend `src/push/`): drop a person's push tokens when their session ends. Only the explicit Sign out removes the phone today. | `tasks/INBOX-21.md`, Builder report, round 2; verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21.md`, finding 4 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
