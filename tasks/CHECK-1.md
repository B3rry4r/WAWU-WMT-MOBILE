---
id: CHECK-1
title: Checkpoint 1: the app talks to the real backend, screens match the design
owner: YOU
area: CHECK
order: 130
priority: launch
repo: all
type: ops
status: review
depends_on: [CHECK-0, SHELL-03, AUTH-01, HOME-02]
decisions: [R-24, R-25]
passes: [V11]
artboards: []
---
# CHECK-1 · Checkpoint 1: the app talks to the real backend, screens match the design

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

Prove the app talks to the real backend, signed in for real, and that the screens built so far match the
design. It gates nothing; payment work continues alongside.

## Scope

Dispatch an AUDITOR session over everything marked done so far.

## Capability checks

- [ ] A tester signs in against the backend running locally from wawu-backend's `scripts/local/up.sh` (OPS-03) with seeded data, through the web build or an emulator, with the real login, and sees a seeded creator's real content (V9).
- [ ] Every screen built so far is compared picture against picture in the audit, or listed as not reachable with a reason.
- [ ] A preview build runs on the owner's Android phone and signs in against the live services (`https://api.wawuafrica.com`, `https://id.wawuafrica.com`), as every tester build does (V10, Android only; R-24, R-25). Tester builds are not pointed at the local backend; money paths wait for OPS-10.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

**Auditor: CHECK-1** (V11). Fresh session, 7 Oct 2026. Mobile `origin/main` f0b81c9, backend `origin/main` 6c0e435, wawu-id `origin/main` 4715d17. Findings only: no product or test code was changed, nothing was pushed to any backend or wawu-id branch. Independence: `git log` on main has one generic author for almost every commit (`Claude`, 688 commits), so authorship cannot show it; this session was started cold for the audit, wrote none of the files in scope and read no builder's session.

