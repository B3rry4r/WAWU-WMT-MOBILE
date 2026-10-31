# RESET-APP · detail moved from the Current state

### Pictures (owner hard rule 1), in `scratchpad/reset-app/shots/`

From a dev web export of the real screen (`/preview/auth?screen=reset`, the preview harness, dark and light by the phone's colour scheme), 390 x 844 dark and light and 360 x 640 light, each beside its nearest board in `pairs/<state>-<size>-<theme>-beside-<A23|A24>.png` (`boards/` holds the three renders): `empty`, `filled` (Passwords match), `error-short` ("Use at least 8 characters."), `error-mismatch` ("The two passwords don't match."), `saving` (Save password loading), `offline` (banner), `success` ("Password changed"), `expired` ("This link no longer works") and `nolink` (same, from an address with no token). No board exists for New password (the nearest are A23 for the form and A24 for the two end screens), so the pictures are beside those; the built screen follows `design/_gen/auth.js` line 25. The browser draws no status bar, home bar or keyboard: those are PHONE CHECK 4 and 5. `preview/auth.tsx` gains `screen=reset` (development only, a release build goes home).

### Checks (logs in `scratchpad/reset-app/logs/`, each with its EXIT line)

`tsc --noEmit` EXIT 0; eslint (no --fix) on the 12 changed ts and tsx files EXIT 0; jest `src/__tests__` and `src/features/auth` (`--maxWorkers=2`): 60 suites, 1376 tests passed, EXIT 0; `python3 scripts/gates/run.py` 0 fail, 17 warn, EXIT 0; `check_baseline.py` EXIT 0; `check_tasks.py --write` EXIT 0. Web (`wmt/RESET-APPLINK`): `check-site-mode` 311 passed with `--app-json` of this branch's `app.json`, 304 without, EXIT 0; `tsc --noEmit` EXIT 0; eslint on `src/lib/app-links.ts` EXIT 0. Changed assertions: `appLinks.test.ts` (seven paths became eight, the route map and the PUBLIC list gain `/reset-password`; the task adds the path those pin) and the web's `scripts/check-site-mode.mjs` (its copy of the path list and the Apple pattern list gain the path, plus five probe paths).

### The held web branch

`B3rry4r/WAWUAfrica` `wmt/RESET-APPLINK` from `origin/main` `b7b014a`: `APP_LINK_PATHS` gains `{ kind: "exact", path: "/reset-password" }`, so `/.well-known/apple-app-site-association` lists `/reset-password` and `assetlinks.json` is unchanged (Android reads the paths from the app). **HOLD: never merge.** It goes live only when the build with the app route is on phones; before that an iPhone on build 8 would open the app, which has no such screen, from the mailed link. `wmt/RESET-WEB` (website page for a phone without the app) is separate and may go first.

