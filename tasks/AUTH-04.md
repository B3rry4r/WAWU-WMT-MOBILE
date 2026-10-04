---
id: AUTH-04
title: Sign-up: email and phone
owner: DEV
area: AUTH
order: 51
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: done
depends_on: [AUTH-02, AUTH-03, AUTH-05, UI-02]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A3, A4, A15]
---
# AUTH-04 · Sign-up: email and phone

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A3 A4 A15` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for A3, A4 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A3 · Email, phone, BVN**: Create account form, heading along the lines of 'Create your account': Email, Phone number, Password ('At least 8 characters'); Continue. No BVN field and no NIBSS line (BRIEF A3, R-6).
- **A4 · Phone code**: Verify your phone: 6-digit code 'Sent by SMS to 0803 ••• 4412' (without 'the number on your BVN': there is no BVN at sign-up; recorded in BRIEF), resend countdown 0:42, numeric keypad.
- **A15 · Wrong code**: A4 with 6 digits entered and 'That code isn't right'.

## Ruling R-6

Sign-up asks for no BVN. A3 is built without its BVN field; the BVN is asked when the user first opens a wallet (A26, KYC-05). A14 (phone doesn't match BVN) moved there too.

## Brief changes (build these, not the canvas)

- **A3**: sign-up only: Email, Phone number, Password. No BVN field, and no line about NIBSS. Heading along the lines of "Create your account". (Why: R-6.)
- **A4**: "Sent by SMS to 0803 ••• 4412". No BVN at sign-up. (Why: R-6.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A4: the accepted code (opens A11): added by AUTH-06

## Capability checks

- [ ] **A3**: a user can enter email, phone and password and tap Continue (-> A4).
- [ ] **A4**: a user can enter 6-digit code; resend after countdown.
- [ ] **A15**: a user can re-enter; resend.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as is the drawn state A15.
- [ ] From A2 (AUTH-02), a user who taps Continue reaches A3 (this task adds that step).

## What the backend serves today (from the analysis)

- **A3**: partial. Missing: No BVN field, no BVN lookup, no phone-vs-BVN match anywhere. Register requires `country` (not on board) and has no place to store BVN or a BVN-verified flag. Names are required for wallet opening (wallet.service.ts openForAccount) but the board collects none; they must come from the BVN response.
- **A4**: partial. Missing: otp/verify is a phone-LOGIN: it find-or-creates a phone-only WawuUser and issues tokens (auth.service.ts:713-748); it does not mark a registering account's phone as verified - WawuUser has no phoneVerified column. Delivery is WhatsApp, not SMS. No resend throttle beyond replacing the previous code. Separately: WAWU ID login refuses accounts with an unverified email (auth.service.ts:206-213 EMAIL_NOT_VERIFIED), and this board path never verifies the email, so a user created this way cannot sign in on A22 later.
- **A15**: partial. Missing: Error exists, but see A4: the route is a phone login, not registration phone verification; no attempt counter/lockout.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A3: 'Must be the number on your BVN'
- A3: 'Dial *565*0# to get it' (USSD code)
- A3: 'Checked with NIBSS. We never see your balances.'
- A3: password 'At least 8 characters' (matches WAWU ID MinLength(8))
- A4: 'Enter the 6-digit code'
- A4: 'Sent by SMS'
- A4: 'Resend in 0:42'
- A14: phone must equal the BVN-registered phone

## Designer notes (⚠, unresolved)

- None.

## Builder report

Base: `origin/main` c42595b (it contains `origin/wmt/AUTH-05`; branch `wmt/AUTH-04` fast-forwarded to it, no later main change). Nothing committed or pushed. Evidence: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-04/` (`live-walk.txt`, `walk/` shots, `shots/` every state, `revert-proof.txt`, `check-before.txt`, `check-mid.txt`).
- **Files:** new `src/features/auth/{SignUpScreen,CodeScreen,signupFlow,signupStore,signupGate,signupApi,signupFailure,useCountdown}`, routes `src/app/{sign-up,phone-code,email-code}.tsx`, `src/__tests__/auth-signup.test.tsx` (44 tests). Edited: `src/api/identity.ts` (8 sign-up calls from `identity.generated.ts`), `errors.ts` (`retryAfterSeconds`), `session.ts` (`adoptSession`), `app/_layout.tsx`, `account-type.tsx` (Continue), `welcome.tsx`, `sign-in.tsx`, `preview/auth.tsx`, `accountType.ts`; tests `auth-welcome` (A2 Continue now drawn) and `identity-contract` extended. Fenced edits are rows AUTH-04 #1 to #3 in SHARED-CHANGES; F1 done, F2 email step done (A11 to A13 stay AUTH-06's).
- **Checks (all by behaviour tests through the real route graph with a fetch stub, plus a live walk):** A3 (fields, rules, every refusal kept with what was typed; earn sends `creator`, discover `user`, none sends none, nothing goes to the Hub); A2 to A3 (Continue waits for a pick); A4 (6 digits sign in with the issued session, countdown is the server's `resendIn`, Resend after zero and the server's new figure, RESEND_TOO_SOON wait, email code field + `emailCode` when `emailCodeRequired`); A15 (wrong code keeps digits, Delete or a digit re-enters, fourth 400 in a row ends the sign-up, LOCKED shows `retryAfterSeconds` ticking with keys off); resume (welcome, a browser reload on the code address, a sign-in refused as not confirmed, `details` clears the secret, offline keeps it); email step (opens before Home, prove, Later, wrong and locked, resume, web account skips it).
- **Revert proofs:** 17 changes each fail 1 to 6 tests when removed, files restored by sha1 (`revert-proof.txt`). Keys-off while locked is guarded twice (Keypad `inactive` and `onDigit`), so removing one alone fails nothing.
- **Live walk (V9, V7), local stack:** wawu-id at `origin/wmt/AUTH-05`, Hub at `origin/main` 7601a5f, own DBs `a04_*`, ports 5701 to 5705, a local receiver for Fintava `/sms/send`, mail codes read from the wawu-id log. Playwright on the web export at 390 px, an earning and a discovering user: A2, A3, A4, quit and reopen, wrong code, right code, email step (proved / Later), quit on it and reopen, Home, cold start, Hub `users/me` accepts the session, sign out and back in: 32 of 32. The receiver saw only `/sms/send`; the Hub holds 0 rows in CreatorWallet, FintavaWallet, WalletIdentity, KycSubmission. Found and fixed by it: a reload on `/phone-code` found no state (now the route resumes itself).
- **Counts:** `npm run check` before 21 suites 377 tests, gates 98 files 0 findings, 203 tasks; after exit 0, 25 suites 457 tests, gates 120 files 0 findings, lint 0 warnings.
- **Screenshots:** a dev build serves `/preview/auth?screen=sign-up|phone-code|email-code|account-type` (parameters in the header of `src/app/preview/auth.tsx`: `digits`, `wrong=1`, `resend`, `extra=1`, `answer=badcode|locked|busy|offline|server|conflict|phone|sms`, `lockfor`, `continue=1`); `npx expo export --dev --platform web`, serve with an SPA fallback, 390 px, `color_scheme` light and dark. Compare with `python3 scripts/design/render_design.py A3 A4 A15`. The renders carry a status bar the app does not draw, so offsets differ by it. `.expo/types` is regenerated by `npx expo start` (git-ignored): run it once if `tsc` does not know the new routes.
- **Defaults (agent), owner may override:** (1) A3 heading "Let's get you started" with "We'll text a code to your phone." (BRIEF only says "along the lines of Create your account", which is the bar title as drawn). (2) The A4 phone field has no hint (the BVN hint is gone, R-6). (3) The email code field beside the boxes on A4 (`emailCodeRequired`) is a plain field with "We also emailed a code to confirm your email address."; no artboard draws it. (4) Email step copy: bar "Check your email", the A4 heading, "Sent to <address>", Resend, and "Later"; no artboard. (5) The fourth consecutive wrong-code 400 ends the sign-up (G-18 N-1; G-13 said third). (6) A locked or rate-limited answer clears the boxes and shows "Too many tries. Try again in m:ss." with the server's seconds. (7) A progress read that fails lets the user into the app; the next start reads again. (8) A sign-up secret is kept after sign-in (a held sign-up for another number survives) and dropped when confirmed, replaced, or ended. (9) `accountType` goes to wawu-id only; nothing is sent to the Hub (G-34).
- **Gaps:** G-13, G-18, G-27 updated; no new G-number. U-6/U-7/N-2/N-3 (G-18) untouched.
- **NOT RUN:** a phone or emulator (V10; web export only, no device); real Fintava `/sms/send` and real mail (G-15, G-42); the screen reader pass on a device; autofill hints on a phone keyboard (set on the fields, not observable on the web build); the Hub's creator wallet path at `PATCH /users/me` is not exercised (the app never calls it, G-34). Unblocked by a development build on a phone and the sandbox text price (G-42).

