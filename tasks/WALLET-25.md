---
id: WALLET-25
title: Add money by card
owner: YOU
area: WALLET
order: 311
priority: after-launch
repo: wawu-backend
type: third-party
status: building
depends_on: [MONEY-06]
decisions: [R-10, R-42, R-47, R-79, R-83, R-84]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-25 · Add money by card

## Current state

As of 24 Oct 2026, built by a Sonnet builder (bundle B21, T2): backend `wmt/WALLET-25` (on `origin/main` `38be72e`) and mobile `wmt/WALLET-25` (on `origin/main` `7e65293b`, merged into the 16 Oct stop-note branch). R-84 (owner, 24 Oct) turned this task and WALLET-26 on ("everything Nuvion serves for people is built now"), so the owner means it built now. The `priority` field is left `after-launch` and the order unchanged (check_tasks refuses a launch task ordered after CHECK-3; moving the order is the lead's). Status verifying. **Default (lead), owner may override:** one backend branch and one mobile branch carry both tasks (bundle rule); the credit design below; the controls' names.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no way to add money but the account number (W15) | `GET /money/add-money/options`, `GET /quote`, `POST /money/add-money` (Idempotency-Key, PIN or fingerprint), `GET /money/add-money`, `GET /{id}`, `POST /{id}/cancel`, and a public `GET /money/add-money/return` (a page with a button into the app); Nuvion reached only through the seam (`src/wallet-provider/add-money.ts`, area `src/nuvion/areas/add-money.ts`, handler `src/nuvion/handlers/add-money.handler.ts`); Fintava's adapter has none of it (`409 add_money_unavailable`) |
| 2 | an inflow that was not a bank transfer was stopped for review | the wallet is credited by the settled inflow, once: NUV-04's recorder offers a non-bank-transfer inflow to add money's claim first (`AddMoneyService.creditInflow`), keyed on Nuvion's transfer and our reference; a pending card inflow waits; a webhook twice, a replay and the NUV-08 sweep make one ledger row (spec) |
| 3 | no card was ever read by the app | the phone encrypts the card with Nuvion's public key (RSA-OAEP, SHA-256, in JavaScript, proved by the private key in Node) and the Hub passes the scrambled text on and keeps none (spec checks the row) |
| 4 | W15 draws the account only | W15 draws "Other ways to add money" from the Hub's options (a way that cannot be used says why in the Hub's words and opens nothing; Apple Pay on iOS only), a way screen (amount, card, billing, the Hub's quote, PIN sheet or fingerprint) and a status screen (`wawu://add-money/status?id=`: waiting, paid, in the wallet, ended) |
| 5 | no controls | plan settings `money.add_money_card_on` and `money.add_money_ussd_on` (1 on, default); fees and limits from config (`ADD_MONEY_FEE_CARD`, `ADD_MONEY_WAWU_FEE` default 0, `ADD_MONEY_MIN_KOBO`, `ADD_MONEY_MAX_KOBO`, `ADD_MONEY_DAILY_MAX_KOBO`); `GET/POST /admin/money/add-money` list, read, freeze, unfreeze, cancel for superadmin and finance, each with an audit row |

**Dev answers (Nuvion DEV only; rows in `docs/nuvion/DEV-RESULTS.md`).** Dev refuses naira on every rail: card and Apple Pay `error_acquiring_currency_not_supported`, funding sessions 503. A naira card cannot be completed on dev today. The same calls were measured in USD (card: completed at once, fee 75 on 1,000, the inflow `pending` and the balance unmoved), GBP (a hosted bank page) and KES (a prompt, then failed). The Hub's own area was run against dev: its refusals map to a plain "This is not switched on for naira yet" and the way shows as not available. Gap rows: G-WALLET-25-1 to G-WALLET-25-5, G-WALLET-26-1, G-WALLET-26-2.

**NOT RUN:** a naira card end to end against dev (refused); a card settling to a naira balance; Apple Pay on a phone; the PIN sheet and fingerprint hand-off of the way screen under jest (a test that opened the sheet did not pass and was left out; the wiring copies Send's `ReviewScreen`); the screens on a phone; Nuvion's own `payment_intent.*` and `funding_sessions.updated` deliveries (the dev webhook endpoint is not ours). One spec file that imports a Fintava double (`plan-settings-readers.contract.spec.ts`) was run by mistake once (4 failed with 401 in its own harness) and not looked at; it is Fintava code and was left alone.

- **Next:** a verifier again on round 1 (the Builder rows in the table after the Verifier report). Earlier note: a verifier (not the builder). The owner sets `NUVION_ENCRYPTION_PUBLIC_KEY`, `ADD_MONEY_RETURN_URL` and the fee settings; Nuvion switches on naira; then the live card check.
- **History:** none yet. Reports go to tasks/history/WALLET-25.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W16: top up with a card, 3-D Secure, saved cards.

## Scope

Card funding through Fintava (or the provider they name) with 3-D Secure and saved card tokens; the fee per R-10.

## Capability checks

- [x] A card payment is encrypted on the phone and the Hub keeps none of it (`encryptCard.test.ts`, `add-money.contract.spec.ts`).
- [x] A card that goes through is credited to the wallet exactly once, by the settled inflow, never by the charge (`add-money.contract.spec.ts`: a webhook twice and a replay).
- [x] A declined card shows why in plain words, charges nothing and leaves no open payment (spec).
- [x] Where Nuvion has not switched naira on, the way says so plainly and is tried again later (spec; the real dev answer is in DEV-RESULTS).
- [ ] A sandbox naira card top-up credits the wallet once: NOT RUN, dev refuses naira (G-WALLET-25-1).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

Verifier (Sonnet, T2, 24 Oct 2026) on backend `e730428` and mobile `903851c8`; covers WALLET-25 and WALLET-26. **Verdict FIX.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | add-money spec 13/13 (EXIT 0); backend tsc, eslint (no --fix, 21 changed files) EXIT 0; app tsc EXIT 0; app jest 7 suites / 71 tests passed (the process hung on open handles and was killed by PID, so its log ends EXIT 143); inventories (publishing-gate, hub-rate-limits, wallet-gate-coverage) 49/49 EXIT 0 |
| V2 | passed | gates: Hub 0 fail / 137 warn / 88 accepted (1844 files), app 0 fail / 0 accepted (1313 files), check_tasks EXIT 0 |
| V3 | passed | protected suite after db:seed: 253/253 EXIT 0; `npm run contract:build` leaves `contract/` unchanged (git status clean) |
| V6 | NOT RUN | pictures at 390 px: the mobile web export was still in Metro after 10 minutes on the shared machine and disk was 1.6 GB free. Only W15's board (light, dark) was rendered: `wallet-25-v/pics/board-W15-*.png` |
| V8 | failed | F1 (retry breaks the key) and F2 (freeze then unfreeze never credits); card data, double webhook, fees and admin roles passed (below) |
| V9 | partly | live Hub on the stand-in stack, wallet seeded: options, quote, plain-field refusal, replay and key reuse; DEV (api.nuvion.dev only) probe `wallet-25-v/live/dev-probe.out` |

**Passed on live runs.** Card data: a plain `card.number`, `cvv` or `expiry` is `400 card.property number should not exist` (global whitelist); a request with a recognisable ciphertext left it in no DB row (whole `pg_dump` searched, idempotency table included) and no Hub or stack log line. The Hub forwards only `card.encrypted` (`add-money.service.ts:471`). Money: the credit is written only in `creditInflow` (settled inflow, ledger keyed on transfer and reference; spec: webhook twice, replay and sweep = one row); pending waits; failed or reversed ends it; a wrong amount or currency credits nothing; WAWU's fee is from `ADD_MONEY_WAWU_FEE` (quote 100000 + 7500 + 2500 = 110000) and taken once by reference `<ref>-wawufee`. Limits refuse before the PIN (`below_minimum`, `limit_reached`, `quote_changed`); the card/USSD switch is a plan setting. Admin list, read, freeze, unfreeze and cancel carry `@AdminRoles(superadmin, finance)` on all five handlers (support is tested in the spec, reviewer is the same guard, not run on its own) and each act writes an `AddMoneyAudit` row in the same transaction. The return page escapes the id to a UUID and holds no payment data. Nothing claims USSD for Nigeria: options say "USSD is not available for Nigerian phone numbers yet." and the quote is 409. Additive: two new tables; `rollback.sql` refuses with an open or settled attempt (run).

**Live against Nuvion DEV (Hub's own area, 24 Oct).** Naira card: intent made, confirm refused (my ciphertext was under my own key, so Nuvion answered `error_validation_invalid_format` on `data` before the currency check; with a real key the builder saw `error_acquiring_currency_not_supported`). Naira Apple Pay: `not_supported`, plain. Naira bank checkout and a KE channel on a naira account: 503, mapped to `unavailable`, plain. USD card: intent 201 and the confirm body reached Nuvion (refused only at `data`, same reason). GBP bank checkout: `awaiting_user` with a checkout URL and expiry. The JavaScript ciphertext being accepted by Nuvion's real key: NOT RUN (the public key file is not named in my brief); proven only with a private key in Node (`encryptCard.test.ts`).

**Findings (verdict FIX).**
- **F1 high, defect.** A retry of the card payment can never replay. `WayScreen.tsx:144` encrypts the card again on every `run()`, RSA-OAEP is random, and the Idempotency-Key is kept after `unanswered` (`WayScreen.tsx:182`; `ways.ts:250` `idempotency_in_progress` and a 5xx map to `unanswered`). The Hub fingerprints the body (`idempotency.ts:46`), so the second send is `409 idempotency_key_reused` "This key was already used for a different payment. Start again to pay." (repro: live Hub, same key, two ciphertexts: 201 then 409). The app then takes a new key (`refused` branch, `WayScreen.tsx:209`) and the person pays again while the first charge may have gone through. Fix: keep the ciphertext with the key for the life of the attempt.
- **F2 medium, defect.** Freeze then pay then unfreeze never credits. `creditInflow` stops a frozen attempt with outcome `failed` (`add-money.service.ts:644`); the dispatcher ends a `failed` delivery for good (`nuvion-webhook-dispatcher.service.ts:187-199`, only `pending` rows are picked) and the sweep skips a movement that has a stored final delivery (`reconcile-sweep.ts:21-30`). Nothing credits after the unfreeze, and there is no admin re-credit. The spec passes only because `deliver()` calls the handler by hand with a fresh delivery id (`add-money.contract.spec.ts:212-226`, used at 764 and 771). The controller says "cannot be credited until it is unfrozen". Fix: unfreeze (or the sweep) re-offers the held inflow.
- **F3 medium, defect.** `rollback.sql` drops `AddMoneyAudit` and every closed attempt without refusing: a cancelled attempt with an admin audit row and no review note rolled back cleanly (run). It checks only open, settled, frozen or reviewed rows. Fix: also refuse when `AddMoneyAudit` has rows.
- **F4 medium, unclear.** The prefer-hosted rule (R-84 (3)) is not implemented. The Hub's options carry no preference, the app lists "Debit card" first and equal to the hosted ways (`OtherWays.tsx`, `add-money.service.ts` `options()`), and the card goes to the Hub as ciphertext even where a hosted bank checkout is available. Lead to rule what "prefer" means (hide the card way when a hosted way is available for the currency, or order hosted first).
- **F5 low.** Migration stamp `20261108093000` is no longer later than every `origin/wmt/*` migration (newest `20261121090000_store_purchases`, also `20261120093000_geo_location`); rename at merge.
- **F6 low.** `card.encrypted` accepts any base64 of 40 to 2048 characters (`add-money.dto.ts`), so plain base64 text would pass; require the key's ciphertext length (344 for RSA-2048).
- **F7 low.** The daily limit is read in `precheck` and written later, so two simultaneous attempts can both pass.
- **Test gap (not a defect).** The PIN sheet and fingerprint hand-off of the way screen has no jest test (builder's note); a test that submits twice with the same key would kill F1.

### Round 1 (fix round, builder, 24 Oct 2026; backend `wmt/WALLET-25` `66806bd`, mobile `wmt/WALLET-25` on the verifier's `49cf0a21`)

Status verifying. Each verifier finding, what was done, and its proof (no spec that imports the Fintava double was run).

| # | Finding | Fix | Proof |
|---|---|---|---|
| F1 | high: a retry re-scrambled the card under the kept key (409 `idempotency_key_reused`, then a new key and a second charge) | `WayScreen` scrambles the card once per attempt and keeps the whole request (key, amounts, scrambled card, billing) in the money-attempt store `sentRequest.ts` (secure store, per account, 23 h, read again on open); every retry sends those bytes; a 409 `idempotency_key_reused` never takes a new key: the screen shows "Your payment was not confirmed", Pay again sends the same request, and only the person's own "Start a new payment" lets go of it; a definite refusal, a taken payment, a wrong PIN on a first try and a changed quote release it | `wayRetry.test.tsx` was RED first (the retry's `card` differed under the same key; the key-reused screen did not exist), then green (2/2); `sentRequest.test.ts` 3/3 |
| F2 | medium: freeze, paid, unfreeze never credited (a failed delivery is final) | a frozen attempt's settled inflow is held: `creditInflow` answers `wait`, the delivery stays `pending`; unfreeze makes the held delivery due now (`offerHeldAgain`); the dispatcher credits it once | `add-money.contract.spec.ts` posts the signed delivery to the real receiver and runs the real dispatcher sweep: pending and noted "held" while frozen, no ledger row; after unfreeze `processed`, one ledger row, attempt settled |
| F3 | medium: `rollback.sql` dropped closed attempts and audit rows | refuses while EITHER table has ANY row | run on a live database: a cancelled attempt alone refused; with an audit row refused; empty tables rolled back; migration applied again (`logs/rollback-proof.log`) |
| F4 | medium (lead ruling): R-84 (3) "prefer hosted" | Nuvion has no hosted page for a card (its funding sessions are open banking, mobile money, stablecoin and Interac), so in-app card entry, scrambled on the phone, stays. `GET /money/add-money/options` lists the hosted ways that can be used first (Apple Pay, bank checkout), then the card, then USSD, then every way that cannot be used now; the app draws the Hub's order | spec: order `apple_pay, card, ussd, open_banking(off)` |
| F5 | low: stamp | migration renamed `20261122090000_add_money` (after `20261121090000_store_purchases`) | `prisma migrate deploy` on a fresh database; `migrate diff` empty earlier, schema unchanged |
| F6 | low: any base64 passed as `card.encrypted` | the Hub decodes it and requires exactly the key's ciphertext length (256 bytes for RSA-2048) before the PIN, else a plain 400 | spec: a card in the clear, 255 and 257 bytes, and 344 'A's are 400, no attempt written, no PIN try used; 256 bytes goes through |
| F7 | low: the daily limit and the insert were two steps | read and written in one transaction under a per-person advisory lock (`pg_advisory_xact_lock`) | spec: two taps at once, one 201 and one 403 `limit_reached`, one row |

Also found and fixed in this round: `src/money/tests/money-contract.spec.ts` (the served money routes list) failed for the add-money routes (round 0 did not run it); the seven `/money/add-money*` routes are now in its list and the return page carries `@BuiltBy`. The earlier `wayScreen.test.tsx` filled its card fields with `fireEvent.changeText`, which did not take, so its card-fault test saw empty fields; the new test fills them with `userEvent`. The PIN sheet and fingerprint hand-off now have a jest test (`wayRetry.test.tsx` enters the PIN twice).

**Still NOT RUN:** pictures (390 px light and dark), a naira card end to end against dev (refused), a card settling to a naira balance, Apple Pay and the screens on a phone, and Nuvion accepting the JavaScript ciphertext with its real key.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
