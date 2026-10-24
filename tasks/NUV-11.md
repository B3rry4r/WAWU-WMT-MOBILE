---
id: NUV-11
title: Send abroad: a person pays a foreign bank account or a mobile money wallet from any of their accounts, with an FX quote, PIN and Idempotency-Key
owner: YOU
area: MONEY
order: -174
priority: launch
repo: wawu-backend
type: mobile-screen
status: verifying
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

### Round 1 (24 Oct 2026, Sonnet builder, T2; fixes the verifier's FIX)

Backend `wmt/NUV-11` head `ddad361` (B18's `wmt/WALLET-21-HUB` `51a8aa8` merged, no rebase); mobile `wmt/NUV-11` app code `13cd61f2` (the verifier's `69952a3c` merged), records on top. Migration `20261123090000_abroad_fee_back_and_estimate` (additive, rollback refuses while a fee is given back, held, estimated or flagged; tested in a rolled-back transaction).

| Finding | Fix | Proof |
|---|---|---|
| F1 medium | WAWU's fee is given back once when a send is `failed` or `reversed` after it was taken: `<reference>-fee-back` from WAWU's account to the wallet, the amount the fee leg's completed record moved; done only when the provider's record says completed; a reference the provider failed is replaced (`-2`, `-3`) in a later pass; three failed references or a day hold it for a person (`wawuFeeBackOwed` in the admin list); the sweep retries | spec red first (4 failed), then green: gives back once and never says so before it landed; reversed after completed; failed give-back retried under a new reference, a pending one waits for its record; nothing owed when no fee was taken; hold after a day |
| F2 medium | the partner's fee is a configured figure per destination currency and rail (`ABROAD_PROVIDER_FEE_<CURRENCY>_<BANK or MOBILE_MONEY>`, `_FROM_<SOURCE>`), shown as its own row on the amount screen and the review with the total before the PIN, counted by the funds check (amount + partner fee + WAWU fee), kept on the quote and the send; the receipt shows what Nuvion really charged; a real fee that differs sets `feeDiffers` on the send (admin list) | spec: quote carries the figure, a send with exactly the amount is refused at the quote, `feeDiffers` true and false; settings spec (2); app: rows, total and the no-figure case (3 tests) |
| F3 low | admin cancel refuses a send younger than a minute and a send the provider holds, under a row lock; `apply` never reopens a cancelled send | spec: too soon refused, cancelled stays cancelled when the provider takes it after all, one audit row |
| F4 low | support and reviewer get 403 on the five admin routes and write no audit row | `abroad-admin-roles.contract.spec` 25 of 25 |
| F5 low | `dev/abroad` requires the gallery only under `if (__DEV__)` | a release web export: the gallery's canned bank and names are in the old bundle and absent from the new one; jest with `__DEV__` false never loads the module |
| F6 low | `WALLET_FEE_NOTE` removed | tsc, grep |
| F7 low | `send()` re-checks `abroad.corridors_off` (and the pre-PIN guard does) | spec: a quote taken before the country was switched off is refused |
| F8 low | `docs/PROGRESS.md` regenerated with `check_tasks --write` | check_tasks EXIT 0 |
| lead addition | every new person column classified in the purge map and the export; `FeesSetGuard` on the quote and the send (the quote lists no 402 in its codes, as a quote that lists `insufficient_funds` counts as money-moving; its text keeps it); inventory rows for the ten `/money/abroad` routes; an unfinished send, or a fee still to give back, holds an account deletion under `payment_in_progress` | `account-data-map`, `data-export-map`, `wallet-gate-coverage`, `money-moving-coverage` 62 of 62; deletion hold spec |

Default (lead), owner may override (round 1): (f) the partner's fee is a figure from config, not read from Nuvion (its quote has no fee): plain `ABROAD_PROVIDER_FEE_<CURRENCY>_<RAIL>` is in USD cents (dev: Ghana mobile money 150), `_FROM_<SOURCE>` names another sending account in that account's smallest unit (dev: naira to an Australian bank 0); a corridor with no figure is not estimated and the review says the receipt names the fee; the fee's currency is taken to be the sending account's. (g) WAWU's fee goes back when the send fails or is reversed, in full, the amount its own transfer moved. (h) A give-back that the provider fails is replaced by a new reference in a later pass; after three references or a day it waits for a person. (i) An admin cancel needs a minute's age. (j) A send not yet decided, or with a fee still to give back, holds deleting the account; the purge deletes sends, quotes, recipients and a freeze as the person's own and keeps the admin audit.

Round 1 checks (own DB `b23abroad_test`, none of them imports the Fintava double): backend tsc EXIT 0; eslint (no --fix) on the changed files EXIT 0; abroad specs 3 suites 54 of 54 EXIT 0; `money-contract`, `nuvion-abroad`, `publishing-gate-coverage`, `hub-rate-limits`, four `plan-settings` specs, the four coverage specs and seven account specs (two of them against a mock sign-in service on its own port): 22 suites 272 tests, all green (EXIT 0 after the two sign-in suites were rerun with the mock up); `contract:build` EXIT 0 (685 operations, none removed); gates EXIT 0 (0 fail, 135 warn, 88 accepted) and baseline EXIT 0. App: tsc EXIT 0; eslint EXIT 0; jest abroad, send, route-guard and auth-guard 10 suites 405 tests EXIT 0 (`--maxWorkers=2`); gates EXIT 0 (0 fail, 18 warn, 0 accepted), baseline EXIT 0, gate unit tests EXIT 0; check_tasks EXIT 0 after `--write`.

Round 1 pictures (390 px, light and dark): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-11-m/shots/` (`review` with a partner fee and the total, `review-no-fee` with no figure named, `amount`, `receipt`).

Round 1 NOT RUN: a failed or reversed real transfer (so the give-back is proved by spec on a fake provider, not against Nuvion); a real WAWU fee above 0 against Nuvion; a figure for any corridor beyond the two measured; the specs that import the Fintava double (the account deletion rounds 5 to 9, `zz-verify-attacks`, and the other suites on `round5-harness`), the two plan-settings suites on the Fintava cash-out harness and the protected-route suite (not rerun: the only change a protected route can see is the account deletion check counting an unfinished send abroad, which a web account does not have). `plan-settings-readers` and `plan-settings-round2` failed in a first batch on a missing signing key for the mock sign-in service; they are on the Fintava harness and were not run again.

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

_Filled in by the verifier (docs/roles/VERIFIER.md). The round 0 report (FIX, F1 to F8) is in [history/NUV-11.md](history/NUV-11.md); round 1 is checked against it. One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-11.md](history/NUV-11.md).
