---
id: ADS-05
title: Count ad views and taps
owner: DEV2
area: ADS
order: 39
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [ADS-04]
decisions: [R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-05 · Count ad views and taps

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Advertisers are billed and reported on views and taps.

## Scope

POST impression, tap, skip; one view per person per day; daily totals.

## Capability checks

- [ ] Opening the same card twice in a day counts one view.
- [ ] Daily totals match the raw events.

## Builder report

Backend branch `wmt/ADS-05` (on `wmt/ADS-04` / ADS-03, merged in, not rebased; neither is on main yet). Backend files: `prisma/schema.prisma` (appended block + two back-relation lines in `AdCampaign`), migration `20261006133700_ads_event_counts`, `src/ads/ads-events.{controller,service,module}.ts`, `ads-counts.service.ts`, `ads-counts.type.ts`, `ads-day.ts`, `dto/ads-events.dto.ts`, `tests/ads-events.contract.spec.ts` (37 tests), `src/account-purge/account-data-map.ts` (one entry), `src/data-export-request/data-export-sections.ts` (one exclusion), `src/app.module.ts` (one import, one entry), `contract/openapi.json` (regenerated: the one route and `RecordAdEventDto`). Mobile: this file, `BACKEND_GAPS.md` G-197 to G-200, `SHARED-CHANGES.md` ADS-05 #1 and #2, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/INDEX.md`.
- **Decisions (the task is silent or short):** `POST /api/hub/ads/:id/events` body `{ "type": "view" | "tap" | "skip" }` (the task's words, not the analysis's impression and click); signed-in like `GET /ads`; 200 `{ accepted: true }` for a first report and a repeat alike, so a retry is safe and the answer leaks nothing; no Idempotency-Key, because the once-per-day key IS the idempotency. Once per person, per campaign, per kind, per UTC day (the task says one view; the card's check says each of three is counted once). Counted only while the campaign is served (scheduled or live, startsAt <= now < endsAt, has a creative), no grace; anything else, and an unknown id, is one identical 404 "Ad not found". A bad id (not a uuid) or body is 400. Rate limit: the app's global one (20 a second, 200 a minute); no new number, so no new PROVISIONAL marker. Server UTC clock only.
- **Storage and why two tables:** `AdEvent` (campaign, person, kind, day; the primary key is the dedupe) and `AdDailyTotal` (campaign, day, three counts). One SQL statement inserts the event `ON CONFLICT DO NOTHING` and adds to the day's total only when the row was new, so the totals equal the raw events and parallel requests cannot double count. The person is stored because per-day dedupe needs it; the totals hold no person, so an account purge (AdEvent is OWNED) removes the person without lowering what was invoiced. Deleting a counted campaign is refused (RESTRICT); history is kept when a campaign is paused or ends.
- **Capability 1, the same card twice in a day counts one view:** HTTP spec with mock WAWU ID tokens on a seeded database: two views by one person is one event row and one total; same for tap and skip; one of each kind is three; a second person counts; the next UTC day counts again; the cut is tested at 23:59:59.999 and 00:00:00.000; 30 parallel taps from one person count once; 8 people with 4 parallel views each count 8; 15 parallel mixed reports count one of each.
- **Capability 2, daily totals match the raw events:** a 16-report plan over 3 people and 3 days with deliberate repeats is worked out by the spec itself and compared with the helper, with the raw rows counted straight from the table, and `reconcile()` is empty; a test edits a total by hand and a raw row away and `reconcile()` reports the day.
- **Also tested:** 401 without or with a bad token; 400 for each bad id, type and extra field; exact response and 404 key sets; eligibility at every status and at start-1ms, start, end-1ms, end; no creative; identical 404 bodies for unknown, draft, paused, ended, not-yet-begun, no creative, with no id or status word in them; counts unchanged through pause, end and resume; the read helper's zeros, CTR 0.25, taps with no views, span limits, bad day strings, `summary`, `totalsFor`; purge removes only that person's rows and leaves the totals; DB refuses a stray kind, duplicate, negative count and unknown campaign; the report index exists; beside `GET /ads` in one app; 429 beyond the app limit; real clock. The spec removes its rows and every table's row count equals its start; passes alone, twice in a row, beside the ADS-03 and ADS-04 specs, account-purge and route-shadowing.
- **Mutation check (scratch edits, restored, never committed):** each of these made the spec fail: status filter removed (4 tests), `lte` to `lt` (1), `gt` to `gte` (1), creative filter removed (2), day shifted 2 hours (2), 404 naming the id (1), tap stored as view (14), skip total counting taps (9), totals bumped on every report (12), CTR inverted (5), CTR 0 instead of null (4), `from` ignored (1), `reconcile` always empty (1), guard removed (30), uuid pipe removed (1), type validation removed (29), extra key in the answer (1), purge entry removed (2), clock 5 s early (4), check-then-insert instead of one statement (2). Run before the `delivery` rename of the read helper.
- **Gates before then after:** Backend, BEFORE = `origin/main` a94f338 on its own worktree and `npm ci`, AFTER = this branch (ADS-04 and ADS-03 merged in). Both ran in an isolated network namespace with their own Postgres and their own mock WAWU ID on :4001, because other builders' mocks on :4001 gave false 401s (an earlier run on the host showed them; those results were discarded). tsc 0 and 0; eslint (no --fix, whole `{src,apps,libs,test}` glob) 4514 problems both, per file and rule identical, so my files add none; gates 16 fail / 34 warn / 76 accepted before, 16 / 36 / 76 after (+1 ADS-03, +1 ADS-04, +0 here: no new number invented); `check_baseline.py` exit 0 both; `test:contract` 152 suites / 3665 tests (15 failed) before, 155 / 3810 (15 failed) after, the same two suites failing both times: `money/receipts/tests/receipt-units.spec.ts` (Node Unicode table, environment only) and `tests/hub-rate-limits.contract.spec.ts` (fails the same on main here; not caused by this branch; cause not investigated); `data-export.contract.spec.ts` passed with `ADMIN_JWT_SECRET` set; `scripts/protected-routes/run.sh --fresh` 244/244 on main and on `wmt/ADS-05`. A first run found `data-export-map.spec.ts` failing on this branch (every owned model must be exported or excluded): fixed by listing `AdEvent` in `EXPORT_EXCLUDED`. Mobile `npm run check`: exit 0 before and after (docs only): 43 suites, 754 tests, gates 0 fail on 195 files, no OpenWalletScreen timeout; the BEFORE was taken on a clean checkout of origin/main.
- **Gaps and shared changes:** G-197 (UTC day, once per day for all three kinds), G-198 (no grace for late reports; a tap needs no view), G-199 (counts are reporting; purge keeps totals; counted campaign not deletable; export excludes ad activity), G-200 (what ADS-06 calls, and the wiring left to whoever merges second); SHARED-CHANGES ADS-05 #1 and #2.
- **Not done:** `delivery` and the per-day list are not added to ADS-06's admin report views: they are on the unmerged `wmt/ADS-06` (its G-194 asks for them); the helper returns exactly the shape it names and G-200 says who wires it. The app side (ADS-01 sends the events) and the mobile contract copy (`npm run api`) wait for the backend merge. V9 (a live read-back with a real campaign) needs ADS-06 to create one: NOT RUN here.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
