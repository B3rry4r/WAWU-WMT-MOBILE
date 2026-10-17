---
id: POINTS-03
title: Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet
owner: YOU
area: POINTS
order: 213
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [POINTS-01, POINTS-02]
decisions: [R-43, R-38]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-03 · Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying.
- **Branches:** backend `wmt/POINTS-03` `6225022` on `origin/wmt/POINTS-02` `1cf41b0` (it extends POINTS-02 and TIER-05, both being checked); mobile `wmt/POINTS-03` on `origin/wmt/POINTS-02` `b553f48` (this file, SHARED-CHANGES rows POINTS-03 #1 to #5, contract and API types copied from the backend branch).
- **Migration:** `20261025020000_points_spend`: the table `PointsSetting` and the index `PointHold (state, createdAt)`. Additive; the lead renames the stamp at merge if needed.
- **Built:** `src/points/spend/`. `PointsSpendService` (`hold`, `commit`, `release` for an `ai_job`, exported for the tool tasks), `POST /points/quote`, `POST /points/shortfall` (PIN, Idempotency-Key) with `GET /points/shortfall/{id}`, `GET`/`PUT /me/points/settings`, the five-minute sweep of stale AI holds. No AI provider is called.
- **Every figure is a setting (R-65):** a job's cost is `points.action.<id>`; the caps are `points.daily_cap`, `points.max_chars_per_job` and `points.max_audio_min_per_job` (the last two are new admin settings, defaults from the plan's existing `caps`); the shortfall rate is `points.price_kobo_per_1000`; the sweep's limit is `points.job_max_run_minutes` (new, PROVISIONAL `POINTS-JOB-MAX-RUN`, 30). No cost, cap or rate is a literal in code.
- **The hold:** caps, the day's count and the hold are under the person's points lock in one database-only transaction, the hold last; nothing waits on a provider inside it. A cap is `422 points_cap_reached` naming `cap` (`daily`, `characters_per_job`, `minutes_per_job`), its size and, for the day's, `resetsAt` (next Lagos midnight). A reference already spent or given back is `points_hold_settled`, so a retry needs `jobHoldReference(jobId, attempt)`.
- **The shortfall:** a new wallet payment kind `points_shortfall` (target `shortfall-<points>`, WAWU's own sale, not held), priced at the pack rate pro rata and rounded up, the provider's charge on top. Points, rate and expiry are the payment's terms, so the quote binds them (`409 quote_changed`); the lot (source `shortfall`) is granted once, last, in a database-only transaction. Nothing moves without the PIN; the same quote under another key finds no shortfall (`409 points_not_short`).
- **Checks:** backend CI on `6225022`: see the Builder report. Local: tsc 0; eslint 0 and prettier on the changed files; 30 new cases pass (rules 13, over HTTP 17); the plan-settings, plans, points, account-purge and admin settings suites pass; `contract:build` twice identical. Mobile full check: see the Builder report.
- **Not done:** dollar-billed people get no wallet money (R-16, NUV-09): the quote says so and nothing is taken. No screen (PT1 to PT3 and PT7 are POINTS-06 and POINTS-07). The AI tools themselves come later and call `PointsSpendService`.
- **Open findings:** none known.
- **Next:** a verifier checks it; the lead merges with batch 7 (POINTS-03 builds on POINTS-02).
- **History:** none yet. Reports go to tasks/history/POINTS-03.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Every AI tool shows its points cost before use (PT1, PT2), runs only once its points are held, and keeps them only
if it succeeds ("No points were taken" when it fails). Daily and per-job caps give a friendly answer (PT7). When
points run short and "Use wallet" is on, the person is shown the wallet money needed and nothing runs until they
confirm (PT3; brief: "Without confirm, do nothing").

## Scope

- `src/points/spend/`: an internal service (`hold`, `commit`, `release` for a job) that the AI tools' server code calls; client routes `POST /points/quote` (`action`, `units` → cost from config, balance, shortfall, the wallet money for the shortfall at the pack rate in the person's currency, and any cap that stops it), `POST /points/shortfall` (PIN, Idempotency-Key: buys exactly the shortfall from the wallet, purpose `points_shortfall`, one lot), `PUT /me/points/settings` (`useWallet`, off by default).
- Caps from config: daily points per person, characters per job and minutes per job; over a cap the answer is `points_cap_reached` naming the cap and when it resets.
- Not in scope: the AI tools themselves (ElevenLabs, the Voice Intro), which tasks cut from the PT and VF boards build on this service. They open from the Create button, never a tab (R-38).

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **A sweep for stale AI holds:** release `ai_job` holds still `held` after the job's maximum run time (a config value), by `holdId`. A late commit and the sweep cannot both win: the second is refused (`points_hold_settled`). Add an index on `PointHold (state, createdAt)`; POINTS-01 only has `(wawuUserId, createdAt)`.
- **A fresh hold reference for each attempt:** `hold` with a reference already used returns that hold in its current state, released included, so a retry after a failed job needs a new reference.
- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [x] A person sees VoiceOver's cost for 2 minutes (from config) before running; a hold takes it, a failed job releases all of it, a finished job keeps it.
- [x] With too few points and "Use wallet" off, the quote shows the shortfall and offers buying points; nothing is taken.
- [x] With "Use wallet" on, the quote shows the wallet money for the shortfall; nothing is debited until `POST /points/shortfall` with the PIN, which debits once and grants once even when sent twice (V8).
- [x] Past the daily cap, or over the characters or minutes per job, the answer names the cap and nothing is held.
- [x] Two holds at once never take points below zero.

