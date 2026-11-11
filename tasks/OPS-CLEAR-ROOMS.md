---
id: OPS-CLEAR-ROOMS
title: A one-off command that clears every community on the live Hub, on the owner's word
owner: YOU
area: OPS
order: 389
priority: after-launch
repo: wawu-backend
type: ops
status: building
depends_on: []
decisions: [R-17, R-19, R-136]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-CLEAR-ROOMS · A one-off command that clears every community on the live Hub, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** back to `building`. Verifier round 1 (T2) says **FIX**: one medium finding (M1 below), no blocker. Hub `wmt/OPS-CLEAR-ROOMS` head 3685b50c (task diff vs `d4d76123`: `scripts/ops/clear-communities.ts`, `scripts/ops/room-money-rows.ts`, `src/community/tests/ops-clear-communities.contract.spec.ts`; no migration, no schema change). Nothing was run against any real database or provider.
- **M1 (fix before the owner runs it):** `scripts/ops/room-money-rows.ts:195-217` (the `st` check) keeps a room whose host share is not landed only when an `EarningSettlement` row exists. A settlement for a credit spend is made later by the sweep (`adoptHostShares`, `src/money/earnings/earning-settlement.service.ts:685`). A wallet-bought funded spend (sandbox) not yet adopted has no row, so the room is listed "would clear", and apply deletes the earning (host share, 850 kobo in the probe) before it was ever owed. Fix: a funded earning with `hostShareKobo > 0`, bought from the wallet, earned on or after `sweepStart`, with no settlement counts as "on its way" (kept, listed). Add a spec row.
- **Everything else held** (full list in the history file, Verifier report round 1): every rule in `room-money-rows.ts` keeps or clears as written; 130 sandbox rows plus one real row is kept (no capped read anywhere); the room lock plus in-transaction recheck catches a pass or a credit spend committed during apply; wrong or missing phrase, unknown flag, DB down give exit 1, 1, 1, 2 with nothing written; a `kill -9` mid-apply leaves whole rooms only and a rerun finishes; the dry run writes nothing (row counts of all tables identical) and prints no email, phone or message text; member and host reads answer after a clear; sandbox proof is OPS-DEL-TEST's, untouched.
- **Owner commands** (unchanged, once M1 is fixed): dry run `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/clear-communities.js`; apply: the same with `--apply --confirm "CLEAR <n> COMMUNITIES"` (the phrase the dry run printed). Run while the wallet provider is still on its test keys; on live keys every pass and wallet-bought credit is real money and those rooms are kept.
- **Low findings (not blocking, for the area sweep or the builder's choice):** L1 a spend with no earning row is deleted with its room and cannot be traced to its lot (disclosed; the dry run counts them); L2 a sandbox store pass whose reference is `store:<id>:restored:<n>` is kept as unknown (safe, never clears); L3 a completed pass payment not yet delivered, or being refunded, is not a keep rule (the refund runs on the payment and needs no room; delivery to a gone room refunds); L4 the Purchases list still shows the pass payment for a cleared room; L5 spec gaps, see history.
- **NOT RUN:** the full `npm run test:contract` (GitHub's PR run is the evidence); the two `sharp` type errors in `npx tsc --noEmit` are the shared checkout's missing `sharp` (same on the base); anything against a real or remote database or a live provider.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-CLEAR-ROOMS.md](history/OPS-CLEAR-ROOMS.md).

