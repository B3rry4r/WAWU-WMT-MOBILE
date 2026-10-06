# Statements against sandbox rows (WALLET-27)

Task WALLET-27, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
one run from 20:32:11 to 20:32:15 UTC (21:32 in Lagos). No other Fintava
host was called. The statement route itself never calls Fintava; the
sandbox was used to put real movements in the ledger, which the served
route then read, and to read Fintava's own record of one of them.

Run by wawu-backend `scripts/fintava/statement-sandbox-check.ts` (branch
`wmt/WALLET-27`; its header says how), against a fresh local database
(`w27_live_test`, dropped afterwards), the app on :4991 and the stand-in
WAWU ID on :4992. A fetch guard in the script refused every request except
the sandbox host and those two local ports, any POST to Fintava other than
`/transaction/wallet-to-wallet`, and a third send. The key was read from a
file with `sed` into the command's environment, never printed; the output
was checked for every 8 characters of it in a row (58 windows, none found).

Limits kept: OPS-02's customers A (`1154079370`, "Ada Sandbox") and B
(`1151496137`, "Bayo Sandbox") only, no customer created, no charged call,
money moved only as one ₦10 round trip (A to B, B to A). Balances before
and after: A 25,000 kobo (₦250), B 4,000 kobo (₦40), unchanged.

## Is there a stamped statement at Fintava?

No. None of Fintava's published pages (`../reference/INDEX.txt`: customer,
accounts and wallets, virtual wallet, transfer, transactions, banks,
compliance, SMS, billing, cards, webhooks) describes a statement, a PDF or
an export, and no sandbox call was made to look for an undocumented one.
The only history Fintava serves is `GET /txn` (a customer's own debits,
`09-customer-history.md`) and `GET /txn/merchant`. So WALLET-27 serves CSV
only; the stamped PDF is NOT RUN (mobile `BACKEND_GAPS.md` G-68).

## What was done

1. Two people signed up at the stand-in WAWU ID (`POST /auth/register`);
   their tokens are what the statements were read with. Their wallets were
   stored as MONEY-12 stores them, with each wallet's `accountName` from
   Fintava's free wallet name enquiry.
2. Send 1, A to B, ₦10, our reference `WALLET27-SBX-20261003203212-1`:
   amount 1000 kobo, fee 0, total 1000. A's `out` row was recorded from the
   receipt as the sending feature will (WALLET-07); Fintava's documented
   `wallet_to_wallet_transfer_v2` delivery, built from the real answer and
   signed locally (no tunnel, R-25), was posted to MONEY-07's route
   (`200 recorded`) and swept by MONEY-10's consumer (`processed: 1`),
   which wrote B's `in` row.
3. Send 2, B to A, ₦10, `-2`: the same, the other way.
4. The served route, over HTTP with the tokens, for the Lagos day
   2026-10-03:

A: `GET /money/statements?from=2026-10-03&to=2026-10-03&format=csv`: 200,
2 rows, `statement-2026-10-03-to-2026-10-03.csv`:

```
Date,Time,Description,Counterparty,Reference,Note,Money in (₦),Money out (₦),Of which fees (₦)
2026-10-03,21:32,Transfer,Bayo Sandbox,WALLET27-SBX-20261003203212-1,Statement check there,,10.00,0.00
2026-10-03,21:32,Transfer,Bayo Sandbox,22170db6-26d9-45a0-9056-d0856abbdbe4,,10.00,,
```

B, same day: 200, 2 rows:

```
Date,Time,Description,Counterparty,Reference,Note,Money in (₦),Money out (₦),Of which fees (₦)
2026-10-03,21:32,Transfer,Ada Sandbox,db002ccd-36a8-42f3-ab4f-5c333d8f212a,,10.00,,
2026-10-03,21:32,Transfer,Ada Sandbox,WALLET27-SBX-20261003203212-2,Statement check back,,10.00,0.00
```

5. Fintava's own record: `GET /txn?customerId=<A>&take=10`, 200, 10 rows.
   Send 1 is there: 1000 kobo, `SUCCESS`, `CustomerReference`
   `WALLET27-SBX-20261003203212-1`, the same reference and amount as A's
   statement line.
6. A period ending after today (`to=2999-01-01`): 400.

## What it showed

- **A statement lists exactly the person's own movements in the period**,
  oldest first, with Lagos dates and times, each with the history's
  description, other side and reference. A's line for its send equals
  Fintava's record of it.
- **The receiver's line shows Fintava's reference, not ours** (the second
  line of each file): BACKEND_GAPS G-44, already filed by MONEY-15. A
  statement inherits it, so the two people's statements carry different
  references for the same transfer.
- **The money-in line has no counterparty problem:** the delivery names
  nobody, and the statement names the sender from their wallet's account
  name, as the history does.

## Every call made

9 calls, all answered 200:

- `GET /loma-name/enquiry` 2 (A's and B's names; free)
- `GET /customer/wallet/balance/{walletId}` 4 (A and B, before and after)
- `POST /transaction/wallet-to-wallet` 2 (the round trip)
- `GET /txn` 1 (A's own debits, to compare with the statement)

## Not run

- A stamped PDF: Fintava issues none (above).
- Emailing a statement: the backend has no email sender (G-69).
- Bank sends, bills and their reversals in a statement from the sandbox:
  the sandbox refuses every payout (question 17 in `../naira-api.md`).
  Their lines are read in the contract spec from the ledger's own writer.
- A real (not locally signed) delivery: OPS-10.
