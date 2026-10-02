---
id: SHELL-02
title: Signed-in session and API wiring
owner: DEV
area: SHELL
order: 16
priority: launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: [SETUP-01]
decisions: []
passes: [V1, V9]
artboards: []
---
# SHELL-02 · Signed-in session and API wiring

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)

## Goal

Every screen calls the backend the same way: base URL per environment, the signed-in token, refresh, and one error shape.

## Scope

src/api/: auth headers on the generated client, tokens in expo-secure-store, refresh on 401, typed errors, TanStack Query defaults. Sign-in against today's WAWU ID.

## Capability checks

- [ ] A user signs in with email and password against the test backend and stays signed in after restarting the app.
- [ ] An expired token refreshes once, silently.
- [ ] Signing out removes the token from secure storage.

## Builder report

**Files:** src/api/env.ts, errors.ts, tokenStore.ts, identity.ts, session.ts, query.ts (new); src/api/client.ts (token header, refresh on 401, `unwrap`); src/__tests__/session.test.ts (new); BACKEND_GAPS G-5, G-6; SHARED-CHANGES rows 1-3; docs/LOG.md; this file; docs/PROGRESS.md via `npm run tasks -- --write` (tasks/INDEX.md carries no status and did not change).
**Checks:**
- Sign in with email and password, still signed in after restart: jest (secure store and fetch mocked) signs in, boots fresh modules, reads the token back (PASSED). LIVE against the real local wawu-id and Hub (Postgres 16, `scripts/local/up.sh`, seeded `user@test.wawu.dev`): real `/auth/login`, `GET /api/hub/users/me` returned the seeded Adaeze Okonkwo, and again after a simulated restart (PASSED, harness below).
- Expired token refreshes once, silently: jest, two parallel 401s cause exactly one `/auth/refresh`, both retried with the new token, new pair stored (PASSED). LIVE with local wawu-id at `JWT_EXPIRES_IN=4s`: after 6 s `users/me` succeeded and the stored access token had rotated (PASSED). A refused refresh signs out; an offline refresh keeps the tokens (jest).
- Sign out removes the token: jest asserts both `deleteItemAsync` keys, empty store, later requests carry no header, restart is signed out; LIVE vault empty and `users/me` then 401 (PASSED for the plain case). The in-flight case (sign out while a refresh is pending) was not covered by this run; see fix round 1.
**Harness limits (V9):** the secure store was an in-memory mock, not a phone keychain, and jest-expo replaces fetch, so the live run used a node `http` shim for fetch inside jest (temp test, deleted). No token was injected; every token came from wawu-id. The 4s expiry was a local `.env` edit, restored to 15m. No screen exists yet to sign in from (AUTH-*), so no screenshot or UI sign-in was run (NOT RUN).
**Gates:** before 7 tests / 3 suites, gates 9 run, 16 files, 0 findings / 187 tasks. After 16 tests / 4 suites, gates 9 run, 23 files, 0 findings / 187 tasks. npm run check exit 0.
**Gaps and requests:** G-5 (wawu-id has no contract, so its two calls are read by hand in identity.ts), G-6 (no server sign-out route; refresh token lives 30 days after sign-out). SHARED-CHANGES 1: root layout must adopt `queryClient` from `@/api/query` (defaults not live until then); 2-3: `EXPO_PUBLIC_ID_URL` in build profiles and BUILDS.md. Web build keeps tokens in localStorage (no secure store on web; dev surface only). No backend code changed.

### Builder report (fix round 1)

**Fixed:** finding 1: `session.ts` keeps a session generation counter, bumped by `signIn` and `signOut`; a refresh that started in an older generation is ignored (no save, no status change, returns null), including a refusal, which no longer signs out a newer sign-in. Finding 2: only 401, 403, 400 and 422 (kinds unauthorized, forbidden, validation) from `/auth/refresh` sign out; network, server, 429, 404 and unknown keep the tokens and rethrow. Finding 5: report corrected above. Finding 7: BACKEND_GAPS G-6 now says 30 days is the example env value and production is for the owner to confirm.
**Tests (src/__tests__/session.test.ts):** sign out mid-refresh stays signed out with an empty store and after restart; sign in as another user mid-refresh is not overwritten; a refusal of the old refresh does not sign out the new sign-in; per-kind refresh failures (401/403/400/422 sign out; 429/500/503/404/418/network keep tokens). With only the fix logic reverted, 6 of these fail (the 3 session-change tests, 429, 404, 418); restored, all pass.
**Gates:** before 16 tests / 4 suites, after 29 tests / 4 suites; gates 9 run, 23 files, 0 findings; 187 tasks; npm run check exit 0.
**Untouched:** finding 3 (server rotation grace window) and 4 (store edge cases) are owner decisions; 6 needs no change. The live V9 harness was not re-run; the fix is covered by jest only (NOT RUN live).