### Builder report (fix round 1)

Base unchanged (`origin/main` c42595b, nothing newer); edits are uncommitted on top of 61553d4. Evidence: `.../scratchpad/AUTH-04/` (`live-walk-fix1.txt`, `live-walk-fix1-f3.txt`, `walk2/` shots light and dark, `revert-proof-fix1.txt`).
- **F1 fixed:** an ended sign-up shows Start again only (no Resend line or countdown, `askAgain` refuses); Start again goes back to A3 and clears the secret. **F2 fixed:** `startSignup` no longer clears the secret first; a refused, offline or failed Continue keeps it. A 429 too soon now reads "A code was just sent. Wait m:ss before sending another, or enter the one we sent." (server seconds), and A3 shows an "Enter the code we sent" link while a sign-up is held (follows the secret on focus). A reloaded code screen got a Back that opens A3.
- **F3 fixed:** boxes `flexShrink: 1`, row `alignSelf: stretch`; measured in the browser: 320 px boxes 39.2 wide, 20 to 300; 360 px 45.8; 390 px 46 (kit size, 34.5 to 355.5). **F4 fixed:** `LeaveDevRoute` sends a signed-in user on the email step to `/email-code`; proved on a production export, signed in on the email step (`/preview/auth`, `/dev/components`, `/preview/pin-sheet` show the email step) and signed out (welcome). **F5 fixed:** a refused or offline sixth digit shows the banner and a "Try again" button, and the next tapped digit starts a fresh code (with an email code field, Continue is the retry). **F9:** two same-frame taps on A3 Continue and on the code screen's Continue each send one request; both guards now fail a test when removed.
- **F7:** the web build now keeps the secret in `sessionStorage` (tab only; reload resumes, a closed tab forgets; native stays in the secure store). Default (agent), owner may override: web is a development and preview target; the secret never appears in a URL, log or screenshot. **F12:** G-93 filed (the text says "WAWU code"; wawu-id's wording, no code here). A sign-in of a never-confirmed sign-up with nothing held here (the server answers EMAIL_NOT_VERIFIED by email, PHONE_NOT_CONFIRMED by phone) now says to create the account again to get a new code (an unconfirmed sign-up gives its email and phone to a new one); the AUTH-01 test rows for those two banners were updated to the new words, not loosened.
- **F10 (unclear, recorded):** the server leaves `email_verified` false after the `emailCode` check on A4, so the email step asks for a second mailed code; the app follows the server's progress and shows it. Fix belongs to wawu-id (G-94); until then it is harmless. The step cannot name the address after a reload ("Sent to your email address") because the progress answer carries none (G-94).
- **F6, F8 (unclear):** no change. A4's boxes under a 420 px-high window and keypad-only entry (no one-time-code autofill) follow the drawn design; a hidden input would change the screen. Unblocked by an Android development build to see the real keyboard and safe areas, and an owner call on a visible code field. **F11 owner note, not changed (the design decides colours):** muted text on the light page measures 3.15:1 (Resend line, hints) and the light-mode danger line 4.19:1, both below 4.5:1; dark mode passes (muted 4.16).
- **Revert proofs (sha1 restored):** 14 changes each fail 1 to 4 tests when removed (`revert-proof-fix1.txt`); the `askAgain` dead guard fails none because the Resend control is gone in that state (the UI test covers it).
- **Counts:** `npm run check` exit 0 (below), live re-walk of the failure paths on a local wawu-id (origin/wmt/AUTH-05) and Hub (origin/main), real 429 inside the resend gap, request aborted (offline) and 500 injected in the browser: all PASS at 390 px light and dark; boxes measured at 320, 360, 390. Servers, worktrees and `a04f_*` databases removed.
- **NOT RUN:** as before (phone or emulator, real Fintava text and mail, device screen reader); F12's wording fix in wawu-id waits for its owner (G-93).

## Verifier report

Verified as it lands: `git diff origin/main...HEAD` at 61553d4 (main c42595b). Local stack: wawu-id origin/main dbcb2f8 (AUTH-05 merged) and Hub origin/main 7601a5f in worktrees, own Postgres `a04v_id`/`a04v_hub` on port 5810, a local receiver standing in for Fintava `/sms/send`, mail codes read from the wawu-id log. Config overrides for speed (recorded): resend gap 15 s, lockout 30 s, raised per-IP limits. Everything stopped and removed afterwards. Evidence: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-04-v1/` (`check.txt`, `reverts.txt`, `walk/`, `shots/`, `design/`, `walk*.py`, `walk8.out`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed with notes | `npm run check` exit 0: 25 suites, 457 tests, gates 9 run / 120 files / 0 findings, lint clean, 204 tasks (`check.txt`). File list equals the builder's (plus docs). No em-dashes, no TODO-type comments, no hex/rgb, icons via `@/components/icon`, API types from `identity.generated.ts`, BVN/NIBSS only in comments and negative tests. 15 kit constants checked against `design/_gen/kit.js` lines 41, 45, 53 and `auth.js` lines 54, 55: all match. 13 reverts: 11 killed (attempt on confirm, attempt on resend, server countdown, 4th-wrong start again, emailCodeRequired field, resume gate, earn mapping, discover mapping, adoptSession, progress gate, keys-off), 2 survive (the `inFlight` double-tap guards in `CodeScreen` and `SignUpScreen`; finding F9). Tree restored by sha1 each time (`reverts.txt`). Tests in the AUTH-01/02/22 files still pass; they log many "No route named sign-up" warnings (route sets in those tests predate the new routes). |
| V4 | passed with notes | email, phone (typed `0803 000 2222`, server stores `+2348030002222`, A4 masks to `0803 ••• 2222`), password (sent once, never stored or logged), pick (`earn` to `creator`, `discover` to `user`, none sends none, only to wawu-id, checked in the request bodies and `account_type` in the id DB), `resendIn`/`retryAfterSeconds` (server figures on screen), attempt (secure store, see F7 for web), progress step (server `GET /auth/signup/progress`). |
| V5 | passed with differences below | A3, A4, A15 at 390 light and dark beside the renders (`shots/cmp-A*`), 390x420, 320x568 (`shots/sheet-*`, `walk/sheet-w14-*`). Matches: header, boxes 46x56, gaps, keypad, error line, buttons, colours. |
| V6 | passed with defects | real causes: PHONE_CODE_INVALID, PHONE_CODE_LOCKED (live countdown, keys off), 4th consecutive 400 on a replaced secret (Start again), RESEND_TOO_SOON (two tabs), RATE_LIMITED (40:31 shown), PHONE_NOT_SUPPORTED, PHONE_INVALID, SMS_SEND_FAILED, SMS_NOT_CONFIGURED, 409 duplicates (web account, seeded user), offline, 500 (Postgres stopped) on A3 and A4, SIGNUP_STEP_OUT_OF_ORDER (stale Later), EMAIL_CODE_LOCKED, PHONE_NOT_CONFIRMED (sign-in resumes A4), double tap sends one request, empty and invalid input. PHONE_ALREADY_CONFIRMED: NOT RUN live (the server raises it only when two confirms with the same code race; a resend after a confirm answers 200 with no text). |
| V7 | passed with defects | cold start and resume as earning, discovering and no-pick users; quit/reopen at welcome, A4, email step; reload on `/phone-code` and `/email-code`; wrong then right code; lockout; resend; Start again; token-cleared and signed back in; web-registered account (409 on sign-up, signs in to Home with no email step); signed-in deep links to all five signed-out routes land on Home; production export signed out and in (see F4). Network: only wawu-id (5811) and the static host; zero Hub requests during sign-up; Hub DB: CreatorWallet, FintavaWallet, WalletIdentity 0 rows, KycSubmission unchanged (2 seeded). |
| V9 | passed | real signup, SMS body carries the code (`walk8.out`), confirm issues the first session, Hub `GET /users/me` with it returns the server's record (sub, email, phone), sign back in works. |

Capability checks: A3 (enter and Continue to A4) passed. A4 (6 digits, resend after countdown) passed. A15 (re-enter, resend) passed. Picture checks passed with the differences below. Values from API or user: passed. States by real cause: passed with F1, F2, F5. A2 Continue reaches A3: passed. A4's accepted code opening A11 belongs to AUTH-06.

### Findings

- **F1 defect, low-medium.** On the "This sign-up has ended" screen the Resend link is still offered. Tapping it shows "Resend in 0:14" and "We sent a new code." though the server answered 200 and sent no text (receiver count unchanged: `walk/w5-deadresend-*`). The same false line appears for any resend the server silently skips. `CodeScreen.askAgain` does not check the dead phase.
- **F2 defect, low-medium.** A3 Continue calls `clearSignup()` before the server answers. Back from A4, edit, Continue inside the resend gap answers 429 "Too many tries ... Try again in 0:13" and the held secret is gone (storage empty, reload opens welcome), although the first text's code is still live. Offline or a 500 do the same. The user must wait out the gap and pay for a new text. Copy "Too many tries" is also wrong for a correction.
- **F3 defect, low.** At 320 px width the six boxes (6x46 + 5x9 = 321) are wider than the 280 px content width and overflow both edges; the sixth is clipped (`walk/sheet-w14-320.png`).
- **F4 defect, low.** In a release build a signed-in user who is on the email step and opens any dev route (`/preview/auth`, `/dev/components`, `/preview/pin-sheet`) sees a blank page: `LeaveDevRoute` redirects to `/`, which the new `needsEmail` guard removes. Signed out and past the email step they redirect correctly.
- **F5 defect, low.** After a 500 or offline answer to the sixth digit the digits stay in the boxes, further digit taps do nothing and there is no Retry; the user must Delete one digit and retype it, and nothing says so.
- **F6 unclear, low.** 390x420: A4's boxes and resend line are clipped under the keypad and the screen does not scroll; with the email-code field the title is cut. 
- **F7 unclear, medium for the owner.** The `attempt` secret is in `localStorage` on the web build (as the session tokens are). Not in any URL, console, server log or screenshot. The task asks that it never appear in web storage; the builder's design says the browser build is development only, but a production web export does run it.
- **F8 unclear, low.** The code is keypad-only: no text input, so no one-time-code autofill on Android and a hardware keyboard cannot type it (only the email-code field carries autofill hints). Matches the drawn design. No focus ring on keypad keys (shared component).
- **F9 unclear, low (test gap).** Removing either `inFlight` double-tap guard fails no test; live behaviour with the guards is one request.
- **F10 unclear, low.** After a `emailCodeRequired` sign-up the user types the mailed code on A4 and is then asked for the email step again (server leaves `email_verified` false; AUTH-05 side). The email step after a resume or reload shows "Sent to your email address" because the address is only known from a fresh send.
- **F11 unclear, low.** Contrast of the design's own tokens: muted text on the light page is 3.15:1 (Resend line, hints) and the light danger line 4.19:1, below 4.5. Dark passes (4.16 muted, rest above 7).
- **F12 unclear, low.** The text message wording is "Your WAWU code is ..." (wawu-id, AUTH-03). A sign-in of an unconfirmed account with no held secret says "Finish confirming it, then sign in." with no way to do it except a new sign-up.
- **differs-for-recorded-reason:** A3 has no BVN field, NIBSS line or BVN hints (R-6, BRIEF A3); A4 subtitle without "the number on your BVN" (R-6, R-36, BRIEF A4); heading "Let's get you started" and the email step copy are recorded builder defaults (1) and (4); no status bar or home indicator drawn (web build); A3 phone has no tabular letter-spacing (kit `mono`; TextField lacks it); A1/A2 text changes are R-37 and G-34 (AUTH-02).
- Fenced edits (`_layout.tsx`, `session.ts`, `errors.ts`, `identity.ts`) are recorded as AUTH-04 #1 to #3 and are needed; same practice as AUTH-01 #1 and AUTH-05 #3.

### NOT RUN

Phone or emulator, V10, Android safe areas and the system keyboard (web export only; unblocked by a development build on a phone). Real Fintava `/sms/send` and real mail (G-42; a stand-in receiver was used). Screen reader pass and keyboard autofill on a device. PHONE_ALREADY_CONFIRMED live (needs a concurrent confirm race). Sign-out from a screen (none exists yet; token removal and reload used instead).

Status: back to `building` for F1 to F5.

## Verifier report (round 2)

Verified at 5b782ed (fixes in 482f6a7, merged with main 6bc420e). Local stack: wawu-id origin/main dbcb2f8 and Hub origin/main 1e6b807 in worktrees under `/home/user/lanes/a04w/`, own databases `a04w_id` and `a04w_hub` on the system Postgres, a local receiver standing in for Fintava `/sms/send`, mail codes read from the wawu-id log. Config overrides for speed (recorded): resend gap 15 s, lockout 30 s, raised per-IP limits. Web export (`--dev` and production, exported to the scratchpad, never into the repo) driven by Playwright at 390 px light and dark, plus 320 and 360 px. Everything stopped, dropped and removed afterwards. Evidence: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-04-v2/` (`check.txt`, `reverts.txt`, `f1.py` to `f9.py`, `reg.py`, `a01.py`, `lock*.py`, `walk/`, `shots/sheet-fixes.png`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `git diff 61553d4..HEAD --stat` (ignoring the main merge) is the builder's set: `phone-code.tsx`, `sign-up.tsx`, `CodeScreen`, `SignUpScreen`, `signInFailure`, `signupFailure`, `signupFlow`, `signupStore`, `LeaveDevRoute`, `auth-signup` and `auth-sign-in` tests, BACKEND_GAPS, docs, this file; nothing extra or missing. `npm run check` exit 0: 25 suites, 474 tests, gates 9 run / 120 files / 0 findings, lint 0 warnings (`check.txt`). Added lines: no em-dashes, no TODO-type comments, no colour literals, no new kit constants, no new icons, no hand-written wawu-id response types. |
| F1 | fixed | An ended sign-up shows only Start again: no Resend, no countdown, no "We sent a new code" (6 of 6 checks light and dark). Start again returns to A3, the storage is empty and "Enter the code we sent" is gone. |
| F2 | fixed | Back, edit, Continue inside the gap: A3 says "A code was just sent. Wait 0:12 before sending another, or enter the one we sent." (server seconds, no "Too many tries"), the secret is unchanged, no second text, the link opens A4 and the first code signs in. Same with the request aborted (offline) and with a 500 injected. Light and dark. |
| F3 | fixed | Measured: 320 px boxes 39.2 wide, 20 to 300, no horizontal scroll; 360 px 45.8 wide, 20 to 340; 390 px 46 wide, 34.5 to 355.5, equal to the kit (and with the email field). Light and dark. |
| F4 | fixed | Production export: signed out, `/preview/auth`, `/dev/components`, `/preview/pin-sheet` all land on welcome; signed in on the email step they land on the email step; past it (Later) they land on Home. Never blank. Light and dark. |
| F5 | fixed | A 500 or an aborted request on the sixth digit shows the banner and "Try again"; Try again sends the same code and signs in; instead, the next tapped digit starts a fresh code (1 of 6, banner and button gone) and the right code then signs in. 4 variants x light and dark. |
| F9 | fixed | Two same-frame clicks (`el.click(); el.click()`) send one request on A3 Continue and one on the code Continue (email-code field path). Light and dark. |
| Reverts | 14 of 16 fail a test | `reverts.txt`: held secret cleared first (4 fail), ended-state Resend render (1), boxes without `flexShrink` (1), LeaveDevRoute target (1), no Try again (2), next digit not fresh (1), code `inFlight` guard (1), A3 `inFlight` guard (1), PHONE_NOT_CONFIRMED sign-in message (2), not-confirmed body (2), too-soon copy (3), sent-code link (6), link not refreshed on focus (1), Start again keeps secret (2). Survivors: `askAgain` dead guard (builder's note: the control is gone, UI test covers it) and the `sessionStorage` choice (see F13). sha1 before and after identical for all 16. |
| Regression | passed | Earning, discovering and no-pick users: welcome, A2 pick, A3, A4; reload on `/phone-code` resumes; wrong code then right code; reload on the email step resumes; proved or Later; Home; cold start; tokens cleared then welcome; sign back in. Lockout after four wrong codes shows "Too many tries. Try again in 0:29." ticking, keys inactive (forced click sends no request), the right code works after the wait. Account types on wawu-id: `creator`, `user`, none. Browser requests: wawu-id and the static host only, zero Hub requests. Hub DB: CreatorWallet, FintavaWallet, WalletIdentity 0 rows, KycSubmission unchanged (2 seeded). The receiver saw only `/sms/send`. `attempt` secret: in `sessionStorage` while held, not in `localStorage`, gone when the phone is confirmed and after Start again, not in any URL, console, wawu-id log, Hub log or export log. AUTH-01/02: A1 to sign-in, A22 link and Back, seeded sign-in, signed-in deep links to `/sign-up`, `/phone-code`, `/welcome`, `/sign-in` all land on Home, wrong password banner, a never-confirmed sign-in says to create the account again. |

### Findings

- **F13 unclear (test gap), low.** The web storage choice (`sessionStorage`, `signupStore.ts`) has no test: reverting it to `localStorage` fails nothing (jest runs the native path). Live behaviour is right (above). A test that sets `Platform.OS = 'web'` and checks the store would pin it. Not a product defect.
- **F11 note (corrects the builder's note), low, design.** Measured: light muted on page 3.15:1 (card 3.42), light danger on page 4.19:1 (card 4.55). Dark muted is also below 4.5: 4.16 on page, 3.82 on card; dark danger 7.12 and 6.54, secondary text 8.21 and 7.54. The builder wrote that dark passes; only the dark danger and secondary text pass. Colours unchanged, the design decides.
- **Test artefact, not a defect.** Playwright's `click` on an `aria-disabled` key waits for the lock to end, so a plain click appears to bypass keys-off; a forced click shows the keys are inactive and no request is sent.
- **F7 differs-for-recorded-reason.** `sessionStorage` on web is a sound default: reload resumes, a closed tab forgets (a new browser context shows welcome), nothing in a URL or log. Native stays in the secure store.
- **F6/F8 unclear, unchanged.** No one-time-code autofill on the keypad-only boxes and the short-window layout follow the drawn design; needs an Android build and an owner call.
- **F10/G-94 unclear, low.** The server leaves `email_verified` false after the `emailCode` check, so the email step asks for a second mailed code; after a reload it says "Sent to your email address" (seen in the F4 run). wawu-id side, filed.
- **F12/G-93 differs-for-recorded-reason.** The text says "Your WAWU code is ..." (wawu-id wording, seen in the receiver); filed, not an app string.
- No open defect.

### NOT RUN

A phone or emulator (V10; web export only). Real Fintava `/sms/send` and real mail (stand-in receiver and log). Screen reader pass. One-time-code autofill on a phone keyboard. PHONE_ALREADY_CONFIRMED live (needs a concurrent confirm race). Sign-out from a screen (none exists; tokens cleared instead).

Status: review.

## Lead merge note (4 Oct 2026)

Merged after the verifier found no open defect (Developer 1's task). Mobile only. The gaps this task filed as G-77 and G-78 clashed with INBOX-09's, which merged first, so they are renumbered G-93 (the code text message) and G-94 (sign-up with a held email); the references above are updated, older LOG lines keep the old numbers. Over-the-air update published after merge.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

Bridging note: on merging main, this task's gap rows G-64 and G-65 were renumbered G-93 and G-94 (main's G-64 is WALLET-15's). Text above that says G-64/G-65 means G-93/G-94.
