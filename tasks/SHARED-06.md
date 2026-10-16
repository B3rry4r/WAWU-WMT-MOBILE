---
id: SHARED-06
title: Shared components, theme tokens and the API client take the requests screens left in SHARED-CHANGES
owner: YOU
area: SHARED
order: 229
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [SHARED-05]
decisions: []
passes: [V1, V2, V5, V6, V7]
artboards: []
---
# SHARED-06 · Shared components, theme tokens and the API client take the requests screens left in SHARED-CHANGES

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): SHARED-05.
- **History:** none yet. Reports go to tasks/history/SHARED-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: 7, AUTH-01 #4, KYC-05 #1, KYC-05 #2, WALLET-11 #1, ME-11 #2, SETTINGS-02 #2, KYC-04 #2, ME-06 #4, SETTINGS-01 #2, HOME-09 #5, HOME-02 #4, HOME-02 #1, KYC-02 #4, KYC-05 #3, 11 (MONEY-11), SETTINGS-01 #1, HOME-02 #3, ME-06 #2 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `src/components/ui/` (the barrel), `src/theme/`, `src/api/`; each row's raising task file

## Goal

Nineteen rows ask for a prop on a shared component, a theme token, an API-client change or an icon, and none were applied, so screens carry local stand-ins (named constants, local helpers, a deprecated path). Nothing is broken for a person today; the stand-ins drift.

## Scope

- Apply each row as written: the shared props and new shared pieces (`Banner`, `Switch`, `SwitchRow`, `ScreenFrame`, `PinDots`, the `TextField` and `Button` props), the shadow and overlay tokens (delete `shadow.ts` and `atStrength` once nothing uses them), the API client rows (`ApiError.detail`, `retryAfterSeconds`, `unwrap`, `changePassword` and `logoutRequest` in `src/api/identity.ts`, `nairaToKobo` into `src/api/`), and the four social icons.
- Then move each raising screen off its stand-in, so there is one copy of each thing. A screen must look and behave the same before and after (screenshots of every touched screen, light and dark).
- Mark each row applied. Rows that need a ruling are listed, not guessed.

## Capability checks

- [ ] Every row applied or listed with the reason.
- [ ] Every touched screen pictured before and after, identical except where a row says otherwise.
- [ ] No local stand-in left that a row names (grep).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
