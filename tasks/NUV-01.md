---
id: NUV-01
title: Nuvion client, webhook receiver and the switch to Nuvion
owner: YOU
area: MONEY
order: 197
priority: launch
repo: wawu-backend
type: third-party
status: done
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

Verifier, 8 Oct 2026 (independent; wrote none of this). Backend `wmt/NUV-01` `757780b` in detached worktree
`/home/user/wt/vn01b`; main `965280e` (the builder's base) in `/home/user/wt/vn01main` for every comparison, that
worktree later moved to `757780b` for the mutants; the real wawu-id `fb8717e` (origin/main, its own `npm ci`) in
`/home/user/wt/vn01id`; mobile `ad6a939` in `/home/user/wt/vn01m`. Evidence: the lead's scratchpad `vn01/`. No Nuvion,
Fintava or wawuafrica.com host was called: every built server ran inside a private network namespace with loopback
only (`https://api.nuvion.dev` answered `EAI_AGAIN` from there, `v9/live.js`), and the specs ran under the builder's
outbound guard. **Backend main moved** since the build, `965280e` to `ea79fca` (FIX-06; its migration
`20261015100000_professional_takedown` sorts before this one). A trial `git merge-tree` of `ea79fca` and `757780b` is
clean (tree `3bfed43`: the contract keeps `/api/hub/webhooks/nuvion`, the schema both new tables); nothing pushed or kept.

**Verdict: building, three defects open.** eslint fails on four changed files (V1); Nuvion's same-day-cutoff refusal
reads as "nothing moved" although Nuvion's docs say the transfer will still process; the "already exists" refusals say
no record exists. Everything else the brief asked about passed, on the built servers and in the specs: the receiver
(replay under a changed event id is one row), the switch, the rollback filters in both directions, the PIN reset's
clean 503, the migration, Fintava's answers unchanged, and the protected suite.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | **failed** (eslint) | `tsc --noEmit` 0 (`tsc-b.log`). **eslint on the 59 changed `.ts` files: 20 errors in 4 files** (defect 1, `lint/four.out`); the other 55 clean. Gates: main `965280e` 16 fail / 58 warn / 76 accepted on 889 files; branch 16 / 61 / 76 on 925 files; the 16 FAIL lines byte-identical (`gates/main.fail`, `gates/branch.fail`); the 3 new warnings are exactly `PROVISIONAL(NUVION-TIMEOUTS)`, `(NUVION-RESEND-SAFETY)` and `(NUVION-WEBHOOK-WINDOW)`, each with `why=`. Tripwire: 0 added lines match. `npm run contract:build`: `contract/openapi.json` unchanged (sha256 `fb628dbe...ca2e` before and after); against main it adds one path (`POST /api/hub/webhooks/nuvion`, tag `PaymentWebhook`) and one schema (`NuvionWebhookAck`) and changes nothing else; the mobile copy has the same sha256. Key-shaped scan of the whole diff: nothing beyond the five fake `nv_test_sk_NUV01...` spec keys. Mobile `npm run check` on `ad6a939`: exit 0 (typecheck, lint, jest 76 suites / 1,377 tests, gates 0 fail / 0 warn on 346 files, 249 tasks, 279 artboards; `mobile/check-ad6a939.txt`). |
| V2 Contract | passed | Additive only (above). `prisma migrate diff` from a freshly migrated database to the schema: the same single line on main and branch (`DROP INDEX "ContentPiece_specializations_idx"`, main's known drift; `mig/diff-*.sql`). |
| V3 Regression | passed (timing aside) | Protected suite `run.sh --fresh HEAD` on `757780b`, lock origin/main `ea79fca` (lock files identical at `965280e`): 253/253, "all 244 required tests passed" (`prot/protected.txt`). Full suite in my own network namespace (copies of t3ns `ns2.sh`/`inner2.sh` as `ns/ns.sh`, `ns/inner.sh`; fresh migrated and seeded `vn01_full_test`; mock on :4001 inside it only), three serial `--runInBand --shard=i/3`: 188 suites, 5,024 tests, 4,967 passed, 4 skipped, 53 failed in 4 suites, none a file this task changed: `fintava-stall` 36 (timing; 120/120 alone), `hub-rate-limits` 11 (needs a non-loopback interface; 22/22 on the host), `production-boot` 5 (a 5 s `beforeAll` at load 32; 5/5 alone with a mock on :5724), `receipt-units` 1 (the 300 ms bound: 306.8 ms, and again over it alone at load 23; receipts are untouched here). Same totals as the builder's run (`ns/full-*.json`, `specs/rerun-*.txt`). |
| V4 Shape | passed | The receiver answers `{statusCode, message, data: {outcome, event}}` as the contract says; its 400, 401, 413 and 503 carry no `reason` (not a money route). No money route answered a 500 under either provider (below). |
| V6 States | passed | Each state from its real cause on the built server: no secret, missing headers, a stale timestamp, a body that is not JSON, a 2 MB body, the database refusing the insert (503, nothing stored; Nuvion's resend then 200 `recorded`, one row), WAWU ID's missing route (503). The client's states against my own stand-in (below). |
| V8 Money | passed for what NUV-01 does (no money moves) | Replay and forgery on the built server (below); the mapping (below; defects 2 and 3 are in it). |
| V9 Live seam | passed | Signed in through the real wawu-id `fb8717e` (register, email verified, `POST /auth/login`), its JWKS verifying the token; built main and branch servers on :5722 (below). |

**Specs.** `src/nuvion` and `src/wallet-provider` on a fresh migrated `vn01_spec_test`: 6 suites, 287/287 (client 196,
webhook 25, rollback 13, adapter 30, seam 18, PIN reset 5), as the builder reported (`specs/nuvion-specs.json`).

**The client against Nuvion's docs** (`specs/client-probe.txt`: the built client against my own stand-in on :5723):
- Every request carries `Authorization: Bearer <key>`, `Content-Type: application/json`, `Accept: application/json`
  and `X-API-Version: 2026-02-06`. No idempotency header: Nuvion's idempotency key is the body's `unique_reference`
  (at most 64 characters, api-reference__transfers.md), which the area files set.
- Paging: `limit`, then `cursor=A`, `cursor=B`, until `has_next` is false; a loop A, B, A, a `has_next` with no or an
  empty `next_cursor`, and a page without `has_next` are `bad_response`; `limit` 0 and 101 are refused before sending.
- Unknown outcomes on a write, all `recordMayExist: true` and never resent: no answer, a timeout, a body cut mid-stream
  (2xx `not_confirmed`, 4xx `outcome_unknown`), a 500 carrying a refusal type, a 302 to another host
  (`redirect: 'error'`; nothing followed it), a 408 or 413 gateway page. 429 keeps `Retry-After: 120`; an HTTP-date
  Retry-After falls back to 30. `X-Request-ID` kept; one with a space dropped. Nuvion's texts masked: digit runs to
  their last 4, an email to its domain, the key and any `Bearer` token replaced; the key is in no error or JSON.
- The 153 documented types: my own table taken from `errors.md` equals the spec's table and the map's keys (153 types,
  statuses identical; `specs/doc-err.txt`). Each run on write, read and check through the built
  `classifyNuvionFailure` (`specs/errmap.txt`). Spot-checked 34 against the docs' meaning. Agree with 30:
  `auth_credentials_invalid`, `_revoked`, `auth_permission_denied`, `auth_api_version_*` (auth);
  `auth_rate_limit_exceeded` (rate_limited); `validation_error`, `_required_field_missing`, `_amount_invalid`,
  `transfer_purpose_code_required` (validation); `transfer_insufficient_funds`; the three limit types (refused, nothing
  moved, the one G-411 mapping point); `account_not_active`, `_suspended`, `_closed`, `transfer_account_not_active`
  (wallet_inactive); `transfer_outside_business_hours` (payouts_blocked); `transfer_compliance_rejected`,
  `_recipient_flagged`, `_counterparty_not_approved` (refused); `transfer_already_processing` and
  `idempotency_request_processing` (outcome_unknown); `idempotency_key_mismatch`, `duplicate_resource`,
  `acquiring_payment_already_processed` (duplicate_reference); every 5xx type (outcome_unknown on a write, unavailable
  on a read); `resolution_account_not_found`, `resource_not_found` (not_found); `endpoint_not_found` (refused);
  `concurrent_modification_detected` (refused on a write, unavailable on a read); `kyc_identity_verification_failed`,
  `kyc_sanctions_check_failed` (identity_refused). Disagree with 4: defects 2 and 3, finding 4.

**The receiver on the built server** (`v9/live-boot-webhook-sweeps-progress.txt`; identical under `nuvion` and under
`fintava`, so it is mounted under both): a signed delivery 200 `recorded`; the same again 200 `duplicate`; the same event
id with a new timestamp 200 `duplicate`; **the exact signed delivery under a changed event id 200 `duplicate`, and again
with the signature in upper case: one row**; 40 copies of a new delivery at once: 40 × 200, one row; **40 replays at once
under 40 different forged event ids: 40 × 200, one row**. 401 and nothing stored: a wrong signature, another secret, a
signature over the body only, a body changed after signing, each of the three headers missing, a timestamp 6 minutes old
or 6 minutes ahead, `yesterday`, a microsecond epoch, an event id with a space. 200: 4 minutes old; Unix seconds. 400:
`text/plain`. 413: a 2 MB body (the body parser, before the guard); 200: a 90 KB body. A burst of 150 valid and 150
forged: 150 × 200 and 150 × 401, no 429. No secret, signature or body text in the server log. Under `fintava` without
`NUVION_WEBHOOK_SECRET`: 401 "not configured", nothing stored. Stored: 157 `pending`, 1 `unrecognised` (an undocumented
`transfers.exploded`), 1 `test`; after a 30-second sweep (40 s) all unchanged, `attempts` 0 (no handler lists an event yet).

**The switch on the built server** (33 boots): unset, `fintava`, `  FINTAVA `, `nuvion`, ` NUVION `, the production host
and a trailing slash boot (health 200; "Nuvion adapter ready (sandbox)" or "(production)"). Each of `NUVION_BASE_URL`,
`NUVION_API_KEY` (also blank), `NUVION_WEBHOOK_SECRET` and `NUVION_OPERATIONAL_ACCOUNT_ID` missing: exit 1 naming it and
the rollback. A base URL with `http://`, `:443`, `/v1`, upper case, `api.nuvion.dev.evil.example`, `x@api.nuvion.dev`,
`api.nuvion.example` or `http://127.0.0.1:5723`: exit 1 naming `NUVION_BASE_URL`. `NUVION_API_VERSION=2026-01-01`
exits 1; `2026-02-06` boots. A bad operational account id, a bad `NUVION_MONEY_TIMEOUT_MS`: exit 1 naming each. Under
nuvion a wrong `FINTAVA_TIMEOUT_MS`, `FINTAVA_BASE_URL` or `FINTAVA_RESEND_SAFETY_MS` boots with the warning; under
fintava the first two still exit 1. **Under nuvion a wrong `FINTAVA_FEE_BANK_TRANSFER_KOBO` or
`FINTAVA_FEE_BALANCE_TRANSFER_BANDS` still stops the server** (`FeeConfigError`; finding 5). `fintava` with wrong
`NUVION_*` values boots; `flutterwave` exits 1.

**Fintava unchanged** (`v9/fintava-main.json`, `v9/fintava-branch.json`): main `965280e` and branch `757780b` built,
`WALLET_PROVIDER` unset, the same signed-in person with the same wallet row; 25 answers compared (12 fee quotes with
their parts and signed claims, `/money/wallet`, the balance, `/about`, identity, PIN, history, beneficiaries, payout
account, setting the PIN, the PIN reset, a person without a wallet): 23 byte-identical; the other 2 differ only in a
timestamp of the row I inserted into each database (`openedAt`, `verifiedAt`). In the diff, every changed path takes
its old branch under fintava (the provider filters match every `fintava` and null row, the reset texts the same SMS,
the Fintava client still throws on a wrong value).

**Under nuvion, signed in** (`v9/live-fintava-nuvion-progress.txt`): `/money/wallet` and `/about` answer
`bankName: ""` and `bankCode: ""` (no `NUVION_WALLET_*` set); the balance of a Fintava-held wallet and of a Nuvion-held
one: 503 `provider_unreachable` (W6); `POST /money/identity/bvn`: 503; fee quotes 200 with Fintava's charges (NUV-07's to
change). **The PIN reset through the real wawu-id: its route is missing (404, G-400), so the Hub answers 503
`provider_unreachable` "We could not send the code right now", stores the reset `failed`, and does the same when asked
again; under nuvion a Fintava-held wallet's reset is the same.** No 500 and no ERROR line in the server log.

**Rollback on the built server** (`sweeps`): `pending` ledger rows an hour old with `provider` `fintava`, null and
`nuvion`, and an `unknown` opening per provider. Under nuvion for 75 s: the `nuvion` row claimed (`statusChecks` 1) and
the Nuvion opening checked; the `fintava` and null rows and the Fintava opening untouched. Then under fintava for 75 s:
the `fintava` and null rows claimed and the Fintava opening checked; the Nuvion row and opening as the nuvion run left them.

**Mutants** (32, each applied alone in `/home/user/wt/vn01main` moved to `757780b`, its spec run, the file put back
from a copy and checked with `git diff`; baseline 269/269; `mut/results-all.txt`): 25 killed, 7 survived.
Killed: a one-sided window (future timestamps taken); 13 digits read as seconds; the signature over the body only; no
secret fails open; the window check removed; the signed timestamp stored as the receipt time (a replay under a new id
stored twice); the event id made unique per timestamp (a retry stored twice); the dispatcher's claim ignoring another
worker's lease; a handler's `wait` counted as done; a delivery with no handler marked processed; `already_processing`
read as a refusal; `idempotency_key_mismatch` read as validation; a gateway 4xx page on a write read as refused; a lost
write read as `unavailable`; the base URL matched by prefix; the version pin not enforced; `X-API-Version` not sent; the
balance asking about any provider's wallet; the consumer resolving any provider's wallet; the status sweep's SQL
claiming any provider's rows; a wrong `FINTAVA_*` value never stopping the server; WAWU ID's 404 read as sent; WAWU ID's
5xx read as not sent; the event id check loosened; a limit refusal read as maybe moved.
Survived (test gaps; the code is right): the window edge `<=` to `<`; the window 5 to 15 minutes (the spec derives its
timestamps from the constant; my live check pins 5: 6 minutes refused, 4 taken); the ISO check cut to a date prefix;
the "a 5xx is never a refusal" override removed (no spec sends a 5xx carrying a refusal type; my probe shows
`outcome_unknown`); the seen-cursor set removed (my probe shows the loop A, B, A stopped); `limit` 100 refused (the
edge); a null `provider` read as another provider's (the migration fills every existing row; the live fintava sweep
claimed a null row).

**Defects**
1. `defect` (V1): eslint fails on 4 changed files with 20 errors; the builder reported 0 on all changed files.
   Reproduce on `757780b`: `npx eslint src/nuvion/webhook/nuvion-webhook.service.ts src/wallet-provider/provider-rows.ts
   test/nuvion/nuvion-standin.ts test/nuvion/outbound-guard.ts` gives "20 problems (20 errors, 0 warnings)": 16
   `prettier/prettier` (12 in the stand-in, 2 in the webhook service, 1 each in provider-rows and outbound-guard), and
   in `outbound-guard.ts` `@typescript-eslint/no-base-to-string` (33:20), `unbound-method` (48:20) and two
   `no-unnecessary-type-assertion` (49:30, 58:13). `npx prettier --check` fails on the same four files.
2. `defect` (money mapping): `error_transfer_same_day_cutoff_passed` (400) is `payouts_blocked` with
   `recordMayExist: false`, but errors.md says "Same-day cutoff has passed; transfer will process next business day".
   A transfer Nuvion will still process reads as "nothing moved", and `walletProviderErrorToHttp('payouts_blocked')`
   answers 503 "Payments are not available right now. Try again in a moment.", so a payout (NUV-06) or a dollar wire
   (NUV-09; USD wires are a same-day rail in guides__send-a-payout.md) can go out twice. By the client's own rule ("a
   type that says a write may still be running ... never a refusal to act on") it is an unknown outcome, reconciled by
   its `unique_reference`. Reproduce: `classifyNuvionFailure({ httpStatus: 400, body: { status: 'error', type:
   'error_transfer_same_day_cutoff_passed', message: '...' }, call: 'write' })` gives `payouts_blocked`, and its
   `NuvionError` `recordMayExist: false` (`specs/errmap.txt`, `specs/client-probe.txt`). The spec's table expects the
   same, so it changes with the map. Until the sandbox shows what Nuvion does, the safe reading is `outcome_unknown`.
3. `defect` (seam contract, low): the "already exists" types say a record exists, yet map to `refused` with
   `recordMayExist: false`: `error_account_already_exists`, `error_account_already_verified`,
   `error_counterparty_already_exists`, `error_wallet_already_exists` (409 each). The seam defines `recordMayExist` as
   "True when money may have moved or a record may exist although the call failed", and the opening service already
   keeps the rule "A refusal whose words say the record exists: never read as nothing was made". A create that meets one
   after a lost answer or a double tap (NUV-04's account, NUV-06's counterparty) reads "nothing exists" and fails
   instead of adopting. (A 409 of an unknown type on a write is already `duplicate_reference`.) Reproduce:
   `classifyNuvionFailure({ httpStatus: 409, body: { status: 'error', type: 'error_account_already_exists' }, call:
   'write' })` gives `refused`, and its `NuvionError` `recordMayExist: false` (`specs/client-probe.txt`).

**Findings that are not defects**
4. `unclear` (mapping, for NUV-02): `error_kyc_under_compliance_review`, `error_kyc_enhanced_due_diligence_required`
   and `error_entity_status_due_diligence_required` say "under review" or "Nuvion will follow up", yet read as
   `identity_refused`, which answers 422 "We could not confirm those identity details." NUV-02 can tell them apart by
   `nuvionType` (kept on `NuvionError`) and should, or a person under review is told their details failed.
5. Differs from the report's wording: "a leftover wrong `FINTAVA_*` value no longer stops a Nuvion server" holds for the
   Fintava client's settings, not for the `FINTAVA_FEE_*` schedule, which `FeeSettings` reads and checks at boot under
   any provider. Right today, because the quote still charges Fintava's fees under nuvion until NUV-07;
   `.env.example` should say "a wrong Fintava client setting".
6. `unclear` (`PROVISIONAL(NUVION-WEBHOOK-WINDOW)`, 5 minutes): Nuvion retries a delivery for up to 15 minutes. If a
   retry carries the first attempt's `x-nuvion-event-timestamp` (the docs do not say; the delivery log records headers
   "as sent"), every retry after 5 minutes is refused with 401 and the event is lost after an outage or a deploy
   longer than 5 minutes. A stored delivery can never be stored twice (the event id and the signed pair are unique for
   good), so a window of at least 15 minutes costs no replay safety for anything stored. Unblocked when the sandbox's
   webhook log shows whether a second attempt carries a new timestamp.
