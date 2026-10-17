# EVENTS-10 verifier report (17 Oct 2026)

Backend `wmt/EVENTS-10` 1b0ea03 on `wmt/MERGE-6` fbf391f; mobile record 1de1658. Stack `events_10` (7560-7567), Fintava double, no provider called. Stack down, ports closed, worktrees removed, database dropped.
Evidence: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/events-10-evidence/ (my five attack specs, the web probe, logs).

## Verdict: merge (nothing medium or worse in the build). Lead decision open: abuse cap (finding 5).

## Checks
| Attack | Result |
|---|---|
| CI on 1b0ea03 (3 suite shards, contract, gates, baseline, protected routes, netns, deploy-test-in-sync) | all success |
| 6 parallel cancels + 3 sweeps + 2 retries + hold sweep, 4 buyers | one move per order, balance back to start, exactly 2 ledger rows per refund |
| 20 parallel cancels + sweeps, 3 s provider, 10 buyers | one send per order (attempt 1), no hold in review, bystander max 38 ms |
| Cancel racing ticket issue, 14 + 40 rounds, jitter 0-195 ms | 0 bad: always failed or refunded order, no live ticket, one refund |
| 20 buyers, 3 s provider, cancel truly concurrent with a bystander read | request 12.3 s, bystander max 15 ms, raw query max 3 ms, idle-in-transaction max 1 |
| 12 buyers, provider hangs 20 s | request 20.2 s, 5 moves begun, nothing held (idle-in-tx max 2), sweeps finish: 12 of 12 exactly once |
| Refund move done but answer lost (hang-up) | hold refunded, one move, balance back |
| Call-off with provider down, then host erased | one move, whole total, balance back |
| Release already chosen, then cancel | order stays paid, refundError says why, counted in refundsNeedingAttention, sweep leaves it, no move (G-793) |
| 120 orders (more than 2 pages) | 120 refunded, 120 moves, 2.1 s |
| Ledger of one refund | merchant out 751575 (fee 1575 on the row) and user in 751575 |
| Stranger cancel 403, no token 401, My tickets detail of a void ticket 200 (stranger 404), `view=past` lists it | pass |
| Started event called off | refunded in full (per lead ruling) |
| Web Flutterwave cancel, before/after probe (base fbf391f vs head) | identical: 403/401/404/201/409, counts, order and ticket states, one refundCharge call, timing; only a random id differs |
| EVENTS-07 assertion change | 3 lines (cancel counts 0 to 1, order paid to refunded, hold held to refunded); nothing else weakened |
| Fenced files / em-dashes in the diff | none touched / none |

## Findings
1. low, `src/event-ticketing/tests/event-call-off-refund.contract.spec.ts` ~line 508 ("refunds twenty buyers ..."): `const cancelling = callOff(e);` is a lazy supertest object, so the request is sent only at `await cancelling`, after the bystander reads. The "another person's read under 1 s" and "under 25 s" assertions never ran against the cancel. I re-measured with `.then()` (rows B1, B2, E1): the product passes. Fix the test, no product change.
2. low, `src/event-ticketing/wallet/event-call-off-refund.service.ts` line 18 (`REQUEST_BUDGET_MS`) and `eachWithin`: the 15 s limit stops new work only; in-flight provider calls finish (hang 20 s gave a 20.2 s request; worst case 15 s + 30 s provider timeout). The answer for a stopped request says `ordersRefunded: 5, refundsNeedingAttention: 0` and does not say 7 are left to the sweep. In a mixed event the Flutterwave loop (web buyers) now runs after this step in `event-ticketing.service.ts` line ~776 and waits behind it. Sweep list.
3. low, pre-existing (same code on base): `event-ticketing.service.ts` `cancel()` checks `cancelledAt` before an unconditional update, so two simultaneous cancels can both return 201 (2 of 6, 2 of 20 here) and the second overwrites `cancelReason`. Wallet money stays once per hold. A `cancelledAt: null` guard on the update would close it (it would also close a possible double Flutterwave `refundCharge` on the web path). Not caused by this task.
4. low, pre-existing (same on base): a FREE order created in the same instant as the cancel keeps a `valid` ticket on the called-off event (13 of 60 rounds with the cancel 0-15 ms apart, identical on base). The new share lock covers `issue()` only; `make()` for `free` orders takes none, and check-in refuses only `void` tickets (`event-running.service.ts` ~line 500). No money. Fix: the same `FOR SHARE` read of the event row in `make()` when free.
5. Abuse (differs for a recorded reason, R-31 and the lead's 16 Oct ruling; exposure graded medium, lead's call, not held against the merge). Measured on the double with the dashboard rates: each refunded order costs WAWU the charge it hands back plus the Fintava charge on the refund transfer. Ticket under 5,000 naira: 23.25 + 23.25 = 46.50 naira per order. 5,000 naira and up: 15.75 + 15.75 = 31.50 naira per order. The cost is per ORDER, not per ticket, and nothing bounds orders per event: one buyer placed 80 orders on one event with no 429, 120 refunded in one cancel, and a refunded payment does not count toward the daily purchase limit (FIX-40), so the buyer can re-buy. A verified host plus a funded buyer (their own money comes back) can make WAWU pay 46.50 naira per 100-naira order: 1,000 orders in one event is 46,500 naira, one cancel. The attacker gains nothing but WAWU loses; the cost needs a moderated event and a verified host. Suggested follow-up (a rule, not a fix to this build): cap open orders per buyer per event, or return the charge only on the first N orders per event.

## Not done
Real Fintava sandbox (no keys). MONEY-16 nightly check not run (both ledger rows verified). HTTP throttling in production not tested (the harness has no throttler).
