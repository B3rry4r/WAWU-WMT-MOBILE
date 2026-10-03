---
id: AUTH-04
title: Sign-up: email and phone
owner: DEV
area: AUTH
order: 51
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