## Verifier report

Verifier session, 2 Oct 2026, working tree of `wmt/SHELL-02` (uncommitted). Evidence under `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. `npm run check` exit 0 on my own run: tsc and expo lint clean, jest 16 tests / 4 suites passed, gates 9 run / 23 files scanned / 0 fail 0 warn 0 accepted, baseline 0 entries, 187 tasks. Counts match the builder's. Diff vs report: see findings 5 and 6 | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/check.txt` |
| V9 Live seam | passed for sign-in, restart, silent refresh, refused refresh, offline, sign out, retry of a PATCH body; **failed** for sign out during an in-flight refresh (finding 1). Run by me against wawu-id (`WAWU-ID/dist`, `JWT_EXPIRES_IN=5s` passed as a process variable, `.env` untouched, still 15m) and the Hub (`wawu-backend-main/dist`), my own local Postgres 16 databases, seeded `user@test.wawu.dev`; no hand-made token. Both services stopped afterwards. Jest harness with a node `http` fetch shim and an in-memory secure store (temp test copied to evidence, deleted from the repo) | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/live.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/zz_verifier_live.test.ts.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/hub.log`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02/wawu-id.log` |

| Capability check | Result | Evidence |
|---|---|---|
| A user signs in with email and password against the test backend and stays signed in after restarting the app | passed (in jest with an in-memory secure store; on a phone keychain NOT RUN, see below). Real `/auth/login`, then `GET /api/hub/users/me` returned the server's Adaeze Okonkwo (`sub 0000...0001`, `verificationTier: basic`); after a fresh module boot the same call worked with 0 logins and the stored token. Wrong password: `unauthorized` 401 "Invalid credentials", nothing stored. Unknown account: `not_found` 404 | live.txt lines `A ...` |
| An expired token refreshes once, silently | passed. After 7.5 s with a 5 s access token, 3 parallel requests: 3 hub 401s, exactly 1 `/auth/refresh`, 3 retries, all 200, both stored tokens rotated. Re-using the old refresh token (wawu-id single use) is refused and signs out (vault empty). Offline refresh: `network` ApiError, both tokens kept, works again when back online. A garbage access token with a valid refresh token refreshes and succeeds. A PATCH with a JSON body was retried with its body intact (401 then 200) | live.txt `B`, `C`, `D`, `G`, `I` |
| Signing out removes the token from secure storage | passed in the plain case: `deleteItemAsync` on both keys, vault empty, next request carried no `authorization` header and the Hub answered 401, restart is signed out. **Fails when a refresh is in flight** (finding 1) | live.txt `E`, `F` |

Facts checked in wawu-id (`/home/user/WAWU-ID`): routes are register, login, refresh, otp, email verify, activate, forgot and reset password; there is no logout or revoke route (G-6 correct). Refresh tokens are single use: the stored hash is deleted before the replacement is issued (`src/auth/tokens.service.ts`). The 30-day figure comes from `REFRESH_EXPIRES_IN=30d` in `.env.example` and `deploy/ENV.md` ("e.g. `30d`"), so it is the example value; the live server's value is not readable here (finding 7). wawu-id publishes only a hand-written markdown `WAWUAfrica_API_Contracts.md`, no OpenAPI, so G-5 is accurate and the hand-read `identity.ts` is the one place `wire_types` allows. wawu-id has no throttler.

