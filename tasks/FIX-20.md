---
id: FIX-20
title: Provider webhook deliveries are not kept forever
owner: YOU
area: FIX
order: 224
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [NUV-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-20 · Provider webhook deliveries are not kept forever

## Current state

As of 16 Oct 2026, from the lead's log (12 Oct 17:05) and the branch.
- **Status:** verifying. Built; the verifier report says "Not started". This file on main still says todo.
- **Branches:** mobile `wmt/FIX-20` 8c3a2f0. Backend `wmt/FIX-20` bb9bbd1 (migration `20261021230000_webhook_body_retention`; G-750 to G-752).
- **Merged and live:** nothing of this task. **Open findings:** none yet.
- **Next:** a verifier session. CONVENTIONS section 21 (this task) and section 19 (MONEY-16, WALLET-16) need their numbering settled at merge.
- **Records:** on the branch, `wmt/FIX-20`, in tasks/FIX-20.md there (17 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py FIX-20`; the history goes to tasks/history/FIX-20.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/NUV-01.md` (builder decision 9 and the lead's ruling 11) and the Fintava webhook module on backend main

## Goal

`NuvionWebhookEvent` and `FintavaWebhookEvent` keep each delivery's raw body and parsed copy (names, account numbers, narrations) with no person column and no end date. Neither the account purge nor the data export can find them, so they are kept forever.

## Scope

- After a set period, a daily job clears the raw body and the parsed copy. The period is a setting with a default of 90 days, marked `PROVISIONAL` (Default (agent), owner may override).
- Keep the provider's event id, the received time and the outcome, so a delivery the provider sends again after clearing is still recognised as a repeat and never applied twice.
- Write the rule in `docs/contract/CONVENTIONS.md` and in the privacy data map: retention, not the purge, covers these rows.

## Capability checks

- [ ] A delivery older than the period has no body after the job runs; a newer one is untouched.
- [ ] A cleared delivery sent again is refused as a repeat (both providers).
- [ ] The job is safe to run twice, and safe to run while a delivery is arriving.
- [ ] Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
