---
id: INBOX-01
title: Communities: my communities, links, join decisions
owner: DEV2
area: INBOX
order: 7
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-01 · Communities: my communities, links, join decisions

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A member sees their own communities with the last message and unread count, can share a room by a wawu/c/ link, and hears when a host answers their join request. Additive only.

## Scope

My communities with last message and unread; share links by slug; private rooms need a cover; join-decision notifications.

## Capability checks

- [ ] A user who asked to join a private room gets a notification when the host approves or declines; a user can open wawu/c/<slug> and land in that room.

## Builder report

- **Files (wawu-backend, `wmt/INBOX-01`):** new `src/community/rooms/` (controller, service, `community-room.type.ts`, `community-slug.ts`), `src/community/tests/community-rooms.contract.spec.ts` (26 tests); changed `community.service.ts` (approve/decline notify), `community.module.ts`, `community-message.{module,service}.ts` (sender lookup reused), `notification-event.ts` (kinds `community_join_approved`, `community_join_declined`), `notification.service.ts` (comment), `account-data-map.ts`; schema + migration `20261002210000_community_links_and_reads` (tables `CommunityLink`, `CommunityReadMarker`; no column on `Community`, so no web response gains a key); `contract/openapi.json` regenerated. The join-request spec's teardown also deletes the notifications approvals now write (no assertion changed).
- **Routes (all new):** `GET /communities/mine` (hosted and joined rooms, newest activity first, link, last message with sender, `unreadCount`); `POST /communities/:id/read`; `GET /communities/:id/link`; `GET /communities/links/:slug`; `POST /communities/rooms` (the app's create: private needs a cover, answer carries the link). `POST /communities` (web) is unchanged.
- **Check, notification on approve or decline:** contract spec (opens the link, asks, approved, `GET /notifications` holds one `community_join_approved` with "Open room" and `/communities/<id>`; repeat approve sends nothing; decline gives one `community_join_declined`), and live on a built server (:3071, mock WAWU ID login, seeded creator and user), log in the builder's scratchpad.
- **Check, open wawu/c/<slug> and land in the room:** API side tested in the spec and live (link resolves, capitals accepted, unknown 404; after approval the room's messages read). The app's route for the link and the phone check are INBOX-14 ("A user who opens wawu/c/aba-tailors ... lands in that room", V10).
- **Gates before (main 2b407e7) / after (merged with main 14a7fb2):** tsc 0 / 0; eslint 3642 errors 850 warnings / 3640 and 850 (current main also 3640/850); gates 16 fail 3 warn 76 accepted / 16 fail 4 warn 76 accepted (current main identical); baseline 108 entries OK / OK; contract 113 failed 1865 passed / 62 failed 1983 passed, the same 9 suites both times (tests that need a fresh identity from the shared :4001 mock, 401s), no test fails that passed before; protected routes and route shadowing pass. Mobile `npm run check` exit 0 before and after (285 tests, gates 0).
- **Defaults (agent), owner may override:** unread counts messages from others after the last read, else after joining; a host who never opened counts all. Slugs come from the name, fixed after, `-2` for a repeat. Join decisions are not muted by the `communityMessages` switch (an answer to the person's own request, like `kyc_verified`). Approval opens `/communities/<id>`.
- **Filed:** SHARED-CHANGES `INBOX-01 #1` (schema, migration, contract); BACKEND_GAPS G-31 (web routes still allow a private room with no cover), G-32 (the web was not checked for the two new kinds; no switch mutes them, owner question). Renumbered from G-25 and G-31 in round 2: main's KYC-01 took G-25.
- **Not done:** mobile types not regenerated (`src/api` is fenced; `npm run api` runs after the backend merges).

**Round 2 (builder, 2 Oct 2026), after the verifier's findings 1 and 2:**
- Finding 1 fixed (backend `ddad519`): approve is `updateMany` on `status: 'pending'`, decline is `deleteMany` on `status: 'pending'`; only the request that changed the row notifies. A losing approve answers 200 with the joined row (as for a member already in) or 404 "No join request..." if a decline won; a losing decline answers 409 with main's existing message (now one shared constant) if an approval won, or 200 `{ declined: true }` if another decline won. Sequential answers are unchanged. New tests, 5 rounds each: three approves at once, three declines at once, approve against decline. Run against the old service code, approve against decline failed (the triple approve did not trigger that run; it is timing-dependent).
- Finding 2: main merged into both branches; gaps renumbered G-31, G-32. G-32 now also records the switch question (G-22, finding 3). `notification-event.ts` header no longer says the kinds are exactly the web's.
- Gates, backend merged with main `d27ad37`, fresh seeded database, own mock on :4001: tsc 0; eslint 3640 errors 850 warnings (as main); gates 16 fail 6 warn 76 accepted, 589 files (as main per the verifier); baseline OK; contract 106 suites, 2083 passed, 0 failed, 3 skipped (protected routes and route shadowing pass). Mobile `npm run check` exit 0.
- Owner questions: unread after leaving and rejoining counts messages sent while away (the old read marker wins; the later of marker and `joinedAt` would match a first join), finding 5; the slug is the whole name (`aba-tailors-circle`), not I33's `aba-tailors`, and the host cannot choose it, finding 6.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

**Round 2, verifier, 2 Oct 2026.** Backend `ddad519` (already contains main `d27ad37`, which has not moved), mobile `8004f1b` (already contains main `bfdd584`, which has not moved). New worktrees, a new Postgres 16 (`/var/tmp/inbox01v2-pg`, port 5451) and a new mock WAWU ID on :4001, all in a private network namespace. Main compared at `d27ad37`, same setup and the same commands. Evidence files are in the verifier's scratchpad (`r2-*`, `eq-*`, `contract-r2*`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Backend branch vs main: `tsc` 0 / 0; ESLint without `--fix` 3640 errors and 850 warnings on both, no difference per file and rule; `scripts/gates/run.py` 16 fail, 6 warn, 76 accepted on both (589 vs 584 files scanned), the same findings (one moved line in `notification-event.ts`); `check_baseline.py` 108 entries OK on both; `npm run contract:build` leaves `contract/openapi.json` byte-identical. The only em-dash in an added line is main's existing 409 message moved into a constant (finding 8). Mobile `npm run check` exit 0: 289 tests, gates 77 files 0 findings, 201 tasks. | `r2-tsc-*`, `r2-eslint-*`, `r2-gates-*`, `r2-cbuild.log`, `r2-mobile-check.log` |
| V2 Contract | passed. Over HTTP with real wawu-id tokens, the same checks as round 1 (cover rule, `-2` slugs, link stability, capitals and malformed slugs, 400/401/403/404 cases, paging bounds, `MyCommunity` keys), all as before. Races, 10 rounds each, after each round the requester's membership and both notification counts: three approves at once: 200 x3, joined, exactly 1 approval notification every round (also with real wawu-id logins: 1 every round); three declines at once: 200 x3, no membership, exactly 1 decline notification every round; approve against decline: either approve 200 + decline 409, joined, 1 approval, or approve 404 + decline 200, no membership, 1 decline; two approves against one decline: either 200, 200, 409 (joined, 1 approval) or 404, 404, 200 (none, 1 decline). Never both notifications, never two of one kind, and the notification always matches the final state. | `r2-race-br.txt`, `r2-race-approve-realid.txt`, `r2-live.txt` |
| V3 Regression | passed. Contract suite, fresh seeded database each, own mock: main 105 suites, 2054 passed, 0 failed; branch 106 suites, 2083 passed, 0 failed (3 skipped each; +29 is the new spec). Protected routes, `run.sh --fresh` with main's lock: 253 of 253, all 244 required, on `d27ad37` and on `ddad519`. Request equality: main and branch builds side by side on identically seeded databases, the same 36 non-racing requests to the protected community routes (`GET/PATCH /communities/:id`, list, membership, join and leave, requests list, approve and decline as host, non-host, non-creator, bad uuid, unknown room, no token, member, no request, repeated approve and decline, remove member, open room, messages): status and body identical after replacing ids and times (`diff` shows only `GET /communities/mine`, a new route that main answered 400, and the two new notification kinds in `GET /notifications`, finding 4). Contract: five new operations and five new schemas, nothing existing changed. Admin: no admin file changed, every admin spec passes. | `contract-r2main.*`, `contract-r2br.*`, `r2-protected-*.log`, `eq-3101.txt`, `eq-3102.txt` |
| V4 Field trace | passed, unchanged from round 1: slug, read marker and notification each have one writer and every reader checked; the approval reaches the requester and nobody else. | `r2-live.txt` |
| V9 Live seam | passed. `scripts/local/up.sh` with the real wawu-id, `smoke.sh` all passed, seeded accounts signed in through wawu-id `/auth/login`; room created and opened by its link, approval notification, `unreadCount` 1 to 0 after `/read`. | `r2-up.log`, `r2-live.txt` |

**Race answers against main.** Main under the same races (same script, port 3101): approve against decline often answers 200 to the approval while the decline deletes the member it just let in (no membership left after "approved"); declines at once sometimes answer 404. The branch's race answers are each the answer main gives for the same state reached one step at a time: an approval after the request is gone is 404 "No join request from this user for this community." (equality line 26), a decline of a member is 409 with main's message (lines 16, 31), a decline with no request is 200 `{ declined: true }` (lines 21, 25), an approval of a member is 200 with the row (line 15). No non-racing answer changed. Consistent.

**Capability check.** Notification on approve or decline: passed, exactly one per answer, sequential and racing. Open `wawu/c/<slug>` and land in the room: passed on the API; in the app NOT RUN (INBOX-14, INBOX-05, V10 there).

### Findings

1. **closed (was defect): approvals at the same time each notified.** Fixed in `ddad519` (conditional `updateMany`/`deleteMany` on `status: 'pending'`, notify only on the winning change). Re-run above: one outcome and one notification every round in every mode; the new spec's parallel tests pass.
2. **closed (was defect, bookkeeping): G-25 collided with main.** The branch contains main `bfdd584`; INBOX-01's rows are G-31 and G-32; every id in `BACKEND_GAPS.md` is unique; the Builder report and `docs/LOG.md` say so; `npm run check` exits 0.
3. **unclear: no switch mutes the two join answers.** Now recorded in G-32 beside G-22's "every new kind" rule. No ruling decides it; the owner does.
4. **unclear: the web will receive two kinds it does not know** (G-32). Non-racing protected answers are unchanged (V3), but approve and decline now write rows that `GET /notifications` returns to the web, with `actionHref` `/communities/<id>`. Someone with the web repo must confirm the web shows them and has that page (R-27). The stale comment in `notification-event.ts` is fixed.
5. **unclear (low): unread after leaving and rejoining** counts messages sent while away (1 observed again); a first join never counts messages from before approval. Recorded in the Builder report for the owner.
6. **unclear (low): slug form.** The server makes `aba-tailors-circle`; I33 draws `wawu/c/aba-tailors`, and the host cannot choose it.
7. **Not this task's:** main answers racing declines with 404 and lets a racing decline delete an approved member; the branch no longer does either.
8. **unclear (low, existing on main): the 409 message has an em-dash.** Main's live answer for declining a member ("That request was already approved", then an em-dash, then "this person is a member. Remove them instead.") is unchanged on this branch (R-5 says no em-dashes in error messages). The builder moved it into a constant without changing it, which keeps the protected route identical; it is now also the answer when a decline loses a race. Changing it alters a protected route's body, so it is the owner's call (or a later task's).

**NOT RUN:** the app half of the capability check and V10 (INBOX-14, INBOX-05); push (no sender, INBOX-03); the web's rendering of the new kinds (no web repo); `npm run api` (needs the backend merged).

**Round 1 (verifier, 2 Oct 2026), for the record:** V1 to V4 and V9 passed on `7e72999` (with main `d27ad37` merged locally); findings 1 (concurrent approvals sent 2 or 3 notifications, reproduced over HTTP) and 2 (G-25 collision) were defects, so the status went back to building. Both are closed above.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

_Merge note (lead, 2 Oct 2026): AUTH-01 reached main first with G-26 to G-30, so this task's two rows were renumbered at merge: G-26 is now G-31 (private room cover on the web route), G-27 is now G-32 (the two join-answer kinds on the web). Every G-number in this file has been updated._
