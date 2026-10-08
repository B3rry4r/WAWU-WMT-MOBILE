---
id: FIX-06
title: An admin's unlist cannot be undone by the professional
owner: YOU
area: FIX
order: 186
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [PROS-02]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-06 · An admin's unlist cannot be undone by the professional

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/PROS-02.md` (the professionals backend) and `tasks/PROS-03.md` ("Verifier report, independent (lead)", Outside this task)

## Goal

Found by PROS-03's independent verifier (8 Oct 2026): the admin "unlist" route writes the same `listed = false` as a professional's own Hide, so the professional can Show again a listing an admin pulled. An admin's decision must hold until an admin reverses it.

## Scope

Keep the admin's unlist apart from the person's Hide (for example its own column or state with who set it and when), so the person's Show cannot list a profile an admin unlisted, and the person's P8 says it was taken down (the app's wording comes from PROS-03; this task returns a state the app can read). Existing rows keep their meaning: a migration with a backfill that treats today's `listed = false` rows as the person's own Hide unless an admin audit row says otherwise. If the admin route is on the protected list, its answers stay the same; say which routes are protected.

## Capability checks

- [ ] An admin unlists a listing; the professional's Show answers a refusal and the directory still hides it.
- [ ] An admin lists it again; the professional can Hide and Show as before.
- [ ] A professional's own Hide and Show behave exactly as today.
- [ ] Protected routes 253/253; any web caller of the admin route sees the same answer.

## Builder report

Builder (lead's agent), 8 Oct 2026. Backend `wmt/FIX-06` `aecae49` (on main `3041887`), mobile `wmt/FIX-06` (on main `4faa136`). Evidence (not committed): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bf06/` (logs, `mutate.py`, `mutants/results.json`).

