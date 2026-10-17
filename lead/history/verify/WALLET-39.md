# WALLET-39 verifier report (backend wmt/WALLET-39 2194ffb on main a5e48fc)

Verdict: merge (nothing medium or worse). Four low findings go to the money-in sweep list.

## Checks (all run against a stack named wallet_39, ports 7440-7447, real Postgres, real ledger, real NotificationService, real push sender and Expo stand-in; no provider called)

| Check | Result |
|---|---|
| Migration 20261024070000 on 768 live-shaped ledger rows (8 categories x in/out x 4 statuses x user/merchant x 3 ages x 2 providers) plus old top_up marks (sent, muted, before; completed and reversed) | applied in 0.05 s. Marks written: 'before' for every non-pending user credit of transfer, earning, refund; none for pending, out, merchant, purchase, bill, hold, reversal. The 2 old sent+reversed top_up marks got correctedAt, no notification. muted/before reversed left null. |
| Backfills re-run twice | mark table md5 identical (no row added, correctedAt not moved) |
| rollback.sql | drops the two columns only; 66 marks stay; WALLET-10 columns intact; migration then re-applied clean |
| `prisma migrate deploy` on the stack DB | migration finished; `migrate diff` shows nothing on MoneyInNotice (one unrelated ContentPiece index difference, not this task) |
| Parallel: 16 credits (4 people x 4 categories), 6 service instances x (sweep + noticeEntry per row), 16 replayed ledger records, plus the stack Hub's own sweeper on the same DB | exactly 16 money_in, 16 marks, all sent |
| Pending then completed, 5 instances x 2 sweeps | none while pending, one after |
| Reversed before told | no notice, no correction |
| Told then reversed (4 categories), 6 instances x (sweepCorrections + correctEntry per row + sweep) | exactly 4 money_in_reversed; the ledger does not move a reversed row back on a replay of the original delivery; after replay and a second reversal still 4 and 4 |
| Tell racing a reversal (40 rows x 3 instances, run 3 times) | told 40/corrected 40, 39/39, 40/40; zero received-without-correction, zero correction-without-received |
| Real Hub: 40 credits for 20 people inserted while GET /users/me for another person ran every 150 ms for 28 s | 40 notices (one per row, 40 sent marks), 179 probes, all 200, max 77 ms, median 5 ms |
| 20 credits, push provider answering after 3 s, 6 parallel sweeps, push sender running | sweeps 230 ms; whole push run 3.3 s; probes by another person during the 3 s: 2 to 6 ms; zero sessions 'idle in transaction' older than 1 s. The push send is outside any transaction (src/push/push-sender.service.ts:321). |
| GET /me/notifications over HTTP | target {kind: transaction, id}; the id is the ledger uuid GET /money/transactions/{id} reads (transaction-history.service.ts detail). A transaction target resolves only for the ledger row's owner (me-notifications.service.ts). |
| Existing specs the builder changed | money-in-notice.contract.spec.ts: push data gains target; the two 'does not tell a transfer / an earning' rows removed (owner answer 12); beforeAll runs the new backfill. push-policy.spec.ts: new kind and its push-only gate. Nothing weakened; the other 'does not tell' rows (pending, failed, reversed, money out) stay. |
| Suites run | money-in-notice (4 suites) + push-policy: 6 suites, 169 tests (incl. my 6 attack tests), EXIT 0. tsc --noEmit 0. eslint --no-fix on the changed source files EXIT 0. |
| CI on 2194ffb | suite shards 1-3, contract, protected routes, baseline, netns, deploy-test: success. Executable gates: failure, the same five findings as main a5e48fc (admin-notifications.controller.ts:40, compose-campaign.dto.ts:44, notification-event.ts:496, flutterwave-wallet.gateway.ts:72, content-piece.service.ts:62); the two job logs differ only in timestamps. Pre-existing. |

My attack spec: scratchpad/wallet-39-v/v39-attack.contract.spec.ts (not committed; removed from the worktree).

## Findings

1. low. A digit run in a sender name or bank label is printed in full. `moneyInSenderName` / `moneyInShortName` / `moneyInWords` in src/notification/notification-event.ts (about lines 690 to 800). `composeNotification({kind:'money_in', source:'transfer', senderName:'0801xxxxxxx'})` gives "You received ₦1,500 from 0801xxxxxxx."; a first word of digits ("0123xxxxxx Bakare") also survives; `source:'bank', senderName:'0123xxxxxx'` gives "from 0123xxxxxx (****1291)." (this half is WALLET-10 behaviour, now also on the new sources); `senderBankName:'GTBank 0123xxxxxx'` gives "from GTBank 0123xxxxxx ****xxxx". Only the account-number field is masked. Needs a provider or a display name that holds digits; none is known today (no provider gives a bank name). Fix later: mask any run of six or more digits in a name or bank label.
2. low. The dm_refunded plus money_in double push is not live. dm_refunded has one emitter (src/direct-message/dm-refund.service.ts:247, markSettled, the Flutterwave card refund, which writes no ledger credit). A wallet refund (a hold's refund) writes only the ledger `refund` row, so the payer gets one push (money_in). No `paid_dm` payable is registered in the registry yet, so a wallet refund of a paid message does not exist. It becomes two pushes for one event on the day a wallet paid-DM refund emits dm_refunded as well: that task must emit one of the two. Same for `sale` (content-piece.service.ts:1235) and `tip_received` (purchase.service.ts:175) when WALLET-16 lands earnings. The builder's note ("still fires beside") is not true of today's code.
3. low. Rollback then re-apply: backfill 2 stamps correctedAt on any credit told and reversed while the columns were gone, so that reversal is never announced. Also the 'before' backfill covers failed rows, so a pre-migration failed credit of the three new categories that is later revived to completed is never told (same rule as WALLET-10's top_up backfill). Edge cases, no action needed unless a rollback is expected.
4. low (cosmetic, by reading the code, not run). `moneyInShortName` takes the first character of the last word: "Adaeze (CEO)" becomes "Adaeze (." and "Ada Obi Jr." becomes "Ada J.".

## Judged with a concrete path (lead's question)
A wallet refund of a paid message: today it sends money_in only (finding 2), so no double push; graded low, as a note for the paid-DM-by-wallet task.

## Not run
Real phone and Expo (V10); a real Fintava or Nuvion credit; the full backend suite (GitHub's job, green on the shards).
Cleanup: stack wallet_39 down (hub pid 25389 and mock-id pid 25376 stopped, ports 7440 and 7447 closed), databases wallet_39_wawu_hub_test and wallet_39_mig_test dropped, worktree /home/user/wt/v-wallet-39-be removed. Nothing pushed.
