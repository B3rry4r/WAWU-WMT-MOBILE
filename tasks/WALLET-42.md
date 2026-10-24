---
id: WALLET-42
title: A person outside Nigeria sends abroad from a foreign account (and a naira person from one they hold), WAWU's fee from the same account (R-87)
owner: YOU
area: WALLET
order: -140
priority: launch
repo: all
type: mobile-screen
status: verifying
depends_on: [NUV-11]
decisions: [R-87, R-84, R-83, R-10, R-39, R-47, R-29, R-20]
passes: [V1, V3, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-42 · Send abroad from a foreign account

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B31): backend `wmt/WALLET-42` (on `origin/main` `49f49b0`) and mobile `wmt/WALLET-42` (on `origin/main` `fb8c8f05`). Status verifying. It also depends on WALLET-41 (task file on `wmt/WALLET-41`, not on this base) and WALLET-21 (order 321, later than this free negative order); `check_tasks` cannot state either as `depends_on` yet, so add `WALLET-41` when it merges (Default (lead), owner may override). Nothing here touches Fintava; the Hub reaches Nuvion only through `WALLET_PROVIDER` (the `abroad` side). WALLET-41's app side (the world Wallet tab) is on `wmt/WALLET-41`, not on this base, so the one entry button a world person needs is its owner's to add when it merges (gap G-WALLET-42-2).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | a person with a world wallet (WALLET-41, no naira account) was refused every `/money/abroad` route with `409 wallet_not_open`; the abroad area of Nuvion needed a naira wallet id to find the person | every `/money/abroad` route takes a world wallet (`@RequireOpenWallet({ world: true })`; the send through `@AllowWorldWallet()`); the seam gets a holder with an empty wallet id and the entity as the customer, and Nuvion's area works from that (`holderIds`) |
| 2 | a send could leave any account, but WAWU's fee (`abroad.wawu_fee_kobo`) was always kobo from the naira wallet | for a person with no naira wallet the fee is taken from the foreign account the money leaves, in its currency: `abroad.wawu_fee_foreign` (lines `GBP BANK 100`, `USD MOBILE_MONEY 150`, none until named, R-10), `wawuFeeMinor` on the quote and the send (migration `20261130090000_abroad_foreign_fee`, two defaulted columns, rollback refuses while a send holds one); a person with a naira wallet is unchanged |
| 3 | fee legs were naira-only | the same legs (`<reference>-fee`, `-fee-back`, the `-2` and `-3` generations, taken only on a completed record, given back once) now run over a port: the naira wallet's, or the foreign account's (`feeLeg` and `findFeeLeg` on the abroad side; Nuvion: a book transfer in the account's currency to WAWU's collecting account named by `FX_FEE_COLLECTOR_<CODE>_BAN`, and back from it) |
| 4 | a send in a currency the person does not hold | refused `409 fx_account_not_open` in plain words ("You do not have a USD account to send from.", and for naira "You have no naira account. Send from one of your other currency accounts.") before the PIN; the funds check counts the fee in the sending currency |
| 5 | the review drew WAWU's fee as naira always | the review and the receipt say the fee in the currency it is taken in, count it in "Total from your GBP account", and draw no naira figure for a person with no naira wallet; the account chips list only what the Hub lists, with its balance |
| 6 | the sweep, the admin, the deletion blocker and the export knew the naira fee only | the sweep and the admin (`feeOpen`, `settle-fee`) find the holder of a world wallet and read the foreign leg; an unfinished send or a fee still owed holds an account deletion for a world person too; the export and the purge map classify the new column |

### What Nuvion really does (dev, `api.nuvion.dev`, 24 Oct 2026; full table in `docs/nuvion/DEV-RESULTS.md`)

