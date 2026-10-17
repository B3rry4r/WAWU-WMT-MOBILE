# EVENTS-07 verifier report (Sonnet verifier, 16 Oct 2026)

Backend wmt/EVENTS-07 0da82ba (on wmt/FIX-42 73f4eb5). Mobile aa5bc3a (docs only). Stack events_07 (:7410-7417), the repo's Fintava double, real Postgres. No real provider called. Attack specs (not committed, nothing pushed): /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/events-07-v/specs/zz-vattack1..6.contract.spec.ts, logs in .../events-07-v/logs/.

## Verdict: fix (one medium)

## Findings
1. MEDIUM. Erasing a host (or any delete of the Event row) strands the buyers' held money.
   prisma EventOrder.event is onDelete: Cascade and src/account-purge/account-data-map.ts:260 lists Event as OWNED (:264 EventOrder). Repro (zz-vattack6 E1): pay a wallet order, delete the Event row as the purge does, run payment and hold sweeps. The order, its lines and the tickets are gone, the buyer's GET order is 404, and the WalletHold stays `held` for the price. The order row was the only link WALLET-17 (release) and EVENTS-10 (refund) are told to use (order.walletPaymentId / holdId), and neither the gaps (G-790, G-791) nor the task record mention it. Fix: file the gap with an owner AND make the purge/delete refund (or hand to review) held event_ticket holds of the event's orders before the Event goes, with a spec. (Buyer erase, E2, is fine: hold anonymised and kept.)
2. LOW. contract/openapi.json: createEventWalletOrder lists the Idempotency-Key header twice, `idempotency-key` required:true (from `@Headers('idempotency-key') key?: string`, controller :94) and `Idempotency-Key` required:false. The generated app client will demand a key the route treats as optional. Other optional-key routes (event-running check-in) use `key: string | undefined` and do not duplicate. Also :89 declares only target_not_found/target_not_payable, but the route answers wallet_not_open, wallet_opening, idempotency_key_reused (409) and idempotency_key_required (400), which the typed errors miss.
3. LOW. PUT /events/:id/tickets answers 500 when an order that is not `pending` still points at a tier with nothing sold (EventOrder.ticketTypeId has no cascade; setTicketTypes event-ticketing.service.ts:175). zz-vattack4 X1: a wallet order set `failed` (what happens if the event is unpublished between debit and tickets) gives 500; the web's own pending Flutterwave order gives the same 500 on main, so it is pre-existing. The new code deletes only `pending` wallet orders (:149), so `failed` wallet orders join the old problem.
4. LOW (design note, builder disclosed). Seats are taken after the debit, so under a rush the losers are debited, then refunded the price only: the buyer loses Fintava's charge (R-10: 1,575 kobo on a 750,000 order) and WAWU pays 1,575 kobo on each refund transfer (R-31) (T1: merchant net +1,493,700 instead of +1,500,000). Consistent with R-10/R-31; the lead may want a reservation step before the app sells.
5. LOW (ordering). A cancel (POST /events/:id/cancel) of an event with paid wallet orders voids the tickets and leaves order `paid` and hold `held` (W test). Disclosed; EVENTS-10 (todo) must land before the app sells wallet tickets.