Evidence (not committed, under the lead's scratchpad): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ck1/`. `art/<ID>-light|dark.png` (renders), `shots/` (app screenshots, 159 files), `pairs/<ID>.png` (design light, app light, design dark, app dark, in that order, 390 px), scripts beside them (`pw.py`, `walk*.py`, `stub.py`, `feedstub.py`), `check-base.log` (V1).

## 1. Result in one paragraph

Capability check 1 PASSED against the real backend (real wawu-id, real Hub, fresh migrated and seeded databases): the app's own sign-in screen signs in all three seeded accounts, cold start, resume after the access token expired, and the mid-session expiry, and shows a seeded creator's real values. Capability check 2: 33 artboards compared picture against picture (16 match, 17 differ), 237 artboards are unbuilt (each in a later task), 18 are ruled not built, 5 depend on a ruling that contradicts the canvas, 4 are component references with no user route. 24 of the 33 compared artboards (and 12 of the built routes) cannot be reached by a user from the app today; the signed-in area is five placeholder tabs with no way to any built screen and no way to sign out. One low defect (F-1), two owner rulings needed (F-2, F-3), one backend scaling finding (F-5), the route-graph consequence of task order (F-4) and several low or unclear notes. Capability check 3 is NOT RUN (the owner's phone).

## 2. Pass table

| Pass | Result | Evidence |
|---|---|---|
| V1 Gates | passed (baseline) | `npm run check` on f0b81c9, exit 0: tsc 0, lint 0, 46 suites / 797 tests, gates 9 / 216 files scanned / 0 fail / 0 warn / 0 accepted, baseline 0 entries, tasks 208 ok with 279 artboards covered (`check-base.log`). Re-run on this branch before the push: see the end of section 10. |
| V4 Field trace | not in scope of this audit | each task's own verifier ran it. Spot check done: the bio typed in the app was read back through `GET /users/me` (section 3). |
| V5 Picture | 33 compared, 16 match, 17 differ | section 5. 390 px wide, light and dark, renders from `scripts/design/render_design.py`, Playwright Chromium at /opt/pw-browsers. |
| V6 States | partly | real causes reached: wrong password (A25), unconfirmed email, offline, 500, 429, reset sent (A24), empty fields, BVN check refused by the Hub (`provider_unreachable`, real), "Open your wallet first", "Not available yet" (About, Terms, Privacy), feed empty (Following) and feed 500. Needed a stub or the dev harness: A4, A15, A5 to A10, A14, A16, A21 form, H3 to H6, Z10/Z11 text. Not reachable here: see NOT RUN. |
| V7 Flow walk | done for the built graph | section 6 and 7: cold start and resume, as a plain user (`user@test.wawu.dev`), a creator with KYC pending (`creator-basic`) and a creator with KYC approved (`creator-pro`), and a confirmed-never account (`ck1-unverified`). |
| V9 Live seam | passed | section 3. |
| V10 Device | NOT RUN | the owner's step, section 9. |
| V11 Checkpoint audit | this report | section 1 to 10. |

## 3. Capability check 1: real sign-in, real data (PASSED)

Stack: wawu-backend `scripts/local/up.sh --detach` (OPS-03) from a worktree of backend `origin/main` 6c0e435 and a worktree of wawu-id `origin/main` 4715d17 (the real wawu-id, not the mock: the app's login envelope `{data:{accessToken,refreshToken}}` matches it), databases `ck1_hub_test` and `ck1_id_test` (migrated, seeded by the script), Hub :5271, wawu-id :5272. The web export of mobile f0b81c9 was built with `EXPO_PUBLIC_API_URL=http://localhost:5271` and `EXPO_PUBLIC_ID_URL=http://localhost:5272` (confirmed in the bundle: `const t="http://localhost:5271",n="http://localhost:5272"`), served on :8271. The browser could reach only localhost (every other request was aborted by the harness and logged: 0 requests left the machine).

- Cold start signed out opens `/welcome` (A1). Sign in tapped, email `creator-pro@test.wawu.dev`, password typed on A22: `POST 5272/auth/login 200`, `GET 5272/auth/signup/progress 200`, the app opens the tabs (Home). No token was injected.
- A seeded creator's real values on screen: `/edit-profile` (the app's Edit profile) reads `GET /users/me` and `GET /users/me/profile-fields`: name "Zainab Bello", handle `zainab-pro`, bio "Business consultant helping African founders register and export. Pro tier." (75 / 500), Instagram `@zainab.bello`. `/feed` reads `GET /feed/entries`: the seeded post "Fast, full-glam owambe-ready makeup in under 10 minutes." by "Chidi Umeh", 240 likes, 1 comment, "Video · 10m", values only the Hub holds. Pictures: `shots/c1-after-signin-light.png`, `shots/s-pro-edit-profile-light.png`, `pairs/H2-real-seed.png`, `pairs/M8.png`.
- Write and read back: bio changed in Edit profile through the app, Save, `PATCH 5271/api/hub/users/me 200`, then `GET /users/me` through the API returned the new bio (`v9.py`, output in section 10).
- Same login for the plain user (`user@test.wawu.dev`: "Adaeze", handle `adaeze`) and `creator-basic` (Chidi, KYC pending); phone `+234...0003` signs in too (A22 says email only).
- Resume: access token lifetime set to 25 s in the local wawu-id `.env` (local file only). Cold start with an expired access token and a valid refresh token: `GET progress 401`, `POST /auth/refresh 200`, `GET progress 200`, Hub calls 200, the screen opens (`refresh3.py`). Mid-session: Hub calls answered 401 together, one `POST /auth/refresh`, both retried and 200 (`refresh5.py`). An invalid refresh token ends the session at `/welcome` (seen earlier with a reused token).
- The live services answer (read-only GETs, nothing written): `id.wawuafrica.com/health` 200, `api.wawuafrica.com/api/hub/health` 200, `/api/hub/about` 200 (`bankName: Loma Bank`, `licenceLine: null`, `supportEmail: null`), `/api/hub/feed/entries`, `/api/hub/money/wallet` and `id.../auth/signup/progress` answer 401 without a token, so the routes the built screens use exist there.

## 4. Findings

Class: **defect** (with reproduction and owning task), **recorded** (differs-for-recorded-reason, citation), **unclear** (needs a ruling or a measurement). Severity is the auditor's.

| # | Class | Sev | Owning task | Finding and reproduction |
|---|---|---|---|---|
| F-1 | defect | low | SHELL-01 (route graph; `src/app` has no `+not-found.tsx`) | A production web export shows Expo's default "Unmatched Route / Page could not be found. / Go back / Sitemap" for any unknown route, and `/_sitemap` lists every route file (including `dev/components.tsx`, `preview/*.tsx`) with "Mode production". Repro: `expo export --platform web` (not `--dev`), open `/does-not-exist` and `/_sitemap`, signed in or out (`prod1.py`, `prod2.py`, `shots/prod-unmatched-light.png`, `shots/prod-sitemap-light.png`). The dev routes themselves redirect Home in production as designed (`/dev/components`, `/preview/auth|pay-sheet|pin-sheet` land on `/`). On a phone a stray deep link would show the same default screen: NOT RUN. |
| F-2 | unclear (needs ruling) | high for scope | owner; carried by every navigation task per R-38 | DECISIONS R-38 (6 Oct) says the bottom bar "stays Home, Communities, Explore, Messages, Settings" and that "a verifier treats a bar with a sixth or swapped slot as a defect". The built bar, the canvas (H1, W1, I1, M1, X1), SHELL-01, INBOX-04 and every wallet task use Home, Explore, Inbox, Wallet, Me. The R-38 sentence matches the old web app's navigation, not this app. By its letter the shipped bar is a defect; by every other source it is correct. Needs the owner to correct the R-38 sentence or the bar. Five artboards are marked `needs-ruling` for this reason. `src/components/TabBar.tsx`, `DECISIONS.md` line 332. |
| F-3 | unclear | medium | none exists | R-39 says "Carried out by: MONEY-20, AUTH-07 (email sign-up codes) ..." but `tasks/AUTH-07.md` does not exist and no task file mentions it (`ls tasks | grep AUTH-07` is empty); `check_tasks.py` passes. WORKFLOW rule 8 (every decision names the task that carries it out) is unmet. Meanwhile sign-up (A3, A4, A15 and the email step, tasks AUTH-04 and AUTH-05, done) is built on an SMS code that the local stack cannot send (`POST /auth/signup` answers `503 SMS_NOT_CONFIGURED`, the SMS provider is Fintava's) so no sign-up can complete locally, and R-39 says the same SMS path is being retired. A4 and A15 are compared through the dev harness only. |
| F-4 | recorded (consequence of task order) | medium for the tester build | HOME-01, ME-01, SETTINGS-01 (sign out), WALLET-01 (all todo) | A signed-in user lands on five placeholder tabs (title only) and nothing leads anywhere: no tab, button or link reaches `/feed`, `/edit-profile`, `/social-links`, `/payout-account`, `/open-wallet` (and its four steps), `/about`, `/terms`, `/privacy-policy`; `signOut()` in `src/api/session.ts` has no caller, so a tester cannot sign out (only clearing the app's data). Recorded per task as "entry added by task X" and consistent with WORKFLOW section 7 (SETTINGS-01's check "a user can sign out" is todo), but SHELL-03 already ships tester builds in this state. Repro: sign in, tap each tab (`graph1.py`). |
| F-5 | unclear | medium | wawu-id `src/auth/tokens.service.ts` `rotateRefreshToken` (no open task); app side `src/app/_layout.tsx` | `POST /auth/refresh` argon2-verifies the presented token against every refresh token stored for the account, one by one, and a sign-in adds a row that nothing prunes (30 day expiry). Measured here (slow 2 core box, 0.53 s per argon2 verify): `creator-pro` held 53 rows after about 55 test sign-ins, and a refresh with a valid token got no answer for over 20 s (`curl -m 20` timed out; accounts with 2 rows answer in 1 to 3 s). While it waits, a cold start with an expired access token shows a blank page (the root layout draws nothing until the sign-up gate answers and it has no timeout): `refresh2.py`, `shots/refresh-blank-light.png`. My test inflated the row count, so the production exposure is unknown: it is the number of sign-ins per account in 30 days times one argon2 verify on the droplet. Needs a measurement on the droplet or a cap or lookup by token id. |
| F-6 | unclear | low | AUTH-04, KYC-04 | Small unrecorded differences: A3's heading sits 9 px lower under the nav title than the render (the app's gap is 40 px, the render's 31 px; A23's heading gap matches its render), the phone number is not grouped as drawn ("0803 123 4412"), A8's button carries an arrow the render does not draw. |
| F-7 | unclear | low | ME-06 / ME-05 | M8 draws "wawu/<handle>" under the handle; the app hides it when the handle holds a character its own pattern refuses (`HANDLE_PATTERN` letters, numbers, dot, underscore). The local seed holds hyphenated handles (`zainab-pro`, `chidi-creates`), so for those accounts the preview is missing and the Hub would refuse the same handle on save (`adaeze` shows it). Whether hyphenated handles exist in production is not known. `pairs/M8.png`. |
| F-8 | unclear | low | AUTH-01, AUTH-04 | An account whose email was never confirmed (made on another client) signs in to "Your account isn't confirmed yet. Finish confirming it, then sign in. If you were signing up here, create your account again to get a new code." There is no screen to confirm an email for that account in the app. Repro: `POST 5272/auth/register`, then the app's A22 (`shots/st-unverified.png`). |
| F-9 | recorded | info | WALLET-11 (G-57), WALLET-09 (todo) | `GET /money/banks` and `POST /money/banks/name-check` answer 404 on backend main, so A21's bank picker cannot work against today's backend (curl, 404 "Cannot GET /api/hub/money/banks"). |
| F-10 | unclear | info | owner (G-143) | About reads "Banking by Loma Bank" from `WALLET_BANK_NAME` and the live Hub answers the same with no licence line; R-39 says "R-1's Loma Bank licence line is superseded by this ruling". Config only. |
| F-11 | info | info | HOME-07 | The seeded feed holds 2 entries (a video and a course); the app draws only the video (courses are HOME-07's), so For you shows one post and then ends. |
| F-12 | recorded | info | HOME-02 (SHARED-CHANGES HOME-02 #4) | Over a feed post the tab bar is the page colour (white in light theme) where the renders draw a dark translucent bar; Today tab, search, Create button, Tip and the avatar link are absent (HOME-01, HOME-03, HOME-13, ME-02 add them). Create is a screen-level button for creator accounts (SHELL-01 notes), so the Create button does not exist anywhere yet. |

Not defects, recorded elsewhere: A1 (R-37 logo, G-34 line, G-35 photo), A2 (R-37 title, "Free." left out G-34), A24 ("1 hour" is WAWU ID's real expiry, AUTH-01), A6/A7/A16 (no live camera view on web, `capture.web.ts`; "blink slowly" removed per BRIEF A6), A21 ("Creators only" and BVN match line left out, G-58), M8 (n / 500 G-110, no cover photo, Location free text), Z9 (R-37 mark and title, no Rate row on web, G-142), Z10/Z11 ("Not available yet" until the owner publishes text, G-140), H14 and W10 (fee rows from the quote, R-10).

## 5. Capability check 2: screen by screen (33 compared)

Each row names the pair file under `pairs/` (design light, app light, design dark, app dark). "Real" means the real backend and sign-in; "stub" means a Playwright route stub of the Hub answer on the real screen (the contract's shapes: `stub.py`, `feedstub.py`); "harness" means the dev-only `/preview/*` route (dev export). A "device" difference (status bar, home bar, about 50 px at the top and 34 px at the bottom) is not counted.

| Artboard | Built by | How reached | Result | Notes |
|---|---|---|---|---|
| A1 | AUTH-02 | real, cold start | differs, recorded | R-37 logo, G-34 subline ("and bank it all in one app" left out), G-35 colour instead of the cover photo. |
| A2 | AUTH-02 | real | differs, recorded | title "Who Made This" (R-37), "Free." left out (G-34). Picked state `shots/A2-picked-light.png`. |
| A3 | AUTH-04 | real | differs, recorded + F-6 | BVN field and NIBSS line removed (R-6, BRIEF A3), heading "Let's get you started"; F-6 spacing. Error state on `SMS_NOT_CONFIGURED`: "We couldn't send the code" (`shots/A3-error-light.png`). |
| A4 | AUTH-04 | harness | conforms | "Sent by SMS to 0803 ••• 4412" without the BVN clause (R-6). Real path NOT RUN (F-3). |
| A15 | AUTH-04 | harness | conforms | "That code isn't right". |
| A22 | AUTH-01 | real | conforms | empty fields where the render shows typed ones. |
| A23 | AUTH-01 | real | conforms | |
| A24 | AUTH-01 | real | differs, recorded | "It expires in 1 hour." (WAWU ID's real expiry; the render says 30 minutes). |
| A25 | AUTH-01 | real (wrong password) | conforms | |
| A5 | KYC-03 | stub (BVN answer) | conforms (brief version) | address added, state beside city, per BRIEF A5. |
| A6 | KYC-03 | stub | differs, recorded | web draws no live camera: "Take selfie" opens the file picker; no "blink slowly". |
| A7 | KYC-03 | stub (opening held) | differs, recorded | same; spinner under "Matched to your BVN". |
| A16 | KYC-03 | stub (server's own message) | differs, recorded | same camera difference; title and line split correctly. |
| A8 | KYC-04 | stub | conforms (brief version) + F-6 | "Loma Bank", no Tier, no Limit row, no "Raise your limits". |
| A9 | KYC-04 | stub | conforms | |
| A10 | KYC-04 | stub (and server `pin_mismatch`) | conforms | after a finished PIN the flow lands on Home (the Wallet tab and W5 do not exist yet). |
| A14 | KYC-05 | real route, stubbed `bvn_phone_mismatch` | conforms (brief version) | shown as a state of A26 with BVN and NIN fields, plus "I don't have a Nigerian BVN" which leads to "Not available yet" (R-6). A26 has no artboard: pictured `shots/A26-light.png`. |
| A21 | WALLET-11 | stub (wallet open, banks) | differs, recorded | G-58; real stack shows "Open your wallet first" (real 409) and the picker 404s (F-9). |
| H2 | HOME-02 | real seed; stub for the pair | differs, recorded | F-12; seeded media URL is `storage.seed.local` (unreachable) so the video never draws: `pairs/H2-real-seed.png` against `pairs/H2.png`. |
| H3 | HOME-02 | stub | differs, recorded | frames, counter, peek and offer bar match; F-12. |
| H4 | HOME-02 | stub | differs, recorded | cover, "12 pages free", offer bar match; F-12. |
| H5 | HOME-02 | stub | differs, recorded | "Preview ended" overlay NOT reached (video cannot play in this Chromium); lock, offer bar, rail match; F-12. |
| H6 | HOME-02 | stub (real wav) | differs, recorded | waveform, play button, "Following" tag match; F-12. |
| H14 | MONEY-03 | harness | differs, recorded | sheet matches; fee rows from the quote (R-10). |
| W10 | MONEY-03 | harness | differs, recorded | fee rows and "They get" line (R-10). |
| W11, H15, M13 | MONEY-02 | harness | conforms (sheet only) | the screens behind the sheet (Review, Verification) do not exist; the biometric key shows the fingerprint (the screen asks the phone). |
| M8 | ME-06 | real | differs, recorded + F-7 | real seeded values; "n / 500" (G-110), no cover photo, Location free text, Save grey until a change. |
| M9 | ME-06 | real | conforms | |
| Z9 | SETTINGS-02 | real; stub for filled config | differs, recorded | R-37 mark and title, no Rate row on web (G-142), extra Terms and Privacy card, bank and support from config (`pairs/Z9.png` real, `Z9-fixture.png` stub). |
| Z10, Z11 | SETTINGS-02 | real (unpublished); stub with a fixture document | conforms (with a document) | real stack: "Not available yet" (G-140). |

Counts: compared 33; matching 16 (A4, A15, A22, A23, A25, A5, A8, A9, A10, A14, M9, W11, H15, M13, Z10, Z11); differing 17 (A1, A2, A3, A6, A7, A16, A21, A24, M8, Z9, H2, H3, H4, H5, H6, H14, W10); of the differing, 17 have recorded reasons and 2 (A3, M8) also carry an unrecorded minor item (F-6, F-7). Unverified: 4 (W7, W9, W26, X14: component references that exist only on the dev showcase). Unbuilt: 237 (each in a later task) plus 5 tab artboards whose screens are placeholders and whose bar is in question (F-2). Ruled not built: 18 (SH1 to SH15 R-2, M3 R-9, W40 R-11, W18 R-28). In no task: none besides those 18.

### Not reachable by a user, with the reason

| Route | Artboards | Reason | Added by |
|---|---|---|---|
| `/feed` | H2 to H6 | nothing links to it; only a typed URL | HOME-01 (tabs that lead to it) |
| `/edit-profile`, `/social-links` | M8, M9 | no Me tab body yet; `social-links` only from `edit-profile` | ME-01 (SHARED-CHANGES ME-06 #5) |
| `/payout-account` | A21 | no row leads there | M14 and A11 owners (ME-*, AUTH-06) |
| `/open-wallet`, `/open-wallet-details`, `-selfie`, `-account`, `-pin` | A26, A14, A5 to A10, A16 | no payer screen calls `useOpenWalletEntry`; the steps are reached only through A26 | MONEY pay flows (HOME-12), WALLET-01 |
| `/about`, `/terms`, `/privacy-policy` | Z9 to Z11 | no Settings screen | SETTINGS-01 |
| Pay sheet, PIN sheet | H14, H15, W10, W11, M13 | no screen opens them; dev `/preview/*` only | HOME-12, WALLET-02 and later |

Reachable by a user today: A1, A2, A3, A22, A23, A24, A25 (and A4, A15 after a sent SMS, not run). So 24 of the 33 compared artboards have no way in from the app.

## 6. Route graph from a fresh sign-in

Signed out: `/welcome` (A1) to Create an account to `/account-type` (A2, Continue stays disabled until one card is picked) to `/sign-up` (A3) to `/phone-code` (A4) to optional `/email-code` to the tabs; or Sign in to `/sign-in` (A22) to `/forgot-password` (A23) to "Check your email" (A24) to Back to sign in; A22 "New here? Create an account" reaches A2. Back works on A22, A2, A3. Signed-out visits to `/edit-profile`, `/payout-account`, `/open-wallet`, `/feed`, `/me`, `/social-links`, `/email-code` go to `/welcome`; `/phone-code` without a held sign-up goes to `/sign-up`; `/about`, `/terms`, `/privacy-policy` open (public by design). Signed in: every signed-out route redirects to `/` (the tabs); browser back from Home leaves the app; the five tabs switch and Home returns to `/`; `/email-code` redirects to `/` when the server says the email is already done (a stub that kept saying "email" left the screen on its sending spinner after the server's 409: my stub contradicted the server, not a finding). Dead ends: F-4 (no way onward, no sign-out), F-1 (unmatched route screen has "Go back"), and the end of Open your wallet lands on Home. After Edit profile Save the app returns to `/`.

## 7. Flows walked, by user type

New user: sign-up reaches A3 and stops at the server's `503 SMS_NOT_CONFIGURED` (NOT RUN beyond). Unconfirmed email: F-8. Plain user, creator KYC pending, creator KYC approved: sign-in, tabs, `/edit-profile`, `/feed`, `/open-wallet` (A26 then "Not available yet" for no Nigerian BVN), `/payout-account` ("Open your wallet first" for all three: no account-type gate, G-58 recorded), `/about`. Every Hub call carried the signed-in token; the feed counted one view.

## 8. Environment notes (not product defects)

- `/home/user/wawu-id/node_modules` is stale for wawu-id main: `@nestjs/swagger`, `@nestjs/mapped-types`, `@microsoft/tsdoc`, `swagger-ui-dist` were missing and `up.sh` failed at `id-build` until they were copied (hard links) from the backend's `node_modules` into the audit worktree. A clean `npm ci` has them.
- The Metro cache inside the hard-linked mobile `node_modules` held an earlier build's `EXPO_PUBLIC_*` values: the first export baked `http://localhost:8271` and `http://localhost:8271/id` for both servers despite the variables, so sign-in posted to the static server (501). `expo export --clear` fixed it. Any export for a tester build must be clean (EAS builds in a clean cloud workspace).
- Hub `CORS_ORIGIN` from `up.sh` lists 8081, 19006 and 3000; port 8271 was added to the audit worktree's `.env` only.
- Stand-in needs: Fintava key empty (BVN check, selfie, wallet, PIN are refused by the Hub as `provider_unreachable`, nothing sent), no object storage (uploads 503, G-113), mail not sent (codes in the wawu-id log), seeded media URLs unresolvable, legal documents and support address unset (G-140, G-141).

## 9. NOT RUN

| Item | Why | Fact that unblocks it |
|---|---|---|
| Capability check 3 and V10 (owner's Android phone against live services) | the owner's step | a tester build from SHELL-03 installed on the phone, signed in with a real account against `https://api.wawuafrica.com` and `https://id.wawuafrica.com` (both answer health now; the feed, money and progress routes exist there). Money paths wait for OPS-10. |
| Sign-up end to end (A3 to A4 to email step to tabs) | no SMS sender locally (F-3) | AUTH-07 (email sign-up codes) exists and is built, or a wawu-id SMS stand-in |
| Real BVN check, selfie match, wallet opening, PIN set (A5 to A10 against the backend) | Fintava key absent; no sandbox call is allowed | sandbox keys in the Hub `.env` or the Nuvion adapter (MONEY-20 follow-up); until then these rows are stub pictures |
| A21 bank list and name check | 404 on backend main | WALLET-09 |
| H2 to H6 real media, H5 "Preview ended" | seeded media URLs unreachable; the headless Chromium has no H.264 and the stub video could not be encoded | object storage with real files, or a phone |
| Live camera view (A6) and phone keyboard, safe areas, touch drag | web build only | V10 |
| Refresh timing on the droplet (F-5) | needs the production argon2 cost | a measurement on the droplet |
| Android deep link to an unknown route (F-1) | web only | V10 |

## 10. Reproduction notes

Stack start: `WAWU_ID_DIR=<wawu-id worktree> HUB_DB=ck1_hub_test ID_DB=ck1_id_test HUB_PORT=5271 ID_PORT=5272 scripts/local/up.sh --detach`; `scripts/local/smoke.sh` passed all 9 steps (health, register, EMAIL_NOT_VERIFIED, confirm, login, `/users/me` 401 and 200, PATCH read back, seeded creator). Web: `EXPO_PUBLIC_API_URL=http://localhost:5271 EXPO_PUBLIC_ID_URL=http://localhost:5272 npx expo export --platform web --clear` (production) and `--dev` (for the harness), served by a static server with an `index.html` fallback on :8271. Seeded sign-ins: `user@`, `creator-basic@`, `creator-pro@test.wawu.dev`, password from `up.sh`. V9 write: `v9.py` printed `BEFORE bio: Business consultant helping African founders register and export. Pro tier.` then `PATCH /users/me 200` then `AFTER bio: CK1 audit bio written through the app on 7 Oct.`

`npm run check` on this branch (a task file, LOG and PROGRESS change only): exit 0, tsc 0, lint 0, 46 suites / 797 tests, gates 9 / 216 files / 0 fail / 0 warn / 0 accepted, baseline 0, tasks 208 ok (`check-branch.log`). Secret scan of the staged diff: no `sk_`, `FLWSECK`, bearer token, private-key header, or hex or base64 run of 32 characters or more.

## 11. Coverage, one row per artboard (297)

Coverage: `built`, `ruled-no-artboard` (ruled not built), `needs-ruling`, `missing` (task named). Conformance: `conforms`, `differs`, `unbuilt`, `unverified`. App screens with no artboard: A26 (BRIEF, KYC-05), the email step (SHARED-CHANGES AUTH-05 F2), A3's SMS-failed state; no picture to compare.

| ID | Flow | Coverage | Conformance | Note | Tasks |
|---|---|---|---|---|---|
| A1 | Auth | built | differs | recorded; pair `A1.png` | AUTH-02:done |
| A2 | Auth | built | differs | recorded; pair `A2.png` | AUTH-02:done |
| A3 | Auth | built | differs | recorded + unclear (minor); pair `A3-filled.png` | AUTH-04:done, UI-01:done |
| A4 | Auth | built | conforms | (dev harness); pair `A4.png` | AUTH-04:done |
| A5 | Auth | built | conforms | (brief version; network stub); pair `A5.png` | KYC-03:done |
| A6 | Auth | built | differs | recorded; pair `A6.png` | KYC-03:done |
| A7 | Auth | built | differs | recorded; pair `A7.png` | KYC-03:done |
| A8 | Auth | built | conforms | (brief version; network stub; minor unclear); pair `A8.png` | KYC-04:done |
| A9 | Auth | built | conforms | (network stub); pair `A9.png` | KYC-04:done |
| A10 | Auth | built | conforms | (network stub); pair `A10.png` | KYC-04:done |
| A11 | Auth | missing | unbuilt | later task AUTH-06 | AUTH-06:todo |
| A12 | Auth | missing | unbuilt | later task AUTH-06 | AUTH-06:todo |
| A13 | Auth | missing | unbuilt | later task AUTH-06 | AUTH-06:todo |
| A14 | Auth | built | conforms | (brief version; network stub); pair `A14.png` | KYC-05:done |
| A15 | Auth | built | conforms | (dev harness); pair `A15.png` | AUTH-04:done |
| A16 | Auth | built | differs | recorded; pair `A16.png` | KYC-03:done |
| A17 | Auth | missing | unbuilt | later task WALLET-19 | WALLET-19:todo |
| A18 | Auth | missing | unbuilt | later task WALLET-19 | WALLET-19:todo |
| A19 | Auth | missing | unbuilt | later task WALLET-19 | WALLET-19:todo |
| A20 | Auth | missing | unbuilt | later task WALLET-19 | WALLET-19:todo |
| A21 | Auth | built | differs | recorded; pair `A21.png` | WALLET-11:done |
| A22 | Auth | built | conforms | real stack; pair `A22.png` | AUTH-01:done |
| A23 | Auth | built | conforms | real stack; pair `A23.png` | AUTH-01:done |
| A24 | Auth | built | differs | recorded; pair `A24.png` | AUTH-01:done |
| A25 | Auth | built | conforms | real stack; pair `A25.png` | AUTH-01:done |
| E1 | Events | missing | unbuilt | later task EVENTS-01 | EVENTS-01:todo |
| E2 | Events | missing | unbuilt | later task EVENTS-01 | EVENTS-01:todo |
| E3 | Events | missing | unbuilt | later task EVENTS-06 | EVENTS-06:todo |
| E4 | Events | missing | unbuilt | later task EVENTS-06 | EVENTS-06:todo |
| E5 | Events | missing | unbuilt | later task EVENTS-06 | EVENTS-06:todo |
| E6 | Events | missing | unbuilt | later task EVENTS-03 | EVENTS-03:todo |
| E7 | Events | missing | unbuilt | later task EVENTS-03 | EVENTS-03:todo |
| E8 | Events | missing | unbuilt | later task EVENTS-01 | EVENTS-01:todo |
| E9 | Events | missing | unbuilt | later task EVENTS-01 | EVENTS-01:todo |
| E10 | Events | missing | unbuilt | later task EVENTS-06 | EVENTS-06:todo |
| E11 | Events | missing | unbuilt | later task EVENTS-08 | EVENTS-08:todo |
| E12 | Events | missing | unbuilt | later task EVENTS-03 | EVENTS-03:todo |
| E13 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E14 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E15 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E16 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E17 | Events | missing | unbuilt | later task EVENTS-08 | EVENTS-08:todo |
| E18 | Events | missing | unbuilt | later task EVENTS-08 | EVENTS-08:todo |
| E19 | Events | missing | unbuilt | later task EVENTS-09 | EVENTS-09:todo |
| E20 | Events | missing | unbuilt | later task EVENTS-09 | EVENTS-09:todo |
| E21 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E22 | Events | missing | unbuilt | later task EVENTS-04 | EVENTS-04:todo |
| E23 | Events | missing | unbuilt | later task EVENTS-09 | EVENTS-09:todo |
| E24 | Events | missing | unbuilt | later task EVENTS-09 | EVENTS-09:todo |
| E25 | Events | missing | unbuilt | later task EVENTS-08 | EVENTS-08:todo |
| X1 | Explore | needs-ruling | unbuilt | tab body is a placeholder; the bar built from this artboard conflicts with R-38 text (F-2) | EXPLORE-01:todo, SHELL-01:done |
| X15 | Explore | missing | unbuilt | later task EXPLORE-01 | EXPLORE-01:todo |
| X2 | Explore | missing | unbuilt | later task EXPLORE-01 | EXPLORE-01:todo |
| X3 | Explore | missing | unbuilt | later task EXPLORE-01 | EXPLORE-01:todo |
| X4 | Explore | missing | unbuilt | later task EXPLORE-02 | EXPLORE-02:todo |
| X5 | Explore | missing | unbuilt | later task EXPLORE-02 | EXPLORE-02:todo |
| X6 | Explore | missing | unbuilt | later task EXPLORE-02 | EXPLORE-02:todo |
| X7 | Explore | missing | unbuilt | later task EXPLORE-02 | EXPLORE-02:todo |
| X8 | Explore | missing | unbuilt | later task EXPLORE-04 | EXPLORE-04:todo |
| X9 | Explore | missing | unbuilt | later task EXPLORE-04 | EXPLORE-04:todo |
| X10 | Explore | missing | unbuilt | later task EXPLORE-04 | EXPLORE-04:todo |
| X11 | Explore | missing | unbuilt | later task EXPLORE-04 | EXPLORE-04:todo |
| X12 | Explore | missing | unbuilt | later task EXPLORE-04 | EXPLORE-04:todo |
| X13 | Explore | missing | unbuilt | later task EXPLORE-01 | EXPLORE-01:todo |
| X14 | Explore | built | unverified | component reference; shown only on the dev showcase `/dev/components`, no user route | EXPLORE-01:todo, UI-02:done |
| H1 | Home | needs-ruling | unbuilt | tab body is a placeholder; the bar built from this artboard conflicts with R-38 text (F-2) | SHELL-01:done, HOME-01:todo |
| H2 | Home | built | differs | recorded; pair `H2.png` | HOME-02:done |
| H3 | Home | built | differs | recorded; pair `H3.png` | HOME-02:done |
| H4 | Home | built | differs | recorded; pair `H4.png` | HOME-02:done |
| H5 | Home | built | differs | recorded; pair `H5.png` | HOME-02:done |
| H6 | Home | built | differs | recorded; pair `H6.png` | HOME-02:done |
| H7 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H8 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H9 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H10 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H11 | Home | missing | unbuilt | later task HOME-01 | HOME-01:todo |
| H12 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H13 | Home | missing | unbuilt | later task HOME-07 | HOME-07:todo |
| H14 | Home | built | differs | recorded; pair `H14.png` | HOME-12:todo, UI-02:done, MONEY-03:done |
| H15 | Home | built | conforms | (dev harness, sheet only); pair `H15.png` | HOME-12:todo, MONEY-02:done |
| H16 | Home | missing | unbuilt | later task HOME-12 | HOME-12:todo |
| H17 | Home | missing | unbuilt | later task HOME-12 | HOME-12:todo |
| H18 | Home | missing | unbuilt | later task HOME-12 | HOME-12:todo |
| H19 | Home | missing | unbuilt | later task HOME-03 | HOME-03:todo |
| H20 | Home | missing | unbuilt | later task HOME-03 | HOME-03:todo |
| H21 | Home | missing | unbuilt | later task HOME-03 | HOME-03:todo |
| H22 | Home | missing | unbuilt | later task HOME-03 | HOME-03:todo |
| H23 | Home | missing | unbuilt | later task HOME-03 | HOME-03:todo |
| H24 | Home | missing | unbuilt | later task HOME-08 | HOME-08:todo |
| H25 | Home | missing | unbuilt | later task HOME-08 | HOME-08:todo |
| H26 | Home | missing | unbuilt | later task HOME-13 | HOME-13:todo |
| H27 | Home | missing | unbuilt | later task HOME-13 | HOME-13:todo |
| H28 | Home | missing | unbuilt | later task HOME-13 | HOME-13:todo |
| H29 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H30 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H31 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H32 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H33 | Home | missing | unbuilt | later task ADS-01 | ADS-01:todo |
| H34 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H35 | Home | missing | unbuilt | later task HOME-09 | HOME-09:todo |
| H36 | Home | missing | unbuilt | later task HOME-01 | HOME-01:todo |
| I1 | Inbox | needs-ruling | unbuilt | tab body is a placeholder; the bar built from this artboard conflicts with R-38 text (F-2) | INBOX-04:todo, SHELL-01:done, UI-02:done |
| I35 | Inbox | missing | unbuilt | later task INBOX-04 | INBOX-04:todo |
| I36 | Inbox | missing | unbuilt | later task INBOX-04 | INBOX-04:todo |
| I2 | Inbox | missing | unbuilt | later task INBOX-10 | INBOX-10:todo |
| I3 | Inbox | missing | unbuilt | later task INBOX-10 | INBOX-10:todo |
| I4 | Inbox | missing | unbuilt | later task INBOX-10 | INBOX-10:todo |
| I5 | Inbox | missing | unbuilt | later task INBOX-10 | INBOX-10:todo |
| I6 | Inbox | missing | unbuilt | later task INBOX-11 | INBOX-11:todo |
| I7 | Inbox | missing | unbuilt | later task INBOX-11 | INBOX-11:todo |
| I8 | Inbox | missing | unbuilt | later task INBOX-11 | INBOX-11:todo |
| I9 | Inbox | missing | unbuilt | later task INBOX-18 | INBOX-18:todo |
| I10 | Inbox | missing | unbuilt | later task INBOX-18 | INBOX-18:todo |
| I11 | Inbox | missing | unbuilt | later task INBOX-18 | INBOX-18:todo |
| I12 | Inbox | missing | unbuilt | later task INBOX-19 | INBOX-19:todo |
| I13 | Inbox | missing | unbuilt | later task INBOX-19 | INBOX-19:todo |
| I14 | Inbox | missing | unbuilt | later task INBOX-19 | INBOX-19:todo |
| I15 | Inbox | missing | unbuilt | later task INBOX-19 | INBOX-19:todo |
| I16 | Inbox | missing | unbuilt | later task INBOX-20 | INBOX-20:todo |
| I17 | Inbox | missing | unbuilt | later task INBOX-20 | INBOX-20:todo |
| I18 | Inbox | missing | unbuilt | later task INBOX-20 | INBOX-20:todo |
| I19 | Inbox | missing | unbuilt | later task INBOX-20 | INBOX-20:todo |
| I20 | Inbox | missing | unbuilt | later task INBOX-20 | INBOX-20:todo |
| I21 | Inbox | missing | unbuilt | later task INBOX-12 | INBOX-12:todo |
| I22 | Inbox | missing | unbuilt | later task INBOX-12 | INBOX-12:todo |
| I23 | Inbox | missing | unbuilt | later task INBOX-12 | INBOX-12:todo |
| I24 | Inbox | missing | unbuilt | later task INBOX-05 | INBOX-05:todo |
| I25 | Inbox | missing | unbuilt | later task INBOX-05 | INBOX-05:todo |
| I26 | Inbox | missing | unbuilt | later task INBOX-05 | INBOX-05:todo |
| I27 | Inbox | missing | unbuilt | later task INBOX-13 | INBOX-13:todo |
| I28 | Inbox | missing | unbuilt | later task INBOX-13 | INBOX-13:todo |
| I29 | Inbox | missing | unbuilt | later task INBOX-13 | INBOX-13:todo |
| I30 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| I31 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| I37 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| I32 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| I33 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| I34 | Inbox | missing | unbuilt | later task INBOX-14 | INBOX-14:todo |
| M1 | Me | needs-ruling | unbuilt | tab body is a placeholder; the bar built from this artboard conflicts with R-38 text (F-2) | UI-03:done, SHELL-01:done, ME-01:todo |
| M2 | Me | missing | unbuilt | later task ME-01 | ME-01:todo |
| M3 | Me | ruled-no-artboard | n/a | R-9 (no Shop tab) |  |
| M4 | Me | missing | unbuilt | later task ME-01 | ME-01:todo |
| M5 | Me | missing | unbuilt | later task ME-02 | ME-02:todo |
| M6 | Me | missing | unbuilt | later task ME-02 | ME-02:todo |
| M7 | Me | missing | unbuilt | later task ME-03 | ME-03:todo |
| M33 | Me | missing | unbuilt | later task ME-02 | ME-02:todo |
| M34 | Me | missing | unbuilt | later task ME-11 | ME-11:todo |
| M35 | Me | missing | unbuilt | later task ME-11 | ME-11:todo |
| M36 | Me | missing | unbuilt | later task ME-11 | ME-11:todo |
| M8 | Me | built | differs | recorded + unclear; pair `M8.png` | ME-06:done |
| M9 | Me | built | conforms | real stack; pair `M9.png` | ME-06:done |
| M10 | Me | missing | unbuilt | later task ME-01 | ME-01:todo |
| M11 | Me | missing | unbuilt | later task ME-12 | ME-12:todo |
| M12 | Me | missing | unbuilt | later task ME-12 | ME-12:todo |
| M13 | Me | built | conforms | (dev harness, sheet only); pair `M13.png` | MONEY-02:done, ME-12:todo |
| M14 | Me | missing | unbuilt | later task ME-12 | ME-12:todo |
| M15 | Me | missing | unbuilt | later task ME-13 | ME-13:todo |
| M16 | Me | missing | unbuilt | later task ME-13 | ME-13:todo |
| M17 | Me | missing | unbuilt | later task ME-13 | ME-13:todo |
| M18 | Me | missing | unbuilt | later task ME-07 | ME-07:todo |
| M19 | Me | missing | unbuilt | later task ME-04 | ME-04:todo |
| M20 | Me | missing | unbuilt | later task ME-04 | ME-04:todo |
| M21 | Me | missing | unbuilt | later task ME-04 | ME-04:todo |
| M22 | Me | missing | unbuilt | later task ME-04 | ME-04:todo |
| M23 | Me | missing | unbuilt | later task ME-08 | ME-08:todo |
| M24 | Me | missing | unbuilt | later task ME-08 | ME-08:todo |
| M25 | Me | missing | unbuilt | later task ME-08 | ME-08:todo |
| M28 | Me | missing | unbuilt | later task ME-07 | ME-07:todo |
| M26 | Me | missing | unbuilt | later task ME-07 | ME-07:todo |
| M27 | Me | missing | unbuilt | later task ME-07 | ME-07:todo |
| M37 | Me | missing | unbuilt | later task ME-08 | ME-08:todo |
| M29 | Me | missing | unbuilt | later task ME-14 | ME-14:todo |
| M30 | Me | missing | unbuilt | later task ME-14 | ME-14:todo |
| M31 | Me | missing | unbuilt | later task ME-14 | ME-14:todo |
| M32 | Me | missing | unbuilt | later task ME-14 | ME-14:todo |
| P1 | Professionals | missing | unbuilt | later task PROS-01 | PROS-01:todo |
| P2 | Professionals | missing | unbuilt | later task PROS-01 | PROS-01:todo |
| P3 | Professionals | missing | unbuilt | later task PROS-01 | PROS-01:todo |
| P4 | Professionals | missing | unbuilt | later task PROS-01 | PROS-01:todo |
| P5 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| P6 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| P7 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| P8 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| P9 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| P10 | Professionals | missing | unbuilt | later task PROS-03 | PROS-03:todo |
| SC1 | Schools | missing | unbuilt | later task SCHOOLS-03 | SCHOOLS-03:todo |
| SC2 | Schools | missing | unbuilt | later task SCHOOLS-03 | SCHOOLS-03:todo |
| SC3 | Schools | missing | unbuilt | later task SCHOOLS-03 | SCHOOLS-03:todo |
| SC4 | Schools | missing | unbuilt | later task SCHOOLS-06 | SCHOOLS-06:todo |
| SC5 | Schools | missing | unbuilt | later task SCHOOLS-06 | SCHOOLS-06:todo |
| SC6 | Schools | missing | unbuilt | later task SCHOOLS-06 | SCHOOLS-06:todo |
| SC7 | Schools | missing | unbuilt | later task SCHOOLS-06 | SCHOOLS-06:todo |
| SC8 | Schools | missing | unbuilt | later task SCHOOLS-08 | SCHOOLS-08:todo |
| SC9 | Schools | missing | unbuilt | later task SCHOOLS-08 | SCHOOLS-08:todo |
| SC10 | Schools | missing | unbuilt | later task SCHOOLS-03 | SCHOOLS-03:todo |
| SC11 | Schools | missing | unbuilt | later task SCHOOLS-06 | SCHOOLS-06:todo |
| S2 | Services | missing | unbuilt | later task BILLS-01 | BILLS-01:todo |
| S3 | Services | missing | unbuilt | later task BILLS-01 | BILLS-01:todo |
| S4 | Services | missing | unbuilt | later task BILLS-01 | BILLS-01:todo |
| S5 | Services | missing | unbuilt | later task BILLS-02 | BILLS-02:todo |
| S6 | Services | missing | unbuilt | later task BILLS-02 | BILLS-02:todo |
| S7 | Services | missing | unbuilt | later task BILLS-02 | BILLS-02:todo |
| S8 | Services | missing | unbuilt | later task BILLS-03 | BILLS-03:todo |
| S9 | Services | missing | unbuilt | later task BILLS-03 | BILLS-03:todo |
| S10 | Services | missing | unbuilt | later task BILLS-01 | BILLS-01:todo |
| S11 | Services | missing | unbuilt | later task BILLS-02 | BILLS-02:todo |
| S12 | Services | missing | unbuilt | later task BILLS-02 | BILLS-02:todo |
| S13 | Services | missing | unbuilt | later task BILLS-01 | BILLS-01:todo |
| S27 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S28 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S29 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S30 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S31 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S32 | Services | missing | unbuilt | later task BILLS-05 | BILLS-05:todo |
| S14 | Services | missing | unbuilt | later task LEGAL-02 | LEGAL-02:todo |
| S15 | Services | missing | unbuilt | later task LEGAL-02 | LEGAL-02:todo |
| S16 | Services | missing | unbuilt | later task LEGAL-02 | LEGAL-02:todo |
| S17 | Services | missing | unbuilt | later task LEGAL-02 | LEGAL-02:todo |
| S18 | Services | missing | unbuilt | later task LEGAL-04 | LEGAL-04:todo |
| S19 | Services | missing | unbuilt | later task LEGAL-04 | LEGAL-04:todo |
| S20 | Services | missing | unbuilt | later task LEGAL-04 | LEGAL-04:todo |
| S21 | Services | missing | unbuilt | later task LEGAL-06 | LEGAL-06:todo |
| S22 | Services | missing | unbuilt | later task LEGAL-06 | LEGAL-06:todo |
| S23 | Services | missing | unbuilt | later task LEGAL-06 | LEGAL-06:todo |
| S24 | Services | missing | unbuilt | later task LEGAL-06 | LEGAL-06:todo |
| S26 | Services | missing | unbuilt | later task LEGAL-06 | LEGAL-06:todo |
| S25 | Services | missing | unbuilt | later task LEGAL-04 | LEGAL-04:todo |
| Z1 | Settings | missing | unbuilt | later task ME-03 | ME-03:todo |
| Z2 | Settings | missing | unbuilt | later task SETTINGS-01 | SETTINGS-01:todo |
| Z3 | Settings | missing | unbuilt | later task SETTINGS-01 | SETTINGS-01:todo |
| Z4 | Settings | missing | unbuilt | later task SETTINGS-01 | SETTINGS-01:todo |
| Z5 | Settings | missing | unbuilt | later task SETTINGS-01 | SETTINGS-01:todo |
| Z6 | Settings | missing | unbuilt | later task SETTINGS-05 | SETTINGS-05:todo |
| Z7 | Settings | missing | unbuilt | later task SETTINGS-05 | SETTINGS-05:todo |
| Z8 | Settings | missing | unbuilt | later task SETTINGS-05 | SETTINGS-05:todo |
| Z9 | Settings | built | differs | recorded; pair `Z9-fixture.png` | SETTINGS-02:done |
| Z10 | Settings | built | conforms | (fixture document); pair `Z10-fixture.png` | SETTINGS-02:done |
| Z11 | Settings | built | conforms | (fixture document); pair `Z11.png` | SETTINGS-02:done |
| Z12 | Settings | missing | unbuilt | later task SETTINGS-01 | SETTINGS-01:todo |
| SH1 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH2 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH3 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH4 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH5 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH6 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH7 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH8 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH9 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH10 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH11 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH12 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH13 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH14 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| SH15 | Shop | ruled-no-artboard | n/a | R-2 (Shop retired) |  |
| W1 | Wallet | needs-ruling | unbuilt | tab body is a placeholder; the bar built from this artboard conflicts with R-38 text (F-2) | SHELL-01:done, WALLET-01:todo, UI-01:done |
| W2 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W3 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W4 | Wallet | missing | unbuilt | later task WALLET-01 | WALLET-01:todo |
| W5 | Wallet | missing | unbuilt | later task WALLET-01 | WALLET-01:todo |
| W6 | Wallet | missing | unbuilt | later task WALLET-01 | WALLET-01:todo |
| W7 | Wallet | built | unverified | component reference; shown only on the dev showcase `/dev/components`, no user route | UI-03:done, WALLET-02:todo |
| W8 | Wallet | missing | unbuilt | later task WALLET-03 | WALLET-03:todo |
| W9 | Wallet | built | unverified | component reference; shown only on the dev showcase `/dev/components`, no user route | WALLET-02:todo, UI-01:done |
| W10 | Wallet | built | differs | recorded; pair `W10.png` | WALLET-02:todo, MONEY-03:done |
| W11 | Wallet | built | conforms | (dev harness, sheet only); pair `W11.png` | MONEY-02:done, WALLET-02:todo |
| W12 | Wallet | missing | unbuilt | later task WALLET-02 | WALLET-02:todo |
| W13 | Wallet | missing | unbuilt | later task WALLET-03 | WALLET-03:todo |
| W14 | Wallet | missing | unbuilt | later task WALLET-03 | WALLET-03:todo |
| W15 | Wallet | missing | unbuilt | later task WALLET-05 | WALLET-05:todo |
| W16 | Wallet | missing | unbuilt | later task WALLET-36 | WALLET-36:todo |
| W17 | Wallet | missing | unbuilt | later task WALLET-05 | WALLET-05:todo |
| W19 | Wallet | missing | unbuilt | later task WALLET-05 | WALLET-05:todo |
| W18 | Wallet | ruled-no-artboard | n/a | R-28 |  |
| W20 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W21 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W22 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W23 | Wallet | missing | unbuilt | later task WALLET-21 | WALLET-21:todo |
| W24 | Wallet | missing | unbuilt | later task WALLET-20 | WALLET-20:todo |
| W25 | Wallet | missing | unbuilt | later task WALLET-20 | WALLET-20:todo |
| W26 | Wallet | built | unverified | component reference; shown only on the dev showcase `/dev/components`, no user route | WALLET-04:todo, UI-02:done |
| W27 | Wallet | missing | unbuilt | later task WALLET-04 | WALLET-04:todo |
| W28 | Wallet | missing | unbuilt | later task WALLET-04 | WALLET-04:todo |
| W41 | Wallet | missing | unbuilt | later task WALLET-12 | WALLET-12:todo |
| W42 | Wallet | missing | unbuilt | later task WALLET-12 | WALLET-12:todo |
| W43 | Wallet | missing | unbuilt | later task WALLET-12 | WALLET-12:todo |
| W29 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W30 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W31 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W33 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W34 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W32 | Wallet | missing | unbuilt | later task WALLET-22 | WALLET-22:todo |
| W35 | Wallet | missing | unbuilt | later task WALLET-06 | WALLET-06:todo |
| W36 | Wallet | missing | unbuilt | later task WALLET-06 | WALLET-06:todo |
| W37 | Wallet | missing | unbuilt | later task WALLET-06 | WALLET-06:todo |
| W38 | Wallet | missing | unbuilt | later task WALLET-35 | WALLET-35:todo |
| W39 | Wallet | missing | unbuilt | later task WALLET-13 | WALLET-13:todo |
| W40 | Wallet | ruled-no-artboard | n/a | R-11 |  |

## Owner sign-off

_Owner: date, and "go" or what blocks it._
