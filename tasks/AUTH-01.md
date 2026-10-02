---
id: AUTH-01
title: Sign in and password reset
owner: DEV
area: AUTH
order: 38
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SHELL-01, SHELL-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A22, A23, A24, A25]
---
# AUTH-01 · Sign in and password reset

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py A22 A23 A24 A25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A22, A23, A24, A25, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A22 · Sign in**: 'Welcome back. Sign in with your email.' Email, Password, Forgot password?, Sign in, 'New here? Create an account'.
- **A23 · Forgot password**: 'Forgot your password? We'll email you a link to set a new one.' Email. Send reset link.
- **A24 · Check your email**: 'Check your email. We sent a link to lennox@wawu.africa. It expires in 30 minutes.' Back to sign in. The emailed link opens WAWU ID's existing web reset page (`FRONTEND_URL`); there is no in-app New password screen. The expiry shown is WAWU ID's real one (1 hour), not the canvas's 30 minutes.
- **A25 · Wrong password**: A22 with banner 'That email and password don't match. Check them, or reset your password.'

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A22: 'New here? Create an account' (opens A2): added by AUTH-02

## Capability checks

- [ ] **A22**: a user can enter email + password; sign in; tap Forgot password? (-> A23).
- [ ] **A23**: a user can enter email; send reset link.
- [ ] **A24**: a user can go back to sign in; the emailed link opens WAWU ID's reset page, and the new password works on A22.
- [ ] **A25**: a user can retry; reset password.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states A24, A25.

## What the backend serves today (from the analysis)

- **A22**: served. Missing: Note: login refuses EMAIL_NOT_VERIFIED accounts (auth.service.ts:206) - see A4.
- **A23**: served. Missing: Default method is 'sms' (WhatsApp code) for mobile; mobile must pass method:'email' to get the link this board draws.
- **A24**: partial. Missing: TTL is 1 hour, board says 30 minutes. Reset link points at the WEB /reset-password (FRONTEND_URL); no mobile deep link/universal link. 'New password' screen is not drawn.
- **A25**: served. Missing: Board collapses unknown-email and wrong-password into one message; fine, client maps both. No lockout/rate limit visible in WAWU ID login.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A24: 'It expires in 30 minutes.' (WAWU ID: 1 hour)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Builder session, 2 Oct 2026, branch `wmt/AUTH-01` (mobile, from origin/main ca6d6cb) and `wmt/AUTH-01` in wawu-id (from d9e6e0a). Not committed or pushed: the orchestrator does._

