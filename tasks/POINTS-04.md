---
id: POINTS-04
title: Convert points to cash
owner: YOU
area: POINTS
order: 214
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [POINTS-01, TIER-01, MONEY-18]
decisions: [R-43, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-04 · Convert points to cash

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/MONEY-18.md` (the release path from WAWU's account to a person)

## Goal

A person can turn points into wallet cash at the config rate (PT6: "1,000 points = ₦500", with the line that
spending on AI is worth more). Below the minimum, they are told so and nothing changes.

## Scope

- `GET /points/convert/quote` and `POST /points/convert` (points, PIN, Idempotency-Key): consumes lots soonest-expiring first; pays the cash from WAWU's operational account into the person's wallet in their currency through MONEY-18's release path (purpose `points_cash_out`); WAWU pays the provider's charge on it (R-31).
- Default (agent), owner may override: points from any source convert; the minimum is config's (TIER-01).

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **Never time out a `cash_out` hold while the payout's outcome is unknown:** reconcile with the provider first, then commit or release. An unknown outcome is reconciled, never released blindly.
- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [ ] A person converts points at the config rate: the points leave the soonest-expiring lots once and the cash lands in their wallet once.
- [ ] Below the config minimum the answer is `below_minimum` and nothing changes; more than the balance is refused.
- [ ] The same request twice converts once (V8); a failed payout gives the points back to their lots.
- [ ] A person without a wallet gets `no_wallet` and keeps their points.
- [ ] The cash leaves WAWU's operational account, and the ledger shows it as WAWU's movement.

## Builder report

## Verifier report

## Owner sign-off
