---
id: NUV-07
title: Fees and limits as settings, and nothing moves before they are set
owner: YOU
area: MONEY
order: 198
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-20, WALLET-15]
decisions: [R-42, R-10, R-23, R-31]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# NUV-07 · Fees and limits as settings, and nothing moves before they are set

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- `tasks/WALLET-15.md` (fee quotes)
- the lead's scratchpad `nuvion/SANDBOX-FINDINGS.md` item 10 (fee simulations and limit errors)

## Goal

Nuvion's charges and limits are settings, filled in when Nuvion answers (R-42), never figures in code, and nothing
moves real money on Nuvion until they are set. WAWU's own fee on top (R-10) and the one Fees row (R-23) stay as
they are.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- WALLET-15 (done, fee quotes): rewired; the provider part of a quote comes from the running provider's settings.
- OPS-09 (Fintava merchant charges in the sandbox dashboard): obsolete under Nuvion; WAWU's fee is our own setting.
- WALLET-23 (account limits from Fintava, after launch) and WALLET-19 (the A17 to A20 limit screens, after launch): obsolete as written; Nuvion documents no account tiers, and limits are WAWU settings here.

## Scope

- `src/money/fees/*`: a fee schedule per provider. Under `nuvion` the provider part of every quote comes from settings (`NUVION_FEE_*` for a book transfer, a bank payout and an inflow; a flat kobo figure or bands; no default value). Fintava's schedule is untouched (rollback).
- While any Nuvion fee setting is unset under `nuvion`, every quote and every money-moving route answers `503 fees_not_set` before any call to Nuvion. Read-only routes (balance, history, account number) are unaffected.
- New `src/money/limits/`: per-transaction, daily and monthly limits per person and per kind of movement, as settings; unset means no WAWU limit. A movement over a set limit answers `limit_reached` naming the limit, before any call; Nuvion's `error_transfer_daily_limit_exceeded`, `error_transfer_transaction_limit_exceeded` and `error_transfer_monthly_volume_exceeded` give the same answer.
- `.env.example` and `deploy/README.md` list every setting with no figure.
- Default (agent), owner may override: a quote does not call `POST /fee-simulations`; NUV-08 compares it with the setting and reports a difference.

Built on the seam alone; it needs neither NUV-01 nor the key (the spec stands Nuvion in at `WALLET_PROVIDER`).

## Capability checks

- [ ] With the Nuvion fee settings filled in (spec values), a quote shows the provider's charge and WAWU's fee as one Fees row, and changing a setting changes the quote with no code change.
- [ ] With any Nuvion fee setting unset, every quote and money-moving route answers `fees_not_set` and the provider receives no call.
- [ ] A movement above a set per-transaction, daily or monthly limit answers `limit_reached` naming the limit, before any call; each of Nuvion's three limit errors gives the same answer.
- [ ] Under `fintava` every quote is byte-identical to main (V3).
- [ ] No fee or limit figure appears in source (gates, and a grep in the spec).

## Builder report

## Verifier report

## Owner sign-off
