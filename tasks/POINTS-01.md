---
id: POINTS-01
title: Points: lots that expire, and the points ledger
owner: YOU
area: POINTS
order: 200
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

## Owner sign-off