## Checks (all against the branch, base compared)
- Builder specs rerun: 3 suites, 27 tests passed. tsc --noEmit 0 errors. Schema drift: only ContentPiece (not this task). contract:build leaves no diff. Diff vs report: 18 files, matches the list.
- CI 0da82ba: suites 3/3, netns, protected-route suite, contract, deploy-test-in-sync, baseline: success. Executable gates: failure, the same 5 fails as base 73f4eb5 (deferrals x4, forks x1; compared line by line), files 1324 vs 1315, accepted 83 both: pre-existing.
- My attacks, 31 tests in 6 files, all as expected except findings 1 to 3:
  - Last seats: 6 buyers, 2 seats, parallel pays: sold 2, tickets 2, 2 paid, 4 failed, each loser refunded once (1 merchant transfer each, hold `refunded`), more sweeps change nothing; one buyer two orders for the last seat: 1 paid; 4 parallel sweeps of a failing order: 1 refund.
  - Event called off during the debit: order failed, 0 tickets, hold refunded once, sold 0. Event pending or price changed after the quote: pay 409 target_not_payable, no debit.
  - Free baskets: no wallet, no PIN, 0 provider requests, 0 payment rows; same key x10 parallel = 1 order and 2 tickets; same key other basket 409 idempotency_key_reused; last free seat x6 people = 1; own, pending, cancelled, ended, closed and not-yet-open sales refused; paid or mixed basket without a wallet 409 wallet_not_open and no order left; mixed with a wallet priced at the paid line only.
  - Pay: 5 parallel same key = 1 debit, replay `Idempotent-Replayed: true`; 5 keys = 1 debit; paid again 409; no PIN 403; wrong PIN x4 then locked 423; tampered total or token 409 quote_changed; another person's order 404; quote total 1,501,575 equals the debit; 85/15 recorded (1,275,000 / 225,000) and hold `held` until event_took_place; too little money 402 and nothing taken, then the same order pays after a top-up; daily limit 2 orders with 5 parallel pays: exactly 2 debits, 3 x 403 limit_reached.
  - Lost answer after the money moved: processing, pay again 409 payment_in_progress, 5 sweeps in parallel: 1 transfer, 2 tickets. Money never moved: nothing debited, no tickets.
  - Timing: 20 parallel pays with a 3 s provider answer, another person's reads max 222 ms (54 probes); 20 orders for 5 seats with a 3 s answer on every debit and refund, max 179 ms (238 probes), 5 paid, 15 failed, 15 refunds.
  - Web: verify of a pending wallet order 409, by another person 403; PUT /events/:id/tickets during a payment 409 and the order untouched; with an open quote and no payment the quote is removed and pay then answers 404 with nothing taken; web buy still 201 with its Flutterwave config; web cancel unchanged.
  - Input: 18 create shapes and 7 pay shapes all 400/404/409, none 5xx; unknown fields refused; no key 400.
