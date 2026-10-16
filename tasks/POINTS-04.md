---
id: POINTS-04
title: Convert points to cash
owner: YOU
area: POINTS
order: 214
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [POINTS-01, TIER-01, MONEY-18]
decisions: [R-43, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-04 · Convert points to cash

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Verified once: stand-in attacks held (12 parallel requests on one key make one conversion, no way to convert twice or past the balance); by the 15 Oct rule the verdict is merge, nothing medium or worse. Stacked on WALLET-10 (this branch contains `wmt/WALLET-10`, which contains WALLET-07, NUV-06 and MONEY-16); backend main `18ac5f9` is in it.
- **Branches:** mobile `wmt/POINTS-04` (this branch; WALLET-10's mobile head merged, API types regenerated from backend `wmt/POINTS-04`). Backend `wmt/POINTS-04` (WALLET-10 merged; migration renamed to `20261021310000_points_cash_out`, contents unchanged). No PRs yet.
- **Merged and live:** nothing of this task.
- **Conventions:** the backend section for this task is number 20 in `docs/contract/CONVENTIONS.md` (19 is WALLET-07, 21 is FIX-20, 22 is MONEY-16).
- **Open findings:** blocker 0, high 0, medium 0. The lows (a 500 after the conversion exists, wording "payment" and "Your money is safe") are in tasks/SWEEP-MONEY.md. Operational edges on record: G-742 (no tool to clear a conversion in review), G-745 (an ended lot loses released points). No screen calls the routes yet (G-740).
- **Next:** the lead opens one backend pull request from the FIX-20 head (WALLET-10, POINTS-04 and FIX-20 stacked) for the owner to merge, then mobile sign-off.
- **Records:** the round history is in tasks/history/POINTS-04.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-04.md](history/POINTS-04.md).

## Owner sign-off
