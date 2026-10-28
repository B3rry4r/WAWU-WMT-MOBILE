---
id: NUVION-FIX
title: Where our code disagreed with Nuvion's answers of 27 Oct 2026 (naira add money off, account details read again, decimals always 2)
owner: YOU
area: MONEY
order: -1257
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: money-path
status: verifying
depends_on: []
decisions: [R-5, R-10, R-39, R-47, R-84]
passes: [V1, V2, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUVION-FIX · Our code against Nuvion's answers

## Current state

As of 28 Oct 2026, built by a Sonnet builder (T2): backend `wmt/NUVION-FIX` `97fbb43` on `origin/main` `36279a4`, mobile `wmt/NUVION-FIX` on `origin/main` `26247a6d`. Status verifying. Facts are Nuvion's answers of 27 Oct 2026 (naira cannot be added by card, mobile money or open banking; card acquiring is suspended in production; card settlement takes 6 days; account details are made asynchronously in 5 to 30 minutes; all amounts use 2 decimals) and the audit that found where the code disagreed (28 Oct, items below by its numbers). Lead rulings, not owner questions. Not run against the real Nuvion (dev or live): the specs use the stand-in.

| # | Before | After |
|---|---|---|
| 1.1 | `money.add_money_card_on` and `money.add_money_ussd_on` default 1: once ops set the key, return address and fee, card, Apple Pay and bank checkout showed and failed | both default 0 (note `ADD-MONEY-NGN-OFF`); migration `20261219090000_nuvion_fix` sets a saved row to 0 and keeps the old value and admin in `PlanSettingNuvionFixBackup`; its rollback puts them back and refuses while a row is anything but the migration's own (0, no admin named): an admin save of 1 or of 0 both stop it (patch round 1, NF-V1) |
| 1.2 | a suspended refusal showed "could not reach" and the rail stayed listed | decided on Nuvion's error type and the call only, never its words: on the call that makes the payment an acquiring or service type that says suspended, not supported or not available, or a 403 that is not an entity, account or review type; the known currency type on any call. Then `not_supported`: "This is not available.", the rail (card and Apple Pay together) hidden and remembered as refused for 15 minutes. An entity 403, a card issuer's 422 on confirm and a review 422 fail that attempt only (patch round 1, NF-V2)
| 1.3 | a `KE-` or `TZ-` channel offered USSD for naira; open banking needed only an address and a fee | USSD only with an `NG-` channel (another country's is read as unset, a malformed one still stops the server); open banking is never offered for naira |
| 1.4 | "This is not switched on for naira yet. It shows here as soon as it is." | "This is not available." |
| 5.1 | a paid card was marked for a person after 3 days; "This can take a little while." | after 8 days; "Paid. Card payments reach your wallet in about 6 days." (card and Apple Pay) |
| 9.1 | nothing read pending details again: a lost `account_details.updated` left "on its way" for good | the 15 minute sweep re-reads details `requested` or `pending` for over 5 minutes (by id when kept, else by listing), records them as a delivery would (wallet and notice once), and never asks Nuvion to make them |
| 9.2 | the create response was recorded as it came | read back from Nuvion first; unreadable: nothing recorded, the claim stays and the delivery waits |
| 9.3 | app A28 ignored `on_its_way`: "a few minutes", no Close | approved plus on its way: "Your account number is being made" / "This can take up to 30 minutes. We will tell you when it is ready." with Close |
| 9.4 | a foreign account with no record and no refusal said "unavailable" | `pending`; only a refusal, in Nuvion's words, says `unavailable` |
| 9.5 | `POST /account-details` on every Wallet read | at most every 5 minutes per account (nullable `FxAccount.detailsAskedAt`, a conditional write is the claim); reads are not limited and the last refusal is still told meanwhile |
| 9.6 | no ready notice for a foreign account; app Receive said "Check again in a moment" | `account_details.updated` reads the details back and, when active, tells the person once (nullable `FxAccount.detailsReadyAt`, same `wallet_ready` notice); not for details they already saw ready. App Receive: "This can take up to 30 minutes." |
| 10.1 | `FX_DECIMALS_<CODE>` could move a currency off 2 places (amounts 10,000 times off) | removed from the settings code, `.env.example` and CONVENTIONS; decimals are always 2; G-WALLET-21-1 closed |

Migration `20261219090000_nuvion_fix` (after `20261218090000`; no other branch is past `20261218090000`): one table `PlanSettingNuvionFixBackup` (setting, value, admin), two nullable columns on `FxAccount`; additive, safe to run again. Rollback refuses while an add-money setting was saved by an admin since (as 1 or as 0); dropping the table and the two markers loses no person's data. No route, field or contract change (`contract:build` leaves `contract/openapi.json` unchanged).

Decisions (Default (lead), owner may override): (a) the foreign account's ready notice reuses `wallet_ready` ("Your account number is ready", the tap opens Wallet) instead of a new kind (G-NUVFIX-1). (b) The card review waits 8 days from the attempt's creation. (c) A refusal is remembered per rail for 15 minutes as before; card and Apple Pay share one route, so a no for one is a no for both. (d) The last details refusal is held in memory for the 5 minute wait, so a second server shows "pending" until it asks itself.

Existing assertions changed because a ruling made them wrong (each says so in its test): `add-money.contract.spec` (USSD channel `KE-` to `NG-`; open banking reason; the 1.4 words; the plan-setting test puts the row back to 1 instead of deleting it; the suite switches both rails on, since they default off), `fx-money.contract.spec` (the details are asked again after 5 minutes, not on the next read), `admin-money-settings-reads.spec` (USDT places 2, not 6), app `documentsFlow.test` (approved plus on its way reads the new words).

Proof: backend 27 specs, 322 tests EXIT 0 on a seeded `test_nuvfix` database (new: `add-money-naira-rails.spec`, `nuvion-fix-migration.contract.spec`, `nuvion-details-fix.contract.spec`, `fx-decimals.spec`; extended: add-money, fx-money; plus plan-settings, accounts, wallet-ready, fx, reconcile, both account maps, push-policy); `tsc`, `eslint` on changed files, gates (0 fail), `check_baseline`, `contract:build` EXIT 0; `prisma migrate diff` empty. App: `documentsFlow` and `fxCryptoFlow` EXIT 0, `tsc`, `eslint` EXIT 0, Android fingerprint unchanged `17ffb13d`. Red first: the rails, migration and decimals specs were run failing (7 of 10) before the code; the others were written before the code and not run failing.

Patch round 1 (28 Oct): NF-V1 rollback guard, NF-V2 type-only service refusal, NF-V4 gap G-NUVFIX-3 (A28's approved plus on its way state, no board). NF-V3, the card spec's flaky CVV check (`wawu-card-<hex>` can hold the CVV's digits), is its own backend commit `97fbb43` (`money-cards.contract.spec` reads past random references; every assertion kept).

Not done: any run against the real Nuvion; the exact error Nuvion sends for a suspended service is unknown (G-NUVFIX-2); the Fintava-double specs (CI runs them); `plan-settings-readers` and `plan-settings-round2.contract` (import Fintava code, CI runs them); pictures of the two changed screens (below).

## Read first

`DECISIONS.md` R-5, R-10, R-39, R-84; `docs/nuvion/DEV-RESULTS.md`; backend `src/money/add-money/`, `src/nuvion/handlers/`, `src/money/fx/`.

## Goal

Nothing in the Hub or the app promises, offers or computes what Nuvion said it cannot do or does differently: no naira card, mobile money or open banking, a card that settles in 6 days, account details that arrive in 5 to 30 minutes and are found even when a delivery is lost, and two decimals everywhere.

## Scope

`wawu-backend`: the files above and one migration. `wawu-wmt-mobile`: `CheckingScreen.tsx`, `ReceiveScreen.tsx` and their tests, and these records.

## Capability checks

- [x] Card and USSD off by default; a saved on is turned off and its rollback restores it.
- [x] A suspended or unsupported route hides the rail and says "This is not available."
- [x] A lost details delivery is found by the sweep; a create answer is read back.
- [x] Details are asked for at most every 5 minutes; a ready notice goes out once.
- [x] Decimals are always 2.
- [ ] Against the real Nuvion: NOT RUN.
