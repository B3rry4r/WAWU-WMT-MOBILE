---
id: NUV-01
title: Nuvion client, webhook receiver and the switch to Nuvion
owner: YOU
area: MONEY
order: 197
priority: launch
repo: wawu-backend
type: third-party
status: verifying
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

Builder, 8 Oct 2026. wawu-backend `wmt/NUV-01` `78c2d93` (on main 965280e); mobile `wmt/NUV-01` (this file, on main
50a7a89). Stand-in only: no Nuvion, Fintava or wawuafrica.com host was called. Every NUV spec refuses and records any
connection that is not loopback (`test/nuvion/outbound-guard.ts`, shown catching one), and none was tried.

**Built** (backend), in the layout `docs/PAYMENTS-PLAN.md` describes, so NUV-02 to NUV-06 can run in parallel:
- `src/nuvion/nuvion-config.ts`: `NUVION_BASE_URL` only `https://api.nuvion.dev` or `https://api.nuvion.co` (exact
  string), `NUVION_API_KEY`, `NUVION_API_VERSION` pinned to `2026-02-06`, `NUVION_WEBHOOK_SECRET`,
  `NUVION_OPERATIONAL_ACCOUNT_ID`; `PROVISIONAL(NUVION-TIMEOUTS)`, `PROVISIONAL(NUVION-RESEND-SAFETY)`,
  `PROVISIONAL(NUVION-WEBHOOK-WINDOW)` (5 minutes). Read only under `nuvion`, by a lazy factory (`nuvion.module.ts`).
