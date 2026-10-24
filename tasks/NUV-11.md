---
id: NUV-11
title: Send abroad: a person pays a foreign bank account or a mobile money wallet from any of their accounts, with an FX quote, PIN and Idempotency-Key
owner: YOU
area: MONEY
order: -174
priority: launch
repo: wawu-backend
type: mobile-screen
status: building
depends_on: []
decisions: [R-84, R-83, R-39, R-10, R-20, R-29, R-47]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-11 · Send abroad

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B23): backend `wmt/NUV-11` (head `b937df0`) and mobile `wmt/NUV-11`, both started from B18's `wmt/WALLET-21-HUB` (backend `e44ea4ca`, merged again at `0008490`; mobile `7e65293b`, merged again at `14da2683`). No board draws this (R-84 item 4): the screens are built from naira Send's parts (W7 to W12) and filed (G-NUV-11-1, R-29). Status verifying. Nothing here touches Fintava; the Hub reaches Nuvion only through `WALLET_PROVIDER` (the `abroad` side, `src/wallet-provider/abroad-provider.ts`); a provider without one answers `409 currency_not_supported`.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | a person could pay a Nigerian bank or a WAWU person only | ten routes under `/money/abroad`: `corridors` (the countries, ways and the exact fields Nuvion asks for each), `banks/{country}`, `sources` (the accounts to send from, with the provider's balance read now), `recipients` (list, save, remove), `quotes`, `sends` (send, list, one) |
| 2 | no foreign payout in the provider seam | `AbroadProvider` on the seam; Nuvion's area `src/nuvion/areas/abroad.ts` (bank directory, accounts, counterparty and payment detail, FX quote, transfer, read-back, find by reference); Fintava has none |
| 3 | the form could not know a country's fields | the fields per country and way come from `abroad-corridors.ts`, built from Nuvion's "Send a payout" table and the dev answers below (docs and dev disagree in places: dev wins); the app draws only what the Hub sends |
| 4 | a quote across currencies did not exist for payouts | a quote is Nuvion's rate and real hold (179 s on dev) when the currencies differ, and a WAWU hold (10 minutes) when they are the same; both amounts, the rate, WAWU's fee, and (round 1) the partner's fee from config as its own row; the receipt shows what Nuvion really charged |
| 5 | n/a | the send: `Idempotency-Key` and PIN or fingerprint (same guards as naira Send, a before-PIN guard refuses a switched-off product, a frozen person and a spent or expired quote before the PIN is looked at); a row is written `sending` first, the provider is called holding nothing, a lost answer is found again by its reference and never sent twice; `pending` becomes `completed`, `failed` or `reversed` by the webhook handler (`src/nuvion/handlers/abroad.handler.ts`) and a per-minute sweep; a send nobody can find after 30 minutes waits for a person (`needs_review`) |
| 6 | n/a | controls (owner-asked): `abroad.enabled` (default on), `abroad.wawu_fee_kobo` (default 0, R-10), `abroad.max_per_send` and `abroad.max_per_day` per currency (none until named), `abroad.corridors_off` (Uganda, Mexico, Singapore, Hong Kong while dev refuses them), all admin settings; admin routes `/admin/money/abroad`: `sends` (+ one), `sends/{id}/cancel`, `people/{id}/freeze` and `unfreeze`, superadmin and finance only, one `AbroadAdminAudit` row per write |
| 7 | the Send screens had two tabs | a third tab "Abroad" on W7 and W8, drawn only while `GET /money/abroad/corridors` says `enabled` (R-47); then Abroad (saved recipients), a new recipient (country, way, scheme and exactly the fields), the amount with the quote under it, the review with the PIN or fingerprint, and the receipt (read again until decided) |

Routes added: `GET /money/abroad/corridors`, `GET /money/abroad/banks/{country}`, `GET /money/abroad/sources`, `GET|POST /money/abroad/recipients`, `DELETE /money/abroad/recipients/{id}`, `POST /money/abroad/quotes`, `GET|POST /money/abroad/sends`, `GET /money/abroad/sends/{id}`, `GET /admin/money/abroad/sends`, `GET /admin/money/abroad/sends/{id}`, `POST /admin/money/abroad/sends/{id}/cancel`, `POST /admin/money/abroad/people/{wawuUserId}/freeze` and `unfreeze`. Migration `20261113093000_abroad_sends` (five tables; rollback refuses while a send or an audit row exists; tested: refuses with a row, drops with none, applies again). Four error codes: `corridor_not_supported`, `recipient_details_invalid` (with `fields`), `rate_unavailable`, `send_not_cancellable`.

Defaults (lead), owner may override: (a) the counterparty's email and address are the SENDER's own, as NUV-06 does (FIX-97, FIX-98); the form asks only for the rail's fields. (b) Only the last four characters of a recipient's account stay with WAWU; the rest is held by Nuvion and a fingerprint tells a repeat. (c) WAWU's fee is naira only, taken from the naira wallet after Nuvion takes the send (G-NUV-11-10). (d) A per-day limit is a rolling 24 hours per currency. (e) A quote is shown with the figures the Hub gives and a countdown; at zero the review offers a new quote. (f) A transfer's currency is the source account's (dev fact). (g) The amount screen types the amount in the source currency ("You send") or the recipient's ("They receive").

Round 1 (the builder's table F1 to F8 and the lead's addition, its defaults (f) to (j), checks, pictures and NOT RUN) is in [history/NUV-11.md](history/NUV-11.md).

### Round 2 (24 Oct 2026, Sonnet builder, T2; fixes the round 1 verifier's FIX)

Backend `wmt/NUV-11` head `f4a9e5f` (round 1 head `ddad361` plus this round; origin/main `53819c2`, which carries batch FX-A, merged with no rebase); mobile `wmt/NUV-11` app code `73eab569` (the verifier's `4987a3e6` merged), records on top. Migration `20261125090000_abroad_fee_settled` (two nullable columns; its rollback refuses while any is set; run in a rolled-back transaction: clean on an empty table, refuses with a row that has them).

| Finding | Fix | Proof |
|---|---|---|
| R1-1 medium | `money-moving-coverage.spec` names `POST money/abroad/quotes` in `BALANCE_READING_QUOTES`, an allowance for `insufficient_funds` with the lead's reason (a gate edit the lead ruled); the assertion logic is otherwise unchanged, and a new test holds the entry to what it says (mounted, no PIN guard, runs `FeesSetGuard`, documents `insufficient_funds` and `fees_not_set`, moves no money, named as a non-money write); the quote lists `insufficient_funds` (402) again | `contract/openapi.json` carries the 402 on the quote again (`contract:build` EXIT 0); the coverage spec is green |
| R1-2 low | `apply` writes with a compare-and-set on the status it read and, when the row moved, looks again from the row as it now is (three looks at most); the cancelled branch writes only on a `cancelled` row | spec with the race: a cancel that commits between `apply`'s read and its write; red first (the row came back `pending`), green now, one audit row |
| R1-3 low | the sweep reads (never makes) the fee leg of a send that failed or was reversed while its fee is not marked taken: a leg that completed is marked and given back once; one that never completed closes the question quietly (`nothing_taken`, no row); one still on its way a day on is held for a person (`fee_held` row). `takeFee` skips a send already reversed | three specs, red first: reversed send makes no leg; a leg pending when the send failed and then completes is given back exactly once over three more sweeps; a leg that never completed owes nothing and a pending one is held after a day |
| R1-4 low | a fee that could not be taken is written off after the last try (`not_taken`, `fee_not_taken` row by `system`); a give-back or fee the sweep gives up on is held (`fee_held` row) and no longer holds an account deletion (the audit row, which a deletion keeps, is the record); finance finds open ones with `GET /admin/money/abroad/sends?feeOpen=true` (new view fields `feeBackHeld`, `feeSettledAt`, `feeSettledHow`; `wawuFeeOwed` is now only a fee still to be taken on a send that may take it) and closes one with `POST /admin/money/abroad/sends/{id}/settle-fee` (`not_taken` or `paid_back`, a reason, superadmin and finance, one audit row, a repeat changes nothing, `409` when the partner's record shows the fee was taken, a give-back is still on its way, the send is not decided or nothing is owed) | three specs: written off after the last try with the deletion let go; held give-back (row for finance, found by the filter, not held for ever, settled once as paid back outside); written off by finance with the refusals; roles spec 30 of 30 (support and reviewer 403 on six routes) |
| R1-5 note | merged origin/main (`53819c2`, batch FX-A) with no rebase: FX-A's `Fx*` rows kept in the account data map and this branch's `Abroad*` rows only (no duplicates), this branch's `Fx*` export exclusions dropped (FX-A exports them now), Capital stays section 28 of CONVENTIONS and send abroad is now section 29, the enums, the error-status map and the settings defaults are the union, the contract is rebuilt; the Capital dispatch fix is in (naira inflows and sends no longer wait on a non-Capital transfer) | `account-data-map` and `data-export-map` green; the Nuvion webhook, dispatch burst and dispatch drain specs green on the merged tree; `contract:build` unchanged by the final merge |

Default (lead), owner may override (round 2): (k) a fee the sweep cannot settle (a give-back that failed under three references or for a day, a fee leg still on its way a day after the send ended) is held for a person and stops holding an account deletion: a person is never kept from deleting an account for ever, and finance keeps the row of what is owed in the admin audit. (l) A fee WAWU could not take from a send that went through is written off after the sweep's last try (five). (m) A send that failed and whose fee leg never completed closes its fee question with nothing said. (n) The admin's settle route moves no money: `paid_back` records that the person was paid back (the provider's record when there is one, else outside the system, which the reason says).

Round 2 checks (own DB `b23abroad_test`, none of them imports the Fintava double): backend tsc EXIT 0; eslint (no --fix) on the changed files EXIT 0; `account-data-map`, `data-export-map`, `money-contract`, `wallet-gate-coverage`, `money-moving-coverage`, the three abroad suites, `nuvion-accounts` and `nuvion-payouts` contract specs, `nuvion-abroad`, the Nuvion webhook and two dispatch specs, `publishing-gate-coverage`, `hub-rate-limits` and seven account-deletion specs (two of them against a mock sign-in service on its own port): 23 suites 331 tests EXIT 0; `contract:build` EXIT 0 (701 operations, 16 more than main: the 15 abroad routes and `settle-fee`); gates EXIT 0 (0 fail, 135 warn, 88 accepted) and baseline EXIT 0; the migration's rollback in a rolled-back transaction (clean on an empty table, refuses with a set row). App: tsc EXIT 0; eslint EXIT 0; jest abroad, send, route-guard and auth-guard 10 suites 405 tests EXIT 0 (`--maxWorkers=2`); gates EXIT 0 (0 fail, 18 warn, 0 accepted), baseline EXIT 0; check_tasks EXIT 0 after `--write`. The Fintava double: none of these imports it (`nuvion-accounts` and `nuvion-payouts` use the Nuvion and WAWU ID stand-ins; the account suites that import `round5-harness` or the double were not run). The backend Branch checks of the head `f4a9e5f` (run 40116945016): all six jobs green (contract, deploy-test-in-sync, netns, suite shards 1, 2 and 3), beside Gates and Protected routes (V3) green. The merge head `fc0d4ee` had shard 3 red on `wallet-gate.contract.spec` (its inventory of gated routes lacked the ten `/money/abroad` routes; it imports the Fintava double, so it could not be run here and was read in CI); the rows are added in `f4a9e5f`. The round 1 head's Branch checks (run 40109823311) had shards 2 and 3 red; their failing specs could not be read from here (only the database container's log came back); the lead named the dispatch bug of WALLET-21 as the cause, which batch FX-A fixes, and shard 2 is green on both merged heads. Mobile CI is not readable from this session.

Round 2 NOT RUN: a real failed or reversed transfer, a real fee leg left pending by the provider, the fingerprint path, a phone; the specs that import the Fintava double and the two `plan-settings` suites on the Fintava cash-out harness (as in round 1). Mobile CI is not readable from this session (the proxy refuses the repository's numeric path); the backend Branch checks run is read below.

Checks (backend, own DB `b23abroad_test`; mobile, own worktree): backend tsc EXIT 0; eslint on the changed files EXIT 0; contract:build EXIT 0 (15 new operations, all served); Nuvion area spec 20 of 20 on the stand-in answering as dev did; service spec 17 of 17 on a real database (limits under the lock, a lost answer found by reference, a refused send leaves no row and gives the quote back, cancel only when a complete search finds nothing, fee leg and its retry, freeze, audit rows); `publishing-gate-coverage`, `hub-rate-limits`, `money-contract` and the `plan-settings` specs 119 of 119; the Nuvion webhook and dispatch specs 36 of 36; `test:protected` 253 of 253 on a seeded database; gates 0 fail (EXIT 0). Dev (Nuvion DEV only): `scripts/nuvion/abroad-check.ts` 8 of 8 (EXIT 0); one real transfer NGN to AUD (fee 0, stayed pending). Mobile: tsc EXIT 0; eslint on the changed files EXIT 0; jest: model 6, the flow on the real router 6 (the tab only while on; a new recipient with the Hub's fields; amount, quote, review, PIN, receipt; wrong PIN then right on one key; a rate that cannot be given; an expired quote and a short account), Send 387 and the two route-guard specs 283 all pass. `dev/abroad` is listed on the route guard test's public list, as it asks.

Pictures (390 px, light and dark, from `/dev/abroad?screen=...`, canned data, no board to set them beside): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-11-b/shots/` (`home`, `empty`, `country`, `recipient` (Ghana mobile money), `recipient-us` (ACH fields), `amount`, `amount-refused`, `review`, `receipt`, `receipt-failed`, each `-light.png` and `-dark.png`).

NOT RUN: a transfer that fails or is reversed (dev settled the verifier's send about 15 minutes after it was made, so a completed one is seen; failed and reversed never); the first real webhook delivery for an abroad send; the naira history line of a completed naira send (NUV-06's recorder, G-NUV-11-7); a phone (no device in this session); the fingerprint path on a device (it uses the shared `PayPinSheet`, tested for the PIN here). Gaps: G-NUV-11-1 to G-NUV-11-10 in BACKEND_GAPS.md. Open low, for the sweep: a recipient cannot be removed from the app (the Hub serves `DELETE /money/abroad/recipients/{id}`; no screen draws it, R-47); the amount typed is shown without thousands separators; the amount screen's keypad sits below the quote and scrolls on a short phone.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `DECISIONS.md`: R-84 (item 4), R-83, R-10, R-39, R-47, R-29
- `docs/nuvion/DEV-RESULTS.md` (the NUV-11 section: every Nuvion fact here comes from it and from Nuvion's docs)
- Backend `CLAUDE.md` "Money", `docs/contract/CONVENTIONS.md` sections 1a and 27, `src/wallet-provider/abroad-provider.ts`, `src/nuvion/areas/abroad.ts`, `src/money/abroad/`
- App: `src/features/abroad/`, `src/features/send/`

## Goal

A person pays a foreign bank account or a mobile money wallet from any of their accounts: the country and way, exactly the fields Nuvion asks for them, an FX quote when the currencies differ, the PIN, an Idempotency-Key, and the real fee on the receipt.

## Scope

Backend `src/money/abroad/`, `src/nuvion/areas/abroad.ts`, `src/nuvion/handlers/abroad.handler.ts`, `src/wallet-provider/abroad-provider.ts`, one migration and the shared registrations listed in SHARED-CHANGES.md (NUV-11 #1 to #4); app `src/features/abroad/`, `src/app/send/abroad/`, `src/app/dev/abroad.tsx` and the Abroad tab on W7 and W8.

## Capability checks

- [x] A user can open Abroad from Send only while the Hub says it is on.
- [x] A user can add a recipient by choosing a country and a way and filling exactly the fields the Hub draws for it; a country Nuvion does not pay is shown with its words and cannot be chosen.
- [x] A user can type an amount, choose the account to send from, and see what the recipient gets from Nuvion's quote before the PIN.
- [x] A user can approve with the PIN (or the phone's fingerprint) and see the receipt, read again until Nuvion decides.
- [x] A wrong PIN and a retry send once, on one key; an expired quote or a short account sends nothing and says so.
- [x] An admin (superadmin or finance) can list sends, freeze a person and cancel a send Nuvion never received, each with an audit row.
- [x] A send completes on a real transfer (the verifier's USD to GHS send read "Delivered" about 15 minutes later).
- [ ] A send fails or is returned on a real transfer: NOT RUN (dev never gave one).
- [x] WAWU's fee is given back once when a send fails or is reversed after it was taken (spec; round 1).
- [x] The review shows the partner's fee as its own row and the total that leaves the account, before the PIN (round 1).
- [ ] On a phone: NOT RUN (no device in this session).

## Verifier report

_Rounds 0 and 1 (FIX, F1 to F8, then R1-1 to R1-5) are in [history/NUV-11.md](history/NUV-11.md); round 2 is checked against them. Filled in by the verifier (docs/roles/VERIFIER.md): one row per pass, then findings._

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-11.md](history/NUV-11.md).
