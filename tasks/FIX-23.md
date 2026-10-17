---
id: FIX-23
title: The web sign-up keeps the phone's dial code, so the billing currency reads it right
owner: YOU
area: FIX
order: 352
priority: after-launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [TIER-01]
decisions: [R-44]
passes: [V1, V2, V3, V4, V5, V6, V7, V9]
artboards: []
---
# FIX-23 · The web sign-up keeps the phone's dial code, so the billing currency reads it right

## Current state

As of 16 Oct 2026.
- **Priority:** after-launch, set by OPS-R0 (records pass, 17 Oct 2026). Not launch work by R-49 (owner, 10 Oct 2026): website tasks are paused until the owner says otherwise; the site serves only the registration link.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-23.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/TIER-01.md` (round 2 verifier finding F1, and the billing currency order: a fixed currency, else a naira wallet or a Nigerian phone, else USD)
- wawuafrica `src/app/(auth)/sign-up/components/SignUpFlow.tsx` and the API call it makes; follow wawuafrica's CLAUDE.md

## Goal

TIER-01's verifier found that the web sign-up drops the phone's dial code: the form keeps `phoneCountryCode` (default `+234`) apart from `phone` and sends only the local number. The country also defaults to Nigeria. So a person in the United States who keeps that default, or types a local number, is read as Nigerian and billed in naira at their first purchase, and the currency never changes after that.

## Scope

- The sign-up sends the phone in full international form (dial code plus number, as the app's sign-up does), never the local part alone.
- The country is not pre-filled as Nigeria when the dial code says otherwise; follow how the app's sign-up picks it.
- No change to the backend's currency rule. People who already signed up keep what is stored (no data change without a lead ruling); count how many stored phones lack a dial code, from the Hub's read model, and put the count in the report.
- No em-dashes in any copy.

## Capability checks

- [ ] A web sign-up with `+1` and a US number stores `+1...`, and `GET /plans` for that person answers in dollars (V9 against a local Hub).
- [ ] A web sign-up with the default `+234` stores `+234...` and answers in naira.
- [ ] The count of stored phones without a dial code is in the report.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