7. Undocumented events: a delivery naming an event outside `NUVION_WEBHOOK_EVENTS` is stored `unrecognised`, and the
   dispatcher never reads it again, even after a later task adds that name and a handler; Nuvion stops retrying after
   15 minutes, so only NUV-08's reconciliation could recover it. Documented events that no handler lists do stay
   `pending` (live). A task that adds an event name should also mark its stored `unrecognised` rows `pending`.
8. For NUV-02 and NUV-03 (the client): a lost answer on a `check` call is `unavailable` (`recordMayExist: false`, safe to
   repeat), so anything that creates something at Nuvion (an entity, a document) must be a `write` call. The path guard
   refuses `..` but not `%2e%2e` (`/accounts/%2e%2e/admin` is sent as `/admin`; the host cannot change): the areas
   should `encodeURIComponent` every id they put in a path.
9. Data kept: `NuvionWebhookEvent` keeps each delivery's raw body and parsed copy (names, account numbers, narrations)
   with no person column, so neither the purge map nor the export names it; the same as `FintavaWebhookEvent` today. A
   retention rule for both belongs to a later task.
10. Under nuvion the bank line is empty until NUV-10 sets `NUVION_WALLET_BANK_NAME` (W1, A8 and About show `""`), and
    the lines follow the running provider, not the wallet's row: after a rollback a Nuvion-held wallet shows Fintava's
    bank and code (G-401 says so).

