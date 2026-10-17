---
id: EVENTS-13
title: Call-off: order cap, cancel once, free tickets
owner: YOU
area: EVENTS
order: 295
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [EVENTS-07, EVENTS-10, TIER-06]
decisions: [R-8, R-10, R-31, R-65]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# EVENTS-13 · Call-off: order cap, cancel once, free tickets

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-13.md`, round 1 verdict fix, one medium: the twenty-buyers test); round 2 fixed it and the lead accepted round 2 on review, with no second check. Stacked in batch 7 (backend and mobile `wmt/MERGE-7`). Takes EVENTS-10's verifier findings 1, 2, 3, 4 and 5 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-10.md`).
- **Branches:** backend `wmt/EVENTS-13` `bce009c` (round 2; round 1 `b22e1b6`) on `wmt/MERGE-7` `ca9ec13`; mobile record `wmt/EVENTS-13` on `wmt/MERGE-7`. No wawu-id, no web.
- **Migration:** none. A new money error code, a new admin setting row (no schema change), one field that is present only in some answers.
- **What is built (backend):**
  - **Order cap.** A buyer holds at most N open PAID wallet orders on one event (open = `paid`, or claimed and not yet delivered; `failed` and `refunded` free the place; a free order is never counted). N is the admin setting `events.open_orders_per_buyer` ("Most open ticket orders per buyer per event", default 10, at least 1, in `src/plan-settings`, audited by the registry, reloaded with no restart). Order N+1 is `409 event_order_limit`, "You have reached the order limit for this event.", in the money error shape.
  - **Where it is checked.** `POST /events/:id/orders/wallet` refuses early when the buyer is already at N (a plain count). The authority is the payment's claim: a new optional hook `PayableKindHandler.beforeClaim` (`src/money/payments/payable-registry.ts`) runs inside the claim's transaction in `WalletPaymentService.claim`, after WAWU's limits and before the payment row, takes one advisory lock for buyer plus event, counts and throws. Parallel payments take turns on the lock and the second counts the first's committed claim, so N is never exceeded; a refusal records nothing and sends nothing. The transaction is database only, no network call. The web's Flutterwave ticket routes are untouched (the cap is on the wallet routes only).
  - **Cancel once.** `EventTicketingService.cancel` updates the event with `where: { id, cancelledAt: null }` in one transaction with the ticket void. The loser changes nothing and answers `409 This event is already cancelled.`, the answer a later cancel already got. Only the winner runs the refunds. Protected registry entry `POST /events/:id/cancel`: 201 shape and the 403/401/404/409 answers unchanged.
  - **Free order against a cancel.** `make()` for a free order takes the same `FOR SHARE` read of the event row as `issue()` (one helper, `assertNotCalledOff`) and refuses a called-off event with `409 target_not_payable`, "This event has been cancelled.".
  - **F2 (budget).** The call-off answer carries `ordersLeftToSweep` when the request's 15 s ran out or a refund could not be asked yet: `ordersRefunded + refundsNeedingAttention + ordersLeftToSweep` equals the paid orders. The field is left out when it is 0, because the protected registry locks this answer's shape (a new key fails V3 as "response widened"). The budget is unchanged. Row "EVENTS-10 F2" is closed in `tasks/SWEEP-EVENTS.md`.
  - **Twenty-buyers test fixed** (`event-call-off-refund.contract.spec.ts`). See the cause below.
