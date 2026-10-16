---
id: WALLET-23
title: Account limits from Fintava
owner: YOU
area: WALLET
order: 261
priority: after-launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-12]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-23 · Account limits from Fintava

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-23.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-20` (this branch contains it); API types regenerated from backend `wmt/WALLET-23` (4c2b5f9).
- **Built:** the account's daily limit from Fintava. The tier comes from the balance read; its daily limit is the setting `FINTAVA_TIER_DAILY_LIMITS_KOBO` (empty: the `limits.md` policy). A balance read keeps it on the wallet row; `GET /money/wallet` fills W35's `limits` from that (no tier named; hidden until a limit is kept and under Nuvion); `MoneyLimits` refuses a debit over it with `403 limit_reached`, `limit: daily`, `limitKobo`, `remainingTodayKobo` and the limit in the sentence. All money out of the wallet counts together in the Lagos day.
- **Open for the lead:** SHARED-CHANGES WALLET-23 #1 (migration, rename at merge if needed) and #2 (contract, then `npm run api`).
- **Open for the owner:** none new. A17 to A20 still wait on the owner's ruling; Fintava's own limit refusal and question 16 are unchanged.
- **History:** the builder report is in tasks/history/WALLET-23.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: a balance answer with no tier keeps the old copy; the last purchase can pass by one fee over the limit; the copy is filled only by a balance read, so opening a wallet leaves W35's row hidden; a stale G-7 comment in WalletSettingsScreen.tsx. They are in tasks/SWEEP-MONEY.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head (WALLET-23 first in the stack) for the owner to merge after batch 2. SHARED-CHANGES WALLET-23 #1 (migration stamp 20261022010000, sorts after batch 2's last) and #2 (contract, then npm run api, done here) are for the lead.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Limits come from Fintava, never from the canvas. Fintava's API has no tiers and every wallet gives its NIN at
opening (BRIEF A17 to A20), so there is no NIN upgrade.

## Scope

Read the account's limits from Fintava once Fintava publishes them, enforce them on debits, and show them on the
W35 limits row. What A17 to A20 become waits for the owner's ruling on them (after launch).

## Capability checks

- [ ] A debit over the account's limit is refused with the limit shown.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-23.md](history/WALLET-23.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
