# Verifier report: FIX-40 (79cf759) and FIX-42 (73f4eb5), 16 Oct 2026

Verdict: FIX-40 merge. FIX-42 merge. No blocker, high or medium finding.

## What was run (worktree /home/user/wt/v-fix-40-be at 73f4eb5, stack fix_40, ports 7390-7397)
- The builders' three new specs: 3 suites, 20 tests, EXIT 0. tsc --noEmit EXIT 0. eslint --no-fix on the six touched files EXIT 0.
- CI on 79cf759 and 73f4eb5: three suite shards, contract, protected routes, baseline, netns, deploy-test-in-sync all success.
  "Executable gates" fails on both and on the base ba5e043; the FAIL lines are identical (7 lines each, diff empty).
- prisma migrate diff against the migrated stack database: only the old ContentPiece_specializations_idx drop (not this task); the WalletBill index exists.
- My own attack spec (kept at scratchpad/fix-40-v/zz-vfix40-attack.contract.spec.ts.keep, never committed): 10 cases, all behaviours as claimed.

## FIX-40 attacks (limit = one bill a day, real bill flow, Fintava double)
- Refund answer lost (hold held, action refund, sentAt set): next bill quoted withinDailyLimit false and pay 403 limit_reached; after the hold sweep confirms, hold refunded, next bill paid and delivered.
- Refund reported FAILED by Fintava: hold stays held (attempt 2, waiting refused), next bill 403; after the retry completes, hold refunded and the next bill is paid.
- Eight parallel pays after a refunded bill: exactly 1 taken (201), 7 refused (403), one payment row created.
- The refund confirmed by the sweep while eight pays run: at most 1 taken, hold ends refunded.
- A refund later reversed by the provider: toReview leaves the hold held, so the payment keeps counting (safe). A refunded hold never moves back (every hold write is conditional on status held).
- Window: movedSince uses the same Lagos day/month start as the sum; a payment counted in the window always has its refund settledAt at or after the window start (our clock).
- Paid DM and ticket: no live flow in the backend registers these kinds yet (only bills and plan purchases register); exclusion is by paymentId, kind agnostic, covered by the builder's direct-row spec.

## FIX-42 attacks
- Guard: first bill stored a reference only (no record id), Fintava clock 3000 ms ahead, second bill 504: second stays buying, no token, hold held (excluded by reference exactly). First bill with no ids and the second really bought within 0.2 s of it, answered 504: stays buying, hold held, no first-bill record taken (safe side, as ruled).
- Late scan, 20 parallel calls in one process: 1 history call.
- Late scan with history 1500 records deep (15 pages): 10 calls, the newer failure found and noted, the older one (behind the cap) not falsely noted.
- Held across the Fintava call: 3 s history answer, 20 reads by another person during it: max 9 ms, median 3 ms; pg_stat_activity shows 18 idle, 1 active, no idle in transaction.
- Second pass started 0.4 s after the first (a later-started server, not stopped by the claim): both call Fintava (2 history calls) but 1 note and 1 ledger row (the noted mark, the compare-and-set note and the unique ledger reference make it idempotent).
- Migration 20261023230000: one CREATE INDEX, ordered after 20261023210000, no drift.

## Findings (all low, to the area sweep)
1. low, src/money/limits/account-limits.service.ts movedToday (unchanged): the provider's own daily limit on the account still counts a refunded payment (by design, the debit counted at the provider), so a person near that limit still gets limit_reached after a failed bill. WAWU's limits are fixed.
2. low, src/wallet-bills/wallet-bill.service.ts readLateHistory: the cap of 10 pages reads only the newest 1000 merchant records; if the merchant wallet does more than that between a failure and now, that failure's late success is never found (warning logged each pass). A date window (endDate) would reach it.
3. low, wallet-bill.service.ts scanLateSuccesses: under WALLET_PROVIDER=nuvion it filters by provider but still calls this.fintava for any nuvion-provider bill; none can exist (bills are Fintava only, R-45), but a hard "provider is fintava" return would make the claim unconditional.
4. low, claimLatePass: stops only servers that wake together (builder says so); a later-started server repeats the Fintava history read (harmless, idempotent).
5. low, joinNotes caps a payment's discrepancy at 1000 characters; a payment whose notes already fill that would never carry the late-success marker and would be re-looked every pass (harmless, idempotent).
