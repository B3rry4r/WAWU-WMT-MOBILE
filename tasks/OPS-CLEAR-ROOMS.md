---
id: OPS-CLEAR-ROOMS
title: A one-off command that clears every community on the live Hub, on the owner's word
owner: YOU
area: OPS
order: 389
priority: after-launch
repo: wawu-backend
type: ops
status: review
depends_on: []
decisions: [R-17, R-19, R-136]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-CLEAR-ROOMS · A one-off command that clears every community on the live Hub, on the owner's word

## Current state

As of 11 Nov 2026.
- **Merged (lead, 11 Nov 2026):** Hub PR #265 merged as 4dd12e4c (all 18 checks green on c5800e01); on the server since 13:18 UTC (health 200). The owner runs the command while Nuvion is on test keys.
- **Status:** `review`. Verifier round 2 (T2, the re-check of M1 and L5) says **MERGE**: no blocker, no high, no medium. Hub `wmt/OPS-CLEAR-ROOMS` head c5800e01, checked as built; nothing was run against any real database or provider.
- **M1 closed, L5 closed** (report in history). Lows L1 to L4 stay as disclosed; one new test-gap note (a share of 0 kobo is not in the spec).
- **Owner commands** (on the server, after the deploy builds `dist/scripts/ops/clear-communities.js`): dry run `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/clear-communities.js`; apply: the same with `--apply --confirm "CLEAR <n> COMMUNITIES"`, the phrase the dry run printed. Run while the wallet provider is still on its test keys; on live keys every pass and wallet-bought credit is real money and those rooms are kept. A host share the sweep has not made yet keeps its room until it has (the sweep's start is read from the same `EARNINGS_SWEEP_START`).
- **NOT RUN:** the full `npm run test:contract` and the protected suite (GitHub's PR run is the evidence); anything against a real or remote database or a live provider.

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

