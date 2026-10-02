---
id: INBOX-01
title: Communities: my communities, links, join decisions
owner: DEV2
area: INBOX
order: 7
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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
- **Filed:** SHARED-CHANGES `INBOX-01 #1` (schema, migration, contract); BACKEND_GAPS G-26 (web routes still allow a private room with no cover), G-27 (the web was not checked for the two new kinds; no switch mutes them, owner question). Renumbered from G-25 and G-26 in round 2: main's KYC-01 took G-25.
- **Not done:** mobile types not regenerated (`src/api` is fenced; `npm run api` runs after the backend merges).

**Round 2 (builder, 2 Oct 2026), after the verifier's findings 1 and 2:**
- Finding 1 fixed (backend `ddad519`): approve is `updateMany` on `status: 'pending'`, decline is `deleteMany` on `status: 'pending'`; only the request that changed the row notifies. A losing approve answers 200 with the joined row (as for a member already in) or 404 "No join request..." if a decline won; a losing decline answers 409 with main's existing message (now one shared constant) if an approval won, or 200 `{ declined: true }` if another decline won. Sequential answers are unchanged. New tests, 5 rounds each: three approves at once, three declines at once, approve against decline. Run against the old service code, approve against decline failed (the triple approve did not trigger that run; it is timing-dependent).
- Finding 2: main merged into both branches; gaps renumbered G-26, G-27. G-27 now also records the switch question (G-22, finding 3). `notification-event.ts` header no longer says the kinds are exactly the web's.
- Gates, backend merged with main `d27ad37`, fresh seeded database, own mock on :4001: tsc 0; eslint 3640 errors 850 warnings (as main); gates 16 fail 6 warn 76 accepted, 589 files (as main per the verifier); baseline OK; contract 106 suites, 2083 passed, 0 failed, 3 skipped (protected routes and route shadowing pass). Mobile `npm run check` exit 0.
- Owner questions: unread after leaving and rejoining counts messages sent while away (the old read marker wins; the later of marker and `joinedAt` would match a first join), finding 5; the slug is the whole name (`aba-tailors-circle`), not I33's `aba-tailors`, and the host cannot choose it, finding 6.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier, 2 Oct 2026. Branch as it will land: backend `7e72999` merged with main `d27ad37` (KYC-01; clean merge, local only, not pushed) and, before that, `7e72999` against main `14a7fb2`; mobile `46906ea` with main `bfdd584` merged locally for the check, then aborted (conflict, finding 2). Own worktrees, own Postgres 16 (port 5451, `/var/tmp/inbox01v-pg`) and own mock WAWU ID on :4001, all inside a private network namespace, so the :4001 mock another session was running could not answer the suite. Evidence files are in the verifier's scratchpad (`.../scratchpad/`), named below.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Diff equals the builder's lists (backend 16 files, mobile 5). Backend, merged branch vs main `d27ad37`: `tsc` 0 / 0; ESLint without `--fix` 3640 errors 850 warnings on both, no difference per file and rule (the new files add none); `scripts/gates/run.py` 16 fail, 6 warn, 76 accepted on both (589 vs 584 files scanned), the same findings (one moved line in `notification-event.ts`); `check_baseline.py` 108 entries OK on both; `npm run contract:build` leaves `contract/openapi.json` byte-identical. Before the merge (vs `14a7fb2`): the same, 16/4/76. No em-dash in any added line. Mobile `npm run check` exit 0: 285 tests, gates 75 files 0 findings, 201 tasks; with main `bfdd584` merged: 289 tests, 77 files 0 findings. | `tsc2-*.log`, `eslint2-*.json`, `gates2-*.log`, `contract-build2.log`, `mobile-check*.log` |
| V2 Contract | passed, with one defect (finding 1). Over HTTP on the built server, real wawu-id tokens. `POST /communities/rooms`: private with no cover 400 "A private room needs a cover image."; `imageUrl: ""` 400; plain user 403; no token 401; with a cover 201 and `slug`/`link`; the same name again gets `-2`. `GET /communities/:id/link`: same slug for every caller and every call; non-uuid 400, unknown 404, no token 401. `GET /communities/links/:slug`: 200; in capitals 200; with spaces 200; `wawu%2Fc%2F<slug>`, unknown, `a_b` and 65 characters 404; no token 401. `POST /communities/:id/read`: pending requester 403, outsider 403, member and host 200. `GET /communities/mine`: page 0 and perPage 1000 are 400, no token 401, pending rooms not listed, the keys are the contract's `MyCommunity` exactly. Approve once: one `community_join_approved` ("Request approved", "Open room", `/communities/<id>`), host told nothing; sequential repeat approve and repeat decline send nothing. Concurrent approves: duplicates (finding 1). Concurrent declines: always one notification. | `live.txt`, `live-merged.txt`, `race-*.txt` |
| V3 Regression | passed. Contract suite, same command, fresh seeded database each, own mock: before the merge main `14a7fb2` 102 suites 2019 passed 0 failed, branch 103 suites 2045 passed 0 failed; after the merge main `d27ad37` 105 suites 2054 passed 0 failed, branch 106 suites 2080 passed 0 failed (3 skipped on each; +26 is the new spec). The builder's 62 failures do not reproduce; they came from the shared mock. Protected routes, `scripts/protected-routes/run.sh --fresh`, lock from main: 253 of 253, all 244 required, on `14a7fb2`, `7e72999`, `d27ad37` and the merged `6d52f4b`. Contract, structural diff against main: five new operations and five new schemas, nothing existing changed or removed. Admin dashboard: no admin file changed, every admin spec passes on both. The join-request spec edit is four lines in `afterAll` (a `notification.deleteMany` by the spec's own ids); no assertion changed. The community specs alone leave every table's row count as seeded. | `contract-main*.log`, `contract-br*.log` and `.json`, `protected-*.log`, `protected2-*.log`, `counts-*.txt` |
| V4 Field trace | passed. `CommunityLink.slug`: written only by `ensureLink` (create room, `/link`, `/mine`), read by `/links/:slug`, `/mine`, `/link`, the create answer; cascades with the room. `CommunityReadMarker.lastReadAt`: written only by `POST /:id/read`, read only by `/mine`; in the purge map (OWNED). Notifications: written only through `emit()` from approve and decline, read by `GET /notifications` (the only reader of the table); `actionHref` is built from the room id. Across users: the host's approval reaches the requester's `GET /notifications`; the requester's message is unread to the host and not to the sender; the host's welcome reads as the member's last message with sender name. | `live.txt` |
| V9 Live seam | passed. `scripts/local/up.sh` with the real wawu-id (own worktree, main `d9e6e0a`), `smoke.sh` all passed; the three seeded accounts signed in through wawu-id `/auth/login` (no minted token). Seen only from the server: the room's slug and link, `unreadCount` going 1 to 0 after `/read`, the approval notification. Created a room and read it back through its link. Repeated on the merged build. | `up.log`, `up2.log`, `live*.txt` |

