---
id: WALLET-16
title: Earnings land in the wallet automatically
owner: YOU
area: WALLET
order: 98
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-12]
decisions: [R-11, R-55, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-16 · Earnings land in the wallet automatically

## Current state

As of 17 Oct 2026, merged onto batch 7 and the cutoff added (bundle B1, Sonnet builder), waiting for a verifier.
- **Status:** verifying. Round 2 (verified earlier) is merged onto batch 7; the lead's start-time ruling of 17 Oct is built.
- **Branches:** backend `wmt/B1` `e41210e` (on `origin/wmt/MERGE-7` `432f017`, with backend `wmt/WALLET-16` `315b69b` merged), mobile `wmt/B1` (records and the contract copy; docs only). Migrations `20261025120000_earning_settlements` (renamed from `20261021180000`, contents unchanged) and `20261025130000_earning_sweep_start` (new).
- **Merged and live:** nothing of this task.
- **Merge onto batch 7:** two textual conflicts and one number clash: `money.module.ts` (both providers kept), `schema.prisma` (both models kept), and the earnings section of `CONVENTIONS.md` is now **section 26** (WALLET-07 holds 19); the comments, `WALLET.md` and the contract pointers say 26. `contract/openapi.json` was regenerated (additive over batch 7 only).
- **The cutoff (lead ruling 17 Oct, default, the owner may override):** the sweep makes an earning only for a sale completed on or after the start. The start is `EARNINGS_SWEEP_START` when set (ISO with a zone, a bad value stops the app), else the moment the code first reached the environment, stored once in `EarningSweepStart` (one row, written by its migration). A sale before it is never paid by the sweep. `GET /admin/money/earnings/before-start` (superadmin and finance, `limit`, `after`) lists those sales oldest first; it moves nothing. A sale at exactly the start is paid, the millisecond before is not.
- **Specs:** `earning-sweep-start.contract.spec.ts` (5 tests, Nuvion stand-in): both sides of the cutoff with the later sale landing once and the earlier getting no earning, the exact instant, the setting winning and bad values refused, the first-run row stored once, paging and the closed admin route. The existing Nuvion earning specs (38 tests) still pass; the Fintava spec was not run (never touched).
- **NOT built:** R-55 (the daily move per creator with the 200 naira floor, and review 72 h after the FIRST refusal). The branch predates it, so the sweep still moves one earning per sale and the review bound is as round 2 left it. It needs a builder of its own.
- **For the lead:** F8 (count the unsettled completed sales with a payee on production) matters less now: the first sweep pays none of them, they are listed. Decide whether the start should be a date the owner names. Set `EARNINGS_SWEEP_START` on the Hub before deploy if the owner wants older sales paid.
- **Next:** a verifier on the cutoff; a builder for R-55.
- **Records:** tasks/history/WALLET-16.md.

## Owner rulings of 16 Oct 2026 (R-55)

- **Refused earnings (R-55, owner 16 Oct):** an earning the wallet refuses goes to review 72 hours after its FIRST refusal. This settles F3 (a `refused` earning never reached review): the review path uses 72 h from the first refusal, not a count of tries.
- **One move a day (R-55, owner 16 Oct; G-703):** all of a creator's earnings go to their wallet once a day in one transfer per creator. A day's total under ₦200 waits for the next day and is added to it. This replaces one move per sale and answers G-703 (sales under about ₦155 no longer cost WAWU more than its 15%): the provider's charge is paid once per creator per day. The split is unchanged: 85/15 (R-5). The ₦200 floor and the 72 h are settings.
- The sweep builds the reference per creator and day (idempotent); a creator with no wallet keeps earning and the money waits (R-11).
- F8 stays open (the owner or production access): the count of unsettled completed sales with a payee on the LIVE database before this task merges.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-11 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Sales, tips and answered paid questions land in the creator's wallet automatically (R-11). W39 shows where they came from.

## Scope

Per-content earnings breakdown; automatic settlement into the wallet. A creator without a wallet keeps earning; the money waits and lands the moment they open one.

## Capability checks

- [x] Earnings shown equal the sum of that creator's sales after the split.
- [x] A creator with no wallet who earns, then opens a wallet, sees the waiting earnings land once.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-16.md](history/WALLET-16.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
