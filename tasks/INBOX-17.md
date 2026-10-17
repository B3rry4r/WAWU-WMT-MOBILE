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

As of 17 Oct 2026, built (bundle B3a, Sonnet builder), waiting for a verifier.
- **Status:** verifying.
- **Branches:** backend `wmt/B3a` `ed45009` (on `origin/wmt/WALLET-16-R55` `9580bb0`, batch 7 with B1 and R-55), mobile `wmt/B3a` (records and the contract copy; docs only). Migration `20261025150000_paid_dm_drafts` (one new table).
- **Merged and live:** nothing of this task.
- **What is built:** `src/direct-message/wallet/`: the kind `paid_dm` registered with MONEY-17 and four routes: `POST /dm/{creatorWawuId}/send/wallet` (drafts the question, answers I3: price, window, the wallet quote), `GET /dm/send/wallet/{id}/quote`, `POST /dm/send/wallet/pay` (PIN, `Idempotency-Key`) and `GET /dm/send/wallet/{id}` (I4, I5). The words wait in `PaidDmDraft`, so the creator's inbox never shows an unpaid question; paying holds the price in WAWU's account (R-19) and sends the question once. The creator's answer (either reply route) flips it `responded` and releases the hold: 85% to their wallet or waiting for one (R-5, R-11). The window passing flips it `refunded` and refunds the price, not the provider's charge (R-10), and `dm_refunded` goes once when the provider confirms. A creator who is off, paused (INBOX-09), blocked or yourself is `target_not_payable`; a second question to one creator while one waits is the new `409 question_already_waiting` (G-75), refused at the draft and again in the payment's claim under a lock. A question that cannot be sent after the debit is paid back whole.
- **Attacks (Nuvion stand-in, ledger equals stand-in after each, WAWU operational account included):** 11 tests: happy path with exact figures and one release; no reply, one refund of the price only, the fan told once; the same request twice and twice in parallel (one key, two keys); two drafts paid at once (one hold); a lost provider answer then a retry; reply racing the expiry sweep (4 rounds) and a release racing a refund at the hold (one way only); off, paused, blocked, self; the creator switching off before the debit confirms; a creator with no wallet; wrong PIN, short balance, someone else's question, a changed price.
- **Fences touched:** SHARED-CHANGES INBOX-17 #1 to #4 (app.module, schema and migration, contract, route inventories, the error code).
- **NOT RUN:** any call to Fintava or its sandbox (never used); the app screens (INBOX-10, INBOX-18); a load measurement.
- **Open for the lead:** the web's `/dm/*` routes are untouched; the legacy refund sweeps now skip `wallet:` questions. A release is one transfer per answered question, as MONEY-18 builds it.
- **Next:** a verifier; passes V1, V2, V3, V4, V6, V7, V8, V9.
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
- [ ] The creator replies and 85% of the price lands in the creator's wallet, or waits until they open one (R-11).
- [ ] No reply by the deadline and the fan gets the price back, not Fintava's charge (R-10).
- [ ] A creator switched off by INBOX-09 cannot receive a new paid question.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-17.md](history/INBOX-17.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
