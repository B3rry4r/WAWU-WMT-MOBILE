---
id: SETTINGS-07
title: Notification switches the server honours
owner: DEV
area: SETTINGS
order: 34
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-07 · Notification switches the server honours

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z3's switches work: a user who turns a kind of notification off stops getting it, and nothing else changes.
Split from SETTINGS-03 so each task touches one repo.

## Scope

The notification keys Z3 draws and the server lacks (moneyIn for tips, sales and transfers; communityMessages per
message; contentReviews for approved and sent back), stored with the existing settings and honoured by every
sender, including push (INBOX-03). Additive: existing keys and their behaviour stay.

## Capability checks

- [ ] A user who turns off "New followers" gets no notification when someone follows them, and still gets every other kind.
- [ ] Each of the three new switches is saved, read back, and honoured by the sender of that kind.
- [ ] V3: the web's existing notification settings behave the same.

## Builder report

**Backend (wawu-backend, branch wmt/SETTINGS-07, from main 5c07568; not committed).** Files: `prisma/schema.prisma` (2 nullable columns on NotificationSettings), `prisma/migrations/20261002140000_notification_switches/{migration,rollback}.sql`, `src/notification/notification.service.ts` (gate map), `src/notification-settings/{notification-settings.service.ts,dto/update-notification-settings.dto.ts}`, `src/notification/tests/notification-switches.contract.spec.ts` (new, 12 tests), `contract/openapi.json` (regenerated with `npm run contract:build`). Mobile: this file, `BACKEND_GAPS.md` (G-19 to G-21), `docs/LOG.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **What was built.** `moneyIn` (tips, sales) and `contentReviews` (approved, sent back) are nullable booleans beside the six old flags; NULL = never set = ON, so existing rows notify as before. Both go through the existing `GET/PATCH /settings/notifications`; PATCH accepts them as optional booleans, and GET leaves a key off the wire while it is NULL, so an existing user's response is the same bytes (named `NotificationSettingsWire` in the contract; the response was an inline shape before, G-1). Honoured in `NotificationService.emit()`, the one write path: it already gated by `SETTINGS_GATE`, now `tip_received` and `sale` -> moneyIn, `content_published` and `content_rejected` -> contentReviews.
- **Sender inventory (every `emit` caller).** new_follower (follow route): gate `newFollowers`, existing. tip_received (tips verify): moneyIn. sale (content unlock verify): moneyIn. dm_received (DM verify): no switch drawn, ungated. dm_deadline (scheduler): `dmReminders`, existing (Z3 "Paid questions"). dm_refunded (refund sweep): `refunds`, existing. credits_low (community send, credits spend): ungated, not on Z3. content_rejected (admin review): contentReviews. kyc_verified (KYC review): ungated, not on Z3. verify_reminder (reminder service): ungated by decision. campaign (`emitCampaign`, second write path): `promotions`, existing (Z3 "From WAWU"). No sender exists for: likes, comments, community messages, transfers, content approved (G-19, G-20). Push: none in the backend (G-21); `emit()` is the choke point, so push must follow its returned row.
- **Capability 1 (New followers off stops follows only).** Real HTTP: PATCH newFollowers=false, follow via `POST /creators/:id/follow`, 0 `new_follower` rows; the same user still gets tip_received, dm_received, content_rejected. Also the older wiring spec case. On: 1 row.
- **Capability 2 (each new switch saved, read back, honoured).** moneyIn: PATCH false, read back, real tip and real unlock settle (purchase completed) and write 0 notifications; follows and reviews still arrive; true/unset writes them. contentReviews: PATCH false, `emit` of content_published and content_rejected returns null, kyc_verified and tip still written. communityMessages: not built (no sender, G-19). Mutation check: removing two gate lines fails 2 of the 12 tests.
- **Capability 3 (V3).** Protected route suite 244/244 before and after (`scripts/protected-routes/run.sh`). Before/after request equality: origin/main build vs this branch, on a DB migrated up from main's state with existing rows: 13 requests with old keys only (GET, PATCH {}, one key, all six keys, a bad type, no token, a user with no row) are byte-identical, 13 of 13; new-key requests behave as above, and `moneyIn: "no"` answers 400.
- **Gate counts (backend, before -> after).** tsc 0 -> 0 errors. eslint (without --fix; the repo's own baseline) 3645 errors, 851 warnings -> 3643, 851. `scripts/gates/run.py` 16 fail, 1 warn, 76 accepted, 543 files -> same, 544 files. Contract suite 1730 tests (1727 pass, 3 skipped) -> 1742 (1739 pass, 3 skipped), 0 failed. Mobile `npm run check`: exit 0 before (250 tests) and after merging main 637fbc6 (271 tests, from main's own new tests), gates 0 findings, 200 tasks.
- **Migration.** Additive only (`ADD COLUMN "moneyIn" BOOLEAN, "contentReviews" BOOLEAN`, no default, no backfill). Replayed from an empty database (all migrations, then seed), applied to a database that already had rows (existing rows read NULL), `rollback.sql` (DROP COLUMN x2) run by hand and the migration reapplied. `prisma migrate diff` shows no NotificationSettings difference (it lists an older ContentPiece index drift on main, not touched).
- **Defaults (agent), owner may override:** (1) the new keys are nullable and absent from the response until set, rather than defaulting to true, so nothing changes for existing users; (2) `communityMessages` is not stored at all, because no sender exists; the mobile Settings screen draws no acting switch for it until a task adds the kind; (3) `contentReviews` also covers the approved kind so a future approval sender is honoured with no change; (4) `dm_received`, `credits_low`, `kyc_verified` stay ungated (no switch on Z3).
- **Contract for mobile.** `contract/openapi.json` now names `NotificationSettingsWire` (userWawuId, six booleans, optional moneyIn and contentReviews; the generator marks them `nullable`, but the server never sends null) and the PATCH DTO lists the two keys. The mobile `npm run api -- --backend ../wawu-backend` reads origin/main, so it picks them up after the backend merge (NOT RUN here).
- **Fenced files touched:** `prisma/schema.prisma` (the additive migration this task names) and `contract/**` (regenerated). **Backend notes:** the 4 shop/event/finance/marketplace specs need a mock WAWU ID on :4001 and a `wawu_hub_test` database; I started both locally.
- **NOT RUN:** real push (none exists, G-21); a real admin approve/reject over HTTP (admin auth secrets are not set locally, so the review kinds were tested through `emit()`); `npm run api` (needs the backend on origin/main); V10 device. Local database only; no live server, key or email.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
