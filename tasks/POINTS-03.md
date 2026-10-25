---
id: POINTS-03
title: Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet
owner: YOU
area: POINTS
order: 213
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [POINTS-01, POINTS-02]
decisions: [R-43, R-38]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-03 · Spend points on AI tools: the cost first, caps, and paying the shortfall from the wallet

## Current state

As of 17 Oct 2026, builder round 2 done (Sonnet builder), after the verifier's `fix` verdict (1 medium). Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-03.md`, round 1 verdict fix, one medium; round 2 fixed it and the lead accepted it on review). Stacked in batch 7 by MERGE-7f.
- **Branches:** backend `wmt/POINTS-03` `ebe76de` (round 1 `6225022`) on `origin/wmt/POINTS-02` `1cf41b0` (it extends POINTS-02 and TIER-05, both being checked); mobile `wmt/POINTS-03` on `origin/wmt/POINTS-02` `b553f48` (this file, SHARED-CHANGES rows POINTS-03 #1 to #5, contract and API types copied from the backend branch).
- **Migration:** `20261025020000_points_spend`: the table `PointsSetting` and the index `PointHold (state, createdAt)`. Additive; the stamp is kept at merge (it sorts after every batch 7 folder).
- **Built:** `src/points/spend/`. `PointsSpendService` (`hold`, `commit`, `release` for an `ai_job`, exported for the tool tasks), `POST /points/quote`, `POST /points/shortfall` (PIN, Idempotency-Key) with `GET /points/shortfall/{id}`, `GET`/`PUT /me/points/settings`, the five-minute sweep of stale AI holds. No AI provider is called.
- **Every figure is a setting (R-65):** a job's cost is `points.action.<id>`; the caps are `points.daily_cap`, `points.max_chars_per_job` and `points.max_audio_min_per_job` (the last two are new admin settings, defaults from the plan's existing `caps`); the shortfall rate is `points.price_kobo_per_1000`; the sweep's limit is `points.job_max_run_minutes` (new, PROVISIONAL `POINTS-JOB-MAX-RUN`, 30). No cost, cap or rate is a literal in code.
- **The hold:** caps, the day's count and the hold are under the person's points lock in one database-only transaction, the hold last; nothing waits on a provider inside it. A cap is `422 points_cap_reached` naming `cap` (`daily`, `characters_per_job`, `minutes_per_job`), its size and, for the day's, `resetsAt` (next Lagos midnight). A reference already spent or given back is `points_hold_settled`, so a retry needs `jobHoldReference(jobId, attempt)`.
- **The shortfall:** a new wallet payment kind `points_shortfall` (target `shortfall-<points>`, WAWU's own sale, not held), priced at the pack rate pro rata and rounded up, the provider's charge on top. Points, rate and expiry are the payment's terms, so the quote binds them (`409 quote_changed`); the lot (source `shortfall`) is granted once, last, in a database-only transaction. Nothing moves without the PIN; the same quote under another key finds no shortfall (`409 points_not_short`).
- **Checks:** backend CI on `6225022`: see the Builder report. Local: tsc 0; eslint 0 and prettier on the changed files; 30 new cases pass (rules 13, over HTTP 17); the plan-settings, plans, points, account-purge and admin settings suites pass; `contract:build` twice identical. Mobile full check: see the Builder report.
- **Not done:** dollar-billed people get no wallet money (R-16, NUV-09): the quote says so and nothing is taken. No screen (PT1 to PT3 and PT7 are POINTS-06 and POINTS-07). The AI tools themselves come later and call `PointsSpendService`.
- **Round 2 (done):** the verifier's medium: a person with no wallet and no billing row was priced with no claims, so the quote's `walletNote` was the dollars note even for a Nigerian. The note is now chosen in this order: a billing currency fixed in dollars gives the dollars note; else no open wallet gives "Open your wallet to top up points from it."; else price as before. Pricing is unchanged. Text only; nothing moved either way.
- **Open findings:** none known after round 2 (medium 0).
- **Next:** the lead merges with batch 7 (stacked here by MERGE-7f on POINTS-02; POINTS-03 builds on it).
- **History:** none yet. Reports go to tasks/history/POINTS-03.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 18f0eb09, lead acceptance in this file (verifier FIX on one medium, accepted on review).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-03.md](history/POINTS-03.md).

## Owner sign-off
