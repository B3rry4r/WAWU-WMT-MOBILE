---
id: AUTH-03
title: Phone check at sign-up, and the email trap
owner: DEV
area: AUTH
order: 32
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-6]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-03 · Phone check at sign-up, and the email trap

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

A4 verifies the phone. The canvas never verifies email, but login refuses unverified email today, so a new user could never sign back in.

## Scope

Phone code at registration; fix the login rule so a phone-verified account can sign in even without a verified email (the design never verifies email, but login refuses it today); store occupation and account type. No BVN here (R-6).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava has `GET /compliance/verify/phone-number` and `POST /sms/send`. If the price is right, that is the SMS route for sign-up codes `docs/PLAN.md` asks for.

## Capability checks

- [x] A user who signs up on mobile can sign out and sign back in.
- [x] A wrong code shows A15 and a fourth wrong code waits before retrying.

## Builder report

Branch `wmt/AUTH-03` in `wawu-id` (from origin/main 76d8b46) and here (from 7148749, unmoved). Nothing committed or pushed.
- **wawu-id files:** new `src/auth/phone-signup.service.ts` (+spec), `phone-verification.config.ts`, `dto/signup.dto.ts`, `dto/phone-verify-{start,confirm}.dto.ts`, `src/sms/{sms.provider,fintava-sms.provider,sms.module}.ts` (+spec), `src/common/phone.util.ts` (+spec), `src/testing/recording-sms.provider.ts`, `src/auth/login-phone-verified.spec.ts`, `test/phone-signup.local.mjs`, migration `20261002120000_add_phone_verification`. Edited `prisma/schema.prisma`, `auth.controller.ts`, `auth.module.ts`, `auth.service.ts`, `dto/register.dto.ts`, `http-exception.filter.ts`, `package.json` (one script), `.env.example`, `deploy/ENV.md`, `WAWUAfrica_API_Contracts.md` (the three routes). Here: this file, `BACKEND_GAPS.md` (G-11 to G-13, G-2 note), `docs/LOG.md`, regenerated `docs/PROGRESS.md` (`tasks/INDEX.md` came out unchanged). wawu-id has no `CLAUDE.md` and no `docs/` folder: its README is the Nest default, so I followed `package.json` and `deploy/ENV.md`.
- **Routes (new):** `POST /auth/signup` (email, phone `080...` or `+234...`, password, optional occupation and accountType; stores the phone as `+234...`; texts a code; issues NO token), `POST /auth/phone/verify/start` (resend), `POST /auth/phone/verify/confirm` (right code: sets `phone_verified_at`, issues the session). SMS goes through an `SmsProvider` interface; the real one posts `{to, sms}` to Fintava `/sms/send` with the bearer key (`FINTAVA_BASE_URL`, `FINTAVA_API_KEY`). Unset: 503 `SMS_NOT_CONFIGURED`, no account created. No mock in a production path.
- **Check 1, sign out and back in: PASSED locally.** Real built wawu-id on a local Postgres plus a local receiver for `/sms/send` (`npm run test:phone-local`, 30 checks, all pass, run twice): sign up with `0803 123 4412`, login refused before the code (as before), confirm, then `POST /auth/login` by email and by phone returns tokens with the email never confirmed; refresh works; occupation and account type read back from the row; at that time the answer carried occupation only (see fix round 1).
- **Check 2, A15 and the wait: PASSED locally.** Three wrong codes answer `400 PHONE_CODE_INVALID` "That code isn't right". The fourth answers `429 PHONE_CODE_LOCKED` with `retryAfterSeconds` and a `Retry-After` header; the right code and a resend are refused during the wait; after it the old code is dead and a new one works. Same logic in 16 service tests.
- **Durations:** code life 300 s is the existing OTP value. The wait after the fourth wrong code (900 s) and the resend gap (60 s) are named in config marked PROVISIONAL(AUTH03-LOCKOUT, AUTH03-RESEND): neither A4/A15 nor the docs name them. Owner to confirm (G-12).
- **Counts, wawu-id before to after:** tsc 0 to 0; eslint 32 errors to 32 (all pre-existing, none in new files); jest 3 suites, 23 tests to 7 suites, 69 tests; gates 0 fail, 7 warn, 55 files to 0 fail, 9 warn (the two new PROVISIONAL markers), 69 files. Mobile `npm run check` 185 tests, 10 suites, gates 53 files 0 fail, 187 tasks: unchanged (docs only).
- **Migration (additive):** `wawu_users` gains nullable `phone_verified_at`, `occupation`, `account_type`; new table `phone_verifications` (one row per user). Replayed from empty on a scratch DB and `prisma migrate diff` shows no drift. Rollback (nothing reads them without the new code): `DROP TABLE phone_verifications; ALTER TABLE wawu_users DROP COLUMN phone_verified_at, DROP COLUMN occupation, DROP COLUMN account_type;`.
- **V3:** protected route suite `run.sh --fresh origin/main` (backend efec55c) against a local test DB: 244 required tests passed, exit 0. It runs against the mock WAWU ID, so it cannot see wawu-id; the unchanged web paths are covered instead by the live-seam script (register, refused login, email confirm, login all as before; web rows keep NULL in the new columns) and the login-rule tests.
- **Login-path change:** `AuthService.login` refused any email account with `emailVerified = false`. It now also lets one in when `phone_verified_at` is set; the condition went from `email && !emailVerified` to `email && !emailVerified && !phoneVerifiedAt`. `phone_verified_at` is NULL for every existing row and every web or `register` sign-up, so for them nothing changes (a test pins the old refusal). Only an account whose owner entered the code texted to its phone gets in without the email. Changing a phone number (`updatePhone`, `confirmPhoneChange`) clears the proof. `register` itself issues tokens as before (G-2, left for the owner) and now also stores occupation and a valid accountType.
- **NOT RUN:** the real Fintava `/sms/send` (no keys in any wawu-id environment; sandbox behaviour of that route has never been called, and the "phone check" endpoint is a ₦5 identity lookup, not a code, so it is not used). Unblocked when `FINTAVA_BASE_URL` and `FINTAVA_API_KEY` (sandbox) are set in a local wawu-id and one signup to the owner's number delivers a text (G-13). Also NOT RUN: `scripts/local/smoke.sh` on the full stack, an Android walk, and a wawu-id contract (none exists, G-5; documented in the repo's contracts file, G-11).
- **For AUTH-04:** A4's line says "the number on your BVN"; R-6 has no BVN at sign-up and the designer brief does not change that line. Contract: no per-address throttle on signup (G-13). No shared-change requests.

