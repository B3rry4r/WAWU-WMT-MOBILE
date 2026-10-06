# Fee quotes and the sandbox (WALLET-15)

Task WALLET-15, 3 Oct 2026. **No call was made to Fintava**, on any host:
not `dev.fintavapay.com`, not `live.fintavapay.com`, and nothing on
`id.wawuafrica.com` or `api.wawuafrica.com`.

## Why none was needed for the quote

`GET /money/fees/quote` never asks Fintava. A quote is the fee schedule in
config (`docs/fintava/fees.md`, final; R-10, R-31) applied to the amount,
behind the wallet gate, which reads only our database. The route was run on
the built Hub (wawu-backend branch `wmt/WALLET-15`, `node dist/src/main.js`
on :4961, no `FINTAVA_*` setting at all) against a fresh local database
(`w15_hub_test`, dropped afterwards) and the local stand-in WAWU ID (:4962),
signed in through its `/auth/login` (no minted token):

| Request (`?kind=&amountKobo=`) | Answer |
|---|---|
| `bank_transfer`, 1000000, before the wallet row | `409 wallet_not_open` |
| `bank_transfer`, 1000000 | 200: `bank_transfer` 4000 + `wawu_fee` 2500 = 6500, total 1006500 (₦10,065) |
| `purchase`, 499900 (₦4,999) | 200: `balance_transfer` 2325, total 502225 |
| `purchase`, 500000 (₦5,000) | 200: `balance_transfer` 1575, total 501575 |
| `bill`, `electricity`, 1000000 | 200: `bill_charge` 10000, `wawu_fee` 0, `balance_transfer` 1575, total 1011575 |
| `wawu_transfer`, 1000000 | 200: `balance_transfer` 1575 + `wawu_fee` 1000, total 1002575 |
| `bank_transfer`, `10000.00` | 400 "amountKobo must be a whole number of kobo, 1 or more, written in digits only." |
| `purchase`, 1000000000 | `400 amount_out_of_range`, `maximumKobo` 999998425 |

The wallet row was written the way MONEY-12 stores an open wallet; no
Fintava account was created.

## What was not run, and what unblocks it

- **Does Fintava's record of a ₦10,000 bank send debit ₦10,065?** NOT RUN.
  Payouts out of Fintava still answer `400 "Unable to find customers"` as
  far as this repo records (`README.md`, "The blocker"); WALLET-09 (the
  send) is not built and OPS-09 (WAWU's ₦25 as a dashboard merchant charge)
  is not done. Unblocked when a ₦100 `POST /bank/credit/merchant` to the
  stub `0123456789`/`000013` stops answering "Unable to find customers"
  (question 17 in `../naira-api.md`) and OPS-09 has set the merchant
  charge; then OPS-10's first real send shows the debit. This session did
  not send that probe: the session's permission policy refused a sandbox
  call that moves money, so the blocker's state is as `14-bank-transfer.md`
  recorded it on 2 Oct.
- **Does a ₦4,999 and a ₦5,000 purchase debit what the quote shows?**
  NOT RUN. The purchase debit is MONEY-17's (not built), and the sandbox
  takes ₦0 on wallet to wallet (`13-wallet-to-wallet.md`; the owner ruled
  the dashboard rates stand, `../fees.md`), so the sandbox debit would be
  the price alone until Fintava applies the dashboard rates. Unblocked when
  MONEY-17 is served and one sandbox wallet to wallet move answers a
  non-zero `transaction_fee` (or OPS-10's first live purchase).
- **An electricity bill's charges in Fintava's record.** NOT RUN: the bill
  purchases answer "Unable to find customers" (`18-bills-electricity.md`),
  same unblocking fact as the bank send.
