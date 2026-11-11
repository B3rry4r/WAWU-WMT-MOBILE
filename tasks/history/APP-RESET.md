# APP-RESET · round history

Moved out of [tasks/APP-RESET.md](../APP-RESET.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/api/identity.ts`, `src/app/{forgot-password,activate,reset-password}.tsx`, `src/features/auth/{ForgotPasswordScreen,ResetPasswordScreen,ResetByCodeFlow,LinkPasswordRoute,resetPassword}`, tests `src/__tests__/appResetRoutes.test.tsx` (real router, android and ios), `appResetWeb.test.tsx` (web), `appLinkRoutes.test.tsx` and `route-guard.test.tsx` (the two LINKS-01 activate cases and one PUBLIC reason rewritten: they pinned the old redirect this task replaces; no other assertion touched).
Capability checks: all four proved in jest (token, email, code and passwords sent exactly; refusals; offline) and on the web export with faked WAWU ID (pictures).

## Verifier report

## Verifier report

_Verifier (T1), 11 Nov 2026, code `7fcab4d8` against base `edf324dc` and `origin/main`. Verdict: **MERGE**._

| Pass | Result | Evidence |
|------|--------|----------|
| V1 diff against report | passed: 55 files; the builder's list matches (the 28 pictures, 2 new test files, 3 routes, 5 auth features, `identity.ts`, SHARED-CHANGES, BACKEND_GAPS, docs). `package.json` and lockfile equal main's. | `git diff --stat edf324dc 7fcab4d8` |
| V2 no stand-ins | passed: the phone-code boxes reuse `CodeScreen`, the new password step reuses `ResetPasswordScreen`; no copy of a main component. | `ResetByCodeFlow.tsx`, `LinkPasswordRoute.tsx` |
| V3 check | NOT exit 0 on two loaded runs (see Current state); typecheck, lint pass; gates exit 0 (63 tests); `npm run tasks` exit 0; the two failing suites pass alone. | scratch `check.log`, `check2.log`, `gates.log`, `tasks.log` |
| V4 states | passed on the real wire (fake WAWU ID): wrong code 401, too-early resend 429 (47 s figure shown as "Resend in 0:45"), short password, spent token 401, already activated 400, no token. | `audits/APP-RESET-verify/v0*`, `v1*` |
| V5 pictures | passed with lows: 28 builder pictures opened beside A23, A24, A4, A15 (`build/design_shots/`); own 30 at 390 px. The phone path, New password step and /activate are undrawn; they follow A4 and A23 as the task records. | `audits/APP-RESET-verify/` |
| V6 flow walk | passed, below | |
| V9 live seam | NOT RUN: no live service may be called. Bodies matched to the DTOs in code instead. | |

Walk, on a fresh web export (`expo export --platform web`, fresh TMPDIR, no "No routes found"), requests recorded by `page.route`:
- Phone code: typed `0801 234 5678`, `+234 801 234 5678` and `2348012345678` all send `{"identifier":"+2348012345678","method":"sms"}`. Code `123456` with a 401 returns to fresh boxes with "That code isn't right"; `654321` then sends `{"identifier":"+2348012345678","code":"654321","newPassword":"longenough1"}` and "Password changed" shows. Passwords under 8 give "Use at least 8 characters." (rules 8 to 128 match ResetPasswordDto).
- Email path: `{"identifier":"Ada@Example.test","method":"email"}`, "Check your email". Unchanged from before.
- `/activate?token=abc123&email=Ada%40Example.test`: sends `{"activationToken":"abc123","email":"ada@example.test","password":"longenough1"}`, exactly ActivateDto's three fields; 401 and 400 "Account already activated" both show "This link no longer works / Ask for a reset link instead" with "Back to Forgot password"; `/activate` with no token shows the same screen at once with nothing sent. `/reset-password?token&email` and the change password pages work (jest `appResetRoutes` android and ios, `appResetWeb`, and the builder's pictures 08 and 13/14).
- Rewritten tests: `appLinkRoutes.test.tsx` (2 activate cases) and `route-guard.test.tsx` (PUBLIC reason string) follow R-133 point 1 (mailed links open a working page); the old assertions pinned the redirect the task removes, and the new ones assert the form is shown, sign-in/Home is not, and the path stays `/activate`. Not weakened.
- `src/api/identity.ts:94-151` is a fenced file; SHARED-CHANGES "APP-RESET #1" records it, the default argument keeps every caller, and the added code is the minimum (one param, two calls). The wawu-id server matches `phone` exactly as stored, and the app sends E.164, which fits.

Findings (none medium or worse):
- **low, defect** `src/features/auth/ResetByCodeFlow.tsx:67-72` and `resetPassword.ts:16-18`: an expired code (wawu-id's one 401 for wrong, expired or unknown account) reads "That code isn't right", and only after the person has typed a new password. Honest but could also say "or has expired". To SWEEP-AUTH.
- **low, defect** `ResetByCodeFlow.tsx:21` / the Account field shows the full number (`+2348012345678`) read-only; A4 draws it masked. To SWEEP-AUTH.
- **low, differs-for-recorded-reason** Resend is open at once (A4 draws a countdown): wawu-id names no wait; recorded in the builder's decisions and BACKEND_GAPS G-RESET-APP-1. A 429 then shows its own countdown (seen).
- **low, test-gap note** `src/api/identity.ts:145` the "already activated" refusal is matched by the English words of the server message (`/already activated/i`); a reworded server message would show the generic form error. A test that feeds a reworded 400 would not kill it; a server `code` would. Not a defect today.
- **note** two full-suite runs on the shared 4-core machine each lost one unrelated suite (SIGKILL; a timing test). Re-run the check on the batch head.
