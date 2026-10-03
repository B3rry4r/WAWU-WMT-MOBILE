# The wallet history against sandbox rows (MONEY-15)

Task MONEY-15, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
one run starting 10:53:57 UTC and lasting a few seconds. No other Fintava
host was called. The history routes themselves never call Fintava; the
sandbox was used only to put real movements in the ledger, which the served
routes then read.

Run by wawu-backend `scripts/fintava/history-sandbox-check.ts` (branch
`wmt/MONEY-15`; its header says how), against a fresh local database
(`m15_live_test`, dropped afterwards), the app on :4931 and the stand-in
WAWU ID on :4932. A fetch guard in the script refused every request except
the sandbox host and those two local ports, any POST to Fintava other than
`/transaction/wallet-to-wallet`, and a third send. The key was read from a
file with `sed` into the command's environment, never printed; the output
was checked for every 8 characters of it in a row (58 windows, none found).

Limits kept: OPS-02's customers A (`1154079370`, "Ada Sandbox") and B
(`1151496137`, "Bayo Sandbox") only, no customer created, no charged call,
money moved only as one ₦10 round trip (A to B, B to A). Balances before
and after: A 25,000 kobo (₦250), B 4,000 kobo (₦40), unchanged.

## What was done

1. Two people signed up at the stand-in WAWU ID (`POST /auth/register`);
   their tokens are what the history was read with. Their wallets were
   stored as MONEY-12 stores them, with each wallet's `accountName` from
   Fintava's free wallet name enquiry.
2. Send 1, A to B, ₦10, our reference `MONEY15-SBX-20261003105357-1`:
   amount 1000 kobo, fee 0, total 1000 (the sandbox still charges nothing
   for wallet to wallet). A's `out` row was recorded from the receipt as the
   sending feature will (WALLET-07): B named "Bayo Sandbox" from the name
   enquiry, note "History check there". Fintava's documented
   `wallet_to_wallet_transfer_v2` delivery, built from the real answer and
   signed locally (no tunnel, R-25), was posted to MONEY-07's route
   (`200 recorded`) and swept by MONEY-10's consumer (`processed: 1`),
   which wrote B's `in` row.
3. Send 2, B to A, ₦10, `-2`: the same, the other way.
4. The served routes, over HTTP with the tokens:

| Request | Answer |
|---|---|
| A: `GET /money/transactions?q=Bayo` | 200, 2 rows: the `in` from B and the `out` to B, both `completed`, 1000 kobo, "Transfer", counterparty "Bayo Sandbox" |
| A: `GET /money/transactions?q=nobody-at-all` | 200, no rows |
| A: `GET /money/transactions/summary?month=2026-10` | 200, `inKobo` 1000, `outKobo` 1000; the month's list has 2 rows, both completed, summing to the same |
| A: `GET /money/transactions/<send 1's row>` | 200, `reference` `MONEY15-SBX-20261003105357-1`, fee 0/0/0, note "History check there", counterparty `wawu_user` "Bayo Sandbox" |
| B: `GET /money/transactions/<A's row>` | 404 |
| B: `GET /money/transactions?q=Ada` | 200, B's 2 movements with A |

## What it showed

- **Searching a recipient's name finds their transfers**, including the
  row a delivery wrote: Fintava's delivery names nobody, so B's `in` row
  carries only A's id, and the history names A by A's wallet's account name
  (`FintavaWallet.accountName`). Without that fallback the row would read
  "Someone on Who Made This" and a name search would miss it (the contract
  spec holds both cases).
- **The month's figures equal the month's completed rows.**
- **Finding (BACKEND_GAPS G-44):** the two sides of one movement show
  different references. The sender's row holds our reference in
  `customerReference`; the receiver's row, written from the delivery, holds
  it only as a `delivery` key, so the receiver's receipt shows Fintava's
  reference (`da6c366e-...` for send 2) instead. Both are findable at
  Fintava, so support can trace either, but W27 shows two different
  references for one transfer.

## Every call made

8 calls, all answered 200:

- `GET /loma-name/enquiry` 2 (A's and B's names; free)
- `GET /customer/wallet/balance/{walletId}` 4 (A and B, before and after)
- `POST /transaction/wallet-to-wallet` 2 (the round trip)

The two deliveries were identified by the side already held (the sender's
record), so the consumer asked Fintava nothing more.

## Not run

- Bank sends, bills and their reversals: the sandbox refuses every payout
  (question 17 in `../naira-api.md`), so no bank or bill row from the
  sandbox reached the history. Their rows are read in the contract spec
  from the ledger's own writer.
- A real (not locally signed) delivery: OPS-10.