- **Files, mobile:** `src/features/auth/` (`SignInScreen`, `ForgotPasswordScreen`, `AuthFrame`, `Banner`, `signInFailure`, `expiry`), routes `src/app/sign-in.tsx`, `src/app/forgot-password.tsx`, dev harness `src/app/preview/auth.tsx`, test `src/__tests__/auth-sign-in.test.tsx`. Fenced files touched, each a SHARED-CHANGES row "applied by AUTH-01": `src/app/_layout.tsx` (`Stack.Protected`: tabs when signed in, sign-in screens when signed out, splash held until the vault is read), `src/api/identity.ts` (`forgotPasswordRequest`), `src/components/TextField.tsx` (optional `invalid`, `inputRef`). Also `SHARED-CHANGES.md` (rows AUTH-01 #1 to #5), `BACKEND_GAPS.md` (G-25 to G-27), `docs/LOG.md`, generated `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **Files, wawu-id** (`/home/user/WAWU-ID`, branch `wmt/AUTH-01`): `src/auth/auth.service.ts` (`forgotPassword` answers `expiresInSeconds: 3600` when `method: 'email'`, the same in every branch), `src/auth/forgot-password-expiry.spec.ts` (new), `WAWUAfrica_API_Contracts.md`. No migration, no schema change; rollback is reverting the commit. Login is untouched. V3: a request without `method` or with `sms` answers `{ message }` exactly as before (spec asserts the key list); a `method: 'email'` answer gains one field, which the web ignores. wawu-id: tsc clean, `src/auth` 99 tests pass, eslint clean on the changed files (17 older errors sit in other files).
- **Checks and tests** (`src/__tests__/auth-sign-in.test.tsx`, 41 tests through the real route graph, session, identity client and a fetch stub): A22 sign in lands on Home with the typed email and password sent, enter on the password submits, a phone typed `0803...` is sent exactly as typed, Forgot password? opens A23 with the typed email, empty fields send nothing, double tap and enter while busy send one request; A25 wrong password and unknown email show the one banner, keep what was typed, outline Password, store nothing, retry works; unconfirmed (403 `EMAIL_NOT_VERIFIED`, `PHONE_NOT_CONFIRMED`), 429, offline and 500 each show their own message, never A25; A23 posts `method: 'email'` and shows A24 with the typed address and the server's expiry (1 hour, 30 and 90 minutes, 2 hours), omits the line when the server sends none; Back to sign in from A23 and A24; bad email sent nowhere; reset errors keep the address. Cold start signed out shows sign in, signed in shows Home, sign out returns to sign in. **Revert proofs:** 20 mutations (guard, `method`, hard-coded expiry, address, double-tap guards, error mapping, empty check, carried email, outline, banner text, Back, enter, identifier, validation), each made 1 to 30 tests fail and each file restored with a matching sha1 (`scratchpad/revert.py`).
- **Live seam (V9), local stack only** (own databases `wawu_hub_a01`, `wawu_id_a01`, ports 3201 and 3202, no mail sent), web build on 390 px driven by Playwright (`scratchpad/e2e.py`, shots in `scratchpad/shots/e2e`): cold start signed out lands on `/sign-in`; real wrong password and real unknown email both give A25; A23 for a real account gave A24 "It expires in 1 hour." from the real answer; Back to sign in; the emailed link's token (local mail only logs "mail skipped", so a known token was written over the stored hash) reset the password through `POST /auth/reset-password`, the old password then gave A25 and the new one signed in to Home; `GET /users/me` with the app's stored token returned the server's own record (Ngozi Eze; the seeded `user@test.wawu.dev` returned Adaeze Okonkwo); reload signed in goes straight to Home; `08012345678` signs in an account whose `+2348012345678` phone is proven.
- **Pictures:** `/preview/auth` (development only; production redirects home) with `screen=sign-in|forgot|sent`, `email`, `password`, `answer=wrong|unconfirmed|offline|busy|server|hold|ok`, `expires=<seconds>`. A22 `?screen=sign-in&email=lennox@wawu.africa&password=password11`; A25 the same plus `&answer=wrong` then press Sign in; A23 `?screen=forgot&email=...`; A24 `?screen=sent&email=...&expires=3600`. Renders to compare: `python3 scripts/design/render_design.py A22 A23 A24 A25`. Light and dark by the browser's colour scheme. My own screenshots exist in both themes; I did not judge them against the artboards (the verifier does).
- **Counts:** before `npm run check`: 16 suites, 285 tests, gates 75 files scanned 0 findings, 201 tasks. After (merged with origin/main ca6d6cb): 17 suites, 326 tests (+41), gates 85 files scanned 0 findings, 201 tasks, exit 0.
- **Defaults (agent), owner may override:** (1) the route-graph edit above, though Scope says no `_layout.tsx` edits (nothing else could show a signed-out user these screens); (2) no back button on A22 when nothing is behind it (a dead button otherwise; AUTH-02's welcome screen makes it appear); (3) 'New here? Create an account' is left out (AUTH-02 adds it, as the task says); (4) the Email field takes whatever is typed, so a phone number signs in as WAWU ID accepts it; no UI invented for it; (5) an unconfirmed account (403 `EMAIL_NOT_VERIFIED` or `PHONE_NOT_CONFIRMED`) sees "Your account isn't confirmed yet / Finish confirming it, then sign in." with no promise of a code, 429 "Too many tries / Wait a moment, then try again.", offline "No connection / Check your internet and try again.", 500 "Something went wrong on our side / Try again in a moment."; (6) an empty field is refused on the phone with "Enter your email." or "Enter your password."; A23 refuses a non-email with "Enter the email you signed up with, like name@example.com."; (7) A24 shows the address as typed and, when the server sends no lifetime, no expiry line; (8) no biometric sign-in (not drawn; R-26 covers PIN approvals only); (9) no "Resend" on A24 (not drawn).
- **Gaps:** G-25 (A24 expiry reaches the app only once wawu-id with this change is deployed; owner), G-26 (an app sign-up never proves its email, so no link is mailed to it; AUTH-05 and owner), G-27 (no limit per address on login or forgot-password; wawu-id, owner to assign). SHARED-CHANGES AUTH-01 #4: `Banner` should become a shared component (PaySheet has its own).
- **NOT RUN:** the real emailed link opening WAWU ID's web reset page (the web page is not served locally and no mail is sent; unblocked when the web app runs against the local wawu-id, or on a live account the owner provides); any sign-in or reset on `id.wawuafrica.com` with a real account (none provided: unblocked by a test account from the owner); a phone-typed sign-in for an account created by AUTH-03's sign-up (its text needs Fintava SMS, G-15; the same lookup was run on an account whose phone was marked proven locally); V10 on a device (Android build not made); typed-routes `.expo/types` are generated by `expo start`, so run it once if `tsc` complains about the new routes.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
