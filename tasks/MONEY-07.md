---
id: MONEY-07
title: Fintava webhooks
owner: YOU
area: MONEY
order: 53
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [MONEY-06]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-07 · Fintava webhooks

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Money that arrives or settles while nobody is looking is still recorded once.

## Scope

Webhook endpoint with signature check, an event store keyed by the transaction reference (Fintava sends no event id), safe to replay.

There is no standing tunnel (R-25): locally, webhook checks send payloads built from Fintava's documented format (`docs/fintava/reference/`) and signed with the local secret to the local endpoint, and the report says so. Real payloads are recorded into `docs/fintava/sandbox/23-webhooks.md` once OPS-10 registers the production webhook URL, or when Fintava sends samples (unblocking fact). The production webhook URL is registered by OPS-10.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Signature: HMAC-SHA512 of the raw body with the dashboard webhook secret, hex, in `x-fintava-signature`, compared in constant time. No timestamp and no event id: deduplicate on the transaction reference (with the event name, since a send and its reversal share a reference). Retries until a 200: live every 3 minutes for 4 tries, then hourly for 72 hours; sandbox hourly for 72 hours. Events: `account_funded`, `virtual_wallet_payment` (possibly upper case), `customer_bank_transfer`, `wallet_to_wallet_transfer_v2`, `debit_transfer_reversal` (how a failed bank send shows up), `card_payment`, `dynamic_card_payment` (card payloads unpublished). The name field is `event` in one page and `type` in another: read both. References per event (`reference/webhook-events.md`): `account_funded` carries `reference` and `sessionID` (no reference of ours); `virtual_wallet_payment` our `merchantReference`; `customer_bank_transfer` `reference` and `customerReference`; `wallet_to_wallet_transfer_v2` only `reference`; `debit_transfer_reversal` `customerReference`, `transactionReference` and `reversalRef`. A transfer RESPONSE swaps `reference` and `customerReference` (`sandbox/11-`); whether a delivery does too is unconfirmed until a real one is recorded (BACKEND_GAPS G-19).

## Capability checks

- [x] A forged signature is refused.
- [x] The same webhook delivered three times is processed once.

## Builder report

Backend `wmt/MONEY-07` 9941aa0 (from main 433a826): `POST /api/hub/webhooks/fintava` in `src/fintava/webhook/` (guard, service, controller, module, event reader), `src/hub-app-options.ts` (`rawBody: true`, used by `main.ts`), `FintavaWebhookEvent` + migration `20261002180000_fintava_webhook_event`, `FINTAVA_CONFIG_KEYS.webhookSecret`, `app.module.ts` mount, contract (one op, tag `PaymentWebhook`, excluded from the app), docs (`.env.example`, `deploy/README.md`, `docs/LOCAL.md`, `README.md`). Mobile: this file, G-19, SHARED-CHANGES MONEY-07 #1 and #2.
- No tunnel (R-25): every delivery tested was built from Fintava's documented format (`test/fintava/fintava-webhook-payloads.ts`), signed locally with a local secret and sent to the local endpoint. No sandbox call made.
- Forged signature refused: other secret, none, another body's, truncated, malformed, `sha512=` prefix: all 401, `createMany` never called, no row; no secret set: 401 (fails closed).
- Three deliveries: recorded, duplicate, duplicate, one row (raw body, payload, event, status `pending`). Concurrent: 10 HTTP copies at once and 25 service calls at once, one row each (unique key + `ON CONFLICT DO NOTHING`, no read first).
- Raw body: a body with odd spacing, `100.0` and escapes is accepted only when signed over its exact bytes and stored byte for byte; signed over its re-serialisation it is refused; an app without `rawBody` refuses (400); a test pins `main.ts` to `HUB_APP_OPTIONS`.
- Log capture (Nest Logger, stdout, stderr, console): no secret window, signature or payload personal data across every path, a DB failure (503, logs error name and code only) and invalid JSON included.
- Real boot of `dist/src/main.js` on :4702: the `docs/LOCAL.md` curl recorded once, then duplicate twice; bad and missing signature 401.
- Default (agent), owner may override: key = (event, reference, Fintava status), so PENDING then SUCCESS are two rows; per-event reference order in `FINTAVA_WEBHOOK_EVENTS`; no reference gives `sha256:` of the raw body; unknown events stored `unrecognised`, never refused; consumers MONEY-10/MONEY-08 (WALLET-10, WALLET-22 for cards) mark rows processed.
- Checks: tsc 0; eslint clean on changed files; webhook specs 35/35 (Fintava specs 227/227); `prisma migrate deploy` clean on fresh `m07_migrate_test` (only pre-existing `ContentPiece_specializations_idx` drift remains in a diff); full `test:contract` on fresh seeded `m07_full_test`: 94 of 98 suites pass, 1914 passed / 40 failed / 3 skipped; `account` (5) passes rerun with `WAWU_ID_BASE_URL_TEST` on :4701; `kyc-submission`, `privacy-settings`, `credits-state` (35 tests) NOT RUN: they hardcode `localhost:4001`, a port this session must not use. Protected suite `run.sh --fresh` 253/253 (244 required), lock unchanged (the webhook is not a web route). Gates before 16 fail / 3 warn / 76 accepted (553 files), after the same 16 / 3 / 76 (563 files).
- Mobile: contract unchanged (`npm run api` copies backend main, which does not have this yet; the op is excluded by tag anyway); `npm run check` exit 0 (typecheck, lint, 14 suites / 271 tests, gates 9 / 71 files / 0 fail, 200 tasks).
- NOT RUN: a real Fintava delivery (needs OPS-10's production URL or a tunnel; G-19); V10 (no app screen).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
