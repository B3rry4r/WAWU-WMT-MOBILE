---
id: WEBAPP-05
title: The PIN and the selfie step work on a laptop
owner: YOU
area: WEB
order: 365
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: []
decisions: [R-127]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-05 · The PIN and the selfie step work on a laptop

## Current state

As of 9 Nov 2026.
- **Status:** verifying. Built by the WEBAPP-05/06 bundle builder on branch `wmt/WEBAPP-05`.
- **Done:** a laptop keyboard drives the PIN keypad and the amount keypad on the web (digits, Backspace, Enter, "." and ","); the hosted selfie opens in the same tab and returns to this web app's own `/selfie`.
- **Not changed:** the phone (keys and the selfie open as before).
- **Default taken:** tokens stay in `localStorage` on the web (lead default); the return address is read from `window.location.origin` in `src/features/open-wallet/api/hostedPage.ts`, because WEBAPP-01's `appLinks.ts` had not changed (it is untouched by this branch). When it lands, `selfieReturnAddress()` can read from it.
- **PHONE CHECK (owner, before the update):** the hosted selfie out and back on a real phone browser (iOS Safari, Android Chrome): the page leaves this tab and returns to `/selfie` on usewmt.com and the opening continues. Needs `https://usewmt.com` in the Hub's `NUVION_LIVENESS_REDIRECT_ORIGINS`.
- **NOT RUN:** the hosted selfie on the stack (the stack's hosted selfie is off, so jest only: same tab, no `Linking.openURL`, return address = page origin); a physical keyboard with an IME.
- **Next:** the verifier runs the PIN attacks (wrong PIN five times, a held key, a key with a focused field).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

A person on a laptop can type their PIN on the keyboard, and the hosted selfie step opens and returns to the web app, so opening a wallet and paying work without a touch screen.

## Scope

- `src/components/pin-sheet/Keypad.tsx` and the amount keypad on `/send/amount`: on the web, digit keys, Backspace and Enter work as taps do (focus kept in the sheet; nothing typed reaches any other field; the PIN never appears in the DOM as text or in any log).
- `src/features/open-wallet/HostedSelfieScreen.tsx`: on the web, open the hosted page in the same tab (no popup after an await) and return to the web app's `/selfie` (the return address comes from WEBAPP-01's `appLinks.ts`).
- Lead default (owner may override): tokens stay in `localStorage` on the web at launch, behind WEBAPP-01's Content-Security-Policy; moving them to an http-only cookie is an after-launch task.

## Capability checks

- [ ] A user on a laptop types their 4-digit PIN to send money and to unlock the card; a wrong PIN five times locks exactly as on the phone (V8).
- [ ] A user opening a wallet on the web with the hosted selfie on goes out and comes back to `/selfie` on usewmt.com and continues (on the stack with the stand-in; PHONE CHECK on a real phone browser).

## Builder report

- Files: `src/components/pin-sheet/useKeypadKeys.ts` (new), `Keypad.tsx`, `src/components/amount-entry/AmountKeypad.tsx`, `src/features/send/AmountScreen.tsx` (Enter = Continue), `src/features/open-wallet/api/hostedPage.ts` (new), `liveness.ts`, `HostedSelfieScreen.tsx`. The two keypad files are in the fenced `src/components/**` but the ticket's scope names them; no shared-change row.
- Keys: only the keypad mounted last listens (a screen left open under a sheet hears nothing); it takes every digit, Backspace, Delete and Enter and Space (so a button left focused behind the sheet is never pressed; that button is blurred when the keypad opens) even while locked or checking, and ignores Ctrl/Alt/Meta keys and a held key. The amount keypad leaves a focused text field (the note) its own keys. No input element exists, so the PIN is never in the DOM; nothing is logged.
- Tests: `src/components/pin-sheet/__tests__/laptopKeys.test.tsx` (8: type 1234 submits once with 1234; held key and a fifth digit; wrong PIN five times locks and later keys are swallowed; focus; PIN not in the tree or console; a sheet over a keypad; amount keys; no listener on android) and one case in `hostedSelfie.test.tsx` (web: same tab, `https://usewmt.com/selfie`, no Linking).
- Stack proof (real Hub, Nuvion stand-in): wrong PIN x5 -> 403 pin_incorrect (4,3,2,1 left) then 423 pin_locked on the fifth; the right PIN afterwards is still 423; balance unchanged (5,000,000 kobo). In a real Chromium on the stack web export, typing 4829 on the keyboard filled the dots and paid.
- Checks: tsc EXIT 0; eslint on 24 changed files EXIT 0; gates 0 fail; jest of 77 suites in the touched areas EXIT 0 (1192 passed, 5 skipped); laptopKeys 8 passed; hostedSelfie 38 passed.
- Gaps: none filed; no Hub change.

- Pictures: 40 of 40 taken (10 states x dark and light x 390 and 1440) on the stack web export, into /tmp/wmt-shots/webapp05/ (no artboard exists for these states: the tasks list none, so there is no picture beside an artboard; the pay sheet is the shared one). Money proofs: /tmp/wmt-shots/webapp05/money-proofs.txt.

## Verifier report

## Owner sign-off
