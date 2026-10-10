# Pay from wallet against the sandbox (MONEY-17)

Task MONEY-17, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
one run at about 21:31 UTC lasting a few seconds. No other Fintava host was
called (not `live.fintavapay.com`), and nothing on `id.wawuafrica.com` or
`api.wawuafrica.com`. This session's permission policy allowed the
money-moving calls.

Run by wawu-backend `scripts/fintava/payment-sandbox-check.ts` (branch
`wmt/MONEY-17`; its header says how), against a fresh local database
(`m17_live_test`, dropped afterwards), the app on :4965 and the stand-in
WAWU ID on :4966. A fetch guard in the script refused every request except
the sandbox host and those two local ports, any POST to Fintava other than
`/transaction/wallet-to-wallet`, and a third send. The key was read from a
file with `sed` into the command's environment, never printed; the output
was checked for every 8 characters of it in a row (58 windows, none found).

Limits kept: OPS-02's customer A (`1154079370`) only, no customer created,
no charged call. Money moved: one ₦10 payment from A to WAWU's merchant
wallet through the route, and ₦10 back from WAWU's wallet to A, so A ended
where it started (25,000 kobo, ₦250).

## What was done

1. A person signed up at the stand-in WAWU ID (`POST /auth/register`) and
   signed in (`POST /auth/login`); that token is what every request carried.
   Their wallet was stored as MONEY-12 stores it, pointing at A, and their
   PIN set through `POST /money/pin` (201).
2. What was bought: a ₦10 test item registered in the script the way a
   selling feature registers its kind (`PayableRegistry`, kind
   `content_unlock`, a stand-in creator as payee). No real kind is
   registered on main yet (BACKEND_GAPS G-70).
3. The calls, over HTTP:

| Request | Answer |
|---|---|
| `GET /money/payments/quote?kind=content_unlock&targetId=sbx-item` | 200: price 1000, fee 2325 (the dashboard's ₦23.25, `fees.md`), total 3325, `balanceKobo` 25000 (Fintava's, read then) |
| `POST /money/payments`, a new Idempotency-Key, the PIN, `expectedTotalKobo` 3325 and the quote's `quoteToken` | 201 `completed`, reference `wawu-pay-68fcd10b-071c-4144-8aa5-83bf7c513056` |
| the same request again (same key, same body) | 201, the same bytes, `Idempotent-Replayed: true`; no second send reached Fintava (the guard counted 1) |

4. Fintava's side, read after: the lookup by our reference found `SUCCESS`,
   1000 kobo; A's available balance went from 25,000 to 24,000 kobo, so
   **₦10 left A, not ₦10.00 + ₦23.25**: the sandbox charged `transaction_fee:
   0` on wallet to wallet, as in OPS-02 (`13-wallet-to-wallet.md`).
5. Our side: the payment's split was payee 850 kobo, WAWU 150 kobo (85/15 of
   the price). The merchant's `in` ledger row is `completed`, 1000. The
   buyer's `out` row was written `pending` with the quoted charge before the
   send (fee 2325, total 3325) and Fintava's answer (fee 0, total 1000)
   disagreed, so it holds `discrepancy` "send sighting: status pending vs
   completed not applied, feeKobo 2325 vs 0, totalKobo 3325 vs 1000" and stays
   pending for review (a stop, MONEY-16 reports it); the same text is on the
   payment. The payment itself is `completed`: Fintava moved the price.
6. WAWU's merchant wallet (`1102038668`) sent ₦10 back to A under
   `MONEY17-SBX-<time>-back`; A ended at 25,000 kobo.

Fintava calls, in order (10): `GET /customer/wallet/balance/{A}` 200,
`GET /merchant/balance` 200 (the quote's balance and the start figures),
`GET /customer/wallet/balance/{A}` 200 twice (the payment's own balance check
and the start figure), `GET /merchant/balance` 200 (the payment's merchant
account), `POST /transaction/wallet-to-wallet` 200 (the payment),
`GET /transaction/reference/wawu-pay-...` 200, `GET
/customer/wallet/balance/{A}` 200, `POST /transaction/wallet-to-wallet` 200
(the return), `GET /customer/wallet/balance/{A}` 200.

## What it showed

- **The route takes the price, once, into WAWU's merchant wallet**, under our
  reference, and a repeat of the same request never reaches Fintava.
- **The sandbox still charges ₦0 on wallet to wallet**, so the quote's
  ₦23.25 is not what the sandbox debits: every sandbox payment completes with
  the buyer's ledger row holding a fee disagreement (BACKEND_GAPS G-71). The
  dashboard rates are the ones charged live (owner, `fees.md`); this is the
  sandbox difference question 18 in `../naira-api.md` asks about.

## What was not run, and what unblocks it

- **"A buyer paying for a ₦1,000 item is debited ₦1,023.25" against
  Fintava**: the sandbox debits ₦1,000 (fee ₦0). Proved against the Fintava
  stand-in in the contract spec, which charges the dashboard rate.
  Unblocked when a sandbox wallet-to-wallet answers a non-zero
  `transaction_fee` (question 18), or by OPS-10's first live purchase.
- **A timeout, a 5xx and a refusal from the real sandbox**: cannot be asked
  of it; proved against the stand-in (the contract spec).
