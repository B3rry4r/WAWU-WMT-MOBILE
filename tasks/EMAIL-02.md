---
id: EMAIL-02
title: The Hub asks WAWU ID to email each money and account notice, once, at its real event (POST /internal/mail/notice)
owner: YOU
area: MONEY
order: -2700
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-5, R-10, R-11, R-17, R-53, R-54, R-69, R-72, R-76, R-101]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# EMAIL-02 · The Hub's side of the money and account emails

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T2) after EMAIL-01 (its task file is on mobile `wmt/EMAIL-01`, so `depends_on` is empty until that merges), backend `wmt/EMAIL-02` `04924a5` (round 0 `78b44dc`) on `origin/main` `3650c24`. Built to the lead's EMAIL contract (the route is EMAIL-01's, wawu-id `wmt/EMAIL-01`, not landed when this was built). Round 1 (verifier FIX, lead rulings): `pass_sold` and `question_earned` added, backend head below. Status verifying. No route, table, column, migration or contract change; `contract:build` writes nothing new.

| # | Before | After |
|---|---|---|
| 1 | no email for any money or account event | one `NoticeMailer` (`src/notice-mail/notice-mailer.ts`) calls `POST /internal/mail/notice` with `{ wawuId, kind, data, idempotencyKey }` and the service key; never an address, never HTML. Facts are checked against the kind's exact fields first (`notice-kinds.ts`): extra or missing field, a non-integer amount, a non-ISO time or an email-shaped text is refused and not sent; `<` and `>` and control characters are removed from text |
| 2 | a failed mail could not matter | sent after the commit: `notify()` returns at once (nothing waits for the relay); inside a transaction the owner wraps it in `within()` and the notice goes only when it commits (a throw drops it). A network error, a timeout or any 5xx is asked again (3 tries, 0.5 s doubling); a 400, 401, 429 is not. After the last try: one log line with the kind and the key only |
| 3 | no switch | plan setting `notifications.money_emails_on` (default 1, registry + seed); 0 sends none; an unreadable setting leaves them on |
| 4 | once | the key is `<kind>-<the event's own id>`; the call that moved the row asks (a conditional write's count, or the lock/mark), so a replay, a sweep and a webhook, or two racing callers, ask once; WAWU ID folds a repeat by key |

### Each kind at its event (file:line on `78b44dc`)

| Kind | Event | Where | Facts |
|---|---|---|---|
| pin_changed | PIN changed; PIN reset confirmed | `money/pin/transaction-pin.service.ts:231`, `pin-reset.service.ts:350` | `at` = the time it was set; key by change time / reset id |
| account_deletion_started | deletion scheduled (the request that moved `freezing` to `scheduled`) | `account/account.service.ts:322` | `deleteOn` = the purge date |
| account_deleted | Hub data purged, asked and WAITED for before WAWU ID anonymises (it finds the address from the account) | `account/account-deletion-sweep.service.ts:710` | none |
| money_in | credit told (notice mark written) from a bank or another person | `money/money-in-notice/money-in-notice.service.ts:277` | amount, NGN, sender name |
| bank_send_completed / _failed | bank send leaves `pending` (the conditional write's count) | `money/transfers/wallet-transfer.service.ts:2549`, `:2566` | completed: amount, fee = provider + WAWU fee on the row, name, bank, last 4, reference; failed: amount, `returnedMinor` = amount + fees, reference. A refusal answered in the same request is not emailed |
| sale_made | wallet piece sale; store piece sale | `content-piece/wallet/unlock-wallet.service.ts:337`, `store/notice/store-sale-notice.service.ts:66` | creator's share from the payment row (store: 85% of list), `paidWhen`: wallet `now`, store `in_3_working_days`, no wallet `when_wallet_opens` |
| tip_received | wallet tip; store tip | `purchase/wallet/tip-wallet.service.ts:291`, `store-sale-notice.service.ts:79` | as above |
| paid_message_received | question sent (wallet; store) | `direct-message/wallet/paid-dm-wallet.service.ts:429`, `store/question/store-question.service.ts:147` | name, creator's share, `replyBy` = the deadline |
| refund_processed | wallet question refund settled; Flutterwave question refund settled; called-off wallet order refunded; unanswered store question credit | `paid-dm-wallet.service.ts:693`, `direct-message/dm-refund.service.ts:260`, `event-ticketing/wallet/event-call-off-refund.service.ts:274`, `store-question.service.ts:379` | what, amount (everything the payment took), `returnedTo` wallet / source_account / wallet / question_credit |
| purchase_receipt | wallet piece bought | `unlock-wallet.service.ts:349` | title, paid, payment reference |
| ticket_confirmed | wallet ticket order issued | `event-ticketing/wallet/event-wallet-order.service.ts:900` | title, start, venue or place, paid, payment reference |
| event_cancelled | host's cancel won | `event-ticketing/event-ticketing.service.ts:1024` | title; what is coming back (sum of paid orders) or none for a free ticket |
| pass_sold | wallet pass granted (the call that wrote the pass row); store pass sold | `community/pass/community-pass.service.ts:376`, `store/notice/store-sale-notice.service.ts` (kind `pass`) | room name, buyer, host's share (payment row; store 85% of list), `paidWhen` as for a sale |
| question_earned | wallet question's hold released as the creator's earning (the conditional write's winner); store question answered and its earning recorded | `money/holds/wallet-hold.service.ts` (`releaseAsEarning`, `emailQuestionEarned`), `store-sale-notice.service.ts` (kind `question`) | asker, creator's share, `paidWhen` |
| bill_paid | web bill moves to `delivered` | `bill-payment/bill-payment.service.ts:478` | biller, customer ref, amount, token and units when that answer had them |

### Defaults (lead), owner may override

(a) `money_in` is emailed for a bank transfer in and money from another person only; earnings, refunds, swaps and points have their own emails or are the person's own money. (b) `bank_send_failed.returnedMinor` is the whole quote (amount and fees); the Hub cannot know the moment the provider's reversal lands. (c) Names are "Ada O." (first name, last initial), null when WAWU ID does not answer. (d) A question is emailed twice, on purpose: `paid_message_received` when it arrives, `question_earned` when it is answered and the earning arises (lead, round 1). (e) `ticketRef` and `reference` are the payment's reference.

### Checks (EXIT lines in the hand-back)

New specs: `notice-mailer.spec.ts` (16) and `notice-events.spec.ts` (30): 46 of 46 pass; round 1 mutants (the winner guards of the hold release and the pass grant) each fail a test, as do the three of round 0 (the winner guard of a bank send, of a called-off refund, of a delivered bill) each fail a test. Existing affected set 719 tests, 113 fail, the same 11 suites and 113 on `origin/main` (needs a running WAWU ID); `test:protected` 5 failed of 253 on both. No Fintava double was run.

### Open (all low, for `tasks/SWEEP-MONEY.md`)

- Dollar money-in: the Hub has no dollar credit notice (the money-in notice reads the naira ledger), so none is emailed.
- Flutterwave event refunds (the web's cancel loop) and the web's bill delivered by the manual reconcile route send bill_paid only through `settleFromProviderStatus`; the web event refund is not emailed.
- The tip, wallet paid-message and Flutterwave question-refund hooks are tested through the shared mailer and facts only, not by a spec of their own.
- `bank_send_*` covers Nigerian bank sends; abroad sends have no kind.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`; the EMAIL contract (lead, 29 Oct 2026); backend `CLAUDE.md`
- Backend `src/notice-mail/`, `test/money/wawu-id-notice-double.ts`

## Goal

Every money and account email in the contract is asked of WAWU ID once, at its real event, with facts from the Hub's rows, and a failed email never touches the money.

## Scope

`wawu-backend` only: `src/notice-mail/**`, one-line hooks at the events above, the setting in `src/plan-settings/`, the stand-in `test/money/wawu-id-notice-double.ts`.

## Capability checks

- [x] A person's PIN change, deletion, bank send, sale, tip, paid message, refund, receipt, ticket, called-off event and delivered bill each ask for one email.
- [x] A rolled-back move, a relay that is down, a switch set to 0 and a replay send no wrong or extra email.
- [ ] A real email arrives (needs EMAIL-01 live on WAWU ID; not run here).

## Builder report

See the Current state. Branch `wmt/EMAIL-02` `78b44dc`.

## Verifier report

None yet.

## Owner sign-off

None yet.
