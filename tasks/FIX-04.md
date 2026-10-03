---
id: FIX-04
title: One person's cached answers are never shown to the next person
owner: YOU
area: FIX
order: 122
priority: launch
repo: wawu-wmt-mobile
type: setup
status: done
depends_on: []
decisions: []
passes: [V1, V6, V9]
artboards: []
---
# FIX-04 · One person's cached answers are never shown to the next person

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, shared files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `src/app/_layout.tsx`, `src/api/session.ts`, `src/api/query.ts`, `src/api/client.ts`
- `SHARED-CHANGES.md` rows 1 (SHELL-02) and KYC-05 #4
- `tasks/WALLET-11.md` (A21, the payout account screen this is proved on) and KYC-05's round-3 verifier report on branch `wmt/KYC-05` (defect 1, where this was found)

## Goal

The app keeps one query cache for the whole process, and nothing cleared it when the session changed. Query keys
carry nothing of the account. So when person A's session ended (sign-out, a refused refresh, expiry) and person B
signed in, in the same app process, every screen with a cached query first drew A's answer and only then B's. Seen
on A26 (A's phone and "Your wallet is open" shown to B) and on A21 (A's payout account shown to B).

No answer cached for one account is ever drawn for another. This is a lead-owned shared change: it is made once,
in the session and query layer, so every screen, present and future, is covered without each feature remembering to.

## Scope

Fenced files, named by the lead for this task: `src/app/_layout.tsx`, `src/api/session.ts`, `src/api/query.ts`, `src/api/client.ts` (added by the lead for fix round 2),
their tests, and the task and docs files. No feature file, no backend change. `src/features/open-wallet/` is
KYC-05's (making A26's own queries account-keyed on its branch) and is not touched.

## Capability checks

- [x] After A signs out and B signs in, B's first frame of any screen is a loading state or B's own answer, never A's.
- [x] The same after A's session is refused (expired, the refresh refused), after a sign-in as B over A's session, and after a refresh that answers with another account's token.
- [x] A read for A still in flight when B signs in never lands in B's cache or on B's screen; neither does a save (mutation) for A still in flight.
- [x] On a real Hub, B opening A21 with B's reads held 3 s sees the loading state, then B's own account; never A's (light and dark, 390 px).
- [x] A request sent in one session is never sent again in the next: a 401 for a token from an ended session ends that request as signed out, for every method, and for a refresh that answers for another account; a token rotated within one session still retries (fix round 2).
- [x] The app-wide query defaults are pinned by tests: 30 s fresh, at most 2 retries and only for no connection or a server fault, mutations never retried (fix round 2).
- [x] Other code can learn that the session ended (`onSessionEnd`), as SHARED-CHANGES KYC-05 #4 asked.

## Builder report

