---
id: TIER-07
title: A person's tier badge on their public profile
owner: YOU
area: VERIFY
order: 263
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [TIER-03, TIER-02]
decisions: [R-43]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-07 · A person's tier badge on their public profile

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/TIER-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Other people see a person's tier badge on their profile and cards (M5, M6, M7), including the numbered Founding Maker badge (VF7a; G-421, G-420).

## Scope

- Additive nullable `badge` (`{ id, numbered }`, `PlanBadgeView`) on the public profile and card views the app reads (users, creators, professionals), served only while the tier is active. A Founding Maker gets a number allocated once at purchase and kept (additive column; G-421).
- "Priority in search" for Verify Plus (G-420): rank by active tier in search and Explore only if the owner asks; this task does not change ranking.
- No existing field is renamed, retyped or widened (web and dashboard keep working, V3).

## Capability checks

- [ ] A person with an active Verify tier shows the badge on their public profile; with an ended tier it disappears.
- [ ] Two Founding Makers get different numbers, each kept for life, allocated once even if the payment confirmation repeats.
- [ ] The protected route suite passes unchanged.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
