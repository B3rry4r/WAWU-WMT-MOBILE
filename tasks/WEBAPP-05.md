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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-05.md](history/WEBAPP-05.md).

## Owner sign-off
