---
id: NUV-08
title: Reconciliation with Nuvion: missed deliveries, statements and the nightly figures
owner: YOU
area: MONEY
order: 206
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [NUV-04, NUV-05, NUV-06, NUV-07]
decisions: [R-39, R-42]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-08 · Reconciliation with Nuvion: missed deliveries, statements and the nightly figures

## Current state

17 Oct 2026. Built by a Sonnet builder; push to verify. Backend `wmt/NUV-08` `f48fddd` on `wmt/MERGE-7` `0be61a4`. No PR.
- **Status:** verifying. Nuvion stood in everywhere; no real host called.
- **Migration:** `20261025050000_nuvion_reconcile_findings` (one new table, `NuvionReconcileFinding`; the lead may rename at merge).
- **Next:** a verifier (not the builder). The (key) check waits for the sandbox key.
- **History:** reports go to tasks/history/NUV-08.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `api-reference__accounts.md` (statements), `api-reference__transfers.md`, `webhooks__overview.md` (the 15-minute retry window), `api-reference__webhooks.md` (`expires_in`, webhook logs)
- `tasks/MONEY-16.md`, `tasks/MONEY-08.md`

## Goal

Nuvion stops retrying a webhook after 15 minutes, so no movement may depend on its delivery arriving. A sweep finds
every movement whose delivery never came and settles it once through the same path, and the nightly check gets
Nuvion's figures to compare with our ledger. Nuvion's balance is the truth; a difference is reported, never
papered over.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- MONEY-16 (todo, nightly check against Fintava): rewired. It compares the ledger with the running provider through the seam; this task gives it Nuvion's statements and balances.
- MONEY-08 (done, status checks and the pending sweep): rewired; Nuvion's answers come from this task and NUV-05/06.

## Scope

- `src/nuvion/areas/reconcile.ts`: `listTransactions` from `GET /accounts/{id}/statements` (month by month, `include_pending`) and `GET /transfers`; a sweep every `PROVISIONAL(NUVION-SWEEP-MINUTES, ...)` minutes that re-fetches pending sends and reads the last day's statement lines of every Nuvion account with movement, and feeds any inflow or outflow with no stored delivery into the same handlers a webhook would (deduplicated on Nuvion's transfer id).
- The webhook subscription is renewed before its `expires_in` runs out; a failed renewal is reported.
- `POST /fee-simulations` per kind, compared with NUV-07's setting; a difference is reported with both figures and the setting is never changed automatically.
- Not in scope: the nightly job and its email (MONEY-16).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] An inflow whose delivery never arrived is found by the sweep and credited once; when the late delivery then arrives, nothing changes (V8).
- [ ] A bank send or book transfer whose outcome delivery was lost is settled by the sweep once.
- [ ] `listTransactions` returns every movement of a month across pages, with fee and running balance, for a person and for the operational account.
- [ ] A webhook subscription about to expire is renewed; a renewal failure is reported, not silent.
- [ ] A difference between `/fee-simulations` and the fee setting is reported with both figures, and the setting is unchanged.
- [ ] (key) One sandbox month's statement matches the transfers made in the sandbox run.

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

## Verifier report

## Owner sign-off