## Builder report

**Builder report: POINTS-03 (Sonnet builder, 17 Oct 2026).** Backend `wmt/POINTS-03` `6225022` on `wmt/POINTS-02` `1cf41b0`; mobile `wmt/POINTS-03` on `wmt/POINTS-02` `b553f48`. No AI provider, payment provider or wawuafrica.com host called (the Fintava double stood in; there is no AI call in this task).

- **Files (backend):** new `src/points/spend/` (`points-spend.service.ts`, `points-shortfall.service.ts`, `points-quote.service.ts`, `points-hold-sweep.service.ts`, `points-spend-rules.ts`, `points-shortfall-goods.ts`, controller, DTOs, view types, module); changed `src/app.module.ts`, `prisma/schema.prisma` and the migration, `points-error.ts`, the money enums, contract and error DTO, history labels, the settings registry and defaults, `account-data-map.ts`, `docs/contract/CONVENTIONS.md` (section 16a) and `WALLET.md`, `contract/openapi.json`. Test helper `test/plans/tier-purchase-harness.ts` gained an optional `modules` list. Shared edits are SHARED-CHANGES POINTS-03 #1 to #5.
- **Capability checks:** (1) VoiceOver for 2 minutes is quoted at the plan's points; a hold takes them, a failed job's release gives all of them back to the lots they came from, a finished job's commit keeps them ("Spent on VoiceOver"). (2) With too few points and "Use wallet" off the quote shows the shortfall, `wallet` is null, the hold is the plain `402 insufficient_points`, and no balance, hold, send or payment changes. (3) With "Use wallet" on the quote shows the wallet money for exactly the shortfall at the pack rate; nothing is debited until `POST /points/shortfall` with the PIN, which sends once and grants one lot once: the same key twice replays, ten taps with mixed keys leave one send and one lot, the same quote under a new key is `points_not_short`. (4) Past the day's cap, or over the characters or minutes per job, the answer is `422 points_cap_reached` naming the cap (and `resetsAt` for the day's), and nothing is held; a given-back job frees its points for the day. (5) Three holds at once on a balance for one and a half jobs: one wins, the others are `insufficient_points`; ten jobs against a cap for two: two win.
- **Lead notes (8 Oct):** the sweep gives back `ai_job` holds still `held` past `points.job_max_run_minutes`, by `holdId`, skipping a hold a late commit settled first (a commit and the sweep run together five times: exactly one wins each time); the index `PointHold (state, createdAt)` is in the migration; a retry needs a fresh reference (`jobHoldReference`), and a spent or given-back reference is refused, never returned as a hold; the hold is the last write of its transaction and no provider is waited on inside it. A spec starts a shortfall purchase with a 3 s provider answer and shows the same person's hold, `GET /me/points` and quote answer in under a second meanwhile.
- **Quote binding:** a balance that moved, a changed rate and a stale token are each `409 quote_changed` with the new quote and nothing moved; a fresh quote buys at the new rate (TIER-06 round 2).
- **Specs (mine):** `points-spend-rules.spec.ts` (13) and `points-spend.contract.spec.ts` (17, real database, real tokens, the Fintava double). A mutant that drops the person's lock in `hold` fails the burst case. The three exact route lists in `wallet-gate-coverage.spec.ts` and `money-moving-coverage.spec.ts` gained `POST points/shortfall` (POINTS-03 #5); no other test I did not write changed.
- **Checks:** backend CI on `6225022`: all green: Branch checks run 39017039642 (contract, three suite shards, netns, baseline, deploy-test-in-sync), Gates run 39017039629, Protected routes (V3) run 39017039716. (The first push, `56b241d`, failed one case in shard 3: the data export's drift guard wanted the new `PointsSetting` table decided; `6225022` exports it.) Local: tsc 0; eslint 0 and prettier on the changed files; plan-settings, plans, points, account-purge and admin plan-settings suites pass; `contract:build` twice identical. Mobile full check: typecheck, lint, 188 suites and 3,258 tests, gates and tasks all passed (EXIT 0, run before this file's last edit; `npm run tasks` was run again after it).
- **Defaults chosen (agent, owner may override):** a cap is 422; not short is 409; the day starts at Lagos midnight and counts held and spent AI jobs by when they were held; a shortfall is priced pro rata at the pack rate and rounded up; the PIN is the confirmation (the "Use wallet" choice only decides whether the quote offers the money); 30 minutes is the longest an AI job may hold points (`POINTS-JOB-MAX-RUN`, listed for the owner with the other provisional figures).
- **For the lead:** none of POINTS-03's settings (`points.max_chars_per_job`, `points.max_audio_min_per_job`, `points.job_max_run_minutes`) has a dashboard screen yet (the admin settings list builds from the registry, so they appear with the others).

## Verifier report

## Owner sign-off