- NOT RUN: the full backend suite (GitHub's job, passed), a real Fintava call (none allowed), the Nuvion provider, the MONEY-16 nightly check, the mobile screens (EVENTS-06).
- Stack events_07 stopped (hub 2442, mock-id 2428), ports 7410-7417 closed, database dropped, worktree removed.

---

# Rounds 2 and 3, lean check (Sonnet verifier, 17 Oct 2026)

Backend wmt/EVENTS-07 6603fba (round 3, on 541b4bb round 2, on 0da82ba). Mobile 2c596a1 (docs only). No new migration. Stack events_07 (:7410-7417), the repo's Fintava double, real Postgres, no real provider. Specs (not committed, nothing pushed): .../events-07-v/specs/zz-vr3a, zz-vr3b, zz-vr3c (+ the six round 1 specs); logs in .../events-07-v/logs/r3*.log.

## Verdict: merge (nothing medium or worse; three lows)

## Round 1 findings, re-tested
1. MEDIUM (host erase strands held money): CLOSED. See A1-A9 below.
2. LOW contract (Idempotency-Key twice): CLOSED. createEventWalletOrder lists `Idempotency-Key` once, required:false; `contract:build` leaves no diff; the codes sit in the operation description (accepted).
3. LOW (PUT /events/:id/tickets 500 over a failed order): CLOSED for wallet orders. Failed wallet order with the price back: 200 and the order is removed. Refunded: 200. Failed with the hold still `held`: 409 "money still on its way back" (no 500). Paid: 409 as before. The web's own Flutterwave pending order: 500, the same as round 1 and main (unchanged; pre-existing, not this task's).
4. LOW (losing buyer lost Fintava's charge): CLOSED. B1: 6 buyers, 2 seats, parallel pay: 2 paid, 4 failed; each loser's balance is back to the cent, 1 merchant transfer of the full total (price + charge), view returned.returnedKobo = total, reason says "charge included", hold refunded once; merchant delta = +price x2 minus 4 x (charge + refund fee) = WAWU carries 12,600 kobo. B2 (debit answer lost, event called off, 4+4 parallel sweeps): 1 transfer of the full total, balance restored.
5. LOW (cancel leaves order paid/hold held): unchanged, EVENTS-10 owns it (its task file now carries the return-all rule).

## Checks (A = host erase, in-process app + real DB + double)
- A1 2 parallel purges + 2 parallel settles + sweep + 2 hold sweeps, 3 paid buyers and 1 unpaid quote: no errors, each buyer 1 transfer of the full total, balance restored, 2 ledger rows per refund, event and orders gone; replay purge moves nothing.
- A2 started event (startsAt moved to the past after the sale): event kept as `erased-host`/`removed`, order `paid`, 1 ticket, hold `held`, 0 transfers through 3 more purges, sweeps and hold sweeps; buyer GET order 200 paid; an upcoming sibling event of the same host was refunded and deleted in the same purge; clearing the hold makes the sweep delete the shell.
- A3 decision stable: start time 5 s ahead, provider paused, purge keeps rows, start time passes during the outage, provider back: still refunded in full (1 transfer), event deleted.
- A4 transfer taken but answer lost: 1 transfer in total after 4 sweeps, balance restored. A5 outage: two purges in 179 ms keep the event, order and hold; sweep finishes later (1 transfer).
- A6 nothing held across the provider: 20 hosts' hooks in parallel against a 3 s provider took 3.4 s (parallel, not serial); another person's order read max 122 ms over 29 probes; longest `idle in transaction` seen 49 ms (limit 500 ms); all 20 buyers restored, 1 transfer each, 20 events gone. Round 1 timing spec re-run: 20 parallel pays with 3 s provider max read 219 ms; 20 orders for 5 seats with 3 s on every debit and refund max 145 ms (242 probes), 5 paid, 15 failed, 15 refunds.
- A7 debit in flight when the host leaves (3 s provider, purge at 0.9 s): event kept, pay answers 201 `failed`, the whole total is refunded once, event then deleted. A8/A9 on a kept event: order GET 200, my tickets 200, new order 409 target_not_payable (no debit), host PUT 403; no 5xx.
- Round 1 attack specs re-run (26 tests in 6 files): 24 pass; T1 fails only because it still expects a price-only refund (751,575 now, by design); I1 fails on my own old assertion ("sum over max" = 12 tickets is allowed, limit 50), the same as round 1.
- Hook: one call at the top of purge() plus an `@Optional()` constructor parameter; AccountPurgeModule is the only provider of the service and AppModule imports both modules, so the hook is the same instance in the app.
- CI 6603fba: suite shards 3/3, netns, protected-route suite, contract, deploy-test-in-sync, baseline: success. Executable gates: failure, the same 5 fails (deferrals x4, forks x1), 117 warn, 83 accepted as base 73f4eb5 (files 1327 vs 1324): pre-existing.
- tsc, builder suites, full backend suite: not re-run (CI). No em-dashes in the added text.

## New findings (all LOW, none needs a fix round)
1. LOW. Narrow window left by the hook: it only detaches events that ALREADY have a wallet order. An event with none when the hook reads, that gets a first quote AND a PIN-paid order before the purge deletes the Event row, is still cascade-deleted with the hold left `held` (zz-vr3c C1, window simulated by a spy: order rows 0, hold held, buyer short 751,575). Needs the whole purchase inside the purge's runtime; a one-line widening (detach every upcoming/begun event of the host, not only those with wallet orders) closes it. Sweep list.
2. LOW (merge risk). origin/wmt/SETTINGS-06 changes account-purge.service.ts (+200 lines): expect a conflict on the constructor and the top of purge(). `@Optional()` means a rewrite that drops the hook call fails silently in the app; the round 2 spec (a purge that must refund) will catch it, so keep it when merging.
3. LOW. The wallet-order create answers `wallet_not_open`, `wallet_opening`, `idempotency_key_*` and `fees_not_set` are only in the operation description, not typed errors (accepted by the lead; the app client will not get them as typed).

## Cleanup
Stack events_07 down (hub 2210, mock-id 2197 stopped), ports 7410-7417 closed, database dropped, worktree /home/user/wt/v-events-07-be removed.
