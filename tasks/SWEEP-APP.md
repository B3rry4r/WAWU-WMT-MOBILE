---
id: SWEEP-APP
title: App sweep: test gaps and small differences across the app
owner: YOU
area: SWEEP
order: 283
priority: after-launch
repo: all
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-APP · App sweep: test gaps and small differences across the app

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 9, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
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

Findings that belong to no one area: flaky or racy tests (FIX tasks), SCHOOLS, and the CHECK-1 audit's shell and profile lows. Mobile only. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| FIX-31 | 1 | LegalChatScreen has racy tests that read before an answer lands (three races; LEGAL-02's tests). | `tasks/FIX-31.md`, Verifier report, round 2, line 261 |
| FIX-31 | 2 | Explore "the refusal line stays up for 4 seconds" fails under delay seeds 0 and 21. | `tasks/FIX-31.md`, Verifier report, round 2, line 262 |
| FIX-31 | 3 | `requestsAnswered()` does not itself check that a request was sent. Note, low. | `tasks/FIX-31.md`, Verifier report, round 2, line 263 |
| FIX-32 | 2 | hostScreens "shows a skeleton": the stall is not a deterministic "before". | `tasks/FIX-32.md`, Verifier report, line 107 |
| SCHOOLS-03 | V2-1 | Test gaps: `Fee` with `kobo < 100` instead of `kobo === 0` survives; no screen test uses a fee between 1 and 99 kobo. | `tasks/SCHOOLS-03.md`, Verifier report, round 2, line 254 |
| SCHOOLS-03 | V2-2 | The Kiritimati date-test label is wrong (UTC+14 is never behind UTC). Note. | `tasks/SCHOOLS-03.md`, Verifier report, round 2, line 255 |
| CHECK-1 | F-1 | A production web export shows Expo's default "Unmatched Route" page for any unknown route and `/_sitemap` lists every route file. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 49 |
| CHECK-1 | F-7 | M8's `wawu/<handle>` preview is hidden for a handle with a hyphen, which the Hub would also refuse. Dated 7 Oct: re-check first. | `tasks/history/CHECK-1.md`, section 4 Findings, line 55 |
| INBOX-21 | 5 | The web export logs one console warning from expo-notifications at load ("Listening to push token changes is not yet fully supported on web"). The web build draws and works; not from this task's code. | `tasks/INBOX-21.md`, Builder report, round 2; verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21.md`, finding 5 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
