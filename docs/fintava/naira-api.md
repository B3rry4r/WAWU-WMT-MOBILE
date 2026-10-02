# Fintava Naira API: what it does and what that changes

Read from Fintava's published reference on 2 Oct 2026
(https://fintava.readme.io/reference/getting-started-with-fintava-api). The
pages are saved in `reference/` (`reference/INDEX.txt` lists them), so nobody
builds from memory. This file is the digest; the pages are the source. Where
this file and a real sandbox response disagree, the response wins and this
file is corrected (OPS-02).

Sandbox calls were made on 2 Oct 2026 (OPS-02) and are saved in
`sandbox/`, one file per call. Where a line below comes from them it cites
the file. The first run (08:28 UTC) found WAWU's sandbox merchant `inactive`;
Fintava activated it at 09:22 UTC and the re-run (09:39 UTC) opened two test
customers, moved money between wallets and froze a wallet. **Still not seen
working: bank sends and bill purchases**, which answer `400 "Unable to find
customers"` (cable: `201 "service not currently available"`); those parts
are still Fintava's documented examples (`sandbox/README.md`, "The
blocker").

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
- **No Idempotency-Key, but our reference does the job.** Wallet-to-wallet,
  merchant-to-bank **and the customer's bank transfer (`/bank/credit`)** all
  take a `CustomerReference` we choose, and a repeat is refused:
  wallet-to-wallet `400 "customerReference already exists"`, `/bank/credit`
  `400 "CustomerReference Already Exists"` (`sandbox/13-wallet-to-wallet.md`,
  `sandbox/14-bank-transfer.md`). `GET /transaction/reference/{ours}` finds
  the transaction (`sandbox/11-transaction-by-reference.md`). So a timed-out
  send is looked up by our reference before any retry, and **the lookup
  counts only if the body has `data`**: a `200` with `{}` is neither "found"
  nor "not found" (next point).
- **A refused send is not always clean.** A refused wallet-to-wallet send
  writes nothing and does not use up its reference, so it can be retried
  with the same one. A bank send refused with `400 "Unable to find
  customers"` still wrote a `PENDING` debit record with our reference, moved
  no money, stayed `PENDING` for at least 37 minutes, and **used the
  reference up** (`sandbox/14-bank-transfer.md`). Later the record **became
  invisible by reference**: at 10:18 UTC the lookup still returned it, but at
  10:27:45, 10:27:46 and 10:28:11 UTC (OPS-02 verifier) `GET /transaction/reference/{ours}` answered
  **HTTP 200 with the body `{}`**, while `/txn/merchant` still listed the same
  send as `PENDING`. **`{}` is not only for refused sends** (MONEY-06,
  `sandbox/26-money06-client.md`): the lookup answered `{}` for records
  that exist, of every status, SUCCESS included. It was seen from about a
  minute after a send to at least 18.5 minutes after (and on OPS-02's
  records, hours old), and it flips: the same reference was served in full
  and then answered `{}` 1.2 s later (MONEY-06 verifier, 16:00 UTC), and
  records that were `{}` at 10:27 were served in full again at 15:33. A
  reference that never existed answered `404 "Transaction not found!"` every
  time. So `{}` can come back for an existing reference at any time, even
  a second after it was served; it looks like "a record exists, its body
  was not served".
  The client (MONEY-06) never reads `{}` as "not found, safe to retry with
  the same reference": it reconciles from the history (where the row still
  sits), retries a refused bank send only under a **new** reference, and
  MONEY-16 treats orphan `PENDING` rows as no money moved.
- **A 2xx is not proof of payment.** A cable purchase came back HTTP 201 with
  only `{ status: 200, message: "service not currently available" }`
  (`sandbox/21-bills-cable.md`). A payment counts only when the body carries
  a transaction (and a lookup or the balance confirms it). Create customer
  answers 201, not 200 (`sandbox/07-create-customer.md`).
- **A 5xx on a money call means "unknown".** A wallet-to-wallet send first
  answered `500 ["read ECONNRESET"]`; the identical request seconds later
  answered `400 "Insufficient balance on source wallet..."`
  (`sandbox/13-wallet-to-wallet.md`). And a ₦10 send the client gave up on
  after 3 s **went through** (`sandbox/26-money06-client.md`). Look the send
  up by our reference before retrying, never assume it failed or succeeded.
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
  user's mistake. **403 is not only "merchant inactive"**: create customer
  answered `403 ["This NIN is blacklisted", ...]`
  (`sandbox/07-create-customer.md`), so read the message. 429 means slow down; limits are
  not published, no rate-limit headers are sent, and neither run (about
  100 calls in 10 minutes, then 82 in 7.5 minutes) hit one
  (`sandbox/24-auth-and-errors.md`).