**SHARED-CHANGES NUV-01 #2 (open): what breaks if NUV-04 or NUV-05 writes a Nuvion row before it.**
`LedgerService.recordIn` creates `FintavaLedgerEntry` without `provider`, so the row takes the default `fintava`.
(a) Under nuvion the status sweep claims only `COALESCE(provider,'fintava') = 'nuvion'` (shown live: it claimed the
`nuvion` row and left the rest), so a Nuvion send whose answer was lost is never re-checked by the sweep and stays
`pending`. (b) After a rollback to fintava the Fintava sweep claims that row as its own, asks Fintava for a reference
Fintava never saw, and once the resend-safety time has passed `markAbsentFailed` marks it `failed`
(`LEDGER_ABSENT_FAILURE`) although Nuvion moved the money: history shows a failed send for money that left, and a refund
keyed on a failed debit (MONEY-17's failed payment, a hold's release) would credit it back in our ledger. (c) The
consumer's reversal guard (`anyOtherProvider`) cannot see it as Nuvion's. Rows written straight through Prisma with
`provider: 'nuvion'` are safe; rows written through `LedgerService` are not until #2 lands. #1 is applied (`757780b`,
served on both providers). #3 is open: `PinResetView.sentTo`'s doc line still says a phone
(`src/money/money-view.type.ts:164`), while under nuvion it is a masked email.

**The decisions**
- The receiver mounted through a SHARED-CHANGES row (#1): agree; the lead applied it and it is served under both providers.
- Dedup on the event id and on the signed (timestamp, body); handlers only through the 30-second sweep; events no
  handler lists stay `pending`: agree, shown live (40 replays under 40 forged ids are one row). Finding 7 for
  undocumented events.
- The PIN reset email through WAWU ID, no BVN-proved phone needed by email, the daily limit per person (and phone):
  agree. Consequence: until G-400's wawu-id route ships every PIN reset under nuvion is 503 (shown with the real
  wawu-id), so production must not switch to nuvion (NUV-10) before it.
- `NUVION_WALLET_*` optional and `walletBankCode` empty: acceptable until NUV-10 (finding 10).
- A non-Nuvion 4xx page on a write is an unknown outcome; `error_endpoint_not_found` refused: agree (408 and 413 gateway
  pages probed).
- `decideRetry` advises `wait` until NUV-08: agree; nothing is ever resent. Nuvion answers a repeated `unique_reference`
  with the original transfer, so NUV-08 can resend safely under the same reference.
- `NuvionEntity` one row per person, Nuvion's own status words, masked reasons, `accountDetailsStatus` added: agree for
  the naira account; NUV-09 cannot fit a second (dollar) account in the single `accountId` and `currency`, and needs its
  own columns or table.
