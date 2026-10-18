---
id: FIX-86
title: One Nuvion webhook sweep drains what is due, so a burst of payments settles in one tick
owner: YOU
area: MONEY
order: 219
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [NUV-01]
decisions: [R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-86 · One Nuvion webhook sweep drains what is due, so a burst of payments settles in one tick

## Current state

As of 18 Oct 2026, merging (lead): built by a Sonnet builder (tier T2) and stacked in batch 23 (backend `wmt/FIX-86` `94d5341`, mobile `4f3bebe9`), with SWEEP-MONEY part 4 and SWEEP-APP-7. Backend `wmt/FIX-86` `94d5341` (from MERGE-22 `12573a3`); this record on mobile `wmt/FIX-86` (from MERGE-22 `030f0744`). No schema, no migration, no route, no contract change, no Fintava file touched, no app code.
- **Closes:** SWEEP-MONEY FIX-80 N3. **Cause:** `NuvionWebhookDispatcher.sweep()` took `NUVION_DISPATCH.batch` = 20 stored deliveries per 30 second tick (40 a minute): 400 deliveries took about 10 minutes and every payer saw "still confirming" meanwhile.
- **Fix (one product file, about 12 lines of code):** `sweep()` keeps taking batches of 20, oldest first (`receivedAt`, `id`), while a batch comes back full and `NUVION_DISPATCH.budgetMs` (a constant beside `batch`, 20 s, not config) is not spent. A row taken once is held in a list and left out of every later query of the same sweep, so a row that waited, threw or was skipped is never taken twice in one tick. The per-row claim (`leaseMs`), the `sweeping` flag, the handlers, the retries, the rest times and every money move are unchanged. The budget is checked between batches, so a sweep can end one batch (20 handlers) past it.
- **Specs (Nuvion stand-in only, no Fintava import):** `src/nuvion/tests/nuvion-dispatch-drain.contract.spec.ts` (6): 400 due deliveries all handled in one sweep, in order, within the budget; a budget hit stops after two batches with nothing held and the next ticks continue in order; a handler that waits or throws is not retaken in the sweep (the handler frees the row behind it, so a sweep that asked again would take it twice); a delivery another server holds is left alone and the rest drained; two dispatchers on 200 rows run each handler once. `nuvion-dispatch-burst.contract.spec.ts` (1): 120 bank sends settled at the stand-in, their `outflows.completed` posted to the real receiver, ONE sweep, 120 processed and 120 completed ledger rows. **Red on `12573a3`** (the budget constant added alone): 5 of 6 drain tests fail (20 of 400, 20 of 40, 20 of 49, 22 of 200, the wait test's counts) and the burst is 20 of 120; with the "taken" list removed the wait test is red too (the loop retakes the row), so the guard is what the test proves. Green on `94d5341`: 7 of 7.
- **Checks:** `tsc --noEmit` EXIT 0; `eslint` on the 3 changed files EXIT 0; the 8 Nuvion contract specs that use the dispatcher (webhook, payouts, book-money, wallet-ready-notice, earnings, accounts, reconcile, failed-move: by name, each grepped for the Fintava double, none imports it) 136 of 136 EXIT 0; gates EXIT 0 (0 fail), baseline EXIT 0. Protected suite on its own mock WAWU ID (port 7807, fresh database): 242 of 244 required, the 2 reds are `POST` and `GET /communities/:id/messages` showing `videoUrl` and `voiceUrl` (INBOX-22 widened them, `2d311df`), not from this change (G-FIX-86-2).
- **Stack burst (ports 7800 to 7807, Nuvion stand-in, torn down after):** 320 WAWU-to-WAWU wallet sends from one funded person (12 at a time, 106 s, the Hub's 200 requests a minute is the limit), 708 webhooks (each send is the send and its fee). All 708 `processed`, each handled once (`attempts` 1). At the last send 128 deliveries were still waiting; the last was in the ledger 10 s later. Receipt to handled: longest 29.7 s, 95th percentile 21.7 s. The ledger equals the stand-in: 349 completed OUT rows (this and two earlier trial runs), sender balance 296,161,000 kobo at the Hub and at the stand-in, receiver 303,490,000 at both, 700 successful transfers at the stand-in. The nightly check (`money:check --again`, the Hub's own environment) after the burst: `clean`, 2 of 2 wallets compared, 0 mismatches, 0 to look at.
- **Not done:** the full backend suite (GitHub runs it on the push); the CI run ids are in the hand-back.
- **Merged (MERGE-23):** on MERGE-23 `nuvion-dispatch-drain` and `nuvion-dispatch-burst` ran 7 of 7 with no conflict (the dispatcher file was not touched by the other two branches). Its N3 row in SWEEP-MONEY is marked fixed and counted settled there.
- **Next:** the batch 23 pull request (the lead).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- SWEEP-MONEY FIX-80 N3, BACKEND_GAPS G-FIX-86-1 to G-FIX-86-3

## Goal

A burst of Nuvion deliveries (an event's ticket sales, a payday) is handed to its handlers in the tick that finds it, not 20 at a time over many ticks.

## Scope (backend only)

`src/nuvion/webhook/nuvion-webhook-dispatcher.service.ts` and the two specs named above.

## Capability checks

- [ ] 400 due deliveries are all handled in one sweep, oldest first, within the budget.
- [ ] A budget hit stops cleanly and the next tick continues in order.
- [ ] A handler that waits or throws is not retaken in the same sweep; two servers never run one delivery twice.
- [ ] On the stack, 300 or more wallet sends all settle within about a minute, the ledger equals the stand-in, and the nightly check reads clean.

## Owner sign-off

Not needed.
