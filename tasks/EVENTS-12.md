---
id: EVENTS-12
title: Hosting an event needs an active tier (backend)
owner: YOU
area: EVENTS
order: 265
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [TIER-02, EVENTS-11, TIER-07]
decisions: [R-43, R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-12 · Hosting an event needs an active tier (backend)

## Current state

As of 18 Oct 2026, builder round 1 done (Sonnet builder, bundle S9). Status: verifying.
- **Branches:** backend `wmt/S9` `50066b9` (built on `origin/wmt/EVENTS-11` `71117e4` with `origin/wmt/MERGE-14` `195de50` merged in, merge commit `4c52e57`, no conflicts; EVENTS-11's own lock change is carried as it was, nothing widened). Mobile `wmt/S9` (records only: this file and FIX-12's).
- **Built:** hosting reads the tier. A live tick or a running tier (`active` or `ending`) hosts; anyone else gets 403 `tier_required` with `tierState` (`none` or `ended`), `currency` and the cheapest tier of `GET /plans` (`lowestTier`). Gated routes: `POST /events`, `PATCH /events/{id}`, `PUT /events/{id}/tickets` (the Hub has no `PUT /events/{id}`; PATCH is the edit).
- **Ended tier:** refuses a new event, an edit and a price change; a live event stays public and keeps selling. Price changes on an approved event still go back to review (R-40).
- **Decisions to confirm:** (1) a tier of any account type hosts (a buyer account with a running tier does); a buyer with neither still gets `account_type_required`. (2) The status stays 403 and the code is additive; `verification_required` is no longer answered by these routes (the web reads only `reason.code` and `message`). (3) Five spec assertions of `verification_required` became `tier_required` (see the report).
- **Protected suite:** 253/253, all 244 required, against the branch's own lock (EVENTS-11's); this commit changes no file of the lock or the suite. Route table unchanged (603 routes, same order).
- **Open findings:** none yet (not verified).
- **Gaps:** G-EVENTS-12-1: the app's `hostApi.ts` does not know `tier_required` (DV2-04 builds E21 on it). G-EVENTS-12-2: nothing tells the app before a POST whether a person may host (a live tick hosts with state `none`); `GET /me/tier` could carry it. No SHARED-CHANGES row was filed (records limited to the task files): `contract/openapi.json` is additive, +140 lines.
- **Next:** a verifier checks `wmt/S9`; DV2-04 builds the E21 screen on `tier_required` (the app still reads only `verification_required` and `account_type_required` in `hostApi.ts`).
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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-12.md](history/EVENTS-12.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
