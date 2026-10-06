---
id: AUTH-07
title: Sign-up verifies by email code; no SMS
owner: YOU
area: AUTH
order: 181
priority: launch
repo: both
type: flow
status: verifying
depends_on: [AUTH-03, AUTH-04, AUTH-05]
decisions: [R-6, R-36, R-39]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A3, A4, A15]
---
# AUTH-07 · Sign-up verifies by email code; no SMS

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-39 (records the owner's SMS-to-email ruling, and names this task), R-6 and R-36 (what it amends)
- `AUTH-03`, `AUTH-04`, `AUTH-05` (the sign-up this task changes the channel of)
- The design: `python3 scripts/design/render_design.py A3 A4 A15` then open `build/design_shots/`
- `docs/designer/BRIEF.md`: its entries for A3 and A4 (the brief is part of the design: build its version, not the canvas's; R-29)
- This task changes `wawu-id` as well as the app. wawu-id has no CLAUDE.md: its scripts are in `package.json` (`npm test`, `npm run lint`, `npm run contract:build`).

## Owner ruling (6 Oct 2026)

Fintava is being removed (Nuvion replaces it, and Nuvion has no SMS). The owner, asked what sign-up does without SMS:

> "same thing for SMS... we'd use emails as we've been using"

Recorded by the lead as DECISIONS.md R-39 ("No SMS: codes go by email, as before. Sign-up verification moves to the email code (AUTH-07)"); this task adds no ruling of its own. Meaning:

- Sign-up's required verification is a 6-digit code mailed to the email typed on A3, sent the way WAWU ID already sends email (Resend). No text message is sent at sign-up.
- The phone number is still asked on A3 (it is used later) but is not verified by a code at sign-up.
- Reversible, additive: one WAWU ID setting, `SIGNUP_VERIFY_CHANNEL=email|sms` (default `email`). `sms` restores today's behaviour exactly; `email` answers the old phone-code routes 409 `SIGNUP_CHANNEL_DISABLED`. The Fintava SMS provider and every phone-code route stay in the code. No route is removed.

## Goal

A user signs up with email, phone and password, receives a 6-digit code by email, enters it on A4, and is signed in. Nothing is texted. The owner can roll back by changing one environment variable.

## Scope

- wawu-id: the sign-up sequence's code step, under the setting; a new email-code resend and confirm route pair; a nullable `channel` column on `phone_verifications` (additive migration).
- Mobile: A3, A4 and A15 copy (channel words only), the sign-up flow client, the contract sync, the preview harness, tests, BRIEF and DECISIONS entries.
- Not touched: anything in the Hub, `src/fintava`, `src/money`, wallet, PIN, payment or KYC code (money freeze).

## Artboards

- **A3 · Create your account**: unchanged layout. The line under the heading says "We'll email you a code to confirm your address." (was "We'll text a code to your phone.").
- **A4 · Verify your email**: nav title "Verify your email", heading "Enter the 6-digit code", subtitle "Sent to n•••@example.com", the keypad, the six boxes and the "Resend in 0:42" line unchanged.
- **A15 · Wrong code**: A4 with six digits and "That code isn't right", the same words, on the email code.

## Brief changes (build these, not the canvas)

- **A4**: "Verify your email" and "Sent to n•••@example.com" (R-39). Recorded in `docs/designer/BRIEF.md` as an owner-ruled deviation.

## Capability checks

- [ ] **A3 to A4**: a user who taps Continue with a new email, a Nigerian phone and a password gets a mail with a 6-digit code, and A4 opens with the masked address. No text message is sent (the local SMS stand-in records zero calls).
- [ ] **A4**: a user can enter the 6-digit code, and is signed in; resend works after the countdown; the resend gap, daily limits and wrong-code lockout are the phone code's.
- [ ] **A15**: a wrong code shows "That code isn't right"; the fourth wrong code in a row locks (the wait is shown); the user can re-enter.
- [ ] **Sign-in and resume**: quitting between A3 and A4 and coming back resumes A4 with the time left; a sign-in answered "not confirmed" reopens A4.
- [ ] **No email step after A4**: the progress after A4 never asks for the email again (it is proven), and the user lands on the next sign-up step.
- [ ] **Rollback**: with `SIGNUP_VERIFY_CHANNEL=sms` the old phone sign-up works as before, with `email` the phone routes answer 409 `SIGNUP_CHANNEL_DISABLED`.
- [ ] A3, A4 and A15 match their renders in light and dark apart from the channel words (V5).

## Builder report

Taken over by the lead's agents on 6 Oct 2026 (new task, no earlier owner). Branches `wmt/AUTH-07`: wawu-id from origin/main 4715d17, mobile from origin/main 8484195 then merged with 6df916d. Evidence (screenshots, runs, revert proofs) in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/auth07/`. Hub not changed (no money code touched).

- **What it does.** One wawu-id setting, `SIGNUP_VERIFY_CHANNEL` (`email`, the default, or `sms`; anything but a literal `sms` is `email`, so a typo never spends on texts). `email`: `POST /auth/signup` mails a 6-digit code (Resend, `MailService.sendOtpCode` with strict delivery), answers `channel: "email"` and `maskedEmail: "a•••@example.com"`; new `POST /auth/signup/email-code/start` and `/confirm` resend and check it (same body shape as the phone routes: phone and `attempt`); the right code proves the EMAIL (`email_verified`), leaves `phone_verified_at` empty, makes the `signup_progress` row, and issues the first session. `sms`: byte-for-byte the AUTH-03 sign-up (its answers carry no new field). The route of the inactive channel answers **409 `SIGNUP_CHANNEL_DISABLED`** before it checks or spends anything. No route and no provider is removed. `resume` answers `details` for a sign-up whose code went by the other channel (the person starts again at A3).
- **Same rules as the phone code (one config, `phone-verification.config.ts`).** Resend gap 60 s, 5 mails a day per email, 30 an hour and 100 a day per client address, 2,000 a day in all, 120 checks an hour per address, four wrong codes in a row then 900 s, 12 wrong a day per email, unproven sign-up lives 24 h, a newer sign-up replaces an unproven one, answers identical for unknown and wrong-secret callers. Counters use their own scopes (`signup-mail-*`), so mail and text budgets never mix. The only different figure: a mailed code lives 600 s (`SIGNUP_EMAIL_CODE_TTL_SECONDS`) because the mail itself says "10 minutes". An email held unproven by a phone-proven account is claimed by the mailed code itself (no second code). Mail not configured: 503 `EMAIL_NOT_CONFIGURED`, nothing written. Resend error: 503 `EMAIL_SEND_FAILED`, the reserved mail given back, nothing held against the person (before this, `MailService.send` ignored Resend's error answer).
- **No code is ever logged** by the new paths: a spec spies every Logger level through sign-up, wrong code, resend, failed mail and confirm; the live run greps the whole server log for each code and secret (none). The strict mail call throws before the old dev branch that logs a code when `RESEND_API_KEY` is unset (G-214).
- **Mobile.** A4 and A15: "Verify your email", "Sent to l•••@wawu.africa" (the server's mask, never the typed address), six boxes, keypad and "Resend in 0:42" unchanged; mailed codes go through `signup/email-code/*` and the email error codes; A3's line reads "We'll email you a code to confirm your address." (with a `// MECHANISM:` comment, gate); "We can't text that number yet" became "We can't use that number yet" (the server still refuses non-Nigerian numbers, R-36). The separate optional email step is no longer reached (progress after A4 never says `email`); its screen and the texted A4 stay in the code because the rollback needs them (decision below). Brief entry under A4 (owner-ruled deviation, rollback note).
- **Files, wawu-id.** New: `src/auth/email-signup.service.ts`, `signup-channel.service.ts`, `signup-channel.config.ts`, `mask-email.ts`, two DTOs, migration `20261006120000_signup_code_channel` (one nullable column `phone_verifications.channel`, additive, rollback in the file), `test/signup-email.local.mjs`, specs `email-signup.service.spec.ts`, `signup-channel.service.spec.ts`, `src/mail/mail.service.spec.ts`, `src/testing/{fake-signup-prisma,recording-mail}.ts` (the fake Prisma moved out of `phone-signup.service.spec.ts`, which now imports it). Edited: `phone-signup.service.ts` (export `problem`, phone routes ignore mailed rows, resume type gains two optional fields), `mail.service.ts` (`isConfigured`, `strict`), `auth.controller.ts`, `signup-sequence.controller.ts`, `auth.module.ts`, `auth.service.ts` and `tokens.service.ts` (the 403 sentence says "emailed" for a mailed sign-up; same code; local-form phone login also finds a mailed account that has a sign-up record), `identity-schemas.ts`, `contract/openapi.json` (regenerated), `.env.example`, `deploy/ENV.md`, `WAWUAfrica_API_Contracts.md`, `package.json` (`test:signup-email-local`), `test/phone-signup.local.mjs` and `signup-sequence.local.mjs` (boot with `SIGNUP_VERIFY_CHANNEL=sms`). Existing specs edited on purpose: `login-phone-verified.spec.ts` (the local-form lookup now has the extra OR), `contract.spec.ts` (two routes), `pending-signup-no-session.spec.ts` (added cases).
- **Files, mobile.** `src/app/phone-code.tsx`, `sign-up.tsx`, `preview/auth.tsx` (dev harness: default is the mailed A4, `channel=sms` draws the old one), `src/features/auth/{signupFlow,signupStore,signupFailure,SignUpScreen}`, `src/api/identity.ts`, `identity.generated.ts`, `contract/identity/`, tests `auth-signup.test.tsx` (+20 cases; the existing 61 are now the texted-rollback suite and pass unchanged but for one copy line), `identity-contract.test.ts`, `docs/designer/BRIEF.md`, `SHARED-CHANGES.md` (AUTH-07 #1 to #3), `BACKEND_GAPS.md` (G-212 to G-214).

### Capability checks and how each was tested

- **A3 to A4, no text.** Live (`npm run test:signup-email-local`, real built wawu-id, local Postgres `a07_id_test`, Resend and Fintava stand-ins on 127.0.0.1): sign-up 201 with channel email and masked address, one mail to the typed address with a 6-digit code, the Fintava stand-in saw **0 calls** through the whole mailed flow. In the app (web export at 390 px against that server, Playwright, light and dark): Welcome, A2, A3, A4, wrong code (A15), right code from the stand-in's mail, signed in; 1 mail, 0 Fintava calls both runs.
- **A4 code, resend, limits.** Live: resend inside the gap 429 `EMAIL_CODE_RESEND_TOO_SOON` with `retryAfterSeconds`, after the gap a new mail and the old code stops working, made-up secret gets the same answer shape and no mail. Unit (32 cases) for the 60 s gap, 5 a day, 30 an hour, 100 a day, 2,000 a day, and the 600 s life (works at 599 s, refused at 601 s).
- **A15.** Live and unit: wrong code 400 `EMAIL_CODE_INVALID` "That code isn't right" three times, the fourth in a row 429 `EMAIL_CODE_LOCKED` with the wait, even the right code waits, the day cap of 12 holds however often the wait ends. App: the wrong-code state, the fourth 400 ends the sign-up, a locked 429 shows the wait (jest, 20 new cases).
- **Resume and sign-in.** Live: resume answers the code step with the masked address and time left, `details` for a made-up secret; sign-in before the code gives 403 `EMAIL_NOT_VERIFIED`; after it, sign-in by email and by the phone typed `0803...` both work. App tests: cold start with a held sign-up reopens A4 mailed; a sign-in refused as not verified reopens it.
- **No email step after A4.** Live: progress after the code is `creator_setup` for a creator (email proven, `emailProven: true`), `POST /auth/signup/email/start` answers 409 `EMAIL_ALREADY_PROVEN`.
- **Rollback.** Live with `SIGNUP_VERIFY_CHANNEL=sms`: the sign-up answers with no `channel` field, texts one code (stand-in saw it), the email-code routes answer 409 `SIGNUP_CHANNEL_DISABLED`, the texted code confirms and proves the phone, the next step is the email step as before. Switching to sms while a mailed sign-up waits: resume `details`, and the mailed code does not prove the phone. App with that server (screenshot `sms-light/A4.png`): "Verify your phone", "Sent by SMS to 0803 ••• 5484", then the email step. The AUTH-03 and AUTH-05 live scripts, booted with `sms`, are below.
- **Unit, wawu-id.** Revert proofs (each mutation made, tests run, file restored, sha1 equal): 8 wawu-id and 4 mobile, each fails 1 to 10 tests (`revert/summary.txt`, `revert-m/summary.txt`): mailed row not channel-checked (3 fail), confirm also proving the phone (2), phone route not disabled (1), mail not strict (4), no sequence row (1), strict swallowing errors (2), 403 sentence ignoring channel in auth.service (4) and tokens.service (1); mobile: mailed uses the phone outcome (4), always the phone route (10), title always phone (2), "already confirmed" unmapped (1).
- **V5 (picture).** `python3 scripts/design/render_design.py A3 A4 A15` beside the built screens, light and dark: `compare-A3|A4|A15-light|dark.png` in the evidence folder (design left, built right; 780 by 1688 against 780 by 1690). Layout, boxes, keypad, resend line, error line the same; what differs is the channel words (recorded in BRIEF), the phone frame and status bar the design draws around the screen (not part of the app), and A3's heading and missing BVN field (AUTH-04, R-6). The verifier decides.

### Hub check (outside money code)

wawu-backend origin/main does not read `phone_verified_at` anywhere: `git grep -i phoneVerified` finds nothing in `src`, `prisma/schema.prisma` or `contract/`, and `WawuJwtClaims` carries only `phone`, no verified flag. Nothing outside money code relies on a verified phone at sign-up. In money code, which this task does not touch (money freeze): `MoneyIdentityController` to `WalletIdentityService.checkBvn(user.sub, user.phone, ...)` (A14) compares the BVN's phone with the account's phone, and `UserProfileService.upsertMe` reads the phone claim for wallet opening; both used to get a phone proven by a text and now get a typed one (BACKEND_GAPS G-212). The wallet PIN reset code is texted through `FintavaClient.sendSms` (MONEY-14); R-39 already moves forgot-PIN codes to email in the wallet rebuild, so no row.

### Numbers (before then after)

- wawu-id: `tsc` 0 then 0. eslint 43 errors then 43 (the same files: `tokens.service.ts` 8, `mail.service.ts` 1, none new). jest: 18 suites 205 tests then 21 suites 268 tests (a first full run had one load timeout in SETTINGS-03's `session-security.spec.ts` race test, a file this task does not touch; the next full run passed it, 268 of 268) (run with `--testTimeout=300000 -w 2`, because this machine was loaded: the default 5 s limit fails 47 tests of the four slowest suites on origin/main too, `base-jest-default-timeout.txt`). Gates 0 fail 20 warn 99 files then 0 fail 20 warn 110 files (no new PROVISIONAL marker: the limits are the phone code's). Contract: `npm run contract:build` regenerated, `contract.spec` passes. Migration applied to an empty database and to the scratch ones.
- wawu-id live: `test:signup-email-local` 44 PASS, 0 FAIL (new). `test:signup-local` (AUTH-05, booted with sms) 34 PASS, 0 FAIL. `test:phone-local` (AUTH-03, booted with sms) 101 PASS, 2 FAIL: both timing checks (F-3 "medians within 40 ms", spread 144 ms and 215 ms) on a machine where other agents ran ten test runs at once. Rerun of my branch gave the same 101 PASS and the same two timing FAILs (spread 281 ms and 186 ms); the same script on **origin/main** (4715d17, unmodified wawu-id) gives 101 PASS and the same two FAILs (225 ms and 176 ms) under the same load, so they are the machine, not this change. Unblocked by: a run when the machine is quiet (the other 101 checks are deterministic).
- Mobile `npm run check`: before (origin/main 6df916d, measured in a clean worktree): gates 195 files 0 findings, 207 tasks, jest 43 suites 754 tests with 1 failure, the known 20 s timeout in `OpenWalletScreen.test.tsx` (A26 loading view) under load. After: `npm run check` **exit 0**: typecheck 0, lint clean, jest 43 suites **776** tests (+22: 20 in `auth-signup.test.tsx`, 2 in `identity-contract.test.ts`), gates 195 files 0 findings 0 baseline entries, 208 tasks. `OpenWalletScreen.test.tsx` passed in this run, so there is no second result to report. A first run of `npm run check` ended 1 at the task check (A3, A4 and A15 were in two mobile-screen tasks); fixed by the type decision below.

### Decisions (Default (agent), owner may override)

1. The texted A4 and the email step stay in the app so the rollback works from the app side; they are not reached while the setting is `email`.
2. The masked address is made by wawu-id (first letter, three dots, domain), so the app stores no email and resume can show it. The brief said "mask like the existing email step"; that step showed the full address, so there was nothing to copy.
3. The phone stays unique and unproven: a typed phone can be held by a stranger (G-212).
4. The new routes are a separate pair (`signup/email-code/*`) rather than the phone routes with a channel switch, so the phone routes can answer the disabled error the brief asked for.
5. `SIGNUP_VERIFY_CHANNEL` is read at start; a restart switches it (Railway restarts on a variable change).
6. A3's line names email before the server has said which channel is active; under the `sms` rollback it would still say email until the app is updated (BRIEF).
7. The type is `flow`, not `mobile-screen`: `check_tasks.py` allows an artboard in exactly one mobile-screen task and AUTH-04 owns A3, A4 and A15 (its passes V1, V4, V5, V6, V7, V9 satisfy `flow`).
8. The order number: 181 was the last launch place, so `CHECK-3` and every later task moved down one (27 task files, one line each). Another branch that does the same will conflict on those lines.

### Pre-existing findings

- `MailService.send` logs the 6-digit code of any code mail when `RESEND_API_KEY` is unset (G-214). Not reachable from sign-up now.
- The mail is "Your WAWUAfrica verification code" from `WAWUAfrica <noreply@wawuafrica.com>` with the WAWU header (G-213, R-37).
- `scripts/gates/__pycache__/*.cpython-312.pyc` are tracked in wawu-id.
- A `expo export` shares the Metro cache across worktrees in `/tmp`: a build for one port was served to my first export (the app posted to another agent's `localhost:8191`; it answered 404, nothing sent that matters). Use a private `TMPDIR` and `--clear`.

### NOT RUN

- A real send through Resend (G-213 needs the owner's sender and wording; unblocked by `RESEND_API_KEY` and a verified sending domain in a wawu-id environment, then one `POST /auth/signup` to the owner's own address) and a real mailbox: every mail went to a stand-in on 127.0.0.1.
- An Android or iPhone walk: the web export at 390 px only (V10 belongs to the tester build).
- The Hub (money freeze): not started, no Hub check ran beyond reading its code.
- `contract/identity/SOURCE_COMMIT` names the wmt/AUTH-07 commit: after wawu-id merges, run `npm run api -- --identity ../wawu-id` so it names main.
