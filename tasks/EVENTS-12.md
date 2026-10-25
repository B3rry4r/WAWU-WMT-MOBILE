---
id: EVENTS-12
title: Hosting an event needs an active tier (backend)
owner: YOU
area: EVENTS
order: 265
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [TIER-02, EVENTS-11, TIER-07]
decisions: [R-43, R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-12 · Hosting an event needs an active tier (backend)

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 17.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S9.md`: the gate checked over HTTP, 40 checks 0 fail, NGN and USD refusals equal `GET /plans`; only 3 writers, all gated; a live event keeps selling after the tier ends; 10 of 10 mutants killed). Backend `wmt/S9` `50066b9`, records `f6b9c30e`. Stacked in batch 17 by MERGE-17 (backend `wmt/MERGE-17`, mobile `wmt/MERGE-17`); not on main.
- **Merge (MERGE-17):** the backend carries EVENTS-11's migration `20261025090000_event_ticket_type_retired` and its lock change (`.pipeline/protected-registry.json`, `test/protected-routes/registry.ts`, the protected suite's spec), so the batch's backend pull request needs the owner's `relock-approved` label, as backend PR #83 does; its protected run is red by exactly 10 tests (first: `GET /admin/events/queue` `ticketTypes`) until then. The contract change is additive (3 new 403 responses, 3 new schemas): SHARED-CHANGES row EVENTS-12 #1, added at MERGE-17. The gap rows G-EVENTS-12-1, G-EVENTS-12-2 and G-FIX-12-1 were named in the task files and had no row; MERGE-17 added them to BACKEND_GAPS.md. DV2-04 follows in batch 18 and builds E21 on `tier_required`. The verifier's lows are SWEEP-EVENTS rows S9 L1, L2 and N1.
- **Branches:** backend `wmt/S9` `50066b9` (built on `origin/wmt/EVENTS-11` `71117e4` with `origin/wmt/MERGE-14` `195de50` merged in, merge commit `4c52e57`, no conflicts; EVENTS-11's own lock change is carried as it was, nothing widened). Mobile `wmt/S9` (records only: this file and FIX-12's).
- **Built:** hosting reads the tier. A live tick or a running tier (`active` or `ending`) hosts; anyone else gets 403 `tier_required` with `tierState` (`none` or `ended`), `currency` and the cheapest tier of `GET /plans` (`lowestTier`). Gated routes: `POST /events`, `PATCH /events/{id}`, `PUT /events/{id}/tickets` (the Hub has no `PUT /events/{id}`; PATCH is the edit).
- **Ended tier:** refuses a new event, an edit and a price change; a live event stays public and keeps selling. Price changes on an approved event still go back to review (R-40).
- **Decisions to confirm:** (1) a tier of any account type hosts (a buyer account with a running tier does); a buyer with neither still gets `account_type_required`. (2) The status stays 403 and the code is additive; `verification_required` is no longer answered by these routes (the web reads only `reason.code` and `message`). (3) Five spec assertions of `verification_required` became `tier_required` (see the report).
- **Protected suite:** 253/253, all 244 required, against the branch's own lock (EVENTS-11's); this commit changes no file of the lock or the suite. Route table unchanged (603 routes, same order).
- **Gaps:** G-EVENTS-12-1: the app's `hostApi.ts` does not know `tier_required` (DV2-04 builds E21 on it). G-EVENTS-12-2: nothing tells the app before a POST whether a person may host (a live tick hosts with state `none`); `GET /me/tier` could carry it. No SHARED-CHANGES row was filed (records limited to the task files): `contract/openapi.json` is additive, +140 lines.

Status set to review by the records sync, 25 Oct 2026: merged as backend 33b627f0, verifier PASS in this file (PASS, no blocker, high or medium).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-12.md](history/EVENTS-12.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
