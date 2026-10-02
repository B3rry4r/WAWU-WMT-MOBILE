# Fintava Naira API: what it does and what that changes

Read from Fintava's published reference on 2 Oct 2026
(https://fintava.readme.io/reference/getting-started-with-fintava-api). The
pages are saved in `reference/` (`reference/INDEX.txt` lists them), so nobody
builds from memory. This file is the digest; the pages are the source. Where
this file and a real sandbox response disagree, the response wins and this
file is corrected (OPS-02).

Nothing here comes from a sandbox call yet. Every response shape below is
Fintava's documented example, and several pages document no response at all.

## The basics

- **Base URLs.** Sandbox `https://dev.fintavapay.com/api/dev`, live
  `https://live.fintavapay.com/api/dev`.
- **Auth.** `Authorization: Bearer <api key>` on every call. Requests are not
  signed. The key alone moves money, so it lives only in the backend's
  environment secrets, never in the app, a commit or a chat.
- **Amounts are naira, as decimal numbers** (`2.75`, `"100.00"`), sometimes
  as strings in webhooks. We keep kobo integers everywhere else. The Fintava
  client (MONEY-06) converts at the boundary by parsing the decimal string,
  never through a float.
- **No Idempotency-Key.** Wallet-to-wallet and merchant-to-bank transfers take
  a `CustomerReference` we choose. A customer's bank transfer (`/bank/credit`)
  does not take one. It returns a generated reference. That means a timed-out
  bank transfer can't be looked up by our reference, so it can't be retried
  safely without asking Fintava first (question 1 below).
- **Errors.** NestJS style: `{ statusCode, message, error }`, where `message`
  is a string or an array of validation strings. 401 means the key is wrong;
  429 means slow down (limits are not published).
- **Pages.** `page` from 1 and `take` up to 100; a `meta` block reports counts.

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
  base64 image and the BVN. The response is not documented.
- **Check a phone number:** `GET /compliance/verify/phone-number`.
- **What is not there:** liveness (the "blink" on A6), tiers or tier upgrades,
  a NIN check on its own, and a transaction PIN for wallets.

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
4. There is **no "Tier 1"** in the API. MONEY-12 opens a normal account, and
   tier limits are a question for Fintava.

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
- **Name checks:** `GET /name/enquiry` for another bank, and
  `GET /loma-name/enquiry` for a Fintava wallet.
- **Banks:** `GET /banks` (code and name). The code is the `sortCode`.
- **Balance:** `GET /customer/wallet/balance/{walletId}` returns
  `availableBalance` and `bookedBalance`. The app shows `availableBalance`,
  always fetched from Fintava and never added up from our records.
- **WAWU's balance:** `GET /merchant/balance`.
- **History:** `GET /txn?customerId=` per customer, `GET /txn/merchant` for
  WAWU, and lookups by id or reference.
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
   That's the S12 reversal (BILLS-02).
3. **Fees.** The user pays Fintava's fee plus WAWU's on top (R-10). If
   Fintava's bank-send fee is ₦30.75, the user pays ₦30.75 + ₦25 = ₦55.75.
   The real Fintava fees are question 3.
4. **The bank is Loma Bank.** The account examples name "Iyin Ekiti
   Microfinance Bank Limited (Loma Bank)", not "Fintava MFB", which is what
   the canvas prints on W15. The app shows the bank name from the API, and
   the licence wording from config (R-1).

## Bills (BILLS-*)

- Airtime: `POST /billing/airtime` (network GLO, MTN, AIRTEL or 9MOBILE;
  amount; 11-digit number).
- Data: `GET /billing/data-bundles/{network}`, then `POST /billing/data-bundle`.
- Cable TV: `GET /cable-service-name`, `GET /cable-service-name/{network}`,
  then `POST /billing/cable-subscription`.
- Electricity: `GET /billing/discos` (each with a minimum and maximum, for
  example ₦500 to ₦500,000), `POST /billing/preview-meter` (the name on the
  meter), then `POST /billing/electricity`. **Prepaid only**, and never below
  ₦500. Whether the response carries the token and units S7 shows is not
  documented.

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
app (R-20).

1. Does `/bank/credit` accept a `CustomerReference`, and does Fintava reject a
   repeated `CustomerReference`? Without one of the two, a timed-out send
   can't be retried safely.
2. Is there a hold or lien on a customer wallet that we missed? Until there
   is, we use WAWU's merchant wallet (R-19).
3. What are the real fees for wallet-to-wallet, bank sends (what are
   `lomaCharge` and `charges`), bills and SMS? Who pays them, sender or
   merchant?
4. What are the account tiers and their limits, and how does an account move
   up a tier?
5. What exact licence wording may the app show for Loma Bank?
6. What does the selfie check return, and do you offer liveness?
7. Do the electricity responses include the token and units?
8. What are the rate limits?
9. How does WAWU fund its Cardex NGN treasury? See `cardex.md`.
