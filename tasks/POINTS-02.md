---
id: POINTS-02
title: Buy points
owner: YOU
area: POINTS
order: 212
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [POINTS-01, TIER-03, TIER-05]
decisions: [R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-02 · Buy points

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Carried from TIER-06 (round 2, low 2, 17 Oct 2026):** the points cash-out rule in `src/plan-settings/plan-setting-rules.ts` (`pointsSales`, line 34: the cash rate may not exceed the price per point of any way points are sold) ignores the Founding pack bonus (`plan.tier.founding.pack_bonus_pct`, 10). Nothing applies the bonus today, so no gap exists now. When this task applies it, `pointsSales` must count the bonus points, or a rate set at the exact maximum pays about 10 percent more than a Founding buyer paid. Report: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/TIER-06.md`, round 2, finding 2.
- **Next:** a builder starts from the brief below after these are done (or in review): TIER-05.
- **History:** none yet. Reports go to tasks/history/POINTS-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

A person buys a points pack (PT4) in their own currency, from the wallet or by transfer; a Founding Maker gets the
pack bonus from config ("Founding shows +10%").

## Scope

- `POST /plans/purchases` kind `points_pack` (`packId`), purpose `points_pack`; the lot's expiry is config's bought-points expiry (TIER-01).
- The Founding Maker bonus: the pack's points plus the config percent, rounded down to a whole point.

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [ ] A naira-billed person buys a pack from the wallet: one debit at the config price, one lot of the config points with its expiry.
- [ ] A Founding Maker gets the pack plus the config bonus, rounded down.
- [ ] The same request twice debits once and grants once (V8); by transfer it completes when the money lands (TIER-05).
- [ ] A dollar-billed person sees and pays only the dollar packs.

## Builder report

## Verifier report

## Owner sign-off