- **Cause of the twenty-buyers flake, with numbers.** It was not the 15 s budget: in 12 of 12 clean runs the cancel took 12.3 to 12.6 s and answered 20 refunded. The missing refund is a hold that was chosen and not yet sent when ANOTHER process's minute hold sweep on the same database took its lease. The local stack's Hub (same database, Fintava on a closed port) did that at 05:46:00: 60 holds of the test logged "Fintava could not be reached (the request was not sent)" in `hub.log`; the rows read `sentAt null`, `waiting provider`, `nextAttemptAt` two minutes after `actionAt` (8 ms after the choice). The answer still counted them refunded (the refund is chosen), so the buyer was short until the back-off ended. Not a product defect: in production every server shares one provider. The test now sends its cancel first, logs the timings, and after the answer runs its own sweeps (30 s cap) until every buyer is whole with exactly one move.
- **Checks:** `tsc --noEmit` 0; eslint 0 on the changed files; new specs `event-order-cap` (4) and `event-cancel-race` (4); `event-call-off-refund` (10); twenty-buyers test 30 of 30 under load (3 jest processes at once, load average up to 12.8; 10 on the stack's database with its Hub, 20 on two own databases); the touched event, plan-settings, money-contract and wallet-payment specs pass. GitHub on `b22e1b6`: the 3 suite shards, contract, netns, deploy-test-in-sync (run 39008684830), baseline (39008684840) and the protected route suite (39008684773, which probes `POST /events/:id/cancel`) all pass; the gates job fails on its one `FAIL` (`src/content-piece/content-piece.service.ts:67`), the same as main. Mobile: typecheck, lint, tests, gates and tasks, `EXIT 0`. Four EVENTS-03/05/09 specs (31 tests) cannot run on the local stack (its WAWU ID stand-in has a random service key that `env.sh` does not export); CI ran them green.
- **Measured against the base `ca9ec13`** (same spec file, no fix): 6 cancels at once gave 2 answers of 201, 20 gave 4; 53 of 60 free-order rounds left a valid ticket on the called-off event. With the fix: 1 and 1, and 0 of 60 (45 to 49 orders issued then voided, 11 to 15 refused).
- **Shared changes filed:** EVENTS-13 #1 and #2 in `SHARED-CHANGES.md` (`contract/openapi.json` regenerated; the app's contract copy not regenerated).
- **App:** nothing to change today. The event checkout screens are EVENTS-06 (todo); the app shows the server's own `message` for a refusal (`src/api/errors.ts`), so `event_order_limit` shows "You have reached the order limit for this event." wherever EVENTS-06 shows checkout errors. EVENTS-06 must show `error.message` for code `event_order_limit` and not map it to a generic line.
- **Decisions the task did not name (change if the lead rules otherwise):** (1) HTTP status 409 for `event_order_limit`, as `target_not_payable`. (2) The setting is marked provisional (`EVENT-ORDER-CAP`) until the owner names the figure. (3) A cap lowered below what a buyer holds undoes nothing; the next order is refused. (4) Orders awaiting payment (`pending`, no payment claimed) are not counted, so abandoned quotes never block a buyer.
- **Not done:** the real Fintava sandbox (no keys; the double only). HTTP throttling in production.
- **Round 2:** **Round 2 (17 Oct 2026, Sonnet builder; verifier finding 1 medium, finding 2 low).** Backend `wmt/EVENTS-13` `bce009c` on `b22e1b6`. (1) The twenty-buyers test is back to `ordersRefunded: 20, refundsNeedingAttention: 0` and asserts `ordersLeftToSweep` is absent (a chosen refund is counted before it is sent, so another process's sweep cannot change the count); the overlap fix, the timings and the final wait until every buyer is whole with one move stay. Mutation: `CONCURRENCY = 1` in `event-call-off-refund.service.ts` makes it FAIL (`ordersRefunded` 5, not 20); back at 5 it passes (call-off, cap and cancel-race specs 18 of 18). The twenty-buyers test ran 30 times on a quiet-to-moderate machine (load 0.8 to 4.4): 29 pass, 1 fail on the UNCHANGED `< 1000` ms read assertion, because the last bystander read, which started after the cancel had ended (13.3 s, cancel 12.4 s), took 1521 ms; the other 29 runs' slowest read was 17 to 154 ms. Not touched, reported to the lead. (2) `contract/openapi.json`: the cancel answer is declared as two shapes in `EventTicketingService.cancel` (`CancelEventAnswer`, and `CancelEventAnswerWithSweep` with a required `ordersLeftToSweep`), so the 201 body is a `oneOf` of two new component schemas and nothing says nullable. The cause was `scripts/enrich-contract.js`, which writes every optional response property as `nullable: true` (no optional-and-not-null property exists in any 2xx response today); changing the tool would change about a thousand lines, so this answer is declared as two shapes instead. `npm run contract:build` twice gave identical files. Server behaviour is unchanged. The app's contract copy is still not regenerated (SHARED-CHANGES EVENTS-13 #2): EVENTS-06 regenerates it and reads the field with `'ordersLeftToSweep' in answer`.
- **Open findings:** the twenty-buyers test failed 1 run of 30 on its read-latency assertion (above); nothing else known.
- **Next:** the lead merges it with batch 7.
- **History:** the builder report is in [history/EVENTS-13.md](history/EVENTS-13.md).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-8 (free tickets), R-10 and R-31 (the charge on a refund is WAWU's), R-65 (launch figures are admin settings).
- `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-10.md`, findings 1 to 5.

## Goal

Calling an event off costs WAWU the provider's charge on every refunded ticket order (R-31), so the number of orders one buyer can place on one event is bounded; a host's cancel answers once however many arrive together; and a free order made at the instant of the cancel never keeps a valid ticket.

## Scope

1. **Order cap.** At most N open PAID wallet orders per buyer per event (open = not failed, not refunded). N is the admin registry setting "Most open ticket orders per buyer per event", default 10, at least 1. Order N+1 is refused before any money moves, in the money error shape, code `event_order_limit`, message "You have reached the order limit for this event." Parallel orders by one buyer never exceed N. Free orders are not capped. The web's Flutterwave routes keep their behaviour.
2. **One cancel.** Guard the update in `cancel()` on `cancelledAt` being null; the loser gets the answer a later cancel gets.
3. **Free orders on a called-off event.** `make()` for a free order takes the `FOR SHARE` read of the event row and refuses a called-off event inside it.
4. **The twenty-buyers test.** Send the cancel first, keep every assertion, show the timings, find the cause of the flake with numbers, make it deterministic.
4b. **F2.** The call-off answer says how many orders were left to the sweep (additive); the budget stays.
5. **App.** Where the app shows event checkout errors, `event_order_limit` shows its message. No em-dashes.

## Capability checks

- [ ] 20 parallel orders by one buyer with N 10 leave exactly 10 open and 10 refused with no money moved; a refunded order frees a place; an admin edit of N works without a restart.
- [ ] 6 and 20 parallel cancels give exactly one 201.
- [ ] 60 rounds of a free order racing the cancel give 0 valid tickets on the called-off event.
- [ ] The twenty-buyers test sends the cancel first, overlaps the bystander reads, accounts for every order, and passes 30 of 30 under load.
- [ ] The call-off answer's counts add up to the paid orders; the web's Flutterwave cancel answers as before (V3).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-13.md](history/EVENTS-13.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
