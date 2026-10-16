---
id: EVENTS-12
title: Hosting an event needs an active tier (backend)
owner: YOU
area: EVENTS
order: 265
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [TIER-02, EVENTS-11, TIER-07]
decisions: [R-43, R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-12 · Hosting an event needs an active tier (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): EVENTS-11, TIER-07.
- **History:** none yet. Reports go to tasks/history/EVENTS-12.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-43, R-40 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The host gate for events reads the person's tier instead of the verification tick: hosting needs an active tier (E21 "Needs a tier", from ₦1,000). TIER-02 left this out of scope and the events task it named was never cut; this is that task.

## Scope

- `POST /events`, `PUT /events/{id}` and `PUT /events/{id}/tickets` (R-40 rules) accept a host with an active tier (`GET /me/tier` state active). A person whose current verification tick is still live keeps hosting until that tick ends (additive: nothing live stops working). The refusal says "Needs a tier" with the lowest tier price from `GET /plans` in the person's currency.
- These are protected routes the web calls: behaviour for a host with a live tick is unchanged (V3); the new reason code is additive.
- The app change is DV2-04 (E21 copy and See tiers).

## Capability checks

- [ ] A person with an active tier and no tick can create an event; with neither, the refusal names the tier and its price.
- [ ] A person with a live tick and no tier still hosts until the tick ends.
- [ ] Changing ticket prices on an approved event still goes back to review (R-40).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