NOT RUN:
- Secure store on a real phone (Keychain / Keystore): needs a tester build on a device (SHELL-03, V10). Tested with an in-memory mock of `expo-secure-store`; stored sizes are 1114 (access) and 570 (refresh) characters.
- Sign-in from a screen, and a UI screenshot: no sign-in screen exists yet (AUTH-*). Not a V9 requirement here.
- Web localStorage path: not exercised (only the native branch of `tokenStore.ts` ran in jest).
- `scripts/local/up.sh` itself: the stack was started directly from the built `dist` of both repos with the `.env` files already present, so the script's safety checks were not exercised.

Findings:

1. **defect** `src/api/session.ts` `signOut()`: a sign out while a refresh is in flight brings the user back in. `signOut` sets `refreshing = null` and clears the store, but the pending `refreshRequest(...).then(adopt)` is not cancelled, so when it resolves it saves the new tokens and sets `signedIn`. Reproduced live (test F, with the refresh delayed 800 ms and `signOut()` called 300 ms in): vault empty right after `signOut`, then 2 keys again after the refresh; the original request returned 200; a fresh boot is signed in. A user who taps Sign out while any request is refreshing stays signed in with tokens in secure storage, which breaks "signing out removes the token". Needs a session generation check (ignore the refresh result if the session changed) and a jest test for it.
2. **defect (minor)** `src/api/session.ts` `refreshAccessToken` catch: any ApiError other than `network` and `server` signs the user out, so a 429 (rate limited, for example from a proxy) or an `unknown` kind (a 200 with an unexpected body, or any odd status) ends the session although the refresh token may still be valid. Only a refusal (401, 403, and a 400/422 for a bad token) should sign out. Not reproduced live; read from the code and the status table in `errors.ts`.
3. **unclear** wawu-id deletes the old refresh token before issuing the new one. If the response is lost after the server rotated (phone drops signal at that instant), the stored refresh token is dead, the next refresh is refused and the user is signed out. The same single-use rule makes the one-refresh-in-flight design necessary and correct; whether the owner accepts this edge or wants a wawu-id change (grace window) is a decision.
4. **unclear** `loadTokens` returns null when only one of the two keys is present and leaves the stray key in the store; a store that throws on read is treated as signed out without clearing. Both fail safe (signed out, no crash, confirmed live `G`), but a failed `saveTokens` in `adopt` leaves the new tokens in memory while the store holds the old pair. Owner call whether this needs handling before AUTH-*.
5. **defect (report accuracy)** The builder report says `tasks/INDEX.md` was refreshed by `npm run tasks -- --write`; `git status` shows `tasks/INDEX.md` unchanged. INDEX.md carries no status, so nothing is stale and `npm run check` passes, but the report is wrong. Also the report calls the live run "PASSED" for sign out without covering the in-flight case (finding 1).
6. **differs-for-recorded-reason** `src/api/**` is fenced (WORKFLOW section 4) but the ticket's Scope is "src/api/", so the edits are in scope. The six new files and the `client.ts` change match the builder's file list exactly; no extra or missing files (`package.json` untouched; `expo-secure-store`, `openapi-fetch`, `@tanstack/react-query` were already installed). `src/app/_layout.tsx` still builds its own `QueryClient` (line 12); that is queued as SHARED-CHANGES row 1, so the query defaults are not live yet (DECISIONS R-4, fence). SHARED-CHANGES rows 1 to 3 are correct (row 3 "line 90" is the `EXPO_PUBLIC_API_URL` sentence).
7. **unclear** BACKEND_GAPS G-6 states the refresh token lives 30 days; that is the example and local value, not a confirmed production value. Suggest "30 days locally (`REFRESH_EXPIRES_IN`)" until the owner confirms the live setting.

Adversarial review, no finding: tokens only travel in the `authorization` header and the JSON body of `/auth/refresh`, never in URLs (checked live), and there are no `console` calls anywhere in `src/api`. Existing callers: `api` is still created by `createClient<paths>` with the same base URL; the only new behaviour is the header and the 401 retry, and requests made signed out send no header. A retried request keeps its method and body (PATCH checked). The hand-written types in `identity.ts` and `errors.ts` are small, in the data layer, and justified by G-5. No em-dashes, literals, "Flutterwave" or TODO-style comments in the new files. A refresh failure on the raw `api.GET` (not through `unwrap`) rejects with the ApiError instead of resolving with `{error}`, so a screen using `api` without `unwrap` must catch; this is documented in the client comment and matches the one-error-shape goal.

