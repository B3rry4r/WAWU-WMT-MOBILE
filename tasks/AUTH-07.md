---
id: AUTH-07
title: Sign-up verifies by email code; no SMS
owner: YOU
area: AUTH
order: 181
priority: launch
repo: both
type: mobile-screen
status: building
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

(written at the end of the build)
