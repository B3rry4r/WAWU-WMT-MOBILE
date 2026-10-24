---
id: WALLET-40
title: Alert when your account number is ready
owner: YOU
area: WALLET
order: 295
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [NUV-04, INBOX-03, INBOX-21, KYC-06]
decisions: [R-6, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-40 · Alert when your account number is ready

## Current state

As of 17 Oct 2026. Built, and checked by an independent Sonnet verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-40.md`): verdict merge, nothing medium or worse; its lows 1 to 3 are in the sweep files and its info line 4 (the web's /notifications has no `wallet_ready` kind) is in `tasks/SWEEP-WEB.md`. Task order moved from 294 to 295 at merge (HOME-17 and FIX-45 hold 294).
- **Status:** merging (lead). Backend branch `wmt/WALLET-40` (`a456db7`, off batch 7 `origin/wmt/MERGE-7` `850369a`); mobile branch `wmt/WALLET-40` (app code `8765a06`, then this task's docs, off `origin/wmt/MERGE-7` `ef8c23e`). No PR.
- **Migration:** none. No table, column, route, DTO or contract change (`npm run contract:build` leaves `contract/openapi.json` byte-identical). No fenced file is touched, so no `SHARED-CHANGES.md` row.
- **What a person gets:** when the account number becomes ready after opening began, one in-app notice (kind `wallet_ready`, title "Your account number is ready", body "Tap to see it in your wallet.", no number in it) and the phone push through INBOX-03. A tap on the push opens the wallet home (`/wallet`). A28 refreshes the moment the push lands while the app is open (it also keeps asking every 3 seconds).
- **Exactly once:** the notice is written inside the same transaction that creates the `FintavaWallet` row (its primary key is the person), through the provider-neutral `tellWalletReady` (`src/money/opening/wallet-ready-notice.ts`, `NotificationService.emitOrThrow`). The wallet and its notice stand or fall together, so a repeated, racing, out-of-order or two-server delivery finds the wallet and writes nothing more. No network call is made inside it (the push is sent later from the notification table).
- **Both providers:** Nuvion: `src/nuvion/handlers/accounts.ts` takes the teller as an optional constructor argument and calls it right after the wallet row (any of `accounts.created`, `account_details.created`, `account_details.updated` can be the delivery that finds the number active; the handler waits if the notification service is not mounted). Fintava/legacy: `WalletOpeningService.record` announces only when called from the opening sweep (`sweep()` passes `announce` through `reconcile`); the opening request and a person's own re-tap never announce.
- **Not told:** a number ready in the request that opened the wallet; an opening that failed, was refused, stopped for review (`conflict`) or never got a number; a person who already holds another wallet (a review stop).
- **App:** `src/features/push/routes.ts` (`wallet_ready` to `/wallet`), `src/features/push/refresh.ts` and `PushBridge.tsx` (a `wallet_ready` push that arrives or is tapped marks the `open-wallet` and `money` reads stale). The notifications list screen (M31) is not built, so no row is drawn there (R-47); the Hub serves the row (`GET /me/notifications`, kind `wallet_ready`, category `money`, `target: null`) and the app routes it by `kind` when that list lands.
- **Specs added:** backend `src/nuvion/tests/wallet-ready-notice.contract.spec.ts` (7), `src/money/opening/tests/wallet-ready-notice.contract.spec.ts` (8); mobile `src/features/push/__tests__/walletReadyPush.test.tsx` (6). Each was shown to fail with the behaviour broken (a doubled notice; an announcing request; a push that marks nothing stale).
- **One existing spec edited (INBOX-03's, not mine):** `src/push/tests/push-policy.spec.ts` gains `wallet_ready` in two expected lists (the kinds pushed with no Z3 switch, and the example for every pushed kind). The assertions are otherwise unchanged. Lead to confirm.
- **Defaults (agent), owner may override:** (1) pushed with no Z3 switch (the owner asked for the alert in answer 31; G-265's hold does not apply, so it is the one push Settings cannot mute); (2) the list files it under `money`; (3) tone `success`, no action label; (4) a missing notification service makes a Nuvion delivery wait rather than record a wallet without its notice.
- **Gap:** G-823 carries a "Served by WALLET-40" note.
- **Checks:** Backend CI on `a456db7`: Branch checks run 39005790347 green (3 suite shards, contract, netns, baseline, deploy-test-in-sync), Protected routes run 39005790342 green, Gates run 39005790374 red on one line, `content-piece.service.ts:67` (the `FlutterwaveConfigResponse` fork), the same single FAIL as base `850369a` (Gates run 39002200936), a file this task does not touch. Local: `tsc --noEmit` 0, eslint 0 on every changed file, the 3 new backend specs plus `push-policy`, `nuvion-accounts.contract` and `wallet-provider/tests` green (151 tests, stack `wallet_40` on ports 7608-7615 because another agent held 7600-7607 at the start). Mobile full check (`typecheck`, `lint`, `test --maxWorkers=2`, `gates`, `tasks`) EXIT 0: 193 suites, 3352 tests, gates 0 fail.
- **Open question for the owner (via the lead):** should the "account number ready" push be mutable in Settings (it has no Z3 switch today)?
- **Next:** the lead merges it with batch 7.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend` and the app. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-6 (identity checks at opening) and R-39 (the provider seam). Rulings outrank the boards, the brief and any older task text.
- `BACKEND_GAPS.md` G-823; `src/nuvion/handlers/accounts.ts`; `src/money/opening/wallet-opening.service.ts`; `src/push/push-policy.ts`.

## Goal

Owner answer 31 (17 Oct 2026): A28 says "This usually takes a few minutes." and the person gets an alert when the account number is ready. Today nothing tells them: the Nuvion account handler records the account and no notice goes out (G-823).

## Scope

1. When a wallet's account number becomes ready after opening started, send ONE notice to its owner, in-app and push (the policy HOME-16 documented: one kind, decided in `push-policy.ts`). Title "Your account number is ready", body "Tap to see it in your wallet." Exactly once per wallet even when the provider's webhook repeats, arrives out of order, or two servers take it. Not when the number was ready in the same request that opened the wallet. Raised in provider-neutral code reached through the R-39 seam, so Fintava and Nuvion both send it; provider quirks stay in the adapter. Never hold a transaction across a network call. Never put the account number in the notice.
2. App: the new notice type opens Wallet on a tap (the wallet home, which shows the number). If the person is on A28 when it lands, A28 refreshes. Copy as above, no em-dashes.
3. Specs: one notice per wallet under repeated and parallel webhooks; none when ready in the opening request; none for a wallet that failed; the web's routes unchanged.

## Capability checks

- [ ] A person whose number goes active after they opened gets exactly one "Your account number is ready" notice and one push; a repeated, parallel or out-of-order delivery adds none.
- [ ] A number that was ready in the request that opened the wallet sends none; nor does an opening that failed or was stopped.
- [ ] The notice and the push carry no account number; a tap opens the wallet home; A28 moves on as it lands.
- [ ] The web's and the dashboard's routes answer as before (protected route suite green; no contract change).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-40.md](history/WALLET-40.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
