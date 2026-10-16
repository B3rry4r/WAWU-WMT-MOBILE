# INBOX-21 · round history

Moved out of [tasks/INBOX-21.md](../INBOX-21.md) word for word, oldest first. The current state is in that file.

## Builder report

**Builder (Sonnet agent; mobile `wmt/INBOX-21`, merged with main `3117807`).** Mobile only: INBOX-03's routes and the generated types were already on main.

**Files.** New `src/features/push/`: `routes.ts` (tap map), `registration.ts` (channel, permission, token, register, remove, foreground handler), `api.ts` (the two Hub calls), `storage.ts` (token and "asked" flag in the secure store), `PushBridge.tsx` (no screen), tests `routes`, `PushBridge`, `pushFlow`. Edited: `src/features/settings/signOutFlow.ts` (removal beside the WAWU ID logout, one 3 s wait), `src/app/_layout.tsx` and `app.json` (SHARED-CHANGES INBOX-21 #1, #2, applied here, as AUTH-04 #2 did), `SHARED-CHANGES.md`.

**Checks.**
1. Push within a minute of a new follower on an Android phone: NOT RUN (V10, needs a real phone, the owner's FCM key in Expo, `PUSH_ENABLED=true` on the Hub). What is proven: the phone half. Permission, token and registration against the real local Hub (stack `inbox_21`, curl with the exact bodies the app sends): register 200, again 200 (idempotent), bad token 400, signed out 401. A `new_follower` push has no screen yet, so its tap opens the app where it is.
2. Sign-out gets no more pushes: `DELETE /push-tokens` is sent while the session still works (jest, with the real session, API client and sign-out against a fake Hub that answers like INBOX-03's; and on the real Hub: own phone removed 200 `removed: true`, someone else's or a repeat 200 `removed: false`). A registration still on its way is waited for first. Offline or refused removal still signs out; the phone then keeps its registration until another person signs in on it or Expo reports it dead (BACKEND_GAPS G-268 b).
3. A tap lands on its screen: room (`/community/[id]`), Wallet, Inbox; cold start and while running; held until the route graph is ready and the sign-up steps are done; a tap while signed out is dropped; `actionHref` (a web path) is never followed; ids must be path-safe. `routes.test.ts` also checks the three route files exist.
4. Refusal: nothing registered, nothing thrown, never asked again (flag `wmt.push.asked`), registered on a later start if the person switches it on in the phone's settings; sign-out then has nothing to remove.

**Tests.** `src/features/push/__tests__`: 40 tests (routes 8, bridge 9, flow 23). With `src/features/settings` (7 suites, 161 tests) green. The root layout suites `auth-guard`, `session-cache`, `shell` pass unedited. Full local check at 2 workers, merged with main `3117807`: typecheck 0, lint 0 errors (5 warnings, all in other tasks' files), jest 157 of 158 suites and 2871 of 2872 tests, gates 0 fail and 5 warn (none in this task), tasks check passes. The one jest failure is WALLET-04's W26 search test (`historyScreens`, a 1 s wait on a typing pause) timing out under load; run alone it passes, 38 of 38.

**Decisions (agent), owner may override.** (a) One ask, once per phone, when the tabs first become reachable; no pre-ask screen (none is drawn, R-47). (b) Tap map by `kind` and `target` only; money kinds open the Wallet, paid-question kinds open the Inbox (their own screens are INBOX-18 and WALLET). (c) Foreground pushes show as a banner, sound only when Z2 "Sound" is on, no badge (INBOX-03: no badge counts). (d) Android channel `default` ("WAWU", high importance) is made before the ask; its sound is the Z2 Sound value on the first start, because Android fixes a channel's sound when it is made.

**Not done, and why.** Changing Z2 "Sound" later does not change a background push's sound on Android (the channel is fixed). Making it live needs the Hub to send a channel name per push (two channels), a backend change this task does not name; question for the owner. `new_follower`, content kinds and the paid question's own screen have no target screen yet (rows listed in Current state). No new picture: the task draws no screen (artboards are empty) and the browser build skips push.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report, round 2

Mobile `wmt/INBOX-21`, continued from a0bf293 (main 3117807, nothing to merge). Mobile only.
- **High, fixed.** Before: `signOutFlow.ts` sent the WAWU ID logout and `forgetPush()` together, the logout ended the refresh token, and a removal needing a refresh got 401, so the Hub kept the phone. After: `forgetPush` first, then the logout, inside the one 3 s wait; the API client's own 401 refresh runs while the refresh token is still alive. The logout names the refresh token the session holds at that moment (a refresh hands out a new one). If the removal has not finished at 3 s the phone signs out and the logout is still sent, once.
- **Test first.** New `src/features/push/__tests__/signOutPush.test.ts`: a fake Hub that expires access tokens and a fake WAWU ID that rotates and ends refresh tokens (the verifier's ATTACK 1, 4 and 5 and their controls). Red on a0bf293's code: 6 of 7 failed (log `inbox-21-b/logs/red-final.log`); green after: 7 of 7. The verifier's own attack files also pass (8 of 8).
- **Low 2, fixed.** `forgetPush(waitMs)` waits for an in-flight registration at most `SERVER_WAIT_MS`, then cancels it: it sends nothing it has not sent, and if its POST lands after the sign-out it removes the phone again with the access token it was started with. A run started in an ended session is never shared with the next person (`syncPush` starts a new one), and if a late landing finds another person signed in, the phone is registered to them again. A removal that outlives the sign-out never uses the next person's session.
- **Low 3, fixed.** `routes.ts` no longer lists `community_join_declined` (the Hub's push names no target); `routes.test.ts` uses the data the Hub sends for approved and declined; Current state corrected.
- **Low 4, fixed.** SHARED-CHANGES INBOX-21 #1 now lists what `_layout.tsx` gains: one import, three comment lines, one constant, one element.
- **Sweep, no code.** A forced session end leaves the phone registered (Hub fix) in `SWEEP-INBOX`; the web export's expo-notifications warning in `SWEEP-APP`.
- **Not changed:** a removal that cannot be sent in 3 s, or sent with no connection, still leaves the phone registered (G-268, as before).
- **Checks.** `(npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks; echo "EXIT $?")`: EXIT 0 (159 suites, 2880 tests; gates 0 fail; tasks 283). `check_tasks.py --write` run.
- **NOT RUN:** V10 (a real phone).