**Capability check.** Notification on approve or decline: passed once per answer for sequential answers (spec and HTTP), failed for concurrent approvals (finding 1). Open `wawu/c/<slug>` and land in the room: passed on the API (the link opens the room, and after approval its messages read); in the app NOT RUN, because the screen and the deep link are INBOX-14 and INBOX-05 (V10 there).

### Findings

1. **defect: two or three approvals in flight send the requester two or three "Request approved" notifications.** The builder's report says a double tap never notifies twice; that holds only for taps one after the other. Reproduced over HTTP, three parallel `POST /communities/:id/requests/:userWawuId/approve` on one pending request, 10 rounds: before the merge 2 rounds wrote 2 notifications; on the merged build 6 of 10 rounds wrote 2 or 3. All answers are 200. Cause: `approveJoinRequest` reads the membership, then updates by id with no status condition and emits after each update, so every request that read `pending` emits. Fixed when the update is conditional on `status: 'pending'` (for example `updateMany` and emit only when one row changed) and a test sends parallel approvals. Same root: a decline racing an approval deletes by id whatever the status, so the person could be told both answers (not tested here; the delete itself is main's code). Once INBOX-03 sends push, each duplicate is a duplicate push.
2. **defect (bookkeeping, blocks a clean merge): gap id G-25 is taken on main.** Main `bfdd584` (KYC-01) added its own G-25, so merging main conflicts in `BACKEND_GAPS.md` and `docs/PROGRESS.md`. This branch's G-25 and G-26 become G-26 and G-27, and the Builder report and the `docs/LOG.md` line must say so. With that resolution `npm run check` exits 0.
3. **unclear: the join answers are not under any switch.** No ruling covers them. The builder's default (an answer to the person's own request, like `kyc_verified`) is recorded in a comment in `notification.service.ts`, but `BACKEND_GAPS.md` G-22 says "any other new notification kind MUST add its entry to `SETTINGS_GATE` ... or it can never be switched off", and G-21 names INBOX-01 as nearest owner of community notifications. G-22 was not updated. The owner decides whether Z3's "Community messages" covers join answers.
4. **unclear: the web will receive two kinds it does not know.** `GET /notifications` is protected and the web reads it. Response shapes are unchanged and the protected suite passes, but approve and decline (both protected) now write rows the web's kind list does not name, and the approval's `actionHref` `/communities/<id>` is unchecked on the web (G-26). The header of `notification-event.ts` still says the kinds "are exactly the ones the web client renders" and "Anything not in this union cannot be written"; that is no longer true. Someone with the web repo should confirm the web shows an unknown kind and has a page at that path (or a dead button, R-27).
5. **unclear (low): the unread rule is not the same on a first join and a rejoin.** On a first join, messages sent before approval are never unread (the host's welcome before approval showed 0). After leaving and being let back in, the old read marker wins, so messages sent while away count (1 observed). Counting from the later of the marker and `joinedAt` would make both the same. No ruling; the owner or INBOX-05 and INBOX-07 decide.
6. **unclear (low): the slug is longer than I33 draws.** I33 shows "Aba tailors circle" with `wawu/c/aba-tailors`; the server makes `aba-tailors-circle` and the host cannot choose it. The canvas draws an example, not a rule; INBOX-14's V5 will show the difference.
7. **Not this task's:** concurrent declines answer 404 to the losing requests (main's code path, unchanged); only one notification is ever written.

**NOT RUN:** the app half of the capability check and V10 (INBOX-14, INBOX-05); push (no sender, INBOX-03); the web's rendering of the new kinds (no web repo); `npm run api` in this repo (it needs the backend merged); an approval racing a decline (finding 1).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
