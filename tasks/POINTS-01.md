---
id: POINTS-01
title: Points: lots that expire, and the points ledger
owner: YOU
area: POINTS
order: 200
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-43, R-5]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# POINTS-01 · Points: lots that expire, and the points ledger

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Points are their own balance, always shown as points, never as naira or dollars, held in lots that expire. The
soonest-expiring lot is spent first, the balance never goes below zero, and every change is an append-only ledger
row (R-43, brief section 3). WAWU Credits are untouched: whether points replace them is open (R-43), and the round
2 brief draws points as their own balance.

## Scope

- New `src/points/`: `PointLot` (person, source `tier_bonus`, `pack`, `bump`, `referral`, `shortfall` or `returned`, quantity, remaining, expires at, a source reference unique per source) and `PointLedger` (append only: person, lot, delta, reason, job or purchase reference, time).
- A service: `grant` (idempotent on the source reference), `hold` (soonest-expiring lots first; refuses to go below zero), `commit`, `release` (back to the lots it came from), and an expiry job (each lapsed lot leaves the balance with one ledger row).
- `GET /me/points` (PT5): balance, lots with their expiry dates, the next expiry, and the last 20 ledger rows with plain labels.
- `data-export-sections.ts`: both tables exported.
- Not in scope: buying (POINTS-02), spending and caps (POINTS-03), cash-out (POINTS-04).

Needs no money and no provider; starts now.

## Capability checks

- [ ] A person with a lot ending in January and one ending in March spends January's first; a hold larger than the balance is refused and nothing changes.
- [ ] The same grant reference twice grants once; two holds at once never take the balance below zero (concurrency spec).
- [ ] A released hold returns its points to the same lots; a lapsed lot's points leave the balance with one ledger row each.
- [ ] `GET /me/points` shows the balance, each lot with its expiry date and the last 20 movements, newest first; another person's points are never shown.
- [ ] No ledger row is ever updated or deleted (the spec fails on an UPDATE or DELETE of the table).

## Builder report

## Verifier report

## Owner sign-off
