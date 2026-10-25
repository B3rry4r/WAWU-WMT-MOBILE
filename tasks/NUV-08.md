---
id: NUV-08
title: Reconciliation with Nuvion: missed deliveries, statements and the nightly figures
owner: YOU
area: MONEY
order: 206
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [NUV-04, NUV-05, NUV-06, NUV-07]
decisions: [R-39, R-42]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-08 · Reconciliation with Nuvion: missed deliveries, statements and the nightly figures

## Current state

17 Oct 2026. Round 2 (fix of the verifier's findings 1 to 4, 6, 7) pushed: backend `wmt/NUV-08` `37a49f5` on `wmt/MERGE-7` `0be61a4`. No PR.
- **Status:** merging (lead). Checked by an independent verifier over two rounds (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/NUV-08.md`, round 2 verdict merge; findings 1, 2, 3 and 7 closed). Stacked in batch 9 by MERGE-9 (backend `37a49f5`, migration `20261025050000_nuvion_reconcile_findings` kept: no stamp clash). Nuvion stood in everywhere; no real host called.
- **Migration:** `20261025050000_nuvion_reconcile_findings` (one new table, `NuvionReconcileFinding`; the lead may rename at merge).
- **Next:** a verifier (not the builder). The (key) check waits for the sandbox key and must also confirm that a statement's `transaction_id` is the transfer id, and ask Nuvion for a fee-reading call (see the fee check).
- **Sweep list (lows, not fixed):** 5 (the extra day after the window asks next month), 8 (the schema comment names old finding kinds), the sweep's `seen` keyed on transfer id alone.
- **History:** reports go to tasks/history/NUV-08.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 3acc0443, verifier PASS in the lead's merge log, 17 Oct.

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
- The webhook subscription is read, not renewed (round 2): Nuvion's docs give no renewal call, so a missing or inactive subscription is reported.
- The fee check says once "fee check not available" (round 2): Nuvion's docs describe no fee simulation, so none is called and the settings are not compared.
- Not in scope: the nightly job and its email (MONEY-16).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] An inflow whose delivery never arrived is found by the sweep and credited once; when the late delivery then arrives, nothing changes (V8).
- [ ] A bank send or book transfer whose outcome delivery was lost is settled by the sweep once.
- [ ] `listTransactions` returns every movement of a month across pages, with fee and running balance, for a person and for the operational account.
- [ ] A webhook subscription that is missing, inactive or unreadable is reported, not silent; nothing is renewed (round 2).
- [ ] The fee check reports once that it is not available and calls no fee route (round 2).
- [ ] (key) One sandbox month's statement matches the transfers made in the sandbox run. NOT RUN 23 Oct 2026 (NUV-KEYS): no transfer could be made; the statement route answers 200 and `money:check` finished clean on 1 wallet.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-08.md](history/NUV-08.md).

## Owner sign-off