- **Not found is not one code.** Unknown wallet on the balance call: 400
  "Wallet not found". Unknown customer on `/txn`: 404. Unknown transaction
  reference: 404. **Unknown transaction id: 200 with `data: null`**
  (OPS-02, and again at 16:00:20 UTC); in two MONEY-06 runs (15:40 and
  15:41 UTC) the same call came back without `data`, which the client reads
  as unknown (`sandbox/26-`). A
  refused bank send looked up by our reference some time later: **200 with
  `{}`** (no `data`, no `status`), though the history still lists it
  (`sandbox/14-bank-transfer.md`).
  Unknown account on `/loma-name/enquiry`: 400 with a leaked JavaScript
  error (`sandbox/03-name-enquiry-internal.md`). A customer record id used as
  `sourceId`: 404 "No wallet exists for the customer"
  (`sandbox/14-bank-transfer.md`).
- **Pages.** `page` from 1 and `take` (101 was accepted); a `meta` block
  reports counts, with `page` and `take` as strings. The bank list and the
  bills lists are not paged at all.
- **Amounts in responses** are strings in transaction records (`"5.00"`)
  and bills lists (`"price": "900"`), numbers in balances (`49960`).

## Identifiers (they are not interchangeable)

A customer has **four** ids (`sandbox/07-create-customer.md`):

- `customerId` (`userInfo.id`): `/customers/{id}`, `/txn?customerId=`, the
  bank-transfer `sourceId`.
- The customer **record** `id` (top-level `id` in `/customers/list` and
  `/customers/details`): a different uuid, used by nothing we call; as a
  `sourceId` it answers 404.
- `walletId` (`wallet.id`): balance, freeze and unfreeze.
- `wallet.tagpayCustomerId`: what transfer responses call
  `source_customer_id`.
- Wallet `accountNumber` (also `tagpayWalletId`): wallet-to-wallet transfers
  and name checks.

And for transactions:

- `CustomerReference`: ours, on every transfer (wallet-to-wallet, both bank
  sends). Lookups by it work.
- **The transfer response swaps its reference names**
  (`sandbox/11-transaction-by-reference.md`): its `customerReference` field is
  **Fintava's** `reference` (findable), and its `reference` field is stored as
  `tagapayTransRef` and **cannot** be looked up. Store our
  `CustomerReference` and the response's `customerReference`; look up by ours.
- `transactionId` (`id`): Fintava's, for `GET /transaction/id/{id}`.

Store customerId, walletId and accountNumber when an account opens.

## Opening a wallet (KYC-01 to KYC-04, MONEY-12)

- **Create customer:** `POST /create/customer`. Validated: first name, last
  name, phone (a valid number, local format accepted), email,
  `fundingMethod` (`STATIC_FUND` for a normal account), **address**, date of
  birth (YYYY-MM-DD) and BVN (11 digits). **The NIN is not validated** though
  the docs mark it required; we send it anyway. Success is **HTTP 201**
  ("User created successfully"). The response carries the customer and the
  wallet with its account number straight away, but **returns `nin: null`**
  even when one was sent, and **shows no tier**. The new wallet is
  **`TIER_2`**, visible only in reads: `data.tier` on the wallet balance and
  `wallet.tier` on `/customers/list` and `/customers/{id}`
  (`sandbox/07-create-customer.md`, `sandbox/08-wallet-balance.md`).
- **Create runs no identity check and costs nothing.** It accepted a BVN the
  BVN check says does not exist, accepted the same BVN and NIN for a second
  customer, and charged ₦0 (`sandbox/07-create-customer.md`,
  `sandbox/25-compliance-charges.md`). Our backend runs the BVN check and the
  selfie itself, before create (BVN check KYC-01, selfie match KYC-02).
- **Check a BVN:** `GET /compliance/verify/bvn?bvn=`. Returns first, middle
  and last name, date of birth, phone, gender and a photo (documented; the
  sandbox has not yet answered with a match). This is what A5
  prefills. An unknown BVN is `400 "Invalid BVN or BVN does not exist"` and
  **still costs ₦5** in the sandbox (`sandbox/04-bvn-check.md`). It does not return the state someone lives in or their
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
  (`sandbox/22-merchant-balance.md`), and a new customer's wallet reports
  `TIER_2` in the reads above (`sandbox/08-wallet-balance.md`).

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
4. **Tiers exist** (`limits.md`). Create opens **`TIER_2`**
   (`sandbox/07-create-customer.md`); how a wallet reaches `TIER_3` is still a
   question for Fintava (`sandbox/README.md`, question 20).

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

