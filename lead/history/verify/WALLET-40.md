# WALLET-40 verifier report (17 Oct 2026, Sonnet verifier)

Verdict: **merge** (nothing medium or worse).
Backend wmt/WALLET-40 a456db7 (base 850369a), mobile fda3381 (app code 8765a06). No migration, no contract change, no route change.

## Findings
1. LOW (pre-existing design, INBOX-21, not this task): a push tapped while signed out is dropped, not held for after sign-in.
   src/features/push/PushBridge.tsx (`status === 'signedOut'` clears the tap). The wallet_ready tap therefore opens Wallet only
   when signed in; signed out, the person signs in and lands on Home. Same for every pushed kind. Sweep list, not a round.
2. LOW (by design, stated in the task): a re-tap of Open wallet that reconciles a lost Fintava answer records the wallet and
   tells nobody (the person is looking at the answer). Race test F1: sweep won 6 of 6 times, so the notice was sent each time.
3. LOW: PUSH_LOOKBACK_MINUTES = 15 (src/push/push-config.ts:74). If every push sweep is down for more than 15 minutes after
   the commit, the phone push is never sent (the notice is still in the list). Never doubled. INBOX-03's design, unchanged.
4. INFO: the web's /notifications has no `wallet_ready` in its kind type; an unknown kind shows label "Update", icon Bell,
   href /notifications (kinds.ts `default`, NotificationCard.tsx `??`). Sensible, additive, same as money_in.
5. INFO: `Executable gates` fails on `content-piece.service.ts:67` (forks), the same single FAIL as base 850369a
   (run 39002200936 vs 39005790374). Local notification-wiring/switches/contract specs fail 24 tests on this machine
   (`flutterwaveConfig` null) and the same 24 on the base; CI shards are green. Pre-existing, local-environment.

## Attacks (all passed)
1. Exactly once (my own spec, two Hub instances = two pools, one DB, real receiver, real dispatcher, real push sender, Expo stand-in):
   - details BEFORE account, each of the 3 webhooks x5 with new ids + one id replayed 5 times, shuffled, posted and dispatched
     at once across both servers: 1 notice, 1 wallet, 1 PushDelivery, 1 Expo message (4 push passes across both servers).
   - handler called directly 12 times at once across both servers (no dispatcher claim): 1 notice, 1 wallet.
   - 10 people, pending then active x5, plus a second wave of replays: each told once.
   - a failing notice write rolls the wallet back; the dispatcher keeps the delivery pending (handler exception = `wait`); retry makes both once.
   - Fintava path: 5 sweeps + 3 re-taps racing for 6 people: 1 wallet each, notice <= 1 (6 of 6 told); unique-key conflict: loser
     ends `conflict`, no wallet, no notice, owner untouched.
   - Mutation: calling the teller in the "already recorded" branch makes 3 of my 8 specs fail (the spec bites).
2. None when it should not: number ready in the request (also 5 parallel opens), re-tap, failed, conflict, no-number,
   pending details, a person holding a legacy fintava wallet when a Nuvion webhook arrives, a server of the other provider
   (`reconcile(row, true)` returns nothing_to_do both ways): no notice, no wallet change.
3. R-39 seam: `grep "import.*fintava/" src/money` = none; wallet-provider-seam spec passes; `wallet-ready-notice.ts` imports
   only the Prisma client type and NotificationService. The notice write is DB only (no FK from Notification to any user table,
   `isSuppressed` returns false with no read for a kind with no switch, `targetFor` null). Network calls: `getAccountDetails`
   is before the transaction in `onAccountDetails`; none inside. The push is NOT in the transaction: PushSenderService.enqueue
   (10 s sweep, `INSERT ... ON CONFLICT (notificationId, pushTokenId) DO NOTHING` from committed Notification rows of the last
   15 min). Test 3: commit, no push pass ("crash"): 0 PushDelivery, 0 messages; later passes from both servers: exactly 1.
4. App: routeForPush(wallet_ready) = /wallet (also with a hostile target/actionHref); `received` listener and tap both
   invalidate ['open-wallet'] and ['money']; A28 moves on in under 2.5 s on arrival (test); other kinds untouched. Push data is
   {notificationId, kind} only; notice, push title, body and list row carry no account number (asserted against the real number)
   and no em/en dash (added lines of both repos scanned). No list row drawn (no notifications list screen in the app, R-47).
5. Web routes: diff touches no controller, DTO or contract file; Protected routes CI green; `GET /notifications` service
   returns the row (kind wallet_ready, actionHref null, unreadCount 1, markRead works).

## Checks with counts
- Builder specs: nuvion 7 + opening 8 + push-policy: 66 tests in 3 suites pass. push-policy.spec edit = 4 added lines only (accepted).
- My attack specs: backend Nuvion 9 tests pass, opening-path 4 tests pass (copies in scratchpad/wallet-40-v/specs/).
- Regression: seam spec, wallet-opening, nuvion-accounts, push-sender, notification-emitter: 6 suites pass.
- Backend: tsc --noEmit EXIT 0; eslint on the 7 changed product files EXIT 0; local gates same single FAIL as base.
- Mobile: jest src/features/push + open-wallet 24 suites / 346 tests pass; tsc EXIT 0; eslint src/features/push EXIT 0;
  gates PASSED; check_tasks EXIT 0.
- CI on a456db7: suite shards 1-3, contract, netns, baseline, deploy-test-in-sync, Protected routes green; gates red on :67 as base.

## Cleanup
Stack wallet_40 down (ports 7600-7607 closed, database dropped); worktrees v-wallet-40-* removed; nothing listening. Nothing pushed.
