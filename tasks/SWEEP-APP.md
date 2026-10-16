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
- **Open lows:** 15, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
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
| FIX-18 | L1 | Test robustness, not this branch: `src/nuvion/tests/nuvion-opening.contract.spec.ts:2754` draws `addr = () => 203.0.113.${randomInt(1,250)}` while the file allows 4 tries per address per hour (`BvnCheckAttempt`); the block's 5 draws share 249 values, so any two equal and the later test gets 429 ("expected 200 got 429", CI shard 1, line 2850, 'the view says so too'). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-18.md`, finding 1 |
| FIX-10 | L1 | A lookup that times out returns the empty map, so the two existence checks read a stall as "not found": `POST /chats {wawuId}` for a real person with no Hub profile answers 404 "We could not find that account." at 3.01 s (healthy 200). Same code in event-running `personById`. `src/chat/chat.service.ts:476-486`, `src/event-ticketing/event-running.service.ts:683-692`. Same answer main gives when WAWU ID returns 500. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-10.md`, finding 1 |
| FIX-10 | L2 | `redirect: 'error'` is new on all four WAWU ID calls (`wawu-id-exchange.ts:172`); main followed redirects, and the SHARED-CHANGES row does not name it. If a platform host ever redirects, lookups fall back to handles and writes answer 500. The Hub already does this for Nuvion, Fintava and the OTP sender. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-10.md`, finding 2 |
| FIX-10 | L3 | No floor on the override: `WAWU_ID_READ_TIMEOUT_MS=1` gives 1 ms, `0x10` gives 16 ms (`wawu-id-exchange.ts:32-41`). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-10.md`, finding 3 |
| FIX-10 | L4 | One bound per lookup call, not per route: a healthy chat open makes 2 lookups, so a slow WAWU ID can cost up to 6 s. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-10.md`, finding 4 |
| FIX-09 | L1 | Stored notification text from before 21 Sep still carries a dash: `Notification.body` for the paid-DM refund read "Your N has been refunded, dash, the creator did not reply within 24 hours." until commit 259e6c5. The migration rewrites only ServiceApplication. Fix (same or a new migration): an UPDATE on "Notification" that replaces ' has been refunded ' + chr(8212) + ' the creator did not reply within 24 hours.' with ' has been refunded. The creator did not reply within 24 hours.' where body contains the first text. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-09.md`, finding 1 |
| FIX-09 | L2 | The builder's report calls the refund adapter message "logs only"; `src/direct-message/dm-refund.service.ts:263` and `:281` store it in `DirectMessage.refundError`, which admin payments returns (`admin-payments.service.ts:317`). Only an unreadable 2xx refund answer ever wrote it, so rows are very unlikely; a rewrite of old rows is optional. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-09.md`, finding 2 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
