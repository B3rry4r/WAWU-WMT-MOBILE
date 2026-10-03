---
id: EVENTS-02
title: Event hosting backend: hybrid events, more event types, tickets sent with the event
owner: DEV3
area: EVENTS
order: 4
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-8]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-02 · Event hosting backend: hybrid events, more event types, tickets sent with the event

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

E13-E16 ask for things the event model lacks and submit in one go.

## Scope

Additive: hybrid format, Conference and Concert kinds, ticket types in the same submit, ₦0 tickets per R-8.

Also: E14's category labels map to EventCategory (for example 'Business & Finance' to business), and the required `location` that no step collects becomes optional (additive), so EVENTS-04 doesn't have to work around it.

## Capability checks

- [ ] A host submits an event with two ticket types in one request and it goes to review.

## Builder report

Backend `wmt/EVENTS-02` (e8a0d8d, main a055b4f merged in acf062d). Files: `prisma/migrations/20261003180000_event_hybrid_conference_concert` (additive: EventFormat `hybrid`, EventType `conference`, `concert`; the task names these, so it is the schema change the fence allows) and those enums' comments in `prisma/schema.prisma`; `src/event/dto/create-event.dto.ts` (`ticketTypes[]`: name, priceNaira, quantity, optional tier; `location` optional); `src/event/event.service.ts` (event and tiers in one write; no tier and ₦0 is `free`, R-8; a named tier keeps PUT /events/:id/tickets' rules); new `GET /events/options` (`src/event/event-options.ts`: value and label for every category, format and kind, "Business & Finance" is `business`); `contract/openapi.json` regenerated (`npm run contract:build`, identical again after the merge).
- Check "A host submits an event with two ticket types in one request and it goes to review": PASSED. `src/event/tests/event-hosting.contract.spec.ts` (16 tests: two tiers in one POST land `pending` with both rows, host-only until approved; ₦0 is free; a ₦0 VIP or a priced free tier is 400 and saves nothing; `"5,000"`, decimals, kobo, `sold` and unknown tiers 400; unverified host 403, nothing saved; hybrid, conference, concert accepted and filterable; location from address; options cover every value). Live on :4110 with the mock WAWU ID on :4111: sign-in, POST with Regular ₦5,000 x 100 and VIP ₦12,000 x 20 returned 201 `pending`, read back via GET /events/:id and GET /events/:id/tickets, present in GET /admin/events/queue, a stranger gets 404. The host's tick was set in the database for that run and restored.
- Event specs (event, admin events, ticketing): 89 passed before, 105 passed after. Full contract suite (jest --runInBand, :4111, protected suite apart): 7 suites failed (43 tests) on the branch; all 7 also fail on main 48b9043 in this sandbox (main: 24 suites failed): they hardcode the WAWU ID on :4001, which another session's mock holds, so tokens 401. V3 protected suite (`scripts/protected-routes/run.sh --fresh`): main 253/253, branch 253/253 before and after the merge.
- Gates: before 16 fail, 12 warn, 76 accepted (main 48b9043); after the merge 16 fail, 13 warn, 76 accepted, equal to main a055b4f (the extra warn is WALLET-14's). Baseline check passes. tsc 0 errors. eslint 4,488 problems on main a055b4f and on the branch; the new and changed event files have 0. Mobile `npm run check`: before, exit 1 only because main's PROGRESS.md was stale; after, see LOG.
- Changed test: `event.contract.spec.ts` sent `hybrid` and `conference` as the unknown values; both are now valid, so it sends `in_space` and `festival` (still proves unknown values 400).
- Default (agent), owner may override: `location` stays a non-null string on the wire (the web reads it); left out it is the street address, or `''` with none, and follows a later address edit only if it came from the address. Ticket prices stay `priceNaira`, like PUT /events/:id/tickets.
- Copy not on the canvas, for the owner to read: category labels Music, Entertainment, Conference, Training, Fashion, Lifestyle, Community, Church, Other; kind labels Summit, Webinar, Competition.
- Filed G-55: E13 to E15 never ask for the Kind, and `type` is still required. Hybrid, Conference and Concert reach the web's list for new events only; the web shows them as it shows any value it does not know.
- NOT RUN: mobile `npm run api` (it copies the contract from backend main, so the new types arrive after merge); Fintava (not used by this task).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