- **Wallet to wallet works** in every direction: customer to customer,
  WAWU's merchant account to a customer, a customer to WAWU
  (`sandbox/13-wallet-to-wallet.md`). **Bank sends do not work yet** in the
  sandbox (`400 "Unable to find customers"`, `sandbox/14-bank-transfer.md`).
- **Wallet to wallet:** `POST /transaction/wallet-to-wallet` with sender
  account number, receiver account number, amount, `CustomerReference`, and
  an optional narration. HTTP 200 in about 0.6 s. The response shows
  `transaction_fee`, `total` and **only the sender's** balance after
  (`source_availableBalance`, `source_bookedBalance`), not the receiver's.
  The sandbox charged ₦0 (`transaction_fee: 0`); the dashboard rates in
  `fees.md` are the ones we use (owner). `/single/transfer` is deprecated;
  never use it.
- **Customer to a bank:** `POST /bank/credit` with `sourceId` (customerId),
  account number, account name, `sortCode`, amount and narration. The example
  response shows `transaction_fee: 0` and a separate `lomaCharge: 7.5`. The
  `customer_bank_transfer` webhook example shows `charges: 30.75` on ₦100.
  It **does** take a `CustomerReference` and refuses a repeat
  (`sandbox/14-bank-transfer.md`). Validation wants `sourceId` (a uuid),
  `accountNumber`, `sortCode` and a positive `amount`; `accountName` is not
  required.
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
  WAWU, and lookups by id or reference. **Both lists show only the debits the
  account made; money received never appears** (`type=CREDIT` is ignored),
  for customers and for WAWU (`sandbox/09-customer-history.md`,
  `sandbox/10-merchant-history.md`). So "money in" rows come from the
  webhooks (`wallet_to_wallet_transfer_v2`, `account_funded`) recorded by our
  backend, while the balance shown stays Fintava's. **`/txn/merchant` is cached for
  about 5 minutes per `page` and `take`** (filters are not part of the
  key), so it can't confirm that something just happened; use the lookups
  or the balance for that (`sandbox/10-merchant-history.md`). Its `status`
  filter is upper case (`PENDING`, `SUCCESS`, `CANCELLED`, `FAILURE`,
  `ONGOING`). Lookup by `reference` is a short record; lookup by id is the
  full one, with `platformComm`, `merchantComm`, `lomaCharge` and the bill
  fields (`metertoken`, `meternumber`, `discoRef`) (`sandbox/11-`, `12-`).
- **Freeze and unfreeze:** by walletId, with a reason. Both answer 200 with
  the wallet (`isFrozen`) and the embedded customer, BVN included. **A frozen
  wallet can neither send nor receive**: both directions answer `400 "Kindly
  confirm both customer accounts are active"`; its balance can still be read
  (`sandbox/15-freeze-unfreeze.md`). So earnings (R-11) and refunds (R-19)
  sent to a frozen wallet are refused, not held: if a fraud hold or the
  30-day deletion window (R-17) freezes the wallet, that money waits in
  WAWU's merchant wallet (`BACKEND_GAPS.md` G-10).

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
   (refused with "Unable to find customers", nothing debited:
   `sandbox/18-` to `21-`); re-check the merchant balance around the first
   one that goes through. WAWU's merchant account can be the sender of a
   wallet-to-wallet send, so moving money back to the user works
   (`sandbox/13-wallet-to-wallet.md`).
3. **Fees.** The user pays Fintava's fee plus WAWU's on top (R-10).
   Fintava's real charges are in `fees.md` (bank send ₦40, so the user pays
   ₦65). WAWU's fees are set as "merchant charges" in Fintava's dashboard.
4. **The bank is Loma Bank.** The account examples name "Iyin Ekiti
   Microfinance Bank Limited (Loma Bank)", not "Fintava MFB", which is what
   the canvas prints on W15. The app shows the bank name from the API, and
   the licence wording from config (R-1).

## Bills (BILLS-*)

None of the four purchases has gone through in the sandbox yet: airtime,
data and electricity answer `400 "Unable to find customers"` and cable
answers `201 "service not currently available"`, with nothing debited
(`sandbox/18-` to `21-`). The lists and the meter preview work.

- Airtime: `POST /billing/airtime` (network GLO, MTN, AIRTEL or 9MOBILE;
  amount; 11-digit number). **Minimum ₦100** (`400 "Airtime amount is less
  than 100"`, `sandbox/19-bills-airtime.md`).
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

