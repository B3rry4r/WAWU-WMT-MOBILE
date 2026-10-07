---
id: EVENTS-11
title: Changing ticket prices on a live event needs a current verification and goes back to review
owner: YOU
area: EVENTS
order: 183
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [EVENTS-02]
decisions: [R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-11 · Changing ticket prices on a live event needs a current verification and goes back to review

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-40, and B3 in the hosting rules (hosting an event is verified-only)
- `tasks/EVENTS-02.md`: finding F6, "F6 proof", and the lead merge note
- backend `src/event/` (`PUT /events/:id/tickets`, the hosting gate used by POST and PATCH /events) and `.pipeline/protected-registry.json`

## Goal

Today `PUT /events/:id/tickets` lets a host whose verification has lapsed, or who was never verified, change the ticket tiers and prices of an event an admin already approved, and the event stays public with no second look. POST and PATCH /events already refuse such a host and send edits back to review. The ticket route must follow the same two rules.

## Scope

1. `PUT /events/:id/tickets` runs the same hosting gate as POST and PATCH /events: same 403 reasons and the same error shape (`account_type_required`, `verification_required`), checked before anything is written.
2. A tier change on a `published` event sets the event back to `pending`, as a PATCH does today: strangers get 404 until an admin approves it again, and the host still reads it. An edit to a `pending` or `rejected` event leaves it `pending`.
3. Once any ticket on the event is sold, the existing 409 stays exactly as it is (it is checked first, and nothing changes).
4. A request that changes nothing (the same tiers sent again) changes nothing, including the status.
5. Additive only in shape: no field renamed, retyped or removed. This is a deliberate behaviour change to a protected route, ruled by the owner (R-40). If the protected suite (`scripts/protected-routes/run.sh`) has a test that asserts the old behaviour (an unverified host succeeding, or a published event staying published after a tier change), do NOT edit the test, the lock or the registry: stop and report the test name to the lead, who takes it to the owner.

## Capability checks

- A verified host changes a tier price on an approved event: 200, the event is `pending`, a stranger gets 404, an admin approves it, and the new price is public.
- The same host after their tick lapses: 403 `verification_required`, nothing written, the event stays public at the old price.
- A buyer account and a never-verified creator: 403 with the right reason, nothing written.
- With one ticket sold: 409 as today, nothing written.
- The web's own event pages and checkout still read the event as before (V3 byte compare on a verified host's flow).

## Builder report

Backend `wmt/EVENTS-11` `814e5fb` (from main `3041887`). Evidence under the lead's scratchpad `be11/`.

- **Change.** `PUT /events/:id/tickets` calls `EventService.assertMayHost`, the gate POST and PATCH /events use (made public, still one copy), after the checks it already had (404, "not yours" 403, cancelled 409, tier price 400, the sold-ticket 409: unchanged and still first) and before any write. A tier change on a `published`, `rejected` or `pending` event writes `BACK_TO_REVIEW` (the `pending` plus cleared reason PATCH writes, now one exported const both use) in the same transaction as the tiers. The same tiers sent again write nothing (tier ids, status, `updatedAt` unchanged). Files: `src/event/event.service.ts`, `src/event/event.module.ts`, new `src/event/event-service.module.ts` (EventService without a controller, so no route moves: the booted route table equals main's, 435 routes, same order), `src/event-ticketing/event-ticketing.module.ts` and `.service.ts`.
- **Spec** `src/event-ticketing/tests/event-tickets-review.contract.spec.ts` (new; no other test, gate or baseline edited): 11/11 on the branch; on origin/main 8 of 11 fail (gate cases 200 not 403, status stays `published`/`rejected`, re-sent tiers get new ids); the 3 that pass on main pin unchanged behaviour (sold 409, removed stays removed, the earlier checks keep their answers).
- **Over real HTTP**, built Hub with its own migrated and seeded database, mock WAWU ID, superadmin from `npm run admin:seed`, ticks set in the database. Before = main on :5353, after = branch on :5351 (`live-main.out`, `live-branch.out`):
  - verified host reprices an approved event ₦5,000 to ₦7,500: before 200, stays `published`, public at once, not in the admin queue; after 200, `pending`, host 200, stranger 404, in the queue, admin approve 200, stranger 200 at ₦7,500.
  - same host, tick lapsed, sends "Repriced" ₦1 x 500,000: before 200 and public at ₦1; after 403 `verification_required`, body identical to PATCH's 403, nothing written, still public at ₦7,500.
  - buyer account, never-verified creator (each holding a published event, rows written directly since no route lets them create one): before 200 and 200, rows changed; after 403 `account_type_required` and 403 `verification_required`, nothing written, still `published`.
  - one free ticket taken (POST orders 201): 409 "Tickets have already sold for "Entry"..." before and after, for a verified and a lapsed host, nothing written.
  - same tiers sent again: before 200 with the tier row replaced (new id); after 200, row and status identical.
  - GET /events/:id, GET /events/:id/tickets and GET /events have the same JSON shape on both Hubs.
- **Checks.** tsc 0. eslint 0 on the 5 changed source files and the spec. Gates 16 fail, the same 16 lines as main (58 warn on both). `contract:build` leaves `contract/openapi.json` unchanged, so `npm run api` here changed nothing. Tripwire: no added line matches. Secret scan of the staged diff: nothing key-shaped. `src/event` + `src/admin/events` + `src/event-ticketing` specs: main 134/134, branch 118/145 (the 11 new pass; all 27 failures are EVENTS-05's file, below). AppModule-booting specs (route shadowing, payment webhook, admin payments, blocked accounts, admin ops reads) pass; protected-registry spec 52/52 alone on branch and main. Mobile `npm run check` exit 0 before (63 suites, 1143 tests) and after.
- **Protected suite** (`run.sh --fresh HEAD`, lock unchanged): main 253/253; branch **246/253 (237 of 244 required)**. The PUT probe itself passes (its creator is verified) but now sends the suite's published `{{eventId}}` back to `pending`, so 7 later probes that need it published fail, which is the old behaviour R-40 changes: `GET /events/:id` as buyer (locked 200, now 404), `POST /events/:id/going` and `DELETE /events/:id/going` (200, now 404), `POST /events/:id/orders` (201, now 409 "Tickets are not on sale for this event."), `POST /events/orders/:orderId/verify` (needs `{{eventOrderId}}`, never captured), `POST /admin/events/:id/remove` and `/restore` (200, now 400 "can only be removed from published" / "restored from removed"). Test, lock and registry not edited: for the lead to take to the owner.
- **Existing spec asserting the old behaviour, not edited:** `src/event-ticketing/tests/event-running.contract.spec.ts` (EVENTS-05). Its `beforeAll` sends `PUT /events/:id/tickets` as `user@test.wawu.dev`, who holds no tick, on `published` fixtures, expects 200 and then buys on them: 27/27 fail on the branch (403), 27/27 pass on main. Needs the same ruling.
- **Decisions** (Default (agent), owner may override): a `removed` event keeps its status after a tier edit (sending it to `pending` would undo an admin's takedown); the gate runs before the "no change" answer, so a lapsed host re-sending the same tiers is 403; a tier edit on a `pending` event clears the decision reason too, as PATCH does. Seen, not changed: `GET /events/:id/tickets` lists a `pending` event's tiers to anyone with its id (protected route, outside this task).
- **NOT RUN:** full backend suite in a network namespace (it fails the EVENTS-05 file and the 7 protected probes until the lead's ruling on them; unblocked by that ruling). V3 web byte compare on a verified host's flow (verifier pass; only read shapes compared here). Real WAWU ID (mock used). Fintava not touched.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