Builder, 3 Oct 2026. Mobile `wmt/FIX-04`, from main `6bc420e`. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fx04/` (`fx04/` below).

- **Design.** `src/api/session.ts` gains `onSessionEnd(listener)`. It fires synchronously, before the new status is published, when a signed-in session ends: `signOut()`, a refresh the server refused, a `signIn()` that replaces a session (always, whoever signs in), and a refresh whose token is for another account (the access token's JWT `sub`; an unreadable token counts as unknown, so an opaque token's refresh never ends a session). A first sign-in, a restore and a second sign-out fire nothing. A listener that throws stops neither the others nor the change; the call that ended the session then rejects with its error. `src/api/query.ts`: `createQueryClient()` subscribes its client: every query is `reset()` (cancels its fetch, so a late answer is dropped, and tells a screen still drawn that its data is gone) and then the cache is `clear()`ed. A global `MutationCache` notes how many sessions had ended when each mutation started; a mutation that succeeds after a session change is turned into a signed-out `ApiError` before the screen's own `onSuccess` runs, so it cannot `setQueryData` into the next account's cache (A21's save does exactly that). `src/app/_layout.tsx` now uses that one `queryClient` instead of its own `new QueryClient()`, which applies SHARED-CHANGES row 1 (SHELL-02) as well.
- **Behaviour change from row 1 (default, agent; owner may override):** the app's query defaults now apply: 30 s stale time and retries only on no connection or a server fault (was: TanStack's 0 s and 3 retries for everything). Every query in the app today sets its own `staleTime` except A21's bank list and name check, which set `retry: false`.
- **Jest, one shared cache across sessions** (`src/__tests__/session-cache.test.tsx`, 7 tests; it renders the real root layout, so it uses the cache the app uses). Sign-out then B; refused refresh then B; B signed in over A with A on screen; a refresh answering with B's token (then A21 must not show A's account); A's read in flight across the switch; A's save in flight across the switch; A21 itself. **On main's `_layout.tsx`, `session.ts`, `query.ts`: 6 of 7 fail** (`fx04/jest-cache-on-main.log`; the seventh, the refresh to another account, cannot fail on main: main never changes account on a refresh). On the branch 7 of 7 pass (`fx04/jest-on-branch.log`). Each part is needed: without the mutation guard the in-flight save fails; without `reset()` the over-A sign-in and the refresh to B fail (`fx04/jest-ablate-*.log`). `session.test.ts` gains 3 tests for `onSessionEnd` itself (which paths fire it, the `sub` rule, a throwing listener).
- **Browser** (`fx04/harness/drive.py`, `fx04/results.jsonl`, `fx04/shots/`). Web exports of main and of the branch (`--clear`, `EXPO_PUBLIC_*` on `localhost:8181`, 0 `wawuafrica.com` in either bundle); Hub `dist` built from backend main `fe1ec6c` on a fresh migrated and seeded `fx04_test` on :4981; stand-in WAWU ID on :4982 behind the `{ data }` front (KYC-05 r3's `web-server.js`, ports moved) on :8181; Fintava stand-in on :4983 started with `env -i` (environment: `PATH`, `HOME` only), 38 calls, all `GET /banks` or `/name/enquiry`. A and B each have a `FintavaWallet` row; their first payout accounts are saved through the Hub, because the bank list is not served (G-57). A signs in through A22, saves `1111111111` through A21 (PUT 200), reopens A21, edits, and the session is refused on Save (PUT 401, refresh 401, `/welcome`): the app has no sign-out control yet, so this is how a session ends here. B signs in in the same tab, no reload, and opens A21.
  - **main, B's reads held 3 s:** B's first frame is a filled form with A's `1111111111` and "ADA FIRST"; after B's answer arrives the form still holds A's number with Save enabled (the form keeps the state it started with), so B could save A's account as B's own (`main-2-b-first-paint-held-*.png`, `main-3-b-loaded-*.png`). Full speed: the number field only ever held `1111111111`.
  - **branch:** B's first frame is the loading skeleton, then B's own `2222222220` "BAYO SECOND" (`branch-2-…`, `branch-3-…`). Full speed: `(loading)`, then `2222222220`. Light and dark both.
- **Checks:** `npm run check` exit 0 before (24 suites, 403 tests; gates 0 fail, 0 warn on 108 files; 204 tasks) and after (25 suites, 413 tests; gates 0 fail, 0 warn on 109 files; 205 tasks).
- **Order (default, agent):** 122, right after WALLET-11 (A21, where the browser proof runs); every task from 122 moved down one (83 files, `order:` lines only), as at FIX-03.
- **Shared changes:** row 1 (SHELL-02) applied; KYC-05 #4 done (its row is on `wmt/KYC-05`; added here as done). KYC-05's `keptCheck.ts` can now subscribe with `onSessionEnd(forgetKeptCheck)`.
- **Notes:** a screen's own React state is not reset by this. It no longer matters for a cached answer (no screen can start from another account's data), but a screen that stays mounted through a sign-in over a session keeps what was typed. No path reaches that today: `signIn` has one caller, A22, which only exists while signed out. My first branch browser run was served the main export (I stopped the wrapper shell, not the server); those rows and shots were deleted, the server was stopped by its own PID, and every branch result above is from a rerun on the branch export.
- **Cleanup:** Hub, stand-ins and front stopped by their PIDs (command line and cwd checked first); ports 4981 to 4983 and 8181 free; the Hub worktree and a detached main worktree used for the main export removed; `fx04_test` dropped. No Fintava, `id.wawuafrica.com` or `api.wawuafrica.com` call.
- **NOT RUN:** a native device or simulator build (the fix is plain JS in the shared layer; unblocked by a development build on the owner's Android phone, V10). A sign-out through the app's own control: there is none yet (unblocked when a Settings or Me screen calls `signOut()`; `session-cache.test.tsx` covers the call itself).

## Verifier report

Verifier, 3 Oct 2026 (fresh session; wrote none of this code). Mobile `wmt/FIX-04` at c051e67, which already contains mobile main 6bc420e (`git merge-base --is-ancestor origin/main HEAD` true after a fresh fetch; origin/main has not moved), so the branch and its merge with main are the same tree. Hub `dist` built from backend main fe1ec6c. Before-runs: a detached worktree of main 6bc420e. Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfx04/`: driver `$V/harness/drive.py` (written fresh; the flow mirrors the builder's so results compare), pass-through `$V/harness/web-server.js` (the builder's, ports moved, plus a hold-then-401 for one PUT and the token `sub` logged on every Hub write), run results `$V/results.jsonl` (each row names its `variant`), request log `$V/harness/calls.jsonl` (key names, lengths and `sub` only), screenshots `$V/shots/<variant>-<scenario>-*-<theme>.png`, jest probes `$V/vfx04-probe.test.tsx` with `$V/jest-probe-branch.log` and `$V/jest-probe-main.log`, mutants `$V/mutate.py`, `$V/mutants.jsonl`, `$V/mutate.log`, `npm run check` log `$V/check-branch.log`.

