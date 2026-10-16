---
id: FIX-20
title: Provider webhook deliveries are not kept forever
owner: YOU
area: FIX
order: 224
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [NUV-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-20 · Provider webhook deliveries are not kept forever

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Verified once: nothing a refund, dispute or reconciliation reads is deleted (the readers were scanned over main and every open branch); by the 15 Oct rule the verdict is merge, nothing medium or worse. Stacked on POINTS-04 (this branch contains `wmt/POINTS-04`, which contains WALLET-10, WALLET-07, NUV-06 and MONEY-16); backend main `18ac5f9` is in it.
- **Branches:** mobile `wmt/FIX-20` (this branch; POINTS-04's mobile head merged, API types regenerated from backend `wmt/FIX-20`; the task adds no route, so the contract is POINTS-04's). Backend `wmt/FIX-20` (POINTS-04 merged; migration renamed to `20261021320000_webhook_body_retention`, contents unchanged). No PRs yet.
- **Merged and live:** nothing of this task.
- **Conventions:** the backend section for this task stays number 21 in `docs/contract/CONVENTIONS.md` (19 WALLET-07, 20 POINTS-04, 22 MONEY-16); the "section 21" comments in `account-data-map.ts` and `data-export-sections.ts` and the README line are unchanged.
- **Open findings:** blocker 0, high 0, medium 0. The lows (section 21's "disagreement" wording against the code marking those deliveries `processed`; `failed`, `unrecognised` and `pending` bodies kept for ever, G-750; DATA-INVENTORY rows I-092 and I-281 lack "cleared after 90 days") are in tasks/SWEEP-MONEY.md.
- **Next:** the lead opens one backend pull request from this head (WALLET-10, POINTS-04 and FIX-20 stacked) for the owner to merge, then mobile sign-off.
- **Records:** the round history is in tasks/history/FIX-20.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-20.md](history/FIX-20.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

**Evidence** is in the lead's scratchpad `f20/`: `logs/` (each check's log with its EXIT line, the gates of the branch and of main, `protected.log`, `shard-*.log`), `hub/run/` (the sender's lines, the Hubs' log lines, `load-result.txt`) and `mut/results.txt`. Every server I started (two Hubs, the mock WAWU ID, the Fintava stand-in, the database bridge) was stopped by its PID; none is left running; databases `bf20_*` and my worktrees are removed.
