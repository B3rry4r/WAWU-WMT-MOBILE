---
id: WALLET-10
title: Money in: bank transfers to the account
owner: YOU
area: WALLET
order: 150
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-07, MONEY-10, MONEY-12, INBOX-03, SETTINGS-07]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-10 · Money in: bank transfers to the account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W15: money sent to the user's account number shows up and notifies them.

## Scope

Inbound credit webhook to ledger to a 'money in' notification, honouring the user's Z3 switch (SETTINGS-07) and
sent as a push (INBOX-03).

Money in comes from the ledger (MONEY-10): MONEY-10 marks `account_funded` deliveries `processed` once they are ledger rows, so this task notifies from new `in` rows (`FintavaLedgerEntry`, `category: top_up`, `sourceEventId` names the delivery) with its own marker of what it has notified, never from the event row (`BACKEND_GAPS.md` G-33).

## Capability checks

- [ ] A sandbox transfer into the account appears in history and as a notification once.
- [ ] With "Money in" turned off in Z3, no notification is sent.

## Builder report

Builder, 11 Oct 2026 (a Sonnet agent for the lead). Backend `wmt/WALLET-10` `5e57a09` on backend main `51b02c5` (not moved at the last fetch); this repo `wmt/WALLET-10` on main `15a8c2c`. Migration `20261021210000_money_in_notices` (the lead renames at merge).
- **Built (backend, additive; no route, no contract field).** `src/money/money-in-notice/` (service, config, module; `MoneyModule` imports it), kind `money_in` in `src/notification/notification-event.ts` (copy, Money chip), its `SETTINGS_GATE` entry (`moneyIn`, Z3) and `PUSH_RULE` entry (`send`), table `MoneyInNotice` (primary key the ledger row; `sent`, `muted`, `before`) with an index on `FintavaLedgerEntry`, `rollback.sql`, README, `.env.example`, `docs/contract/PUSH.md`. A sweep in every Hub (10 s) reads completed `in` rows of category `top_up` on a person's wallet, of the provider the server runs (R-39), and never the webhook event (G-33) or the provider. Per row, in ONE transaction with the row locked (`FOR NO KEY UPDATE SKIP LOCKED`): read the Z3 switch, `NotificationService.emit(..., tx)`, write the mark. A stop between the writes undoes both; the key refuses a second mark and rolls the notification back with it. Off: only the mark, `muted`; nothing waits. The push is INBOX-03's sender reading the Notification table (one push per notification and phone).
- **Does a Nuvion inflow become a ledger row on main (ruling 2)?** Yes: NUV-04's `NuvionInflowRecorder` writes the same `in`/`top_up` row stamped `nuvion`; nothing was built for it here. It names no sender (G-736), so the text says the amount alone.
- **Check 1 (a transfer in appears in history and notifies once): passed.** `money-in-notice.contract.spec.ts` (38) and `-units.spec.ts` (34), real database, real route, ledger consumer, notification service, push sender (Expo stand-in): one signed credit is one row and one notification; a replay, the same credit in other bytes, success then pending, pending then success, two credits delivered in reverse, three processes at once on 6 rows, forty credits on three processes, a row held by a ledger writer, a stop after the notification and before the mark, a stop after the commit and before any push. A built-Hub run (two Hubs, `dist/src/main.js`, one database, push on, Fintava and Expo stood in; `w10/live/out4/result.txt`): 31 of 31. 17 credits to 8 people, delivered 7 times over to both Hubs, in reverse, and 12 at once: ledger rows, notifications and marks equal per person; `GET /money/transactions` and `GET /me/notifications` through real tokens show one each; one push each; both Hubs told (10 and 7 of 17, each notification held 1.2 s in the transaction so the passes overlap); no call to the Fintava stand-in (an `account_funded` delivery is trusted alone); kills (SIGKILL by a preload, Hub's own entry point) after the ledger row, after the notification and before the commit, and after the commit and before any push: the row only, the row only, notification and mark; after each restart one notification, one push, still one 40 s later; the migration rolled back by its `rollback.sql` and applied again over existing credits marks them `before`.
- **Check 2 (Money in off in Z3, nothing sent): passed.** Spec and live: the switch set through the real `PATCH /settings/notifications`; history row yes, notification no, push no, mark `muted`; switched on again, the old credit does not come; the next credit is told once. Unset and `null` read as on; other switches do not mute it.
- **Nuvion on a built Hub (11 of 11, `w10/live/out-nuv2/result.txt`).** One Hub under `WALLET_PROVIDER=nuvion`, the NUV-01/NUV-04 stand-in, a signed `inflows.completed` read back by NUV-04's handler: one `nuvion` row, one notification ("You received ₦7,500 by bank transfer."), one push; a `processing` inflow is not money until it is `successful`; Z3 off muted; a Fintava-stamped credit is left alone; no call to another host.
- **Mutants (my own, 18, `w10/mut/`).** 16 killed. 2 survive and are equivalent: dropping `walletKind: 'user'` or `wawuUserId: { not: null }` alone (each excludes WAWU's merchant wallet; a third check in the transaction does too). Two mutants first survived and drove a test each (the lock without `SKIP LOCKED`; the key-refused path).
- **Checks.** `tsc` 0. eslint (no fix) on the 10 changed `.ts` files: 0. Specs on a fresh migrated and seeded database in a private network namespace: `src/money src/wallet-provider src/notification src/notification-settings src/push src/account-purge src/data-export-request src/openapi src/me src/nuvion src/fintava src/inbox` 103 of 105 suites, 4502 of 4509 tests; the other 7 are `receipt-units` (4: Unicode digit tables against Node 22.22; they fail the same on a clean main `51b02c5`) and `fintava-stall` (3: timing under load; pass alone). After the contract regeneration: the four specs that read `openapi.json`, `src/money/money-in-notice src/push src/notification src/notification-settings src/account-purge src/data-export-request` 18 of 19, and `push-token` alone 29 of 29 (its mock WAWU ID dropped the connection in the combined run). Protected suite `run.sh --fresh HEAD` (code `5e57a09`, lock origin/main `51b02c5`): 253 of 253, 244 required. Gates: 16 FAIL, the same 16 lines as main line for line (1154 files, 97 warn before; 1159, 99 warn after: PROVISIONAL `MONEY-IN-NOTICE-WINDOW` and `MONEY-IN-NOTICE-SWEEP`), 76 accepted; `check_baseline.py` clean. `contract:build` twice: same bytes; it differs from main's committed file only in order (254 moved lines; equal after sorting keys; SHARED-CHANGES WALLET-10 #2). Mobile: `npm run gates` and `npm run tasks` EXIT 0 (no app code changed).
- **Decisions (Default (agent), owner may override).** (1) Only a bank transfer in is told (`top_up`, lead ruling 1); received person-to-person sends, earnings and refunds are not (G-732). (2) The mark belongs to the ledger row; a muted credit is never sent later; the migration marks credits already in the ledger `before` so the first sweep after the deploy tells nobody about old money. (3) A pass every 10 s and a 72 h window from the row's `createdAt` (`MONEY_IN_NOTICE_WINDOW_HOURS`, both PROVISIONAL, listed). (4) Text: "Money received" and "You received ₦100 from John Doe (****1291)." with the name only when the provider gave one; kobo kept in the words, whole-naira `amount` column only for whole naira (G-735); the name is cleaned (control characters out, dashes written as hyphens, 60 characters). (5) A row with a recorded `discrepancy` is not told (G-733). (6) A row a ledger writer holds is skipped, not waited for, and told on the next pass. (7) `money_in` is pushed (`send`), muted by Z3; the lock screen shows the amount and the sender (G-737). (8) No `actionHref`, no target (G-731). (9) I added a `money_in` example to `push-policy.spec.ts` (it requires one per pushed kind). (10) A recalled credit is not told again and nothing reverses an `in` row (G-730).
- **Filed.** BACKEND_GAPS G-730 to G-737; SHARED-CHANGES WALLET-10 #1 (schema and migration) and #2 (contract). G-33 now says WALLET-10 is built on the ledger rows.
- **NOT RUN.** A real Fintava `account_funded` delivery: unblocked by OPS-10 (Fintava calling the production URL); the field that finds the receiver (`userId` as the customer id, MONEY-10 U-4) is unconfirmed, and if it is wrong the ledger writes no row (safe side) and nothing is told. A real phone and Expo (V10): unblocked by a tester build, `PUSH_ENABLED` and the owner's FCM credentials on the droplet. Nuvion's sandbox (`api.nuvion.dev`): key answers 401; every Nuvion run used the stand-in. A built Hub killed between the ledger row and the push on the Nuvion path: the three kills ran on the Fintava path (the sweep and the transaction are the same code).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
