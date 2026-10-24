---
id: WALLET-42
title: A person outside Nigeria sends abroad from a foreign account (and a naira person from one they hold), WAWU's fee from the same account (R-87)
owner: YOU
area: WALLET
order: -140
priority: launch
repo: all
type: mobile-screen
status: review
depends_on: [NUV-11]
decisions: [R-87, R-84, R-83, R-10, R-39, R-47, R-29, R-20]
passes: [V1, V3, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-42 · Send abroad from a foreign account

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B31): backend `wmt/WALLET-42` (round 1 on `origin/main` `4153fd7`) and mobile `wmt/WALLET-42` (round 1 on `origin/main` `7ba7c210`, WALLET-41 live). Status review (verified PASS, 24 Oct 2026, see Verifier report). Round 1 (lead rulings, 24 Oct 2026) is the last section of this Current state. It also depends on WALLET-41 (task file on `wmt/WALLET-41`, not on this base) and WALLET-21 (order 321, later than this free negative order); `check_tasks` cannot state either as `depends_on` yet, so add `WALLET-41` when it merges (Default (lead), owner may override). Nothing here touches Fintava; the Hub reaches Nuvion only through `WALLET_PROVIDER` (the `abroad` side). The entry for a world person is built in round 1.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | a person with a world wallet (WALLET-41, no naira account) was refused every `/money/abroad` route with `409 wallet_not_open`; the abroad area of Nuvion needed a naira wallet id to find the person | every `/money/abroad` route takes a world wallet (`@RequireOpenWallet({ world: true })`; the send through `@AllowWorldWallet()`); the seam gets a holder with an empty wallet id and the entity as the customer, and Nuvion's area works from that (`holderIds`) |
| 2 | a send could leave any account, but WAWU's fee (`abroad.wawu_fee_kobo`) was always kobo from the naira wallet | a send from a foreign account takes the fee from that account, in its currency (round 1: for everyone): `abroad.wawu_fee_foreign` (lines `GBP BANK 100`, `USD MOBILE_MONEY 150`, none until named, R-10), `wawuFeeMinor` on the quote and the send (migration `20261130090000_abroad_foreign_fee`, two defaulted columns, rollback refuses while a send holds one); a send from the naira wallet is unchanged |
| 3 | fee legs were naira-only | the same legs (`<reference>-fee`, `-fee-back`, the `-2` and `-3` generations, taken only on a completed record, given back once) now run over a port: the naira wallet's, or the foreign account's (`feeLeg` and `findFeeLeg` on the abroad side; Nuvion: a book transfer in the account's currency to WAWU's collecting account named by `FX_FEE_COLLECTOR_<CODE>_BAN`, and back from it) |
| 4 | a send in a currency the person does not hold | refused `409 fx_account_not_open` in plain words ("You do not have a USD account to send from.", and for naira "You have no naira account. Send from one of your other currency accounts.") before the PIN; the funds check counts the fee in the sending currency |
| 5 | the review drew WAWU's fee as naira always | the review and the receipt say the fee in the currency it is taken in, count it in "Total from your GBP account", and draw no naira figure for a person with no naira wallet; the account chips list only what the Hub lists, with its balance |
| 6 | the sweep, the admin, the deletion blocker and the export knew the naira fee only | the sweep and the admin (`feeOpen`, `settle-fee`) find the holder of a world wallet and read the foreign leg; an unfinished send or a fee still owed holds an account deletion for a world person too; the export and the purge map classify the new column |

### What Nuvion really does (dev, `api.nuvion.dev`, 24 Oct 2026; full table in `docs/nuvion/DEV-RESULTS.md`)

