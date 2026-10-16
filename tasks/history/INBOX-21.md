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

**Tests.** `src/features/push/__tests__`: 40 tests (routes 8, bridge 9, flow 23). With `src/features/settings` (7 suites, 161 tests) green. The root layout suites `auth-guard`, `session-cache`, `shell` pass unedited. Full local check: see the hand-back (EXIT line).

**Decisions (agent), owner may override.** (a) One ask, once per phone, when the tabs first become reachable; no pre-ask screen (none is drawn, R-47). (b) Tap map by `kind` and `target` only; money kinds open the Wallet, paid-question kinds open the Inbox (their own screens are INBOX-18 and WALLET). (c) Foreground pushes show as a banner, sound only when Z2 "Sound" is on, no badge (INBOX-03: no badge counts). (d) Android channel `default` ("WAWU", high importance) is made before the ask; its sound is the Z2 Sound value on the first start, because Android fixes a channel's sound when it is made.

**Not done, and why.** Changing Z2 "Sound" later does not change a background push's sound on Android (the channel is fixed). Making it live needs the Hub to send a channel name per push (two channels), a backend change this task does not name; question for the owner. `new_follower`, content kinds and the paid question's own screen have no target screen yet (rows listed in Current state). No new picture: the task draws no screen (artboards are empty) and the browser build skips push.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

