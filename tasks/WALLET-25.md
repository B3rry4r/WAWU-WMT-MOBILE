---
id: WALLET-25
title: Add money by card
owner: YOU
area: WALLET
order: 311
priority: after-launch
repo: wawu-backend
type: third-party
status: verifying
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

- **Next:** a verifier (not the builder). The owner sets `NUVION_ENCRYPTION_PUBLIC_KEY`, `ADD_MONEY_RETURN_URL` and the fee settings; Nuvion switches on naira; then the live card check.
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
