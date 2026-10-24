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
| 4 | a quote across currencies did not exist for payouts | a quote is Nuvion's rate and real hold (179 s on dev) when the currencies differ, and a WAWU hold (10 minutes) when they are the same; both amounts, the rate, WAWU's fee; the provider's fee is shown on the receipt (it is named only when Nuvion takes the send) |
| 5 | n/a | the send: `Idempotency-Key` and PIN or fingerprint (same guards as naira Send, a before-PIN guard refuses a switched-off product, a frozen person and a spent or expired quote before the PIN is looked at); a row is written `sending` first, the provider is called holding nothing, a lost answer is found again by its reference and never sent twice; `pending` becomes `completed`, `failed` or `reversed` by the webhook handler (`src/nuvion/handlers/abroad.handler.ts`) and a per-minute sweep; a send nobody can find after 30 minutes waits for a person (`needs_review`) |
| 6 | n/a | controls (owner-asked): `abroad.enabled` (default on), `abroad.wawu_fee_kobo` (default 0, R-10), `abroad.max_per_send` and `abroad.max_per_day` per currency (none until named), `abroad.corridors_off` (Uganda, Mexico, Singapore, Hong Kong while dev refuses them), all admin settings; admin routes `/admin/money/abroad`: `sends` (+ one), `sends/{id}/cancel`, `people/{id}/freeze` and `unfreeze`, superadmin and finance only, one `AbroadAdminAudit` row per write |
| 7 | the Send screens had two tabs | a third tab "Abroad" on W7 and W8, drawn only while `GET /money/abroad/corridors` says `enabled` (R-47); then Abroad (saved recipients), a new recipient (country, way, scheme and exactly the fields), the amount with the quote under it, the review with the PIN or fingerprint, and the receipt (read again until decided) |

Routes added: `GET /money/abroad/corridors`, `GET /money/abroad/banks/{country}`, `GET /money/abroad/sources`, `GET|POST /money/abroad/recipients`, `DELETE /money/abroad/recipients/{id}`, `POST /money/abroad/quotes`, `GET|POST /money/abroad/sends`, `GET /money/abroad/sends/{id}`, `GET /admin/money/abroad/sends`, `GET /admin/money/abroad/sends/{id}`, `POST /admin/money/abroad/sends/{id}/cancel`, `POST /admin/money/abroad/people/{wawuUserId}/freeze` and `unfreeze`. Migration `20261113093000_abroad_sends` (five tables; rollback refuses while a send or an audit row exists; tested: refuses with a row, drops with none, applies again). Four error codes: `corridor_not_supported`, `recipient_details_invalid` (with `fields`), `rate_unavailable`, `send_not_cancellable`.

Defaults (lead), owner may override: (a) the counterparty's email and address are the SENDER's own, as NUV-06 does (FIX-97, FIX-98); the form asks only for the rail's fields. (b) Only the last four characters of a recipient's account stay with WAWU; the rest is held by Nuvion and a fingerprint tells a repeat. (c) WAWU's fee is naira only, taken from the naira wallet after Nuvion takes the send (G-NUV-11-10). (d) A per-day limit is a rolling 24 hours per currency. (e) A quote is shown with the figures the Hub gives and a countdown; at zero the review offers a new quote. (f) A transfer's currency is the source account's (dev fact). (g) The amount screen types the amount in the source currency ("You send") or the recipient's ("They receive").

