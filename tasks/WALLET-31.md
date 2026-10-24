---
id: WALLET-31
title: WAWU card (first slice)
owner: YOU
area: WALLET
order: -3131
priority: launch
repo: wawu-backend
type: money-path
status: building
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

- **Next:** a fix round on the backend (verifier finding H1: five spec files red in CI, M1, M2); the verifier report is below. Then a verifier again.
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

Verifier: a Sonnet agent that built none of it, 24 Oct 2026. Backend `origin/wmt/WALLET-31` `6fe01f5`, mobile `origin/wmt/WALLET-31` `061b0546`, both on `origin/main` `38be72e` / `7e65293b`. A local stack on the Nuvion stand-in (the stand-in answers the card routes as dev did), web export 390 x 844, real sign-in through the stack's WAWU ID, four wallets opened and funded through the Hub. **Verdict: FIX** (one high, two medium; lows below). Pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-31-v/sheet-*.png` (board beside built, light and dark) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-31-v/pics/`; logs and attack scripts in the same folder.

| Pass | Result | Evidence |
|------|--------|----------|
| Gates | passed | backend `gates/run.py` 9 gates, 1844 files, 0 fail, 135 warn, 88 accepted, EXIT 0; `check_baseline` 124 entries EXIT 0; app gates 10 gates, 1315 files, 0 fail, 18 warn, EXIT 0, 56 gate unit tests OK; `check_tasks` 432 tasks EXIT 0 |
| tsc, eslint | passed | backend tsc EXIT 0, eslint (no `--fix`) on 24 changed `.ts` files EXIT 0; app tsc EXIT 0 |
| New and changed specs | **failed** | 7 specs, 123 tests, 122 pass, 1 fail (`money-contract`), EXIT 1 (`be-specs.log`); card contract spec 15 of 15, `nuvion-cards` 5 of 5, `wallet-gate-coverage`, `money-moving-coverage`, `publishing-gate-coverage`, `hub-rate-limits` pass. App jest `src/features/wallet settings cards src/app`: 32 suites, 514 tests, EXIT 0 |
| CI on `6fe01f5` | **failed** | Protected routes (V3) run 40098287792 success; Gates success; **Branch checks run 40098287992 failure in all three shards** (finding H1) |
| `contract:build` unchanged | passed | EXIT 0, `git diff` of `contract/openapi.json` empty |
| Security | passed, with lows | the PAN and CVV of a revealed card appear in no row (pg_dump of the whole stack database searched), no Hub log line, no browser console or network entry, no local or session storage or cookie; `Cache-Control: no-store` on reveal, list, get, transactions and admin list; create and admin answers carry no number, expiry or CVV; reveal refuses with no PIN (403 `pin_required`), a wrong PIN (403 `pin_incorrect`, 4 tries left), and after 5 wrong PINs 423 `pin_locked` (also on unfreeze; freeze and block stay open, as built); another person's id answers 404 on get, reveal, freeze, unfreeze, block and transactions, and a random UUID 404, a bad id 400; details hide after 30 s on screen; a forged webhook signature 401 |
| Money (V8) | passed, with M1 | one Idempotency-Key sent 3 at once then again: 1 card, replays `Idempotent-Replayed: true`, 2 of the 3 raced calls 409 `idempotency_in_progress`; balance fell by exactly 65,772 kobo per card and the Hub equalled the stand-in after every step (also after card payments of $20, $5 and a $5 reversal); the same key with another body 409; short of money 402 `insufficient_funds` ("Your wallet needs ₦657.72"), nothing taken, row `failed` and hidden, same key after a top-up made one card and took one fee; limits refuse before the PIN (6th held card with a wrong PIN answers 409 `card_limit_reached`, the 11th of a day too); `cards.enabled` 0 refuses create with 503 `cards_unavailable` before the PIN and the quote says `canCreate: false`, freeze and block still work; admin list, freeze, unfreeze, cancel: superadmin and finance 200, support and reviewer 403 on every route, no token and a person's token 401, support freeze cannot be undone by the person (409 `card_blocked`), audit rows `wallet_card_frozen`, `_unfrozen`, `_cancelled` with the admin's role and the subject |
| Additive only | passed | route inventories pass; migration `20261106140000_wallet_cards` applies; `rollback.sql` refused with a cancelled card in the table ("Nothing was changed", table intact) and dropped the table with only a failed row; stamp was the latest at push time (main `20261105100000`; later branches NUV-12, WALLET-25, WALLET-21-HUB, NUV-11 chose later ones) |
| V5 Picture | passed | W29, W31, W32, W1 with the row, W35, card list, details, block sheet, wrong PIN, frozen, blocked, used single-use, W1 and W35 with cards off, light and dark, beside the boards: `sheet-W29.png`, `sheet-W31.png`, `sheet-W32.png`, `sheet-W1.png`, `sheet-W35.png`, `sheet-cards-list.png`, `sheet-W31-details.png`, `sheet-W31-spending.png`, `sheet-W32-block-sheet.png`. Differences from the boards are the recorded R-84 ones (dollar card art, no Physical tab, no Card PIN or Limits tile) |
| V6 States | partly run | run through real causes: wrong PIN (screen and API), frozen, unfrozen, blocked, details hidden after 30 s, cards off (rows gone from W1 and W35), limit and funds refusals (API). NOT RUN on screen: not enough money toast, limit reached screen, pending ("being made"), network cut |
| V7 Flow walk | passed | sign in, wallet tab, "Get your card" row, W29 (both kinds), PIN, W31, details, freeze, unfreeze, second card, list, W35 row, block sheet (keep, then block), both blocked |
| V9 Live seam | partly run | real sign-in through the stack's WAWU ID, Hub balance shown on screen equals the stand-in's. **NOT RUN against Nuvion dev (`api.nuvion.dev`)**: the brief's live pass (open and fund a wallet on dev, make a virtual and a single-use card, reveal, freeze, unfreeze, block, delete each card) was not done, the step budget went on the stack walk and the CI findings. Nothing was made on dev, so there is nothing to delete |

