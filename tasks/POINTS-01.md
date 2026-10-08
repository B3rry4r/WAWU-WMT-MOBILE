---
id: POINTS-01
title: Points: lots that expire, and the points ledger
owner: YOU
area: POINTS
order: 200
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-43, R-5]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# POINTS-01 · Points: lots that expire, and the points ledger

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

Points are their own balance, always shown as points, never as naira or dollars, held in lots that expire. The
soonest-expiring lot is spent first, the balance never goes below zero, and every change is an append-only ledger
row (R-43, brief section 3). WAWU Credits are untouched: whether points replace them is open (R-43), and the round
2 brief draws points as their own balance.

## Scope

- New `src/points/`: `PointLot` (person, source `tier_bonus`, `pack`, `bump`, `referral`, `shortfall` or `returned`, quantity, remaining, expires at, a source reference unique per source) and `PointLedger` (append only: person, lot, delta, reason, job or purchase reference, time).
- A service: `grant` (idempotent on the source reference), `hold` (soonest-expiring lots first; refuses to go below zero), `commit`, `release` (back to the lots it came from), and an expiry job (each lapsed lot leaves the balance with one ledger row).
- `GET /me/points` (PT5): balance, lots with their expiry dates, the next expiry, and the last 20 ledger rows with plain labels.
- `data-export-sections.ts`: both tables exported.
- Not in scope: buying (POINTS-02), spending and caps (POINTS-03), cash-out (POINTS-04).

Needs no money and no provider; starts now.

## Capability checks

- [ ] A person with a lot ending in January and one ending in March spends January's first; a hold larger than the balance is refused and nothing changes.
- [ ] The same grant reference twice grants once; two holds at once never take the balance below zero (concurrency spec).
- [ ] A released hold returns its points to the same lots; a lapsed lot's points leave the balance with one ledger row each.
- [ ] `GET /me/points` shows the balance, each lot with its expiry date and the last 20 movements, newest first; another person's points are never shown.
- [ ] No ledger row is ever updated or deleted (the spec fails on an UPDATE or DELETE of the table).

## Builder report

Builder, 8 Oct 2026. wawu-backend `wmt/POINTS-01` **e524ac8** (0d3d5d6 the work, 85f5d75 longer spec hooks, e524ac8 CONVENTIONS section 14), on backend main 965280e. Mobile `wmt/POINTS-01` on mobile main 50a7a89. Neither main moved during the build.

