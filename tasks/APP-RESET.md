---
id: APP-RESET
title: Password reset, activation and change password work in the web app, by email or by phone code
owner: YOU
area: AUTH
order: 388
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: []
decisions: [R-127, R-133, R-134]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# APP-RESET · Password reset, activation and change password work in the web app, by email or by phone code

## Current state

As of 11 Nov 2026.
- **Merged (lead, 11 Nov 2026):** mobile PR #29 merged as cb7ded79 (CI green on 2a469ccb with expo-doctor pinned to 1.21.6); live on usewmt.com since 13:30 UTC. Lead live check at 390 px: forgot password shows "Send a code to my phone"; /activate with no link shows "This link no longer works".
- **Status:** verified, `review`. Verifier (T1) verdict **MERGE**: no blocker, high or medium finding. Mobile `wmt/APP-RESET` (7fcab4d8). Ships to usewmt.com only (R-134).
- **Verified:** phone-code reset, the email path (`method: 'email'` unchanged), `/activate`, the reset link and Settings change password, on a fresh web export served on 3891 with WAWU ID and the Hub faked by `page.route`; every request body read off the wire and matched to wawu-id `origin/main` DTOs (see the report in `tasks/history/APP-RESET.md`).
- **Pictures:** the builder's 28 in `audits/APP-RESET/`, the verifier's 30 in `audits/APP-RESET-verify/` (390 px, dark and light).
- **Open lows (SWEEP-1111 rows A1 to A4, no round):** an expired code reads "That code isn't right" and only after the new password is typed; the phone-code New password step shows the full +234 number, not masked; Resend is open at once (recorded: WAWU ID names no wait).
- **NOT RUN:** a live WAWU ID or Hub, a real phone (PHONE CHECK below, R-134), a Vercel build. `npm run check` did not exit 0 in two full runs on a loaded shared machine: run 1 one suite SIGKILLed by the OS (`pin-sheet/laptopKeys`), run 2 one timing failure (`library/entries`, "M27"); both suites pass alone (9 and 12 tests), typecheck, lint, gates (63 tests) and `npm run tasks` exit 0, 547 of 548 suites and 8138+ tests passed each time. The batch full check on a quiet machine is the gate.
- **PHONE CHECK (waits, R-134):** the phone-code boxes with the OS code offer (autofill from a message) and the Android back button inside the code flow.
- **Next:** merge into the web batch.

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

