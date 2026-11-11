---
id: OPS-CLEAR-ROOMS
title: A one-off command that clears every community on the live Hub, on the owner's word
owner: YOU
area: OPS
order: 389
priority: after-launch
repo: wawu-backend
type: ops
status: todo
depends_on: []
decisions: [R-17, R-19, R-136]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-CLEAR-ROOMS · A one-off command that clears every community on the live Hub, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-136.
- **Checked by the lead** on Hub `origin/main` bf3f4a3b:
  - there is no route that deletes a community (host or admin);
  - deleting a `Community` row cascades to memberships, messages, read markers, mutes, link, pass price, `CommunityPass` and `CreditSpend` (and through it `CreditSpendEarning`, the host's earning);
  - `CommunityModerationLog` and `CommunityPassRefund` carry a `communityId` with no relation, so nothing cascades to them;
  - other tables with a `communityId` (schema lines near 1730, 1917, 1941, 8649, 8737) must be read and handled;
  - the deploy's `npm run db:seed` runs only against the CI test database (`deploy.yml`), so nothing re-creates a cleared room.
- **Builds on OPS-DEL-TEST** (Hub `wmt/OPS-DEL-TEST` 9f054474, under its T2 re-verify): reuse its sandbox-host proof and `scripts/ops/real-money-rows.ts`; do not copy them. Both scripts merge in one Hub PR.
- **Next:** builder on wawu-backend `wmt/OPS-CLEAR-ROOMS` (from `origin/wmt/OPS-DEL-TEST`), then a T2 verifier.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-17, R-19, R-136
- wawu-backend: `scripts/ops/delete-test-account.ts` and `scripts/ops/real-money-rows.ts` (on `wmt/OPS-DEL-TEST`), `prisma/schema.prisma` (Community and every model with a `communityId`), `src/community/`, `src/community-message/`, `src/community/pass/`, `src/inbox/inbox-feed.sql.ts`, `src/me/me-earnings.service.ts`, `src/search-response/search-history.service.ts`, notifications that point at a room, any cache of community lists

## Goal

The owner runs one command on the server, sees every community it would clear, types the phrase, and the Communities screen is empty, with no real money touched.

## Scope

- **`scripts/ops/clear-communities.ts`**, built by the deploy like `delete-test-account.ts`, run the same way (`cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/clear-communities.js`).
- **Dry run (default), writes nothing.** A numbered list of every community: name, kind, host (handle from WAWU ID read only when `WAWU_ID_DATABASE_URL` is given, else the host id), members, messages, passes (count, active, kobo paid), credit spends (count, host earning kobo), refunds by status, has a cover, link slug; then which rooms apply would clear and which it keeps for real money (with the record), totals, and the exact confirmation phrase (it carries the count). No email, phone or message text is printed.
- **Apply:** `--apply --confirm "<phrase>"`. Clears every room the dry run listed for clearing, one transaction per room, through the cascade plus the rows that do not cascade (moderation log; notifications, search history and anything else that points at the room: delete or leave, whichever keeps every read working, and record which). Settled refund rows are money history and stay. Any cache of community lists is cleared through the app's own service (never FLUSHALL). Prints what it did; running it again finds nothing to clear.
- **Real money (R-136 point 2).** Use the OPS-DEL-TEST sandbox proof: with the wallet provider on live keys, any pass is real money. Credits spent come from lots: a spend from a lot bought through Flutterwave or another real-money provider is real money. A pending refund is money in motion. A room with any of these is kept and listed, never cleared; there is no flag to override it.
- **Cover images** are left in storage (the one storage writer rule); the dry run counts them. Record it.
- **Tests** (contract spec on the test database, stand-ins only, never a live provider): dry run writes nothing; the phrase must match; apply clears exactly the listed rooms and their rows; a room with a live-key pass, a real-money credit spend or a pending refund is kept; a second run finds nothing; the inbox, Me earnings, search and notifications reads still answer for a person who was in a cleared room; the protected suite passes.

## Capability checks

- [ ] The owner sees every community and what clearing it would remove, with nothing changed.
- [ ] After apply with the phrase, `GET /communities` (and the inbox) shows none of the cleared rooms, for every user.
- [ ] A room with real money is kept and listed.
- [ ] A member of a cleared room opens the app with no error (inbox, notifications, search, Me).

## Builder report

## Verifier report
