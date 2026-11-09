---
id: WEBAPP-05
title: The PIN and the selfie step work on a laptop
owner: YOU
area: WEB
order: 365
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: todo
depends_on: []
decisions: [R-127]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-05 · The PIN and the selfie step work on a laptop

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-05.md.

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

## Verifier report

## Owner sign-off
