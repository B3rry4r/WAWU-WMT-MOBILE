---
id: INBOX-03
title: Phone push notifications
owner: DEV2
area: INBOX
order: 47
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SETTINGS-07]
decisions: []
passes: [V1, V2, V3, V4, V9, V10]
artboards: []
---
# INBOX-03 · Phone push notifications

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Replies, refunds, money in and join decisions need to reach a phone.

## Scope

Device token registration and removal; a sender behind the existing notification service that respects settings; Expo push.

Categories follow the user's Z3 switches (SETTINGS-07). The phone side (permission, token, tap) is INBOX-21. Android push needs the owner's FCM credentials uploaded to Expo (owner input).

V10 runs on a real Android phone only (DECISIONS R-24).

## Capability checks

- [ ] A notification sent to a registered push token is accepted by Expo's push service, and its receipt reports it delivered within a minute (the phone side is checked in INBOX-21).
- [ ] A category the user turned off in Z3 (SETTINGS-07) is not sent.
- [ ] A dead token is cleaned up.

## Builder report

**Backend (`wmt/INBOX-03`, from main 0e7b617, merged with main 6c0e435).** Files: `prisma/schema.prisma` + migration `20261009090000_push_tokens` (2 new tables `PushToken`, `PushDelivery`; rollback.sql replayed), `src/push/**` (module, `POST`/`DELETE /push-tokens`, Expo client, sender, sweep, per-kind policy, 3 specs + a local stand-in), `src/notification/notification.service.ts` (exports `SETTINGS_GATE`, adds `isSwitchOff`; `emit()` untouched), `app.module.ts` (1 import, 1 entry), `account-data-map.ts` + `data-export-sections.ts` (PushToken/PushDelivery: OWNED, export-excluded with reason), `docs/contract/PUSH.md`, README, `deploy/README.md`, `.env.example`, `contract/openapi.json` (+127 lines, none removed). Mobile: this file, BACKEND_GAPS G-265 to G-268 (G-23 marked built), SHARED-CHANGES INBOX-03 #1 to #4, LOG.
**How it works.** The Notification table is the outbox: every 10 s each instance turns recent notifications of a pushed kind into one `PushDelivery` per live phone (unique key + ON CONFLICT DO NOTHING), claims due ones with FOR UPDATE SKIP LOCKED, re-reads the Z3 switch through `NotificationService.isSwitchOff`, sends chunks of 100, then asks receipts (first at 60 s, then every 5 min up to 24 h). Off unless `PUSH_ENABLED=true`. Nothing runs inside `emit()` or a request, so a push failure cannot touch either.
**Check 1 (accepted by Expo, receipt delivered within a minute): HALF RUN, END TO END NOT RUN.** exp.host, api.expo.dev and docs.expo.dev answer 403 from this sandbox's egress policy (proxy status: connect_rejected), so no real Expo response exists to record. Shapes, the 100/300 limits and the token format come from `expo-server-sdk` 7.2.0 (npm). 37 specs run against a local STAND-IN server answering those shapes (send, ticket, receipt, 429/5xx, DeviceNotRegistered, MessageTooBig): sent with the notification's own words and `data` (notificationId, kind, actionHref, target), ticket kept, receipt marks delivered. Not stand-in-provable: that real Expo accepts it and the real receipt arrives in a minute. Unblocked by: exp.host reachable (send to an unregistered valid token, expect DeviceNotRegistered), then a real Android device token plus the owner's FCM credentials uploaded to Expo (V10, INBOX-21). G-267.
**Check 2 (a category turned off is not sent): passed** in specs: moneyIn, contentReviews, refunds, dmReminders, newFollowers each off writes or sends nothing; a switch turned off after the notification and before the send is skipped (`switch_off`); `dm_received` follows "Paid questions" for push only.
**Check 3 (dead token cleaned up): passed** in specs: DeviceNotRegistered on the ticket or the receipt disables the token once, nothing more is sent to it, a late receipt cannot kill a re-registered token, sign-out deletes, purge deletes, disabled tokens are deleted after 30 days.
**Tests.** push-sender 37, push-token 24 (full AppModule, real HTTP, own limits kept), push-policy 31. Concurrency: parallel registration (one owner), parallel passes in two instances (40 messages, each once), parallel enqueue, parallel receipt jobs, held-row skip. 17 mutants (scratch copy, never committed) each fail at least one spec: switch re-read, ON CONFLICT, SKIP LOCKED (messages and receipts), disable guard, ownership move, campaign pushed, push-only gate, kill switch, receipt lease, token cap, reaper, ticket disable, purge map, read skip, retry cap, token in log.
**Gates before to after (backend; BEFORE on a worktree of origin/main with its own npm ci).** tsc 0 to 0. ESLint without --fix 3649 errors, 865 warnings to the same, 0 per-file-rule differences (15 new files clean). Gates 16 fail, 76 accepted unchanged; warns 56 to 60 (4 PROVISIONAL markers: token cap, timing, TTL, retention). check_baseline OK. Contract suite on a fresh seed in a private namespace (own Postgres, own mock on 4001): main 168 suites, 4120 tests, 29 failed, 3 skipped; branch 171, 4212, 17 failed, 3 skipped; every branch failure is also a main failure (receipt-units Unicode table, plus its 300 ms timing test under load) or passes alone (fintava-stall); `hub-rate-limits` passes on the host network on both (22 of 22); table row counts after the run equal main's, Push tables 0. Protected routes (`scripts/protected-routes/run.sh --fresh`, own Postgres): 253 of 253 on origin/main and on the branch; a separate byte-for-byte side-by-side of the notification routes was NOT RUN (their code is unchanged and their specs pass). Mobile `npm run check` main exit 0 (797 tests, gates 0; first run a cold-cache OpenWalletScreen timeout).
**Defaults (agent), owner may override:** token cap 10 (evict oldest seen); token in the body of DELETE, never the URL; a dead token is disabled then deleted after 30 days; a lost answer is failed, never resent; held kinds and the lock-screen text are G-265 and G-266; suspension, offline sign-out are G-268. No badge counts (nothing names them). Existing notification routes untouched (`emit()` unchanged, no `Notification` column).
**NOT RUN:** real Expo, FCM, any phone (V10, INBOX-21); `npm run api` (backend main has no push routes until merge).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
