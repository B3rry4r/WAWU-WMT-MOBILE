---
id: WALLET-31
title: WAWU card (first slice)
owner: YOU
area: WALLET
order: -3131
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-16, R-84, R-20, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WALLET-31 · The WAWU card on Nuvion (Hub side)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B20), backend `wmt/WALLET-31` `718d332` on `origin/main` `38be72e`; status verifying; no PR. R-84 settled R-16: the card is what Nuvion issues today, virtual and single-use dollar cards funded from the person's own account, Nuvion converting at use. Facts are from Nuvion's docs and the dev answers of 24 Oct 2026 (`docs/nuvion/DEV-RESULTS.md`, WALLET-31 rows), never from the Fintava notes below (superseded).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no card route, table or provider call | `GET/POST /money/cards`, `GET /money/cards/quote`, `GET /money/cards/{id}`, `POST .../reveal` (PIN or fingerprint, `no-store`), `POST .../freeze` and `DELETE` (no PIN), `POST .../unfreeze` (PIN), `GET .../transactions`: declared and served (contract rebuilt, additive) |
| 2 | the provider seam had no cards | `WalletProvider.cards` (optional: Fintava has none and the Hub answers `cards_unavailable`); the Nuvion adapter's `src/nuvion/areas/cards.ts` (real dev cycle run through it: create, find, get, reveal, transactions, freeze, unfreeze, delete) and `src/nuvion/handlers/cards.handler.ts` (`cards.*` events; a frozen or unfrozen event is followed by reading the card's status) |
| 3 | no record of a card | table `WalletCard` (migration `20261106140000_wallet_cards`, rollback refuses while a card that is not failed exists); never the number, expiry, CVV or billing address (a spec checks the answer, the row and the log) |
| 4 | no controls | plan setting `cards.enabled` (1 or 0, default 1); `NUVION_FEE_CARD_CREATE` (no default; unset answers `fees_not_set`), `WAWU_FEE_CARD_KOBO` (default 0, R-10), `WALLET_CARD_MAX_ACTIVE` (5) and `WALLET_CARD_MAX_PER_DAY` (10); `admin/money/cards` list, freeze, unfreeze, cancel for superadmin and finance, each with an `AdminOpsAudit` row |
| 5 | stand-in without cards | `scripts/dev/nuvion-standin.cjs` answers the card routes as dev did (fee at once, `entity_id` a query on reads and a body field on PATCH and DELETE, deleted is 404 everywhere) plus `POST /__standin/card-spend`; `stack.sh` passes `NUVION_FEE_CARD_CREATE` |

Default (lead), owner may override: block and delete are one action (Nuvion has only delete), so one route and one word, Block; freeze and block need no PIN, unfreeze and details do; the limits (5 held, 10 a day) are not Nuvion's and not ruled; a WAWU fee above 0 is refused with `fees_not_set` until a fee-only charge exists (G-WALLET-31-1).

- **Next:** a verifier; then the app side is WALLET-22 (same branch name in the mobile repo).
- **History:** none yet. Reports go to tasks/history/WALLET-31.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-16 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/nuvion/DEV-RESULTS.md` (WALLET-31 rows: what Nuvion's dev answered for cards)

## Goal

The Hub half of the WAWU card as Nuvion issues it today (R-84): virtual and single-use dollar cards funded from the person's account, details behind the PIN each time and never stored, freeze, unfreeze and block, card payments, an on/off plan setting, limits and fees from config, and admin routes with an audit row.

## Scope

Backend only (`wawu-backend`, branch `wmt/WALLET-31`): `src/money/cards/`, `src/nuvion/areas/cards.ts`, `src/nuvion/handlers/cards.handler.ts`, one additive migration, the plan setting, contract and docs. Not built because Nuvion serves nothing for them: a physical card, delivery, a card PIN, channel switches and limits to set (W30, W33, W34).

## Fintava facts

Superseded by R-84. Nothing here touches Fintava: the Fintava adapter has no `cards` member.

## Capability checks

- [ ] The owner has decided on cards, Fintava's card fees and webhooks are in `docs/fintava/`, and this task has been split into tasks of two days or less.

## Builder report

Backend `wmt/WALLET-31` `718d332` (two commits). Checks, each with its log EXIT line: card contract spec 15 of 15 and reader spec 5 of 5 (EXIT 0); the three inventories I extended (`money-moving-coverage`, `wallet-gate-coverage`, `money-contract`, 104 tests, EXIT 0); `hub-rate-limits.contract` and `publishing-gate-coverage` pass; tsc 0; eslint 0 on every changed file; `contract:build` EXIT 0 (additive; one enum member order differs); `test:protected` 248 of 253 (the 5 are `/learn/courses` and `/creators/:id/evg` fixture setups, nothing to do with cards; not compared with main). `plan-settings-round2` and `-readers` fail 14 tests on a clean `origin/main` worktree too (checked): not mine. The two inventory specs got the card routes added to their lists (their own extension point: MOVES_NO_MONEY, NON_MONEY_WRITES, the gated-route lists); no assertion was changed.
Real dev (api.nuvion.dev, 24 Oct): the Hub's own cards area ran a full cycle on a finished child entity (create 201 in 19 s, find by reference, details with the 16-digit number and 3-digit CVV read, freeze 12 s, unfreeze, delete, then 404 everywhere). Nuvion takes ₦657.72 (65,772 kobo) at creation for both kinds; below it, 400 `error_card_creation_fee_required`. Card payments could not be made on dev (no simulate route), so the payment list is read from the docs' shape and the stand-in only.
Not done: collecting a WAWU fee above 0; card spends and the creation fee are not in the Hub ledger, so the nightly check may list them as lines with no row (G-WALLET-31-2, not measured). A migration stamp later than every origin and `origin/wmt/*` stamp at push time (`20261105100000` was the latest).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
