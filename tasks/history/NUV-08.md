# NUV-08 · round history

Moved out of [tasks/NUV-08.md](../NUV-08.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 17 Oct 2026. Backend `wmt/NUV-08` `f48fddd` (on `wmt/MERGE-7` `0be61a4`; pushes `5b756e2`, `b515d78`). Specs run on the Nuvion stand-in only.

**Docs were not on the machine.** The lead's saved Nuvion docs (`nuvion/docs/`) were wiped with the container, so the
wire shapes for statements, webhook subscriptions and fee simulations are ASSUMED from the task text and the transfer
object other pages show. Every one is read in `src/nuvion/areas/reconcile-readers.ts` (header lists them) and built in
`src/nuvion/areas/reconcile.ts`. The verifier compares them with `api-reference__accounts.md` and
`api-reference__webhooks.md`; a difference is a one-function fix. Request names to check: statement `year`, `month`,
`include_pending`; `PATCH /entity-webhooks/{id}` `{expires_in}`; `POST /fee-simulations` body.

**Built**
- `areas/reconcile.ts`: `listTransactions` (statement month by month, every page of a month, kept a minute; fee and running
  balance on each line, person and operational), `statementOfMonth`, `statementSince`, `getTransfer`, webhook list and
  renewal, `simulateFee`, id lookups widened to every rail (adapter falls back to it).
- `handlers/reconcile.handler.ts` (minute cron, only under nuvion), `reconcile-sweep.ts`, `reconcile-checks.ts`,
  `reconcile-findings.ts`, `reconcile-config.ts` (5 optional settings, PROVISIONAL tags, in `.env.example` and `deploy/README.md`).
- The sweep never credits: it STORES the missed movement as the delivery a webhook would have been
  (`reconcile-<transferId>-<event>`), for the NUV-04/05/06 handlers, which read it back and write the ledger once.
- `ProviderTransaction` gains optional `direction`, `balanceAfterKobo`. Migration adds `NuvionReconcileFinding`.

**Capability checks**
1. Missed inflow found and credited once, late delivery changes nothing (V8): passed (`nuvion-reconcile.contract.spec.ts`;
   also late-first, and a pending movement left for the next pass).
2. Bank send and book transfer with lost outcome settled once: passed (bank via statement, book via the pending log).
3. `listTransactions` every movement of a month across pages with fee and balance, person and operational: passed
   (`nuvion-reconcile-area.spec.ts`, 250 lines over 3 pages, three months, both orders).
4. Subscription renewed before expiry; failed, ignored, missing and unreadable are reported: passed.
5. Fee difference reported with both figures, setting unchanged, resolved when equal: passed.
6. (key) a sandbox month matches the sandbox transfers: NOT RUN (sandbox key does not work).

**Checks:** `tsc` 0; eslint `--no-fix` on every changed file 0; reconcile specs 28/28; `src/nuvion`, `src/wallet-provider`,
`src/money/check` all pass; gates 0 fail, baseline ok; `contract:build` leaves `contract/` unchanged. One edit to a test
I did not write: `nuvion-adapter.spec.ts` FILLED list gains `listTransactions` (its title says "until its task fills it";
NUV-06 did the same). `data-export*.contract.spec.ts` fail on my empty database (a Comment foreign key), not on this change.
CI: `5b756e2` failed `webhook-retention-readers.spec.ts` (the sweep reads the table: now in the readers registry) and a
`shop.contract.spec.ts` infra flake ("mock-wawu-id did not become healthy"). `b515d78` then failed NUV-07's
`no-fee-or-limit-figures.spec.ts` (my setting name began `NUVION_FEE_`: renamed `NUVION_SIMULATE_FEES_HOURS` in `f48fddd`)
and `account-deletion-round4.contract.spec.ts` T6b (SETTINGS-06, a file this task does not touch; not re-run by me).

**Round 2 (17 Oct 2026, Sonnet builder, backend `37a49f5`; verifier report findings 1 to 4, 6, 7).** Shapes now come
from the saved public docs (`nuvion-docs/`), not guesses; the stand-in serves the docs' shapes.
1. HIGH statements: lines are `data.transactions[]`, paging `data.pagination` (`NuvionClient.statementPage`), line id
   `transaction_id`, time `date` (ISO), `type` credit|debit, `fee`, `running_balance`, `reference`, status completed|pending
   (`statementOutcome`). Docs: `api-reference__accounts.md` 804-910 (fields), 929+ (example). Specs run the docs' own example body.
   This also fixes MONEY-16's `listTransactions` and, with dates readable, the sweep's 24-hour filter (6).
2. MEDIUM subscriptions: the renewal call, the expiry date and the renewal timer are gone (`webhooks.md` 27-28, 692-740: the
   update takes only `url`, `rotate_secret`, `entity_id`; the object has `expires_in`, `status`, no expiry date). The check reads
   `status` and reports missing, inactive or unreadable. `NUVION_WEBHOOK_RENEW_HOURS` removed.
3. MEDIUM fees: `/fee-simulations` is in none of the docs, so it is never called; the fee check opens one finding
   "Fee check not available" (once; a rerun while it is open does nothing). `NUVION_SIMULATE_FEES_HOURS` removed.
4. LOW status is read (3). 7. LOW a read-back that fails (or is not a transfer) now adds to `sweep_incomplete`.
Open: `transaction_id` is taken as the transfer id (docs silent); the sweep list above. CI and check lines: see the hand-back.

## Verifier report

