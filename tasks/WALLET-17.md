---
id: WALLET-17
title: Hosts receive their share: community credits and event tickets
owner: YOU
area: WALLET
order: 159
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-18, WALLET-16, EVENTS-07, INBOX-16]
decisions: [R-5, R-11, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-17 · Hosts receive their share: community credits and event tickets

## Current state

As of 17 Oct 2026, built (bundle B3a, Sonnet builder), waiting for a verifier.
- **Status:** verifying.
- **Branches:** backend `wmt/B3a` `ed45009` (on `origin/wmt/WALLET-16-R55` `9580bb0`), mobile `wmt/B3a` (records and the contract copy; docs only). Migration `20261025160000_host_share_earnings`.
- **Merged and live:** nothing of this task.
- **What is built:** (1) Community credits: a host's share of spent credits (`CreditSpendEarning.hostShareKobo`, 85%) becomes an `EarningSettlement` of kind `community_credits` (`paymentId` is now nullable and `creditSpendEarningId` unique; exactly one is set; the DB guards check the host and the share) and travels in the host's ONE move a day with their sales (R-55; a day under N200 waits; WAWU pays the charge once). Only spends paid for entirely with wallet-bought packs are taken (that money is in WAWU's account here); Flutterwave packs and mixed spends wait for the web (not paid, listed in BACKEND_GAPS). (2) Event tickets: `EventHostPayoutService` releases each paid order's `event_ticket` hold to the host once `endsAt ?? startsAt` (plus `EVENT_PAYOUT_DELAY_HOURS`, default 0) has gone by; a called-off or removed event, an order not `paid` and an event not over pay nobody. A host with no wallet keeps the share and it lands when they open one (R-11).
- **Attacks (Nuvion stand-in, ledger equals stand-in after each, WAWU operational account included):** 10 tests. Credits: three spends, one move and one transfer even with the sweep run again and twice at once; a later spend waits for the next day's move (two moves in two days); no wallet, then a wallet (lands once); Flutterwave packs and a mixed spend are not paid; the database refuses a share that is not the host's, a second row for one spent credit, or a row with no source. Events: 85% once with the job run twice and twice at once; no wallet then a wallet; called off, refunded and not-over pay nobody; a refund racing the payout goes one way; the delay setting.
- **Fences touched:** SHARED-CHANGES WALLET-17 #1 to #3 (schema and migration on `EarningSettlement`, contract, the harness cleanup).
- **NOT RUN:** any call to Fintava (never used); the app; the earnings sweep against old rows in a populated database.
- **Open for the lead:** (a) an event host is paid one transfer per paid order, as the hold's release is built (MONEY-18), not folded into the daily move of R-55; folding holds into the move is a larger change to MONEY-18. (b) `community_credits` is a stream kind the contract's `PaymentKind` enum does not list; the earnings read keeps unknown kinds. (c) Credits bought at Flutterwave pay no host here.
- **Next:** a verifier; passes V1, V2, V3, V4, V6, V7, V8, V9.
- **Records:** tasks/history/WALLET-17.md.

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
