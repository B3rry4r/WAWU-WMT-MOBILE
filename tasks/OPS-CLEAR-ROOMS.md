---
id: OPS-CLEAR-ROOMS
title: A one-off command that clears every community on the live Hub, on the owner's word
owner: YOU
area: OPS
order: 389
priority: after-launch
repo: wawu-backend
type: ops
status: verifying
depends_on: []
decisions: [R-17, R-19, R-136]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-CLEAR-ROOMS · A one-off command that clears every community on the live Hub, on the owner's word

## Current state

As of 11 Nov 2026.
- **Status:** fix round 1 built, awaiting the verifier's second look (`verifying`). Hub `wmt/OPS-CLEAR-ROOMS` head c5800e01 (OPS-DEL-TEST `7dfd5cf8` merged by a merge commit, no conflict). Nothing was run against any real database or provider.
- **M1 closed:** `room-money-rows.ts` keeps a room when a credit-spend earning has `hostShareKobo > 0`, `earnedAt` on or after the sweep's start and no settlement yet (the sweep makes it later). The start is read as the sweep reads it: `EARNINGS_SWEEP_START` when set, else the stored `EarningSweepStart` row, else the beginning of time (everything unsettled keeps its room); read only.
- **L5 closed:** new spec `src/community/tests/ops-clear-communities-money.contract.spec.ts` (2 tests, 17 rooms): kept rooms for an unsettled share, a production store pass, production store-bought credits, a missing lot, a landed settlement in an owed move, an active store subscription, a production store purchase with no pass, 130 test passes plus one real; their controls clear (a share before the start, sandbox store pass and credits, a landed move, an ended subscription, 130 test passes only). Two races: a pass committed after the plan, and one still open when the apply reaches the room. Mutants run by hand and killed: M1 rule removed (2 fail), `FOR UPDATE` removed (1 fail), in-transaction recheck removed (1 fail). A test-only `Deps.beforeRoom` hook (not reachable from the command line) lets the spec land the purchases.
- **Owner commands** (unchanged): dry run `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/clear-communities.js`; apply: the same with `--apply --confirm "CLEAR <n> COMMUNITIES"` (the phrase the dry run printed). Run while the wallet provider is still on its test keys; on live keys every pass and wallet-bought credit is real money and those rooms are kept.
- **Low findings left as disclosed:** L1 a spend with no earning row is deleted with its room (the dry run counts them); L2 a sandbox store pass with a `:restored:<n>` reference is kept as unknown (safe); L3 a completed pass payment not yet delivered is not a keep rule (refunds run on the payment); L4 the Purchases list still shows the pass payment of a cleared room.
- **Ran (exit 0 each):** the five ops specs (new two, OPS-DEL-TEST, schema walk) and the community, community-message, inbox, notification and me specs: 37 suites, 501 tests, with a real `npm ci` in the Hub worktree (so `sharp` was present); `npx tsc --noEmit` clean; eslint (no --fix) on the four files; `python3 scripts/gates/run.py`; `check_baseline.py`; `npm run contract:build` twice, `git diff --exit-code contract/` clean (the merged contract needed no change).
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

