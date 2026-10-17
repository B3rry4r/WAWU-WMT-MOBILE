---
id: SWEEP-INBOX
title: Inbox sweep: the low findings of communities and the Inbox
owner: YOU
area: SWEEP
order: 250
priority: launch
repo: all
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# SWEEP-INBOX · Inbox sweep: the low findings of communities and the Inbox

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 20, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** the INBOX-21 rows wait for INBOX-21 to merge (the push code is on its branch until then); the INBOX-12 rows wait for batch 4 to merge; the other rows' source tasks are merged. The WALLET-40 rows wait for batch 7 to merge (the code they name is on its branch until then). The HOME-17 rows wait for batch 7 to merge (the code they name is on its branch until then).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Communities, rooms and the Inbox: INBOX tasks. Mobile, and the backend routes they call. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| INBOX-05 | 34 | I25: when the first POST is stored but its answer is lost, the live socket delivers the stored message while the pending copy still reads "Not sent", so the same words show twice. | `tasks/INBOX-05.md`, Verifier report, finding 34, line 439 |
| INBOX-05 | 36 | The read-on's `!isFetching` is the value from the last render; a refresh landing between a page committing and its effect running is not seen. Shared with FIX-30. Very low. | `tasks/INBOX-05.md`, Verifier report, round 6 findings, line 493 |
| INBOX-05 | 37 | Test gap: nothing pins "a refused next page is asked for once, then the list's Try again" (mutant Dc survives). Very low. | `tasks/INBOX-05.md`, Verifier report, round 6 findings, line 494 |
| INBOX-21 | 4 | A forced session end (the refresh token refused, a live-feed close 4403) leaves the phone registered: the phone has no valid token left to remove itself with, so the signed-out person's sale, tip, refund and paid-question pushes keep reaching it. The fix belongs on the Hub (backend `src/push/`): drop a person's push tokens when their session ends. Only the explicit Sign out removes the phone today. | `tasks/INBOX-21.md`, Builder report, round 2; verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21.md`, finding 4 |
| INBOX-21 | R2-1 | The next person's registration can be forgotten. `registration.ts` forgetPush line 164 `await forgetToken()` runs when A's removal finally returns, even after A's sign-out went on at 3 s. If B signed in and registered in between, `rememberToken` is wiped, so B's own sign-out sends no DELETE and the phone stays registered to B. Needs A's removal to hang past B's registration. Fix direction: clear the stored token only if it is still the one this sign-out removed, or before the first await. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21-r2.md`, finding 1 (repro: zzV2 test A9) |
| INBOX-21 | R2-2 | The late removal uses a stale bearer: `takeOffLate` (line 62) uses `run.owner`, the access token the run started with (often expired after 15 minutes away). A registration that started with an expired token, refreshed, and whose POST lands after the sign-out gets 401 on the removal; the phone stays on A. Needs a slow POST (over 3 s) and a sign-out in the first seconds after opening the app. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21-r2.md`, finding 2 (repro: zzV2 test A5b) |
| INBOX-12 | 4 | I21: a reply time saved off the list (the web allows 1 to 336 hours, for example 36) shows no selected window on the reply-time tabs. Save still works and keeps it. Needs a ruling: show the saved value as an extra tab, or none selected. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-12.md`, finding 4 (picture `inbox-12-v/shots/off36-dark.png`) |
| INBOX-12 | R2-1 | GET /paid-dm/settings/earn takes JS-Number spellings that are not plain integers (0x1388, 0005000, " 5000", +5000) and answers 200 with the right figure; cause is @Type(() => Number) in src/direct-message/dto/paid-dm-settings.dto.ts:54. Nothing is written and the PUT cannot receive these. Tighten with a digits-only check if wanted. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-12.md`, finding 1 |
| INBOX-12 | R2-2 | A failed earn read is made twice per typing pause (React Query retry: 1, src/features/paid-messages/PaidMessagesScreen.tsx:198), and a 429's retry adds to the per-IP bucket. Set retry to 0 for this query. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-12.md`, finding 2 |
| INBOX-12 | R2-3 | Note, not a defect: the paid-messages folder keeps nairaToKobo(Number(digits)) (model.ts:32, 44, the R-21 helper), percentText (floors a percent) and windowLabel (divides hours). Lead to confirm these stay inside R-21. | verifier report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-12.md`, finding 3 |
| INBOX-16 | F1 | Hub (shared, not introduced here): a credits payment that is paid but cannot be delivered, or whose provider call was dropped without the money moving, blocks THAT pack for the buyer: a new pay answers `409 payment_in_progress` and the poll says 'Your payment went through and we're finishing it. Don't pay again.' (delivery) or 'We're still confirming this payment...' (dropped call) until the payment goes to review at PAYMENT_REVIEW_AFTER_HOURS (72 h), and then for ever (a person has to look). Other packs still buy. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-16.md`, finding 1 |
| INBOX-16 | F2 | Hub (pre-existing, info): the 85/15 split on a wallet-bought lot is per spend, so draining the 120-credit / 100,000-kobo lot in 18 spends of 7 gave the host 84,994 and WAWU 15,006 (total exact 100,000). `src/credit-spend` is untouched by this branch; web lots round the same way. A single 120-credit spend gives exactly 85,000 / 15,000. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-16.md`, finding 2 |
| INBOX-16 | F3 | Hub: the rollback in migration `20261024000000_credit_purchase_wallet_payment` drops `walletPaymentId`, the only link from a credits purchase to its payment (payments, ledger and credits stay). Acceptable for an unreleased additive column; say so in the rollback note if this ships. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-16.md`, finding 3 |
| HOME-16 | F1 | Backend: the TGIF switch is read in the claim statement and again in emit (a later statement of the same transaction), `src/scheduler/tgif-daily-notice.service.ts:150-175` with `emitTgifDaily` in `src/notification/notification.service.ts`. A person who turns TGIF off in the millisecond between the two keeps a marker but gets no notice; if they turn it back on that morning they get none until tomorrow. Not reproduced (needs that exact moment). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-16.md`, finding 1 |
| WALLET-40 | L1 | Mobile (pre-existing, INBOX-21's design, not WALLET-40): a push tapped while signed out is dropped, not held for after sign-in (`src/features/push/PushBridge.tsx`, `status === 'signedOut'` clears the tap). The `wallet_ready` tap therefore opens Wallet only when signed in; signed out, the person signs in and lands on Home. Same for every pushed kind. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-40.md`, finding 1 |
| WALLET-40 | L3 | Backend (INBOX-03's design, unchanged): `PUSH_LOOKBACK_MINUTES = 15` (`src/push/push-config.ts:74`). If every push sweep is down for more than 15 minutes after the commit, the phone push for the "account number is ready" notice is never sent (the notice is still in the list). Never doubled. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-40.md`, finding 3 |
| HOME-17 | L1 | Backend: the migration uses a plain `CREATE INDEX` (Prisma runs it in a transaction, so no `CONCURRENTLY`): Notification writes wait while it builds. Sub-second at 70k rows; on a very large production table schedule the deploy off peak. `prisma/migrations/20261024220000_tgif_notice_retention_index/migration.sql:9`. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-17.md`, finding 1 |
| HOME-17 | info 3 | Backend (note, no change asked): a second server follows an edit of a setting within 15 s (`PLAN_SETTINGS_REFRESH_SECONDS`, TIER-06's design). For the TGIF time that can mean up to 15 s early or late on one server, never a second notice (the once-a-day marker). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-17.md`, finding 3 (info) |
| INBOX-20 | L1 | The shared pay sheet's header (`src/components/pay-sheet/PaySheet.tsx:383`, `Header`) draws an empty rounded tile before the title on the "Not enough" sheets of a request ("Pay Ada", `RequestPaySheet.tsx:56`) and a send ("Send to Ada Seeded", `ChatSendScreen.tsx:401`); nothing is passed as `image`. Filed as SHARED-CHANGES INBOX-13 #3 (open). The credits short state no longer uses the sheet. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S2.md`, finding F2 and round 2 notes |
| INBOX-19 | L1 | Known limit (G-880): the "You sent" bubble is kept on the sender's phone only (`src/features/chat/sends.ts`). A send whose answer was lost and never retried has no bubble, the receiver never sees one, and a new phone loses it. It survives a cold restart. Needs the Hub to write a chat message for a send. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S2.md`, finding F4 |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