- **Who writes `listed`.** The person's Hide and Show, `PATCH /professionals/applications/:id/listing` (protected; web `src/lib/api/professionals.ts:107`, app PROS-03 `src/features/pro-listing/api.ts:58`); the admin's `POST /admin/professionals/:id/unlist` (protected; dashboard `adminProfessionalsUnlist`, no web caller). Also `POST /professionals/applications` (protected; web, app P5) writes true on a new or resubmitted application, admin approve true and reject false (protected; dashboard): none of these can touch an approved listing, so none can undo a takedown.
- **Who reads it.** Web directory and profile `GET /professionals`, `GET /professionals/:id` (protected, web); app directory and profile `GET /professionals/directory`, `/directory/:id` (not protected, app); the feed's professional suggestions (`feed-cards.service.ts` `professionalCandidates`, H10, app); P8 and M2 through `GET /professionals/applications/mine` (protected; web, app); the data export. Admin views: only the decision answers (approve, reject, unlist) carry `listed`; the queue and detail never show it.
- **Built (backend).** New side table `ProfessionalTakedown`, migration `20261015100000_professional_takedown` (after main's newest `20261012100000` and the in-flight `20261014100000` EVENTS-11 and `20261014200000` LEGAL-03): one row per listing with who took it down and when (admin id, email, role snapshots), `ownerListed` (the person's own choice), and who lifted it and when. A side table, not a column: `.../mine`, `POST .../applications` and `PATCH .../listing` return the whole row, so a column would add a key to three protected answers. `listed` stays what every reader goes by and is false while a takedown stands, so no reader changed. Unlist records the takedown (same answer, same five keys; a second unlist while down changes nothing). Show on a taken-down listing answers 409 with "This listing was taken down by an admin and cannot be shown. It stays hidden until an admin lists it again." and `reason: { code: 'listing_taken_down', takenDownAt }`; a Hide is accepted and kept. New `POST /admin/professionals/:id/relist` (superadmin, reviewer) lifts it and puts the listing back to the owner's choice; 409 `listing_not_taken_down` when none stands. New `GET /professionals/applications/mine/visibility`, the state P8 reads: per approved listing `{ id, category, visibility: listed | hidden | taken_down, takenDownAt }`. All three writes lock the listing row first (`SELECT ... FOR UPDATE`). Purge map: `ProfessionalTakedown.wawuUserId` OWNED; data export: new section `professionalTakedowns` (listing id, `takenDownAt`, `liftedAt`, never which admin). Files: `prisma/schema.prisma`, the migration, `src/professional/professional-takedown.ts` (new), `professional.service.ts`, `professional.controller.ts`, `src/admin/professional-review/admin-professional-review.{service,controller}.ts`, `account-purge/account-data-map.ts`, `data-export-request/data-export-sections.ts`, spec `src/professional/tests/professional-takedown.contract.spec.ts` (12 tests), `contract/openapi.json` (regenerated).
- **Backfill.** None is needed, and the migration says why: no table ever recorded a professional unlist (`AdminOpsResource` has no professional value; the other audit tables cover content, KYC, verification, events, ads, notifications), so no admin audit row says otherwise and every existing `listed = false` row stays the person's own Hide (or a rejection). Proved on a database at main holding an approved hidden, a rejected and a listed row: after `migrate deploy` the rows are byte-equal, 0 takedown rows, `migrate status` up to date, `migrate diff` against the schema shows only main's known `DROP INDEX "ContentPiece_specializations_idx"`; spec "a listing hidden before this task ... their Show works".
- **Protected routes.** Lock unchanged: `scripts/protected-routes/run.sh --fresh HEAD` (lock `origin/main` `3041887`) 253/253, all 244 required. The unlist answer keeps its five keys (spec checks the key set). `PATCH .../listing`: every answer the lock pins is unchanged, and for every listing that exists at deploy the route answers exactly as before (there are no takedown rows at deploy); its new 409 is answered only for a listing an admin unlists after this deploy. The web's page (`src/app/(app)/professionals/mine/page.tsx:44-55`) leaves the switch where it was on any refusal, as it does for today's 409. Default (agent), owner may override: the refusal sits on the one Show route both clients call, because the capability is "the professional's Show answers a refusal" and the web must not be able to undo a takedown either.
- **Capability 1 (admin unlists; Show refused; directory hides): passed.** Spec "an admin unlists a listing; the owner's Show is refused and every directory still hides it": 409, the sentence, `reason.code`, `takenDownAt`; `listed` false in Postgres; absent from `GET /professionals`, `/directory`, 404 on `/professionals/:id` and `/directory/:id`; the takedown row names the admin. Spec "P8 reads the takedown". Spec "a Show that arrives while an admin is taking the listing down waits for it, then is refused" (row held open in a second connection).
- **Capability 2 (admin lists again; Hide and Show as before): passed.** Spec "an admin lists it again; the owner hides and shows it as before" (back in all four surfaces, visibility `listed`, lifted by the reviewer on record, then Hide and Show 200 both ways); "a Hide while it is down is accepted and kept"; "a second takedown after a lift"; "relist refuses a listing no admin took down"; roles: support and finance 403, a user token and no token 401.
- **Capability 3 (own Hide and Show as today): passed.** Spec "the owner's own Hide and Show on a listing no admin pulled behave exactly as before": both 200 with the lock's 15 keys, directory follows, no takedown row; the old refusals (409 not approved, 403 not yours, 404) unchanged and carry no `reason`.
- **Capability 4 (protected 253/253; web caller of the admin route sees the same answer): passed.** Above. The admin route has no web caller; its dashboard caller gets the same five keys and values.
- **Mutants: 12 of 12 killed** (each applied, specs run, `git restore`, tree clean after): Show not refused; unlist records nothing; relist lists whatever the owner chose; visibility never `taken_down`; a second unlist overwrites the first; a Hide while down not kept; relist of a listing nobody took down lists it; a lifted takedown still stands; P8 reads lifted takedowns as standing; export section dropped (data-export-map spec); purge rule dropped (account-data-map spec); row lock removed (the held-row spec).
- **Checks.** `tsc` 0; eslint on the 9 changed `.ts` files 0; specs of every touched module and every reader (`src/professional`, `account-purge`, `data-export-request`, `verification`, `feed-cards`, `block-hides-people`): 10 suites, 173 tests pass; gates 16 fail / 58 warn / 76 accepted, the same lines as main; `check_baseline.py` 0; tripwire: no added line matches; `npm run contract:build` regenerated (+2 paths, +1 schema, the 409 described; a second run byte-equal). Mobile: `npm run api -- --backend` copies backend `origin/main`, so no diff until the backend merges (then `GET .../mine/visibility` and `ProfessionalListingVisibilityView` appear; `relist` is excluded by its Admin tag); `npm run check` exit 0 before and after (76 suites, 1377 tests; gates 0; tasks 222).
- **Gap filed:** G-331 (P8 reads the takedown and offers no Show): PROS-03 (app). No SHARED-CHANGES row.
- **Decisions, each Default (agent), owner may override.** Relist puts the listing back to the owner's own choice (hidden if they hid it before or during the takedown), not listed outright. A Hide during a takedown is accepted and kept. A second unlist while down keeps the first takedown on record. Takedown rows go with the account on purge (OWNED, as `FeaturedCreator`), not kept as an audit trail. The export carries dates, never which admin. A listing an admin pulled before this deploy is not converted (nothing recorded it); unlisting it once more makes it hold. The dashboard cannot yet see whether a listing is taken down (its queue and detail are protected and carry no `listed`); its "List again" gets 409 `listing_not_taken_down` when nothing stands. A read for it would be an additive admin route; none was built because no dashboard task asks.
- **NOT RUN.** (1) The full backend suite in its own network namespace: this session's permission policy refused the `unshare -n` runner, and refused the host run of `src/common/tests/route-shadowing.regression.spec.ts`. Unblocked by running `bf06/ns/ns2.sh` (copied from `t3ns`, paths set to this worktree and `f06_full_test`) in a session allowed to `unshare -n`; the lead runs it before merging. (2) V9 through a built Hub, the web and the app: the specs drive the real controllers, guards, pipe and filter on a real Postgres with the mock WAWU ID; unblocked by the verifier's V9. (3) P8 saying "taken down" in the app: PROS-03 (G-331), after the backend merges and `npm run api` copies main.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
