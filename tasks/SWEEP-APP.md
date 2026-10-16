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
- **Open lows:** 33, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** the rows of FIX-09, FIX-10, FIX-15, FIX-18, FIX-19, FIX-22 and FIX-28 wait for batch 3 to merge (the code they name is on those branches until then); the other rows' source tasks are merged.
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
| FIX-19 | L1 | Scope gap, open for the lead: the existing-row count is not a number. The builder had no production access and gave the query (`tasks/history/FIX-19.md`). Run on a local stack database holding one control-character school name and one course title it answered 1 and 1, and did not match NBSP, accents, Han or emoji rows. Someone with production access must run it. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-19.md`, finding 1 |
| FIX-19 | L2 | `src/schools/tests/schools-admin-written.contract.spec.ts` (D2 beforeAll, about line 225): the "one more than the maximum is refused" assertion (121 characters, 400 "shorter than or equal to 120") now runs only for the units name, not the bytes name; the describe title "a cursor for every name the admin accepts" no longer fits the bytes rows (written to the table). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-19.md`, finding 2 |
| FIX-15 | 3 | `POST /uploads/confirm` can answer `abandoned` while the row is already `confirmed`: the file lands after confirm's check and the sweep confirms the row before confirm's guarded write. The space is counted right; only the answer is stale. Fix: read the row again before answering (`settleUpload`, `src/storage/storage.service.ts`). | `tasks/history/FIX-15.md`, Verifier report, finding 3 |
| FIX-15 | 4 | A confirm sent while the person's own upload is still running past the URL's life plus a minute (6 minutes) leaves the file uncounted until confirm is called again. A confirm inside those 6 minutes now answers `pending` and the file stays counted (round 2), so this needs a very slow upload. No screen calls the route yet. | `tasks/history/FIX-15.md`, Verifier report, finding 4 |
| FIX-15 | 5 | Round 2, design consequence: a refused upload confirmed at once answers `pending` and keeps its space for 6 minutes (second confirm) or 15 minutes (sweep). Measured: 300 MB stored, a 500 MB PUT refused (403), confirm now is `pending`, usage 800 MB, retry presign 413; after 7 minutes the same confirm is `abandoned`, usage 300 MB, retry 200. Matters only when a screen calls the route; the app task should confirm again after 6 minutes or accept the wait. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-15.md` (round 2), finding 1 |
| FIX-15 | 6 | Round 2, same class as main: `presignUpload` takes no part in the per-person advisory lock, so a presign racing a late file coming back can overshoot the limit (4 of 20 rounds: 1000 MB used, a 20 MB presign against a 20 MB late file, room 24 MB). Two parallel presigns do it 19 of 20 rounds, and on main too. Bounded by the number of parallel calls (throttle 200 per minute). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-15.md` (round 2), finding 2 |
| FIX-28 | L1 | Report accuracy: the note that `lower(` turned into `upper(` in `schools-order.ts` fails 6 of 8 in schools-collation is wrong; reproduced here it fails 4 of 8 (big page order, cursor at any school, cursor of the last school, and the new FIX-28 test). The walk test stays green because cursor and order both turn upper. The task's check (a spec fails) holds. `tasks/FIX-28.md` and `tasks/history/FIX-28.md` line 11 say 6. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-28.md`, finding 1 |
| FIX-22 | L1 | Not exercised live: the schema uses `enum`, `nullable` and `maxItems`; the only schema proven in production (`generateBrief`) uses type, properties, items, required. These are documented Gemini schema fields and the schema is small, but no key exists here to confirm the provider accepts it. If it did not, every profiling turn would end 503 assistant_unavailable (`real-gemini.adapter.ts` chat(), `legal-assistant.service.ts:601-625`). Run one live smoke when a Gemini key is available. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-22.md`, finding 1 |
| FIX-22 | L2 | Info: the schema is built from the intake's matter at turn start, the same matter the instruction lists. If the model changes matter in a turn it cannot fill the new matter's own questions until the next turn (the instruction already listed only the old matter's ids). Same effect as before in practice. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-22.md`, finding 2 |
| INBOX-21 | 5 | The web export logs one console warning from expo-notifications at load ("Listening to push token changes is not yet fully supported on web"). The web build draws and works; not from this task's code. | `tasks/INBOX-21.md`, Builder report, round 2; verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21.md`, finding 5 |
| FIX-33 | L1 | Rule breach, history only: backend commit 4e6c865 is an empty commit pushed only to re-run CI (empty commits are forbidden); it was not undone. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-33.md`, finding 1 |
| FIX-33 | L2 | Pre-existing flake, not this diff: src/admin/identity-holds/tests/admin-identity-holds.contract.spec.ts:200 scans for 11 digits in a row and a random id can hold them. FIX-34 (batch 4) fixes it, so close this row when FIX-34 is merged. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-33.md`, finding 2 |
| FIX-33 | L3 | The new test-address helper remembers its draws for one run only: rows left by an earlier run that died before afterAll stay for an hour and a fresh draw can still land on one (1 in 249 per draw against a few addresses). CI starts clean, so it only bites a reused local database. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-33.md`, finding 3 |
| FIX-33 | L4 | The helper comment says "about 1 run in 70"; an any-pair collision of the 5 old draws is 1 in 25 (only some pairs fail a test). Wording only. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-33.md`, finding 4 |
| FIX-35 | L1 | Pre-existing, not this diff: src/nuvion/tests/nuvion-documents.contract.spec.ts, describe "when both documents are accepted the opening is submitted for review exactly once" (about lines 850 to 915): the parallel-request cases sometimes get a 500 under machine load (1 run in 6 on main and on the branch). Cause not found. Candidate for its own FIX task. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`, finding 1 |
| FIX-35 | L2 | tmpEntriesHolding looks only for the markers, so a copy the service compresses (gzip of the file) is missed (plant tested: passes). The old listing compare caught any new entry. A trade-off the goal accepts. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`, finding 2 |
| FIX-35 | L3 | An entry written INTO a folder that already existed at the start of the file is skipped (same as main's top-level compare; not a regression). | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`, finding 3 |
| FIX-35 | L4 | The task text says "up to four levels"; the code has no depth limit (7 deep was caught), only a budget of 5000 entries per top-level entry. Align the task text or the code. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`, finding 4 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
