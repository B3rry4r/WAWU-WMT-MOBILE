---
id: TIER-03
title: Buy, renew or upgrade a tier from the wallet
owner: YOU
area: VERIFY
order: 209
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [TIER-01, POINTS-01, MONEY-17, MONEY-19]
decisions: [R-43, R-44, R-6, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-03 · Buy, renew or upgrade a tier from the wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/MONEY-17.md`, `tasks/MONEY-19.md` (the pay-from-wallet path every purchase uses)

## Goal

A person picks a tier (Founding Maker pre-selected, VF5) and pays from their wallet (VF6). Success sets the tier
and its dates, grants the bonus points as one lot with its expiry, issues the event pass and includes the first
Voice Intro, exactly once even when the payment's confirmation repeats (R-43, brief section 3).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- ME-18 (todo, pay for a tick from the wallet): obsolete; tiers replace the verification tick (round 2 brief: M11 to M14 are replaced by VF5 to VF7).

## Scope

- New `POST /plans/purchases` (Idempotency-Key, the transaction PIN as MONEY-17 takes it): `kind` `tier`, `renew` or `upgrade`, `tierId`, optional `bump`, `method: wallet`; `GET /plans/purchases/:id`. The price comes from `plans.config.json` in the person's billing currency; the first purchase fixes that currency (TIER-01).
- Pays through MONEY-17's pay-from-wallet with new purposes `tier` and `tier_bump`, into WAWU's operational account; it is WAWU's own sale, so there is no seller split. MONEY-19's shortfall and still-confirming answers pass through.
- New `MakerPurchase` table (person, kind, item, currency, amount, status, payment reference unique, method).
- Grants, once per payment reference, in the same transaction that marks the purchase paid: the tier and its dates, the bonus points lot (POINTS-01 `grant`, expiry from config), the event pass, the first Voice Intro, and the bump's points lot (VF6 "Add 1,000 points for ₦800", from config).
- Rules, Default (agent), owner may override: renewing the same tier extends from its current end date; an upgrade pays the difference between the two config prices, starts the new tier's period on the day of the upgrade, keeps unused points and grants the difference in bonus points; no downgrade while a tier is active.
- Paying needs an open wallet (question 1 in `docs/PAYMENTS-PLAN.md`): a person with none gets the existing `no_wallet` answer (MONEY-13).
- Not in scope: paying by transfer (TIER-05), extra products (TIER-04), the Voice Intro itself.

## Capability checks

- [ ] A person with enough money buys Founding Maker: one debit at the config price; the tier and dates, the bonus lot with its expiry, the event pass and the Voice Intro all show in `GET /me/tier` and `GET /me/points`.
- [ ] The same request twice, two taps at once, or a confirmation delivered twice debits once and grants once (V8).
- [ ] An upgrade from Verify to Founding Maker debits only the difference and grants the difference in bonus points; unused points stay.
- [ ] A person short of money gets the exact shortfall and nothing is granted; a still-confirming payment grants only once it confirms; a failed payment grants nothing.
- [ ] The first purchase fixes the billing currency; a naira-billed person pays the naira price and a dollar-billed person the dollar price (from a dollar wallet, NUV-09).
- [ ] A person without a wallet gets `no_wallet`; a wrong PIN five times locks as MONEY-09 does.

## Builder report

## Verifier report

## Owner sign-off