A send abroad can be debited from a foreign-currency account. A UK dev person with only a GBP account (no naira account) sent GBP 3.00 to Ghana mobile money (converted, quote held 179 s): GBP 4.12 left the account (the 3.00 and Nuvion's fee of GBP 1.12, on top, in the source currency), and the transfer's `currency` is the source account's. A same-currency send to a UK bank (FPS) charged GBP 2.00; a GBP to EUR bank send was quoted a fee of GBP 4.30 on a send refused for funds. Quotes are given from GBP, USD and EUR accounts to GHS, KES, TZS, UGX, ZAR, AED, MXN, CNY, PHP, USD, EUR, GBP, CAD, AUD, SGD, HKD and NGN (the naira source cannot be quoted to nine of them: a foreign source opens more corridors); INR and XAF are refused. A failed transfer ("Modulus check failed" on a UK sort code) returned both the amount and the fee to the account. WAWU's fee leg between a person's GBP account and WAWU's GBP account works both ways in the account's currency (book transfer by `nuvion_ban`), and a repeat of a reference answers 409 with the original. Not seen: a reversal, a webhook, a real UK bank success, a USD ACH send (no funded dollar person), SEPA to completion.

Defaults (lead), owner may override: (a) WAWU's fee follows the source account for everyone (round 1; a first version kept the naira fee for a person with a naira wallet); (b) a fee in a currency with no collecting account configured is not offered (`currency_not_supported`), never taken from naira; (c) the world person's partner fee estimate is the same `ABROAD_PROVIDER_FEE_*` config (GBP figures measured on dev are in `.env.example`).

Checks (backend, own DB `b31wa_test`; none imports the Fintava double): tsc EXIT 0; eslint (no --fix) on the changed files EXIT 0; `world-abroad.contract.spec` 13 of 13, written beside the change and shown red with the three rules switched off (12 of 13 fail: the world flag, the route gate and the foreign fee read); the existing abroad suites, `money-moving-coverage`, `wallet-gate-coverage`, `money-contract`, `account-data-map`, `data-export-map`, `data-export-abroad-sections`, `publishing-gate-coverage`, `hub-rate-limits`, `nuvion-abroad` and the `plan-settings` specs that do not use the Fintava harness: 17 suites 263 tests EXIT 0 after the purge map row; `contract:build` EXIT 0 (no new route; `wawuFeeMinor` on the quote, the send and the admin view); gates 0 fail and baseline EXIT 0. Dev: `scripts/nuvion/world-abroad-check.ts` (sources with no naira account, three recipients, quotes, two real sends, a fee taken and given back through the Hub's own area). App: tsc, eslint on the changed files, jest abroad 24 of 24 (three new flow tests, three new model tests) and `route-guard.test.tsx` green; no route file added.

NOT RUN: a reversal or a webhook for a foreign-account send, a phone, a picture (no layout changed, one row's currency), a live Hub on the stand-in stack, the specs that import the Fintava double (CI runs them).

### Round 1 (24 Oct 2026, lead rulings; backend `40e33e7`, mobile merged with `origin/main` `7ba7c210`)

| # | Ruling | Done |
|---|---|---|
| 1 | G-WALLET-42-2: add the entry on WALLET-41's world screens | `WorldHome` (the world Wallet tab) draws "Send abroad" on an open foreign account, only while the Hub says sending abroad is on and lists an account to send from in that currency (R-47: not on a frozen account, a coin, or when the product is off). It opens `/send/abroad?from=GBP`; `index`, `new` and `amount` carry `from`, and the amount screen starts on that account while the Hub lists it. 3 new tests (`src/features/wallet/world/__tests__/worldSendAbroad.test.tsx`) |
| 2 | G-WALLET-42-1: WAWU's fee follows the SOURCE account for everyone (owner may override) | `AbroadService.quote`: from the naira wallet the naira fee (`abroad.wawu_fee_kobo`, unchanged); from a foreign account the foreign fee (`abroad.wawu_fee_foreign`, `wawuFeeMinor`), taken from that account and given back to it once, also for a person with a naira wallet. The naira-wallet funds check for a foreign send is gone. Specs first, red on the old rule: a naira person's EUR send takes the EUR fee leg and gives it back once with no naira leg; a naira-source send keeps the naira legs (`world-abroad.contract.spec`, 16 of 16) |
| 3 | G-WALLET-42-3 kept | BACKEND_GAPS G-WALLET-42-3 is now an owner/console row naming the settings to fill |
| 4 | the migration is kept | `20261130090000_abroad_foreign_fee` unchanged, still the newest stamp on every origin branch |
| 5 | backend merged with `origin/main` | `4153fd7` merged with `--no-ff`, no conflict |

NUV-11 assertions that pinned the naira fee on a send whose source is a foreign account (`src/money/abroad/tests/abroad.contract.spec.ts`). Each sent from the dollar account with `abroad.wawu_fee_kobo` set; no assertion text was changed. The fix is in the test inputs: the helper `quoteFor` sends from the naira wallet when the naira fee is set (default source otherwise unchanged), and the three inline quotes of `sendWithFeeAs`, `sendAs` and the account-deletion test name `NGN` instead of `USD`. The fake settings gained two fixture methods (`wawuFeeMinor`, `feeCollectorBan`, both nothing). The 13 tests that failed on the new rule and pass with those inputs:
1. `takes WAWU's fee from the naira wallet after the provider has the send, and tries again when it cannot`
2. F1: `gives the fee back exactly once when the send fails, from WAWU to the person, and never says it did before it landed`
3. F1: `gives it back when a completed send is reversed afterwards, and not for a send that completed`
4. F1: `holds a give-back that cannot be made for a day for a person, still owed, and sends nothing more`
5. F1: `is never marked given back unless the provider completed it: a failed give-back is tried again under a new reference in a later pass, and a ...`
6. F1: `owes nothing when no fee was taken: a fee of nothing, and a fee leg the provider failed`
7. round 1 findings: `a send the provider has not finished, or a fee still to be given back, holds an account deletion ... and a settled one does not`
8. R1-3: `a failed send whose fee leg never completed owes nothing and is closed quietly; one whose leg is still pending a day later is held for a person`
9. R1-3: `a fee leg that was still pending when the send failed and then completes is found by the sweep and given back once`
10. R1-3: `takeFee skips a send already reversed, as it skips a failed one: no leg is made to be given back at once`
11. R1-4: `a fee that could not be taken is written off after the last try, with a row for finance, and the deletion is let go`
12. R1-4: `a give-back that could not be made is held for a person with a row for finance, finance finds it and ...`
13. R1-4: `finance writes off a fee that was never taken, once; not while the partner shows it was taken; not o...`

### Round 2 (24 Oct 2026, the merge job after verification PASS; backend `bd82fa6`)

Backend `origin/main` `d1e6914` (SWEEP-MONEY-6) merged with `--no-ff`. Two conflicts, resolved so that both protections hold for both fee legs:
- R2-1 (a failed or reversed send never goes back to completed or pending, one `send_contradicted` row) is status-based, so it covers the naira and the foreign fee alike; the row's detail now also names `feeMinor`.
- R2-2 (the give-back claims the fee state first; finance's "paid outside" compares the row as read and keeps its quiet window): the foreign leg now gets the same order as the naira leg. `prepareFeeLeg` resolves what a leg needs (wallet and platform account, or holder and collecting account) BEFORE the claim and returns the function that makes it AFTER the claim. The sweep's deletion changes (the other-provider row, the freeze re-read) are kept and count a foreign fee.
- `abroad-fee-exclusive.contract.spec` pinned the naira fee on a dollar send, the same class as the round 1 edits: its quote source is now `NGN` (one line) and its fixture lists a naira account first (one entry); no assertion text changed. Its 7 tests and the 3 new foreign-leg cases (`world-abroad.contract.spec`: finance closes the fee before the sweep claims, so no leg is made; finance's "paid outside" is refused while the foreign leg is being made, and the leg pays once; a fee the sweep touched after finance read it is not closed) pass together (92 of 92 in the abroad folder). With the claim removed, the 3 foreign cases fail.
- Low 2: `AbroadService.isWorld` is dropped; only a spec used it, and the fee follows the source account now.
- Low 1 (app): while the accounts load or cannot be read, or when the person holds none, the amount screen draws no amount, no keypad and no naira figure (the sending currency is null until the Hub has listed the accounts); 3 tests, red with the naira fallback put back.

Round 1 checks (own DB `b31wa_test`; none imports the Fintava double): backend tsc, eslint (no --fix) on the changed files, `contract:build`, gates (0 fail), baseline, and 17 suites 266 tests (`world-abroad.contract` 16, the abroad suites, `money-contract`, `wallet-gate-coverage`, `money-moving-coverage`, `account-data-map`, `data-export-map`, `data-export-abroad-sections`, `publishing-gate-coverage`, `hub-rate-limits`, `nuvion-abroad`, the plan-settings specs off the Fintava harness) all EXIT 0. App lines are in the hand-back.

## Verifier report

Verifier: a separate Sonnet session (lean T1 check, 24 Oct 2026). It built none of this. Under check: backend `wmt/WALLET-42` `40e33e7` against `origin/main` `4153fd7`; mobile `146dadc3` against `origin/main` `7ba7c210`. Branch checks run 40132381361 on `40e33e7`: all 6 jobs success (3 suite shards, contract, netns, deploy-test-in-sync). Verdict: PASS (nothing medium or worse; two lows below).

| Check | Result | Evidence |
|-------|--------|----------|
| 1 Money | passed | A world person's GBP send: gate hands the seam an empty wallet id, `sendCalls` carry the GBP account, one `-fee` leg in GBP to WAWU's collecting account, `getPlatformAccount`/`walletToWallet` never called (naira calls list empty). Naira person: foreign source takes the EUR/GBP leg and gives it back once with no naira leg; naira source keeps `abroad.wawu_fee_kobo` and the naira legs. NGN or a currency not held: `fx_account_not_open` in plain words at quote time, before the PIN. Races (scratch spec, deleted, same harness as `world-abroad.contract.spec`): 3 sends racing on one quote make 1 send and 1 fee take; 2 give-backs + 2 sweeps + a repeated failure make 1 give-back reference; give-back racing finance `paid_back` makes at most 1 give-back leg (the admin call is refused 409); take-fee racing finance `not_taken` ends with the row `wawuFeeTaken=true`, never written off while the provider took it. Same key twice at HTTP level is the unchanged money layer (advisory lock per user plus single-use quote, both in `AbroadSendService.send`). 4 of 4 |
| 2 NUV-11 spec edits | passed | `git diff` of `abroad.contract.spec.ts`: +9 -4, zero `expect` lines touched. `quoteFor` default is NGN only while `settings.wawuFeeKobo > 0` (all 13 named tests are naira-fee mechanics, source incidental); the three inline quotes now name NGN (each then asserts naira legs); two inert fake methods. The old foreign-source naira-funds check removed from `assertFunds` had no test pinning it. 28 abroad specs + 102 tests green |
| 3 Settings | passed | `abroad.service.ts:670-680`: a fee line with no `FX_FEE_COLLECTOR_<CODE>_BAN` (or a provider with no `feeLeg`) is `currency_not_supported`; a collector variable with no line gives `wawuFeeMinor` 0 and no leg; the quote's `wawuFeeMinor` is the number the send takes. The six collector currencies equal the six the fee line accepts (no unreachable line). Live: no collector refused `currency_not_supported` |
| 4 Data | passed | account-data-map (rows for both columns), data-export-map and `data-export-abroad-sections` green, `wawuFeeMinor` exported as `Number(...)`; deletion blocker and sweep/admin queries use `HAS_FEE` (either column). Migration `20261130090000_abroad_foreign_fee` applied on a fresh DB, `prisma migrate diff` "No difference detected", stamp newer than every `origin/*` branch, rollback ran clean on empty tables and with a send holding a fee raised `WALLET-42 rollback: sends hold a fee ...` (exit 3, columns kept) |
| 5 App | passed | tsc EXIT 0; jest `src/features/abroad`, `src/features/wallet/world`, `route-guard.test.tsx`: 5 suites 320 tests; button needs `status === "open"` and the currency in the Hub's `sources` (frozen EUR in sources and USDT not in sources are both covered by `worldSendAbroad.test.tsx`); review and receipt total through `totalFromAccount`/`wawuFeeText` in the account's currency; balances read from the Hub's `availableMinor`, nothing summed. See finding 1 |
| 6 Live (Nuvion dev) | passed | `world-abroad-check.ts` EXIT 0 against `https://api.nuvion.dev` on a dev entity with a GBP account and no naira account: sources `GBP:358` only, 3 recipients saved, GBP to GHS quote (300 pence to 4026 pesewas, held 179 s), fee leg taken once, a repeat of its reference answered 409 and found again, give-back found. Then the Hub's own `WalletGate` + `AbroadService.quote` on a local DB against Nuvion dev: GBP quote `wawuFeeKobo` 0, `wawuFeeMinor` 25 (the configured pence); NGN and USD refused with the plain messages. Not through HTTP (a stack always runs on the stand-in) |

Other EXIT lines: backend tsc 0; eslint (no `--fix`) on the 16 changed `.ts` files 0; world-abroad + abroad + abroad-settings + admin-roles + nuvion-abroad 5 suites 102 tests 0; money-contract, wallet-gate-coverage, money-moving-coverage, account-data-map, data-export-map, data-export-abroad-sections, publishing-gate-coverage, hub-rate-limits 8 suites 122 tests 0; `test:protected` (after `db:seed`) 2 suites 253 tests 0; `contract:build` 0 and no diff; gates 0 fail (1975 files) and `check_baseline` 0. App: tsc 0, gates 0 fail (1411 files), `check_tasks` 0 (also after the flip to review).

Findings (none blocks):
1. low, `defect`: `src/features/abroad/screens.tsx:127` falls back to `'NGN'` while the Hub's sources are loading or failed, so `src/features/abroad/views.tsx:155` draws the amount with a naira sign ("₦0") for a person who has no naira account until the sources land. Repro: open `/send/abroad/amount` as a world person with `GET /money/abroad/sources` failing: the error card shows and the keypad types "₦..."; no quote is asked (it waits for the sources) and nothing is charged. Fix idea: use `props.initialFrom` as the fallback, or hide the amount until the sources load. To the area sweep.
2. low, test-gap note: `AbroadService.isWorld` (`abroad.service.ts:269`) is used only by a spec; the real world check is the gate's empty wallet id. A test that sets `settings.wawuFeeKobo > 0` and relies on the default source now sends from NGN (`abroad.contract.spec.ts:368`), which hides a new test that wants a foreign default; the helper is the only place to look.

NOT RUN: a reversal or a webhook for a foreign-account send; a real UK bank success or a USD ACH send (no funded dollar person); an HTTP request through a local stack to Nuvion dev (the stack always runs on the stand-in); a phone or a picture (no layout changed). The specs that import the Fintava double are CI's (run 40132381361 green).

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