**Built (backend, `src/points/`).**
- Tables (migration `20261016130000_points`, additive): `PointLot` (person, source `tier_bonus`/`pack`/`bump`/`referral`/`shortfall`/`returned`, source reference unique per source, quantity, remaining, end, lapse time), `PointHold` (one per purpose `ai_job`/`cash_out` and reference; `held`, then `committed` or `released`) and `PointLedger` (append-only: person, lot, delta, reason `grant`/`hold`/`release`/`expire`, hold, job or purchase reference, time, and a `seq` that orders rows written in one transaction).
- The database holds the rules whatever the code does: CHECKs keep a lot between 0 and what it was granted (so a balance can never go below zero) and tie each reason to its sign; deferred constraint triggers refuse, at commit, any lot whose points differ from the sum of its ledger rows (a lot change without its row, or a row without its change); triggers refuse any UPDATE of a ledger row, a TRUNCATE, a change to what a lot is (person, source, reference, quantity, end), and a DELETE that leaves part of a person's ledger behind. The only delete allowed is a person's whole ledger in one statement, which is what the account purge does.
- `PointsService` (exported for TIER-03, POINTS-02 to POINTS-04 and REF-01; each call can join the caller's transaction): `grant` (idempotent on source and reference; the first grant's end stands; another person or amount on the same reference is `409 points_grant_conflict`), `hold` (live lots by soonest end, then oldest grant, then id; more than the balance is `402 insufficient_points` with `balancePoints`, `neededPoints`, `shortfallPoints`, and nothing is written; idempotent on purpose and reference), `commit` (no ledger row: the hold already moved the points), `release` (one `release` row per lot it came from; a lot that ended meanwhile takes them back and loses them in the same transaction), `expireLapsed`. Every write takes a per-person advisory lock first. Refusals are `PointsError` in the contract's one error shape with a `reason`.
- `PointsExpiryService`: every 5 minutes, each lot that ended with points left loses them with one `expire` row (500 lots a pass, `PROVISIONAL(POINTS-EXPIRY-BATCH)`); a lot the database refuses is logged by id and the pass goes on. A balance, a hold and the route never count an ended lot, whether or not the job has reached it.
- `GET /me/points` (PT5), `Cache-Control: no-store`: `balance`, `nextExpiry` (or null), `lots` (live lots, soonest end first, at most 50, `PROVISIONAL(POINTS-LOTS-SHOWN)`), `lotCount`, and `movements` (the last 20 ledger rows, newest first, with plain labels and `pending` for a hold still running). One repeatable-read snapshot. The token is the person; the route takes no id.
- `docs/contract/CONVENTIONS.md` section 14 tells the tasks that grant, spend and cash out points how to call the service and what it refuses.
- Mounted through `MeModule` (SHARED-CHANGES POINTS-01 #1), so `app.module.ts` is unedited. Purge map: all three OWNED, ledger first. Export: `pointLots`, `pointHolds`, `pointMovements` (own rows, no references). `scripts/enrich-contract.js` gains `src/points` so `nextExpiry` is generated as `PointNextExpiryView | null` (#3). Contract: +151 lines, 0 removed; a second `npm run contract:build` leaves it unchanged. Mobile `contract/` and `src/api/schema.generated.ts` regenerated from the branch (#4).

**Capability checks, and how each was proved** (`src/points/tests/points.service.spec.ts` 34 tests against the real migration, `points.contract.spec.ts` 5 over HTTP with real mock WAWU ID tokens; 39/39).
- January before March: March is granted first, then January; a hold of 150 takes 100 from January and 50 from March, with those two ledger rows. A hold of 51 against 50 is `402 insufficient_points` (balance 50, shortfall 1) and the lots, the ledger and the holds are byte-for-byte as before; another person's 500 points are never taken; a lot past its end is not spent before the job runs.
- Same grant twice grants once: a replay (with a later end) returns the first lot and writes nothing; ten grants of one reference at once make one lot and one ledger row; two people racing for one reference get one lot and one `points_grant_conflict`. Concurrency: eight holds of 30 against 100 at once give exactly three holds and five `insufficient_points` (balance 10 each), lots 0 and 10; two holds of 60 against 100 give one; the same hold sent twice at once holds once.
- Release: a hold of 250 over two lots (70 and 180) is released and both lots return to exactly 70 and 300, with one `release` row each; releasing again writes nothing; committing it then is `points_hold_settled`. A committed hold writes no row and cannot be released. Expiry: two passes at once after two lots end write one row for the lot that still had 50 and none for the lot that ended empty; a later pass writes nothing more; the scheduled job writes its row (also seen live, below).
- `GET /me/points`: balance, both lots with their ISO end dates and labels, the next end, and 20 of 26 movements in `seq` order, newest first; a hold in progress shows `pending` and leaves the balance at once; PLAIN never sees BASIC's lot or rows, `?wawuUserId=<BASIC>` changes nothing, BASIC sees only their own; 401 without a token or with a bad one.
- Append-only: `prisma.pointLedger.update`, raw `UPDATE`, `delete`, raw `DELETE` of one row and `TRUNCATE` are all refused by the database; a lot change without its row and a change of a lot's end are refused. A source scan finds no `pointLedger.update|delete...` or `UPDATE/DELETE "PointLedger"` outside specs, and a client logging every SQL statement through a grant, hold, commit, release, expiry and read sees INSERTs into the ledger and no UPDATE or DELETE of it. Account deletion (`AccountPurgeService.purge`) removes the person's 3 ledger rows, hold and lot and nobody else's; the export sections return only the person's rows, without references.

**Mutants** (each applied alone, the points specs run, `git restore`; all 9 killed): a hold of exactly the balance refused (`<` to `<=`), 1 failed; a fractional amount let through (`isSafeInteger` to `isFinite`), 1; a repeated grant reference not skipped (`skipDuplicates: false`), 4; the hold without the person lock (double spend), 2; the balance shown as its naira cash-out value (points / 2, wrong currency), 12; a hold taking from every person's lots (wrong account), 10; `GET /me/points` listing everyone's movements (wrong account), 1; a hold spending an ended lot, 2; a release giving points back to the soonest lot instead of the lot they came from, 3.

**Checks.**
- `npx tsc --noEmit` 0. eslint 0 on every changed `.ts` (`scripts/enrich-contract.js` is outside the repo's lint globs and its project).
- Specs of every module touched, on `bp01_test` (migrated, seeded) with my WAWU ID stand-in on :5662: points, account purge, data export and me, 9 suites, 118/118 with default timeouts on e524ac8 (and 118/118 earlier with `--testTimeout=60000` while other sessions held the load average at 40 to 45 on 4 cores). Money, Fintava, KYC and identity specs: see the full suite below.
- Protected suite `run.sh --fresh HEAD` (code 0d3d5d6, lock origin/main 965280e): **253/253**, all 244 required; no lock file touched.
- Gates: 16 fail, the same lines as main; warnings 58 to 60, the two new being the deliberate `PROVISIONAL(POINTS-LOTS-SHOWN)` and `PROVISIONAL(POINTS-EXPIRY-BATCH)`; `check_baseline.py` not affected. CI tripwire on added lines: 0. Secret scan of the staged diff (long hex or base64 runs, `sk_`, `FLWSECK`, bearer tokens, private-key headers): 0.
- Full suite, in a private network namespace (copies of `ns2.sh` and `inner2.sh` with my paths and database name, my own stand-in on :4001 inside it, a fresh migrated and seeded `bp01_full_test`), on 85f5d75 (e524ac8 after it adds only CONVENTIONS section 14). One jest process for all 185 suites was killed by the out-of-memory killer after 10 suites (the session's shared 14.3 GB memory cgroup, at load average 40 on 4 cores; all 10 failures before it were 5 s timeouts). Run again as four jest processes, each in its own namespace on a fresh database, with `--testTimeout=60000` for the load: **185 suites, 4,794 tests: 179 suites and 4,541 tests passed, 4 skipped, 249 failed in 6 suites, none in a file this task touches**: `hub-rate-limits` (11; it always fails inside a namespace), `fintava-stall` (120 timing asserts), `receipt-units` (one 300 ms timing assert), and `admin-finance`, `admin-payments` and the protected-registry regression (each `fetch failed: other side closed` to the stand-in mid-run). Each of the six then passed alone on the host network against a fresh seeded database with default timeouts: 39/39, 26/26, 52/52, 120/120, 43/43 and 22/22. NOT RUN as deploy.yml runs it (one process, default timeouts); the fact that unblocks it: a machine with load average under about 8 and memory to spare, or CI's test job on this branch.
- Live (V9 groundwork): the built app (`node dist/src/main.js`, 0d3d5d6) on :5661 against a migrated database, with my WAWU ID stand-in on :5662 and Fintava pointed at an unused local port. It mapped `GET /api/hub/me/points`. A real sign-in as PLAIN answered the empty view, then 437 points (one lot and one movement) after a grant written in one transaction; BASIC still answered empty; no token was 401. A lot made to end 20 s later was written off by the app's own 06:55 UTC pass ("1 lots ended, 63 points left them"), and the route then listed "Expired, -63" with the balance unchanged at 437.
- Mobile `npm run check`: **exit 0** (typecheck 0, lint 0, 76 suites / 1,377 tests, gates 9 / 346 files / 0 fail / 0 warn, 249 tasks). Before any change, main 50a7a89 gave the same counts but 2 tests timed out at load average 40 (OpenWalletScreen, settingsScreens); a first run on the branch at the same load had 3 such suites (those two and explore screens), which then passed alone (152/152) and in this second full check. The branch adds only the regenerated contract and types, `SHARED-CHANGES.md` rows, this report, a LOG line and the regenerated `docs/PROGRESS.md`.

**Money safety.** Points are not money and no provider holds them: no naira or dollar figure, fee, price or rate is in this code (points amounts and ends come from TIER-01's config through the granting tasks). Their balance is the sum of a person's live lots, which are the authority for points; nothing here sums or shows a money balance. A disagreement between a lot and its ledger is refused by the database and rolls the whole transaction back; the expiry job reports such a lot by id and never forces it. No BVN, NIN, PIN or image is read, stored or logged.

**Decisions** (each Default (agent), owner may override).
- Points stay separate from WAWU Credits (R-43 open point; the plan's default).
- `GET /me/points` is mounted through `MeModule`, not `app.module.ts` (SHARED-CHANGES POINTS-01 #1).
- A repeated grant keeps the first grant's end date; the same reference for another person or amount is refused. Holds are idempotent on purpose and reference; asking again returns the hold in its current state.
- Committing writes no ledger row; the hold's rows read "Spent on ...". Points given back to a lot that ended meanwhile end at once (a `release` row, then an `expire` row).
- Hold purposes are `ai_job` (POINTS-03) and `cash_out` (POINTS-04); a hold's title is the calling task's tool name.
- Account deletion removes all of a person's points; unspent points are not paid out.
- The movement time is `createdAt` in the view (the contract builder drops a field named `at`, an Array method).
- Copy the design does not draw, for the owner to read: "Tier bonus", "Bought points", "Added at checkout", "Referral reward", "Topped up from your wallet", "Points given back", "Held for X", "Spent on X", "Returned from X" (X is the tool, or "an AI tool"), "Converting to cash", "Converted to cash", "Conversion cancelled", "Expired"; refusals "You don't have enough points for this.", "These points were already added with different details.", "These points were already held with different details.", "We couldn't find those held points.", "Those points were already spent.", "Those points were already given back."
- The expiry job runs every 5 minutes; how many lots one pass takes and how many lots the route lists are `PROVISIONAL`.

**NOT RUN.**
- PT5 on a phone (V5 to V7, V10): no screen in this task; the PT screens are cut from the round 2 boards once exported into `design/` (docs/PAYMENTS-PLAN.md, "Not in this plan"). Unblocked when a PT5 screen task exists.
- No (key) checks: points use no provider, so nothing here waits for the Nuvion sandbox key.
- `BACKEND_GAPS.md`: no row filed; nothing the task needs is missing.

## Verifier report

Verifier, 8 Oct 2026, independent session (built none of this). Backend `wmt/POINTS-01` **e524ac8** on main 965280e; mobile `wmt/POINTS-01` **62d0cd6** on mobile main 50a7a89. Both mains were fetched at the start and had moved by the end: backend main is now **ea79fca** (FIX-06 merged, with migration `20261015100000_professional_takedown`, which still sorts before this task's) and mobile main **f2bebc2** (FIX-06's task files, a task reassignment). A local trial merge of e524ac8 onto ea79fca (not committed, aborted): no conflict (`contract/openapi.json`, `schema.prisma`, `account-data-map.ts` and `data-export-sections.ts` auto-merge), `tsc --noEmit` 0, `npm run contract:build` gives the auto-merged contract byte for byte, protected suite `run.sh --fresh` on it 253/253, all 6 points triggers present. The builder merges both mains when fixing D1 to D5. Fresh detached worktrees `vp01b`, `vp01main`, `vp01id` (wawu-id fb8717e, its own `npm ci`) and `vp01m`; databases `vp01_*` (all dropped at the end); ports 5681 (built Hub), 5682 (stand-in WAWU ID for specs), 5683 (real wawu-id), 5684 (unused; Fintava and Cardex pointed at it); nothing on :4001 on the host; no Nuvion, Fintava, wawuafrica.com or AI host called. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vp01/` (harness specs in `specs/`, results in `out/`, mutants in `mutants/`, live run in `run/` and `v9-*.json`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `tsc --noEmit` 0. eslint (no `--fix`) 0 on the 13 changed `.ts` files. Gates: branch 899 files, 16 fail / 60 warn / 76 accepted; main 889 files, 16 / 58 / 76; the 16 FAIL lines are identical, the only new lines are `PROVISIONAL(POINTS-LOTS-SHOWN)` and `PROVISIONAL(POINTS-EXPIRY-BATCH)`, each with owner and why; `check_baseline.py` 108 entries ok. Tripwire on added lines: 0. Secret-shaped strings in the diff: 0. `npm run contract:build` leaves `contract/openapi.json` unchanged; mobile `contract/openapi.json` is byte-equal to the backend branch's (`SOURCE_COMMIT` e524ac8). Mobile `npm run check` on 62d0cd6 at load 14: typecheck and lint 0, tests 1,375 of 1,377 (two 20 s timeouts, `OpenWalletScreen` and `settingsScreens`, the same two the builder saw on main); those two suites alone 128/128; with this report committed: see "Mobile check on the report commit" at the end. Files `v1-*.txt`, `gb.txt`, `gm.txt`. |
| V2 / V4 | **failed** (D1 to D5) | My own jest harness (not committed; `specs/points-verify.vspec.ts`, `points-http.vspec.ts`, `points-extra.vspec.ts`) against the real migration on `vp01_test`: 35 tests, 32 pass; the 3 that fail are findings (D1, D2, U1). Builder's specs plus purge, export and me specs: 7 suites 104/104. Details under "What was checked" and the findings. |
| V3 | passed | Protected suite `run.sh --fresh HEAD` (code e524ac8, lock origin/main 965280e): **253/253**, all 244 required; no lock file in the diff. Full suite at default timeouts, in four jest shards, each in its own private network namespace (copies of `t3ns/ns2.sh` and `inner2.sh` with my paths, my stand-in on :4001 inside, a fresh migrated and seeded `vp01_full_test`): **185 suites, 4,794 tests: 4,778 passed, 4 skipped, 12 failed in 2 suites**: `hub-rate-limits` 11 (needs a non-loopback interface, as always inside a namespace) and `receipt-units` 1 (one 300 ms timing assert at 382 ms under load). On the host network, alone, on a fresh seeded database: `hub-rate-limits` 22/22, `receipt-units` 43/43. Skipped: 3 `legal-intake` tests that need a Gemini key, 1 in `live-hardening`. Files `v3-protected.txt`, `ns/full-[1-4].json`, `v3-host-*.txt`. |
| V9 | passed | The built Hub (`node dist/src/main.js`, e524ac8) on :5681 against a migrated and seeded `vp01_live_test`, signed in through the real wawu-id on :5683 (`POST /auth/login`, seeded accounts). Empty view first for PLAIN and BASIC, 401 without a token. Then, through `PointsService` (the one writer; no route grants points yet): 400 tier bonus, 1,000 bought, 63 referral ending in 25 s, 37 "added at checkout" ending in 40 s, holds committed, released and pending. `GET /api/hub/me/points` answered `no-store`, balance 1,100, both live lots with their ends, the movements newest first with `pending` on the running holds. The app's own 09:05 UTC pass logged "1 lots ended, 37 points left them, 0 refused" (the 63 lot had been fully held, so it wrote nothing for it). Releasing the 250 "Captions" hold after its lot ended wrote `+50`, `-50` (Expired) on that lot and `+200` on the live one; the final view: balance 1,300, 2 lots, 14 movements. BASIC still empty throughout. Files `v9-before.json`, `v9-write.json`, `v9-release.json`, `v9-after.json`, `v9-expiry-log-lines.txt`. |
| Mutants | 15 of 17 killed | See below. |

### What was checked (V2 and V4)

**The ledger, by its real cause** (raw SQL on a `pg` client, so only the database can refuse): a lot below 0 and above its grant are refused by `PointLot_remaining_in_range` even with a matching ledger row (L1); a lot change without its row and a row without its change both pass the statement and are refused at COMMIT (deferred, L2); UPDATE of `delta`, `at` or `wawuUserId`, a DELETE of one row, `TRUNCATE "PointLedger"` and `TRUNCATE "PointLot" CASCADE` are all refused (L3). Not refused: see D2 and U1.

**Spend order and ties:** soonest end first; equal ends spend the oldest grant first, then the lot id (O1). `createdAt` is the app's clock at each INSERT (Prisma fills `@default(now())` itself; it is `$8` in the INSERT), so two grants in one transaction still differ by milliseconds.

**Refusals:** a hold of 101 against 100 is `402` with exactly `{ code: insufficient_points, balancePoints: 100, neededPoints: 101, shortfallPoints: 1 }`; lots, ledger and holds are byte-identical before and after, and the same reference then holds 100 (H1). Zero, negative, 1.5, NaN, Infinity, `"5"`, 2^31, an empty or 201-character reference and a 61-character title are each `points_invalid` with nothing written (H2).

**Commit and release:** a 250 hold over lots of 70 and 180 releases back to exactly 70, 180 (one row each); a second release writes nothing; commit after release is `409 points_hold_settled`; commit writes no row and a release after it is 409; an unknown hold is 404 (H3). Release into an ended lot, before the job (`+30`, `-30`), after the job had already emptied it (`+70`, `-70`), and split across an ended and a live lot: every point that left the ended lot is expired exactly once (H4).

**Idempotent grant:** same source and reference returns the first lot and writes nothing (a later end is ignored); another person or another amount is `409 points_grant_conflict` (G1); the same reference under another source is a separate lot, by design (the key is source plus reference).

**Concurrency, 50 rounds each, with random jitter so both orders happen** (`out/harness-evidence.json`):
- C1, 8 holds of 30 against 100: 3 held, 5 refused, balance 10, every round (50/50).
- C2, 8 grants of one reference: 1 lot, 1 row, all 8 answer the same lot (50/50); two people racing one reference: 1 lot and 1 `points_grant_conflict` (50/50).
- C3, a hold against the expiry pass: hold first 35, pass first 15; the ending lot's 50 points were either held or expired, never both and never neither.
- C4, a release against the pass: release first 28, pass first 22; the lot always ends at 0 with expire rows summing exactly -100.
- C5, two passes at once: one expire row per lot (50/50).
- C6, a commit racing a release: exactly one wins every round (commit 23, release 27); balance 15 or 60 as it should.
- C7, a new hold racing the release of another: held 25, refused 25; balance always 50 or 100.
- C8, two people with one hold reference at once: see D3.
- Lots always within 0 and their grant and equal to their ledger rows after every round of C1 to C8.

**Time:** a lot ending exactly now, one a second ago and one a second ahead: the first two are not spendable, not in the balance, not listed, and the pass at that instant writes both off; the third stays (O2). `hold`, `view`, `expireLapsed` and `release` use the same boundary (`>` now is live). Every timestamp this code writes (`createdAt`, `at`, `settledAt`, `lapsedAt`) and the job's cut-off are the app's clock, passed as a parameter (the job's query is `"expiresAt" <= $2` with the app's `new Date()`); the database's clock is not used. Columns are `timestamp(3)` without time zone written as UTC ISO; the server's TimeZone is `Etc/UTC`; nothing depends on daylight saving.

**Inside a caller's transaction:** grant, hold, commit, a second hold and its release, then the caller throws: lots, ledger and holds byte-identical to before (T1). An `insufficient_points` inside the caller's transaction leaves it usable: the caller grants and holds again and commits (T2).

**A hold left forever** (T3): nothing in this task ever gives held points back. The expiry job ignores holds; a pass before and after the lot ended left the hold `held` with its 60 points out of the balance, and expired only the 40 that were free. If someone releases it later, the points come back and expire at once. What a later task must add: POINTS-03, a sweep that releases `ai_job` holds still `held` after the job's maximum run time (config), by `holdId` (safe against a late commit: one of the two is refused), and an index on `PointHold (state, createdAt)` (today only `(wawuUserId, createdAt)`); POINTS-04, never time out a `cash_out` hold while its payout's outcome is unknown, reconcile with the provider first. Also for every caller (X3): this service's own transactions use Prisma's default 5 s timeout, so a caller transaction that holds a person's points lock for 7 s makes a concurrent points call for that person fail with a raw `P2028` (500); call `grant` or `hold` last in a caller's transaction and never wait on a provider while holding it.

**`GET /me/points` over HTTP** (`out/http-evidence.json`): the token is the person; `?wawuUserId=<BASIC>&sub=<BASIC>`, `?take=999999&lots[]=1`, a trailing slash and `/ME/POINTS` all answer the caller's own view; `/me/points/<BASIC>`, `/me/points;wawuUserId=x`, POST and DELETE are 404; no token, a garbage token and an `alg: none` token are 401; HEAD is 200 `no-store`. Every 200 is `Cache-Control: no-store`. No `₦`, `$`, naira, dollar, kobo, NGN, USD or em-dash anywhere in the body, and every label in every hold state is plain (H5). With 65 live lots: balance right (aggregate), `lotCount` 65, 50 listed; `nextExpiry` wrong (D1). A balance above 2^31 - 1 (two lots of 2,000,000,000) reads back correctly and a hold of 2,147,483,647 spans both lots (V2).

**Purge and export:** the purge removes exactly the person's 7 ledger rows, 3 holds and 2 lots, and the other person's rows are byte-identical; a second purge finds nothing (P1). The export's three sections hold only that person's rows, no hold or grant reference, and serialise to JSON (2,306 bytes for that person; `seq` is not exported). The only deletes in non-spec code are the purge's (source grep). See U1 for the purge under a concurrent hold.

**The migration:** fresh `migrate deploy` and seed on four databases, each with all 6 triggers and 8 CHECKs (`triggers-fresh-dbs.txt`); `prisma migrate diff` (database to schema) shows only `DROP INDEX "ContentPiece_specializations_idx"`, identical to main's on a main-migrated database. The stamp `20261016130000_points` sorts after every folder on origin/main (newest `20261012100000_schools_hidden` at the start, `20261015100000_professional_takedown` at the end) and after every folder on 77 `origin/wmt/*` branches except two, both the plan's reserved stamps: MONEY-17's `20261016140000_wallet_payments` and NUV-01's `20261016150000_nuvion_adapter`. It shares its stamp with no folder. `prisma migrate reset` itself: NOT RUN (below).

### Mutants (17, each alone on `vp01b`, a fresh migrated database each, the builder's points specs and my harness; files restored byte for byte, `git status` clean after)

Killed by the builder's specs: M01, M05, M06, M07, M08, M11, M14, M16 (8). Killed by my harness: 15 (all but M12, M13). Killed only by mine: M02, M03, M04, M09, M10, M15, M17.
- M01 a hold spends the latest-ending lot first: killed (both).
- M02 equal ends spend the newest grant first: builder survives; mine kills (O1).
- M03 a lot ending exactly now is spendable (`gt` to `gte`): builder survives; mine kills (O2).
- M04 the pass skips a lot ending exactly now (`lte` to `lt`): builder survives; mine kills (O2).
- M05 a lot cannot be taken to exactly 0 (`gte` to `gt`): killed (both).
- M06 a hold leaves 1 point in each lot (takes less than it records): killed (both).
- M07 points released into an ended lot are not expired with it: killed (both).
- M08 the no-UPDATE trigger not created: killed (both).
- M09 the ledger-side lot check (`PointLedger_matches_lot`) not created: builder survives; mine kills (L2).
- M10 the `remaining <= quantity` CHECK dropped: builder survives; mine kills (L1).
- M11 a partial delete of a person's ledger allowed: killed (both).
- M12 commit and release without the person lock: **survives both**.
- M13 the expiry write-off without the person lock: **survives both**.
- M14 a grant reference reused with another amount replays silently: killed (both).
- M15 a hold reference reused by another person returns the first person's hold: builder survives; mine kills (H6).
- M16 the purge deletes lots before the ledger: killed (both).
- M17 the balance counts only the 50 listed lots: builder survives; mine kills (V1, the balance assert).

M12 and M13 survive because those two locks are not load-bearing: the guarded `updateMany` on `state = 'held'`, the guarded `remaining >= n` and the deferred lot checks catch every interleaving I drove (C4 to C6 at 50 rounds). Defence in depth, not a gap; the hold's lock is load-bearing (the builder's own mutant).

### Findings

**D1 (defect, V4): `nextExpiry.points` is short when more than 50 live lots end at the soonest moment.** It is summed over the 50 listed lots only (`points.service.ts` `view()`, `lots.filter(...)`). Reproduce: grant one person 60 lots of 1 point ending at the same moment and 5 lots of 100 ending later; `GET /me/points` answers balance 560, `lotCount` 65, 50 lots, and `nextExpiry: { points: 50 }`; 60 points end then. PT5 would tell the person "50 points end 7 Nov" when 60 do. Fix: sum the soonest end's points in the database, in the same snapshot. Closes when: harness test V1 passes (`nextExpiry.points` 60) and the HTTP case answers 60.

**D2 (defect, V2, the capability check "the spec fails on an UPDATE or DELETE of the table"): a bare `DELETE FROM "PointLedger"` is accepted.** The whole-person trigger lets one statement delete every person's whole ledger at once, which is a truncate by another name; the migration header says the ledger is never truncated. Reproduce (rolled back, `L5`): `BEGIN; DELETE FROM "PointLedger";` answers `DELETE 6` with no error. Afterwards every lot keeps its points with no ledger behind it. Fix: in `points_ledger_whole_person_only`, also refuse a statement whose deleted rows span more than one person (the purge deletes one person per statement; the specs' clean-ups that delete `wawuUserId: { in: [...] }` would loop per person). Closes when: that statement is refused and the purge spec still passes.

**D3 (defect, V2): two people asking for a hold with the same purpose and reference at the same moment get a raw unique violation, not `409 points_hold_conflict`.** 47 of 50 rounds (C8) answered `PrismaClientKnownRequestError P2002` for one of the two (a 500 through any route, and it aborts a caller's transaction); one after the other it is the 409 (H6). The grant handles the same race with `ON CONFLICT DO NOTHING`; the hold's `pointHold.create` does not, and the two people take different person locks. Fix: create the hold with `ON CONFLICT DO NOTHING` (or catch P2002 on `PointHold_purpose_reference_key`) and answer from the winner. Closes when: C8 shows one held and one `points_hold_conflict` in 50 of 50 rounds.

**D4 (defect, V2): `grant` accepts an end after the year 9999, and then `GET /me/points` answers 500 for that person.** Postgres stores `10000-01-01 00:00:00`, Prisma reads it back as Invalid Date, and `view()` throws `Invalid time value`; holds still spend from the lot, and it never ends, so the person's view stays 500. Reproduced live (`v4-year10000.json`: before 200, after 500 "Something went wrong", 200 again once the rows were removed); also `+275760-09-13` (`out/extra-evidence-final50.json`, X2). A caller that mixes seconds and milliseconds would do this. Fix: refuse an end past a bound (no later than 9999-12-31, or a config maximum) as `points_invalid`. Closes when: that grant is `points_invalid` and the view stays 200.

**D5 (defect, copy): a cancelled conversion's own hold row still reads "Converting to cash".** After `release` of a `cash_out` hold, its `hold` row is labelled "Converting to cash" with `pending: false`, next to "Conversion cancelled" (H5). The person sees an ended conversion described as still running. The AI-tool rows avoid this ("Held for VoiceOver" after a release). Fix: a released `cash_out` hold row gets a label that does not say it is still converting (wording for the owner). Closes when: H5's `cash_out/released` hold row label is no longer "Converting to cash".

**U1 (unclear, for the lead): a lot can end up disagreeing with its ledger through a delete, and the purge is not serialised with the points lock.** (a) A DELETE of one person's whole ledger outside the purge is accepted and leaves their lots with points and no ledger (L4: lot 10, ledger 0, committed); that person's next hold then fails at COMMIT with a raw error (500). The database cannot tell the purge from any other caller. (b) The purge racing a hold for the same person (200 rounds of the purge's three points deletes against a hold, `out/extra-evidence-x1b-200.json`): 5 rounds left both lots and the hold behind, with lots at 0 and 50 and their ledgers at -100 and -50: the purge's ledger delete and the hold's deferred check each read before the other committed, so both passed. The purge then logged two foreign-key refusals and carried on; a second purge cleaned up every time. Through `AccountPurgeService.purge` itself it happened in 1 of 50 rounds. `AccountPurgeService` has no caller on main or this branch (`src/account/account.service.ts` says so), so neither is reachable today. Suggested before anything calls the purge: a points step that deletes the person's ledger, holds and lots in one transaction under `points:<wawuUserId>`. Closes when: the lead rules, or that step exists and X1b leaves 0/0/0 in 200 of 200 rounds.

**U2 (unclear): a hold's state is not guarded by the database.** `UPDATE "PointHold" SET state = 'held', "settledAt" = NULL` on a committed hold is accepted (L6, rolled back); a release after it would give spent points back, and because a commit writes no ledger row (builder's decision) the ledger would show an ordinary release. The builder never claimed this guard. Suggested before POINTS-04 relies on holds for cash: a trigger letting `state` move only from `held` to `committed` or `released`, and fixing person, purpose, reference and quantity.

**U3 (unclear, fact): "Account deletion removes all of a person's points" is true only of the purge facility.** `DELETE /account` (`AccountService.deleteAccount`) does not call `AccountPurgeService`; it has no caller. So today a deleted account's points rows stay (the person can no longer sign in to use them). Not caused by this task.

**Notes (no action needed to pass):**
- The schema comment on `PointLedger.at` ("the transaction's time, so the rows of one hold share it") is not what happens: Prisma writes the app's time per INSERT, so one hold's rows differ by milliseconds. Harmless, movements order by `seq`.
- A later release into an already-lapsed lot moves its `lapsedAt` to the release's time (H4: from the pass's time to the release's, a minute later); the export shows the later time.
- `hold` with a reference used before returns that hold in its current state, even released (H3): POINTS-03 must use a new reference for each attempt.
- `points_invalid` for a past end says "Points must end after today." while the check is "after now".
- A lot the database permanently refuses to write off stays first in the job's queue; 500 such lots would stop every pass. It needs U1-type damage to happen.
- The contract's `lots` and `movements` carry no `maxItems` (50, 20); no route in the contract declares 401 (house pattern).
- Express answers `304` to `If-None-Match` even with `no-store` (app-wide default on every route, not this task).
- The two surviving mutants (M12, M13) are above.

### The builder's decisions, judged
- Points separate from WAWU Credits: agree (R-43 leaves it open).
- Mounted through `MeModule`: works (route mapped, the cron pass ran in the built app); fine until the owner prefers `app.module.ts`.
- A repeated grant keeps the first end; another person or amount refused: agree, verified (G1, C2). Another source with the same reference is another lot.
- Holds idempotent on purpose and reference, answering the current state: agree, with D3 and the H3 note for POINTS-03.
- Commit writes no ledger row: workable (the lots and ledger always agree), but it makes U2 matter.
- Points released into an ended lot end in the same transaction: agree, verified (H4, C4 at 50 rounds, live in V9).
- Purposes `ai_job` and `cash_out`; the title comes from the calling task's own table: agree (the title is not checked for em-dashes here; the caller's table is the place).
- Account deletion removes all points and pays nothing out: agree as a default; see U3.
- `createdAt` in place of `at` in the view: fine.
- The copy: plain, no em-dash, no currency, except D5.
- The 5-minute job and the two PROVISIONAL values: fine.

### For the lead (not a defect of this task): CONVENTIONS section 14
Three branches each add a section 14: FIX-17 "A NUL, or other text Postgres cannot take" (worktree head e4d409c, not on origin yet), MONEY-17 "Pay from wallet" (cd47278; its `docs/contract/WALLET.md` cites "CONVENTIONS.md section 14" twice), POINTS-01 "Points" (no in-repo reference; only this task file says "section 14"). Clean renumbering, by the planned order: FIX-17 keeps 14 (it comes before the payment wave), MONEY-17 becomes 15 (and its two WALLET.md cites), POINTS-01 becomes 16 (nothing else to change). Whichever merges later takes the next free number at its merge.

### NOT RUN
- `prisma migrate reset`: Prisma 7 refused it for an AI agent ("You must ask the user if they want to proceed ... PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION", `migrate-reset-refusal.txt`); not worked around. The fact that unblocks it: a person runs `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/<name>_test?schema=public npx prisma migrate reset --force` on wmt/POINTS-01 and `SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid::regclass::text LIKE '"Point%'` answers 6. Evidence meanwhile: the triggers live in the migration's own SQL, which a reset re-applies, and every fresh deploy here (including `run.sh --fresh`'s drop and re-create) had all 6 and the 8 CHECKs.
- The full suite as `deploy.yml` runs it (one jest process): run as four shards at default timeouts instead. Unblocked by CI's test job on this branch, or a machine with load under about 8.
- PT5 on a phone (V5 to V7, V10): no screen in this task (as the builder says).

Mobile check on the report commit: `npm run check` exit 0 (typecheck 0, lint 0, 76 suites 1,377/1,377, gates 9 run, 346 files, 0 fail 0 warn, 249 tasks), after `python3 scripts/tasks/check_tasks.py --write`. Mobile `contract/` is unchanged by this report.

Status: back to `building` for D1 to D5.

## Owner sign-off
