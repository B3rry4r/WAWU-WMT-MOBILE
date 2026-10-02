# Fintava Naira API: what it does and what that changes

Read from Fintava's published reference on 2 Oct 2026
(https://fintava.readme.io/reference/getting-started-with-fintava-api). The
pages are saved in `reference/` (`reference/INDEX.txt` lists them), so nobody
builds from memory. This file is the digest; the pages are the source. Where
this file and a real sandbox response disagree, the response wins and this
file is corrected (OPS-02).

Sandbox calls were made on 2 Oct 2026 (OPS-02) and are saved in
`sandbox/`, one file per call. Where a line below comes from them it cites
the file. WAWU's sandbox merchant is still `inactive` on Fintava's side, so
every call that opens a customer, checks a BVN, moves money, pays a bill or
freezes a wallet was refused with `403 Merchant is not active`
(`sandbox/README.md`). Those parts are still Fintava's documented examples.

## The basics

- **Base URLs.** Sandbox `https://dev.fintavapay.com/api/dev`, live
  `https://live.fintavapay.com/api/dev`.
- **Auth.** `Authorization: Bearer <api key>` on every call. Requests are not
  signed. The key lives in the backend's `.env` (local for testing, the
  server's for live), never in the mobile app and never committed.
- **Amounts are naira, as decimal numbers** (`2.75`, `"100.00"`), sometimes
  as strings in webhooks. We keep kobo integers everywhere else. The Fintava
  client (MONEY-06) converts at the boundary by parsing the decimal string,
  never through a float.
- **No Idempotency-Key.** Wallet-to-wallet and merchant-to-bank transfers take
  a `CustomerReference` we choose. A customer's bank transfer (`/bank/credit`)
  does not take one. It returns a generated reference. That means a timed-out
  bank transfer can't be looked up by our reference, so it can't be retried
  safely without asking Fintava first (question 1 below).
- **Errors.** Not plain NestJS (`sandbox/24-auth-and-errors.md`). Business
  errors are `{ status, timestamp, message: [string], path }`, with
  `message` always an array. Validation errors nest the NestJS object:
  `{ status, timestamp, message: { statusCode, message: [string], error },
  path }`. **A missing key is 401** ("API Key is required"). **A wrong key
  is 400 or 404, never 401:** without the `live_` prefix it is 400 ["Invalid
  API key"]; with the prefix but unrecognised (a revoked or rotated real
  key) it is 404 ["Invalid API Key"]. MONEY-06 treats both as an
  authentication failure by matching the message case-insensitively, not
  the status code, so a dead key is never read as "not found" or as the
  user's mistake. 429 means slow down; limits are
  not published, no rate-limit headers are sent, and about 100 sandbox
  calls in 10 minutes never hit one.
- **Not found is not one code.** Unknown wallet on the balance call: 400
  "Wallet not found". Unknown customer on `/txn`: 404. Unknown transaction
  reference: 404. **Unknown transaction id: 200 with `data: null`.**
- **Pages.** `page` from 1 and `take` (101 was accepted); a `meta` block
  reports counts, with `page` and `take` as strings. The bank list and the
  bills lists are not paged at all.
- **Amounts in responses** are strings in transaction records (`"5.00"`)
  and bills lists (`"price": "900"`), numbers in balances (`49960`).

## Identifiers (they are not interchangeable)

- `customerId` (`userInfo.id`): transactions, the bank-transfer `sourceId`.
- `walletId` (`wallet.id`): balance, freeze and unfreeze.
- Wallet `accountNumber`: wallet-to-wallet transfers and name checks.
- `CustomerReference`: ours, on transfers that accept it.
- Transaction `reference` and `transactionId`: Fintava's, for lookups.

Store all three of customerId, walletId and accountNumber when an account opens.

## Opening a wallet (KYC-01 to KYC-04, MONEY-12)

- **Create customer:** `POST /create/customer`. Required: first name, last
  name, phone, email, `fundingMethod` (`STATIC_FUND` for a normal account),
  **address**, date of birth (YYYY-MM-DD), BVN **and NIN**. The response
  carries the customer and the wallet with its account number straight away.
- **Check a BVN:** `GET /compliance/verify/bvn?bvn=`. Returns first, middle
  and last name, date of birth, phone, gender and a photo. This is what A5
  prefills. It does not return the state someone lives in or their
  occupation, so the user types those.
- **Selfie against the BVN photo:** `POST /compliance/verify/bvn/selfie` with a
  base64 image and the BVN. The success response is still unseen. A failed
  match came back `400 ["Request failed with status code 404"]` after 5 to
  6 s, and **was still charged ₦10** (`sandbox/05-bvn-selfie.md`). Every
  retry costs money, so the app checks the photo before sending it.
- **Check a phone number:** `GET /compliance/verify/phone-number?phone_number=`
  (local format). ₦5 per call, charged even for "Phone Number not Found"
  (`sandbox/06-phone-check.md`).
- **Fintava returns identity it should not.** `GET /transaction/id/{id}`
  embeds the customer's BVN, NIN, date of birth, address and login record
  (`sandbox/12-transaction-by-id.md`). The backend never passes that response
  on and never logs it raw.
- **What is not there:** liveness (the "blink" on A6), a tier-upgrade call,
  a NIN check on its own, and a transaction PIN for wallets. Tiers do exist
  (`limits.md`): `GET /merchant/balance` returns `"tier": "TIER_3"` for WAWU
  (`sandbox/22-merchant-balance.md`); whether a customer's tier is returned
  anywhere is unknown.

**What that changes:**

1. "Open your wallet" must also collect the **NIN and a full address**,
   because Fintava won't open an account without them. The canvas draws only
   BVN. KYC-03 adds both as fields in the canvas's own form style and asks the
   designer to draw them (OPS-04). That is a fact from the system, not a
   design change.
2. The selfie is a **face match, not a liveness check.** Until a liveness
   provider exists, A6 doesn't claim one. The capture stays, the "blink"
   instruction goes, and nothing says the user was checked for liveness.
3. **The PIN is ours** (MONEY-09), as planned. Fintava only has card PINs.
4. **Tiers exist** (`limits.md`) and the API reports at least the merchant's
   (`TIER_3`). MONEY-12 opens a normal account; which tier it gets is still
   a question for Fintava (the create call was refused, `sandbox/07-create-customer.md`).

## Money in

- **Bank transfer into the account number.** Arrives as the `account_funded`
  webhook. This is the launch top-up (W15).
- **Virtual wallets** (`POST /virtual-wallet/generate`) are temporary account
  numbers for one payment, which lands in WAWU's merchant wallet
  (`virtual_wallet_payment`). Not needed at launch.
- **No card collection.** Fintava doesn't take card payments into a wallet,
  so card top-up needs another provider. It is already after launch
  (WALLET-25).

## Money out and between wallets

- **No transfer has run in the sandbox** (403, merchant inactive:
  `sandbox/13-wallet-to-wallet.md`, `14-bank-transfer.md`). Fees, references
  and duplicates below are still from the docs.
- **Wallet to wallet:** `POST /transaction/wallet-to-wallet` with sender
  account number, receiver account number, amount, `CustomerReference`, and
  an optional narration. The response shows `transaction_fee` and both
  balances after. `/single/transfer` is deprecated; never use it.
- **Customer to a bank:** `POST /bank/credit` with `sourceId` (customerId),
  account number, account name, `sortCode`, amount and narration. The example
  response shows `transaction_fee: 0` and a separate `lomaCharge: 7.5`. The
  `customer_bank_transfer` webhook example shows `charges: 30.75` on ₦100.
- **WAWU's own wallet to a bank:** `POST /bank/credit/merchant` with a
  `CustomerReference`. This is how a school that isn't on WAWU gets paid.
- **Name checks:** `GET /name/enquiry` for another bank answers
  `data.status` (boolean) and `data.account { bankCode, accountName,
  accountNumber, responseCode }` (`"00"` is a match). `GET /loma-name/enquiry`
  for a Fintava wallet answers `data { accountNumber, accountName }`. Both are
  free (`sandbox/02-`, `03-`).
- **Banks:** `GET /banks` (code and name), 358 banks in one unpaged list. The
  code is the `sortCode`. Codes are strings, not always 6 digits, and five
  names appear twice with different codes, so key on `code`
  (`sandbox/01-bank-list.md`). Loma Bank is `090620`.
- **Balance:** `GET /customer/wallet/balance/{walletId}` returns
  `availableBalance` and `bookedBalance`. The app shows `availableBalance`,
  always fetched from Fintava and never added up from our records.
- **WAWU's balance:** `GET /merchant/balance` returns `data { accountName,
  accountNumber, balance { bookedBalance, availableBalance }, tier }`.
- **History:** `GET /txn?customerId=` per customer, `GET /txn/merchant` for
  WAWU, and lookups by id or reference. **`/txn/merchant` is cached for
  about 5 minutes per `page` and `take`** (filters are not part of the
  key), so it can't confirm that something just happened; use the lookups
  or the balance for that (`sandbox/10-merchant-history.md`). Its `status`
  filter is upper case (`PENDING`, `SUCCESS`, `CANCELLED`, `FAILURE`,
  `ONGOING`). Lookup by `reference` is a short record; lookup by id is the
  full one, with `platformComm`, `merchantComm`, `lomaCharge` and the bill
  fields (`metertoken`, `meternumber`, `discoRef`) (`sandbox/11-`, `12-`).
- **Freeze and unfreeze:** by walletId, with a reason. Used for fraud holds
  and for the 30-day account deletion window (R-17).

**What that changes:**

1. **The API can't reserve part of a balance.** A "hold" (or "lien") would
   keep money in the payer's own account but stop them spending it until a
   paid DM is answered or an event happens. Fintava has no endpoint for
   that. So a held payment moves into WAWU's merchant wallet and is paid out
   or refunded from there (R-19, MONEY-18). This is about what the API can
   do, not about the licence.
2. **Bills are paid from WAWU's merchant wallet.** The bill calls take no
   customer, so a user's bill is two steps: move the amount from their
   wallet to WAWU's, then pay the biller. If the biller fails, move it back.
   That's the S12 reversal (BILLS-02). Not yet confirmed by a purchase
   (403, merchant inactive); re-check the merchant balance around the first
   one.
3. **Fees.** The user pays Fintava's fee plus WAWU's on top (R-10).
   Fintava's real charges are in `fees.md` (bank send ₦40, so the user pays
   ₦65). WAWU's fees are set as "merchant charges" in Fintava's dashboard.
4. **The bank is Loma Bank.** The account examples name "Iyin Ekiti
   Microfinance Bank Limited (Loma Bank)", not "Fintava MFB", which is what
   the canvas prints on W15. The app shows the bank name from the API, and
   the licence wording from config (R-1).

## Bills (BILLS-*)

None of the four purchases has run in the sandbox yet (403, merchant
inactive); the lists and the meter preview have.

- Airtime: `POST /billing/airtime` (network GLO, MTN, AIRTEL or 9MOBILE;
  amount; 11-digit number).
- Data: `GET /billing/data-bundles/{network}`, then `POST /billing/data-bundle`.
  The network name is case-insensitive, and **9mobile is `ETISALAT`**
  (`9MOBILE` is a 404). Bundle `code`s repeat across networks; `price` is a
  string (`sandbox/20-bills-data.md`).
- Cable TV: `GET /cable-service-name` (only `GOTV` and `DSTV`),
  `GET /cable-service-name/{network}` (case-sensitive), then
  `POST /billing/cable-subscription`. The plan code sets the price
  (`sandbox/21-bills-cable.md`).
- Electricity: `GET /billing/discos` (22 codes, each with `minimum_value`
  and `maximum_value` as strings and `is_available` "Yes"/"No"),
  `POST /billing/preview-meter` (the name on the meter; a bad meter is a bare
  400 "Http Exception"), then `POST /billing/electricity`. **Postpaid codes
  are listed too, and the minimum is per disco** (₦0 to ₦1,000, not always
  ₦500), so the app reads both limits from the list
  (`sandbox/16-bills-discos.md`). The purchase response is unseen; the
  transaction record has a `metertoken` field, so the token can at least be
  read back by transaction id.

## SMS

`POST /sms/send` and `/sms/send/bulk` (numbers with country code). This can
be the SMS route for sign-up codes that `docs/PLAN.md` asks for, if the
price is right.

## Cards (after launch)

These are ATM and debit cards.
- **Request:** `POST /cards/physical/request` with `cardBrand` (VERVE, VISA or
  MASTERCARD), `cardName` and `cardType`. `STATIC_WITH_ACCOUNT` is tied to
  the customer's wallet account number. `STATIC_NO_ACCOUNT` and
  `DYNAMIC_CARD` don't need one.
- **Then:** link a card (PAN) to an account (`/cards/link`), activate,
  deactivate (with a reason), reissue, change the PIN (old PIN, CVV and
  expiry needed), read the status, list cards, view one card.
- **Card payments** come back as the `card_payment` and
  `dynamic_card_payment` webhooks; the payloads aren't published.
- No virtual-card endpoint is documented, though the introduction mentions
  virtual cards.

**What that means for the WAWU card (WALLET-22, WALLET-31):** a physical
Verve (or Visa or Mastercard) card linked to the user's own account number
(`STATIC_WITH_ACCOUNT`) is supported end to end. The docs don't cover the
card fee, delivery, whether Fintava prints and ships the card, or the card
webhook payloads; those come from Fintava when the card is built.

## Webhooks (MONEY-07)

None received yet: the sandbox run had no public URL and no event could
fire (`sandbox/23-webhooks.md`). Everything below is from the docs.

- **Signature:** HMAC-SHA512 of the raw body with the dashboard's webhook
  secret, hex, in `x-fintava-signature`. Compare in constant time.
- **No timestamp,** so a captured delivery could be replayed. We process each
  event once, keyed on its transaction reference, and that is the replay
  protection.
- **Retries** until a 200: live every 3 minutes for 4 tries, then hourly for
  72 hours; sandbox hourly for 72 hours. Answer 200 fast and process after.
- **Events:**
  - `account_funded`: money in from a bank.
  - `virtual_wallet_payment`: a temporary account was paid. The docs warn it
    may arrive as `VIRTUAL_WALLET_PAYMENT`.
  - `customer_bank_transfer`: a customer sent to a bank.
  - `wallet_to_wallet_transfer_v2`: a wallet sent to a wallet.
  - `debit_transfer_reversal`: a debit came back. This is how a failed bank
    send shows up; there is no separate "failed" event.
  - `card_payment` and `dynamic_card_payment`: payloads not published.
- The type field is `event` in the events page and `type` in the
  verification sample. Read both until a real delivery settles it.

## Questions for Fintava

These replace the list in `docs/PLAN.md`; the docs answered the rest. None of
them blocks building: money is built on the sandbox and launches with the
app (R-20). What the sandbox showed on each, with evidence, is in
`sandbox/README.md`; in short:

- 1: unknown (403 before validation). 2: unknown. 3: partly (records carry
  `platformComm`, `merchantComm`, `lomaCharge`). 4: partly (merchant is
  `TIER_3`; a customer's tier unknown). 5: unknown. 6: partly (a failed
  selfie is a 400 and costs ₦10). 7: partly (`metertoken` on the
  transaction). 8: unknown (no headers, no 429). 9: unknown.

1. Does `/bank/credit` accept a `CustomerReference`, and does Fintava reject a
   repeated `CustomerReference`? Without one of the two, a timed-out send
   can't be retried safely.
2. Is there a hold or lien on a customer wallet that we missed? Until there
   is, we use WAWU's merchant wallet (R-19).
3. Fees are answered (`fees.md`). Still to confirm: what `lomaCharge` and
   `charges` in the responses are, and how a dashboard merchant charge shows
   up in a response and a webhook.
4. What are the account tiers and their limits, and how does an account move
   up a tier?
5. What exact licence wording may the app show for Loma Bank?
6. What does the selfie check return, and do you offer liveness?
7. Do the electricity responses include the token and units?
8. What are the rate limits?
9. How does WAWU fund its Cardex NGN treasury? See `cardex.md`.
10. Please activate WAWU's sandbox merchant; it is `inactive`, so every
    customer, transfer and bill call answers `403 Merchant is not active`.
11. Which BVN, NIN, phone and meter numbers does the sandbox accept?
12. What do the merchant settings `KycFee`, `DebitKycFee`,
    `WalletToWalletDebit`, `DebitStaticWallet`, `staticWalletFee`,
    `staticWalletCapFee` and `splitstatus` do?
13. Can `GET /transaction/id/{id}` stop returning the customer's BVN, NIN
    and login record?
14. Is the 5-minute cache on `/txn/merchant` deliberate, and does `/txn` do
    the same?
15. Ikeja has two prepaid codes: which one?