- The PROVISIONAL defaults: timeouts and resend safety agree (Fintava's measured values, overridable); the 5-minute
  window: finding 6.

**Mobile** (`ad6a939`): the diff from main is this file, the LOG, BACKEND_GAPS G-400 to G-402, SHARED-CHANGES #1 to #4
and the contract sync (`SOURCE_COMMIT` `wmt/NUV-01@757780b`; `NuvionWebhookAck` lands in the app's types as
`FintavaWebhookAck` already does; the route itself is left out by the `PaymentWebhook` exclusion). No stand-in for
anything on main. `npm run check` with this report and the regenerated index: exit 0 (`mobile/check-report.txt`).

**NOT RUN**
- (key) `GET /bank-codes/NG` through the client against the sandbox: unblocked when a lead brief allows
  `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then
  `scripts/nuvion/bank-codes-check.ts`.
- A real Nuvion delivery (header names, timestamp format, whether a retry carries a new timestamp, finding 6):
  unblocked when NUV-10 registers the webhook and `POST /webhook-tests` reaches it.
- The PIN reset email actually sent: unblocked when wawu-id serves `POST /internal/users/:userId/pin-reset-code`
  (G-400); today it answers 404 and the Hub 503, as shown.
- A stored delivery handed to a real handler on the built server: no handler lists an event until NUV-02 to NUV-08;
  the webhook spec's registry tests cover it (done, wait, failed, two workers, no handler).
- The full suite as one in-band process (three serial shards instead: memory, and load 15 to 32 from other sessions);
  `receipt-units` green (its 300 ms bound needs a load average near 4).

## Lead rulings after the verifier (8 Oct 2026)

Copied from the lead's round 2 brief.

Defects:
1. eslint: 20 errors in `src/nuvion/webhook/nuvion-webhook.service.ts`, `src/wallet-provider/provider-rows.ts`,
   `test/nuvion/nuvion-standin.ts`, `test/nuvion/outbound-guard.ts` (16 prettier, 4 type rules). Fix all; run eslint
   with `--no-fix` on every changed file and report the real count.
2. `error_transfer_same_day_cutoff_passed` is an unknown outcome (`outcome_unknown`, `recordMayExist: true`, never
   resent): Nuvion says the transfer processes next business day.
3. The four "already exists" 409s (`error_account_already_exists`, `_account_already_verified`,
   `_counterparty_already_exists`, `_wallet_already_exists`) carry `recordMayExist: true`, as the seam defines it.

Rulings on the findings:
4. Compliance review (`kyc_under_compliance_review`, `kyc_enhanced_due_diligence_required`,
   `entity_status_due_diligence_required`): a distinct kind meaning "under review, wait", not identity refused, so
   NUV-02 can show "under review".
5. The webhook window: Nuvion's documented retry span (15 minutes) plus 5 minutes, i.e. 20 minutes, in one constant.
   Dedup already makes this safe.
6. Undocumented events: stored so that the dispatcher picks them up once a handler for their type exists (pending, not
   a dead `unrecognised`).
7. The client's path guard also refuses encoded traversal (`%2e%2e`, `%2E%2E`, mixed, double-encoded).
8. SHARED-CHANGES NUV-01 #2: apply it now on this branch. LedgerService stamps the running provider on every row it
   creates and the status sweep and consumers filter by it. MONEY-17 also edits that file; whichever merges second
   resolves it (the lead merges).
9. G-411: backend main now has NUV-07 (8d7a054). Merge origin/main into the branch and make `nuvionLimitError` call
   `providerLimitError('nuvion', type, args)` only for responses below 500 (a 5xx with a limit type stays an unknown
   outcome), keeping Nuvion's request id on the error.
10. Specs that kill the verifier's 7 surviving mutants: the window edge, the window size pinned to the constant's
    value, the ISO timestamp format, 5xx never a refusal, the seen-cursor check, `limit` 100, a null provider.
11. Filed by the lead, not the builder's: webhook event retention (Nuvion and Fintava) as a follow-up; a lost `check`
    call being safe to repeat is for NUV-02 and NUV-03.

## Builder report, round 2

Builder, 8 Oct 2026. wawu-backend `wmt/NUV-01` `4613be8`: the lead's `757780b` (the receiver mounted), then
`fbbfb53` merging origin/main `8d7a054` (NUV-07; no textual conflict), `7bd0c5a` (this round's fixes, 19 files)
and `4613be8` (one fixture in NUV-07's spec, SHARED-CHANGES NUV-01 #6, below).
Mobile `wmt/NUV-01`: `24f092f` (the verifier's report), `d778e45` merging origin/main `eb62049` (NUV-07's rows; the
four conflicts were the shared lists, kept both sides; `docs/PROGRESS.md` rebuilt), then this report. Stand-in only:
no Nuvion, Fintava or wawuafrica.com host was called; every NUV spec ran under the outbound guard and none was tried.

**Defects**
1. eslint (V1): the four files are clean (`npx prettier --write` on them; `outbound-guard.ts` rewritten on a typed
   view of `Socket.prototype` so `connect` is swapped and put back without an unbound method or a cast, and the port
   read only from a number or a string). Then `npx eslint --no-fix` on **every** `.ts` file the branch changes against
   origin/main, 61 files, 4 a run (`bn01/r2-lint.out`): **1 error** in 1 file (`nuvion-client.spec.ts`, an
   unnecessary assertion this round added); fixed, that file and `ledger.service.ts` (edited during the run) linted
   again: **0 errors, 0 warnings on all 61**, and on NUV-07's spec once its fixture changed (62 files in all). `npx prettier --check`: clean.
2. `error_transfer_same_day_cutoff_passed` is `outcome_unknown` (`recordMayExist` true): reconciled by its
   `unique_reference`, never resent; its app answer is "We are still confirming this payment. Check your history
   before you try again." `error_transfer_outside_business_hours` stays `payouts_blocked` (nothing was taken).
3. The four "already exists" 409s keep kind `refused` and now carry `recordMayExist: true`
   (`NUVION_RECORD_EXISTS_TYPES` and `nuvionRecordMayExist` in `nuvion-error.ts`; `classifyNuvionFailure` returns it
   and the client passes it to the error), on a write and on a read.

**Rulings**
4. A new seam kind, `under_review` (`src/wallet-provider/wallet-provider-error.ts`, SHARED-CHANGES NUV-01 #5):
   `error_kyc_under_compliance_review`, `error_kyc_enhanced_due_diligence_required` and
   `error_entity_status_due_diligence_required` map to it, with `recordMayExist` true (the application is with
   Nuvion; never sent again meanwhile). Its app answer is a plain `409` "Your details are being reviewed. We will let
   you know when the review is done." Fintava never produces it.
5. `NUVION_WEBHOOK_WINDOW_MS = 20 * 60_000`, one constant, its comment and `PROVISIONAL(NUVION-WEBHOOK-WINDOW)` why
   saying 15 minutes of retries plus 5 and why dedup keeps it safe.
6. A live delivery whose `event` is a well-formed name (`<group>.<name>`, lower case, at most 100 characters) and
   that carries `data` is stored `pending`, documented or not; `unrecognised` is left for a body with no name, a
   malformed one, or no `data`. The handler interface lists events by name (`readonly string[]`), the registry and
   the dispatcher read them as stored, so a later task that lists an undocumented name is handed the rows already
   stored on the next sweep (proved in the webhook spec). The log names an undocumented event as such.
7. `unsafeSegment` in `nuvion-client.ts`: each path segment is percent-decoded up to 5 times; refused when any form
   is `.` or `..`, holds `/` or `\`, does not decode, or still decodes after 5 rounds. Refused before sending:
   `%2e%2e`, `%2E%2E`, `%2e%2E`, `.%2e`, `%2e.`, `%2e`, `%252e%252e`, `%25252E%25252e`, `%2f..%2f`, `x%2Fy`,
   `%5c..`, `%`, `%zz`, six-deep encoding.
8. SHARED-CHANGES NUV-01 #2 made on the branch: `LedgerService` injects `WALLET_PROVIDER`; `recordIn` stamps
   `provider` with the running provider; `entriesFor` and `debitsFor` read only its rows (null is Fintava's);
   `markAbsentFailed` adds `COALESCE("provider",'fintava') = <running>`; a new sighting whose reference another
   provider's row holds on that side is a stop (`LedgerProviderConflictError`, logged, the transaction rolls back,
   nothing written, never retried by `record`), never a fold. `foreignDebitsFor` gives the consumer its review stop
   (it replaces the consumer's own lookup). The status sweep and the consumer's filters are round 1's. MONEY-17
   also edits this file (constructor and `record`); whichever merges second resolves it.
9. Merged origin/main. `nuvionLimitError` returns NUV-07's `providerLimitError('nuvion', type, ...)` for an answer
   below 500 only, with Nuvion's `requestId` and `nuvionType` kept on it (and ` request <id>` on its message, as on
   every `NuvionError`): a `WalletProviderLimitError`, kind `refused`, nothing moved, `toHttpException()` the
   `403 limit_reached` naming `per_transaction`, `daily` or `monthly`. `NUVION_LIMIT_ERROR_TYPES` is read from
   NUV-07's table (one list). G-411 closed on the branch.
10. The verifier's 7 survivors each have a spec now and are killed (below).
11. Not mine; nothing done.

Also: one 5xx rule for every call. A 5xx carrying any type is never a refusal: on a write, `outcome_unknown` (or
the unknown-outcome kind its type names, `duplicate_reference`); on a read or a check, `unavailable`. Round 1 let a
read's 5xx carry a refusal type's kind. And `.env.example` now says a wrong Fintava *client* setting no longer stops
a Nuvion server, while the `FINTAVA_FEE_*` schedule is still checked at boot (verifier finding 5).

**Specs** (fresh migrated `bn01_spec_test`; mock WAWU ID on :5631; one jest at a time): client 215/215, webhook
30/30, rollback 16/16, adapter 30/30, PIN reset 5/5, seam 18/18 (with the rest of `src/nuvion`,
`src/wallet-provider` and `src/fintava`: 16 suites, 1,032/1,032); `src/money/ledger`, `balance`, `opening` (8 suites,
177/182, then `production-boot` alone 5/5: its 5-second `beforeAll` at load 13, as the verifier saw);
`src/money/history`, `receipts`, `statements` (6 suites, 148/148); `src/money/pin`, `identity` (13 suites,
431/431); and every other spec that mounts MoneyModule, LedgerModule or AppModule, plus `src/money/fees`,
`limits`, `gate`, `recipients`, `saved-accounts`, `src/money/tests`, `src/about`, `src/data-export-request`,
`src/account-purge` (28 suites, 729/753 on the unseeded database: 23 of the 24 need seeded rows and pass on a fresh
seeded `bn01_seed_test`, 4 suites 320/320; the 24th is below).

**The merge with NUV-07** (SHARED-CHANGES NUV-01 #6): NUV-07's `nuvion-fees.contract.spec.ts` stands Nuvion in at
`WALLET_PROVIDER` and creates its wallet row without a provider, which since NUV-01 reads as Fintava's, so its
"the balance (from Nuvion) answers 200" case got NUV-01's rollback 503. The fixture now creates the row with
`provider: 'nuvion'`; nothing it asserts changed (the balance still comes from the stand-in, 4,321,000 kobo):
6/6.

New specs: the window to the millisecond on a fixed clock (exactly 20 minutes taken, 1 ms more refused, both
sides; 19 taken, 21 refused, written out; the constant pinned to 20 minutes); ISO 8601 whole or refused (`Z`,
fractions, an offset taken; a space for `T`, no zone, no seconds, trailing text, a bare date refused even with the
clock at its midnight); undocumented events pending and handed over once listed; only nameless, malformed or
data-less bodies `unrecognised`; the A, B, A cursor loop stopped before the third request; `limit` 100 sent, 0, 101
and 2.5 refused; a 5xx carrying a refusal or limit type never a refusal; the limit types as `403 limit_reached` with
request id; the same-day cutoff, the four "already exists" and the three reviews; encoded traversal; the ledger
stamp, lookups, absent check, fold stop and reversal under both providers; a null-provider wallet and ledger row
treated as Fintava's (balance asked, sweep claims it), never as Nuvion's; `provider-rows` values.

**Mutants** (38, each applied alone, its spec run, the file written back from its copy and checked clean against
HEAD; `bn01/mutants/results2.txt`): **38 killed**. Round 1's 16 again (M10 and M16 re-aimed at this round's code);
14 on this round's code (N1 to N14: the cutoff read as nothing moved; `account_already_exists` saying no record;
review read as identity refused; encoded traversal unchecked; decoded only once; the ledger not stamping; `entriesFor`
or `debitsFor` reading any provider; a fold into another provider's row; the absent check on another provider's
row; a 5xx limit read as a limit refusal; the request id dropped; an undocumented event stored `unrecognised`; the
window back to 5 minutes); and the verifier's 7 survivors (V1 the edge `<=` to `<`, V2 the size changed, V3 the ISO
check cut to a date prefix, V4 the 5xx override removed, V5 the seen-cursor set removed, V6 `limit` 100 refused,
V7a a null provider read as another, V7b Fintava's rows without the null ones).

**Gates and checks**: `tsc --noEmit` 0. Gates: main `8d7a054` 16 fail / 58 warn / 76 accepted on 908 files; branch
16 / 61 / 76 on 944; the 16 FAIL lines byte-identical; the 3 new warnings are `PROVISIONAL(NUVION-TIMEOUTS)`,
`(NUVION-RESEND-SAFETY)`, `(NUVION-WEBHOOK-WINDOW)`, each with `why=` (one draft comment said "is never read" and
the deferrals gate caught it; reworded). Tripwire: 0 added lines match. Key-shaped scan of the staged diff (long hex
or base64 runs, `sk_`, `FLWSECK`, bearer tokens, private-key headers): nothing. Protected suite `scripts/protected-routes/run.sh --fresh HEAD` on `7bd0c5a` (`4613be8` changes one spec fixture only), lock origin/main `8d7a054`, fresh `bn01_protected_test`: 253/253, "all 244 required tests passed".
`npm run contract:build`: `contract/openapi.json` unchanged (sha256 `d859a1a2...20e0b` before and after); against backend main `8d7a054` it adds one path (`POST /api/hub/webhooks/nuvion`) and one schema (`NuvionWebhookAck`), nothing else. Copied into mobile (`contract/SOURCE_COMMIT` `wmt/NUV-01@4613be8`, the same file) and `python3 scripts/api/sync_contract.py` run (exit 0). Against mobile main, whose copy is still from backend `965280e`, the sync also brings backend main's FIX-06 and NUV-07 contract changes; the Nuvion route stays out of the app's types (the `PaymentWebhook` exclusion).
Mobile `npm run check`: exit 0 (typecheck, lint, jest 76 suites / 1,377 tests, gates 0 fail / 0 warn on 346 files, 249 tasks, 279 artboards); its gates and tasks steps run again after the last edit to this report (two lines of text): pass.

**Decisions** (each Default (agent), owner may override)
- `under_review` answers a plain `409` with its own sentence, not a money reason code, so the contract and the app's
  types are unchanged; NUV-02 decides what its own route answers.
- The four "already exists" types keep kind `refused` (with `recordMayExist` true), not `duplicate_reference`: the
  record is there, nothing about money is unknown; NUV-04 and NUV-06 adopt it.
- `error_kyb_under_compliance_review` (WAWU's own business, not a person) stays `refused`; the ruling names the
  person's three.
- The window keeps its `PROVISIONAL` marker at 20 minutes until the sandbox's webhook log shows whether a retry is
  signed anew.
- A well-formed event name is required for `pending` (above); 5 decoding rounds for a path segment.
- A ledger sighting that meets another provider's row is a stop that throws, not a silent skip: the caller (a
  delivery, a send) is left to try again and the error log names the rows.

**NOT RUN**
- (key) `GET /bank-codes/NG` against the sandbox: unblocked when a lead brief allows `api.nuvion.dev` and
  `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then
  `scripts/nuvion/bank-codes-check.ts`.
- A real Nuvion delivery (header names, timestamp format, whether a retry carries a new timestamp): unblocked when
  NUV-10 registers the webhook and `POST /webhook-tests` reaches it.
- The PIN reset email actually sent: unblocked when wawu-id serves `POST /internal/users/:userId/pin-reset-code`
  (G-400).
- The whole suite in a private network namespace: not repeated this round (the round 2 brief names the specs,
  mutants, protected suite, gates, contract and mobile check); every suite in the modules this round touches, and
  every one that mounts MoneyModule, LedgerModule or AppModule, ran instead (above). Unblocked by a lead brief that
  asks for it, or the verifier's own run.
- Built-server runs (boots, live receiver): not repeated this round; the verifier's round 1 runs stand for what did
  not change, and this round's changes are proved in the specs above. Unblocked by the verifier's own pass.

## Verifier report, round 2

Verifier, 8 Oct 2026 (independent; wrote none of this). Backend `wmt/NUV-01` `4613be8` in detached worktree
`/home/user/wt/vn01r2b`; backend main `8d7a054` (the builder's base) in `/home/user/wt/vn01r2main` for every
comparison; the real wawu-id `fb8717e` (origin/main, its own `npm ci`) in `/home/user/wt/vn01r2id`; mobile
`wmt/NUV-01` `b66792f` in `/home/user/wt/vn01r2m`. Evidence: the lead's scratchpad `vn01r2/`. No Nuvion, Fintava or
wawuafrica.com host was called: the built servers ran inside a private network namespace with loopback only (from
there `api.nuvion.dev`, `api.nuvion.co`, `dev.fintavapay.com` and `api.wawuafrica.com` answered `EAI_AGAIN`,
`v9/live-progress.txt`), the client probe talked to my own stand-in on :5763, and the specs ran under the builder's
outbound guard.

**Backend main moved twice during this pass:** `8d7a054` to `8359057` (FIX-11) and then to `6ce2ddf` (LEGAL-03).
Trial `git merge-tree` of each with `4613be8` is clean (trees `472f67e` and `4e83bd2`; the merged contract keeps
`/api/hub/webhooks/nuvion` and `NuvionWebhookAck`); neither move touches the protected lock or any file NUV-01
changes. Nothing was kept or pushed. LEGAL-03 brought `20261016160000_legal_consultations`, which sorts after this
task's migration (defect 1).

**Verdict: building, one defect open (merge order).** Every round 1 defect and every lead ruling holds by its real
cause: eslint is 0 on all 62 changed files, the same-day cutoff is an unknown outcome and never resent, the four
"already exists" 409s and the three reviews carry `recordMayExist: true`, `under_review` answers its plain 409, the
window is 20 minutes either side on the built server, well-formed undocumented events are stored `pending`, encoded
traversal is refused before anything is sent, LedgerService stamps and reads only the running provider in both
directions, Nuvion's limit types below 500 answer `403 limit_reached` with the request id kept while a 5xx stays an
unknown outcome, and NUV-07's fixture change is right. Round 1's 7 surviving mutants are killed now. The one open
defect is the migration stamp, which no longer sorts after backend main since LEGAL-03 merged.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (`v1/tsc-b.log`). **eslint `--no-fix` on all 62 changed `.ts` files (the 61 plus NUV-07's spec): 0 errors, 0 warnings** (`lint/eslint-*.json`, `lint/summary.txt`); `prettier --check` on the same files clean. Gates: main `8d7a054` 16 fail / 58 warn / 76 accepted on 908 files; branch 16 / 61 / 76 on 944; the 16 FAIL lines byte-identical (`gates/main.fail`, `gates/branch.fail`); the 3 new warnings are `PROVISIONAL(NUVION-TIMEOUTS)`, `(NUVION-RESEND-SAFETY)` and `(NUVION-WEBHOOK-WINDOW)`, each with `why=`. Tripwire: 0 added lines match (`v1/tripwire.txt`). `npm run contract:build`: `contract/openapi.json` unchanged (sha256 `d859a1a2...20e0b` before and after); against main it adds one path (`POST /api/hub/webhooks/nuvion`) and one schema (`NuvionWebhookAck`), nothing else (`v1/contract-vs-main.txt`). Mobile `npm run check` on `ad6a939`: first run at load 9 to 15 had two 20 s timeouts in app tests this task does not touch (`OpenWalletScreen`, `settingsScreens`; both pass alone, 128/128); second full run exit 0 (typecheck, lint, jest 76 suites / 1,377 tests, gates 0 fail / 0 warn on 346 files, 249 tasks, 279 artboards; `mobile/check-ad6a939-2.txt`). |
| V2 Contract | passed | Additive only (above). `prisma migrate diff` from a freshly migrated database to the schema: the single known line on main and branch alike (`DROP INDEX "ContentPiece_specializations_idx"`; `mig/diff-*.sql`). |
| V3 Regression | passed (timing aside) | Protected suite `run.sh --fresh HEAD` on `4613be8`, lock origin/main `8d7a054` (lock files identical at `6ce2ddf`), fresh `vn01r2_protected_test`: 253/253, "all 244 required tests passed" (`prot/protected.txt`). Full suite in my own network namespace (copies of t3ns `ns2.sh`/`inner2.sh` as `ns/ns.sh`, `ns/inner.sh`; fresh migrated and seeded `vn01r2_full_test`; mock on :4001 inside it only), three serial `--runInBand --shard=i/3`: 195 suites, 5,139 tests, 5,001 passed, 4 skipped (two suites' own focus), 134 failed, none in a file this task changed: `fintava-stall` 120 and `selfie-match` 1, `money-pin` 1, `dm-refund` 1 (5 s timeouts at load 14 to 18), `hub-rate-limits` 11 (needs a non-loopback interface) (`ns/summary.txt`). Alone: `fintava-stall` 120/120, `dm-refund` 8/8, `hub-rate-limits` 22/22 on the host; `selfie-match` 182/182 and `money-pin` 25/25 with `--testTimeout=60000` (with 5 s at load 12 to 14 each still times out its one whole-table or whole-log test, 181/182 and 24/25; the builder and round 1 saw the same two) (`specs/rerun/`). |
| V6 States | passed | Each from its real cause on the built server: no secret (401 "not configured", nothing stored, also when signed with an empty key), each signing header missing or empty, a stale or future timestamp, an unreadable one, a body that is not JSON (400), broken JSON (400), a 2 MB body (413 before the guard), the database refusing the insert (a trigger: 503, nothing stored; Nuvion's resend then 200 `recorded`, one row), WAWU ID's missing PIN reset route (503). |
| V8 Money | passed for what NUV-01 does (no money moves) | Replay and forgery on the built server, the error mapping and the unknown outcomes (below). |
| V9 Live seam | passed | Signed in through the real wawu-id `fb8717e` (register, email marked proved in its own table, `POST /auth/login`, its JWKS verifying the token); built main `8d7a054` and branch `4613be8` servers on :5762 inside the namespace (below). |

**Specs.** `src/nuvion` and `src/wallet-provider` on a fresh migrated `vn01r2_spec_test`: 6 suites, 314/314 (client
215, webhook 30, rollback 16, adapter 30, seam 18, PIN reset 5), as the builder reported (`specs/nuvion-specs.json`).

**Round 1's defects and the lead's rulings, each by its real cause**
1. eslint (ruling 1): 0 on every changed file (V1). Fixed.
2. Same-day cutoff (ruling 2): through the built client against my stand-in, `error_transfer_same_day_cutoff_passed`
   at 400 is `outcome_unknown`, `recordMayExist: true`, on write, read and check, and its app answer is 503 "We are
   still confirming this payment. Check your history before you try again."; one request each, never resent; at a
   5xx it is `outcome_unknown` on a write and `unavailable` on a read (`specs/errmap.tsv`). Fixed.
3. The four "already exists" 409s (ruling 3): `refused` with `recordMayExist: true` on write, read and check, and
   still true at 500 and 503. Fixed.
4. `under_review` (ruling 4): `error_kyc_under_compliance_review`, `_enhanced_due_diligence_required` and
   `error_entity_status_due_diligence_required` are `under_review`, `recordMayExist: true`, and `toHttpException()`
   is a plain `409` "Your details are being reviewed. We will let you know when the review is done." (no em-dash, no
   provider name). `error_kyb_under_compliance_review` stays `refused` (decision below). Done.
5. The window (ruling 5): one constant, `NUVION_WEBHOOK_WINDOW_MS = 20 * 60_000`, `PROVISIONAL` with `why=`. On the
   built server under both providers: 5.5, 19 and 19.9 minutes old and 19 minutes ahead taken; 20.1, 21 and 60
   minutes old, and 20.1 and 21 minutes ahead, refused 401 and not stored; Unix seconds 21 minutes old refused. The
   spec pins the edge to the millisecond on a fixed clock. Done.
6. Undocumented events (ruling 6): `transfers.exploded`, `Transfers.Settled` (stored lower case) and `a.b.c`, each
   with `data`, are stored `pending`; no name, one part, four parts, a space, a dash, 101 characters, a number, no
   `data`, `data` an array or null, and a top-level array are `unrecognised`; Nuvion's test deliveries are `test`.
   The dispatcher reads `pending` rows of the events its handlers list, by name as stored, so a later handler that
   lists `transfers.exploded` gets the rows already stored (the webhook spec proves the hand-over; my mutant U1 below).
   On the built server no handler lists an event yet, and after two 30-second sweeps every row is as stored,
   `attempts` 0, none claimed. Done.
7. Encoded traversal (ruling 7): 37 paths through the built client; 30 refused with no request sent: `%2e%2e`,
   `%2E%2E`, `%2e%2E`, `.%2e`, `%2e.`, `%2e`, double, triple, four- and five-deep `%25` encodings, `%252%65`,
   `%%32%65`, `%2f..%2f`, `x%2Fy`, `x%2fy`, `%5c..`, `%5C`, a raw backslash, `..`, `.`, `%`, `%zz`, overlong UTF-8
   (`%c0%ae`, `%e0%80%ae`), `%u002e`, upper case `/ACCOUNTS/%2E%2e`, `//host`, `?`, `#`, a relative path. Sent unchanged: `ok-id_01J`, `01J%20X`, `%3f`, `%23`
   and three with a NUL (finding 4) (`specs/client-probe.txt`). Done.
8. SHARED-CHANGES NUV-01 #2 (ruling 8): made on the branch (below). Done.
9. G-411 (ruling 9): each of Nuvion's three limit types below 500 is a `WalletProviderLimitError`, kind `refused`,
   nothing moved, `403 limit_reached` naming `per_transaction`, `daily` or `monthly`, with Nuvion's `X-Request-ID`
   and type on the error and the request id on its message; at 500 or 503 the same types are `outcome_unknown` on a
   write and `unavailable` on a read or check, never a limit refusal. Done.
10. Round 1's 7 survivors (ruling 10): each re-applied as round 1 described it; all 7 killed now (mutants below).
11. Not the builder's (ruling 11).
Also the one 5xx rule for every call: all 153 documented types at 500 and at 503, on write, read and check (918
answers): a write is `outcome_unknown` (or `duplicate_reference` for the 4 types that name it), a read or check
`unavailable`; none is a refusal.

**The client against Nuvion's docs** (the built `dist` client against my own stand-in on :5763; `specs/client-probe.txt`,
`specs/errmap.tsv`):
- Every request (GET, POST, PATCH) carries `Authorization: Bearer <key>`, `Content-Type: application/json`,
  `Accept: application/json` and `X-API-Version: 2026-02-06`. No idempotency header: Nuvion's idempotency key is the
  body's `unique_reference` (api-reference__transfers.md, at most 64 characters), set by the area files.
- Paging: 7 rows at 3 a page, three requests (`limit=3`, `cursor=A`, `cursor=B`), every row once; a loop A, B, A
  stops with `bad_response` after the third page without a fourth request; `has_next` without a cursor, with an empty
  one, or a page without `has_next`: `bad_response`; `limit` 1 and 100 sent, 0, 101, 2.5 and -1 refused before sending.
- My own table from `errors.md` (153 types with their statuses) equals the spec's table and the map's keys
  (`specs/doc-vs-spec-vs-map.txt`). Every type run at its documented status, at 500 and at 503, on write, read and
  check (1,377 answers): the request id and the type kept on every one. Spot-checked 38 against the docs' meaning,
  all agree: `auth_credentials_invalid`, `_revoked`, `auth_permission_denied`, `auth_api_version_not_supported` (auth);
  `auth_verification_token_invalid` and `webhook_signature_invalid` (refused, not a key problem);
  `auth_rate_limit_exceeded` (rate_limited); `validation_error`, `_amount_invalid` (validation);
  `validation_customer_location_restricted` (refused); `entity_status_due_diligence_required`,
  `kyc_under_compliance_review`, `kyc_enhanced_due_diligence_required` (under_review); `kyc_identity_verification_failed`,
  `kyc_sanctions_check_failed` (identity_refused); the four "already exists" (refused, record may exist);
  `account_not_active`, `_suspended`, `_closed`, `transfer_account_not_active` (wallet_inactive, 423);
  `transfer_insufficient_funds` (402); the three limits (403 `limit_reached`); `transfer_same_day_cutoff_passed`,
  `transfer_already_processing`, `idempotency_request_processing` (outcome_unknown); `transfer_outside_business_hours`
  (payouts_blocked); `transfer_compliance_rejected`, `_recipient_flagged`, `_bank_returned` (refused);
  `transfer_network_unavailable`, `resolution_timeout`, `system_internal_error`, `system_maintenance` (unknown on a
  write, unavailable on a read); `resolution_account_not_found`, `resource_not_found` (not_found);
  `endpoint_not_found` (refused); `duplicate_resource`, `idempotency_key_mismatch` (duplicate_reference);
  `concurrent_modification_detected` (refused on a write, unavailable on a read).
- Unknown outcomes on a write, all `recordMayExist: true`, one request each, never resent: no answer (socket cut), a
  timeout before the headers, a body that stalls, a 2xx cut mid-body (`not_confirmed`), a 4xx cut mid-body, a 502 HTML
  page, an empty 500 or 504, a 404 HTML page, a 409 with no body, a 2xx without the envelope, a 302 to another port
  (not followed), a 6 MB answer (`not_confirmed`). The same on a read is `unavailable` or `bad_response`. 429 keeps
  `Retry-After: 120`; an HTTP-date falls back to 30. A request id with a space is dropped. The key never appears in
  an error or its messages (a 401 quoting it reads `[secret]`).

**The receiver on the built server** (`v9/live-progress.txt`; the same under `nuvion` and under `fintava` with
`NUVION_WEBHOOK_SECRET` set): a signed `inflows.completed` 200 `recorded`; the same again 200 `duplicate`; the same
event id with a new timestamp 200 `duplicate`; **the exact signed delivery under a changed event id 200
`duplicate`, again with the signature in upper case, and again with spaces around the timestamp header: one row**;
a changed id with the old signature over a timestamp 1 ms later, the same instant written `+00:00`, or the body plus a
trailing space: 401. 40 copies of a new delivery at once: 1 `recorded`, 39 `duplicate`, one row; **40 replays at once
under 40 different event ids: 1 `recorded`, 39 `duplicate`, one row**. 401 and nothing stored: a wrong signature,
another secret, a signature over the body only or over `{body}.{timestamp}`, base64, a `sha256=` prefix, 63 hex
digits, two signatures joined, a body changed after signing, each header missing or empty, the timestamps above, an
ISO time without a zone or with a space for `T`, a bare date, `yesterday`, a microsecond epoch, `-1`, trailing text,
an event id with a space, a slash or 129 characters. 200: ISO with `+01:00`, 9 fraction digits, Unix seconds and ms,
`application/json; charset=utf-8`, a 90 KB body. 400: `text/plain`, broken JSON, a top-level `null`. 413: 2 MB. A
burst of 150 valid and 150 forged: 150 × 200 and 150 × 401, no 429. The answer is `{statusCode, message, data:
{outcome, event}}` as the contract says. No secret, signature or body text (a phone number in the narration) in the
server log; 0 ERROR lines; undocumented events are logged by name, unrecognised ones only as "unrecognised event".

**The switch on the built server** (44 boots, `v9/live-progress.txt`): unset, `fintava`, `  FINTAVA `, blank, `nuvion`,
` NUVION `, the production host, trailing slashes, spaces around the URL and the pinned version boot (health 200,
"Nuvion adapter ready (sandbox)" or "(production)", the receiver mounted: 401 unsigned). Each of `NUVION_BASE_URL`,
`NUVION_API_KEY` (also blank), `NUVION_WEBHOOK_SECRET` (also blank) and `NUVION_OPERATIONAL_ACCOUNT_ID` missing: exit 1
naming it and the rollback. A base URL with `http://`, `:443`, `/v1`, `?x=1`, `/.`, upper-case host or scheme,
`.evil.example`, `@evil.example`, a trailing dot, `.com`, or `http://127.0.0.1:5763`: exit 1 naming
`NUVION_BASE_URL` and the two hosts. A bad operational id, money timeout or resend safety, or `NUVION_API_VERSION=
2026-01-01`: exit 1 naming each. Under nuvion a wrong `FINTAVA_TIMEOUT_MS`, `FINTAVA_MONEY_TIMEOUT_MS`,
`FINTAVA_BASE_URL` or `FINTAVA_RESEND_SAFETY_MS` boots with the warning; under fintava the first and third still exit 1.
Under nuvion a wrong `FINTAVA_FEE_BANK_TRANSFER_KOBO` or `FINTAVA_FEE_BALANCE_TRANSFER_BANDS` still stops the server
(`FeeConfigError`; finding 3). `fintava` or unset with wrong `NUVION_*` values boots; `flutterwave` and `nuvionx` exit 1.

**Fintava unchanged** (`v9/fintava-main.json`, `v9/fintava-branch.json`): main `8d7a054` and branch `4613be8` built,
`WALLET_PROVIDER` unset, the same signed-in person with the same wallet row (on the branch the row takes the column's
default, `fintava`); 29 answers (12 fee quotes with their parts and signed claims, the wallet, the balance, About,
identity, PIN, history, beneficiaries, payout account, setting the PIN, the PIN reset twice, a person without a
wallet, an unsigned Fintava webhook): 27 byte-identical; the other 2 differ only in the timestamps of the rows I
inserted into each database (`openedAt`, `verifiedAt`).

**Under nuvion, signed in** (same harness): `/money/wallet` and `/about` answer `bankName: ""`, `bankCode: ""` (no
`NUVION_WALLET_*` set); the balance of a Fintava-held wallet and of a Nuvion-held one: 503 `provider_unreachable`;
every fee quote 503 `fees_not_set` (NUV-07, R-42); `POST /money/identity/bvn` 503. **The PIN reset through the real
wawu-id, whose route does not exist (G-400): 503 `provider_unreachable` "We could not send the code right now. Try
again in a moment.", the reset stored `failed`, the same when asked again, for a Nuvion-held and a Fintava-held
wallet; no 500, no ERROR line, no code and no key in the log.**

**Rollback on the built server** (`v9/live-progress.txt`, SWEEPS): `pending` ledger rows two hours old with `provider`
`fintava`, null, `nuvion` and an unknown value, and an `unknown` opening for `fintava`, null and `nuvion`. Under nuvion
for 80 s: only the `nuvion` row claimed (`statusChecks` 1) and only the Nuvion opening checked. Then under fintava: the
`fintava` and null rows claimed and their openings checked; the Nuvion row and opening as the nuvion run left them.
Then under nuvion again: the Nuvion row claimed a second time; nothing of Fintava's touched. Every row stays `pending`
(never failed as absent); the unknown-provider row is touched by neither; 0 ERROR lines.

**SHARED-CHANGES NUV-01 #2, now made on the branch.** `LedgerService` injects `WALLET_PROVIDER`; `recordIn` stamps
`provider` on every row it creates (the only writer of `FintavaLedgerEntry`; the opening and wallet writers stamp too:
those are the only three creates in `src/` outside specs); `entriesFor` and `debitsFor` read only the running
provider's rows (null is Fintava's); `markAbsentFailed` adds the provider to its SQL; a sighting whose reference
another provider's row holds on that side throws `LedgerProviderConflictError` inside the transaction, which rolls
back (nothing written), in both directions (the rollback spec runs it under fintava against a Nuvion row and under
nuvion against a Fintava row); `applyReversal` finds only its own provider's debits, and the consumer stops for
review on `foreignDebitsFor`. The status sweep catches the error per row and leaves the row pending; the consumer
backs the delivery off (up to an hour) and leaves it pending. My mutants L2 and L3 (below) are killed. What would
break if NUV-04 or NUV-05 wrote a Nuvion row without it is round 1's (a) to (c) (the Nuvion sweep never re-checking
it; after a rollback Fintava's sweep failing it as absent although Nuvion moved the money; the reversal guard blind
to it). With #2 on this branch, a row written through `LedgerService.record` is safe; a row written straight through
Prisma without `provider` still takes the default `fintava`, so any later writer must stamp it. MONEY-17
(`origin/wmt/MONEY-17` `cd47278`) writes only through `ledger.record`; a trial `git merge-tree` with this branch
merges `ledger.service.ts` without a conflict (only `contract/openapi.json` conflicts, regenerated); its new
`notifySettled` reads a row by id and is not provider-specific.

**NUV-07's fixture (SHARED-CHANGES NUV-01 #6).** The diff is the one field `provider: 'nuvion'` (and its comment) in
`withWallet()`; no assertion changed. With it the spec is 6/6; with main's fixture put back it is 5/6, the failing
case being "read-only routes are unaffected: the balance (from Nuvion) ... answer 200", which gets 503 because the row
reads as Fintava's and its stand-in is named `nuvion` (`specs/nuv07-*.txt`). Right: the stand-in plays a Nuvion server,
so its wallet must be Nuvion's.

**The migration.** Fresh migrate and seed: passed (the namespace run and three live databases). Additive: two
tables, one enum, indexes, and a nullable `provider` text column with default `fintava` on three tables; no DROP,
RENAME, column change or data update (`mig/destructive-grep.txt`). Main's migrations, then a wallet, an opening and a
ledger row, then this migration: all three rows read `fintava`; the columns are nullable with default `'fintava'`
(`mig/provider-cols.txt`). The stamp is unique across origin/main and all 78 origin/wmt/* branches, but no longer the
newest (defect 1).

**Mutants** (29, each applied alone in `/home/user/wt/vn01r2b`, its spec run against a baseline of 291/291, the file
written back from its copy and the worktree checked clean against HEAD; `mut/results.txt`,
`mut/results-r1survivors.txt`): **25 killed, 4 survived**.
My own 22: killed B1 (a 500 with a refusal type read as that refusal), B2 (a 500 to 503 with a limit type answered as
`limit_reached`), B3 (a gateway 404 page on a write read as `not_found`), E1 (exactly 20 minutes refused), W1 (window
15 minutes), W2 (one-sided window), W3 (an ISO time without a zone taken), P2 (one page past `maxPages`), L1 (the
dispatcher ignoring another worker's lease), L2 (a fold into another provider's row), L3 (`markAbsentFailed` on
another provider's row), M1 (the cutoff read as nothing moved), M2 (`counterparty_already_exists` saying no record),
M3 (enhanced due diligence read as identity refused), M4 (`under_review` answered as the default 503), G1 (no secret
no longer refused first), G2 (the backslash check removed), G3 (an empty key sent as a bearer). Survived (the code is
right; specs do not cover them): **S1** a refused insert answered `200 duplicate` instead of 503, which would lose the
delivery for good (no spec makes the store fail; on the built server it answers 503 and the resend is stored once);
**R1** the status sweep's claim reading a null provider as the running one (under nuvion a pre-column Fintava row
would be claimed, then skipped by `checkOnce`'s own provider check; no spec puts a null-provider pending row under
nuvion; on the built server it is not claimed); **B4** a `Retry-After` above 60 seconds dropped (no spec sends one
above 60; my probe shows 120 kept); **U1** a four-part event name stored `pending` (no spec sends one; on the built
server it is `unrecognised`).
Round 1's 7 survivors, re-applied: all killed (V1 the edge, V2 the size, V3 the ISO check cut to a date, V4 the 5xx
override removed, V5 the seen-cursor set removed, V6 `limit` 100 refused, V7 a null provider read as another).

**Defects**
1. `defect` (merge order, low): the migration `20261016150000_nuvion_adapter` no longer sorts after every folder on
   backend main. LEGAL-03 merged after this branch's head (main `6ce2ddf`) with `20261016160000_legal_consultations`
   (it had picked that stamp to sort after this branch's). The common rule is that a new migration sorts after every
   folder on origin/main. Reproduce: `git ls-tree --name-only origin/main prisma/migrations/ | tail -2` on backend
   gives `20261016160000_legal_consultations`, which sorts after `20261016150000`. What it does if merged as it is:
   on a database that already has LEGAL-03's migration, `prisma migrate deploy` applies this one after it without
   an error (shown on `vn01r2_order_test`: `migrate status` lists it as not applied, `deploy` applies it,
   `_prisma_migrations` then records 150000 after 160000; `mig/order-*.txt`), so production would apply the two in
   the opposite order to a fresh database. The two touch different tables, so the schema comes out the same; the
   order rule is what breaks. Fix when origin/main is merged in: rename the folder to a stamp after
   `20261016160000` that no origin/wmt/* branch holds (none holds one after it today), and run the checks again.

**Findings that are not defects**
1. Test gaps (my survivors S1, R1, B4, U1, above): the code is right on the built server or in my probe for each; S1
   matters most, since a later change that swallowed a failed insert would lose a delivery and no spec would fail.
2. `prisma/schema.prisma` still says `unrecognised` is "Not one of Nuvion's documented events (or none)"; since
   ruling 6 it is a body with no well-formed name or no `data`, and undocumented well-formed events are `pending`.
   The doc comment only.
3. Under nuvion a wrong `FINTAVA_FEE_*` value still stops the server (`FeeConfigError` from NUV-07's `FeeSettings`,
   read under any provider). `.env.example` now says so (round 1 finding 5). Acceptable: those figures are the
   rollback's quotes, so failing early keeps a rollback from starting on a broken schedule. The task line "a wrong
   `FINTAVA_*` value no longer stops a Nuvion server" holds for the Fintava client's settings only.
4. The path guard sends a segment holding a NUL (`a%00b`, `..%00`, `%2e%2e%00`); none is a dot segment to the URL
   parser and the host cannot change, so it is not traversal. The areas should still `encodeURIComponent` every id.
5. Cosmetic: "the answer is over 5242880 bytes" reaches the error and log as "over ***2880 bytes" (the digit mask).
6. SHARED-CHANGES NUV-01 #3 is still open: `PinResetView.sentTo`'s contract line says a phone
   (`src/money/money-view.type.ts:164`), while under nuvion it is a masked email.

**The decisions (round 2; round 1's stand as judged there)**
- `under_review` as a plain 409 with its own sentence, no reason code: acceptable while no route can answer it. The
  money routes' rule is that every refusal fills `reason` and the app switches on `reason.code` (CONVENTIONS section
  3); the plain 422 for `identity_refused` is the precedent, but NUV-02 should give "under review" a reason code
  before its route can answer it, or the app shows its generic error to a person who only has to wait.
- The four "already exists" keep kind `refused` with `recordMayExist` true, not `duplicate_reference`: agree. Nothing
  about money is unknown, and `duplicate_reference` would send a create into money reconciliation. NUV-04 and NUV-06
  must catch and adopt: `toHttpException()` alone answers 503 "Payments are not available right now".
- `error_kyb_under_compliance_review` stays `refused`: agree. It is WAWU's own business entity, not a person waiting.
- The window keeps `PROVISIONAL` at 20 minutes until the sandbox log shows whether a retry is signed anew: agree.
  Dedup is permanent, so the wider window costs no replay safety for anything stored (shown above).
- A well-formed name required for `pending`, and 5 decoding rounds: agree (everything deeper is refused, not passed).
- A ledger sighting that meets another provider's row is a stop that throws: agree. It is never folded and nothing
  is written. The delivery or row stays pending with an ERROR log that names the rows, and backs off to hourly. It
  never reaches a terminal state on its own, so the logs are where review finds it.

**Mobile** (`b66792f`): the diff from mobile main is this file, four LOG lines, `docs/PROGRESS.md`, BACKEND_GAPS
G-400 to G-402 and G-411's closing line, SHARED-CHANGES NUV-01 #1 to #6, and the contract sync (`contract/SOURCE_COMMIT` `wmt/NUV-01@4613be8`; the
Nuvion route stays out of the app's types under the `PaymentWebhook` exclusion). No stand-in for anything on main.
Mobile main has since moved to `d693629` (FIX-11 and lead notes); nothing in it touches this task.

**NOT RUN**
- (key) `GET /bank-codes/NG` through the client against the sandbox: unblocked when a lead brief allows
  `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then
  `scripts/nuvion/bank-codes-check.ts`.
- A real Nuvion delivery (header names, timestamp format, whether a retry carries a new timestamp): unblocked when
  NUV-10 registers the webhook and `POST /webhook-tests` reaches it.
- The PIN reset email actually sent: unblocked when wawu-id serves `POST /internal/users/:userId/pin-reset-code`
  (G-400); today it answers 404 and the Hub 503, as shown.
- A stored delivery handed to a real handler on the built server: no handler lists an event until NUV-02 to NUV-08;
  the webhook spec's registry tests cover it (done, wait, failed, two workers, no handler, an undocumented event
  listed later).
- The full suite as one in-band process (three serial shards instead: memory, and load 12 to 18 from other sessions);
  `selfie-match` and `money-pin` at their own 5-second timeouts: they need a load near 4.

## Lead merge note (8 Oct 2026)

Merged after two independent verifier rounds (round 2 report 7d9d9ba) and backend PR #91 (merge 657a152): the Nuvion adapter behind the wallet provider seam, Nuvion's webhook receiver (POST /webhooks/nuvion: signature and 20-minute window, one row per event id, 401 for forgeries, 503 when the store refuses), the ledger stamping and reading the running provider's rows only, and the limit errors mapped with NUV-07 (G-411 closed). Fintava stays the running provider; nothing changes for anyone until WALLET_PROVIDER=nuvion and NUV-10's live setup. Round 2's only defect (the migration stamp sorted before LEGAL-03's once that merged) was closed by the lead at merge: 20261016180000_nuvion_adapter, SQL unchanged, applied last on a fresh database. The lead merged backend main 38a0dca (TIER-01) first; the regenerated contract adds only /webhooks/nuvion and NuvionWebhookAck. Protected suite 253/253 on the PR. Carried forward: NUV-02 gives under_review a reason.code before any route answers it; NUV-04 and NUV-06 catch and adopt the already-exists refusals; any direct Prisma writer of a ledger row must stamp provider; NUV-01 #3 (PinResetView.sentTo doc line) goes with the next Nuvion merge; G-400 (wawu-id pin-reset-code route); four mutants survive as spec gaps (S1, R1, B4, U1).

## Owner sign-off
