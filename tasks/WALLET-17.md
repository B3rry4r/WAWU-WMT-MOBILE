---
id: WALLET-17
title: Hosts receive their share: community credits and event tickets
owner: YOU
area: WALLET
order: 159
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [MONEY-18, WALLET-16, EVENTS-07, INBOX-16]
decisions: [R-5, R-11, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-17 · Hosts receive their share: community credits and event tickets

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge after rounds 2 and 3 (host shares ride the daily move; the deletion check counts owed host shares) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/B3a.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main.
- **Branches:** backend `wmt/B3a` `d89e47c` (round 2 `242ce9d`, round 1 `ed45009`, on `origin/wmt/WALLET-16-R55` `9580bb0`), mobile `wmt/B3a` (records and the contract copy; docs only). Migrations `20261025160000_host_share_earnings` and `20261025170000_hold_release_earnings`.
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-12`, not on main).
- **What is built:** (1) Community credits: a host's share of spent credits (`CreditSpendEarning.hostShareKobo`, 85%) becomes an `EarningSettlement` of kind `community_credits` and travels in the host's ONE move a day with their sales (R-55; a day under N200 waits; WAWU pays the charge once). Only spends paid for entirely with wallet-bought packs are taken; Flutterwave packs and mixed spends wait for the web (G-829). (2) Event tickets: `EventHostPayoutService` releases each paid order's `event_ticket` hold once `endsAt ?? startsAt` (plus `EVENT_PAYOUT_DELAY_HOURS`, default 0) has gone by; a called-off or removed event, an order not `paid` and an event not over pay nobody.
- **Round 2, the lead's ruling of 17 Oct (verifier finding (a) closed):** the host's share of ticket sales is an EARNING like any other. The release is `holds.release(..., { asEarning: true })`: one short database write makes the hold `released` and the host's `EarningSettlement` (kind `event_ticket`, the 85%, one per paid order); the shares of all of a host's orders, and their credit shares and sales, go to their wallet in their ONE move a day (one transfer, WAWU pays the charge once, not once per order). Held money sits in WAWU's account until released (R-19) and the earning is owed there until the move lands. A host with no wallet keeps the earning owed (`waiting: payee_wallet`) and it lands once when they open one (R-11). Migration `20261025170000_hold_release_earnings` lets the database accept an earning for a payment whose hold was released that way, and still refuses it for a held, refunded or transfer-released hold.
- **Round 3 (verifier F2, 17 Oct 2026):** account deletion's `waiting_earnings` (`AccountDeletionMoneyService.check()`) also counts the person's owed community host shares (`EarningSettlement` owed with a `creditSpendEarningId`), so a creator owed such a share, with no sale and no wallet, gets `409 account_deletion_blocked` instead of a deletion date; a sale's earning is still counted once, through its payment. New spec `account-deletion-host-share.contract.spec.ts` (4 tests, 2 fail on `242ce9d`; no wallet, no provider call). `docs/contract/CONVENTIONS.md` says it.
- **Attacks (Nuvion stand-in, ledger equals stand-in after each, WAWU operational account included):** 10 tests, the 5 event ones updated: two orders, one move of the sum, one charge, with the job run again and twice at once; no wallet then a wallet (lands once); called off, refunded and not-over pay nobody; a refund racing the payout goes one way; the delay setting. The credit tests are unchanged.
- **Fences touched:** SHARED-CHANGES WALLET-17 #1 to #4.
- **NOT RUN:** any call to Fintava (never used); the app; the earnings sweep against old rows in a populated database.
- **Open for the lead:** (b) `community_credits` is a stream kind the contract's `PaymentKind` enum does not list; the earnings read keeps unknown kinds. (c) Credits bought at Flutterwave pay no host here. Low, for the sweep: G-WALLET-17-1 (`wallet-funding.service.ts:114`, the legacy funding sweep would double-credit what the sweeps now pay if `WALLET_FUNDING=on`).
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-MONEY (B3a L2, L3).
- **Records:** tasks/history/WALLET-17.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend e3d2a468, verifier PASS in this file (verdict merge after rounds 2 and 3).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Community hosts' share of credits spent in their room, and event hosts' 85% of ticket sales, are computed today
but never paid. This is the one task that pays both (Lead, 2 Oct 2026); EVENTS-10 keeps the refunds.

## Scope

Fund CreditSpendEarning.hostShareKobo into the community host's wallet as credits are spent, and pay each event
host 85% of the ticket price for the tickets sold, from WAWU's merchant wallet once the event has taken place
(EVENTS-07 holds the ticket money there, R-19). A host without a wallet keeps the share, which lands when they
open one (R-11, WALLET-16). Fintava's charge on each payout is WAWU's (R-31).

## Capability checks

- [ ] After members spend credits in a community, the host's wallet grows by their share.
- [ ] After an event, the host's wallet receives 85% of ticket sales once, even if the payout job runs twice.
- [ ] A host without a wallet keeps the share, and it lands once when they open one.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-17.md](history/WALLET-17.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
