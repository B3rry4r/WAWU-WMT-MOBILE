# The ledger against the sandbox (MONEY-10)

Task MONEY-10, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026,
20:17:56 to 20:18:02 UTC, then a second pass with no sends at 20:20:08 UTC.
No other Fintava host was called.

Run by wawu-backend `scripts/fintava/ledger-sandbox-check.ts` (branch
`wmt/MONEY-10`; its header says how), against a local database
(`m10_live_test`) and the app's real webhook route on :4762. A fetch guard in
the script refused every request except the sandbox host and the local app,
any POST to Fintava other than `/transaction/wallet-to-wallet`, and a fifth
send. The key was read from a file with `sed`, never printed; both outputs
were checked for every 8 characters of it in a row (none).

Limits kept: OPS-02's customers A (`1154079370`) and B (`1151496137`) only, no
customer created, no charged call, money moved only as two ₦10 round trips
(WAWU to A and back, WAWU to B and back). Balances before and after: WAWU
₦49,640, A ₦250, B ₦40, unchanged.

## How the webhooks were fed

Fintava cannot reach this machine (no tunnel, R-25). Each send's
`wallet_to_wallet_transfer_v2` delivery was built in Fintava's documented
format (`reference/webhook-events.md`) from the real transfer's answer, signed
with a local secret (HMAC-SHA512 of the raw body) and posted to MONEY-07's
`POST /api/hub/webhooks/fintava`, which stored it; the ledger's sweep then
consumed it. Which reference a real delivery carries is G-19's open question,
so both readings were sent: the transfer response's names (`reference` is the
tagapay one, `customerReference` Fintava's) and the documented shape
(`reference` only).

## What each movement left in the ledger

| # | Movement, our reference | How it reached the ledger | Rows |
|---|---|---|---|
| 1 | WAWU to A ₦10, `MONEY10-SBX-20261002201756-1` | the sender's own record from the receipt; reconciled by our reference (found, SUCCESS); the webhook (response names) twice: `recorded`, then `duplicate` | WAWU out −1000 kobo, A in +1000 kobo, both completed |
| 2 | A to WAWU ₦10, `-2` | treated as a lost answer: a pending row with our reference only; reconciled by lookup (found, SUCCESS; the by-id record added the tagapay reference); the documented webhook (tagapay only) | A out −1000, WAWU in +1000, both completed |
| 3 | WAWU to B ₦10, `-3` | the documented webhook first, with nothing in the ledger: confirmed through the merchant's history and the by-id record; the sender's receipt record afterwards folded into that row | WAWU out −1000, B in +1000, both completed |
| 4 | B to WAWU ₦10, `-4` | the webhook (response names) first, confirmed by lookup; the receipt record afterwards folded in | B out −1000, WAWU in +1000, both completed |

8 rows for 4 movements: one `out` on the sender and one `in` on the receiver
for each, 1000 kobo each, fee 0 (the sandbox still charges nothing for wallet
to wallet), no discrepancy.

**One finding, fixed in the same task.** In the first pass movement 2's
delivery stayed `pending` ("waiting for Fintava to confirm (empty_lookup)"):
A's `out` row was already held under the delivery's tagapay reference, but
the ledger still asked Fintava about WAWU's new `in` side, and of A's many ₦10
history rows the five read by id were older ones. The consumer now takes the
references of the side already held (the movement is identified; nothing to
ask) and reads same-amount history rows nearest in time first. The second
pass, at 20:20:08 UTC with no sends, swept the waiting delivery again with
that code: processed, "identified by the side already held", WAWU's `in` row
written once. A waiting delivery being swept again is the designed path.

## Every call made

First pass, 31 calls (4 sends): merchant balance 3, wallet balance 4,
wallet-to-wallet 4 (all 200), lookup by reference 8 (4 answered Fintava's
404 for a tagapay reference, which cannot be looked up; 4 found), customer
history 1, merchant history 1, transaction by id 10.

Second pass, 7 calls, all balance reads (merchant 3, wallet 4). No send.

## Not run

- Bank sends (`customer_bank_transfer`) and their reversals
  (`debit_transfer_reversal`), and bills: the sandbox refuses every payout
  (question 17 in `../naira-api.md`). The ledger reads both events and is
  tested with locally signed documented payloads only.
- `account_funded` and `virtual_wallet_payment`: nothing in the sandbox can
  send money in from another bank or pay a temporary account without a
  tunnel and a real bank. Tested with locally signed documented payloads.
- Real deliveries: none received (no tunnel, R-25); OPS-10 records the first.
