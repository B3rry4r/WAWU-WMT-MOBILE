---
id: APP-RESET
title: Password reset, activation and change password work in the web app, by email or by phone code
owner: YOU
area: AUTH
order: 388
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-127, R-133, R-134]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# APP-RESET · Password reset, activation and change password work in the web app, by email or by phone code

## Current state

As of 11 Nov 2026.
- **Status:** built, verifying. Mobile `wmt/APP-RESET`. Ships to usewmt.com only (R-134).
- **Built:** Forgot password has "Send a code to my phone" (`method: 'sms'`; the field takes the email or a phone number, a Nigerian number is written +234) then the sign-up's six code boxes, then New password, then "Password changed". WAWU ID checks the code only with the password, so a wrong code (401) returns to fresh boxes with "That code isn't right". `/activate` reads `token` and `email` and sets a first password through `POST /auth/activate`; a spent token or an already-activated account gets one plain sentence and the way to Forgot password. `/activate` and `/reset-password` share one route body (`LinkPasswordRoute`). Reset link and Settings change password proved on the web export against stand-ins; nothing needed fixing.
- **Decisions (no canvas draws a phone path or a New password board):** phone path follows the code screen (A4, A15) and A23's form; the success screen is the reset link's; after a code reset the session WAWU ID returns is not kept, the person signs in. Resend is open at once because WAWU ID names no wait (a too-early ask shows its 429 figure). Words say "a code to the phone", never "text" or "WhatsApp" (WAWU ID sends it by WhatsApp today).
- **Gaps and shared changes:** SHARED-CHANGES APP-RESET #1 (`src/api/identity.ts`); BACKEND_GAPS G-RESET-APP-1 extended (reset by code and activate are not in WAWU ID's contract, bodies hand-typed).
- **Pictures:** `audits/APP-RESET/` (390 px, dark and light, from the web export with WAWU ID faked by `page.route`), A23, A24, A4, A15 beside them as `artboard-*`.
- **NOT RUN:** a real WAWU ID or Hub, a real phone (PHONE CHECK below), a Vercel build.
- **PHONE CHECK (waits, R-134):** the phone-code boxes with the OS code offer (autofill from a message) and the Android back button inside the code flow (it leaves Forgot password, not one step back).
- **Next:** a T1 verifier.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/APP-RESET.md](history/APP-RESET.md).

