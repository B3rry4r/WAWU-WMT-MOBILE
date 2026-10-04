---
id: FIX-05
title: Global throttler, one address must not push others into 429
owner: YOU
area: FIX
order: 180
priority: launch
repo: wawu-backend
type: setup
status: done
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-05 · Global throttler, one address must not push others into 429

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- G-95 (the defect, found by WALLET-27's round-3 verifier; its row is on branch `wmt/WALLET-27`, which adds it)
- wawu-backend `src/hub-throttlers.ts`, `src/app.module.ts`, `src/tests/hub-rate-limits.contract.spec.ts` (OPS-11), `src/money/identity/tests/identity-throttle.contract.spec.ts` (KYC-01, KYC-02)
- `tasks/FIX-04.md` (the same kind of task: a lead-owned shared fix, made once)

## Goal

`@nestjs/throttler` 6.5's in-memory storage expires each hit with its own timer and keeps the timer ids in ONE list
per throttler name. When any caller's block ends, `resetBlockdRequest` calls `clearExpirationTimes(name)`, which
clears that whole list: every other caller's hits stop expiring, their counts only climb, and people who never
reached the limit get 429. It is live on production and affects every route. WALLET-27's verifier showed it with
`xaddr.js`: a caller at 2 `/health` a second gets 120 x 200 alone and 6 x 429 while another address bursts 25 every
1.5 s.

One address's traffic never changes another address's throttling, on every route, and the store's memory stays
bounded: no per-hit timers that pile up, expired entries pruned.

## Scope

The lead's ruling: replace the in-memory storage with our own `ThrottlerStorage` (keyed per throttler name and
tracker, prune on access and on a periodic sweep, no per-hit timers), registered in the app's throttler config. No
upgrade or patch of `node_modules`. Every existing limit and tracker stays exactly as configured; the
`hub-rate-limits` spec passes unchanged and gains tests. Files: `src/app.module.ts` (fenced, SHARED-CHANGES
FIX-05 #1), the new `src/hub-throttler-storage.ts`, the spec. No route, contract or schema change.

## Capability checks

- [x] The xaddr reproduction: the victim gets 0 x 429 while another address floods.
- [x] The flooding address still gets 429 at the same limits as today.
- [x] 100k distinct trackers, then idle: memory returns near baseline after the window, and no event-loop stall (measured).
- [x] `@Throttle` overrides and `@SkipThrottle` still behave as before (existing specs, plus new ones through the new store).

## Builder report

Builder, 4 Oct 2026. Backend `wmt/FIX-05` at 25291ac, from main 9a370c0. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fx05/` (`fx05/` below). No Fintava call (so no sandbox notes file), no `id.wawuafrica.com` or `api.wawuafrica.com` call.

- **Design.** `src/hub-throttler-storage.ts`, `HubThrottlerStorage implements ThrottlerStorage`. One `Map` of buckets keyed `<throttler name>:<guard key>` (the guard's key already hashes class, handler, name and tracker). A bucket holds its counted hits as expiry timestamps (oldest first), the fixed window behind `X-RateLimit-Reset`, the block, and `until` (after which it holds nothing a new bucket would not). On each `increment` the bucket drops its own expired hits, or is dropped whole when idle; nothing one bucket does reaches another. No timer per hit: one `setInterval` (10 s, `unref`'d, cleared on shutdown) sweeps idle buckets, 5,000 at a time with a `setImmediate` yield between chunks. The answers follow the library's own order, so behaviour is the library's for any one caller: each hit counts for `ttl` after it arrives; the hit that goes over `limit` blocks for `blockDuration` (default `ttl`) and blocked requests are not counted; the first request after the block starts a fresh count of 1; `timeToExpire` is the library's fixed window; whole seconds rounded up.
- **Registration (default, agent; owner may override).** `src/app.module.ts` gains one import and one `providers` entry, `HUB_THROTTLER_STORAGE` (`{ provide: ThrottlerStorage, useClass: HubThrottlerStorage }`), beside the unchanged `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. The guard is created in AppModule, so it resolves AppModule's own provider before the global ThrottlerModule's. Not `ThrottlerModule.forRoot({ throttlers, storage })`, because the existing spec checks `ThrottlerModule.forRoot([...HUB_THROTTLERS])` literally and had to pass unchanged. The library's default store is still constructed by ThrottlerModule and never used (a new test asserts it stays empty). `app.module.ts` is fenced: SHARED-CHANGES row FIX-05 #1.
- **Spec** (`src/tests/hub-rate-limits.contract.spec.ts`): the 10 existing tests unchanged (only the import lines grew); 11 added.
  - HTTP, an app built as the existing tests build it plus `HUB_THROTTLER_STORAGE`: AppModule registers the provider and the guard counts in our store, never the library's; **G-95**: attacker over the limit, victim sends 15, attacker's block ends, victim sends 6 more after its window: 6 x 200 (the library's store: 5 x 200, 1 x 429); a caller at 2 a second through five 25-bursts from another address: 0 x 429, every burst 20 x 200 and 5 x 429; the flooder: 20 a second, the 21st 429 with `Retry-After-short: 1`, remaining 19 to 0, refused while blocked, then a fresh count; a test-only route's `@Throttle` (3 a minute) per address with `Retry-After-short: 60`, and `@SkipThrottle(SKIP_EVERY_HUB_THROTTLER)` answering 30 in a burst and keeping no bucket.
  - Store, fake clock: for one caller, 3,000 random steps (bursts, gaps, exact window and block boundaries) on each of the five limit sets the app uses (20/1 s, 200/60 s, 3/60 s, 20/1 h, and a block longer than its window): every answer equals the library store's; with six callers interleaved (one flooding, blocked over 50 times), each caller's answers equal a library store holding that caller ALONE; a caller at exactly 20 a second for 30 s is never blocked while another is blocked 100 times; 100,000 callers start no timer (only the sweeper) and the periodic sweep removes all 200,000 buckets after the 60 s window, and nothing before its own; a sweep of 20,000 idle buckets yields the loop at least 3 times; an idle bucket is dropped on access and answers as a new one.
  - **The tests fail on the old store** (`fx05/mutant-library-store.log`: `increment` delegated to the library's `ThrottlerStorageService`): the HTTP G-95 test, the interleaved-callers test and the store G-95 test fail. The five-burst HTTP test passes on the old store too: 7 s is shorter than the defect needs (first 429 at 15.6 s on main); the G-95 test is the one that bites. On the branch: 21 of 21 (`fx05/spec-branch.log`).
- **Built Hub, port 4931** (`nest build` of the branch and of main 9a370c0, fresh migrated `f05_xaddr_test`, stand-in WAWU ID on 4932):
  - `xaddr.js` (WALLET-27 r3's, unchanged, 60 s a phase): **main** victim `{"200":113,"429":6}`, 429 at 15.6, 16.1, 32.2, 32.7, 50.7, 51.2 s; attacker `{"200":200,"429":800}`. **Branch** victim `{"200":119}`, attacker `{"200":200,"429":800}`: the flooder is refused exactly as on main (`short` per burst, then `medium` 200 a minute), the victim never (`fx05/xaddr-main.log`, `fx05/xaddr-branch.log`).
  - 100,000 distinct callers through `/health` (64 at a time, keep-alive, each its own `X-Forwarded-For`), then 80 s idle, a probe caller at 2 a second throughout (`fx05/flood100k.js`): **branch** 100,000 x 200 in 54.9 s; RSS 207 MB at start, 606 MB after the load, 168 MB after idle; probe 258 of 258 x 200, slowest 241 ms under the load and 11.7 ms while idle (the sweeps). **Main** RSS 242, 787, then 1,113 MB after idle; the probe's slowest answer while idle took **81.8 s**: 200,000 per-hit timers firing, each filtering the shared timer list (`fx05/flood100k-*.log`).
  - Store alone, `node --expose-gc` (`fx05/mem.js`, `fx05/mem-*.log`): 100k callers x 2 throttlers add 86.4 MB of heap and 0 timers; after 75 s idle the heap is 0.1 MB above its baseline and the store empty. The library's store on the same run: 152,000 timers added, the ingest took 33 s with a 28 s loop stall, and 75 s later 84 MB and 200,000 entries were still held. Longest single hold of the loop while sweeping 200,000 idle buckets: 15 ms (100 ms in all, `fx05/sweep-slice.log`).
- **Checks.** `npx tsc --noEmit` 0; eslint on the three changed files 0. Full contract suite (`npx jest --runInBand --forceExit`) on a freshly created, migrated and seeded `f05_contract_test`, WAWU ID stand-in on 4932: 3,337 passed, 59 failed, 3 skipped (`fx05/contract-full2.log`). The 59 are 7 suites that hardcode the stand-in at `localhost:4001` (`notification`, `saved-item`, `privacy-settings`, `kyc-submission`, `credits-state`, `account`, `blocked-account`: `MOCK_WAWU_ID_PORT = 4001`), where another builder's stand-in, with another key, was listening for the whole session (port rule: 4001 not used), and one `money-pin` test that timed out at 5 s with the machine's load average at 7 to 8; `money-pin`, `identity-throttle` (KYC-01 and KYC-02 `@Throttle` through the whole AppModule, so through the new store) and `hub-rate-limits` then passed together, 53 of 53 (`fx05/rerun-pin-throttle.log`). Protected route suite `run.sh --fresh` on `f05_protected_test`: 253/253, lock unchanged. Gates: 16 fail / 21 warn, as main, none in a changed file. CI tripwire: 0 added lines match. No em-dash added. No API change, so no contract rebuild or sync.
- **Order (default, agent; owner may override).** The brief said the next free order, but every order up to 205 is used and a launch task may not come after CHECK-3 (180), which `check_tasks.py` enforces and does not renumber. FIX-05 takes 180, the last launch place; CHECK-3 and every task after it moved down one (26 files, `order:` lines only), as FIX-03 and FIX-04 did.
- **Type (default, agent).** The brief named type `backend-fix`, which `check_tasks.py` does not know; `setup`, as FIX-02 and FIX-03, with their passes.
- **Finding, G-96.** Every throttler tracks a caller by its whole address. An IPv6 client normally has a whole /64, so it can be as many callers as it likes, each with its own limits and its own buckets. Kept as configured (the brief); tracking IPv6 by /64 is the follow-up. Whether production nginx accepts IPv6 is not known.
- **Note.** The store lives in the process, as the library's did: limits are per Hub process. Production runs one process (systemd, `deploy/install-services.sh`); a second process would need a shared store (Redis), not this one.
- **Cleanup.** Hubs and the WAWU ID stand-in stopped by their PIDs (working directory checked first); ports 4931 and 4932 free; `f05_*_test` databases dropped; build output, `dist-seed`, the main worktree and the stand-in's generated key removed.
- **NOT RUN:** the seven 4001-hardcoded suites against a stand-in that matches their key (unblocked when `lsof -i :4001` shows the port free, then `npx jest --runInBand` of those seven files with the stand-in started on 4001). The fix on the production Hub (unblocked by a deploy of this branch; then `xaddr.js` against it from two addresses).

## Verifier report

Verifier, 4 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/FIX-05` `25291ac` (base main `9a370c0`) and mobile `wmt/FIX-05` `0fdafba` (base main `9a0c1be`) in fresh detached worktrees `/home/user/wt/vf05b` and `/home/user/wt/vf05m`, with main `9a370c0` built beside it (`/home/user/wt/vf05main`) for the before and after runs. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vf05/` (`vf05/` below). My own databases `vf05_http_test`, `vf05_full_test`, `vf05_protected_test` (dropped afterwards); built Hub on 4933, stand-in WAWU ID on 4934, and my own stand-in on 4001 for the full suite only, started when `lsof -i :4001` showed it free (it was held by another session's stand-in for about 70 minutes first) and stopped straight after. No Fintava call, nothing to `id.wawuafrica.com` or `api.wawuafrica.com`. Everything I started is stopped. **Verdict: no defect open, status review.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npx tsc --noEmit` 0 on the branch and on the trial merge with backend main `e6bd701` (`vf05/tsc-branch.log`, `vf05/tsc-trialmerge.log`). Backend gates `python3 scripts/gates/run.py`: branch 9 run / 674 files scanned / **16 fail / 21 warn** / 76 accepted; main `9a370c0` 16 / 21 / 76 on 673 files; the FAIL and WARN lines are identical line for line (`vf05/g-m.txt`, `vf05/g-b.txt`). Trial merge with `e6bd701`: 16 / **24** / 76 on 680 files, which is `e6bd701`'s own count. No finding in a changed file. CI tripwire: 0 added lines match `test/protected-routes`, `src/protected-routes`, `compareShape` or `protected-registry`. Em-dashes added: 0 in both diffs. Mobile `npm run check`: exit 0, 206 tasks (`vf05/mobile-check-branch.log`). |
| V2 Contract | passed | Full suite run the way deploy.yml runs it: fresh `vf05_full_test` (migrated and seeded with `npm run db:seed`), `mock-wawu-id/server.js` on :4001 with a keypair made by the workflow's two `openssl` lines, then `npx jest --runInBand --forceExit`: **141 of 141 suites, 3,396 passed, 0 failed, 3 skipped** (`vf05/full-suite.log`). That includes `identity-throttle` (KYC-01 and KYC-02's `@Throttle` through the whole AppModule, so through the new store), `hub-rate-limits`, `payment-webhook-throttle`, `money-pin`, and the seven suites the builder could not run on :4001. The rate-limit spec alone: 21 of 21 on the branch and on the trial merge (`vf05/spec-branch.log`, `vf05/spec-trialmerge.log`). The behaviour checks are in sections 1 and 2 below. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh` on `vf05_protected_test`: **253/253, all 244 required** (`vf05/protected.log`). The md5 of `.pipeline/protected-registry.json` is the same before and after. `npm run contract:build` from the branch: `contract/openapi.json` unchanged against the commit, and byte-identical to mobile's synced `contract/openapi.json`. There is no API change, so no sync was needed. |

**1. The defect is gone.** Built Hub (`nest build`, fresh migrated `vf05_http_test`), requests through the loopback hop as nginx sends them:
- `xaddr.js` (WALLET-27 r3's, unchanged, 60 s a phase):
  - **main**: victim `{"200":114,"429":6}`, with the 429s at 15.6, 16.1, 31.2, 31.7, 47.3 and 47.8 s;
  - **branch**: victim `{"200":119}`, 0 x 429;
  - the flooder is refused the same way on both: `{"200":200,"429":800}` (`vf05/xaddr-main.log`, `vf05/xaddr-branch.log`).

  This is the whole AppModule, so it also proves the provider reaches the live guard, not only the spec's own test module.
- Many flooders, mixed throttler names and limit sets, 120 s (`vf05/multi.js`). The flooders, each with its own gap so blocks keep ending at different moments:
  - 10 addresses bursting 25 on `/health`;
  - 3 bursting 8 on admin login (5 a minute);
  - 3 bursting 25 on admin refresh (20 a minute);
  - 3 bursting 5 on the BVN check (3 a minute, 20 an hour).

  Six victims stay under every limit: 2 a second on `/health`; 18 in one go every 10 s on `/health` (2 under `short`); 3 a minute on `/health`; 4 a minute on admin login; 15 a minute on refresh; 2 a minute on the BVN check.
  - **Branch:** every victim gets 0 x 429 (`vf05/multi-branch.log`).
  - **Main:** every victim except the 3-a-minute one gets 429 (`vf05/multi-main.log`): the 18-burst 96, the 2-a-second 20, admin login 3, refresh 10, the BVN check 1.

  So on main G-95 hit every throttler name, not only `short`. On the branch it hit none.
- At the store, on a fake clock, against the library's store (my own differential, `vf05/fuzz.js`, `vf05/fuzz-branch.log`):
  - 40 callers on six limit sets, interleaved over 40,000 steps. Eight of them flood up to 30 at a time. Each caller is compared answer by answer with a library store holding that caller ALONE.
  - Plus 50 rounds of a victim mid-window while another caller is blocked on the exact millisecond its window renews, and that block ends exactly 1,000 ms later.
  - Result: **0 differences in 280,457 answers.**
  - The same harness pointed at the library's store finds 100,296 differences (`vf05/fuzz-library-store.log`), so it can see the defect.

**2. Same limits for one caller.** Main `9a370c0` and the branch, one fresh address per scenario, requests sent one after another, every status and every `X-RateLimit-*` and `Retry-After*` header recorded (`vf05/trace.js`). The scenarios:
- global `short` 20/1 s and `medium` 200/60 s on `/health`: a `short` block, its end and the fresh count; `medium` filled to its 201st request, refused through its block (`Retry-After-medium` read again at 30 s left), its end and the fresh count; then `short` again;
- admin login, 5/60 s: block, 30 s into it, end, fresh count, block again;
- admin refresh, 20/60 s: the same;
- the BVN check, 3/60 s, across 7 blocks until `medium` (20/1 h) blocks; then the selfie route from the same address, which keeps its own count.

**Result: 363 requests on each.** Every status is identical, the 65 x 429 come at the same positions, and every `Retry-After*` is identical. **1,967 of 1,979 headers are identical** (`vf05/trace-compare.log`).
- **The other 12** are all in one burst: `X-RateLimit-Reset-medium` reads 53 on main and 52 on the branch, for requests 132 to 143. The value is `ceil` of the seconds left in the window. The branch's run crossed a whole second seven requests into that burst and main's did not; both runs read 54 in the burst before and 51 in the burst after. This is wall-clock phase between two runs, not the store.
- **On a fake clock** the same limit sets give 51,050 of 51,050 answers equal for one caller (`vf05/fuzz-branch.log`, part 1). The gaps land exactly on, one under and one over every window and block, and include the 1 h `medium` block's expiry, which HTTP cannot wait for.
- **The admin limit sets** (login 5/60 s, refresh 20/60 s) are in my fuzz. The builder's list of five limit sets did not name them.

**3. Registration.**
- **In the app:** one `APP_GUARD` (`src/app.module.ts`) and one entry point (`src/main.ts`; `emit-openapi.ts` serves no traffic). Grep of `src`: no module other than AppModule imports `ThrottlerModule`; no controller uses `@UseGuards(ThrottlerGuard)`; nothing subclasses the guard or injects `ThrottlerStorage`.
- **On other backend branches the only throttler additions are tests.** `wmt/WALLET-18` (`money-receipt.contract.spec.ts`) and `wmt/WALLET-27` (`money-statement.contract.spec.ts`) build their own `ThrottlerModule.forRoot` and global guard, which count in the library's store (note B).
- **WALLET-18's new `@Throttle(RECEIPT_*_THROTTLE)`** (10/60 s, 60/1 h) go through the global guard, so through this store once both are on main. No branch adds a guard of its own.
- **KYC-03** (now on main `95d8bd4`) changes `identity-config.ts` but not `BVN_CHECK_THROTTLE`.

**4. Memory and event loop.** `node --expose-gc`, with the compiled branch store fed as the guard feeds it: a sha256 key per route, name and address, `short` then `medium`, real clock (`vf05/memtest.js`).

| Run | Load | Heap: start / loaded / after the window | Buckets left | Longest loop hold, idle and sweeping | Evidence |
|---|---|---|---|---|---|
| 100,000 callers (200,000 buckets) | under 1 s | 8.3 / 94.8 / **8.5 MB** (75 s) | 0 | 36 ms | `vf05/mem-100k.log` |
| 1,000,000 callers (2,000,000 buckets) | 7.0 s | 8.3 / 857.8 / **8.6 MB** | 0 | 59 ms (six holds over 20 ms in 75 s) | `vf05/mem-1m.log` |

After the 1M run, RSS stays near its peak (940 MB) once the heap is freed. That is V8 keeping pages, not the store.

**Built Hub, 100,000 distinct callers** through `/health` (64 in flight), then 80 s idle, with a probe at 2 a second throughout (`vf05/flood100k-branch.log`):
- 100,000 x 200 in 46.6 s;
- RSS 283 MB at the start, 689 MB at the end of the load, 304 MB after idle;
- the probe got 245 of 245 x 200: slowest 147 ms under the load, 4 ms while idle.

**Shutdown:** the rate-limit spec under `jest --detectOpenHandles` (no `--forceExit`) exits 0 with no open-handle warning (`vf05/spec-branch-openhandles.log`).

**5. Mutations.** Each was applied to `src/hub-throttler-storage.ts` alone, then the spec and my fuzz were run, then the file was restored with `git checkout` (`vf05/mut/*/`).

| Mutant | Spec (21 tests) | My fuzz |
|---|---|---|
| M1 no sweep | killed (1: the 100k sweep test) | survives: the answers are the same, the memory is not |
| M2 hit counted for `ttl * 1000` (wrong unit) | killed (6) | killed |
| M3a bucket keyed by the guard key only (no name) | killed (1: bucket count) | survives: equivalent in the app, because the guard's key already hashes the name |
| M3b one bucket per name, shared by every caller | killed (8) | killed |
| M4 block not honoured (`isBlocked: false`) | killed (7) | killed |
| M5 off by one (`>= limit`) | killed (7) | killed |
| M6 no fresh count after a block | killed (2) | killed |
| M7 sweep removes live buckets (30 s early) | killed (2) | killed |
| M8 sweeper not `unref`'d | **survives** | survives |
| M9 shutdown keeps the interval | killed (1) | survives |
| M10 sweep never yields | killed (1) | survives |
| M11 block lasts `ttl`, not `blockDuration` | killed (1) | killed |

M8 is harmless today: every shutdown path clears the interval, and jest exits without `--forceExit`. But no test pins the `unref` (note C).

**6. The order renumber.**
- **The 26 task files:** each diff is exactly one line, `order: N` to `order: N+1`. They are exactly the 26 files that had order 180 or more on main. No order is duplicated on the branch, and FIX-05 takes 180. `python3 scripts/tasks/check_tasks.py` exits 0 (206 tasks).
- **Backend trial merge** of `e6bd701` into `25291ac`: clean. `tsc` 0, the rate-limit spec 21/21 on the merge, gates as `e6bd701`. Backend main has since moved to `95d8bd4` (KYC-03): `git merge-tree` is clean.
- **Mobile trial merge** of `2874688` (and of the newer `2c99b2f`) into `0fdafba`: no conflict in any task file. It conflicts in three places:
  - `BACKEND_GAPS.md` and `SHARED-CHANGES.md`: both sides append rows at the end of the same table. Keep both, with G-96 and FIX-05 #1 after main's rows. G-96 collides with no number on any branch.
  - `docs/PROGRESS.md`, against `2874688` only: a generated file, so rerun `check_tasks.py --write`.

**7. G-96 (IPv6 tracked per address): Medium.** It is already on main; FIX-05 neither introduces nor worsens it, and it does not block this task.
- **The exposure is limit bypass.** One IPv6 client with a /64 is as many callers as it likes, so it walks past every per-address limit: admin login's 5 a minute (password guessing) and the BVN check's 3 a minute. The per-person daily cap still bounds what Fintava charges.
- **Memory is not the risk.** Buckets are bounded by time. The Hub served about 2,100 distinct callers a second here, so at most about 130,000 callers fit in a 60 s window: roughly 110 MB of heap at the 100k measurement's rate, whoever sends them.
- **One correction to the row.** "Whether production nginx accepts IPv6 at all is not known" is only half true. `deploy/install-services.sh` writes `listen [::]:80;` into both sites, and certbot's nginx plugin carries that to 443, so nginx is configured to accept IPv6. What is not known is whether the droplet has an IPv6 address and the API domain an AAAA record.

**8. Secret scan.** Every 8-character window of the Fintava key was checked against both branch diffs: backend `9a370c0..25291ac` (26,808 bytes) and mobile `9a0c1be..0fdafba` (33,859 bytes). **0 hits.** The key was only ever read into a process environment, never printed.

**Diff against the report.**
- **Backend:** `src/app.module.ts`, `src/hub-throttler-storage.ts` (new) and `src/tests/hub-rate-limits.contract.spec.ts`, as the report says. The spec's only removed lines are three import lines, which were rewritten; the 10 existing tests are unchanged.
- **Mobile:** the task file, G-96, SHARED-CHANGES FIX-05 #1, the LOG line, the regenerated `PROGRESS.md` and `INDEX.md`, and the 26 order lines.
- Nothing is missing and nothing is extra.

**Findings**

No defect.

- **A (`unclear`, G-96's row, not this task's code):** the row says it is not known whether nginx accepts IPv6, but the repo's nginx config listens on `[::]` (section 7). Only the droplet's address and its DNS are unknown.
- **B (`unclear`, merge order):**
  - `wmt/WALLET-18` and `wmt/WALLET-27` both edit `src/tests/hub-rate-limits.contract.spec.ts`, which this branch also grows by 457 lines at its end. Whichever merges second may need that file merged by hand.
  - Their new throttle specs build their own module without `HUB_THROTTLER_STORAGE`, so they test the library's store, not the one production uses.
- **C (`unclear`, test strength):** mutant M8 (no `unref` on the sweeper) survives the spec. That is harmless as long as every shutdown path calls `onApplicationShutdown`. One assertion would pin it: `hasRef()` is false after the first `increment`.
- **D (a note, not a finding):** the store is per process, as the library's was, and production runs one Hub process. The builder says so too.

**NOT RUN**
- **The fix on the production Hub.** Unblocked by a deploy of this branch, then `xaddr.js` against the API from two addresses.
- **Whether production is reachable over IPv6** (G-96's real exposure). Unblocked by `dig AAAA` on the API domain and `ip -6 addr` on the droplet. Not run: no live calls.
- **The `medium` 1 h block's expiry over HTTP.** It cannot be waited out here. It is covered at the store on a fake clock (section 2).

## Lead merge note (4 Oct 2026)

Merged to main by the lead. Backend PR #60 (c4d17bb) carries the per-caller
rate-limit store; lead merge of main 95d8bd4 was clean (tsc 0, rate-limit spec
21/21, tripwire 0 lines, contract unchanged, so no mobile contract sync).
Merge conflicts were rows added on both sides of BACKEND_GAPS (G-96 placed
before G-98) and SHARED-CHANGES; both kept. Follow-ups from the verifier,
none blocking: G-96 (IPv6 tracked per whole address, Medium; whether the
droplet has an IPv6 address and the domain an AAAA record is unchecked);
WALLET-18 and WALLET-27 both edit `src/tests/hub-rate-limits.contract.spec.ts`,
so the second of them to merge resolves that file by hand; no test checks the
sweeper timer is `unref`'d (mutant M8).
