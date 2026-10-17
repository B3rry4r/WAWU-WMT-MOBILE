---
id: SWEEP-EVENTS
title: Events sweep: the low findings of events and the door
owner: YOU
area: SWEEP
order: 251
priority: launch
repo: all
type: backend-refactor
status: todo
depends_on: [EVENTS-11]
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-EVENTS · Events sweep: the low findings of events and the door

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 12, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here. Closed: EVENTS-10 F2 by EVENTS-13 (backend `wmt/EVENTS-13` `b22e1b6`: the call-off answer says `ordersLeftToSweep`; the 15 s budget stays).
- **Waits on:** EVENTS-11 (not merged yet; its lows are listed now so none is lost).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Events, tickets and the door scan: EVENTS tasks. Backend and mobile. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| EVENTS-11 | O7 | Spec gap: three mutants of the tier-retire logic survive (the organiser's `remaining` with a retired tier, re-sending a tier identical to a retired one). | branch `wmt/EVENTS-11`, `tasks/EVENTS-11.md`, Verifier report, round 5, line 298 |
| EVENTS-11 | O8 | Once a ticket sold on a retired tier, the sold 409 names two tiers with the same name, one hidden from the host. Confusing message. | branch `wmt/EVENTS-11`, `tasks/EVENTS-11.md`, Verifier report, round 5, line 303 |
| EVENTS-09 | N1 | The queue of two or more typed codes is unreachable and untested. Low. | `tasks/EVENTS-09.md`, Verifier report, round 3, line 437 |
| EVENTS-09 | N2 | Two test gaps in the builder's file: a code typed over an unseen problem, and a tap-dismissed verdict followed by a new scan inside 3 s (stale hold timer). | `tasks/EVENTS-09.md`, Verifier report, round 3, line 438 |
| EVENTS-07 | R3-1 | Backend: the host-erase hook (`src/event-ticketing/wallet/event-host-erasure.service.ts`) only detaches events that ALREADY have a wallet order. An event with none when the hook reads, that gets a first quote AND a PIN-paid order before the purge deletes the Event row, is still cascade-deleted with the hold left `held` (spec zz-vr3c C1, window simulated by a spy; buyer short 751,575 kobo). Needs the whole purchase inside the purge's runtime. A one-line widening (detach every upcoming or begun event of the host, not only those with wallet orders) closes it. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-07.md`, rounds 2 and 3, new finding 1 |
| EVENTS-07 | R3-3 | Backend: the wallet-order create answers `wallet_not_open`, `wallet_opening`, `idempotency_key_*` and `fees_not_set` that are only in the operation description of `contract/openapi.json`, not typed errors, so the app client will not get them as typed (accepted by the lead for now). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-07.md`, rounds 2 and 3, new finding 3 |
| EVENTS-13 | R2-1 | Backend (`src/event-ticketing/tests/event-call-off-refund.contract.spec.ts`, the twenty-buyers test): in 1 of 30 runs a bystander read after the cancel took 1.5 s under load, during the test's post-cancel sweeps (13.3 s against the cancel's end at 12.4 s), at the unchanged max-read assertion. The lead kept the assertion as it is (a slow read during the sweeps is real if it happens). Look at whether those post-cancel sweeps hold connections. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/merge-notes.md` (17 Oct 07:30 entry) and `tasks/EVENTS-13.md` |
| EVENTS-06 | L1 | src/features/events/useTicketBuy.ts around line 357 (case "refused"): after the Hub refuses for sold out, E2's tier list is not refetched (afterMoney runs only when an order settles), so the page behind still says "Regular 1 left" with Get tickets enabled. Repro: an event with 1 seat, Get tickets, let someone else buy it, Pay, PIN, Try again (t_sold3.py). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 1` |
| EVENTS-06 | L3 | SHARED-CHANGES EVENTS-06 #1 (filed): the pay button reads "Pay · 7,500", the artboard "Pay 7,500". E3 shows "Bank charge 0" where the artboard says "No fee" (the fee is 0 on this stack). Decide the words. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 3` |
| EVENTS-06 | L4 | E2 starts with the first tier the Hub lists; the Hub lists the free tier first, so a mixed event opens with "Free entry 1" and the priced tier at 0 (the artboard has the priced tier first). Unclear whose order is right: Hub list order or the app. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 4` |
| EVENTS-08 | L1 | A called-off event's E18 shows "Left 110" and Sold 0: the Hub counts all voided tickets as left. The figures are the Hub's own, but "Left" has no meaning for a called-off event. Hide "Left" once called off. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-08.md, finding 1` |
| EVENTS-08 | L2 | The buyer's refund line was only checked with a zero Nuvion fee (the stack's book-transfer fee is 0), so "the provider's charge comes back too" (EVENTS-10 ruling) was not seen on the stack; EVENTS-10's own spec covers it. Run it with a non-zero fee. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-08.md, finding 2` |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
