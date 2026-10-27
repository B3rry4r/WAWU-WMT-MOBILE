---
id: STORE-QUESTION
title: A paid question bought in the store, earned when answered, a question credit when not (Hub)
owner: YOU
area: IAP
order: -1263
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [STORE-BUY-HUB]
decisions: [R-86, R-5, R-11, R-19, R-55, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# STORE-QUESTION · A paid question bought in the store (Hub)

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T2): backend `wmt/STORE-QUESTION` `1ea3574` on `origin/main` `9f393b2` (STORE-BUY-HUB merged), mobile records `wmt/STORE-QUESTION` on `origin/wmt/STORE-BUY-HUB` `bc525c61` (files: `tasks/`, `SHARED-CHANGES.md`). Status verifying. R-101 point 6 and the owner's ruling 1A (27 Oct 2026): a paid question bought in the store that is not answered in time gives the asker a question credit worth the list price, usable to ask any creator a question at that price or less; never cash. Not run against Google or Apple (no credentials): the specs use the stores' stand-ins. The app side (the question sheet using the store) is STORE-BUY-APP's.

| # | Before | After |
|---|---|---|
| 1 | a paid question could only be paid from the wallet (INBOX-17) or by the web's card | `POST /store/intents` takes `kind: question` with `creatorWawuId`, `text` (1 to 2,000) and `listPriceNaira` (the creator's price, on the list). Checked as the wallet path checks (`askable`): the creator takes questions, is not the person, not blocked, not paused (INBOX-09), none already waiting; the words and the creator's reply window ride on the intent until the sale |
| 2 | a store sale could not carry a question | a verified `wawu.buy.<naira>` sale writes the wallet path's own `DirectMessage` (`awaiting_response`, `deadlineAt` = send time + the creator's reply window, `amount` the list price), reference `store:<StorePurchase id>`; no wallet payment, no hold; the creator gets `dm_received`. The web's Flutterwave sweeps skip `store:` rows as they skip `wallet:` |
| 3 | no earning for a question outside the wallet | answered in time: the creator's 85% of the LIST price is a `StoreEarning` (`kind paid_dm`), `availableAt` = 3 working days from the ANSWER (`earnedAt` = the answer); told once (STORE-SALE-NOTICE). Hook after the reply, and the minute sweep `store-questions` records any the hook missed |
| 4 | an unanswered question was refunded through its hold | not answered by `deadlineAt` (the wallet path's own window): no earning; one conditional write flips the question to `refunded` and the asker gets a `StoreCredit` `scope: question` worth the list price (source and origin the purchase), told once (`question_credit`). The reply's write is the other half, so they cannot both win |
| 5 | a credit paid for a piece, a tip or a pass | `StoreCredit.scope` (null = piece, tip, pass; every existing credit; `question` = question). A question credit pays for a question to any creator at that price or less (`payWith: credit`, whole, the rest stays a question credit) and never for a piece, tip or pass; an unscoped credit never pays for a question. A question that cannot be sent after the sale (creator switched off, one already waiting) also becomes a question credit |
| 6 | REFUND took back an unlock, a tip or a pass | a refund before the answer withdraws the question (`refunded`, `refundReference store_refund`, not a miss in the creator's standing); after the answer the answer stays and the earning is cancelled, or a deduction once paid; a credit the question made is voided (a spent one: what it paid for is taken back); REFUND_REVERSED reopens the question (or credits the asker if its deadline passed) and restores the rest |

Routes and codes: `POST /store/intents` (`kind: question`, `text`; `payWith: credit`), `GET /store/credits` (each credit has `scope`), `POST /store/purchases` (`grant.questionId`, the direct message's id, which is the intent's id). Codes (`reason.code`) are the ladder's: `price_not_on_list` 400, `store_intent_target_not_found` 404, `store_intent_not_payable` 409 (not taking questions, their own, blocked, paused, one already waiting), `store_intent_price_changed` 409, `store_credit_insufficient` 409, `store_credit_unavailable` 409. No new code.

Deadline used: `DirectMessage.deadlineAt` = the send time plus `responseWindowHours`, the creator's `dmResponseHours` (24 by default) as the asker was shown it, exactly `deadlineOf` of the wallet path. Migration `20261218090000_store_question` (after `20261216090000`): `StoreIntentKind` gains `question`; `StorePurchaseIntent` gains nullable `questionText`, `questionWindowHours`; `StoreCredit` gains nullable `scope` (check: null or `question`). Rollback refuses while a question intent, a question purchase or a scoped credit exists.

Decisions (Default (lead), owner may override): (a) a question credit made because a question could not be sent after the sale is also a question credit; a sale with no usable intent (late sale) stays an unscoped credit as STORE-BUY-HUB made it. (b) The words are cleared from the intent once the question is sent; they live on the message. (c) A question withdrawn by a refund is `refunded` with `refundStatus settled` and is left out of the creator's standing; one that expired counts as a miss like any. (d) The earning's title is "Paid question". (e) The asker is told of the credit with one new notice kind `question_credit`, pushed, muted by the Refunds switch.

Proof: `src/store/question/tests/store-question.contract.spec.ts` (30, real HTTP and database, stand-in stores): intent and each refusal; the sale sends the question; answered earns the 85% from the answer; the deadline gives a question credit once; a credit spent on a cheaper question leaves the rest; refused for a piece, tip, pass and by an unscoped credit; refunds before and after the answer, after payment and after the deadline; replays. Older store specs (168 in 8 files), the dm specs outside the wallet path, `push-policy`, both account maps and `publishing-gate-coverage`, `hub-rate-limits`, protected routes (253, seeded database), `tsc`, `eslint`, `contract:build` (additions only), gates and `check_baseline` EXIT 0; migration rollback run in a transaction (clean; refused with a scoped credit and with a question intent); `prisma migrate diff` empty. Not run here (GitHub does): the Fintava-double specs, `paid-dm-wallet.contract.spec.ts` among them.

Not done: the app's question sheet on the store (STORE-BUY-APP); a read route for one store question (the app reads it as a direct message); the payout (STORE-PAYOUT).

## Read first

`DECISIONS.md` R-86, R-5, R-11, R-19; R-101 (the lead's record, points 2, 4, 5, 6); STORE-BUY-HUB; backend `src/store/`, `src/direct-message/wallet/paid-dm-wallet.service.ts`, `src/direct-message/dm-reply-writer.ts`.

## Goal

A person in the app can buy a paid question in the store at the creator's list price. The creator is paid exactly 85% of that price, three working days after they answer. If they do not answer in time the asker has a question credit for the same price, never cash.

## Scope

`wawu-backend`: `src/store/question/` (new), `src/store/notice/` (new, STORE-SALE-NOTICE), the store files that name a kind (`store-grant`, `store-intent`, `store-buy-target`, `store-credit`, `store-earning`, `store-purchase`, `store.dto`, `store.module`), `src/direct-message/` (the three `store:` skips and the standing filter), `src/notification/` and `src/push/` (three kinds), `prisma/` (one migration with rollback), `README.md`, `contract/openapi.json`, the two data maps.

## Capability checks

- [x] An intent for a question and each refusal (words missing, too long, on another kind; off the list; not the creator's price; own; nobody; not taking questions; blocked; paused; one already waiting).
- [x] The sale sends one question once; a replay sends nothing more; the creator is told once.
- [x] Answered: 85% of the list price, three working days from the answer, once, with a hook replay and the sweep.
- [x] The deadline: a question credit worth the list price, once, no earning; a late answer is refused.
- [x] A credit: cheaper question leaves the rest; refused for a piece, a tip and a pass; an unscoped credit refused for a question.
- [x] Refunds before and after the answer, after payment, after the deadline, and their reversals.
- [ ] Against the real Google Play and App Store: NOT RUN (no credentials).
