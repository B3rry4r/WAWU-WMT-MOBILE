# Receipts against sandbox movements (WALLET-18)

Task WALLET-18, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
three runs between 20:44 and 20:46 UTC, each a few seconds long. No other
Fintava host was called. The receipt routes never call Fintava; the
sandbox was used to put a real movement in the ledger and to read
Fintava's own record of it, which the public page was then checked against.

Run by wawu-backend `scripts/fintava/receipt-sandbox-check.ts` (branch
`wmt/WALLET-18`; its header says how), against a fresh local database
(`w18_live_test`, dropped afterwards), the app on :4971 and the stand-in
WAWU ID on :4972, with `RECEIPT_VERIFY_BASE_URL` set to the local app so
the receipt's link could be followed. A fetch guard in the script refused
every request except the sandbox host and those two local ports, any POST
to Fintava other than `/transaction/wallet-to-wallet`, and a third send in
a run. The key was read from a file with `sed` into the command's
environment, never printed; each run's output was checked for every 8
characters of it in a row (58 windows, none found).

Limits kept: OPS-02's customers A (`1154079370`, "Ada Sandbox") and B
(`1151496137`, "Bayo Sandbox") only, no customer created, no charged call,
money moved only as ₦10 round trips (A to B, B to A). Balances before and
after each run: A 25,000 kobo (₦250), B 4,000 kobo (₦40), unchanged.

## What was done (run 3, the one that passed)

1. Two people signed up at the stand-in WAWU ID; their tokens are what the
   owner's receipt routes were called with. Their wallets were stored as
   MONEY-12 stores them, each `accountName` from Fintava's free wallet name
   enquiry.
2. Send 1, A to B, ₦10, our reference `WALLET18-SBX-20261003204540-1`:
   amount 1000 kobo, fee 0, total 1000. A's `out` row was recorded from the
   answer as the sending feature will (WALLET-07); B's `in` row came from
   Fintava's documented `wallet_to_wallet_transfer_v2` delivery, built from
   the real answer, signed locally (no tunnel, R-25), posted to MONEY-07's
   route (`200 recorded`) and swept by MONEY-10's consumer (`processed: 1`).
3. Send 2, B to A, ₦10, `-2`: the same the other way.
4. Fintava's own record of send 1, `GET /transaction/reference/WALLET18-SBX-20261003204540-1`:
   `status: SUCCESS`, 1000 kobo, `customerReference` our reference,
   `createdAt 2026-10-03T20:45:42.238Z`.
5. The receipt routes over HTTP:

| Request | Answer |
|---|---|
| A: `POST /money/transactions/<send 1's row>/receipt` | 200, code `PN05FXE4CSJ2`, link `wawu/r/PN05FXE4CSJ2`; lines Type Transfer, From "Ada Sandbox · 115 407 9370", To "Bayo Sandbox", Bank Loma Bank, Amount ₦10.00, Fintava's charge ₦0.00, Total paid ₦10.00, Reference our reference |
| anyone (no token): `GET /r/PN05FXE4CSJ2` | 200: Transfer, ₦10.00, Completed, 3 Oct 2026, 21:45 (Lagos), From "Ada S." with "Loma Bank •••• 9370", To "Bayo S.", Reference our reference |
| B: receipt of B's `in` row | 200, its own code `DY91F5V02M4H`; its page shows +₦10.00 from "Ada S." |
| B: `POST /money/transactions/<A's row>/receipt` | 404 |
| anyone: `GET /r/<a code nobody was given>` | 404, "Receipt not found", no figure on it |
| A: `.../receipt/image`, `.../receipt/pdf` | 200 `image/png` (95,016 bytes), 200 `application/pdf` (88,496 bytes) |

## What it showed

- **A receipt's code opens a page that matches the transaction** as
  Fintava records it: the same amount (1000 kobo), Fintava's `SUCCESS`
  shown as Completed, the reference Fintava finds the movement by, and the
  time (the page's minute is Fintava's `createdAt` in Lagos time).
- **The page shows neither full account number, neither full name, the
  note nor a person id.** A WAWU user on the other side is a masked name
  only: MONEY-15's history gives an account's last 4 digits only for a bank
  account, so "Bayo S." has none.
- **A made-up code is a plain 404**, with nothing of anyone on it.
- Each side of one movement has its own receipt and code. B's receipt
  shows Fintava's `reference` rather than ours (BACKEND_GAPS G-44, from
  MONEY-15): the page shows what the ledger row holds.

## Every call made

20 calls in all, every one answered 200:

- Run 1 (20:44:42 UTC), 9 calls: `GET /loma-name/enquiry` 2,
  `GET /customer/wallet/balance/{walletId}` 4, `POST
  /transaction/wallet-to-wallet` 2 (references `WALLET18-SBX-20261003204442-1`
  and `-2`), `GET /transaction/reference/{ref}` 1. The product answered as in
  run 3; two of the script's own checks were wrong (one expected a WAWU
  user's last 4 digits, which the product deliberately does not show; one
  looked for the words "Receipt check", which are also the page's title),
  so the script was corrected and run again.
- Run 2, 2 calls: `GET /loma-name/enquiry` 2. The script stopped before any
  money moved: the reused local database already held A's and B's wallets.
  The database was dropped and made again.
- Run 3 (20:45:40 UTC), 9 calls, as run 1: references
  `WALLET18-SBX-20261003204540-1` and `-2`. Every check passed.

No delivery was received from Fintava (none can reach this machine); the two
per run were built and signed locally, as MONEY-15's run did.

## Not run

- A bank send's receipt from the sandbox: the sandbox refuses every payout
  (question 17 in `../naira-api.md`). The bank-account side (masked to its
  last 4 digits, the bank named) is proved in the contract spec from the
  ledger's own writer.
- The link printed on a receipt pointing at the live host: the public host
  is not named yet (BACKEND_GAPS G-67).
