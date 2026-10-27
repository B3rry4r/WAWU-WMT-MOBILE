---
id: STORE-SALE-NOTICE
title: The creator is told of each store sale, with their 85% in naira (Hub)
owner: YOU
area: IAP
order: -1262
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [STORE-QUESTION]
decisions: [R-86, R-5, R-11, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# STORE-SALE-NOTICE · The creator is told of each store sale (Hub)

## Current state

As of 27 Oct 2026, built by the STORE-QUESTION Sonnet builder (T2) in the same backend branch: backend `wmt/STORE-QUESTION` `1ea3574` on `origin/main` `9f393b2`, mobile records `wmt/STORE-QUESTION` on `origin/wmt/STORE-BUY-HUB` `bc525c61`. Status verifying. STORE-BUY-HUB left this undone ("a sale notification to the creator"); R-101 point 4 pays the creator, and the creator is also told.

| # | Before | After |
|---|---|---|
| 1 | a store sale of a piece, a tip or a pass told the creator nothing | the creator gets one notice per sale, written in the transaction that records the sale's earning (`emitOrThrow`), so "told" and "the earning exists" are one fact: a replay, a restore, a webhook that races the app and a sale paid with a store credit tell once. It shows the creator's 85% of the LIST price in whole naira |
| 2 | no kind for a pass sale or an answered question | a piece uses `sale` (title and amount), a tip uses `tip_received`; new kinds `pass_sold` ("Pass sold", the room's name) and `question_answered` (told when the question is answered, not when it is asked) and `question_credit` (the asker's, STORE-QUESTION). All three are pushed (`PUSH_RULE send`), grouped under Money, and muted by a Z3 switch: Money in for the two sales, Refunds for the credit |
| 3 | a payment that became a store credit (the piece was gone) | nobody earns and nobody is told |

Copy: "Content sold" / "You received a tip" / "Pass sold" / "Question answered", each "You earned ₦850 after the platform fee." (a ₦1,000 sale), no wallet, balance, cash or em-dash. `amount` on the row is the 85% in naira. A piece's notice names the title; a pass names the room; a tip and a question name nobody (the actor is stored beside the notice, never in the words).

Decisions (Default (lead), owner may override): (a) a notice that cannot be written aborts the sale's grant and the store's next notice or the app's next ask tries again (the write is the database's own, so this means a fault, not a missing person). (b) The arrival of a new question still sends the wallet path's `dm_received` (the gross price); the 85% notice comes at the answer. (c) The app maps the new kinds to a screen (FIX-102's table gains `pass_sold`, `question_answered`, `question_credit`: Earnings, Earnings, the credit list); until then a kind the app does not know opens the screen of its category.

Proof: the same spec as STORE-QUESTION, "STORE-SALE-NOTICE" block (3): a piece, a tip and a pass told once at 850, 425 and 850, again on a replay; a sale paid with a store credit told, a credited payment not told; a question told on the answer only. `push-policy.spec` (63, with an example for each new pushed kind), `notification-emitter`, `push-sender` green.

Not done: the app's mapping of the three new kinds (a mobile task); a notice when WAWU pays the creator (STORE-PAYOUT).

## Read first

STORE-QUESTION; backend `src/notification/notification-event.ts`, `src/push/push-policy.ts`, `src/store/notice/store-sale-notice.service.ts`; mobile `src/features/push/routes.ts` (FIX-102).

## Goal

A creator who sells in the store hears of it the moment it happens, with the exact amount they will be paid.

## Scope

`wawu-backend`: `src/store/notice/` (new), `src/store/store-grant.service.ts` (one call), `src/notification/`, `src/push/`.

## Capability checks

- [x] A piece, a tip and a pass each tell the creator once, with their 85% in naira.
- [x] A question tells on the answer, once, however many times the hook or the sweep runs.
- [x] A credited payment tells no creator; a credit-paid sale tells.
- [x] Every new pushed kind has a push example and a switch.
- [ ] On a phone: NOT RUN.
