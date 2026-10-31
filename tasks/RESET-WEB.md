---
id: RESET-WEB
title: The mailed password-reset link opens a working page on wawuafrica.com (the one open page of the join-only site besides the landing, /join and the legal pages)
owner: YOU
area: WEB
order: -1299
priority: launch
repo: wawuafrica
type: web-port
status: verifying
depends_on: []
decisions: [R-48, R-47, R-123]
passes: [V1, V3, V4, V5, V6, V7, V9]
artboards: []
tier: T2
---
# RESET-WEB · The reset link works

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T2, identity), web `wmt/RESET-WEB` on `origin/main` `b7b014a` (head `ac0b33f`), records on mobile `wmt/RESET-WEB`. Web only: no WAWU ID, Hub or app change. Status verifying. **Default (lead), owner may override** (R-123).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | the mail's `/reset-password?token=...&email=...` answered 307 to /join in join-only mode | answers 200 with its query; the page sets the new password through WAWU ID `POST /auth/reset-password` |
| 2 | `/forgot-password`, `/login`, `/sign-in`, `/sign-up`, `/auth/*` go to /join | the same (checked live on the running site, 7 paths, plus the unit list in `check-site-mode.mjs`) |
| 3 | the page was in the auth frame (old-brand panel, video files that join-only keeps closed) | join-only draws the /join frame (Who Made This logo, one column, ink logo on a light page); full mode keeps the auth frame, unchanged |
| 4 | success sent the person to the web's sign-in (closed) | "Your password is changed. Go back to the Who Made This? app and sign in with your new password." and no link into the web |
| 5 | an expired or used link showed WAWU ID's raw words | "This link has expired or was already used. Go back to the Who Made This? app, tap Forgot password and ask for a new link." (also for a cut-off or wrong-token link) |

**Proof (live-shaped, rule 4).** WAWU ID `origin/main` `7e7abf8` built and run locally on a scratch Postgres, its mail sent to a local stand-in that keeps each mail; the web built from this branch and started as production (join-only). Account made by sign-up with the emailed code (so the address is proven); `POST /auth/forgot-password` with method email; the link taken from the stand-in mail (`http://localhost:12140/reset-password?token=<64 hex>&email=...`); opened in a phone-sized browser (390x844, touch) and at 1440: new password set; `POST /auth/login` with the NEW password answers 200 with a session, with the OLD password 401; the same link again shows the expired screen and changes nothing; a link past its time, a wrong token and a cut-off link all show it; no request leaves the page except WAWU ID's reset route. 39 checks, 0 failures. Crawl of the built site, both modes: join-only 430 checks, full 383 checks, 0 failed.

Checks (EXIT 0): tsc, lint (warnings only, the same kind as before), build, `check:site-mode` (334 unit checks), the 3 node:test files (47 tests), `check:copy`. Not run green and not from this change: `check:icons` ("Missing: Code", from `label="Code"` in `src/app/admin/referrals/CodesPanel.tsx`; CI does not run it) and the web gates (17 findings, none in a file this task touches).

Pictures (390 dark, 390 light, 1440 light; form, success, expired): `scratchpad/reset-web/shots/{form,success,expired}-{390-dark,390-light,1440-light}.png`. No board draws this page (R-29): built from the /join frame, StateCard and the existing form.

**PHONE CHECK (owner's list, before the update).** On a phone, with a real account whose email is proven: (1) in the app tap Forgot password, choose email, tap the link in the mail; the browser opens the reset page (not /join); (2) set a new password; the page says to go back to the app; (3) sign in to the app with the new password; the old one is refused; (4) tap the same mail link again: the expired screen. Only a phone and the live WAWU ID mail can show that the mail's link is the one built from `FRONTEND_URL=https://wawuafrica.com`; the deploy of this branch to wawuafrica.com is the lead's.

## Capability checks

- [x] A person can open the mailed link on a phone-sized screen and on desktop and set a new password.
- [x] The old password is refused and the new one signs in through WAWU ID's login.
- [x] An expired, used, wrong or cut-off link says so and points to the app's Forgot password.
- [x] Every other closed path still answers 307 to /join.
- [ ] On a real phone: NOT RUN (PHONE CHECK above).

## Follow-ups

- WAWU ID's "Secure my account" links (sign-in alert, password-changed mail) point to `${FRONTEND_URL}/forgot-password`, closed here. Set `SECURITY_URL` in WAWU ID, or give that link a page that works (the lead's call; not changed here).
- The app's own reset screen (next build) retires this page's job; the page stays until the owner says.
