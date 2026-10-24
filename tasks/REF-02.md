---
id: REF-02
title: Referral points: invite, claim and earn (backend)
owner: YOU
area: REFERRAL
order: 264
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [REF-01, POINTS-01, TIER-03, TIER-06]
decisions: [R-43, R-65]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# REF-02 · Referral points: invite, claim and earn (backend)

## Current state

As of 17 Oct 2026, built by a Sonnet builder and checked by an independent Sonnet verifier. Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/REF-02.md`): verdict merge, nothing medium or worse. Stacked on batch 7 (backend and mobile `wmt/MERGE-7`).
- **Branches:** backend `wmt/REF-02` `1165e79` on `origin/wmt/MERGE-6` `fbf391f`; mobile `wmt/REF-02` on `origin/wmt/MERGE-6` `70a7895` (docs only: this file, history, SHARED-CHANGES rows, LOG, PROGRESS). wawu-id and web untouched.
- **Migration:** `20261024190000_referral_points` (restamped from `20261024140000` at the batch 7 merge so it sorts after every folder in the stack; applied nowhere yet) (additive: enum `ReferralRewardState` and tables `PersonReferralCode`, `PersonReferral`, `ReferralReward`, `ReferralMilestone`). Rollback: drop the four tables, the trigger function and the enum; points already granted stay in their lots.
- **Checks:** backend CI on `1165e79`: Branch checks run 38999309021 green (contract, suite shards 1 to 3, netns, deploy-test-in-sync, baseline), Protected routes (V3) run 38999308931 green, Gates run 38999309018 green. Local: `tsc` 0, eslint 0, gates 0 FAIL, baseline ok, `contract:build` additions only (2 routes, 7 schemas); mobile full check: typecheck 0, lint 0, jest 3,257 of 3,258 with 2 workers (one timing flake under load in `src/features/create/__tests__/create.test.tsx:514`, a file this task does not touch; it passes alone, 44 of 44), gates and task check exit 0.
- **Built:** `GET /me/referrals` (link, code, brought, verified, pending, points earned and pending apart, multiplier, level, ladder, next milestone, milestones, hold and claim days, newest 20 rewards) and `POST /me/referrals/claim` (once, in the first days, never your own, never a loop, before any paid tier). A first paid tier makes one reward (unique per referral), held, then paid as POINTS-01 lots (source `referral`) by a minute job; the milestones are paid once each; every figure is a TIER-06 setting.
- **Default (agent), owner may override:** `verified` counts rewards past the hold (RF1 draws Verified and Pending apart); the multiplier is fixed when the reward is made, from the `verified` count then; a code is refused to someone who already paid for a tier; a referrer whose tier ended before the hold did loses the reward; the claim window runs from the profile's creation.
- **For the lead:** nothing in the Hub refunds a tier payment after it was granted (the purchase table only allows `paid`). The reward is cancelled when a refund hold exists for the payment, the payment is `reversed`, the purchase row is gone, or a refund path calls `ReferralRewardService.cancelForPurchase(paymentRef)`; a future refund path must call it. `data-export.contract.spec.ts` could not run on my stack (its mail-outbox read from the stack's stand-in WAWU ID returns nothing); CI runs it.
- **Gaps:** G-802 is served (REF-03 regenerates the app types with `npm run api`, SHARED-CHANGES REF-02 #2). G-812 (a claim from the deep link) is REF-03's.
- **PROVISIONAL (owner):** `REF-SWEEP-BATCH` (50 rewards a pass, technical). The referral figures were already listed by TIER-06; REF-02 adds none.
- **Open findings:** none medium or worse; the verifier's lows are in `tasks/SWEEP-MONEY.md` (REF-02 L1 to L4).
- **Next:** the lead merges it on batch 7; REF-03 regenerates the app types for the referral routes (SHARED-CHANGES REF-02 #2).
- **History:** tasks/history/REF-02.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/REF-02.md](history/REF-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
