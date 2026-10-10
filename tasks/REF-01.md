---
id: REF-01
title: Referral points
owner: YOU
area: REFERRAL
order: 215
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [POINTS-01, TIER-03]
decisions: [R-43]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# REF-01 · Referral points

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

A person shares their link (`wawu/r/code`) and earns points, never cash, when someone they invited pays for a
tier and is verified, after the hold days, with the levels and milestones from config (RF1 to RF4).

## Scope

- New `src/referrals/`: one code per person; `POST /me/referrals/claim` (`code`), once per new person within `PROVISIONAL(REFERRAL-CLAIM-DAYS, ...)` days of sign-up, never their own code, one level only.
- On the invited person's first paid tier (TIER-03 success; paying needs an open wallet, so they are verified): a pending reward of the config base points for that tier times the referrer's level multiplier, available after the hold days, cancelled if the purchase is refunded inside the hold. Only a referrer with an active tier earns. Milestones from config granted once each. Grants go through POINTS-01 (source `referral`, idempotent on the referral).
- `GET /me/referrals`: link, code, brought, verified, points earned, pending, level, multiplier, next milestone.

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [ ] A new person who claims a code and buys a tier makes a pending reward that becomes points after the hold days, once.
- [ ] A person cannot claim their own code or claim twice; a referrer without an active tier earns nothing.
- [ ] A refund inside the hold cancels the reward.
- [ ] At the milestone count the milestone points are granted once; the multiplier follows the referrer's level.
- [ ] `GET /me/referrals` shows pending and earned points apart.

## Builder report

## Verifier report

## Owner sign-off