### Findings

**H1 · high · defect · the backend branch is red in CI (all three shards) on five spec files this branch breaks; reproduced locally.** The builder's "tests pass" covered only the card specs.
1. `src/account-purge/tests/account-data-map.spec.ts:51`: `WalletCard.wawuUserId` and `WalletCard.wawuFeeKobo` are not classified in `src/account-purge/account-data-map.ts`. Nobody has said what deleting an account does to a person's card rows (the row is the only WAWU record of a card that may still exist at Nuvion). Needs a disposition (default for the builder to pick and mark "Default (lead), owner may override"), plus the purge having to block or release the card if the row is dropped.
2. `src/money/gate/tests/wallet-gate.contract.spec.ts:393`: its list of gated routes lacks the nine `money/cards` routes (15 tests fail).
3. `src/money/tests/money-contract.spec.ts:187`: `SERVED_MONEY_ROUTES` lacks the nine card routes (`GET .../cards/quote` is the first reported). The builder report says this spec passed; on this head it fails.
4. `src/nuvion/tests/nuvion-client.spec.ts:434`: the documented-error table (153 types) lacks the new mapped type `error_card_creation_fee_required` (`src/nuvion/nuvion-error.ts`).
5. `src/nuvion/tests/nuvion-webhook.contract.spec.ts:656`, `:701`, `:715` (4 tests): the registry tests use `cards.deleted` as their free sample event; `NuvionCardsHandler` now claims it, so a delivery is "waiting" (`WALLET-31: the wallet provider is not mounted`) and not "processed". The sample event must move to one no handler claims.
Repro: `npm run test:contract -- src/account-purge/tests/account-data-map.spec.ts src/nuvion/tests/nuvion-client.spec.ts src/nuvion/tests/nuvion-webhook.contract.spec.ts src/money/tests/money-contract.spec.ts` (6 failed); CI `gh run view 40098287992 --log-failed`. Not WALLET-31's: `webhook-retention.contract.spec.ts` (FIX-20, Nuvion duplicate) fails the same way on `wmt/WALLET-25` and `wmt/NUV-12`.

**M1 · medium · unclear (G-WALLET-31-1) · WAWU's own card fee cannot be collected.** `WAWU_FEE_CARD_KOBO` above 0 answers 503 `fees_not_set` and the quote says `canCreate: false` (`src/money/cards/wallet-card.service.ts` `assertCreatable`, `quote`), so R-10 (the person pays the provider's fee plus WAWU's) is half built; at the default 0 only Nuvion's 65,772 kobo is taken (measured). Recorded by the builder as medium; the lead rules whether it rides in the fix round or its own task.

**M2 · medium · defect · the live dev run was never made by the builder or by this verifier.** Everything about real Nuvion rests on the builder's 24 Oct dev cycle in `docs/nuvion/DEV-RESULTS.md`; the app-to-Hub-to-dev path through a web export is unwalked. A follow-up needs a funded dev wallet (EUR open banking and an FX book transfer, or a book transfer from the operational account).

**L1 · low · defect · reveal has no limit of its own.** 40 simultaneous correct-PIN reveals: 17 answered 200, 23 answered 429 (only the app-wide 20 a second and 200 a minute apply); no `@Throttle` on `POST /money/cards/<built-in function id>/reveal` (`money-cards.controller.ts`). Wrong PINs do lock after 5.
**L2 · low · defect · a used single-use card reads "Frozen, Unfreeze card".** Repro: make a single-use card, pay once through the stand-in (`/__standin/card-spend`), wait 40 s: the Hub row is `frozen/person`, the card screen offers Unfreeze behind the PIN and then shows Active. No board or gap row draws a "used" state. Depends on what real Nuvion does after a single-use payment.
**L3 · low · defect · hardening.** `NuvionWebhookEvent.rawBody` and `payload` keep every `cards.*` delivery untouched; nothing removes a `number` or `cvv` key if Nuvion ever sent one (the stand-in's shape has none; real dev's webhook was never run).
**L4 · low · defect.** W1's row shows the newest card even when all cards are blocked ("Single-use card · Blocked") and blocked cards stay in the list for good.
**L5 · low · unclear.** With cards off, W1 and W35 hide their entries (as the brief says) although the Hub keeps freeze and block working: a person with a live card cannot stop it from the app while cards are off.
**L6 · low · note.** Repeating an admin unfreeze or cancel writes another audit row each time (5 rows for 3 changes).
**L7 · low · defect.** W29's fee surface: the "Bank charge" row sits closer to the top edge than the note does to the bottom (picture `sheet-W29.png`).

Not run by this verifier, on purpose: Fintava specs (`webhook-retention`, and `wallet-gate.contract.spec.ts` was run once by mistake: it imports the in-process Fintava double, no network, no sandbox); a fingerprint approval (no device on the web export); real dev webhooks.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
