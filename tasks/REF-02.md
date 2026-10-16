---
id: REF-02
title: Referral points: invite, claim and earn (backend)
owner: YOU
area: REFERRAL
order: 264
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [REF-01, POINTS-01, TIER-03, TIER-06]
decisions: [R-43, R-65]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# REF-02 · Referral points: invite, claim and earn (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): TIER-06.
- **History:** none yet. Reports go to tasks/history/REF-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43, R-65 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person shares their link and code, and earns points (never cash) when someone they invited pays for a tier and is verified, after the hold (RF1 to RF4). REF-01 shipped the /join referral codes only; this is its original scope, which was never built.

## Scope

- New `src/referrals/` module, one code per person, link `wawu/r/<code>`. `POST /me/referrals/claim` (`code`): once per new person within a setting's days of sign-up, never their own code, one level only. `GET /me/referrals`: link, code, brought, verified, points earned, pending, level, multiplier, next milestone.
- On the invited person's first paid tier (TIER-03 success; paying needs an open wallet, so they are verified) a pending reward is made: base points for that tier times the referrer's multiplier (×1 to ×3), available after the 7-day hold, cancelled if the purchase is refunded inside the hold. Only a referrer with an active tier earns. Milestone +500 points at 5 verified (more milestones as drawn on RF1), each once. Grants go through POINTS-01 (source `referral`, idempotent on the referral).
- All figures are the R-65 admin settings (TIER-06): multipliers, milestones, hold days, claim days. 85/15 is not involved: referral pays points, not a split.
- Calling pattern: `PointsService.grant` last in your own transaction, never waiting on a provider while holding a person's points lock (CONVENTIONS section 16).

## Capability checks

- [ ] A new person who claims a code and buys a tier makes a pending reward that becomes points after the hold days, once.
- [ ] A person cannot claim their own code or claim twice; a referrer without an active tier earns nothing.
- [ ] A refund inside the hold cancels the reward. At the milestone count the milestone points are granted once.
- [ ] `GET /me/referrals` shows pending and earned points apart and the next milestone.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
