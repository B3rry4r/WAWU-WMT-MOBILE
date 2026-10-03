---
id: FIX-04
title: One person's cached answers are never shown to the next person
owner: YOU
area: FIX
order: 122
priority: launch
repo: wawu-wmt-mobile
type: setup
status: verifying
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

Fenced files, named by the lead for this task: `src/app/_layout.tsx`, `src/api/session.ts`, `src/api/query.ts`,
their tests, and the task and docs files. No feature file, no backend change. `src/features/open-wallet/` is
KYC-05's (making A26's own queries account-keyed on its branch) and is not touched.

## Capability checks

- [x] After A signs out and B signs in, B's first frame of any screen is a loading state or B's own answer, never A's.
- [x] The same after A's session is refused (expired, the refresh refused), after a sign-in as B over A's session, and after a refresh that answers with another account's token.
- [x] A read for A still in flight when B signs in never lands in B's cache or on B's screen; neither does a save (mutation) for A still in flight.
- [x] On a real Hub, B opening A21 with B's reads held 3 s sees the loading state, then B's own account; never A's (light and dark, 390 px).
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

_Verifier: fill in._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
