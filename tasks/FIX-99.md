---
id: FIX-99
title: The server findings of the pre-build re-walk (refresh token as a session, host not counted, ten-digit phone, Flix genres)
owner: YOU
area: OPS
order: -99
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: []
passes: [V1, V3]
artboards: []
tier: T2
---
# FIX-99 · The server findings of the pre-build re-walk

## Current state

As of 23 Oct 2026, PASS (verifier re-check, Sonnet, T2): status review. Backend `wmt/FIX-99` `4bcacc3` (on `8d6d702`) and WAWU ID `wmt/FIX-99` `3cd7256` are ready to merge; the high finding of the first check is fixed and the strategy reflow is undone. U2 stays unchanged by the lead's ruling. Next: the lead merges; backend CI on `wmt/FIX-99` runs the full suite.

## Goal

The Hub takes only an access token as a session, a room counts its host, a ten-digit Nigerian number signs up, and Flix genres are single words.

## Scope

`wawu-backend`: `src/common/auth/wawu-jwt.strategy.ts` (fenced; SHARED-CHANGES FIX-99 #1), `src/live/live-token.verifier.ts`, `src/community/community.service.ts`, `src/community/rooms/community-rooms.service.ts`, `src/flixora/flixora-mapping.ts`, the specs named in the table. `wawu-id`: `src/common/phone.util.ts` and its spec. `wawu-wmt-mobile`: this file, SHARED-CHANGES, BACKEND_GAPS, INDEX, PROGRESS, LOG.

## Capability checks

- [x] A refresh token is refused on GET /users/me, /money/wallet and /chats and on the live socket; an access token passes (fails on main).
- [x] Every other token kind the Hub takes still works (admin and dashboard tokens, the protected suite).
- [ ] U2: not built, waiting for the ruling above.
- [x] A new room reads 1 member to its host and 2 after one fan joins; the web's route still reads 0 and 1.
- [x] 8031234567 is +2348031234567 at sign-up; `0803...` and `+234...` unchanged.
- [x] Two real legal assistant turns answered within 20 s on `gemini-3.5-flash` (the Hub's default model is still `gemini-3.7-flash`: the lead moves it).
- [x] A title served as "Drama | Music | Thriller" is listed under Drama, Music and Thriller.

## Builder report

- **H1 timings.** Hub built from this branch, run locally on port 7871 (mock WAWU ID on 7870), network limited to this machine and `generativelanguage.googleapis.com`, `GEMINI_MODEL=gemini-3.5-flash`. `POST /legal/assistant` 201 in 0.05 s. Turn 1 (`POST /legal/assistant/:id/messages`) 201 in 5.04 s with a reply; turn 2 201 in 3.76 s with a reply; no Gemini error in the Hub log. 2 Gemini calls in all.
- **Also found.** `LiveTokenVerifier` (the live socket) had the same hole and is fixed with the strategy (its own comment says it follows the strategy's rules). The one fenced file changed is the strategy, as the lead ruled.

## Verifier report

Verifier: Sonnet, T2, 23 Oct 2026. Built none of it. Backend `origin/wmt/FIX-99` `8d6d702` against `origin/main` `dd00e85`; WAWU ID `3cd7256` against `9596928`. Real WAWU ID + Hub on a local stack (`stack.sh --with id`, ports 7870-7877, Nuvion stand-in only), databases `fix99v_*_test`, all dropped after.

**Verdict: FIX** (1 high, 0 medium, 3 low).

| Check | Result | Evidence |
|---|---|---|
| H3 refresh token refused | passed | Tokens minted by the real WAWU ID login. Refresh token `{sub,jti,type:'refresh'}` gets 401 `{"statusCode":401,"message":"Unauthorized","data":null}` on `/users/me`, `/money/wallet`, `/chats`, byte-equal to a garbage token's 401; the real access token gets 200 on all three. Socket: refresh token closed 4401 `invalid_token`, access token gets `ready`. Hand-signed with the stack's throwaway key: no `type` 200, `type:'access'` 200 and socket `ready`; `refresh`, `service`, `null`, `''` all 401 (socket 4401 for `service`). |
| H3 other callers | passed | Web (`wawuafrica` `client.ts`) sends `sessionStorage.getToken()` (the access token); mobile `getAccessToken()` for REST and for the live socket frame; admin dashboard goes through `AdminAuthGuard` (HS256, never the strategy); `X-Service-Key` calls are outbound from the Hub; webhooks use signatures; WAWU ID signs only two token kinds (access: no `type`; refresh: `type:'refresh'`). The 12 optional-auth routes (search) treat a refresh token as nobody (200 anonymous), as for any invalid token. |
| test:protected | passed as main | 245 of 253 on the branch and 8 failed on `origin/main` the same way (same 8 names: verification and professionals writes answer 502 from my stack's mock WAWU ID). Branch equals main; the builder's own run was 253 of 253. I could not get 253 locally; not a branch difference. Registry unchanged by the diff. |
| L5 host counted once | passed | Code read: `countHost` false takes the same query as main for GET /communities, GET /communities/:id, POST/PATCH /communities; true counts joined non-host rows plus one, so a host with or without a membership row counts once. Community suites in band: `community.contract` 61 of 62 on both branch and main (the one failure, a sender name read as "", is the same on main: my stack's mock key). Seven changed assertions judged: all pin the defect (host not a member), none a rule; the "same counts as GET /communities/:id" one is now "plus one", a deliberate app/web difference (G-FIX-99-1). |
| L2 phone | passed | 15,828-input differential, old against new `normalisePhone`: 0 previously accepted inputs changed, 0 newly refused; the 210 newly accepted are all, after stripping, exactly `^[789]\d{9}$`, each mapping to `+234` plus the digits. Live sign-up on the real WAWU ID: `8031234567`, `08031234568`, `+2348031234569` all pass phone validation; `6031234570`, `803123456` answer PHONE_INVALID. |
| Genres | passed | `genresOf` splits on `|`, trims, de-duplicates, drops non-strings; the type stays `string[]`; `contract:build` EXIT 0 with no diff. The filter is `genre has <one entry>` on the stored list and the sync upsert rewrites `genre` (`update: data`), so a title is found under each split genre after its next sync. |
| New specs fail on main | passed | Copied untracked onto main, run, removed: 16 of 26 tests fail on main (auth 5 of 11, live 2 of 4, host 4 of 6, genres 5 of 5), all pass built. |
| Static and suites | passed | Backend `tsc --noEmit` EXIT 0; eslint (no fix) on the 11 changed files EXIT 0; 19 specs in band (auth, live, community, flixora, movies, admin auth; the 3 naming Fintava skipped): 278 passed, 9 failed, of which 8 are seed/env only (passed after `db:seed`, or fail the same on main) and 1 is finding 1. Gates 0 fail, 133 warn, 88 accepted, `check_baseline` 124 entries, both EXIT 0. WAWU ID `tsc` EXIT 0; eslint and prettier on the two files EXIT 0; `src/common` and `src/auth` 35 suites, 630 passed, 20 skipped; the new phone spec fails 6 of 31 on main's `phone.util.ts`. |

Findings:
1. **high, defect.** `src/admin/auth/tests/admin-auth.contract.spec.ts:451`: the test "documents the protected-surface defect it relies on: that same WAWU ID REFRESH token still satisfies USER auth" expects 403 and gets `401 Unauthorized`. It is a tripwire that says "if someone ever does fix it, they are told"; H3 is that fix. The builder did not run the admin auth spec, so the full backend suite fails in CI on this branch. Repro: `npx jest --runInBand src/admin/auth/tests/admin-auth.contract.spec.ts` against a seeded DB and the contract mock. Fix: per the sweep rule, change that assertion to 401 and reword its comment (the hole is closed), say so in the row.
2. **low.** `src/common/auth/wawu-jwt.strategy.ts:35-37`: a prettier reflow of the `jwksUri` lines in a fenced file, outside what SHARED-CHANGES FIX-99 #1 describes (`validate` and `isAccessToken`). No behaviour change.
3. **low.** `src/flixora/tests/flixora-genres.spec.ts` tests the mapping only; nothing runs the `GET /movies?genre=Music` filter against a compound title. Test that would close it: seed a title through `movieOf` and assert the list route finds it by "Music".
4. **low, recorded.** GET /search's community rows (and search history) still count members other than the host (G-FIX-99-1), so one room can read one fewer in search than in its room view.

Not findings: U2 is untouched (no voice file in the diff) as ruled; `GEMINI_MODEL` stays a server setting; a ten-digit number starting 7, 8 or 9 typed with no `+` (for example a foreign one) now reads as Nigerian, which is what L2 asks for.

### Re-check of the fix round (backend `4bcacc3`, mobile `8696160e`)

**Verdict: PASS** (no findings; the first check's high and low 2 and 3 are closed, low 4 stays the recorded G-FIX-99-1).

| Check | Result | Evidence |
|---|---|---|
| Admin auth spec | passed | `git diff 8d6d702 4bcacc3` on the spec is 7 lines in one test: `it('refuses that same WAWU ID REFRESH token on USER auth too (FIX-99, H3: the hole is closed)')` now expects 401 and its comment says the hole is closed; no other test in the spec changed. Copied onto `origin/main` it fails (the refresh token is not refused there); on the branch the whole spec passes. |
| Strategy diff | passed | Against `origin/main` the fenced file differs only by the `UnauthorizedException` import, `isAccessToken` and the `validate` check; the `jwksUri` lines are as on main. This matches SHARED-CHANGES FIX-99 #1 (unchanged by the round). eslint counts equal main's: strategy 1 error 0 warnings, admin auth spec 70 errors 1 warning on both (all existing prettier and no-unsafe findings). |
| Genre filter | passed | `flixora-genre-filter.contract.spec.ts` runs the real Flixora adapter on a stand-in fetch, the sync into the test database, and the real `MoviesController`: "Drama \| Music \| Thriller" is stored as Drama, Music, Thriller; `GET /movies/browse?genre=Music` (and Drama, Thriller) lists it; `/movies/filters` lists single genres. On main 5 of 5 tests fail. |
| Runs | passed | Backend `tsc --noEmit` EXIT 0. Specs in band (admin auth, token-kind, live x4, movies x2, flixora x3): 11 suites, 163 passed, 1 skipped (existing), EXIT 0. Gates 0 fail, 133 warn, 88 accepted, `check_baseline` EXIT 0. Mobile gates EXIT 0 (0 fail, 18 warn) and `check_tasks` EXIT 0. |

