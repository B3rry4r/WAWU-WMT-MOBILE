---
id: NUV-01
title: Nuvion client, webhook receiver and the switch to Nuvion
owner: YOU
area: MONEY
order: 197
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-20]
decisions: [R-39, R-42, R-44]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# NUV-01 · Nuvion client, webhook receiver and the switch to Nuvion

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `authentication.md`, `errors.md`, `pagination.md`, `versioning.md`, `webhooks__overview.md`, `api-reference__webhooks.md`

## Goal

With `WALLET_PROVIDER=nuvion` the server boots with a Nuvion adapter that the later Nuvion tasks fill in, one area
each, without editing the same files; Nuvion's signed webhooks are received and stored once; and a rollback to
Fintava can tell Nuvion's rows from Fintava's (MONEY-20 finding 2). This replaces MONEY-20's "nuvion is reserved"
boot stop. Nothing a person sees changes under `fintava`.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- MONEY-20 (done): fills its reserved `nuvion` value; the seam itself is unchanged.
- MONEY-06 and MONEY-07 (done, Fintava client and webhooks): kept as they are for rollback (R-39).
- MONEY-14 (done, PIN reset): under `nuvion` the code goes by email (R-39: no SMS) through `OTP_SENDER`.

## Scope

- New `src/nuvion/`: `nuvion-config.ts` (`NUVION_BASE_URL` accepted only as `https://api.nuvion.dev` or `https://api.nuvion.co`; `NUVION_API_KEY`; `NUVION_API_VERSION` pinned to `2026-02-06`; `NUVION_WEBHOOK_SECRET`; `NUVION_OPERATIONAL_ACCOUNT_ID`; timeouts as `PROVISIONAL(NUVION-TIMEOUTS, owner=YOU, why=...)`), `nuvion-client.ts` (bearer auth, JSON, the `{status, message, data}` envelope, cursor paging on `limit`, `cursor`, `has_next`, `next_cursor`, `X-Request-ID` kept on every error, timeouts, 429), `nuvion-error.ts` (every `error_*` type on Nuvion's errors page mapped to one `WalletProviderError` kind).
- `nuvion-wallet-provider.ts` implements `WalletProvider`; every method delegates to one area file under `src/nuvion/areas/` (`opening.ts`, `documents.ts`, `accounts.ts`, `book.ts`, `payouts.ts`, `reconcile.ts`), each answering `not_supported` until its task (NUV-02 to NUV-08) fills it. Capabilities: `selfieMatch` and `identityLookup` false, `separateKyc` and `asyncAccountNumber` true, `hostedLiveness` false until NUV-03.
- `nuvion-otp-sender.ts`: `OTP_SENDER` under `nuvion` emails the PIN reset code through the existing mailer.
- `src/nuvion/webhook/`: `POST /webhooks/nuvion` on the raw body; hex HMAC-SHA256 of `{x-nuvion-event-timestamp}.{raw body}` with the secret, compared in constant time with `x-nuvion-event-signature`; a timestamp window `PROVISIONAL(NUVION-WEBHOOK-WINDOW, ...)` of 5 minutes (the docs state none); stored once per `x-nuvion-event-id`; 2xx only after storing; rate-limited like the Fintava receiver (OPS-11); a handler registry keyed by event name (`src/nuvion/handlers/`), so NUV-02 to NUV-08 each add their own handler file and never edit the receiver.
- One migration (timestamp after every folder on backend main): `NuvionWebhookEvent`; `NuvionEntity` (one row per person: user, entity id, person id, status, decided at, rejection reasons, account id, `nuvion_ban`, account-details id, account number, issuer bank name and code, currency), which NUV-02 to NUV-04 and NUV-09 write; a nullable `provider` column (default `fintava`) on the wallet, opening and ledger tables.
- Rollback safety (MONEY-20 finding 2): the status sweep, opening sweep, balance and ledger consumer act only on rows of the running provider; the bank name, licence and deposit-insurance lines are read per provider (Nuvion's from `NUVION_WALLET_*`, filled by the owner in NUV-10); a leftover wrong `FINTAVA_*` value no longer stops a Nuvion server (finding 1), while the Fintava webhook receiver stays mounted.
- The stand-in `test/nuvion/nuvion-standin.ts`: a local HTTP double built from the docs' examples, with switches for each error type, a slow answer and a lost answer. Every NUV spec uses it.
- `data-export-sections.ts` decides both new models; `.env.example`, `deploy/README.md` and `docs/LOCAL.md` list the Nuvion settings (no figures) and the rollback (set `WALLET_PROVIDER=fintava`, restart).
- Not in scope: any area method (NUV-02 to NUV-08) and any route other than the webhook.

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] With `WALLET_PROVIDER=nuvion` and every Nuvion setting present the built server boots and `GET /api/hub/health` answers 200; a missing setting, or a base URL other than the two documented hosts, stops it at boot naming the setting; unset or `fintava` boots Fintava as before (MONEY-20's seam spec passes unchanged).
- [ ] Every request the client sends to the stand-in carries `Authorization: Bearer`, `Content-Type: application/json` and the pinned `X-API-Version`, and a list call follows `next_cursor` until `has_next` is false.
- [ ] Each error `type` on Nuvion's errors page, plus 401, 429, 5xx, a timeout and an unreadable body, becomes one `WalletProviderError` kind with Nuvion's `X-Request-ID` kept; a table in the spec lists every one.
- [ ] A delivery signed over `{timestamp}.{body}` is stored once and answered 200; the same event id again is stored once; a wrong signature, a missing header or a timestamp outside the window answers 401 and stores nothing (V8 replay and forgery).
- [ ] With a Nuvion-written wallet, opening and ledger row present, a server switched back to `fintava` leaves them alone in the status sweep, opening sweep, balance and ledger consumer (spec over both adapters).
- [ ] Under `nuvion` a person who resets their PIN gets the code by email, and nothing is sent by SMS.
- [ ] No spec reaches a host other than the stand-in (the spec fails on any other outbound request).
- [ ] (key) `GET /bank-codes/NG` through the client returns the sandbox's bank list.

## Builder report

## Verifier report

## Owner sign-off
