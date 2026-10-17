# INBOX-21 verifier report (mobile wmt/INBOX-21 a0bf293, compared with main 3117807 and backend main 18ac5f9)

Verdict: FIX (one high finding, the rest low). V10 (a real phone push) NOT RUN, as the brief says.

## Passes
| Pass | Result | Evidence |
|---|---|---|
| V1 flows | passed except finding 1 | attack tests (inbox-21-v/attacks), logs in inbox-21-v/logs |
| V6 | passed | typecheck EXIT 0 (logs/tsc.log), eslint on the 8 changed/new source files EXIT 0 (logs/eslint.log) |
| V7 | passed | push suites 3 of 3, 40 tests (logs/push-suites.log); root layout suites auth-guard, session-cache, shell 3 of 3, 32 tests, unedited (logs/layout-suites.log); settings sessionEnd 12 of 12 on rerun (logs/sessionend-rerun.log; the builder's one red run was load timing) |
| V9 | passed | web export (own Metro cache, only localhost:7170/7171 in the bundle) serves the sign-in start screen at 390 px light and dark, no overflow, no page error, nothing drawn for push (R-47); logs/export.log, signedout-light.png, signedout-dark.png |
| V10 | NOT RUN | needs a phone, the owner's FCM key in Expo and PUSH_ENABLED=true |

## Claims tested (builder's report as a list of claims)
- Fenced files: app.json differs from main only by `"defaultChannel": "default"` (matches row #2; the plugin accepts it, expo-notifications 57.0.22). `_layout.tsx` differs by one import, a comment, one const (`inApp`, the same expression the row prints) and `<PushBridge live={inApp} />` after the Stack (matches row #1). package.json, src/api untouched.
- Permission asked once per phone (flag `wmt.push.asked`), refusal registers nothing, throws nothing, never re-asks: held (pushFlow tests; refusal then later switched on in phone settings registers).
- Register on start and after 30 minutes away: held (bridge attack tests: start yes, short trip no, 40 minutes yes). Note: the 30 minutes count from the last registration, not from time spent away, so a 1 second trip after 40 minutes of use sends one more (idempotent) POST. Harmless.
- Every pushed kind (the Hub's 11 `send` kinds in push-policy.ts) with the data the Hub really builds: tap opens room / Wallet / Inbox / stays where it is; `actionHref` never followed (web path, full URL, app scheme, with or without a mapped kind); hostile ids never reach a path; a tap delivered twice opens once; a cold-start tap is held for session restore and the email step; a tap while signed out is dropped and not replayed to the next person. All held.
- Foreground banner sound follows Z2: held (handler reads Z2 Sound each time; off by default).
- Sign-out inside the 3 s wait: held when the Hub or the WAWU ID or both never answer (2.9 to 3.6 s, then signed out, store cleared) and with no connection at all (32 ms).

## Findings
1. HIGH. Sign-out leaves the phone registered when the access token has run out (15 minutes, wawu-id JWT_EXPIRES_IN). `src/features/settings/signOutFlow.ts` line 36 to 40 sends the WAWU ID logout and `forgetPush()` at the same time. The logout revokes the refresh token. `DELETE /push-tokens` then gets 401 from the Hub, the client refreshes, the refresh is refused, the removal fails, and the Hub keeps the phone: the signed-out phone keeps showing that person's sale, tip, refund and paid-question pushes on its lock screen. That fails the task's capability check "a user who signs out gets no more pushes on that phone", and the builder's claim 2 holds only while the token is fresh. The builder's tests use a fake Hub that never expires a token or revokes a refresh, so they miss it.
   Repro: `npx jest src/features/push/__tests__/zzVerifyFlow -t "ATTACK 1"` (copy in inbox-21-v/attacks). Call order seen: POST push-tokens, POST /auth/logout, DELETE push-tokens (401), POST /auth/refresh (refused); holder left: 1. Control with a live token passes. Fix direction: finish (or give up on) the removal before the logout is sent, inside the same 3 s wait.
2. LOW. `forgetPush()` waits for a registration still in flight with no bound (`registration.ts` line 87). (a) A registration that takes more than 3 s (slow radio) and lands after the sign-out leaves the phone registered to the signed-out person: ATTACK 5, holder 1 after sign-out, the removal had no session. (b) A registration that never settles (token fetch hangs) leaves the module's `inFlight` set, so every later `syncPush` shares it and the next person on that phone is not registered until the app restarts: ATTACK 4 (outcome STUCK). Rare (needs a hang or a very slow network at the moment of sign-out). Repro: zzVerifyFlow2 ATTACK 5, zzVerifyFlow ATTACK 4.
3. LOW. Claim does not match real data. Current state says a tap opens the room for join approved and declined. The Hub's `community_join_declined` push carries no target and no actionHref (backend `community.service.ts` line 587 to 591), so the declined tap opens the app where it is. Reasonable (a declined person has no room to open), but the line and `routes.test.ts` (which gives declined a target the Hub never sends) should say approved only.
4. LOW. Only the explicit Sign out removes the phone. A forced end (refresh refused, a live-feed close 4403) leaves it registered. Matches the capability text; noted for the sweep list.
5. LOW (not the builder's). The web export logs one console warning from expo-notifications at load ("Listening to push token changes is not yet fully supported on web"). The web build draws and works.
6. LOW. SHARED-CHANGES row #1 says "one import and one element"; the file also has a const and doc-comment lines. Same behaviour as the row.

Nothing is pre-existing on main in these findings (main has no push code).

## Cleanup
No stack was started (stack.sh never run, nothing listening on 7170 to 7177). The static server on 7172 was stopped by PID. Worktrees v-inbox-21-m and v-inbox-21-be removed. Attack tests kept at inbox-21-v/attacks (not in the branch).