**Verdict: the cached-answer leak is closed (A21, light and dark, held and full speed), and every session-end path fires exactly when it should. One defect is open (defect 1: an in-flight save for A is sent again with B's token and lands in B's account). Status back to `building`.**

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| Privacy: cached answers | passed | Browser, 390 px, one tab, no reload; A's session refused on Save (PUT 401, refresh 401, `/welcome`), B signs in through A22. **main, B's reads held 3 s:** B's first frame is A's form, `1111111111` and "ADA FIRST"; after B's answer the field still holds A's `1111111111` with Save enabled (`aria-disabled` absent, light and dark) (`main-slow-2-*`, `main-slow-3-*`). **main, full speed:** the field only ever holds `1111111111`, Save enabled. **branch, held:** first frame the loading skeleton, no form, no A number or name; then B's `2222222220`, "BAYO SECOND", Save disabled (`branch-slow-2-*`, `branch-slow-3-*`). **branch, full speed:** `(loading)`, then `2222222220`. Both themes each. A21 is the only merged screen with a `useQuery` (`BankSheet` bank list and `PayoutAccountScreen`; `src/features/` has no other) |
| Privacy: in-flight writes | **failed** (defect 1) | `branch-replay-*`, `main-replay-*`; `results.jsonl` rows `scenario: replay`; jest P1, P2 |
| Session-end paths | passed | Jest probes on the branch (`$V/jest-probe-branch.log`) plus the builder's 7 and 3: sign-out fires once and a second sign-out does not (P4); a refused refresh, a sign-in over A and a refresh to B's token fire (builder's tests, re-run green). A first sign-in, a restore from the vault and a same-account rotation fire nothing, and after a rotation the probe never draws `loading` (P4). A refresh that fails on the network fires nothing: still signed in, A still on screen, no `loading` frame (P3). Late reads after a switch: builder's test re-run green, and in the browser B's A21 never showed A after A's read 401'd |
| Regression from the new defaults | passed | Every query and mutation on the branch (= main): A21's `payoutAccountQuery` (`staleTime: 0`, `retry: false`), `banksQuery` and `nameCheckQuery` (no `staleTime`, so now 30 s; `retry: false`); `savePayoutAccount` (mutation, `retry: false` from the defaults; TanStack's own default was 0, so unchanged). `walletBalanceQuery`, `walletIdentityQuery`, `selfieMatchQuery` are defined with `staleTime: 0` (balance pinned by `money-balance.test.ts`) and no screen on main reads them; they move from 3 retries on any error to 2 on network or server faults only. No money or PIN read takes the 30 s default; no paid mutation exists on main, and mutations are never retried. The bank list and a name check of the same bank and number held for 30 s within one session are not money state, and the session end clears them |
| Robustness | passed | Throwing listener: the others still run, the status still changes, `signOut()` rejects with its error (P5; builder's test). A listener added during a firing runs in that same firing and one removed before its turn is skipped (`Set` order; P5: `a, b, added-during`, `c` skipped): harmless, noted. A throwing listener during a refresh to B's token: the refresh rejects with that error and the session stays B's (P6). Double fire: none (P4). Strict mode: the cache and both `onSessionEnd` subscriptions are made at module load, not in a component, and `restoreSession()` is idempotent, so a double mount adds nothing. Outside React: `signIn`, `signOut` and `refreshAccessToken` fire the listeners with no component mounted (P4 to P6) |
| Renumber | passed | 85 task paths changed: the 83 renumbered files carry only `order:` lines, each old 122 to 204 moved by exactly +1; plus `tasks/FIX-04.md` (new, 122) and the generated `tasks/INDEX.md`. 206 `order:` values, all unique. `check_tasks.py` passes and `--write` leaves no diff. `depends_on` pointing at a later order: 0 on main and 0 on the branch (`$V/deps.py`) |
| Mutations | passed with 1 gap (finding 2) | 15 of my own in `session.ts` and `query.ts` (`$V/mutants.jsonl`), each restored and sha1-checked. **Killed (13):** no `reset()`; no `clear()`; the mutation guard never throws; the ended-session counter never counts; `drop()` never fires; a sign-in over a session fires only on a new `sub`; a refresh to another account does not fire; a same-account rotation fires; a first sign-in fires; a throwing listener stops the rest; the listener's failure swallowed; `accountOf` always null; unsubscribe does not remove. **Survived (3):** status published before the listeners in `drop()` (equivalent: `setStatus` only schedules React's render, and the listeners run in the same synchronous call before any render); the retry rule changed back to "any error, 3 times", and the default `staleTime` set to 0, both against the full suite (413 tests pass): the defaults this task turns on app-wide have no test |
| V1 | passed | `npm run check` on c051e67 (= merged with main): exit 0; typecheck and lint clean; 25 suites, 413 tests; gates 9 run, 109 files scanned, 0 fail, 0 warn, 0 accepted; 205 tasks (`$V/check-branch.log`). The "worker failed to exit gracefully" line is on main's run too (builder's `check-before.log`). Scope (`git diff --name-only origin/main...HEAD`): `src/api/session.ts`, `src/api/query.ts`, `src/app/_layout.tsx`, `src/__tests__/session-cache.test.tsx`, `src/__tests__/session.test.ts`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/`; no feature file, no `src/features/open-wallet/`. 0 em-dashes added under `src/`; the one new user string ("You were signed out. Sign in again.") has none. No UI, so no colour or spacing to check |
| V6 | passed | The states this task changes: loading first (`branch-slow-2-light`, `-dark`), then B's own answer (`branch-slow-3-*`), at full speed `(loading)` then B (`branch-fast-4-*`); signed out by a refused refresh (`/welcome`). Each by its real cause (a held Hub, a refused refresh) |
| V9 | passed | Hub `dist` (fe1ec6c) on :4985, `vfx04_test` fresh, migrated and seeded. Stand-in WAWU ID :4986, its login and refresh wrapped as `{ data }` by the pass-through, as KYC-05 r3 did (G-59). Fintava stand-in :4987 started with `env -i` (`PATH`, `HOME` only; no `FINTAVA_API_KEY`): 41 calls, 40 `/name/enquiry` and 1 `/banks`. Web exports of main and branch with `--clear`, `EXPO_PUBLIC_*` on `localhost:8185`, 0 `wawuafrica.com` in either; Playwright blocked 0 requests to it. Every sign-in through A22 (no injected token). B's `2222222220` and "BAYO SECOND" on screen come only from the Hub; the replay's write is read back through the Hub with B's own token and in `MoneyPayoutAccount` |
| V10 | NOT RUN | No device. Unblocked by a development build on an Android phone with the backend reachable (OPS-10) |

### Findings

**Defect 1 (privacy, money details): a save for A still in flight when B signs in is sent again with B's token, and A's payout account becomes B's.**
- `src/api/session.ts` `refreshAccessToken(rejected)`: when the token in memory is not `rejected`, it hands back the token in memory (`if (tokens.accessToken !== rejected) return Promise.resolve(tokens.accessToken);`). It never asks whether `rejected` was issued in the current session. After A's session ends and B signs in, that token is B's, and `src/api/client.ts` `onResponse` sends A's request again with it.
- **Browser, branch c051e67, light and dark** (`scenario: replay`):
  1. A signs in through A22, opens A21 and types `3333333330`.
  2. A taps Save. The pass-through holds that PUT.
  3. A's session is then refused. A read 401s, the refresh is refused, and the app shows `/welcome`.
  4. B signs in through A22 in the same tab.
  5. The held PUT is answered 401: A's access token has expired.
  6. The app calls no refresh. It sends the same PUT again with B's token, and the Hub answers 200.
  7. Read back with B's own token, `GET /money/payout-account` answers `3333333330`, and the `MoneyPayoutAccount` row for B holds `3333333330`. A's account is unchanged (`1111111110`).
  8. B opens A21 and sees `3333333330` with "ADA FIRST" ticked (`branch-replay-2-b-opens-a21-light.png`, `-dark.png`).
  9. Calls in order: `PUT 401 as A`, then `PUT 200 as B` (`results.jsonl`, `harness/calls.jsonl`, PUT `sub` changes). B's payouts would now go to the account A typed.
- The mutation guard turns the success into a signed-out error on the client. The server write has already happened, though, so the guard does not help.
- Main 6bc420e does the same (`main-replay-*`): this predates the branch. It is still inside this task. The capability check says "neither does a save (mutation) for A still in flight", and the brief says late mutations after a switch never land. The code that hands B's token over is `session.ts`, which is this task's fenced file.
- Jest reproduces it on the branch and on main (`$V/vfx04-probe.test.tsx`):
  - P1, the human path: hold A's save, sign out, sign in as B, release it as a 401. Writes: `["POST /api/hub/users/me as B"]`.
  - P2, a refresh that answers with B's token while A's save is in flight: A's own request is sent again as B.
- **Closed when** a request sent under one session is never sent again under another. For example, `session.ts` could remember the access tokens issued in the current session (cleared wherever `generation` moves, and at a cross-account refresh). `refreshAccessToken` would then return `null` for a rejected token that is not one of them, so the request ends as signed out. Tests: P1 and P2 as above. Each must assert that the fake Hub took no write with B's token.

**Finding 2 (test gap, fix in the same round): the app-wide query defaults this task turns on have no test.** With the retry rule changed back to "retry any error 3 times", all 413 tests pass. They also all pass with the default `staleTime` set to 0. Both values are now live for every query that does not set its own. Closed when a test pins `createQueryClient()`'s defaults: 30 s stale time; retries only on `network` and `server`, at most 2; mutations never retried.

**Checked and not a defect:**
- A screen's own React state survives a sign-in over a mounted screen, as the builder notes. `signIn` has one caller, A22, which only exists while signed out.
- `accountOf` treats an opaque token followed by a JWT (or the reverse) as an account change. Real WAWU ID only issues JWTs.
- The mutation guard hands A21's `onError` a signed-out `ApiError`. Its `invalidateQueries` then reads B's own account, which is harmless.

### Capability checks

1. B's first frame after A signs out is loading or B's own: passed (browser after a refused refresh; jest after `signOut()`; there is no sign-out control in the app yet).
2. The same after a refused refresh, a sign-in over A, and a refresh to B's token: passed (browser for the refused refresh; jest for all three).
3. A's read or save in flight never lands for B: **failed** for saves (defect 1). Reads: passed.
4. On a real Hub, A21 with B's reads held 3 s: passed, light and dark, 390 px.
5. `onSessionEnd` exists: passed.

### NOT RUN

- A native build (V10): no device. Unblocked by a development build on an Android phone.
- A sign-out through the app's own control: there is none on main. Unblocked when a Settings or Me screen calls `signOut()`.
- The A26 screens from KYC-05: not on main, so not run here. Unblocked when `wmt/KYC-05` merges.

### Cleanup

Hub, stand-in WAWU ID, Fintava stand-in and pass-through were stopped by their own PIDs, after checking each command line and cwd. Ports 4985, 4986, 4987 and 8185 are free. The worktrees `vfx04m`, `vfx04main` and `vfx04hub` were removed, and `vfx04_test` was dropped. No Fintava sandbox or live call was made, and no call went to `id.wawuafrica.com` or `api.wawuafrica.com`.

## Builder round 2

Builder, 3 Oct 2026. Mobile `wmt/FIX-04` `bd57ab8` (code) on the verifier's `7fce5ee`; main `6bc420e` has not moved, so the branch is its merge with main. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fx04/r2/` (`r2/` below).

