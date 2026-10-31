# RESET-APP · detail moved from the Current state

### Pictures (owner hard rule 1), in `scratchpad/reset-app/shots/`

From a dev web export of the real screen (`/preview/auth?screen=reset`, the preview harness, dark and light by the phone's colour scheme), 390 x 844 dark and light and 360 x 640 light, each beside its nearest board in `pairs/<state>-<size>-<theme>-beside-<A23|A24>.png` (`boards/` holds the three renders): `empty`, `filled` (Passwords match), `error-short` ("Use at least 8 characters."), `error-mismatch` ("The two passwords don't match."), `saving` (Save password loading), `offline` (banner), `success` ("Password changed"), `expired` ("This link no longer works") and `nolink` (same, from an address with no token). No board exists for New password (the nearest are A23 for the form and A24 for the two end screens), so the pictures are beside those; the built screen follows `design/_gen/auth.js` line 25. The browser draws no status bar, home bar or keyboard: those are PHONE CHECK 4 and 5. `preview/auth.tsx` gains `screen=reset` (development only, a release build goes home).

### Checks (logs in `scratchpad/reset-app/logs/`, each with its EXIT line)

`tsc --noEmit` EXIT 0; eslint (no --fix) on the 12 changed ts and tsx files EXIT 0; jest `src/__tests__` and `src/features/auth` (`--maxWorkers=2`): 60 suites, 1376 tests passed, EXIT 0; `python3 scripts/gates/run.py` 0 fail, 17 warn, EXIT 0; `check_baseline.py` EXIT 0; `check_tasks.py --write` EXIT 0. Web (`wmt/RESET-APPLINK`): `check-site-mode` 311 passed with `--app-json` of this branch's `app.json`, 304 without, EXIT 0; `tsc --noEmit` EXIT 0; eslint on `src/lib/app-links.ts` EXIT 0. Changed assertions: `appLinks.test.ts` (seven paths became eight, the route map and the PUBLIC list gain `/reset-password`; the task adds the path those pin) and the web's `scripts/check-site-mode.mjs` (its copy of the path list and the Apple pattern list gain the path, plus five probe paths).

### The held web branch

`B3rry4r/WAWUAfrica` `wmt/RESET-APPLINK` from `origin/main` `b7b014a`: `APP_LINK_PATHS` gains `{ kind: "exact", path: "/reset-password" }`, so `/.well-known/apple-app-site-association` lists `/reset-password` and `assetlinks.json` is unchanged (Android reads the paths from the app). **HOLD: never merge.** It goes live only when the build with the app route is on phones; before that an iPhone on build 8 would open the app, which has no such screen, from the mailed link. `wmt/RESET-WEB` (website page for a phone without the app) is separate and may go first.

### Round 1 (31 Oct 2026): break proofs, pictures, checks

Break proofs (scratch worktree, the two test files, 83 tests; unbroken EXIT 0; each break below fails only the named tests, EXIT 1; logs in `scratchpad/reset-app-r1/breaks/`):

| Break | Fails |
|-------|-------|
| token passed on to Sign in | route-params block, signed out and signed in, both phones |
| `console.log` of the token | both console tests, both phones |
| `console.error` of the token | both console tests, both phones |
| token written with `SecureStore.setItemAsync` (`require` and `import`) | both vault tests, both phones |
| token written to `localStorage` | both vault tests, both phones |
| L1: token not dropped on success | route-params block |
| L1: `router.setParams` only (`path` still holds the link) | route-params block |
| L1: screen never calls `onSaved` | `onSaved` unit tests and the route-params block |
| L2: one-line message back | the line-break test |

Pictures (L2, 390 dark and light before and after, 360 x 640 and 320 x 568 light after): `scratchpad/reset-app-r1/shots/before-after-expired-390-dark.png`, `before-after-expired-390-light.png`, `after-*`. Checks with EXIT lines: `scratchpad/reset-app-r1/logs/`. Fingerprints unchanged: android `90f8c052`, ios `db378ce7` (no config or native change in this round).

### Proof

- Local WAWU ID (`origin/main` `7e7abf8`, built, its own Postgres `resetapp_test_id`, mail to a local stand-in for Resend, `FRONTEND_URL=https://wawuafrica.com`, ports 12170 and 12171): the app's own `forgotPasswordRequest` asked for a link; the link was read out of the mail the stand-in received (`https://wawuafrica.com/reset-password?token=<64 hex>&email=ada.reset%40example.test`); that address opened the real route in the app's router; a new password was saved; signing in through the screen with it worked (tokens stored); `loginRequest` with the old password was refused (`unauthorized 401 Invalid credentials`); the same link again, an expired link (token row set 1 minute into the past) and a mangled token each showed "This link no longer works" and changed nothing. 4 of 4 passed, `PROVE EXIT 0` (`scratchpad/reset-app/live/`, test copy `zzResetLocalId.test.tsx`, not committed).
- jest on the native platform: `src/features/auth/__tests__/resetPassword.test.tsx` (50 after round 1; 38 at first, Android and iPhone: the link's address, the checks, each server answer, double tap, the return keys, show/hide, the keyboard padding by the phone's own events) and `src/__tests__/resetPasswordRoute.test.tsx` (33 after round 1; 19 at first, the real router and root layout: the link signed out and signed in, spent link, no token, offline, Android back with and without a screen behind, the round back button cold).

### Round 1 (31 Oct 2026, patch after the verifier's FIX: tests only, product behaviour passed)

| # | Finding | Now |
|---|---------|-----|
| M1 | three breaks left every test green: the token passed on to Sign in, the token in a console log, the token written to storage | `src/__tests__/resetPasswordRoute.test.tsx`, new block "the token goes nowhere but the one request" (Android and iPhone, the real router): navigation state and route params at Sign in hold the email only; a console spy (log, info, warn, error, debug, trace) sees no token across the whole flow, a refused save, a dead connection and a mangled link; SecureStore writes, the vault and a recording `localStorage` never receive it, signed out and signed in. Each probe first shows it can see the token (it is in the params while the form is open). Break proofs below |
| L1 | the token stayed in the route while "Password changed" showed | on success the screen's `onSaved` (an effect after "Password changed" is committed, so no frame can draw "This link no longer works") has the route drop the token: `src/app/reset-password.tsx` resets the stack with this screen's own key and no `token` and no `path`. `router.setParams` alone is not enough: the router keeps `path`, the whole link, token included (proved: break `L1-params-only-path-kept` fails). "Password changed" stays up (same screen, same key) |
| L2 | "one." sat alone on a second line at 390 | `SPENT_LINK_MESSAGE` is two sentences on two lines ("It has expired or was already used." / "Ask for a new one."), so no short word is left alone. The existing one-line assertions still match (the test library reads a line break as a space), no assertion was edited |
| L3 | web `wmt/RESET-APPLINK` was behind `origin/main` | merged `origin/main` `3bd992c` (RESET-WEB, live) with a merge commit `c5705a6`; still HELD |

Break proofs (each break fails only its own tests, unbroken EXIT 0), pictures and EXIT lines: `tasks/history/RESET-APP.md`, round 1.