- `nuvion-client.ts`: bearer, JSON and the pinned version on every request; the `{status, message, data}` envelope is
  the proof of a 2xx; `listPage`/`listAll` on `limit`, `cursor`, `has_next`, `next_cursor` (stops and says so at a page
  cap; a page without a new cursor is unreadable, never a loop); one deadline over headers and body; a body cap; no
  redirects; 429 with Retry-After; no key in errors, logs, `inspect` or JSON. `nuvion-error.ts`: all 153 `error_*` types
  on Nuvion's errors page mapped to one `WalletProviderError` kind; `NuvionError` keeps `X-Request-ID` and the type;
  Nuvion's texts masked (key runs, tokens, base64, digit runs to their last 4, emails). Nuvion's three limit types
  (`error_transfer_transaction_limit_exceeded`, `_daily_limit_exceeded`, `_monthly_volume_exceeded`) go through one
  mapping point, `nuvionLimitError` (refused, nothing moved), so bringing in NUV-07's `providerLimitError`
  (`403 limit_reached`, G-411; NUV-07 is not on main) is a one-line change there (the lead's note).
- `nuvion-wallet-provider.ts` implements `WalletProvider` by one-line delegation to `src/nuvion/areas/`: `opening.ts`
  (NUV-02), `documents.ts` (NUV-03), `accounts.ts` (NUV-04), `book.ts` (NUV-05), `payouts.ts` (NUV-06), `reconcile.ts`
  (NUV-08); each answers `not_supported` and sends nothing (`decideRetry`, which is pure, advises `wait`).
  Capabilities as the task says. `wallet-provider.module.ts` picks it; MONEY-20's "nuvion is reserved" stop is gone.
- `nuvion-otp-sender.ts`: under `nuvion` the PIN reset code is emailed by WAWU ID (`POST /internal/users/:userId/
  pin-reset-code`, the data-export mailer's pattern: WAWU ID owns the address and the words; BACKEND_GAPS G-400), never
  texted. `OtpSender` gains `channel` and `sendResetCode`; Fintava's sends the same SMS as before. By email no BVN-proved
  phone is needed, and `sentTo` is the token's address masked (`a***@example.com`).
- `src/nuvion/webhook/`: `POST /webhooks/nuvion` on the raw body; hex HMAC-SHA256 of `{timestamp}.{body}`, constant
  time; the timestamp read as ISO 8601 (Nuvion's delivery logs show it) or Unix s/ms, within 5 minutes either side;
  stored once by `ON CONFLICT DO NOTHING` on the event id AND on the signed (timestamp, body) pair (the event id is not
  signed, so a replay under a new id lands on the same row); 200 only after the insert, 503 when it fails; every
  throttler skipped as the Fintava receiver (OPS-11); test deliveries stored `test`, undocumented events
  `unrecognised`. `src/nuvion/handlers/`: one handler file per task, all listing no event yet, `NuvionHandlerRegistry`
  keyed by event (several handlers may share one), and `NuvionWebhookDispatcher` (30 s sweep, never on receipt; one
  worker per delivery by a lease; `wait` rests 1 to 60 minutes; `processed` or `failed`).
- Migration `20261016150000_nuvion_adapter` (the lead's reassigned stamp; INBOX-03 holds 100000):
  `NuvionWebhookEvent`, `NuvionEntity` (the task's fields plus `accountDetailsStatus`), and a nullable `provider`
  (default `fintava`; existing rows read `fintava`) on `FintavaWallet`, `FintavaWalletOpening`, `FintavaLedgerEntry`.
- Rollback safety: the status sweep claims and checks only running-provider rows; the opening sweep, its reconcile and
  `open` leave another provider's opening alone (and stamp the provider on what they write); the balance never asks
  about another provider's wallet (503, W6); the ledger consumer reads Fintava's delivery table only under `fintava`,
  resolves only running-provider wallets, and fails for review a reversal that names another provider's debit. Bank,
  licence and deposit-insurance lines per provider (`NUVION_WALLET_*`; also About and receipts). Under `nuvion` a wrong
  `FINTAVA_*` value starts Fintava unconfigured with a warning instead of stopping the server (finding 1).
- `NuvionEntity` decided in the purge map (OWNED) and the export map (excluded, with a reason); `NuvionWebhookEvent`
  has no person column (noted). `.env.example`, `deploy/README.md`, `docs/LOCAL.md` and the backend `CLAUDE.md` list
  the settings (no figures) and the rollback. The mock WAWU ID serves the email route. `scripts/nuvion/
  bank-codes-check.ts` is the (key) check, sandbox only. Two existing specs changed on purpose: the seam spec's "nuvion
  is reserved" test (the task replaces that stop; it now proves the stop names the missing setting) and the rate-limit
  spec's list of `@SkipThrottle` files (the third payment webhook).

**Capability checks**
1. Boot: passed on the built server (`dist`, :5632, migrated `bn01_boot_test`): `nuvion` with every setting boots,
   health 200; without `NUVION_API_KEY` or `NUVION_WEBHOOK_SECRET` it exits 1 naming it; `https://api.nuvion.example`
   exits 1 naming `NUVION_BASE_URL`; unset, and `fintava` with wrong `NUVION_*` values, boot (health 200); `nuvion` with
   `FINTAVA_TIMEOUT_MS=abc` boots with the warning, `fintava` with it still exits 1; `flutterwave` exits 1. Also
   `nuvion-adapter.spec.ts` (30 tests: every required setting, nine wrong hosts, the version pin, ranges). The seam
   spec passes with its one deliberate change (above).
2. Headers and paging: `nuvion-client.spec.ts`, against the stand-in over a socket (GET, POST, PATCH, a list page; 7
   accounts at 3 a page: three requests, cursors as sent, every row once).
3. Errors: the same spec's table lists all 153 documented types with status and kind (derived by group from what each
   type means, not from the client's map) and checks each on a write, the 5xx ones also on a read, with
   `X-Request-ID`, type and reference kept and `recordMayExist` true exactly for unknown outcomes; plus 401, 429 with
   Retry-After, 500/502/503/504 with and without bodies, a timeout before the headers, a body that stalls, a lost answer,
   an unreadable 2xx, a gateway 4xx page, an unknown type. 196 tests.
4. Webhook: `nuvion-webhook.contract.spec.ts` (real database, AppModule's rate limits): stored once and 200; the same
   event id with a new timestamp stored once; the exact signed delivery under a forged event id stored once; two copies
   at once one row; a wrong secret, other bytes, another timestamp, no hex, a body changed after signing, each missing
   header, an old or future timestamp, an unreadable one, a bad event id: 401 and nothing stored; no secret on the
   server: 401; not JSON: 400; 45 at once, no 429; logs hold no secret, signature or body. The registry: done, wait
   (rest, retry), failed, two workers at once (one run), no handler (left pending). 25 tests.
5. Rollback: `nuvion-rollback.contract.spec.ts` over both adapters (Fintava stand-in; Nuvion never reached): switched
   back to `fintava`, the Nuvion pending send is not claimed or checked (never failed as absent), the Nuvion opening is
   not looked up, the Nuvion wallet's balance is not asked (503), a Fintava wallet-to-wallet delivery and money in
   (`account_funded`) naming the Nuvion wallet credit nothing, a reversal naming the Nuvion debit changes nothing
   (failed, review); switched to `nuvion`, the Fintava send, delivery, opening and wallet are left the same way. 13 tests.
6. PIN reset by email: `nuvion-pin-reset.contract.spec.ts` (real tokens, the Fintava stand-in still mounted): the code
   reaches WAWU ID's route with the service key and sets a new PIN; the Fintava stand-in receives nothing (no SMS);
   a double tap sends one email; WAWU ID 404 (its route missing today): 503, not sent, the code never works; WAWU ID
   500: maybe sent, the code stays usable; no log or answer holds a code. 5 tests.
7. No outbound request: every NUV spec runs under the guard and asserts no violation (passed).
8. (key) NOT RUN (below).

**Money safety.** NUV-01 moves no money and shows no balance. A write whose answer is lost, a 5xx, an unreadable 2xx, a
gateway page, `error_transfer_already_processing` and `error_idempotency_request_processing` are unknown outcomes
(reconcile, never retry blindly); a reused reference or key is `duplicate_reference`. A disagreement across providers is
never fixed silently: the reversal is kept for review. Nothing stores or logs a BVN, NIN, PIN, code or image
(`NuvionEntity` holds ids and masked reasons; the specs scan every log line and answer). No fee, price or limit figure.

**Mutants** (16, each applied alone, its spec run, `git restore`; all killed): M1 a retried event id stored twice;
M2 no timestamp window; M3 any 64-hex signature accepted; M4 a lost write read as safe to retry; M5 insufficient funds
read as a plain refusal (amounts); M6 a reused idempotency key read as a refusal; M7 the consumer resolving any
provider's wallet by customer id (survived at first: added the `account_funded` test, d4f9f37, then killed); M8 the
status sweep claiming any provider's row; M9 the balance asking about any wallet; M10 a reversal applied to another
provider's debit (double reversal); M11 handlers getting the wrapper, so the amount is lost; M12 a replay under another
event id stored twice; M13 the code texted under nuvion; M14 the opening sweep and reconcile ignoring the provider;
M15 the consumer resolving any provider's wallet by account number; M16 a limit refusal read as maybe moved. No
currency is handled in NUV-01 (no money moves), so no wrong-currency mutant applies; NUV-04/05/09 own it.

**Runs** (load 10 to 45 on 4 cores from other sessions):
- `npx tsc --noEmit` 0. eslint on all 58 changed `.ts` files: 0 errors, 0 warnings (batches; two first batches were
  OOM-killed and rerun).
- Gates: main 16 fail / 58 warn; branch 16 fail / 61 warn, the 16 FAIL lines identical; the 3 new warnings are the 3
  `PROVISIONAL(NUVION-*)` markers. Tripwire: 0 added lines match. Key-shaped scan of the diff: 0 hits; the only `sk_`
  strings are five fake spec keys (`nv_test_sk_NUV01...`).
- Protected suite `run.sh --fresh HEAD` on 2c1f71e, lock at origin/main 965280e: 253/253 (244 required); lock unchanged.
- Specs of every module touched (nuvion, wallet-provider, fintava, money, about, data-export, account-purge,
  hub-rate-limits; 58 suites, 2,030 tests with the added rollback test): all pass. Under load first: timeouts
  only (fintava-stall, the opening production boot, selfie-match's table scan, money-pin, identity-throttle, receipts, ledger-status, the nginx bucket
  test); each passed alone (fintava-stall, production boot, selfie-match and money-pin with `--testTimeout=60000` at
  load 11 to 15). data-export needs a seeded database and `ADMIN_JWT_SECRET`: 24/24 on one.
- Full suite in a private network namespace (copies of t3ns `ns2.sh`/`inner2.sh`, `bn01_full_test`, mock on :4001
  there), three serial `--runInBand --shard=i/3` runs on 2c1f71e: 188 suites, 5,024 tests, 5,009 passed, 4 skipped
  (two suites' own focus), 11 failed, all in `hub-rate-limits` (needs a non-loopback interface; 22/22 on the host, in
  the run above and alone). The full suite was not rerun on 78c2d93 (the G-411 mapping point, three files under
  `src/nuvion/`): the client and adapter specs pass on it (226), gates and lint as above.
- `npm run contract:build`: `contract/openapi.json` unchanged (the receiver is not mounted until SHARED-CHANGES
  NUV-01 #1; the enricher notes `POST /api/hub/webhooks/nuvion` as in code, not in the spec). Mobile `npm run api --
  --backend /home/user/wt/b-NUV-01`: schema unchanged, `contract/SOURCE_COMMIT` updated. Mobile `npm run check`:
  exit 0 (typecheck, lint, jest 76 suites / 1,377 tests, gates 0 fail / 0 warn on 346 files, 249 tasks). A first
  run under load had two 20 s timeouts in app tests this task does not touch (`OpenWalletScreen`, `settingsScreens`);
  both passed alone, and the second full run passed.

**Shared changes and gaps:** SHARED-CHANGES NUV-01 #1 (AppModule imports `NuvionWebhookModule`: until then the
receiver is not served), #2 (`LedgerService` stamps and filters by provider before NUV-04/05 write a Nuvion row;
MONEY-17 edits the same file), #3 (`PinResetView.sentTo` doc line), #4 (the migration, made). BACKEND_GAPS G-400
(WAWU ID's email route), G-401 (Nuvion bank name and code per account, NUV-04), G-402 (W37 "sent to" an email,
WALLET-06).

**Decisions (Default (agent), owner may override):**
- The receiver's AppModule import is a SHARED-CHANGES row, not an edit (the brief fences `app.module.ts`); mounting it
  through `WalletProviderModule` would close a module loop once NUV-04 handlers need the ledger.
- Deliveries are deduplicated on the event id and on the signed (timestamp, body); a delivery is handled only through
  the registry, by a 30 s sweep, never on receipt (Nuvion's own advice); events no handler lists stay `pending` so a
  later handler still gets them.
- The PIN reset email goes through WAWU ID (the Hub has no mail transport and holds no address); under email no
  BVN-proved phone is needed; the daily limit counts per person (and per phone when there is one).
- `NUVION_WALLET_BANK_NAME` and the two lines are optional; Nuvion's `walletBankCode` is empty, since Nuvion names the
  issuer per account (G-401, NUV-04). Under `fintava` the lines are exactly as before.
- A non-Nuvion 4xx page on a write is an unknown outcome, not a refusal; `error_endpoint_not_found` is `refused`.
- Nuvion's `decideRetry` advises `wait` until NUV-08 (it is pure: a failure there would stop the status check).
- `NuvionEntity` has one row per person (`wawuUserId` primary key) and keeps Nuvion's own status words; its
  rejection reasons are Nuvion's words, which NUV-02 masks to last 4 digits before writing (the schema says so);
  `accountDetailsStatus` added for NUV-04.

**NOT RUN**
- (key) `GET /bank-codes/NG` through the client against the sandbox: unblocked when a lead brief allows `api.nuvion.dev`
  and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then run
  `scripts/nuvion/bank-codes-check.ts`.
- A real Nuvion delivery's headers and timestamp format (ISO 8601 assumed from Nuvion's delivery logs; seconds and
  milliseconds also read): unblocked once NUV-10 registers the webhook and `POST /webhook-tests` reaches it (the key).
- The receiver on the built server: answers 404 there until SHARED-CHANGES NUV-01 #1 is applied.
- The PIN reset email in production: unblocked when WAWU ID serves `POST /internal/users/:userId/pin-reset-code`
  (G-400).
- A stray file `/gates-branch.txt` (a gates report my shell wrote to the filesystem root when a variable was empty) is
  left in place: the safety check refused its removal; the lead may delete it.

## Verifier report

## Owner sign-off
