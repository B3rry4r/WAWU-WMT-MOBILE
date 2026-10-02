---
id: MONEY-06
title: Fintava client
owner: YOU
area: MONEY
order: 49
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [MONEY-04, OPS-02]
decisions: [R-25]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-06 · Fintava client

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A new Fintava gateway beside the Flutterwave one: one place in the backend that talks to Fintava. Fintava
goes beside Flutterwave until the web has no callers (CLAUDE.md rule 6); the web's Flutterwave paths keep working
until WALLET-30 removes them.

## Scope

Bearer-key auth (Fintava has no request signing), sandbox and live config, error mapping to our error shape,
timeouts. The Fintava variables are added to the `hub-api.env` list in wawu-backend `deploy/README.md` (step 4).
Local values live in the backend's `.env`; production values are put in `/etc/wawu/hub-api.env` on the
DigitalOcean droplet by OPS-10 (deploys go through GitHub Actions; there is no staging, R-25).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md` and the real sandbox calls in `docs/fintava/sandbox/` (OPS-02 and this task's `26-money06-client.md`); a real sandbox response overrides them.

Base URLs: sandbox `https://dev.fintavapay.com/api/dev`, live `https://live.fintavapay.com/api/dev`. Bearer key, no request signing. Errors are read by message as well as status: business errors `{ status, timestamp, message: [string], path }`, validation errors with the NestJS object nested in `message`, the documented shape `{ statusCode, message, error }` with `message` a string or an array; a wrong key is 400 or 404 (never 401), a blacklisted NIN is 403. `/single/transfer` is deprecated: use `/transaction/wallet-to-wallet`. Wallet-to-wallet, `/bank/credit/merchant` **and `/bank/credit`** take our `CustomerReference` and refuse a repeat; a refused wallet-to-wallet send leaves its reference usable, a refused bank send can leave a `PENDING` record and uses its reference up. Transfer responses swap their reference fields (their `customerReference` is Fintava's findable reference, their `reference` is not findable). Create customer answers 201; a customer has four ids. History lists only debits, and `/txn/merchant` is cached about 5 minutes per page and take. A 2xx is not proof of payment; a 5xx (`500 ECONNRESET`) or a timeout on a send is "unknown" until a lookup settles it. A lookup by reference (or by id) can answer `200 {}`: neither found nor not found. A frozen wallet can neither send nor receive. Bank sends and bill purchases are refused in the sandbox (question 17).

## Capability checks

- [ ] Against the sandbox, each call in `docs/PLAN.md` items 1 to 13 returns a typed result through the client, and a bad key gives a clear typed error. Bank sends and bill purchases that the sandbox refuses (the blocker below) are reported NOT RUN with that reason.
- [ ] No Fintava secret appears in logs.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-06` in both repos (wawu-backend `9dc61f3` from main `5c07568`; mobile from main `737e961`).
- **Built (backend, additive):** `src/fintava/` (client, config, errors, amounts, reconcile, types, module; not mounted, no route served, no Flutterwave file touched); `test/fintava/fintava-double.ts` (local double answering the recorded sandbox bodies); `scripts/fintava/sandbox-check.ts` (re-runnable sandbox proof). `.env.example` and `deploy/README.md` step 4 list `FINTAVA_BASE_URL`, `_API_KEY`, `_WEBHOOK_SECRET`, `_TIMEOUT_MS`, `_MONEY_TIMEOUT_MS`, `_CHECK_TIMEOUT_MS`, no values. `docs/contract/CONVENTIONS.md` section 4 corrected (`/bank/credit` takes our reference).
- **Calls (PLAN 1 to 12; 13 is MONEY-07's receiving end):** BVN, selfie, phone checks; create, get, find by phone, list customers; wallet and merchant balance; customer and merchant history; banks; bank and wallet name checks; bank and merchant bank sends; lookups by reference and id; wallet to wallet; freeze, unfreeze; discos, meter preview, data, cable lists; electricity, airtime, data, cable purchases. Typed results in kobo; Fintava's embedded identity (BVN, NIN, admin login) dropped.
- **Idempotency:** every send carries our `CustomerReference`; a lost answer is `outcome_unknown`. Resends go only through `retry*`, which reconcile first (lookup; on `200 {}`, the sender's history): wallet to wallet resends the same reference only on a 404 older than the money timeout; bank sends only under a new reference when the old one is FAILURE, CANCELLED or absent; PENDING or unknown means wait.
- **Check 1, typed results and a bad key:** sandbox run 3 (44 calls): 25 passed, 0 failed, 5 NOT RUN, balances back to start; a bad key (400 and 404) is `auth`. Runs 1 and 2 each failed 2 steps on the script's own `{}` expectations (recorded). Evidence `docs/fintava/sandbox/26-money06-client.md`. NOT RUN: BVN, selfie, phone (charged); create (no new customers); bank sends and bill purchases (question 17, unblocked when a ₦100 `/bank/credit/merchant` to `0123456789`/`000013` stops answering "Unable to find customers"); webhooks (MONEY-07).
- **Check 2, no secret in logs:** `fintava-logging.spec.ts` captures the Nest logger, stdout, stderr and console against a double that echoes the key and a BVN back, over success, refusals, auth, 5xx, timeout, hang-up and an unreadable body; no key, no 8 characters of it, no `Bearer` token, no BVN or phone in logs, errors or `inspect(client)`. Mutation-checked (logging 9 key characters fails it). Sandbox output: 0 key windows.
- **Tests:** 3 new suites, 164 tests (units 105, contract 58, logging 1), every call and quirk in the brief.
- **Runs:** tsc 0 before and after; eslint 0 on changed files; full `test:contract` 96 suites, 1891 passed, 3 skipped, 0 failed (own DB `money06_test`, mock WAWU ID on :4001; a first run without the mock up failed 91 in the event and admin-finance specs on `ECONNREFUSED :4001`); protected suite 253/253 on main and 253/253 on the branch, each on a fresh database (`money06_protected_test`); gates 16 fail / 1 warn / 76 accepted on 543 files before, 16 / 2 / 76 on 553 after (the same 16; the new warn is `PROVISIONAL(FINTAVA-TIMEOUTS)`); baseline check passes. Mobile `npm run check`: on main `737e961` exit 1 (one jest test timed out at 5 s while the protected suite ran beside it), on main `02d766b` exit 0 (13 suites, 250 tests, gates 0 on 69 files); the branch: see the merge line below.
- **New sandbox facts (naira-api.md updated, question 21 widened):** lookups by reference and by id answer `200 {}` for SUCCESS records too, about a minute after each send, while an unknown reference stays 404; a ₦10 send the script gave up on after 3 s landed, and `reconcile` found it SUCCESS (`settled`, not resent).
- **Defaults (agent), owner may override:** timeouts 15, 30 and 30 s and a 30 s retry-after (PROVISIONAL); `FINTAVA_BASE_URL` empty means sandbox, except in production where it must be set; only Fintava's two hosts are accepted; an identity refusal maps to a plain 422 (no money code fits); 9mobile data is asked for as `ETISALAT`; the ₦100 airtime minimum is checked before sending.
- **Not done:** no route served (MONEY-07 onwards); the success bodies of bank sends, bill purchases, the BVN check and the selfie are unseen (questions 17 and 11), so those parsers follow the docs and keep every scalar. No gap or shared-change row needed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
