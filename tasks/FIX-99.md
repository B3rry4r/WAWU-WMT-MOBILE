---
id: FIX-99
title: The server findings of the pre-build re-walk (refresh token as a session, host not counted, ten-digit phone, Flix genres)
owner: YOU
area: OPS
order: -99
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: []
passes: [V1, V3]
artboards: []
tier: T2
---
# FIX-99 · The server findings of the pre-build re-walk

## Current state

As of 23 Oct 2026, verifying (Sonnet builder, T2). Backend `wmt/FIX-99` `8d6d702` (items 1, 3, 6; `c2f8282` for 1 and 3) on `origin/main` `dd00e85`; WAWU ID `wmt/FIX-99` `3cd7256` on `origin/main` `9596928`; this record on mobile `wmt/FIX-99` from `origin/main` `89669d9f`. Source: `flow-audit-2/REPORT.md` H1, H3, U2, L2, L5, and the lead's item 6 (G-FIX-100-1, FLIX-02 L1).

| Item | Before | After | Spec (fails on main, passes built) |
|---|---|---|---|
| 1 H3 refresh token | GET /users/me, /money/wallet, /chats answered 200 to a WAWU ID refresh token | 401, the same body as a bad token; an access token (no `type`, or `type: 'access'`) still 200; the live socket refuses it too | `src/common/auth/tests/wawu-jwt-token-kind.contract.spec.ts` (6 of 11 fail on main), `src/live/tests/live-token-kind.spec.ts` (2 of 4 fail on main) |
| 2 U2 name preview | any signed-in account makes a real voice generation | NOT CHANGED: stopped, see below | none |
| 3 L5 host count | a new room reads 0 members to its host | the app's room routes count the host once; the web's protected routes keep their count | `src/community/tests/community-host-member.contract.spec.ts` (4 of 6 fail on main); 7 assertions that pinned "host is not a member" updated |
| 4 L2 phone | 8031234567 refused | accepted as +2348031234567; everything accepted before is unchanged | WAWU ID `src/common/phone.util.spec.ts` (6 of 31 fail on main) |
| 5 H1 legal assistant | never answered on gemini-3.7-flash | check only: with `GEMINI_MODEL=gemini-3.5-flash` two real turns answered through the Hub in 5.0 s and 3.8 s, inside the Hub's 20 s | none (no code) |
| 6 Flix genres | "Drama \| Music \| Thriller" is one genre, the Music chip misses the title | split on the pipe, trimmed, de-duplicated in the adapter's mapping; the list stays a list of strings | `src/flixora/tests/flixora-genres.spec.ts` (3 of 5 fail on main) |

- **U2, stopped (item 2).** The route has one app caller: `previewName` in `src/features/verify/voiceApi.ts`, used by `HearNameScreen.tsx` (VF3). VF3 is opened from the shop's "Hear your name" row (`ShopScreen.tsx`, drawn once there is a draft; "Drafts are free, so nothing here asks for a tier") and from `/hear-name` (creator accounts only, no tier check), and it plays the name as it opens. So the app calls the route before a tier is bought. A tier check on the Hub would make that screen fail for every creator without a tier. Needs the lead's ruling: either the app gates VF3 behind the tier first, or the route stays open and its hourly limit (`429 voice_preview_limit`) is the guard.
- **H3, what else was checked.** WAWU ID's access token has no `type`; its refresh token is `{ sub, jti, type: 'refresh' }` and is the only other token it signs. Admin and dashboard tokens go through `AdminAuthGuard` (HS256, a local secret) and never reach this strategy. Service calls use `X-Service-Key`. The web sends its session access token. `npm run test:protected` passes against the base lock (253 tests).
- **L5, what is left.** `GET /communities`, `GET /communities/:id` (web, protected) and the communities rows of `GET /search` still count members other than the host, so a host's room can read one fewer there. Recorded as G-FIX-99-1; not changed.
- **Checks (EXIT 0 each):** backend `tsc --noEmit`; eslint (no fix) on the changed files; the touched specs in band (auth 11, live 4, community host 6, rooms and discover 58, flixora and movies 78 with the seam spec); `test:protected` 2 suites 253 tests; `contract:build` no diff; gates (0 fail, 133 warn, 88 accepted); `check_baseline` 124 entries. WAWU ID `tsc --noEmit`; eslint and prettier on the two changed files; 9 suites 219 tests. Mobile `check_tasks` and gates below.
- **Next:** the verifier checks the table; the lead rules U2 and merges. Backend CI on `wmt/FIX-99` runs the full suite.

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
