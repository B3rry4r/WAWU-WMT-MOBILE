---
id: FIX-21
title: The money-route checks see class-level guards, and the limits lock names its isolation level
owner: YOU
area: FIX
order: 225
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [NUV-07]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-21 · The money-route checks see class-level guards, and the limits lock names its isolation level

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/NUV-07.md` (verifier findings 3 and 4) and `BACKEND_GAPS.md` G-410

## Goal

Two gaps in NUV-07's guards, found by its verifier:
- `money-moving-coverage.spec.ts` reads method guards only, and counts a route as money-moving only if it documents `idempotency_key_required`. A controller with a class-level PIN guard and `@RequireFeesSet()` last on the method passes the spec, yet answers `403 pin_required` before `fees_not_set`. A money route that documents only the wallet gate errors is not checked at all.
- The per-person lock in `assertMayMove` orders reads only under READ COMMITTED (Prisma's default). Under REPEATABLE READ, two movements of 600 against a daily limit of 1000 both pass; under SERIALIZABLE one fails with a write conflict instead of `limit_reached`.

## Scope

- The coverage spec reads class-level and method guards together, and counts as money-moving any route that carries a debit gate (the PIN guard, `@RequireTransactionPin()` or the debit gate errors), whatever it documents. The verifier's two throwaway controllers must fail it.
- `assertMayMove` refuses to run outside READ COMMITTED (it reads `transaction_isolation`) with an error naming the level. G-410 says READ COMMITTED.
- Land this before any money-moving route merges (MONEY-17, NUV-04, NUV-05).

## Capability checks

- [ ] The coverage spec fails each of the verifier's two controllers, and passes on main's routes.
- [ ] `assertMayMove` inside a REPEATABLE READ or SERIALIZABLE transaction refuses; under READ COMMITTED, parallel movements never pass a limit (at least 50 rounds).
- [ ] Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
