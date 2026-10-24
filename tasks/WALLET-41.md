---
id: WALLET-41
title: A person outside Nigeria opens a wallet without a BVN, in their own currency (R-87)
owner: YOU
area: WALLET
order: -141
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-87, R-83, R-84, R-85, R-6, R-10, R-39, R-47, R-29, R-20]
passes: [V1, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-41 · A wallet for a person outside Nigeria

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B29): backend `wmt/WALLET-41` `84c8ecc` and mobile `wmt/WALLET-41`, both on `wmt/WALLET-21-HUB` (backend `d39a868`, mobile `14da2683`). Status verifying. A free negative order (-141): the task adds to R-87's list and changes nothing the web calls.

| # | Before (`wmt/WALLET-21-HUB`) | After |
|---|---|---|
| 1 | Open your wallet asked every person for a BVN and NIN; a foreign phone could not open | `POST /money/wallet/open` takes `countryCode` (not NG), `firstCurrency`, `nationality` and no BVN, NIN or check handle; the entity goes to Nuvion with that country's ID, no numbers; the same documents and hosted selfie follow |
| 2 | no choice of first account | `GET /money/world/options?country=XX` names the country's own currency (config table: US USD, GB GBP, euro countries EUR, CA CAD, AE AED, GH GHS, else USD), every currency that is on, the fee (0) and whether opening is available; `GET /money/world/countries` is the list to pick from |
| 3 | an approved person got a naira account | an approved person outside Nigeria gets their first account in the chosen currency (Nuvion's `entities.updated` handler, and `POST /money/world/first-account` as the backstop, which also lets them pick another currency when Nuvion declines one) |
| 4 | `GET /money/wallet` had no word for it | adds `world` (country, first currency, state); `state` is `open` once the first account is, `account` stays null; naira routes answer them `409 wallet_not_open`; the foreign-account read and open routes accept their wallet |
| 5 | no way to switch or watch it | switch `world.open.on` (default on), `WORLD_OPEN_FEE_<CODE>_MINOR` (0, R-10, quoted only), `WORLD_OPEN_DAILY_LIMIT`, `WORLD_BLOCKED_COUNTRIES`, `WORLD_FIRST_CURRENCY_MAP`; admin `GET /admin/money/world/openings` and `POST .../freeze`, `/unfreeze`, `/cancel` (superadmin and finance, one audit row each) |
| 6 | the app: BVN first for everyone | a number from outside Nigeria is asked where it lives first (A31's new first step); the details step takes a state or province typed; the ID screen offers passport, national ID, driver's licence; the open call carries the country and no BVN; the checking step opens the first account; "Your wallet is open" and the Wallet tab list the person's foreign accounts and add a currency |

One document is one wallet: a world opening claims the keyed hash of its ID document (country, type, number) in place of a BVN, held and let go exactly as a BVN's is. A refused opening names the fields Nuvion pointed at (`reason.fields`), never a value, so the person is asked for what Nuvion asks, not for a list of ours.

Real Nuvion DEV (`docs/nuvion/DEV-RESULTS.md`, WALLET-41): US, GB, GH, DE, CA, AE and KE people opened with no BVN and no SSN and were approved in about 5 s; first accounts opened in all six currencies; details active for GBP, GHS, EUR, pending or none for USD and CAD, refused for AED (UAE) and for USD (Kenya). Gaps G-WALLET-41-1 to 8.

Checks (backend, own DB `b29world_test`): tsc EXIT 0; eslint on changed files EXIT 0; contract:build EXIT 0 (7 operations, 2 served money, 5 admin or opening); new specs `world-config` 38, `world-wallet.contract` 19, `world-opening.contract` 9; `money-contract`, `wallet-gate-coverage`, `money-moving-coverage`, `account-data-map`, `data-export-map`, `publishing-gate-coverage`, `hub-rate-limits`, `plan-settings`, `nuvion-opening.contract`, `nuvion-opening-review`, `fx-contract`, `fx-money.contract` pass; migration `20261118090000_world_wallet` applied clean, rollback refuses with a row. Mobile: tsc EXIT 0; eslint on changed files 0 errors; 14 new tests in `worldOpening.test.tsx`; the open-wallet, wallet, home and delete-account folders 838 of 838; gates 0 fail. Driven on a local stack (Hub on the Nuvion stand-in, the web export of the app): a person in the UK signed up, opened with no BVN, uploaded the two documents, was approved, got a GBP account with active details, and the wallet read `world.state` `open`; the naira balance route answered `wallet_not_open`.

- **Next:** a verifier checks the Hub side and the screens; the lead sets a first-account fee and the country list when GEO-02 lands (G-WALLET-41-4, -5); Nuvion switches on AED and Kenya (G-WALLET-41-2); swaps and sends from a world wallet (G-WALLET-41-3). NOT RUN: a phone, the hosted selfie through the app (Nuvion's session start was answered on dev for a UK entity, `scripts/nuvion/world-dev-check.ts`), a first real webhook (the stack's stand-in sends one).
- **History:** reports go to tasks/history/WALLET-41.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md`: R-87, R-83, R-84, R-85, R-6
- Backend `src/money/world/`, `src/money/opening/reviewed-opening.ts`, `src/nuvion/handlers/opening.handler.ts`; app `src/features/open-wallet/CountryStep.tsx`, `WorldFirstAccount.tsx`, `src/features/wallet/world/`

## Goal

A person whose country of residence is not Nigeria opens a wallet without a BVN: Nuvion checks them with their own country's ID and a liveness check, and their first account is in their country's currency or the one they choose. A person in Nigeria keeps the BVN naira wallet unchanged.

## Scope

Backend: `src/money/world/**`, additive changes in `src/money/opening/**`, `src/money/gate/wallet-gate.ts`, `src/money/fx/` (gate and a frozen check), `src/nuvion/areas/opening.ts`, `src/nuvion/handlers/opening.handler.ts`, `src/wallet-provider/`, the plan-settings registry, an additive migration, `scripts/dev/nuvion-standin.cjs` (foreign accounts). App: `src/features/open-wallet/` (new `CountryStep`, `WorldFirstAccount`, `api/world.ts`; world branches in A31, A5, A26, A28, A8), `src/features/wallet/world/`, the home model, and their tests. No board draws these (R-29): built from the form's own parts.

## Capability checks

- [x] A person with a number from outside Nigeria can choose the country they live in and the first account's currency (the country's own is already chosen; one that is off is not offered).
- [x] A person in a country Nuvion cannot serve is told so plainly and cannot continue; Nigeria goes on to the BVN as ever.
- [x] A person can open without a BVN: the details, the ID document and proof of address, then the review (the hosted selfie reused).
- [x] An approved person gets their first account without doing anything; if Nuvion declines the currency they see its words and pick another.
- [x] A person with an open world wallet can see each account's balance and receiving details and add a currency.
- [x] Support can list, freeze, unfreeze and cancel; each act writes one audit row.
- [ ] On a phone: NOT RUN (no device in this session).

## Builder report

Files and checks as in Current state. Defaults (lead), owner may override: the first-currency choices are the six fiat currencies (a coin needs a chain and is added afterwards, R-84); a fee for opening is quoted and not collected (nothing to debit at opening); the country step appears only for a number that is not +234 (G-WALLET-41-5); a cancel keeps no claim on the ID document; a freeze stops outflow and new accounts, money can still arrive.

## Verifier report

_Filled in by the verifier._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