None received yet: neither sandbox run had a public URL or dashboard access
(`sandbox/23-webhooks.md`). The re-run did make four wallet-to-wallet
sends, which would have sent `wallet_to_wallet_transfer_v2` to a configured
URL; no delivery was received or seen. Everything below is from the docs. They carry more
weight than planned: the history lists show no money received, so the app's
"money in" depends on these deliveries.

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
`sandbox/README.md`. Status after the re-run (2 Oct 2026):

1. **Answered.** Does `/bank/credit` accept a `CustomerReference`, and does
   Fintava reject a repeated one? Yes and yes: it is stored, found by
   `/transaction/reference/{ours}`, and a repeat is `400 "CustomerReference
   Already Exists"`; wallet-to-wallet refuses a repeat too. Catch: a refused
   bank send uses up its reference (`sandbox/14-bank-transfer.md`,
   `sandbox/13-wallet-to-wallet.md`).
2. Open. Is there a hold or lien on a customer wallet that we missed? Freeze
   is not one: it blocks money in as well as out
   (`sandbox/15-freeze-unfreeze.md`). We use WAWU's merchant wallet (R-19).
3. Partly answered. Fees are in `fees.md` (dashboard rates are final). On
   wallet-to-wallet the sandbox set `transaction_fee: 0` and `platformComm`,
   `merchantComm`, `lomaCharge` null (`sandbox/12-`, `13-`). Still open:
   `lomaCharge` and `charges` on a bank send, and how a dashboard merchant
   charge shows up (no bank send has gone through).
4. Partly answered. Tiers are in `limits.md`; create opens `TIER_2`
   (`sandbox/07-create-customer.md`). Open: how an account moves up a tier.
5. Open. What exact licence wording may the app show for Loma Bank?
6. Partly answered. A failed selfie check is a 400 and costs ₦10
   (`sandbox/05-bvn-selfie.md`). Open: the success response, and liveness.
7. Open. Do the electricity responses include the token and units? (The
   purchase is refused in the sandbox, `sandbox/18-bills-electricity.md`.)
8. Open. What are the rate limits? (None hit, `sandbox/24-auth-and-errors.md`.)
9. Open. How does WAWU fund its Cardex NGN treasury? See `cardex.md`.
10. **Answered.** WAWU's sandbox merchant was activated at 09:22 UTC on
    2 Oct 2026 (`sandbox/12-transaction-by-id.md`).
11. Open. Which BVN, NIN, phone, meter and smartcard numbers does the sandbox
    accept? (The documented example BVN is unknown to the BVN check and
    blacklisted as a NIN, `sandbox/04-`, `07-`.)
12. Open. What do the merchant settings `KycFee`, `DebitKycFee`,
    `WalletToWalletDebit`, `DebitStaticWallet`, `staticWalletFee`,
    `staticWalletCapFee` and `splitstatus` do?
13. Open. Can `GET /transaction/id/{id}` and the freeze responses stop
    returning the customer's BVN, NIN and login record?
14. Open. Is the 5-minute cache on `/txn/merchant` deliberate, and does `/txn`
    do the same?
15. Open. Ikeja has two prepaid codes: which one?
16. Open. Does a wallet to wallet payment from a customer into WAWU's merchant
    wallet (a purchase on WAWU) count toward the customer's tier daily limit,
    the same as a send to another customer? WAWU counts it (Lead ruling, 2 Oct
    2026, MONEY-04) until you say otherwise.
17. Open. Why do bank sends and the airtime, data and electricity purchases
    answer `400 "Unable to find customers"`, and cable `201 "service not
    currently available"`? (`sandbox/14-`, `18-` to `21-`.)
18. Open. Why does the sandbox charge ₦0 for wallet-to-wallet? (Sandbox
    reconciliation only; the dashboard rates are final.)
19. Open. How do we list money a wallet received? `/txn` and `/txn/merchant`
    list debits only (`sandbox/09-`, `10-`).
20. Open. How does a wallet move from `TIER_2` to `TIER_3`?
21. Open. Will the `PENDING` records left by refused bank sends ever resolve,
    and why does the lookup by our reference turn into `200 {}` while
    `/txn/merchant` still lists the row? It happens to SUCCESS records too,
    from about a minute after a send to at least 18.5 minutes after, and
    flips between the full record and `{}` within 1 to 2 seconds. How should we retry? (`sandbox/14-bank-transfer.md`,
    `sandbox/26-money06-client.md`.)
22. Open. Create returns `nin: null`: is the NIN stored?
