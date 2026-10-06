---
id: ADS-03
title: Ads data model
owner: DEV2
area: ADS
order: 27
priority: launch
repo: wawu-backend
type: migration
status: building
depends_on: []
decisions: [R-15]
passes: [V1, V3, V4, V9]
artboards: []
---
# ADS-03 · Ads data model

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

H33 and H36 need sponsored cards with a schedule and a placement.

## Scope

Additive: AdCampaign and AdCreative (advertiser, headline, subline, CTA label, CTA destination from an allow-list, artwork, placement tgif_card or today_slot, start and end, status, weight).

## Capability checks

- [ ] The migration applies on a fresh local database built from every existing migration (`prisma migrate deploy`) and on the OPS-03 seeded database, and adds only new tables or nullable columns.
- [ ] V3 regression suite unchanged.

## Builder report

Backend branch `wmt/ADS-03` (2468204): `prisma/schema.prisma` (block appended at the end), migration `20261006090000_ads_data_model`, `src/ads/tests/ads-data-model.contract.spec.ts`. Mobile: this file, `SHARED-CHANGES.md` row ADS-03 #1, `docs/LOG.md`. No routes; `contract/openapi.json` unchanged (`npm run contract:build` leaves no diff).
- **Model:** `AdCampaign` (advertiser, placement, status, startsAt, endsAt, weight) and `AdCreative` (one per campaign: headline, subline, CTA label, CTA destination + id, artwork URL). Nothing beyond what H33 and H36 draw; no price or payment column (R-15); no personal data, so `account-data-map.ts` needs no entry (its drift spec passes untouched).
- **Allow-list:** the Postgres enum `AdCtaDestination`, today `event` only (the one destination H33 and H36 draw). ADS-06 checks it in its DTO and that the event exists; ADS-04 that it is still open. A new kind is `ALTER TYPE ... ADD VALUE` in the task that needs it. Decided and recorded: one creative per campaign (unique `campaignId`, cascade); variants would be a later additive change.
- **Check 1, applies and adds only new objects:** (a) fresh database from all 91 migrations: `prisma migrate diff` against schema.prisma shows only the known `DROP INDEX "ContentPiece_specializations_idx"`; (b) database built from main's 90 migrations and seeded with `npm run db:seed`, plus rows added to Event and NotificationCampaign: migration applied, per-table `pg_dump --schema-only` of all 107 existing tables byte-identical, whole-schema dump 0 lines removed, data dump 0 lines removed, existing row counts equal, neighbour rows intact; re-running `migrate deploy` applied nothing.
- **Check 2, V3:** `scripts/protected-routes/run.sh --fresh` 244/244 before and after; full contract suite after: 153 suites, 3700 passed, 1 suite failing (see below) as on main.
- **Model spec (42 tests):** valid rows, defaults, bad placement, bad status, end before or equal to start, weight 0, -1, 101, 1000, blank text, bad destination, artwork `javascript:`, `data:`, `ftp:`, creative without campaign, a second creative, cascade, and the serving query plus its index in the plan. Cleans up after itself and checks every table's row count equals its start; passed alone twice, in the middle of the full suite and last, and counts equal the fresh seed afterwards.
- **Gates before then after (main a94f338 on its own checkout and npm ci, then the branch):** tsc 0 and 0; eslint (no --fix) 4514 problems both; gates 16 fail / 34 warn / 76 accepted both (main's own); check_baseline exit 0 both; contract suite 152 suites / 3658 passed before, 153 / 3700 after; the one failing suite both times is `money/receipts/tests/receipt-units.spec.ts` (Node Unicode table, environment only; `data-export.contract.spec.ts` passes with `ADMIN_JWT_SECRET` set). Mobile `npm run check` exit 0 on main's tree (754 tests; OpenWalletScreen did not time out); after exit 0, same 43 suites / 754 tests, gates 0 fail.
- **PROVISIONAL(ADS-WEIGHT-RANGE):** weight 1 to 100, no ruling gives it; it is a CHECK in the migration, not config. Owner to confirm.
- **Not done:** no admin audit columns (ADS-06 may add an audit table); no view, tap or skip tables (ADS-05 adds them, and classifies its per-viewer column in `account-data-map.ts`). No gaps filed.

## Verifier report

Verifier, 6 Oct 2026. Independent session; wrote none of this task's code. Checked backend `wmt/ADS-03` @ 2468204 and mobile @ ffdda0c against origin/main (backend a94f338, mobile 8484195; neither moved). Own worktrees, own Postgres 16 on a tmpfs (port 5463), own mock WAWU ID on :4001 started from the same checkout as each test run, own real wawu-id copy for V9. Everything started was stopped (ps checked), the tmpfs unmounted, the worktrees and caches removed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed, with defects D1 and D2 open | Backend: `tsc --noEmit` 0 on main and branch; eslint without `--fix` 4514 problems on both (3655 errors, 859 warnings; 746 vs 747 files); `scripts/gates/run.py` 16 fail / 34 warn / 76 accepted on both (files scanned 732 vs 733); `check_baseline.py` exit 0 on both; `contract/openapi.json` unchanged and `npm run contract:build` leaves `git status` clean. Full `test:contract` on a freshly migrated and seeded database, main: 152 suites, 3665 tests (3644 passed, 18 failed, 3 skipped); branch: 153 suites, 3707 tests (3686 passed, 18 failed, 3 skipped). The failing set is identical on both: `money/receipts/tests/receipt-units.spec.ts` (Node Unicode digit table) and `data-export-request/tests/data-export.contract.spec.ts` (ADMIN_JWT_SECRET unset; with it set, 3 suites and 24 tests pass on the branch). Mobile `npm run check` exit 0 (43 suites, 754 tests, gates 0 fail on 195 files, no OpenWalletScreen timeout). Diff matches the builder report: backend 3 files (+819), mobile 4 files (SHARED-CHANGES row, LOG line, task file, generated PROGRESS). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh`: all 244 required tests pass on the branch AND on a real worktree of origin/main (on the branch 253 tests in 2 suites; the second suite is the route-shadowing spec). No route added (`GET /api/hub/ads` is 404 on the running branch build). Generated Prisma client: 107 existing models unchanged byte for byte in `runtimeDataModel`, no existing `models/*.ts` file differs, the only differences are the two new models and their input types plus the embedded schema text. |
| V4 Field trace | passed, findings U1, U4, U5, U7, D2 | Migration on a fresh database from all 91 migrations: applies, `migrate diff` shows only main's `DROP INDEX "ContentPiece_specializations_idx"`; re-run of `migrate deploy` applies nothing. Migration on main's 90 migrations plus `npm run db:seed` plus rows in Event, NotificationCampaign and users: per-table `pg_dump --schema-only` of all 108 public tables (107 plus `_prisma_migrations`) identical (ignoring pg_dump's random `\restrict` token), whole-schema dump 0 lines removed, data dump 0 lines removed (only the new `_prisma_migrations` row added), all row counts equal, neighbour rows intact. Field trace for H33 and H36 below. |
| V9 Live seam | passed for what applies; the ad read-back is NOT RUN | There is no route, so no ad value can be created or read through the API. Run instead: `scripts/local/up.sh --detach` from a copy of the branch with a copy of the real wawu-id (own databases, ports 3463 and 3464): Hub and wawu-id boot, `scripts/local/smoke.sh` all PASS (real register, confirm, login, `/users/me`), `GET /events` and `GET /notifications` answer 200 with the real login token on a database that has the new migration (`_prisma_migrations` lists `20261006090000_ads_data_model`), and the new tables carry 8 constraints, one of which refused a bad window when tried by hand. NOT RUN: sign in and see an ad only the server has. Unblocked by ADS-04 (serve) and ADS-06 (create); ADS-04's V9 is where that is proved. |

### Capability checks

- **Migration applies on a fresh local database built from every existing migration and on the OPS-03 seeded database, and adds only new tables or nullable columns: passed.** It adds no column to any existing table at all (three enums, two tables, two indexes, one foreign key, five CHECKs, all on the new tables). Read line by line: no ALTER, DROP or UPDATE touches an existing object, so no lock on an existing table, no data change. Enum types are created before the tables that use them. Not idempotent (no IF NOT EXISTS), as every Prisma migration; the migrate history prevents a second run. The rollback in the header works: run on a copy, schema-only dump identical to a fresh main database (0 lines differ). It does not say that `_prisma_migrations` needs the row removed or `prisma migrate resolve --rolled-back` (nit). The migration timestamp is later than every migration on main and on every open branch (latest open: `20261004213700_inbox_feed_index`). Combined case: scratch merge of `wmt/ADS-03` with `wmt/INBOX-02` and `wmt/INBOX-07`: `prisma/schema.prisma` merges with no conflict, `prisma validate` passes, the three migrations plus 91 earlier apply in order on a fresh database, `migrate diff` again only the known DropIndex. The only conflicts are between INBOX-02 and INBOX-07 themselves (`src/app.module.ts`, `contract/openapi.json`); ADS-03 touches neither. Nothing committed.
- **V3 regression suite unchanged: passed** (V3 row).

### The 42-test spec

Passes alone twice, in the full suite, and next to `src/account-purge` in both orders; after it the row count of every table equals a fresh seed (checked, and AdCampaign and AdCreative hold 0 rows after the full suite). The account purge drift guard (`account-data-map.spec.ts`) passes untouched. Mutation test (done on a scratch database by dropping the object, not in the repo): dropping the window CHECK fails 2 tests; the weight CHECK 5; the advertiser CHECK 3; the text CHECK 4; the artwork CHECK 7; the unique index 1; the serving index 1; changing the cascade to restrict fails everything (the clean-up cannot run); loosening weight to 1..1000 fails 2; loosening the window to `>=` fails 2. Every assertion that names a constraint really exercises the database. Gaps in what it tests, found by my probes: it does not try non-breaking space or zero-width text (D2), nor a very long text, nor an upper-case `HTTP://`. The index test sets `enable_seqscan = off`, so it proves the index can answer the filter, not that the planner chooses it; I checked that separately.

### My own probes (scratch database, Postgres 16, C.UTF-8)

- Weight: 1 and 100 accepted; 0, 101, -1, 2147483647 and NULL refused; 50.5 and 100.4 are rounded to an integer by Postgres and accepted.
- Window: start = end refused; end 1 ms later accepted; end 0.4 microseconds later refused (the column rounds to milliseconds first); end before start refused; `infinity` as an end accepted. A time written with an offset (`+01`) into the raw SQL has its offset silently dropped by Postgres (the column is `timestamp(3)` without time zone, the repo convention, and Prisma sends UTC), so only the UTC rule is safe (nit).
- Blank text: empty, spaces, tab and newline, U+2003, U+3000 refused. U+00A0, U+200B, U+FEFF accepted as an advertiser or headline (D2).
- Length: no cap anywhere. A 10 MB headline, 1 MB advertiser, 1 MB subline, 5000-character button label and 100 kB artwork URL are accepted (U5).
- Artwork: `https`, `HTTP://A.B/C` and mixed case accepted (right: the match is case-insensitive); empty string, leading or trailing space, trailing newline, newline injection, CR, `javascript:`, `data:`, `ftp:`, `//host/x`, `http://` and an inner space refused. Accepted by design of a CHECK, to be handled by the ADS-06 DTO: `http://localhost`, `http://127.0.0.1/x`, `http://user:pass@host`, a non-breaking space inside, `"><script>` in the path.
- `ctaDestinationId`: a missing event, a pending event and ` ev ` with spaces are accepted (no foreign key, as designed); ADS-06 and ADS-04 must check.
- Dedupe: nothing is unique on advertiser; the same advertiser typed two ways is two names. A report by advertiser (ADS-02) will group by spelling (U3).
- Relations: deleting a campaign deletes its creative; a second creative on one campaign is refused; a creative for a missing campaign is refused; deleting an Event does not touch an ad (the ad then points at nothing, so ADS-04 must check). Twenty concurrent creative inserts for one campaign: exactly one succeeds. Concurrent creative insert and campaign delete: no orphan.
- Status: any transition is accepted (ended to draft to live), as the DB is not meant to constrain it; and an update into a bad window or weight is refused (so the CHECKs hold on UPDATE too).
- Serving query plan, 6000 campaigns and 6000 creatives, ADS-04's shape (placement, status in scheduled/live, window holds the moment, order by weight desc, limit 1): `AdCampaign_placement_status_startsAt_endsAt_idx` is used (bitmap scan for a window with 16 hits, index scan for none), 1 ms; `AdCreative_campaignId_key` serves the join. The planner chose a sequential scan of AdCreative in the hash join at 6000 rows, which is a planner choice for a small table.
- Enum extension: `ALTER TYPE ... ADD VALUE` runs inside a transaction block on Postgres 16 and is additive, but the new value cannot be used in the same transaction ("unsafe use of new value"), so a task that adds a destination must put rows that use it in a later migration or a later statement (nit for ADS-06 and whoever adds the second destination).

### Field trace (H33 and H36)

| On the card | Writer | Stored in | Reader |
|-------------|--------|-----------|--------|
| "SPONSORED" label, "Ads keep TGIF free", "Skip" | none (the app's own words) | not stored | ADS-01 |
| Advertiser name | ADS-06 (dashboard form, ADS-02) | `AdCampaign.advertiser` | ADS-04 serves, ADS-01 shows |
| Headline ("Gospel Night Live") | ADS-06 | `AdCreative.headline` | ADS-04, ADS-01 |
| Event, place, date, "from ₦5,000" | ADS-06, typed by the team | `AdCreative.subline` (one free text) | ADS-04, ADS-01 |
| Button words ("Get tickets", "Tickets") | ADS-06 | `AdCreative.ctaLabel` | ADS-01 |
| What the button opens (event detail, E2) | ADS-06 | `ctaDestination` (allow-list enum) and `ctaDestinationId` (Event id) | ADS-04 checks still open, ADS-01 navigates |
| Picture | ADS-06 via the upload presign | `AdCreative.artworkUrl` (nullable) | ADS-01 |
| Placement, window, status, weight | ADS-06 | `AdCampaign` | ADS-04 (index serves exactly this filter), ADS-02 |
| Views, taps, skips | ADS-05 | its own tables, referencing the ids above | ADS-02 |

Everything H33 and H36 draw has a column, every column is used by a later task, and no price, payment, advertiser account or person column exists (R-15). Nothing is missing and nothing is invented apart from `createdAt` and `updatedAt`, which every model carries.

### Findings

**D1 · defect (low), FIXED in round 2 (see below): the PROVISIONAL(ADS-WEIGHT-RANGE) marker is where no gate reads it.** It sits in `prisma/schema.prisma` and in the migration SQL. `scripts/gates/checks/provisional.py` scans only `src/**/*.ts` (`gates.config.json`, `files.source`), so the marker raises no warn (warn count is 34 on main and on the branch, and `GATES_RELEASE=1 run.py` prints no ADS-WEIGHT line). The point of the marker is that a release build fails while an unconfirmed value remains (WORKFLOW section 10: "mark it PROVISIONAL(...) in config, list it in the task file"). The task file lists it, but the machine check cannot see it. Fix: carry the marker in a scanned `src/ads` file (a constant or comment for the range, which ADS-06's DTO needs anyway), or have the owner confirm the range before merge. I did not touch the gate.

**D2 · defect (low), FIXED in round 2 for the listed characters (see below): the "not blank" CHECKs do not refuse text that looks blank.** The migration header says a name, headline, button or destination is never "empty or only white space". A headline, button label, destination id or advertiser made only of a non-breaking space (U+00A0), a zero-width space (U+200B) or a byte-order mark (U+FEFF) is stored, and renders an empty or invisible card. Text pasted from a document or chat commonly carries U+00A0. Whether `\s` matches U+2003 and U+3000 depends on the server's locale (they are refused on a C.UTF-8 cluster; not tested on a cluster with another locale), so the production behaviour is not what the spec proves. The spec tests only "", spaces, tab and newline. Fix: widen the pattern to the characters that draw as nothing, or take the claim out of the header and make ADS-06's DTO trim and refuse them, and add the case to the spec.

**U1 · unclear (owner): what "weight" means, and its range.** The migration says the highest weight wins, ties to ADS-04. That makes a weight 1 booking never show while any heavier one overlaps on the same placement. If the owner means a share of the time (rotation by weight), the model is the same but ADS-04's rule is not. The range 1 to 100 is PROVISIONAL (no ruling gives it); nothing in R-15 or the task contradicts it. Changing it later is a new migration (drop and add the CHECK; it validates existing rows).

**U2 · unclear (owner), no action needed now: destinations.** Only `event` is on the allow-list. The task says "CTA destination from an allow-list"; H33 ("Get tickets") and H36 ("Tickets") draw only the event, R-15 and the later ADS tasks name no other, so a one-value enum meets the text and invents nothing. Adding a value later is additive (see the enum note above). Judged right; owner to say if a second destination (a creator's page, a web link) is wanted for launch.

**U3 · unclear (owner): advertiser as free text.** The same advertiser spelled two ways is two names, so ADS-02's reports by advertiser would split. R-15 (no accounts at launch) makes free text the honest model; a later advertiser table is additive. Also, the advertiser may be a named person; see U6.

**U4 · unclear (owner): the price and date live in free text.** The card's "Abuja · Sat 18 October · from ₦5,000" is one `subline` the team types. The Event has its own date and ticket types, so the card can show a price the event no longer has. ADS-01 says a figure on the card must come from the API, not the design; a typed subline does come from the API, so this is allowed, but nothing keeps it in step with the event. Owner to say whether the team types it (current model) or ADS-04 composes it from the Event.

**U5 · unclear (owner / ADS-06): no length limit anywhere.** The database accepts a 10 MB headline. The Hub's request size limits stop real input, but the card layout needs short text and no task says where the cap lives. ADS-06's task text does not mention caps; it should.

**U6 · unclear (owner): personal data.** `advertiser` is a name, not an account, and nothing links a row to a WAWU user, so `account-data-map.ts` cannot classify it (its drift guard keys on WAWU ID columns and passes untouched). If an advertiser can be a named individual, the name is personal data of someone who is not a user, and erasing it is a manual job in the dashboard. The builder's claim "no personal data" holds for WAWU users, not necessarily for advertisers.

**U7 · unclear (ADS-01 to settle): which text follows "SPONSORED".** On H33 the line reads "SPONSORED · Gospel Night Live · Abuja ...". The model carries both an advertiser name and a headline, so either reading is possible; nothing is missing.

**U8 · unclear (ADS-04 and ADS-06 to define): `scheduled` and `live` both serve.** A `scheduled` campaign inside its window is served, so `live` adds nothing the window and `scheduled` do not; nothing in the database moves a campaign between them or to `ended` when the window passes. Not a defect (the DB is not meant to constrain transitions, and the window decides), but the two tasks need one written rule.

**Nits, no label needed:** (a) the schema block comment says the AdCreative CHECKs include "advertiser"; that CHECK is on AdCampaign. (b) The migration header says the event must be "approved"; the Event status that is live is `published`. (c) The header's rollback omits the `_prisma_migrations` row.

**differs-for-recorded-reason:** none.

Checked and fine: fenced files each have a SHARED-CHANGES row (ADS-03 #1, status open; `contract/**`, `src/common/**`, `app.module.ts` untouched); the schema block is appended at the end; no em or en dashes in anything added, no TODO or "for now"; gate counts and gap ids unchanged (`BACKEND_GAPS.md` untouched); R-15 is respected (no price or payment column, no advertiser account); naming follows the repo (PascalCase tables, `<Table>_<name>_check`, uuid text ids, `timestamp(3)`).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

## Builder report, round 2 (D1, D2 and nits)

Backend `wmt/ADS-03` @ 2b1fce3. Main had not moved (backend a94f338, mobile 8484195); no new migration anywhere is later than `20261006090000`. The migration was **edited in place**, as it is merged nowhere. Mobile merged with origin/wmt/ADS-03 (verifier report), no rebase.
- **D1 fixed:** `src/ads/ads-limits.ts` exports `AD_WEIGHT_MIN = 1` and `AD_WEIGHT_MAX = 100` and holds the only `PROVISIONAL(ADS-WEIGHT-RANGE)` marker. The marker is gone from `schema.prisma` and the migration (both point to the file). New spec test reads the bounds of `AdCampaign_weight_check` from `pg_get_constraintdef` and fails if they differ from the constants; a second test checks the constants and one step outside. Gate warns: **34 before (main) to 35 after**, `src/ads/ads-limits.ts:15` is the one added; fail 16 and accepted 76 unchanged.
- **D2 fixed:** the five not-blank CHECKs (advertiser, headline, ctaLabel, ctaDestinationId, subline) now refuse a value made only of an explicit set spelled as `\u` escapes (control characters, ASCII and Unicode spaces, zero-width and direction marks U+200B to U+200F and U+2060 to U+206F, BOM, soft hyphen, U+034F, U+061C, Mongolian and Hangul fillers, Khmer vowels, variation selectors, U+2028 and U+2029), the list written in the migration. No `\s`. A value with one visible character among them is accepted. 12 new spec tests: 24 invisible cases and each repeated, on all five columns, plus accepted mixes ("Gospel" NBSP "Night", ZWSP then A, BOM after A, ZWJ inside a word, one letter, accented, CJK).
- **Before-failure shown:** the same 54-test spec run against a database built from the old migration (commit 2468204): 5 failed (one per column), listing 34 values it accepted per column (NBSP, ZWSP, ZWNJ, ZWJ, WORD JOINER, BOM, U+202F, LRM, soft hyphen, U+034F, U+180E, U+3164, U+FE0F, U+0001, DEL, NEL, the mix). Against the new migration: 54 of 54.
- **Locale:** the available locales here are C, C.UTF-8 and POSIX. Cluster 1 is C.UTF-8 (where `\s` matches U+2003), cluster 2 was `initdb --locale=C` (where `\s` does not match U+2003, so the old class would have accepted it): migration applied and 54 of 54 passed on both.
- **Nits:** the schema comment now puts the advertiser CHECK on AdCampaign; the header says the Event must be `published`; the manual rollback now includes `DELETE FROM "_prisma_migrations" WHERE migration_name = '20261006090000_ads_data_model'`. The weight CHECK is written `>= 1 AND <= 100`.
- **Owner questions U1 to U8 stay open** (weight meaning, only `event`, free-text advertiser, hand-typed subline, no length caps, advertiser as personal data, SPONSORED text, status transitions). No length caps added.
- **Re-run, same checkout, own Postgres and mock, tmpfs:** migration on a seeded database (main's 90 migrations plus seed plus neighbour rows): all 107 existing tables' `pg_dump --schema-only` identical, schema dump 0 lines removed, data dump 0 removed, only the two new tables and one `_prisma_migrations` row added; re-run applies nothing; fresh database from all 91 migrations: `migrate diff` shows only main's `DROP INDEX "ContentPiece_specializations_idx"`. `tsc` exit 0; eslint without `--fix` 4514 problems (same as main, none in `src/ads`); `test:contract` 153 suites, 3712 passed, 4 failed, 3 skipped, the one failing suite `receipt-units.spec.ts` (as on main); gates 16 fail / 35 warn / 76 accepted; `check_baseline` exit 0; `run.sh --fresh` 244/244; `contract:build` no diff. Mobile `npm run check` exit 0 (43 suites, 754 tests, gates 0 fail, 207 tasks).

## Verifier report, round 2

Verifier (same session as round 1; wrote none of the code). Checked backend `wmt/ADS-03` @ 2b1fce3 and mobile @ 19bc44b. Main had not moved (backend a94f338, mobile 8484195). INBOX-02 and INBOX-07 are still not merged, and no migration on main or on any open branch is later than `20261004213700`, so `20261006090000` is still the latest. `ads_data_model` is on no other branch and not on main, so editing the migration in place is safe (a database that applied the old text, such as the builder's, would fail the checksum and must be rebuilt). Own Postgres on tmpfs (three clusters: C.UTF-8, C with UTF8, and C with SQL_ASCII), own mock from each checkout. Everything stopped, tmpfs unmounted, worktrees and caches removed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed, D3 open | `tsc` 0. eslint without `--fix`: 4514 problems on main and branch, identical per rule (748 vs 746 files); the two new `src/ads` files have 0. `gates/run.py`: 16 fail / **35** warn / 76 accepted vs main 16 / 34 / 76; the one new warn is `PROVISIONAL(ADS-WEIGHT-RANGE)` at `src/ads/ads-limits.ts:15`. With `GATES_RELEASE=1` the same line prints "RELEASE BLOCKED", which is what the gate's own header documents (not a release run). No marker is left in `prisma/`. `check_baseline` exit 0 on both. Full `test:contract` on a freshly seeded database: main 152 suites, 3665 tests; branch 153 suites, 3719 tests (3698 passed, 18 failed, 3 skipped). The failing set is identical on both: `receipt-units.spec.ts` and `data-export.contract.spec.ts` (no ADMIN_JWT_SECRET) only. Mobile `npm run check` exit 0 (43 suites, 754 tests, gates 0 fail on 195 files). |
| V3 Regression | passed | `run.sh --fresh` 244/244 on the branch and on a real worktree of main (the route-shadowing spec is in the suite); `npm run contract:build` leaves no diff; still no `/ads` route (404). The schema diff is additive: only the AdCampaign and AdCreative blocks, appended at the end. |
| V4 Field trace | passed | Capability 1 re-run on the edited migration: fresh database from all 91 migrations (on three clusters) applies; `migrate diff` shows only `DROP INDEX "ContentPiece_specializations_idx"`. Main's 90 migrations plus `db:seed` plus Event and NotificationCampaign rows, then the branch migration: all 108 per-table `pg_dump --schema-only` byte-identical (pg_dump's random `\restrict` line ignored), 0 lines removed from the schema and data dumps, row counts equal (only the two new tables at 0 and one `_prisma_migrations` row added), second `migrate deploy` applies nothing. The documented manual rollback, run on a copy (including the new `DELETE FROM "_prisma_migrations"`), leaves a schema identical to a fresh main database (0 lines differ), `migrate status` then lists the migration as pending, and `migrate deploy` re-applies it to a schema identical to before. Spec: 54 tests pass alone twice, in the full suite, and on the C-locale UTF8 cluster; after it every table's row count equals a fresh seed. |
| V9 Live seam | passed for what applies; the ad read-back is NOT RUN | Same as round 1 on the new head: copy of the branch plus a copy of the real wawu-id, `up.sh` then `smoke.sh` all PASS, `/events` and `/notifications` 200 with the real login token, the new tables have 8 constraints, `/ads` 404. NOT RUN: seeing an ad only the server holds; there is no route until ADS-04 and ADS-06. |

**Nits from round 1: all three fixed** (schema comment puts the advertiser CHECK on AdCampaign; the header says `published`; the header's rollback now includes the `_prisma_migrations` DELETE, and I ran it).

**D1: fixed.** Mutation tests (scratch database and a scratch copy of the constants, nothing committed): changing the CHECK to 1..1000 fails 4 tests, to 2..100 fails 33 (the defaults no longer insert), and changing `AD_WEIGHT_MAX` to 99 or `AD_WEIGHT_MIN` to 0 each fails the two constants-versus-CHECK tests. The same range written as `BETWEEN 1 AND 100` still passes, as it should.

**D2: fixed for the characters it lists.** My own probes (Node `pg`, every value tried on all five columns in a rolled-back transaction): alone, repeated five times, mixed, and with one visible letter added (which must be accepted), for NBSP, ZWSP, ZWNJ, ZWJ, U+2060, BOM, U+2003, U+3000, U+1680, U+180E, U+2028, U+2029, NEL, tab, CR, LF, space, VT, FF, soft hyphen, U+034F, U+061C, LRM, RLM, U+202A to U+202E, U+202F, U+205F, U+3164, U+115F, U+1160, U+17B4, U+17B5, U+FFA0, U+FE00, U+FE0F, U+2061, U+2064, U+2066, U+2069, U+206F, U+180B, U+200A, U+2000, DEL, U+009F, SOH, ESC, all of them together, and the empty string: every refusal and acceptance as expected, 0 mismatches on C.UTF-8 and on C with UTF8 (same behaviour). Legitimate text accepted on both: accented Latin, Yoruba with diacritics, CJK, Arabic, Thai, Hangul, Khmer, Mongolian, "O'Reilly", an emoji, an emoji with U+FE0F, a family emoji with ZWJ, Persian with ZWNJ inside a word, Hindi with ZWJ and ZWNJ, Sinhala, flags, a keycap, a base letter plus a combining accent. Timing on a 10 MB string: 120 to 230 ms, whether visible, all invisible, invisible then a letter, or a letter then invisibles (the class is a single `[...]*` with no nesting, so no catastrophic backtracking). The spec catches removing NBSP, BOM or U+3000 from the class, and weakening any one of the four creative columns separately (each fails exactly its own test).

**D3 · defect (low): the migration does not say what it is.** The migration comment and the builder report say every code point is "spelled as a `\u` escape" so the test is the same in any environment. Only U+0001 and U+007F are escapes; the remaining 40-odd characters are the characters themselves, written into the SQL file (`ascii()` of the line shows `\u0001- \u007F-` followed by raw U+00A0, U+00AD, U+034F, U+200B to U+200F, U+FEFF and so on). Consequences found: (a) a reviewer sees an apparently empty or garbled class, and an editor or formatter that strips a BOM or normalises a NBSP changes the rule silently; (b) it depends on the client sending UTF-8: the same statement through a LATIN1 client fails with "unterminated quoted string" (loud), and on a SQL_ASCII database it applies without error and then refuses ordinary non-Latin text (CJK, Arabic, Thai, Hangul and others) because the class is compared byte by byte, and 5 of the spec's 54 tests fail there. Production is almost certainly UTF8 (default), so the risk is low. The escape syntax itself is fine: `\uXXXX` in a regex is read by the regex engine, and with `standard_conforming_strings = off` the string parser turns it into the same character, so the result is identical. Fix: write the class with `\u` escapes for every code point (or correct the comment and report).

**U9 · unclear (owner / ADS-06): the "draws as nothing" list is finite.** Still accepted alone on every column, and on C.UTF-8 and C: U+2800 (braille blank, draws as empty), U+FFFC (object replacement, draws as a box), the tag characters U+E0000 to U+E007F (invisible), U+E0100 to U+E01EF (variation selectors supplement), U+180F, U+1BCA0 to U+1BCA3 (shorthand format controls), U+1D159 and U+1D173 to U+1D17A (musical formatting), and a lone combining mark such as U+0301 (draws as a floating accent). The spec's list is what the builder named, so this is not a defect against round 1's finding, but the database floor cannot be complete; ADS-06's DTO should apply a Unicode-category rule (format, separator and lone-mark characters) as well.

**Carried forward for the owner, unchanged (round 1 texts apply): U1** (weight: priority or rotation share, and the PROVISIONAL 1 to 100 range, now visible to the gate), **U2** (only `event` as a destination; adding one is additive, but rows using a new value need a later migration), **U3** (advertiser is free text, reports would split on spelling), **U4** (price and date in the hand-typed subline can drift from the Event), **U5** (no length cap anywhere; a 10 MB headline is accepted; ADS-06 should cap), **U6** (an advertiser may be a named person; erasure is manual), **U7** (which text follows "SPONSORED" on H33), **U8** (`scheduled` and `live` both serve; one written rule needed).

**differs-for-recorded-reason:** none. **Status: `building`** (D3 open, low). Everything else passes; D3 is a one-line class rewrite plus a spec case that reads the constraint text for non-ASCII characters.
