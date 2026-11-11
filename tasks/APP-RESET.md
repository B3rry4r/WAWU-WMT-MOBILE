---
id: APP-RESET
title: Password reset, activation and change password work in the web app, by email or by phone code
owner: YOU
area: AUTH
order: 388
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-127, R-133, R-134]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# APP-RESET · Password reset, activation and change password work in the web app, by email or by phone code

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-133 points 4 and 5.
- **The gaps** (mobile `main` 62926a93):
  - `ForgotPasswordScreen.tsx` calls `forgotPasswordRequest` (`src/api/identity.ts`) with `method: 'email'` only. WAWU ID mails a link only to a proven email, so a person whose email is not proven gets nothing and has no other way back in. WAWU ID also takes `method: 'sms'` (a code to the phone, `src/auth/auth.service.ts` near 1262 in wawu-id).
  - `src/app/activate.tsx` ignores the token and goes to sign in, so an activation link opened on usewmt.com never sets a password.
  - `src/app/reset-password.tsx` and `ChangePasswordScreen.tsx` (`POST /auth/change-password`) have not been proven on usewmt.com.
- **Phones are parked (R-134):** this ships to usewmt.com only; no build, no update.
- **Next:** builder on mobile `wmt/APP-RESET`, then a T1 verifier.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/EXPO-AGENTS.md`
- DECISIONS.md R-127, R-133, R-134
- `src/app/forgot-password*`, `src/app/reset-password.tsx`, `src/app/activate.tsx`, `ForgotPasswordScreen.tsx`, `ChangePasswordScreen.tsx`, `src/api/identity.ts`, and the canvas artboards for forgot and reset password (`design/canvas-inventory.json`)
- wawu-id `src/auth/auth.controller.ts` and `auth.service.ts` (`forgot-password` with `method`, `reset-password` with a code or a token, `activate`)

## Goal

A person who cannot get into the web app can get back in, whether their email is proven or not, and a person who is in can change their password.

## Scope

- **Forgot password:** keep email; add "Send a code to my phone" (`method: 'sms'`) and a code entry that resets with WAWU ID's code path. Use the drawn screens; where the canvas draws no phone path, follow the existing code-entry look (the OTP screens) and record it here.
- **Activate:** `activate.tsx` reads `token` and `email`, asks for a new password and calls `POST /auth/activate`; expired or used token gives a plain sentence and a link to forgot password.
- **Reset and change password:** prove both work on the web export against stand-ins, and fix anything that does not.
- **Tests:** jest for each path on web and on native (`Platform.OS` android), with the real handlers and stand-in API.
- **Pictures:** 390 px, dark and light, of every state (forgot by email, by phone, code entry, reset, activate form, success, expired, change password) beside their artboards.

## Capability checks

- [ ] A person whose email is not proven gets a code by text and sets a new password.
- [ ] A person with an activation link sets their first password on usewmt.com.
- [ ] A person with a reset link sets a new password on usewmt.com.
- [ ] A signed-in person changes their password in Settings.

## Builder report

## Verifier report
