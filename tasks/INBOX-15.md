---
id: INBOX-15
title: Money requests in chat
owner: YOU
area: INBOX
order: 139
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [INBOX-06, INBOX-07, WALLET-07]
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-15 · Money requests in chat

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier over three rounds (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-15.md`); round 3 accepted on the lead's review of the diff. Stacked in batch 9 by MERGE-9 (backend `c803256`, migration `20261025040000_money_requests` kept: no stamp clash). Built by a Sonnet builder: backend `wmt/INBOX-15` `c803256` (round 3 on `258de3d`) on `origin/wmt/MERGE-7` `9c40478` (stacked to merge after batch 7); mobile record on `0aca612c` (docs only, no app code).
- **Migration:** `20261025040000_money_requests` (one new table `MoneyRequest`; the `ChatMessage` text-or-attachment CHECK also allows `kind = 'money_request'`). The lead renames at merge if the stamp clashes.
- **Routes (new, `src/money-request/`):** `POST /chats/:chatId/money-requests` (ask; the asker needs an open wallet; answers the chat message that carries the request), `GET .../:requestId` (settles an unconfirmed payment first), `POST .../:requestId/pay` (Idempotency-Key, X-Transaction-Pin; answers the send like `POST /money/transfers/wawu`), `POST .../:requestId/decline`, `POST .../:requestId/cancel`.
- **Round 2 (17 Oct 2026, Sonnet builder, backend `258de3d`):** the verifier's two mediums fixed. (1) The pay Idempotency-Key is tied to its request: the same key on another request is `409 idempotency_key_reused`, on the same request it still replays. (2) The asker's erase clears their reason (`MoneyRequest.memo` and the payer send's note), cancels every request of theirs that is pending and not being paid, and leaves one being paid to its send (paid if it completes, closed if it fails); the payer's erase leaves the asker's request open for the asker. Committed `money-request-nuvion.contract.spec.ts` (19 tests, Nuvion seam stand-in, no Fintava double). The first spec (`money-request.contract.spec.ts`, Fintava double) was not touched or run. Mobile: no API type change (the app's contract copy has no money request routes yet).
- **Round 3 (17 Oct 2026, Sonnet builder, backend `c803256`):** the round 2 verifier's one medium fixed. After the asker is erased, the memo no longer survives on the payer's side: `eraseAskerRequests` also nulls the note on the request's send rows in the shared ledger table and blanks `data.note` in the pay answer stored for the key, so the payer's `GET /money/transactions` and a replay of the paid key carry no reason. Only `money-request-erase.ts` and its own spec changed; erase tests extended (also for a send still in flight).
- **MERGE-9 note:** the regenerated contract (`moneyRequest` on the inbox row and preview, `money_request` among the kinds) failed typecheck in `src/features/inbox/rows.tsx` (`unreadField`) and the InboxScreen test fixtures. Fixed as types only, no behaviour change (the Hub's unread for a money request is always 0). INBOX-19 and INBOX-20 build the rows.
- **Next:** a verifier for round 3 (V1 V2 V3 V4 V9); then INBOX-19 and INBOX-20 build the screens on these routes. The verifier runs the 20-parallel-requests and 3 s provider timing probe (a bystander's read under 1 s); this spec holds a provider call open and reads another person's inbox badge under 1 s.
- **History:** this builder report moved to tasks/history/INBOX-15.md.
- **Owner questions:** none.
- **Decisions the builder took (defaults, recorded):** a request is also a chat message of kind `money_request` (its reason is the message text); its unread in the inbox is always 0, because the chat already counts that message (no double count in the badge); the Money chip is `kind=money_request` (`kind=money` stays a 400, INBOX-07's test); the asker needs an open wallet (R-6), the payer is gated at pay time; amount at least 1 kobo and at most the send's maximum, reason at most 100 characters (the send's note); decline and cancel need no wallet and stay allowed after a block.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A user can ask someone in a chat for money; the other pays or declines once. Additive only.

## Scope

MoneyRequest (pending, paid, declined, cancelled) written into the chat; paying uses WALLET-07.

Requests appear in the INBOX-07 feed and the I20 Money filter. Paying a request is a send to a WAWU user (WALLET-07), with that fee.

## Capability checks

- [ ] A request paid once cannot be paid again.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-15.md](history/INBOX-15.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