- **Defect 1, cause:** `refreshAccessToken(rejected)` handed back whatever token was in memory when it was not `rejected`, without asking which session `rejected` came from, so `client.ts` sent A's request again with B's token.
- **Defect 1, fix.** `src/api/session.ts`:
  - It keeps a session number and the set of access tokens issued in the current session (the stored one, the sign-in's and each refresh's).
  - A new session starts at every sign-in and whenever a session ends: sign-out, a refused refresh, or a refresh answering for another account. That replaces `generation`.
  - `refreshAccessToken` returns null for a token not issued in the current session, so that request ends as signed out.
  - A refresh whose answer started a new session (another account's token) returns null to the request that asked.
  - New `isCurrentSessionToken(token)`.

  `src/api/client.ts` (fenced; the lead added it for this round) asks again at the moment of the retry, after the refresh resolves: it sends again only if both the rejected token and the new one belong to the current session. This holds for every method, because it is the one auth middleware.
- **Tests for defect 1** (`src/__tests__/session-cache.test.tsx`; the fake Hub logs every request with whose token and its status):
  - P1: A's save held, A signs out, B signs in, the save is answered 401. Only `POST as A 401` is sent, never a write as B.
  - The same for a read (GET).
  - P2: a refresh answers with B's token while A's save is in flight. No write is sent as B.
  - Same-session rotation: the expired save is refreshed and sent again as A, once (`as A 401`, `as A 200`).

  On round 1 (`c051e67`) the first three fail and the rotation passes (`r2/jest-cache-on-c051e67.log`). On main every test in the file fails (`r2/jest-cache-on-6bc420e.log`; the rotation test fails there only because main never empties the cache between tests). On the branch, 11 of 11 pass. `session.test.ts`: the cross-account refresh test now expects null for the request that asked, and still checks that the session became B's.
- **Finding 2:** new `src/__tests__/query-defaults.test.ts` (14 tests) drives `createQueryClient()` the way a screen does (an observer, fake timers). It pins:
  - An answer is fresh for 30 s (no fetch at 29 s, a fetch at 31 s).
  - Network and server failures (and a thrown non-API error) get 3 tries in all; every 4xx kind gets 1.
  - A mutation is tried once after a network or a server failure.

  Each of the verifier's survivors now dies (`r2/defaults-mutants.log`): retry "any error, 3 times" fails 11; staleTime 0 fails 1; mutations `retry: 3` fails 2.
- **Browser, the verifier's `replay`** (their driver and pass-through, ports moved to mine: `r2/harness/`, `r2/results.jsonl`, `r2/shots/`). Setup:
  - Hub built from backend main `fe1ec6c` on a fresh, migrated and seeded `fx04_r2_test` on :4981.
  - Stand-in WAWU ID on :4982, behind the `{ data }` front on :8181.
  - Fintava stand-in on :4983 (environment `PATH` and `HOME` only; 23 calls: 1 `/banks`, 22 `/name/enquiry`).
  - Exports of main and the branch, built with `--clear`; 0 `wawuafrica.com` in either.

  Results:
  - **main, light and dark:** the PUTs read `401 as A`, then `200 as B`. B's account read with B's own token, and the `MoneyPayoutAccount` row, become `3333333330`. B's A21 shows `3333333330` with "ADA FIRST" (`main-replay-2-*`).
  - **branch, light and dark:** the PUT reads `401 as A` and nothing follows (the app's one refresh call is the refused one that ended A). B's account stays `2222222220` through the Hub and in the row, A's stays `1111111110`, and B's A21 shows `2222222220` "BAYO SECOND" (`branch-replay-2-*`).
  - Re-run on the branch, light and dark: B's held A21 first draws the loading skeleton, then B's own account; at full speed `(loading)` then `2222222220`.
- **Checks:** `npm run check` exit 0 (26 suites, 431 tests; gates 0 fail, 0 warn on 110 files; 205 tasks; `r2/check.log`).
- **Cleanup:** every process stopped by its own PID after checking its command line and cwd. Ports 4981 to 4983 and 8181 are free. The Hub worktree and the detached main worktree are removed, and `fx04_r2_test` is dropped. No Fintava, `id.wawuafrica.com` or `api.wawuafrica.com` call.
- **NOT RUN:**
  - A same-session rotation in the browser. Covered in jest. Unblocked by a pass-through control that answers one Hub write 401 while the refresh is accepted.
  - V10, a native build. Unblocked by a development build on an Android phone.
  - A sign-out through the app's own control. There is none yet; unblocked when a Settings or Me screen calls `signOut()`.

## Verifier report, round 2

Verifier, 3 Oct 2026 (same verifier as round 1; wrote none of this code). Mobile `wmt/FIX-04` at 0becc2c (code bd57ab8). It already contains main 6bc420e, which has not moved, so the branch is its own merge with main. Hub `dist` built from backend main fe1ec6c. Before-run: an export of c051e67 (round 1). Evidence `$R` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfx04/r2/`:
- driver `$R/harness/drive.py` (round 1's, plus `rotation`) and pass-through `$R/harness/web-server.js` (round 1's, plus `/__put401`);
- results `$R/results.jsonl` (each row names its `variant`), request log `$R/harness/calls.jsonl` (key names, lengths and the token's `sub`), screenshots `$R/shots/`;
- jest probes `$R/vfx04-probe-r2.test.tsx`, `-r2b` (Q10) and `-r2c` (Q11), with logs `$R/jest-probe-branch.log`, `$R/jest-probe-c051e67.log`, `$R/jest-q10-branch.log`, `$R/jest-probe-mutant-R1.log`, `-R2.log` and `$R/jest-q11-R14.log`;
- mutants `$R/mutate2.py`, `$R/mutants.jsonl`; check log `$R/check-branch.log`.

**Verdict: defect 1 is closed and finding 2 is closed. No defect is open. Status `review`.**

| Pass | Result | Evidence |
|------|--------|----------|
| Defect 1 in the browser | passed | `replay`, light and dark. **c051e67:** the driver still reproduces the defect. B's account reads `3333333330` through the Hub and in the `MoneyPayoutAccount` row, and B's A21 shows it. **0becc2c:** the calls are `PUT 401 as A`, then nothing is sent again. B's account stays `2222222220` (Hub and row), A's stays `1111111110`, and B's A21 shows `2222222220` "BAYO SECOND" (`shots/branch-replay-2-*`, `shots/c051e67-replay-2-*`) |
| Same-session rotation in the browser | passed | `rotation` (new), light and dark. The pass-through answers A's Save 401 once and the refresh is accepted. Calls: `PUT 401 as A`, `refresh 200`, `PUT 200 as A`. A's account becomes `3333333330`, B's is untouched, and there is no error and no sign-out (`shots/branch-rotation-1-*`). The same on c051e67 |
| Cached-answer leak, rerun | passed | `slow`, B's reads held 3 s: the first frame is the loading skeleton with no A number or name, then B's `2222222220`, "BAYO SECOND", Save disabled. `fast`: `(loading)`, then `2222222220`. Light and dark (`shots/branch-slow-*`, `branch-fast-*`) |
| Jest probes | passed | 16 of 16 on 0becc2c. On c051e67, P1, P2, Q6, Q7 and Q8 fail, so the probes tell the builds apart. **P1:** A's save held, A signs out, B signs in, then the save answers 401: no write as B. **P2:** the refresh answers with B's token: no write as B. **Q1:** a same-session rotation is sent again once as A and succeeds, with 1 refresh. **Q2:** three overlapping 401s share 1 refresh and all succeed as A. **Q3:** after a restore from the vault, the first request answers 401 and is refreshed and sent again as A. **Q4a/Q4b:** A's refresh lands just before, or just after, B's sign-in completes: never sent as B. **Q5:** sign-out while a refresh is pending: the late refresh does not sign A back in, the vault stays empty, and nothing is sent again. **Q6:** A, then B, then A; A's old save answers 401 and is not sent again. **Q7:** a GET is not sent again as B. **Q8:** two A requests and a refresh answering with B's token: neither is sent as B. **Q9:** a refresh that fails on the network keeps A signed in. **Q10:** 24 orderings of "refresh released" against "B signs in", 0 to 20 microtasks apart: never sent as B (some are sent again as A before B's sign-in completes, which is A's own session). **Q11:** B signs in while A's refresh is pending, then B's own expired request refreshes as B and succeeds |
| Mutations | passed | Round 1's survivors: the retry rule changed back to "any error, 3 times" is now killed (11 tests fail); the default `staleTime` set to 0 is now killed (1 test fails); round 1's M10 (status published before the listeners) still survives and is still equivalent (see round 1). 14 of my own on the new code, run against `session.test.ts`, `session-cache.test.tsx` and `query-defaults.test.ts`. **Killed (8):** R1 and R2 together (round 1's behaviour); a cross-account refresh does not begin a session; `drop()` does not begin one; the refresh hands back the new token after the session changed; restore does not record the stored token; adopt does not record the new token; `beginSession` keeps the old tokens; a refresh result after the session changed is adopted. **Survived (6), see below** |
| V1 | passed | `npm run check` on 0becc2c: exit 0; 26 suites, 431 tests; gates 9 run, 110 files scanned, 0 fail, 0 warn, 0 accepted; 205 tasks (`$R/check-branch.log`). Round 2 changes `src/api/session.ts`, `src/api/client.ts` (fenced in for this round by the lead), three test files, the task file, `docs/LOG.md` and `docs/PROGRESS.md`. 0 em-dashes added under `src/` |
| V6 | passed | Loading, then B's own answer; signed out by a refused refresh; a save after a rotation succeeds; A's save from an ended session ends as signed out. Each by its real cause |
| V9 | passed | Hub `dist` (fe1ec6c) on :4985 with `vfx04_r2_test` fresh, migrated and seeded. Stand-in WAWU ID on :4986 behind the `{ data }` front. Fintava stand-in on :4987 started with `PATH` and `HOME` only: 32 calls (31 `/name/enquiry`, 1 `/banks`). Exports built with `--clear`, `EXPO_PUBLIC_*` on `localhost:8185`, 0 `wawuafrica.com` in either; Playwright blocked 0. Every sign-in through A22 |
| V10 | NOT RUN | No device. Unblocked by a development build on an Android phone |

**Surviving mutants, each recorded and none a defect:**
- R1 (`refreshAccessToken` no longer checks which session the rejected token is from) and R2 (`client.ts` no longer checks before sending again) each survive alone, and are killed together.
  - The two checks are redundant on purpose: either one alone stops the replay.
  - Every probe above, including the 24 Q10 orderings, also passes under R1 alone and under R2 alone (`jest-probe-mutant-R1.log`, `-R2.log`).
  - So each is equivalent to the other for every path I could build. `refreshAccessToken`'s only caller is `client.ts`.
- R3 and R4 (the client checks only one of the two tokens) survive for the same reason.
- R12 (`isCurrentSessionToken` ignores being signed out) is equivalent: every path that clears `tokens` also empties `issued`.
- R14 (`beginSession` keeps a pending refresh) survives the builder's suite. It changes behaviour: if B signs in while A's refresh is pending, B's own first 401 waits on A's refresh, gets null and fails signed out (`jest-q11-R14.log`). The branch does this correctly (Q11 passes), so it is a test gap, not a defect. Q11 is the test that pins it.

### Capability checks

All five pass. Check 3 (no read or save for A in flight lands for B) now passes for saves too: in the browser, and in P1, P2, Q4 to Q8 and Q10.

### NOT RUN

- V10, a native build. Unblocked by a development build on an Android phone.
- A sign-out through the app's own control. There is none on main yet; unblocked when a Settings or Me screen calls `signOut()`.

### Cleanup

Hub, stand-in WAWU ID, Fintava stand-in and pass-through were stopped by their own PIDs, after checking each command line and cwd. Ports 4985, 4986, 4987 and 8185 are free. Worktrees `vfx04m2`, `vfx04old` and `vfx04hub2` are removed, and `vfx04_r2_test` is dropped. No Fintava sandbox or live call was made, and no call went to `id.wawuafrica.com` or `api.wawuafrica.com`.

## Lead merge note (3 Oct 2026)

Merged after verifier round 2 found no open defect. Mobile only; no backend change. Carried forward:
- Test gap R14: a refresh still pending when a new session starts is pinned only by the verifier's probe Q11, not by the suite. The branch behaves correctly. Add the test with the next change to `src/api/session.ts`.
- Not run: a device build (V10), and sign-out through an in-app control (none exists yet). Both are re-checked when a Settings or Me screen calls `signOut()`.
- SHARED-CHANGES KYC-05 #4 (`onSessionEnd`) is now on main, and KYC-05 subscribes to it.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
