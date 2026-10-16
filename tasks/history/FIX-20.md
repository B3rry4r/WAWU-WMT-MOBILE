# FIX-20 · round history

Moved out of [tasks/FIX-20.md](../FIX-20.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 11 Oct 2026 (the lead's agents). wawu-backend `wmt/FIX-20` `bb9bbd1` (backend main `2a4b9a4` merged); this repo
`wmt/FIX-20` (the tip of this branch) (main `3e5b7cb` merged). Migration `20261021230000_webhook_body_retention` (the lead renames the stamp at
merge; `rollback.sql` beside it). No route and no contract change: `contract:build` run twice gives the same bytes both times and
the bytes main already holds. No Fintava, Nuvion, Flutterwave, wawuafrica.com or AI host was called: the contract spec ran under
the outbound guard, the built Hubs ran against a local Fintava stand-in, every delivery was signed here with a local secret.

**Built** (backend)
- `src/webhook-retention/` (new). A daily job at 02:40 server time (`@Cron('0 40 2 * * *')`, named `webhook-retention`) clears
  `rawBody` (to empty bytes) and `payload` (to JSON null) of a delivery in `FintavaWebhookEvent` and `NuvionWebhookEvent` once it was
  received more than `WEBHOOK_RETENTION_DAYS` ago (default 90, whole days 7 to 3650, anything else stops the app at boot,
  `PROVISIONAL(WEBHOOK-RETENTION-DAYS, owner=YOU)`, the one new warn in the gates) and its state says no reader needs it.
  `webhook-retention-config.ts`: the setting, the state table (typed over each Prisma enum, so a new state does not compile until
  it is classified) and the list of every reader of the two tables. `webhook-retention.service.ts`: the job. The module is imported
  by `FintavaWebhookModule` and `NuvionWebhookModule`, which AppModule already mounts under every provider, so `src/app.module.ts`
  is untouched (SHARED-CHANGES FIX-20 #2).
- One batch is one statement: `WITH due AS MATERIALIZED (SELECT id ... LIMIT 200 FOR UPDATE SKIP LOCKED) UPDATE ... SET rawBody =
  ''::bytea, payload = 'null'::jsonb, bodyClearedAt = :now`. At most 200 rows and one transaction a statement; no new statement
  starts on a table after 10 minutes; a table that fails is reported by error name and does not stop the other.
- Migration (additive, lead ruling 5): a nullable `bodyClearedAt` on both tables; a CHECK on each that a row marked cleared has an
  empty body, a JSON null `payload` and, on Fintava's, its `bodySha256`; a partial index on each, `(processingStatus, receivedAt)
  WHERE bodyClearedAt IS NULL`.
- The rule is written in `docs/contract/CONVENTIONS.md` section 21 (numbered 21 because MONEY-16 and WALLET-16 each add a 19), in the
  comments of the purge map and the export list ("retention, not the purge, covers these rows"), in the README (which also said the
  Fintava key was still (event, reference, status); it has been `bodySha256` since MONEY-08 round 3) and in `.env.example`.

**Who reads these tables (lead ruling 1).** Found by scanning every file on backend main and on the four branches in flight
(`wmt/MONEY-16` `61e2b08`, `wmt/WALLET-10` `5e57a09`, `wmt/NUV-06` `d6a303a`, `wmt/WALLET-16` `18ea4fb`; none adds a reader): the ledger
sweep reads the payload of `pending` Fintava rows only, locked and re-checked as `pending`; `LedgerService.markAbsentFailed` reads
`dataReference` and `dataCustomerReference` of any row (columns the job keeps); the Nuvion dispatcher reads the payload of `pending`
rows only and hands each handler `delivery.data` (the handlers never query the table, and re-fetch from Nuvion, NUV-05); the two
receivers only insert; `scripts/fintava/ledger-sandbox-check.ts` prints a state and a note. MONEY-16 reads neither table; WALLET-10
reads the ledger row and says "never from the webhook event". `webhook-retention-readers.spec.ts` scans the source and fails when a
file touches either table without being on the list, or a listed file stops doing so.

**Decisions** (all Default (agent), owner may override)
1. Cleared: `processed` (both tables) and Nuvion's `test` (no data, nothing acts on it). Held whatever the age: `pending` (a consumer
   has not used it: the sweep and the dispatcher read it; Fintava cards, WALLET-22, and a Nuvion event no handler lists wait for a
   consumer; a server on the other provider leaves it for a rollback), `failed` (a stop for review: the body is the evidence) and
   `unrecognised` (kept for review; how a real payload format is learned). Nothing marks a review closed, so a held row stays until
   a consumer or a person is done with it (G-750). The job counts the held rows past the period in its log line.
2. The clock is `receivedAt`, strictly older than the period (a row exactly a period old waits one more day), not `processedAt`, as the
   task says; a row that waited for its consumer is cleared the day after it is processed.
3. "Cleared" is empty bytes, JSON null and a marker, with both columns still NOT NULL: no type is widened. The marker tells cleared from
   arrived-empty, keeps the job idempotent and cheap (the partial index), and is what the CHECK hangs on.
4. A Fintava row without `bodySha256` is never cleared (the key its repeat check reads; every row has one).
5. What a cleared row keeps: id, event, references, the hash or event id, the outcome and the times; G-752 lists the columns for the
   owner's privacy view.
6. The bounds 7 to 3650 (7 is more than twice the longest a provider retries: Fintava 72 hours, Nuvion 15 minutes), batch 200,
   a 10 minute budget a table and 02:40 are mine.
7. Retention runs under every `WALLET_PROVIDER`: a server on nuvion still clears Fintava's processed rows.

**Capability checks**
1. *A delivery older than the period has no body after the job runs; a newer one is untouched.* **Passed.**
   `webhook-retention.contract.spec.ts` (real database, the real routes, deliveries signed locally): an old finished delivery has 0
   bytes and a null payload, the personal data is gone from both by SQL, every other column equals what it was; 89 days 23 hours,
   10 days and 1 day are untouched; exactly a period old is kept and one millisecond older is cleared; old `pending`, `failed` and
   `unrecognised` rows on both tables keep their body and the run counts them; a Fintava row with no hash is kept; Nuvion's `test` is
   cleared. On two built Hubs: 20,130 Fintava and 20,120 Nuvion finished rows cleared, none left, the 20 `failed`, 20 `pending` and 20
   `unrecognised` of each table untouched, no fresh row cleared (the Hubs' log lines `hub-6461-round1.log` and `hub-6462-round1.log`, the sender's `sender-round1.jsonl`, in the lead's scratchpad `f20/hub/run/`; the database was dropped at the end).
2. *A cleared delivery sent again is refused as a repeat (both providers).* **Passed.** Fintava: the same signed body through the route
   answers `200 duplicate` three times, writes no row, puts nothing back, and the ledger is not told again (a money-in applied by the
   ledger, cleared, sent again: still one ledger row; `consume` of the cleared row is `skipped`). Nuvion: the same event id with a new
   timestamp, the same event id with another body, and the same signed pair under another event id all answer `200 duplicate`; a
   counting handler was told once and `dispatch` of the cleared row is `skipped`. On the built Hubs, after the job: all 200
   route-delivered Fintava bodies, the 10 ledger ones and 400 Nuvion deliveries (two ways) answered `200 duplicate`; the ten wallets
   credited by the Hub's own sweep still have exactly one ledger row of 10,000 kobo each after clearing, the repeats and two more sweeps.
3. *The job is safe to run twice, and while a delivery is arriving.* **Passed.** Spec: a second run clears 0 and writes nothing (the
   rows are equal); one process runs the job once at a time; two services on two connections clear 80 rows between them (the
   `bodyClearedAt` stamps add up to the two reports) and skip three rows a consumer holds without waiting, which the next run clears;
   with a clearing statement held open on two rows, a new delivery is recorded at once, the job skips the held rows, and a repeat of
   a held row answers `200 duplicate` once the statement commits (Postgres makes an insert that conflicts with a row being updated
   wait for the updater: a repeat of a row in the batch being cleared waits for that one statement, milliseconds for 200 rows, and
   a repeat of any other row does not wait); no statement clears more than the batch; a spent budget leaves the rest. Built Hubs (two
   processes, one database, the registered cron job's own tick fired on both within 7 ms of each other, 60 deliveries a second across
   both from 25 seconds before to 30 after, half of them repeats of rows already stored, some in the batch being cleared): Fintava 9,330 + 10,800 and Nuvion 9,209 +
   10,911 cleared, each row once (the sums are the rows that were due), all 3,135 deliveries `200` with no row made by a repeat,
   p50 19 to 26 ms and a worst of 159 ms in the five seconds of the run; a second round cleared 52 + 200 and 584 + 200, and a third
   firing at once cleared 0 and 0 on both; the sender's 1,694 deliveries of that round, all repeats of rows already stored (some cleared a moment before), were all `200 duplicate`.
4. *Protected routes 253/253.* **Passed, 253/253** (all 244 required), `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace on a fresh migrated and seeded database: code `bb9bbd1`, lock `origin/main` `2a4b9a4`, exit 0 (`protected.log`).

**Counts** (before = backend main `2a4b9a4`, after = the branch)
- `npx tsc --noEmit`: 0 errors, exit 0. `eslint --no-fix` on the 10 changed `.ts` files: 0 errors and 0 warnings, exit 0.
- Gates: before 16 fail, 97 warn, 76 accepted (1,169 files); after 16 fail, 98 warn, 76 accepted (1,175 files). The 16 FAIL lines are
  the same files and lines as main's; the one new warn is `PROVISIONAL(WEBHOOK-RETENTION-DAYS)`. `check_baseline.py`: 108 entries, every
  accepted violation has an owner and a reason.
- `npm run contract:build` twice: the same `contract/openapi.json` both times (sha256 `aac7a1d2...a8dd`), and the same bytes main holds.
  `npm run test:netns`: passed, 16 rows, none wrong.
- New specs, 44 tests in 3 files (`webhook-retention-config.spec.ts` 20, `webhook-retention-readers.spec.ts` 4,
  `webhook-retention.contract.spec.ts` 20), all pass; the existing webhook, ledger, purge and export specs pass beside them.
- The lead's list, in private network namespaces (`unshare -n`, the mock WAWU ID on :4001 inside, Postgres through a unix-socket bridge),
  one jest process and one fresh migrated and seeded database each: `src/fintava`, `src/nuvion`, `src/wallet-provider`,
  `src/account-purge`, `src/data-export-request` and `src/webhook-retention`: 35 suites, 2,736 tests, 34 suites pass; `src/money` in two
  shards: 58 suites, 1,411 tests (860 + 551), 55 pass. The 4 suites that failed in all are load or container limits, none from this task, each
  rerun: `fintava-stall` (6 timing assertions at load 20 or more) 120 of 120 alone on the host; `selfie-match` (one 5 s limit) 182 of 182 with
  `--testTimeout=120000`; `recipient-throttle` (a 5 s hook, 13 tests) passes with the same flag; `receipt-units` has 4 tests about the Unicode
  digit table that fail the same way on backend main `2a4b9a4` in this container (Node 22.22.0 holds 1,154 digit characters, the table 1,151),
  and its 300 ms drawing bound failed at 422 and 308 ms under load.
- Two built Hubs (the built `dist/` app booted as `src/main.ts` boots it, by a small wrapper that also fires the registered cron job; one
  database; 20,000 old rows a table plus 400 delivered through the routes): see check 3. One run over
  100,000 old rows (50,000 a table, 2 KB bodies): 10.9 s, 502 statements, none over 200 rows, statement p50 19 ms, p95 43, p99 73, max 288
  ms at a load average of 20 (`hub/run/load-result.txt`).

**Mutants** (nine, on a copy of the branch; each run over the three retention spec files, 44 tests): all nine killed.
`<` to `<=` (boundary test); no `bodyClearedAt IS NULL` guard (second-run test); `failed` made clearable (held-state test and the
unit spec); `FOR UPDATE` without `SKIP LOCKED` (two-server test); the update also nulls `bodySha256` (the CHECK and every repeat test);
`LIMIT` times 1000 (bounded-run test); `test` not clearable (Nuvion test); no in-process guard (one-at-a-time test); no hash guard on
Fintava (the CHECK and the no-hash test).

**NOT RUN**, each with what unblocks it
1. A real provider re-delivery (Fintava or Nuvion sending a delivery again after its body was cleared). There is no tunnel and no
   provider key here (R-25, R-20). Unblocked by OPS-10 registering the production URL and a real delivery older than the period; until
   then the evidence is a signed delivery of the documented format through the real route.
2. A Hub on `WALLET_PROVIDER=nuvion` with Nuvion's adapter running. `NUVION_BASE_URL` is pinned to Nuvion's two hosts, so a local stand-in
   cannot sit behind a Hub. Both built Hubs ran on the default provider; the Nuvion receiver, table and cron job are the same under
   every provider (the module is mounted under each), and Nuvion deliveries were received and cleared by them. Unblocked by NUV-10
   (a sandbox key) or a test-only base URL.
3. Waiting for 02:40 on a wall clock. The registered job's own tick (the callback 02:40 fires) was fired in a spec and on both built
   Hubs, and a spec pins the expression.
4. The job at production size, with bodies that do not compress, and the space it frees: measured at 100,000 rows only. Clearing leaves
   dead tuples that autovacuum reclaims later. Unblocked by a copy of production's two tables.
5. The whole backend suite end to end: only the lead's list ran (above). The mobile `npm run check` in full: only `npm run gates` and
   `npm run tasks` ran, as asked.
6. V10 (device), V5 and V6: no screen in this task.

**Gaps and shared changes filed.** BACKEND_GAPS G-750 (held rows have no end: nothing closes a review), G-751 (only the job's log line
reports them; MONEY-16 could), G-752 (what a cleared row still holds, for the owner's privacy view). SHARED-CHANGES FIX-20 #1 (the
migration and the schema comments, applied on the branch under the lead's ruling), #2 (`app.module.ts` not needed), #3 (the section
number).


## Verifier report

_Not started._