A send abroad can be debited from a foreign-currency account. A UK dev person with only a GBP account (no naira account) sent GBP 3.00 to Ghana mobile money (converted, quote held 179 s): GBP 4.12 left the account (the 3.00 and Nuvion's fee of GBP 1.12, on top, in the source currency), and the transfer's `currency` is the source account's. A same-currency send to a UK bank (FPS) charged GBP 2.00; a GBP to EUR bank send was quoted a fee of GBP 4.30 on a send refused for funds. Quotes are given from GBP, USD and EUR accounts to GHS, KES, TZS, UGX, ZAR, AED, MXN, CNY, PHP, USD, EUR, GBP, CAD, AUD, SGD, HKD and NGN (the naira source cannot be quoted to nine of them: a foreign source opens more corridors); INR and XAF are refused. A failed transfer ("Modulus check failed" on a UK sort code) returned both the amount and the fee to the account. WAWU's fee leg between a person's GBP account and WAWU's GBP account works both ways in the account's currency (book transfer by `nuvion_ban`), and a repeat of a reference answers 409 with the original. Not seen: a reversal, a webhook, a real UK bank success, a USD ACH send (no funded dollar person), SEPA to completion.

Defaults (lead), owner may override: (a) a person with a naira wallet keeps NUV-11's naira fee for every send (the rule picks the fee's account by whether there is a naira wallet to pay from; moving a naira person's foreign sends onto the foreign fee is one line in `AbroadService.quote`, gap G-WALLET-42-1); (b) a fee in a currency with no collecting account configured is not offered (`currency_not_supported`), never taken from naira; (c) the world person's partner fee estimate is the same `ABROAD_PROVIDER_FEE_*` config (GBP figures measured on dev are in `.env.example`).

Checks (backend, own DB `b31wa_test`; none imports the Fintava double): tsc EXIT 0; eslint (no --fix) on the changed files EXIT 0; `world-abroad.contract.spec` 13 of 13, written beside the change and shown red with the three rules switched off (12 of 13 fail: the world flag, the route gate and the foreign fee read); the existing abroad suites, `money-moving-coverage`, `wallet-gate-coverage`, `money-contract`, `account-data-map`, `data-export-map`, `data-export-abroad-sections`, `publishing-gate-coverage`, `hub-rate-limits`, `nuvion-abroad` and the `plan-settings` specs that do not use the Fintava harness: 17 suites 263 tests EXIT 0 after the purge map row; `contract:build` EXIT 0 (no new route; `wawuFeeMinor` on the quote, the send and the admin view); gates 0 fail and baseline EXIT 0. Dev: `scripts/nuvion/world-abroad-check.ts` (sources with no naira account, three recipients, quotes, two real sends, a fee taken and given back through the Hub's own area). App: tsc, eslint on the changed files, jest abroad 24 of 24 (three new flow tests, three new model tests) and `route-guard.test.tsx` green; no route file added.

NOT RUN: a reversal or a webhook for a foreign-account send, a phone, a picture (no layout changed, one row's currency), a live Hub on the stand-in stack, the specs that import the Fintava double (CI runs them).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `DECISIONS.md`: R-87, R-84, R-10
- `docs/nuvion/DEV-RESULTS.md` (the WALLET-42 section), tasks `NUV-11`, `WALLET-41`
- Backend `src/money/abroad/`, `src/money/gate/wallet-gate.ts`, `docs/contract/CONVENTIONS.md` section 30 ("From a foreign account")

## Goal

A person with a world wallet quotes and sends abroad from a foreign account they hold, with the PIN and an Idempotency-Key, and WAWU's fee comes out of that account and goes back once if the send does not stand. A person with a naira wallet may do the same from a foreign account of theirs.

## Scope

Backend: `src/money/abroad/`, `src/nuvion/areas/abroad.ts`, `src/wallet-provider/abroad-provider.ts`, the plan-settings registry line, one additive migration, and the shared registrations in SHARED-CHANGES.md (WALLET-42 #1 and #2). App: `src/features/abroad/` (model, views, tests), the contract copy.

## Capability checks

- [x] A world person can list, quote and send from a foreign account (spec: holder with no naira wallet id, the send debits that account's reference).
- [x] WAWU's fee is taken once from the same account and given back once on a failed or reversed send (specs, both states, repeated sweeps).
- [x] A naira route still refuses a world person; a quote from naira or from a currency they do not hold is refused in plain words.
- [x] The send-abroad screens offer only the accounts the Hub lists, with its balance, and show the fee in the account's currency.
- [ ] On a phone, and a reversal at Nuvion: NOT RUN.
