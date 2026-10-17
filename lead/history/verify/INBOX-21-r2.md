# INBOX-21 verifier report, round 2 (mobile wmt/INBOX-21 459ca61; no backend change)

Verdict: MERGE (nothing medium or worse). Two lows go to the sweep.

## Round 1 attacks re-run against a Hub that expires access tokens and a WAWU ID that rotates (single use) refresh tokens
Attack file: inbox-21-v2/attacks/zzV2.test.ts (my own world, not the builder's). Logs: inbox-21-v2/logs/v2.log, v2b.log, suites.log.
| Attack | Result |
|---|---|
| A1 sign-out after the access token ran out (15 min) | PASS. Order: DELETE (401), refresh, DELETE (200), logout naming the ROTATED refresh token. Hub holder empty, no live refresh token left, vault cleared. Round 1 ATTACK 1 file also green. |
| A1b access and refresh both dead | signs out, cannot remove (known, forced end); next person registered (holder moves to B). |
| A4 registration never settles | PASS. Sign-out 3001 ms, B registered at once (holder B). |
| A5 registration POST lands 4 s after sign-out | PASS (late removal with the owner's token; holder empty). |
| A6 no connection | PASS. Sign-out 1 ms, signed out, vault cleared. Phone stays registered to A at the Hub (G-268 b, documented 7 Oct); B signs in later and the token moves to B. |
| A7a refresh already in flight (1.2 s) from another request | PASS. The removal shares that refresh; logout names the new refresh token; nothing dangling. |
| A7b refresh slower than the 3 s wait | signs out at 3011 ms; logout names the old refresh token; the removal is lost (slow network class, G-268). |
| A8 B signs in right after A, then B signs out | PASS, holder empty. |
| A10 refresh mid-flight from the registration, Sign out at 100 ms | PASS. |
| A11 WAWU ID errors during the refresh | signs out in 66 ms, nothing thrown. |
Round 1's three attack files (zzVerifyFlow, zzVerifyFlow2, zzVerifyBridge) run unedited on 459ca61: all green.

## Findings (both LOW)
1. LOW. The next person's registration can be forgotten. `registration.ts` forgetPush line 164 `await forgetToken()` runs when A's removal finally returns, even after A's sign-out went on at 3 s. If B signed in and registered in between, `rememberToken` is wiped, so B's own sign-out sends no DELETE and the phone stays registered to B. Needs A's removal to hang past B's registration. Repro: `npx jest src/features/push/__tests__/zzV2 -t A9` (copy the file into the worktree): holder after B sign-out still B, calls tail shows no DELETE. Fix direction: clear the stored token only if it is still the one this sign-out removed, or before the first await.
2. LOW. The late removal uses a stale bearer. `takeOffLate` (line 62) uses `run.owner`, the access token the run STARTED with (often expired after 15 min away). A registration that started with an expired token, refreshed, and whose POST lands after the sign-out gets 401 on the removal; the phone stays on A. Repro: `-t A5b` (holder stays A). Needs a slow POST (over 3 s) and a sign-out in the first seconds after opening the app. Builder claim "removes it again with the access token it was started with" holds only while that token is live.

## Other claims tested
- Declined join: backend community.service.ts 587-591 emits `community_join_declined` with only userWawuId and communityName; notification-event.ts 539 and `targetFor` (about 692) give a target only to `community_join_approved`. So the Hub's declined push has no target: `routes.ts` and routes.test.ts now match. Same on backend origin/main 18ac5f9.
- SHARED-CHANGES INBOX-21 #1 against `src/app/_layout.tsx` (diff with main): one import, the doc comment (one line extended, two added: row says "three lines", fine), `const inApp = signedIn && !gate.needsEmail && !offer.visible;` (exact), `<PushBridge live={inApp} />` after the Stack inside the query provider, nothing else. Matches. PushBridge draws nothing (R-47); round 2 touches no screen.
- typecheck EXIT 0, eslint on push, signOutFlow, _layout EXIT 0. Jest: push 5 suites + settings 4 suites + 3 round 1 attack files = 11 suites, 198 tests, passed.
- Not run: V9 pictures again (no UI file changed since round 1), V10 (real phone, owner's FCM key), mobile CI (no access to the repo from this session).
- Nothing here exists on main (no push code there).

## Cleanup
No stack was started; nothing listens on 7170 to 7177. Worktree v-inbox-21-m removed. No server left running.