Checks (backend, own DB `b23abroad_test`; mobile, own worktree): backend tsc EXIT 0; eslint on the changed files EXIT 0; contract:build EXIT 0 (15 new operations, all served); Nuvion area spec 20 of 20 on the stand-in answering as dev did; service spec 17 of 17 on a real database (limits under the lock, a lost answer found by reference, a refused send leaves no row and gives the quote back, cancel only when a complete search finds nothing, fee leg and its retry, freeze, audit rows); `publishing-gate-coverage`, `hub-rate-limits`, `money-contract` and the `plan-settings` specs 119 of 119; the Nuvion webhook and dispatch specs 36 of 36; `test:protected` 253 of 253 on a seeded database; gates 0 fail (EXIT 0). Dev (Nuvion DEV only): `scripts/nuvion/abroad-check.ts` 8 of 8 (EXIT 0); one real transfer NGN to AUD (fee 0, stayed pending). Mobile: tsc EXIT 0; eslint on the changed files EXIT 0; jest: model 6, the flow on the real router 6 (the tab only while on; a new recipient with the Hub's fields; amount, quote, review, PIN, receipt; wrong PIN then right on one key; a rate that cannot be given; an expired quote and a short account), Send 387 and the two route-guard specs 283 all pass. `dev/abroad` is listed on the route guard test's public list, as it asks.

Pictures (390 px, light and dark, from `/dev/abroad?screen=...`, canned data, no board to set them beside): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-11-b/shots/` (`home`, `empty`, `country`, `recipient` (Ghana mobile money), `recipient-us` (ACH fields), `amount`, `amount-refused`, `review`, `receipt`, `receipt-failed`, each `-light.png` and `-dark.png`).

NOT RUN: a transfer that completes, fails or is reversed (dev never settled the one it took); the first real webhook delivery for an abroad send; the naira history line of a completed naira send (NUV-06's recorder, G-NUV-11-7); a phone (no device in this session); the fingerprint path on a device (it uses the shared `PayPinSheet`, tested for the PIN here). Gaps: G-NUV-11-1 to G-NUV-11-10 in BACKEND_GAPS.md. Open low, for the sweep: a recipient cannot be removed from the app (the Hub serves `DELETE /money/abroad/recipients/{id}`; no screen draws it, R-47); the amount typed is shown without thousands separators; the amount screen's keypad sits below the quote and scrolls on a short phone.

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
- [ ] A send completes, fails or is returned on a real transfer: NOT RUN (dev never settles one).
- [ ] On a phone: NOT RUN (no device in this session).

## Verifier report

Verifier 24 Oct 2026 (Sonnet, T2; built none of it). Backend `b937df0` against `d39a868`, mobile `d2067eaa` against `14da2683`. **Verdict: FIX** (two medium, five low). Live: the Hub on Nuvion DEV (`api.nuvion.dev` only) with the app's web export at 390 x 844, real sign-in through the stack's identity service; one real USD to GHS send. Pictures (light and dark): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-11-v/shots/` (01 send tabs, 02 Abroad home, 03 country, 04 new recipient, 05 amount, 05b naira with no rate, 06 quote, 07 review, 08 PIN, 09 receipt), beside the builder's in `nuv-11-b/shots/`.

| Pass | Result | Evidence |
|------|--------|----------|
| Gates | passed | backend gates 0 fail (9 gates, 1865 files), baseline check EXIT 0; app gates 0 fail (10 gates, 1315 files), baseline 0, EXIT 0 |
| Types, lint | passed | backend tsc EXIT 0; eslint (no --fix) on the 25 changed files EXIT 0; app tsc EXIT 0 |
| Specs | passed | backend 7 suites 145 tests EXIT 0 (abroad service, Nuvion abroad area, publishing-gate-coverage, hub-rate-limits, money-contract, plan-settings, nuvion-webhook; none imports the Fintava double); app jest abroad, send and route-guard 8 suites 381 tests EXIT 0 |
| V3 Protected | passed | `scripts/protected-routes/run.sh --fresh` on a seeded database: all 244 required tests passed, EXIT 0 |
| Contract | passed | `contract:build` leaves `contract/openapi.json` unchanged (git diff empty) |
| Rollback | passed | `rollback.sql` refuses with a real send row ("sends abroad are stored and would be lost"), drops all five tables with none (run inside a rolled-back transaction) |
| V9 Live seam | passed | signed in as a seeded person through the app; the Hub on Nuvion DEV read the person's accounts (NGN 2000 kobo, USD 925 cents, GBP 0) |
| V7 Flow | passed, fresh person only | Send shows the Abroad tab while the Hub says enabled; saved recipient; country list (Uganda, Hong Kong, Singapore, Mexico say "We cannot send here yet"); momo and bank forms; amount with source choice; quote; review; PIN sheet; receipt |
| V6 States | partly | live: no rate from naira to cedis ("This can't be quoted", plain), a recipient with no phone (422 `recipient_details_invalid`, `fields: [phone_number]`), a corridor that is off (422), an amount above the corridor (400 with `maximumMinor`), wrong PIN (403, 4 tries left), a used quote (409 `quote_expired`). NOT RUN live: a send Nuvion refuses after the PIN, a failed and a reversed send (dev gives no way to make one) |
| V8 Money | partly | live: one Idempotency-Key twice answered the same send id (`Idempotent-Replayed: true`), the USD account fell once (925 to 675 cents = 100 + the partner's 150). NOT RUN live: WAWU fee above 0 (see F1), a failed or reversed send, a replayed or forged webhook. Reviewed in code: the row is `sending` before the call, a lost answer is found by reference, `apply` is idempotent, the fee leg's reference is `<reference>-fee` (the provider's book store dedupes it) and goes to the operational account |
| Corridors vs Nuvion | passed, with a limit | `dev-matrix.ts` saved a recipient on Nuvion DEV for every corridor, way and scheme the Hub draws, with only the fields the form asks: 34 accepted (GH, KE, TZ momo and bank, UG, ZA, GB, US ach/wire/rtp, CA eft/interac account/interac email, AU, AE, DE, FR, IE, ES, IT, NL, PH). 8 refused on sample data of mine that is wrong (BE, PT, AT, FI, GR, LU: no IBAN sample; CN BIC; MX CLABE length), so those 8 are inconclusive, not defects |
| Route guard | passed | `dev/abroad` follows `dev/components` and `preview/*`: in the release export a signed-out visit goes to `/welcome` (checked live); see F5 |
| Admin | partly | routes are `AdminAuthGuard` + `AdminRolesGuard` with superadmin and finance only; a person's token and no token get 401 live; the audit row per write is covered by the service spec. No spec signs in as support or reviewer on these routes (F4) |

Findings:

- **F1 medium, defect (money).** WAWU's fee is never given back when a send fails or is reversed after the fee was taken. `takeFee` (`src/money/abroad/abroad-send.service.ts:330-360`) runs while the send is `pending`, and `apply` (`:262-300`) moves it to `failed` or `reversed` with no give-back; no `-fee-back` transfer or ledger row exists anywhere under `src/money/abroad/`. The receipt promises the opposite (`SEND_FAILED_REASON`, `:43`: "Any money taken comes back to your account"), and naira Send gives its fee back on a failed send (`wallet-transfer.service.ts` `recordFeeBack`, FIX-66, FIX-98). Latent while `abroad.wawu_fee_kobo` is 0 (the default); live as soon as an admin names a fee. Repro: set the fee to 25 kobo, send, let the transfer end `failed` (webhook or sweep): the person's naira wallet stays 25 kobo short. Fix: on `failed` or `reversed` with `wawuFeeTaken`, a book transfer back under `<reference>-fee-back`, once (flag or reference), and a spec for it.
- **F2 medium, defect (money shown).** Nuvion's own fee is real and is not shown before the PIN. Live on dev: a USD 1.00 send to Ghana took USD 2.50 (USD 1.00 and a partner fee of USD 1.50, `AbroadSend.providerFeeMinor` = 150; the receipt shows "Partner fee $1.50"), yet the review says "The payment partner's fee is shown on the receipt once it takes the send" (`src/features/abroad/views.tsx:329`) and the quote carries `providerFeeMinor: null`. Nuvion's quote has no fee field (checked on dev), so the Hub cannot read it first. The funds check (`abroad.service.ts:698-731`, `assertFunds`) leaves the fee out, so a person holding exactly USD 1.00 passes the quote and is refused only after the PIN. This also disproves G-NUV-11-4's "fee 0 on the one dev transfer" for USD to GHS. R-10 says the quote shows the total. Needs a lead ruling: a configured partner-fee estimate per currency (R-10: from config) shown on the review and counted in the funds check, or ask Nuvion for its fee table. Dev also settled the send ("Delivered") about 15 minutes later, so G-NUV-11-6's "dev never completes" is out of date (failed and reversed are still unseen).
- **F3 low.** Admin cancel has no minimum age for a `sending` row (`abroad-admin.service.ts:221-223`). A send seconds old, whose provider call is still in flight, can be cancelled; if Nuvion then takes it, `apply` (`abroad-send.service.ts:262`) moves `cancelled` back to `pending` and the audit row still says cancelled. Fix: refuse cancel until `LOOK_AFTER_MS` has passed, and make `cancelled` not reopen.
- **F4 low (test gap).** No spec signs in as support or reviewer on `/admin/money/abroad/*` (`abroad.contract.spec.ts` has no role case). Test that would kill a role-list mutant: each of the five routes answers 403 for support and reviewer and writes no audit row.
- **F5 low.** `src/app/dev/abroad.tsx` is a picture gallery of canned names and amounts for a screen no board draws. It follows the precedent (`dev/components`, `preview/*`, `LeaveDevRoute`) and a release build leaves it, but its Gallery module still ships in the release bundle. Remove it once the designer's boards for Send abroad exist (G-NUV-11-1), or keep it under the preview rule.
- **F6 low.** `WALLET_FEE_NOTE` (`src/features/abroad/model.ts:21`) is unused and names "Nuvion"; delete it so it cannot reach a screen.
- **F7 low.** A quote taken before an admin adds a country to `abroad.corridors_off` still sends: `send()` checks the switch, the freeze, the limits and the quote, not the country list (`abroad-send.service.ts:117-175`).
- **F8 low, record.** The app's `check_tasks` failed on the builder's head: `docs/PROGRESS.md is out of date` (EXIT 1); regenerated here with `--write`.

Not run: a failed or reversed send, a replayed or forged abroad webhook, WAWU's fee above 0 against Nuvion (the test person's naira account and WAWU's operational account are on one dev entity; the fee leg is covered by the service spec only), the fingerprint path, a phone.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-11.md](history/NUV-11.md).
