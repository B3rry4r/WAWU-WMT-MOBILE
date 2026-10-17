---
id: INBOX-17
title: Paid questions: pay, hold, pay out and refund through the wallet (backend)
owner: YOU
area: INBOX
order: 111
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-18, MONEY-13, MONEY-16, WALLET-15, WALLET-16, INBOX-08, INBOX-09]
decisions: [R-10, R-11, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-17 · Paid questions: pay, hold, pay out and refund through the wallet (backend)

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge after rounds 2 and 3 (the data-export medium and the charge refunds closed in round 2; round 3 on the lead's diff read) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/B3a.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main.
- **Branches:** backend `wmt/B3a` `242ce9d` (round 1 `ed45009`, on `origin/wmt/WALLET-16-R55` `9580bb0`, batch 7 with B1 and R-55), mobile `wmt/B3a` (records and the contract copy; docs only). Migrations `20261025150000_paid_dm_drafts` (one new table) and `20261025170000_hold_release_earnings` (a trigger function only).
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-12`, not on main).
- **What is built:** `src/direct-message/wallet/`: the kind `paid_dm` registered with MONEY-17 and four routes: `POST /dm/{creatorWawuId}/send/wallet` (drafts the question, answers I3: price, window, the wallet quote), `GET /dm/send/wallet/{id}/quote`, `POST /dm/send/wallet/pay` (PIN, `Idempotency-Key`) and `GET /dm/send/wallet/{id}` (I4, I5). The words wait in `PaidDmDraft`, so the creator's inbox never shows an unpaid question; paying holds the price in WAWU's account (R-19) and sends the question once. A creator who is off, paused (INBOX-09), blocked or yourself is `target_not_payable`; a second question to one creator while one waits is `409 question_already_waiting` (G-75). A question that cannot be sent after the debit is paid back whole.
- **Round 2, the lead's rulings of 17 Oct (verifier findings 1 to 3 closed):**
  1. The creator's answer releases the hold AS AN EARNING (R-55): one short database write makes the hold `released` and makes the creator's `EarningSettlement` (kind `paid_dm`, the 85%); it goes to their wallet in their ONE move a day with their other earnings (a day under N200 waits; WAWU pays the charge once). No provider call in the reply request any more (also closes finding 4). Held money still sits in WAWU's account until the move lands (R-19). The earnings read counts it once; a creator with such an earning still owed cannot delete the account.
  2. A question that lapses returns EVERY naira: the price and the charge the payment took (the fan did not cause it); WAWU bears the refund transfer's own charge. `dm_refunded` is still sent once.
  3. `PaidDmDraft` is in the data export (section `paidQuestionDrafts`; the idempotency key is not selected); `data-export-map.spec` is green.
- **Attacks (Nuvion stand-in, ledger equals stand-in after each, WAWU operational account included):** 12 tests: round 1's 11 (the release and refund assertions updated to the rulings) plus two answers in a day landing in ONE move of the sum, a third answer waiting for the next day's move, the earnings read once, the lapsed question returning price plus charge (fan back to the opening balance), and a creator with no wallet (earning owed, `waiting_earnings` blocks deletion, lands once when a wallet opens).
- **Fences touched:** SHARED-CHANGES INBOX-17 #1 to #4 and WALLET-17 #4 (the migration).
- **NOT RUN:** any call to Fintava or its sandbox (never used; the Fintava hold and earning specs were not run, CI runs them); the app screens (INBOX-10, INBOX-18); a load measurement.
- **Open for the lead:** the plain `holds.release` without `asEarning` stays for the hold service's own callers and the Fintava hold specs; nothing in production asks it for a payee any more. Low: G-WALLET-17-1.
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-MONEY (B3a L1).
- **Records:** tasks/history/INBOX-17.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A fan pays for a paid question from their wallet; the money waits in WAWU's merchant wallet (R-19) until the creator answers (85% to the creator, R-11) or the window passes (the price back to the fan, R-10). The web keeps Flutterwave until after launch.

## Scope

Sending a paid DM holds the money; a reply releases it to the creator; expiry refunds it to the sender's wallet (I3-I11). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A fan pays a paid question and the money sits in WAWU's merchant wallet, not the creator's (R-19).
- [ ] The creator replies and 85% of the price lands in the creator's wallet in their one move of the day, or waits until they open one (R-11, R-55).
- [ ] No reply by the deadline and the fan gets every naira back, the charge included (lead ruling 17 Oct 2026).
- [ ] A creator switched off by INBOX-09 cannot receive a new paid question.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-17.md](history/INBOX-17.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