### Builder report (fix round 1)

Branch state: wawu-id on `wmt/AUTH-03`, mobile on `wmt/AUTH-03`, both uncommitted. A local WIP commit and a merge of origin/main (mobile moved to 8f0d90c; wawu-id is still 76d8b46) were refused by the permission classifier, so the mobile merge is NOT done and the orchestrator must run it (my edits touch only BACKEND_GAPS.md, SHARED-CHANGES.md, docs/LOG.md, docs/PROGRESS.md, this file).
- **Fixed, each with tests that fail without the fix (reverted and restored byte for byte, `cmp` equal) and a live check:** F-1 phone routes act only on a pending sign-up (a live `phone_verifications` row, phone unproven, not expired); F-2 wrong codes counted per phone number, never reset by a resend, 12 a day hard cap; F-3 start and confirm answer unknown, registered, proven and locked numbers alike (same status, body shape, work: a hash or decoy hash, a counter), medians 119 to 139 ms for all four kinds; F-4 unproven sign-ups are superseded and expire (24 h), an unproven email is released to a later sign-up, no mail goes to an unproven email; F-5 unique-key clash and double confirm are 409, never 500 (the live run first showed `200,500,500` for three parallel confirms, from a non-atomic upsert, now one SQL insert); F-6 sign-in by `0803...`; F-8 Nigerian numbers only; F-9 limits per address, per number, per day, 429 with Retry-After, in the database.
- **Numbers (all PROVISIONAL, env-overridable, `phone-verification.config.ts`):** wait 900 s after 4 wrong in a row; resend gap 60 s; 12 wrong per number per day; unconfirmed sign-up 24 h; 30 requests an hour per address; 5 per number per day; 2,000 texts a day; 120 code checks an hour per address; prefix `+234`. Guessing: at most 12 tries a day per number against a fresh random 6-digit code, so at most 0.0012 percent a day (0.0024 percent across the window edge); before the fix about 4,320 tries a day, 0.43 percent. Spend at 7 naira a text: per address 720 texts, 5,040 naira a day; per number 35 naira; whole service 14,000 naira a day. Address: `X-Real-IP` (nginx overwrites it from the socket), else the last `X-Forwarded-For` entry; never the first (client-written; the consent route in `src/policies` reads that one).
- **A stranger locking a pending sign-up:** the wait is 900 s, and the daily cap holds a number back for at most the rest of its 24 h window; the pending sign-up itself ends after 24 h. Recorded, not eliminated.
- **R-36 changes:** the sign-in answer's `user` gains `accountType` only when the account has one (accounts without it get no such key, so their answers stay identical); occupation stays (null when none). F-7 correction: account type is now written AND read (sign-in, register and confirm answers), so no BACKEND_GAPS row is needed; occupation is read only through that same answer, by no other reader (not the Hub, not the JWT). A4 copy, AUTH-04 owns: "your phone number", never "the number on your BVN".
- **Equality set (V3):** the verifier's 26 requests, run against origin/main 76d8b46 and this branch: 25 identical, 1 differs only by `"accountType": "creator"` on the `register` response to a request that sends the new `accountType` input (main ignored it). Login of every legacy, web, backfilled, never-verified and phone-only row, refresh, forgot-password, otp and JWKS are identical.
- **Counts, wawu-id:** tsc 0; eslint 29 errors (origin/main 32, none in new files; I let prettier fix three old ones in `auth.service.ts`); jest 7 suites, 92 tests (was 69); gates 0 fail, 16 warn, 72 files (the 9 PROVISIONAL markers plus the 7 old warnings); `npm run test:phone-local` 73 checks, ALL PASSED (3 runs). Migration replays from empty and `migrate diff` shows no drift; rollback replayed leaves the schema equal to origin/main's.
- **Default (agent), owner may override:** (1) a mobile account whose email was never proven gives that email up to a later sign-up that uses it; the account keeps its proven phone and signs in with it (trade-off: anyone who knows a mobile user's email can detach it from that account); (2) `start` answers 200 even when the text fails to send (sign-up itself answers 503); (3) a repeat sign-up for the same email and phone replaces the pending one and its new password wins; (4) sign-up answers 409 for an email or phone that belongs to a proven account, as `register` does; (5) mail from wawu-id (sign-in alert, approval, deletion warning, Ditto invite, reset link) skips an email that mobile sign-up never proved.
- **F-10:** three rows in SHARED-CHANGES.md (schema and migration, `phone.util.ts`, the error filter). **F-11:** a web user who registers with an occupation now gets it back from `/auth/login` where it was null: additive, their own value, allowed by R-36. **F-12/F-13:** A4 copy goes to AUTH-04; the PROVISIONAL warnings stay as designed. **F-15:** BACKEND_GAPS G-14, owner AUTH-05, no code. **F-14:** report corrected above.
- **NOT RUN:** the real Fintava `/sms/send` (no keys; unblocked when `FINTAVA_BASE_URL` and `FINTAVA_API_KEY` sandbox values are set locally and one signup reaches the owner's number, G-13); backend `smoke.sh` and the Hub-side check (the protected suite from round 0 ran against the mock WAWU ID and is unchanged, wawu-backend untouched); the Android walk; production nginx header behaviour (assumed from `deploy/install-services.sh`).

## Verifier report

Verifier session, fresh; wrote none of the code. Own scratch databases only (`vfy_*`, all dropped), own throwaway worktree of wawu-id origin/main 76d8b46 (removed), my own receiver standing in for Fintava `/sms/send` on 127.0.0.1 (the real one NOT RUN). Nothing committed, nothing pushed. Evidence folder: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-03/` (below, `E/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed, with findings F-13 to F-15 | `E/mobile-check.txt` (exit 0; 185 tests, 10 suites; gates 53 files, 0 fail, 0 warn; 187 tasks); `E/id-tsc.txt` (0 errors); `E/id-lint-branch.txt` vs `E/id-lint-main.txt` (32 errors both, identical apart from shifted line numbers, none in new files); `E/id-jest-branch.txt` (7 suites, 69 tests; origin/main 3 suites, 23 tests); `E/id-gates-branch.txt` (9 gates, 69 files, 0 fail, 9 warn: 7 old plus the 2 PROVISIONAL; origin/main 55 files, 7 warn) |
| V2 Contract | FAILED (F-1 to F-6, F-8, F-9) | `E/v2a.txt` (phone formats), `v2b.txt` (flow, wrong codes, wait, race), `v2c.txt` (enumeration, takeover), `v2d.txt` (provider missing/refusing, retry, pumping, lock DoS), `v2e.txt` (brute force, parallel), `v2f.txt` (real waits, short config), `v2g.txt` (timing), `v2h.txt` (validation, concurrency) |
| V3 Regression | passed for the login rule; findings F-3, F-12 | `E/v3-main.json` vs `E/v3-branch.json`: 26 requests, byte-identical after masking tokens and ids; `E/v3c` output in F-12; `E/protected-routes.txt` (suite 244 passed, exit 0, mock WAWU ID, cannot see wawu-id) |
| V4 Field trace | FAILED (F-7) | grep of both repos, section "Field trace" below |
| V9 Live seam | passed (real built wawu-id + real Hub on a local DB, receiver for Fintava), findings F-6, F-7 | `E/v9.txt`, `E/builder-script.txt` (builder's `npm run test:phone-local` on my own DB: ALL PASSED, 31 PASS lines) |
| Migration | passed | `E/migrate-deploy.txt`, `E/migrate-diff.txt` ("No difference detected", exit 0); schema dump before vs after rollback identical (`E/schema-main.sql`, `E/schema-rollback.sql`: only the random `\restrict` token differs); an existing row keeps NULL in all three new columns |

### Capability checks

- **A user who signs up on mobile can sign out and sign back in: PASSED, with a limit.** `E/v9.txt`: signup `0803 456 7810` (201, no token), SMS body `Your WAWU code is 915749. It expires in 5 minutes...` to `+2348034567810`, login before the code 403 `EMAIL_NOT_VERIFIED`, confirm 200, sign out (no logout route exists; tokens dropped), login by email 200, by `+2348034567810` 200, refresh 200, Hub `GET /users/me` 200 with the token (401 without), email never confirmed. Limit: login by the phone as typed in the app (`08034567810`) answers 404 `USER_NOT_IN_WAWUID` (F-6).
- **A wrong code shows A15 and a fourth wrong code waits before retrying: PASSED as written, but the wait does not hold (F-2).** Wrong 1 to 3 answer `400 PHONE_CODE_INVALID` "That code isn't right" (same text as the A15 artboard, compared against `build/design_shots/A15-light.png`); the 4th answers 429 `PHONE_CODE_LOCKED`, `retryAfterSeconds` 900, `Retry-After: 900`; right code and resend refused during the wait; old code dead after it; resend gap enforced; code dead after 300 s (checked with a 6 s setting and real waits, `E/v2f.txt`; the 900 s wait itself was simulated by moving `locked_until`, the logic is the same). Race of 20 parallel wrong codes: counter stops at 4, no bypass.
- **Real Fintava `/sms/send`: NOT RUN.** No sandbox key in any environment I may use. Unblocked when `FINTAVA_BASE_URL` (sandbox) and `FINTAVA_API_KEY` are set in a local wawu-id and one signup to the owner's own number delivers a text (G-13). The provider's request shape (`POST {base}/sms/send`, bearer key, body `{to, sms}`, number with country code) matches `docs/fintava/reference/send-sms.md`.
- **Also NOT RUN:** backend `scripts/local/smoke.sh` (it reads the ports from the `.env` files of the two checkouts, which I may not edit; I ran its steps by hand against my own stack instead: register, email code from the log, login, Hub `users/me`, in `v3-*.json` and `v9.txt`); `scripts/local/up.sh` (it rewrites the `.env` files); Android walk (waits on AUTH-04 screens); a real 900 s lockout wait (simulated by time-shifting the row, real waits at 3 s and 6 s settings); V5 and V10 are not in this task's passes. The backend worktree at `/home/user/wawu-backend-main` is at b7d4e63, not origin/main efec55c (the suite was run with `--fresh origin/main`).

### V2 detail (what was tried)

- **Phone formats** (`E/v2a.txt`): `0803 123 4415`, `+234...`, `234...`, `002348...`, `+2340803...`, dashes, brackets, spaces, `+234(0)8031234428`, trailing newline all normalise to `+2348031234xxx` and the SMS goes to that. Refused with 400 `PHONE_INVALID`: garbage, 9 and 12 digits, `06...`, Arabic-Indic and full-width digits, letter O for zero, `++234`, zero-width space. 12345 refused by validation (400). Accepted and texted: `+14155552671` (see F-8).
- **Token only after confirm:** signup response has `phone, expiresIn, resendIn` only; login refused before confirm. A body field `phoneVerifiedAt` or `emailVerified` in signup is ignored (row stays NULL/false).
- **Code storage:** `$argon2id$...` hash in `phone_verifications.code_hash`, plain code never stored. Logs (`server-branch.log`): no phone, code, password or key from the new routes (0 matches); only the existing "mail skipped ... code=" dev line for email codes.
- **Single use / replay / expiry / resend gap:** held (v2b, v2f). Provider missing: 503 `SMS_NOT_CONFIGURED`, no user row created, start also 503. Provider 403 or dropped socket: 503 `SMS_SEND_FAILED`, the account row stays with a dead code and `last_sent_at` set to 1970 so the same person can retry at once (retry 201); another email with the same phone then gets 409. Abandoned signup retried with same email, phone, password: new code after the gap; other password: 409.
- **Guess budget:** see F-2 for the numbers.

### Field trace (V4)

- **occupation:** written by `POST /auth/signup` and `POST /auth/register` (`auth.service.ts:144`, `phone-signup.service.ts:110`) into `wawu_users.occupation`. Read in one place: `toUserResponse` (`auth.service.ts:109`), so only the login, confirm and register answers. Not in the JWT claims (`tokens.service.ts` payload), not in the Hub (`occupation` appears nowhere in wawu-backend `src` or `schema.prisma`), not in the mobile app (`src/api/identity.ts` reads only the two tokens). 
- **account type:** written by signup and register into `wawu_users.account_type`. Read by nothing in wawu-id: not in `UserResponse`, not in the JWT, not in any query (`grep accountType src` shows only the two writers and the DTOs). The Hub's `UserProfile.accountType` is a different field, set only by `PATCH /users/me`, and `GET /users/me` shows `accountType: null` until then (`E/v9.txt` step 9). Nothing carries the sign-up choice across (F-7).

### Findings

**F-1 · defect · medium. `phone/verify/start` and `confirm` work for every existing account, not only mobile sign-ups.** Contract text says a phone "already proven or unknown is never texted". Every row that existed before the migration has `phone_verified_at` NULL, so `start` texts it and `confirm` with that code answers 200 with a session and no password (`E/v2c.txt`: legacy web account with a confirmed email, texted, confirmed, session issued, `phone_verified_at` stamped). This is a new password-less sign-in for the whole user base, and a number typed wrongly or recycled at web sign-up (the web never proves the phone) reaches the old user's account. It is no weaker than the existing `POST /auth/otp/verify` (no attempt limit at all there), but nobody ruled it in and the contract says the opposite. Needs the owner: limit start/confirm to accounts created by `signup` (for example no confirmed email and no earlier login), or accept it in writing.

**F-2 · defect · medium. The wait after the fourth wrong code does not bound guessing.** A resend resets `wrong_attempts` to 0 and issues a fresh code. `E/v2e.txt`: 3 wrong guesses, wait the 60 s gap, resend, repeat: 12 guesses, never locked, 5 texts. Best rate for an attacker is 3 guesses per 60 s = 180 an hour per account, 4,320 a day, which against a fresh random 6-digit code each time is about 0.43 percent a day per targeted account and about 3 percent a week (the 4-wrong lockout alone would allow only about 16 an hour, so it is never hit by a careful attacker). Across N accounts the rate multiplies, with no per-address limit. Each guess cycle also costs WAWU a text (about 1,440 texts, roughly 10,000 naira at 7 naira, per targeted number per day, to a victim who sees one text a minute). Verdict: a 6-digit code with this budget is acceptable for a brand-new empty account, not for anything that opens a session on an existing account (F-1). Fix idea for the builder: count wrong guesses per account across resends within a window and cap sends per account per day.

**F-3 · defect · medium. Enumeration through `start` and `confirm`, against the builder's claim of an identical answer.** `E/v2c.txt`: calling `start` twice within 60 s on an unregistered number answers 200 and 200; on a pending or legacy number 200 (or 429 straight after signup) then `429 PHONE_CODE_RESEND_TOO_SOON`. Timing: `E/v2g.txt`, `start` unknown 3 ms vs known 107 ms, `confirm` unknown 6 ms vs known 104 ms (argon2 plus the SMS call). The fourth wrong code on `confirm` answers 429 only when the account exists. Signup also answers 409 for an existing email or phone (the same as `register`, by design, `v2c.txt`).

**F-4 · defect · medium. An unproven sign-up holds the email and the phone for ever, so anyone can squat on someone else's.** The email is never proven on mobile (R-6). `E/v2c.txt`: attacker signs up with a victim's email and the attacker's own phone, proves that phone, and holds `newvictim@x.com` with a known password; the real owner's own signup then answers 409, and if they ever run email verification (`/auth/email/verify/*`, open to anyone) they get a session in the attacker's account. A signup with someone else's phone and the attacker's email blocks that person's signup the same way, and abandoned sign-ups are never released (no expiry anywhere). Every login of such an account also sends a "Was this you?" alert to the unproven address. Needs a ruling (release an unproven sign-up after a time, or never let an unproven email block the real owner).

**F-5 · defect · low. Concurrent identical requests answer 500.** `E/v2h.txt`: 4 parallel identical signups answer 201, 500, 500, 500 (unique-key error, one account and one text exist); two parallel signups with one phone answer 201, 500. Two parallel confirms with the right code answer 200 and 500 (`E/v2b.txt`, a `P2025` error in the log); only one session is issued. A double tap on "Continue" shows the app an error although the account exists.

**F-6 · defect · low. A user who signed up as `0803...` cannot sign in with that number.** The row holds `+2348034567810`, and `login` matches the typed identifier exactly: `08034567810` answers 404 `USER_NOT_IN_WAWUID` (`E/v9.txt` 6c, `E/v2b.txt`). The builder's check used `+234...`. Email sign-in works. AUTH-04 must send the `phone` the signup answer returned, or login must normalise.

**F-7 · defect · low. Account type is written and read by nothing; occupation is read only in the sign-in answer.** The builder says both "read back from the row and the sign-in answer": the row, yes; the answer carries occupation only, never account type (user keys `id, fullName, email, phone, country, state, gender, occupation, verificationTier, trustScore, verification, status`). The Hub does not read either (see Field trace), so a creator who picks "creator" on A3 is `accountType: null` in the Hub until something sends `PATCH /users/me`. Name the reader (AUTH-04 or the Hub) or the column is dead.

**F-8 · defect · medium. International numbers are accepted and texted.** `+14155552671` was texted (`E/v2a.txt`); any `+` and 8 to 15 digits passes. Fintava charges per text and international rates are not in `docs/fintava/fees.md` (only the 7 naira domestic figure). Sign-up is for Nigerian numbers (A4, BVN line); nothing in R-6 or the docs allows other countries. Needs the owner: Nigerian numbers only, or a priced allow-list.

**F-9 · unclear · medium-high, recorded as G-13. No throttle by device or address on signup and start.** Confirmed: 40 signups from one client with 40 different emails and numbers, all 201, 40 texts in 6.7 s (`E/v2d.txt`). Each costs a text and sends an unrequested code to a stranger. The builder filed this as G-13 with an unblock fact for the real send only; the throttle has no owner. I rate it a launch blocker for a public route that spends money. Also a third party can lock a pending sign-up out for 15 minutes by sending four wrong codes for its number (`E/v2d.txt`, last block).

**F-10 · unclear. Fenced files edited without a SHARED-CHANGES row.** `docs/WORKFLOW.md` section 4 fences backend `src/common/**` and `prisma/schema.prisma` (except an additive migration the ticket names). The branch edits `src/common/http-exception.filter.ts`, adds `src/common/phone.util.ts` and `.spec.ts`, and adds three columns and a table; the ticket says "store occupation and account type" and "phone code" but names no migration; the builder reports "No shared-change requests". The edits are additive and the filter change only adds fields when `retryAfterSeconds` is set. Owner to accept or ask for the row.

**F-11 · unclear. A wider answer on the login path.** `docs/WORKFLOW.md` section 10 sends "a widened response, anything in the login path" to the owner. The login rule itself is proven unchanged (below), but the register path now stores `occupation` and `accountType`, so a web user who registers with an occupation now gets it back from `/auth/login` where origin/main answered `null` (`E/v3c` run: main `occupation=null`, branch `occupation=Painter`; keys and types unchanged, and the value is the user's own). Low risk, needs the owner's nod.

**F-12 · differs-for-recorded-reason. A4's line "the number on your BVN".** R-6 removes BVN from sign-up; recorded by the builder for AUTH-04 (designer brief does not change the line). Not fixed here.

**F-13 · differs-for-recorded-reason. Two PROVISIONAL markers (2 new gate warnings).** `AUTH03-LOCKOUT` (900 s) and `AUTH03-RESEND` (60 s): no document names either (A4 draws "Resend in 0:42" only), filed as G-12, config in `phone-verification.config.ts`, overridable by environment. The warns are the gate working; judged correct. SMS price (7 naira) appears only in G-13 and `fees.md`, never on screen.

**F-14 · unclear. The task and the brief point at files that do not exist.** `/home/user/WAWU-ID/CLAUDE.md` and wawu-id `docs/` do not exist (README is the Nest default). The builder's report says `tasks/INDEX.md` was regenerated; it had no change before my run (see the end of this report). The tracked `scripts/gates/__pycache__` files are byte-identical to HEAD (`git status` clean for them), as the builder says.

**F-15 · unclear. Interplay with web `register`.** `register` stores the phone exactly as typed (`0803...`) and checks duplicates exactly, while signup stores `+234...`; the same number can end up on two rows (a web row `0803...` and a mobile row `+234...`), and `findByPhone` then returns one of them arbitrarily. Not reproduced into a takeover; flag for the owner with F-1.

### Is the login-path change safe to merge?

**The rule change itself: yes.** `E/v3-main.json` and `E/v3-branch.json` are the same 26 requests against origin/main and the branch (register, duplicate email and phone, login by email and phone for web, backfilled, never-verified and phone-only rows, wrong password, unknown user, email verify, refresh good, reused and garbage, forgot password, otp, JWKS) and are identical after masking tokens and ids; every legacy and web row keeps `phone_verified_at` NULL and gets 403 `EMAIL_NOT_VERIFIED` where it got it before. Only `confirm` sets `phone_verified_at` (grep), a mass-assignment attempt is ignored, and `updatePhone` and `confirmPhoneChange` clear it (tested through the internal route). Signing up with an existing verified account's email or phone is refused 409.

**The branch as a whole: not yet.** Open defects F-1 to F-9 sit in the new routes, not in the rule; F-1, F-2, F-3, F-4, F-8 and F-9 should be fixed or ruled by the owner before this ships to the live server, because `start`/`confirm` turn an SMS code into a session for existing accounts.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
