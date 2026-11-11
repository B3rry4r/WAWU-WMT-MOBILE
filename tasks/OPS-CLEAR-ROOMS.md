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
- **Status:** built, awaiting a T2 verifier. Hub branch `wmt/OPS-CLEAR-ROOMS` head 688d93e3 (from `wmt/OPS-DEL-TEST` 9f054474); nothing run against any real database.
- **Owner commands** (on the server, after the deploy builds `dist/scripts/ops/clear-communities.js`):
  - dry run: `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/clear-communities.js`
  - apply: the same, then `node dist/scripts/ops/clear-communities.js --apply --confirm "CLEAR <n> COMMUNITIES"` with the phrase the dry run printed (the count is in it).
  - No `WAWU_ID_DATABASE_URL` is needed: the host handle is on the Hub profile.
- **Real money (a room with any of these is kept and listed, no flag):** a pass not paid at the provider this server runs on proven sandbox keys (or any pass when the sandbox is not proven), or bought through a store outside the store sandbox; a pass payment still pending; a store purchase outside the sandbox; a store subscription not ended; a refund not yet `refunded`; credits spent from a lot bought through Flutterwave, a store outside the sandbox, or another provider (or any wallet-bought lot when the sandbox is not proven); a lot that cannot be found; a host earning not yet landed (or in a move not landed) or landed at another provider.
- **Sample dry run** (made-up rooms, test database; 9 rooms, 4 cleared, 5 kept):
```
DRY RUN (nothing is written)
Provider: fintava, sandbox. FINTAVA_BASE_URL is Fintava's sandbox host (...; the address and the key are not printed)
Communities on the Hub: 9
1. ocr-64ec1bce flutterwave [open] d4b65b13-...
   host 97ec5eb8-...; members 1; messages 0
   passes 0 (active 0, paid 0 kobo); credit spends 1 (host earning 850 kobo)
   refunds none; cover no; link none
   -> KEPT, real money:
      CreditPurchase 81dff05e-... status flutterwave amount - kobo [live: Flutterwave (live, R-1) credit purchase funded spends in this room]
...
6. ocr-64ec1bce plain [open] 5333d8cf-...
   host 97ec5eb8-...; members 1; messages 2
   passes 0 (active 0, paid 0 kobo); credit spends 1 (host earning 0 kobo; 1 with no earning record)
   refunds none; cover yes (stays in storage); link ocr-64ec1bce-plain
   -> would clear
Would clear: 4
Kept for real money: 5 (listed above; this command never clears them)
Totals to clear: 4 memberships, 2 messages, 1 passes, 2 credit spends, 1 cover images left in storage
Confirmation phrase: CLEAR 4 COMMUNITIES
Dry run only. To clear: add --apply --confirm "<the phrase above>".
```
- **Owner items:** none blocking. Decide for the kept rooms (the dry run lists each record) once their money settles; this command never clears them.
- **NOT RUN:** the full `npm run test:contract`; `src/storage/tests/thumbs.spec.ts` and `src/live/tests/live-hardening.contract.spec.ts` (the shared node_modules has no `sharp`); a deploy build of `dist/` (the repo's tsconfig compiles `scripts/` like `delete-test-account.ts`; `npx tsc --noEmit` shows only the two `sharp` type errors); anything against a real or remote database or provider.

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

