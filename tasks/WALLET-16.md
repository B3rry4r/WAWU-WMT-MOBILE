---
id: WALLET-16
title: Earnings land in the wallet automatically
owner: YOU
area: WALLET
order: 98
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-12]
decisions: [R-11, R-55, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-16 · Earnings land in the wallet automatically

## Current state

As of 16 Oct 2026, from the lead's log (11 Oct 16:45) and the branch.
- **Status:** building on its branches (round 1 verified: the code held on every money attack). This file on main still says todo.
- **Branches:** mobile `wmt/WALLET-16` 66c375c. Backend `wmt/WALLET-16` 18ea4fb (migration `20261021180000_earning_settlements`).
- **Merged and live:** nothing of this task.
- **Open findings:** medium: F1 (test gap on three money rules; the code is right), F2 (lease and bounds test gap) and F3 (a `refused` earning never goes to review, against CONVENTIONS section 19). The lead counts F2 and F3 as medium (16 Oct 2026), so all three get a fix round.
  - Lows F6 and F7 are in tasks/SWEEP-MONEY.md. F5 (G-704): /me/earnings answers 0 where /money/earnings answers 433,499.
- **Next:** fix round 2: tests for F1 and F2, the review path for F3 (MONEY-18's WalletHoldService has the same dead branch). Before the merge, count the unsettled completed sales with a payee on production (F8: the first sweep pays them all). G-703 is the owner's: earnings under about N155 cost more to move than WAWU's 15%.
- **Records:** on the branch, `wmt/WALLET-16`, in tasks/WALLET-16.md there (40 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py WALLET-16`; the history goes to tasks/history/WALLET-16.md.
- **Design v2 (16 Oct 2026, DESIGN-V2-CUT):** two owner rulings apply on top of round 2: R-55 (72 h review after the first refusal; one daily move per creator with a ₦200 floor). See the section below. The branch builder takes them in fix round 2.

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

- [ ] Earnings shown equal the sum of that creator's sales after the split.
- [ ] A creator with no wallet who earns, then opens a wallet, sees the waiting earnings land once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