Status set to `building` because of finding 1 (and 2, 5). Fix loop round 1 of 2.

## Verifier report (round 2)

Verifier session (round 2, a different session from the builder and from round 1), 2 Oct 2026, uncommitted working tree of `wmt/SHELL-02`. Evidence under `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. `npm run check` exit 0 on my own run: tsc and expo lint clean, jest 29 tests / 4 suites passed, gates 9 run / 23 files scanned / 0 fail 0 warn 0 accepted, baseline 0 entries, 187 tasks. Matches the builder's round 1 numbers. No script, gate or existing test file changed (git diff shows only the files below) | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/check.txt` |
| Diff vs reports | passed. Changed: BACKEND_GAPS.md, SHARED-CHANGES.md, docs/LOG.md, docs/PROGRESS.md, src/api/client.ts, tasks/SHELL-02.md; new: src/api/{env,errors,identity,query,session,tokenStore}.ts, src/__tests__/session.test.ts. Equals the builder's list; none extra or missing | git status / git diff HEAD --stat |
| V9 Live seam, defect 1 (sign out during refresh) | passed. Real `/auth/login`, access token 5 s, refresh delayed 1 s, `signOut()` at 300 ms: vault 0 keys right after, request ends 401, vault still 0 and token null 1 s later, fresh boot signed out (vault 0). 3 parallel requests queued on that refresh: all fail cleanly with 401, none hang, 1 refresh call, vault 0, a later request is `unauthorized` with no refresh. Round 1 had reproduced this as vault 2 keys and a signed-in fresh boot | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/live.txt` (R1, R1b) (the harness was the round 1 V9 copy extended with the cases above; the extended copy was not saved, NOT RUN to re-run from file) |
| V9, sign in as another user mid-refresh | passed. user@ expired, refresh delayed 1.5 s, `signIn(creator-pro@)` at 300 ms: after the stale refresh resolved, `users/me` still returns creator-pro, vault 2 keys, fresh boot is creator-pro. Also: the old refresh token refused (spent) while creator-basic signs in mid-flight does not sign creator-basic out | live.txt R2, R2b |
| V9, defect 2 (which refusals sign out) | passed. Refresh answered 429, 500, 503 (injected in the fetch shim; real wawu-id has no throttler): ApiError kinds rate_limited, server, server; vault stays 2 keys and the next request succeeds after. Network down: kind network, vault 2. 401, 403, 400, 422: sign out (vault 0, no token). Genuine refusal from the real wawu-id (spent single-use refresh token): unauthorized 401, vault 0 | live.txt R3, R4 |
| V9 re-run, earlier checks | passed. Sign in then server-only value (users/me returns user@test.wawu.dev), restart with 0 logins and the stored token; 3 parallel 401s give 3 hub 401s, exactly 1 `/auth/refresh`, 3 retries all 200; sign out clears vault, next request has no authorization header, restart signed out | live.txt A, B, E |
| Jest fails without the fix | passed. Removing only the generation checks: 3 fail (sign out mid-refresh, other user signed in, old refresh refused). Replacing the refusal rule with "everything but network and server": 3 fail (429, 404, 418). Both mutations were applied to src/api/session.ts temporarily and the file restored byte for byte (sha1 checked) | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/mutation.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/session.sha` |
| Race: sign out while a refresh result is being saved | **failed** (finding 1) | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r2/live_r5.txt` |
| Round 1 findings 3, 4, 6, 5, 7 | see findings 3 to 7 | |

NOT RUN:
- Secure store on a real phone (Keychain / Keystore), sign-in from a screen and a UI screenshot: unchanged from round 1 (needs SHELL-03 tester build; no sign-in screen until AUTH-*).
- Web localStorage path: only the native branch ran.
- `scripts/local/up.sh`: the stack was started from the built `dist` of WAWU-ID (`dist/main.js`) and wawu-backend-main (`dist/src/main.js`) with the existing `.env` files; `JWT_EXPIRES_IN=5s` was a process variable, `.env` untouched (still 15m). Postgres 16 was already running when I started and was left running; both Node services were stopped.
- 429/500/503 against a real throttling or failing server: injected at the fetch shim for the refresh URL (the real wawu-id returned none of them); the 401 refusal and the network case were real.
- A fresh-boot read after the finding 1 race was not run; the vault held 2 keys, and restoreSession reads both.
- The temporary live test was run from src/__tests__ and deleted; no stray files remain in the repo.

Findings:

1. **defect (minor)** `src/api/session.ts` `adopt()` (called by the refresh success path and by `signIn`): the generation check happens before `await saveTokens(next)`, but `setStatus('signedIn')` runs after it with no check. A `signOut()` that lands while the new tokens are being written (a refresh result already accepted, the store write slow) runs `drop()`, sets `tokens=null`, clears, and sets signedOut; then the pending write completes and re-creates both keys, and `adopt` sets status back to signedIn. Reproduced live (R5, store write delayed 600 ms, sign out as soon as the first write began): request returned 200, vault 2 keys after sign out, hook status `signedIn`, `getAccessToken()` null (status says signed in, memory has no token), and the stored pair would restore the session on the next launch. The same class applies to `signIn` racing `signOut`, and to `drop()` racing a new sign-in (a late `clearTokens` can delete the new pair). The window is the keychain write time (milliseconds on a phone, so rare), but it is the same symptom as defect 1 and the jest tests do not cover it. Needs the generation re-checked after the write (or the store writes serialized), plus a test with a slow `setItemAsync`.
2. **unclear** (carried, no change) None beyond finding 1. Generation counter review: bumped by `signIn` and `signOut`; `restoreSession` does not bump it, which is safe because no refresh can start while `tokens` is null; `resetSessionForTests` resets it to 0, test only. The `.finally` ownership check (`refreshing === attempt`) is correct: a stale attempt cannot clear a newer one's slot, and `refreshing` cannot stay stuck, since every path (success, refusal, throw) ends in `finally`. A stale result returns null so the original request gets its own 401 (no unhandled rejection seen; none from the stale branch in jest or live). Queued requests fail cleanly (R1b).
3. **unclear** (left intentionally; owner decision) wawu-id rotation with no grace window: a refresh response lost after the server rotated leaves a dead refresh token and the next refresh is refused. Round 1 finding 3, unchanged; the builder did not touch it and I agree it is for the owner.
4. **unclear** (left intentionally; owner decision) store edge cases: one key missing, a throwing store read, a failed `saveTokens` leaving memory and store apart. Round 1 finding 4, unchanged. Finding 1 above is a different, reproduced race and not covered by this decision.
5. **differs-for-recorded-reason**/closed: builder report corrections are accurate. INDEX.md is no longer claimed refreshed (it carries no status and did not change; PROGRESS.md did and is in the file list); the "sign out PASSED" line now says the in-flight case was not covered and points to fix round 1; fix round 1 states the live harness was not re-run (true of the builder; this round did).
6. **differs-for-recorded-reason** (left intentionally) round 1 finding 6: `src/api/**` is fenced but the ticket Scope is `src/api/`; `src/app/_layout.tsx` still builds its own QueryClient, queued as SHARED-CHANGES row 1. Unchanged and still correct.
7. **closed** G-6 wording is now accurate: "30 days in the example env, `REFRESH_EXPIRES_IN=30d`; the production value is for the owner to confirm". G-5 unchanged and still accurate. The round 1 Verifier report above is intact (unedited).

Status set to `building` because of finding 1. Fix loop round 2 of 2.

## Builder report (fix round 2)

Fixes Verifier round 2 finding 1 only (3, 4, 6 stay owner decisions). Files: `src/api/session.ts`, `src/__tests__/session.test.ts`, this file.
- Memory and status now change synchronously: `adopt` sets tokens and `signedIn` at once, `drop` sets null and `signedOut` at once. Nothing touches memory or status after an await, so no late write can bring a signed-out user back in.
- All store reads, writes and clears run through one promise chain (`inStoreOrder`) in call order, so the last call wins in the vault and a late clear can no longer delete a newer sign-in's pair. A failed step does not block the next.
- Three new jest tests with a slow `setItemAsync`/`deleteItemAsync` mock: sign out during a token save, sign in A then out then in B (B survives), sign out during a slow sign in. Each checks vault, status and a fresh boot. With only the fix reverted (adopt/drop as before, no chain) all 3 failed; restored byte-for-byte (sha1 8ae784d4...f12f73b6 equal before and after), all pass.
- `npm run check` exit 0. Before: jest 29 tests / 4 suites. After: 32 tests / 4 suites; gates 9 run, 23 files, 0 fail/warn/accepted; 187 tasks.
- Not done: real phone secure store and live wawu-id re-run (NOT RUN); a `signOut()` during the login request itself still lets that sign-in complete (it is a newer explicit action).

## Verifier report (round 3)

Verifier session (round 3, a different session from the builder and from rounds 1 and 2), 2 Oct 2026, uncommitted working tree of `wmt/SHELL-02`. I fixed nothing. Evidence under `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. `npm run check` exit 0 on my own run: tsc and expo lint clean, jest 32 tests / 4 suites passed, gates 9 run / 23 files scanned / 0 fail 0 warn 0 accepted, 187 tasks. Matches the builder's round 2 numbers | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/check.txt` |
| Diff vs reports | passed. Changed: BACKEND_GAPS.md, SHARED-CHANGES.md, docs/LOG.md, docs/PROGRESS.md, src/api/client.ts, tasks/SHELL-02.md; new: src/api/{env,errors,identity,query,session,tokenStore}.ts, src/__tests__/session.test.ts. Equals the builder's list. Round 2 changed only session.ts and session.test.ts (3 new tests); no existing test, gate, script or baseline edited | git status |
| V9 Live, round 2 finding 1 (slow store) | passed. Real `/auth/login`, real wawu-id (`JWT_EXPIRES_IN=5s` as a process variable, `.env` still 15m) and Hub, own local DBs, no injected token, store mock with 300 to 700 ms write and delete delay. S1 sign out while the refresh result is being saved (first write began, then `signOut`): vault 0 and status signedOut right after, still 0 and signedOut 1.5 s later, token null, fresh boot signed out; store op order write, write, delete, delete. S2 sign in A, out, in B (creator-pro) with 300 ms writes and deletes, also overlapping un-awaited (S2b): vault 2, memory and fresh boot are B. S3 sign out during a slow sign-in write: vault 0, signedOut, fresh boot signedOut. S6 sign out during a slow cold-start read: signedOut, vault 0 | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/live.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/zz_r3_live.test.ts` (harness saved), `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/live_raw.txt` |
| V9 re-runs of earlier checks | passed. Sign in then `users/me` returns the server's Adaeze Okonkwo, restart with 0 logins and the stored token, wrong password `unauthorized` 401 with nothing stored. 3 parallel 401s: 3 hub 401s, exactly 1 `/auth/refresh`, 3 retries all 200, both tokens rotated. Sign out: vault 0, next request has no authorization header (Hub 401), 0 refresh calls, restart signed out. Sign out mid-refresh: vault 0 and signed out after the stale refresh resolved, restart signed out. Sign in as creator-pro mid-refresh: still creator-pro after the stale refresh, fresh boot creator-pro. Refresh answered 429 / 500 / 503 / network: tokens kept (vault 2), then recovers. Refresh answered 401 / 403 / 400 / 422, and the real wawu-id refusing a spent refresh token: signed out, vault 0 | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/live.txt` (A, B, C, D, E, F, R2) |
| Jest fails without the fix | passed. Removing only the store chain (steps run at once): 3 fail (the 3 new tests). Reverting only the synchronous state (set memory and status after the write): 0 fail (see finding 6). Both reverted: 3 fail. `session.ts` restored byte for byte (sha1 8ae784d4...f12f73b6 before and after) | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/mutation.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-02-r3/session.sha` |
| Unhandled rejections | none seen in the whole live run (a process handler logged an empty list) | live.txt last line |

NOT RUN:
- Secure store on a real phone (Keychain / Keystore), sign-in from a screen and a UI screenshot: unchanged (needs the SHELL-03 tester build; no sign-in screen until AUTH-*). The store here is an in-memory mock with injected delays and failures.
- Web localStorage path: only the native branch ran.
- `scripts/local/up.sh`: the stack was started from the built `dist` of WAWU-ID and wawu-backend-main with their existing `.env` files. Postgres 16 was already running and was left running; both Node services were stopped.
- 429, 500, 503 and 401/403/400/422 refresh answers were injected at the fetch shim (the real wawu-id has no throttler); the 401 refusal of a spent token and the network case were real.
- Hook status was read through a react-test-renderer probe of `useSession` after an act flush; the temporary live test was deleted from the repo after the run.

Findings:

1. **closed** Round 2 finding 1 (late store write brings a signed-out user back, or a late clear deletes a newer sign-in). Fixed: S1, S2, S2b, S3, S6 all end with the vault, memory, status and a fresh boot agreeing on the last action.
2. **unclear** (builder says it is intended; my judgement: acceptable, minor) `signOut()` during the login request itself: the sign-in still completes and the user ends signed in (S4: after `signOut` status signedOut, then when the login answers status signedIn, vault 2, `signIn` resolves). Generation is bumped only when the login response arrives, so a sign out called while the request is in flight is overtaken by a request that was started earlier. For a signed-out user the sign out is a no-op, so this only matters when signed in as X, starting a sign in as Y and tapping Sign out before Y answers; the user then ends signed in as Y. Not a vault inconsistency and not reproducible from any screen yet (AUTH-* will own sign-in and can disable Sign out while a sign-in is pending, or the owner can have `signIn` ignore a result if `signOut` was called after it started). Owner call.
3. **unclear** (same class as round 1 finding 4, an owner decision; not counted as a defect) A failing secure store is surfaced as a raw `Error`, not an `ApiError`, and memory and vault can part: a failed save in `signIn` rejects with `Error: keystore write failed` while memory is signedIn (vault 0, so the next launch is signed out); a failed clear in `signOut` rejects while memory is signedOut and the vault keeps the tokens (next launch signs back in); a failed save of a refresh result rejects the original request with a raw `Error` (kind undefined) although memory holds the new tokens and the next request works (S5). None blocks later operations: the chain continues after a failed step and the next sign in and sign out worked. Ordering alone cannot make them diverge; only a store failure can.
4. **unclear** (minor) A request that was waiting for a refresh keeps going when the user signs out while the refreshed tokens are being saved: S1's request returned 200 with the new token after `signOut()`. Memory and vault are empty, so later calls carry no auth, but that one in-flight request was retried with a token after the sign out. The server has no revoke route (G-6), so the token stays valid until it expires anyway.
5. **unclear** (theoretical, no defect) The store chain has no timeout: one store call that never settles (a locked keystore) would hold every later store step, so `signOut()` would never resolve although memory and status were already cleared at once. No deadlock exists in the code itself: no step calls `inStoreOrder` from inside another, and the chain only ever holds a promise that cannot reject (`run.catch`), so a rejected step cannot block a later one (verified: S5 fails a write then a clear, and the next operation of each kind worked).
6. **unclear** (test quality, minor) The synchronous memory and status update is not pinned by any test: reverting it with the chain kept leaves all 32 tests passing, because the chain alone keeps the vault, memory and final status right; what the sync update adds is that the hook flips at once instead of after the clear. Also the describe title reads "while the store is mockSlow" (a find and replace slip), cosmetic. No gate or test was weakened.
7. **differs-for-recorded-reason / owner decision, unchanged** Round 1 finding 3 (wawu-id rotates the refresh token with no grace window, a lost refresh response leaves a dead token), round 1 finding 4 (store edge cases, see finding 3 above for the current behaviour) and round 1 finding 6 (`src/api/**` is fenced but the ticket's Scope is `src/api/`; `src/app/_layout.tsx` still builds its own QueryClient, SHARED-CHANGES row 1) are left intentionally and are not counted as open defects. Round 1 findings 2, 5 and 7 stay closed.

Adversarial review, no further finding: `adopt` and `drop` change `tokens` and status in the same tick as the call, before any await; the only code after an await in `session.ts` is the retry value and the `finally` slot clear, which carry the ownership check. `restoreSession` runs its read through the chain and discards the result when a sign in or out already changed the status (S6). No empty `catch` hides an error that matters (`loadTokens` returning null on a throwing read is the documented fail-safe, round 1 finding 4). No em-dashes, literal tokens or console calls were added.

No open defect. Status set to `review`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
