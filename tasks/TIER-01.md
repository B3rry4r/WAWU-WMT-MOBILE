---
id: TIER-01
title: Prices, tiers and the billing currency: one config file
owner: YOU
area: VERIFY
order: 199
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-04]
decisions: [R-43, R-44, R-21]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-01 · Prices, tiers and the billing currency: one config file

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Every price, product count, points amount, expiry, cost and cap of the 5 Oct plan lives in one file and is read
everywhere (R-43: "until then the plan's figures are config values, never facts"). Every person has one billing
currency, naira or dollars, fixed at their first purchase. A person billed in naira only ever sees naira; a person
billed in dollars only ever sees dollars.

## Scope

- New `src/plans/`: `plans.config.json` with the Developer Brief's section 2 figures as example values (tiers: id, days, products, bonus points and their expiry days, price in NGN kobo and USD cents, event pass type, badge, pack bonus percent, first Voice Intro; extra products; packs; checkout bump; action points; caps; referral; cash-out rate), plus the two values the brief does not give, each its own `PROVISIONAL(..., owner=YOU, why=...)`: the cash-out minimum and how long bought points last. One marker `PROVISIONAL(PLAN-PRICES, owner=YOU, why=R-43 the owner sends final prices)` covers the file.
- A schema check at boot: a malformed or incomplete file stops the server naming the field.
- Billing currency: a nullable `billingCurrency` (`NGN` or `USD`) on the person; a resolver (the fixed value; else NGN for a person with a naira wallet or a Nigerian phone, else USD); TIER-03 fixes it at the first purchase; no route changes it (support only, owner rule in the brief).
- Tier state: `MakerTier` (person, tier, active from, active until, extra products, Voice Intro included) and `EventPass` (person, type, purchase); one reader service the gate (TIER-02) and the purchases use.
- Routes: `GET /plans` (signed in: tiers, extra products, packs, bump, action costs and caps, in the caller's currency only); `GET /me/tier` (VF14: tier, badge, active until, products allowed, points included, event pass, state `none`, `active`, `ending` within `PROVISIONAL(PLAN-ENDING-DAYS, ...)` days, or `ended`).
- `data-export-sections.ts` decides the new models.

## Capability checks

- [ ] A person billed in naira gets every price from `GET /plans` in ₦ (kobo) and a person billed in dollars in $ (cents), never both.
- [ ] Changing a figure in `plans.config.json` and restarting changes `GET /plans` with no code change; a malformed file stops boot naming the bad field.
- [ ] A person's billing currency, once set, never changes through any route, including after they open a naira wallet or change their phone.
- [ ] `GET /me/tier` answers `none` for a new person, and `active`, `ending` and `ended` for seeded tier rows.
- [ ] No price, points amount, cost or cap appears in source outside `plans.config.json` (spec grep).

## Builder report

## Verifier report

## Owner sign-off
