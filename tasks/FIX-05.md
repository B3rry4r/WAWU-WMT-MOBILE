---
id: FIX-05
title: Global throttler, one address must not push others into 429
owner: YOU
area: FIX
order: 180
priority: launch
repo: wawu-backend
type: setup
status: verifying
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
