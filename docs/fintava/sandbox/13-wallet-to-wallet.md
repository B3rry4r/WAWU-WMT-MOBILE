# POST /transaction/wallet-to-wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 9 and 10 (customer to customer; customer to WAWU and back).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran: HTTP 200 in all three directions; duplicate refused; no fee**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN: HTTP 403** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- **All three directions work**: WAWU to customer A (₦300), A to B (₦50),
  A to WAWU (₦10), plus B to A (₦10, `15-freeze-unfreeze.md`). Each answered
  200 in about 0.6 s and the balances moved at once.
- **No fee was charged in any direction**: `transaction_fee: 0`, `total`
  equal to `amount`, and every balance moved by exactly the amount
  (`08-wallet-balance.md`, `22-merchant-balance.md`); the full record has
  `platformComm`, `merchantComm` and `lomaCharge` all null
  (`12-transaction-by-id.md`). `fees.md` says ₦23.25 below ₦5,000. The
  merchant setting `WalletToWalletDebit: false` may be why; a question for
  Fintava (README.md, Contradictions).
- **A repeated `CustomerReference` is refused**: `400 ["customerReference
  already exists"]`, nothing moved. A refused transfer does **not** use up
  its reference: `OPS02R-W2W-004` was refused twice and `OPS02R-W2W-005`
  went through after being refused while frozen. So a send that was clearly
  refused can be retried with the same reference, and a timed-out one can be
  looked up by it (`11-transaction-by-reference.md`).
- **Insufficient funds** (B, holding ₦50, sending ₦1,000): the first answer
  was **`500 ["read ECONNRESET"]`**; the identical request a few seconds later
  gave `400 ["Insufficient balance on source wallet to complete this
  transfer."]`. Nothing moved either time. MONEY-06 must treat a 500 on a
  money call as "unknown": look it up by our reference before retrying.
- The merchant wallet **can** be the sender (by its account number
  `1102038668`), so WAWU can pay a user out of its own wallet (R-19 refunds
  and payouts).
- The response's `reference` and `customerReference` are not what they
  say: see `11-transaction-by-reference.md`. `source_customer_id` is the
  wallet's `tagpayCustomerId`, not the customerId. `source_availableBalance`
  and `source_bookedBalance` are the sender's balance after the send.
- Smallest amount: ₦10 went through; nothing smaller was tried. Validation
  only asks for a positive number.
- A frozen wallet can neither send nor receive: `15-freeze-unfreeze.md`.
- Webhook (`wallet_to_wallet_transfer_v2`): not seen; no URL was set
  (`23-webhooks.md`).
- References created (ours, then Fintava's `reference` and the transaction
  id): `OPS02R-W2W-001` ₦300 WAWU to A, `23f77125-...`, `02271ab1-...`;
  `OPS02R-W2W-002` ₦50 A to B, `6305ae79-...`, `336ae2dd-...`;
  `OPS02R-W2W-003` ₦10 A to WAWU, `341f9cb1-...`, `bfc65098-...`;
  `OPS02R-W2W-004` refused (no record); `OPS02R-W2W-005` ₦10 B to A,
  `d56551bf-...`, `95bde900-...`; `OPS02R-W2W-006` refused (no record).

### Requests and responses

#### WAWU to customer A, ₦300

Sent 2026-10-02 09:40:36 UTC, answered in 0.64 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1102038668",
  "receiverAccount": "1154079370",
  "amount": 300,
  "narration": "OPS-02 rerun WAWU to A",
  "CustomerReference": "OPS02R-W2W-001"
}
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:36 GMT
content-type: application/json; charset=utf-8
content-length: 487
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"1e7-xr62wfuChBW60r8U3xUQUycziwI"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "amount": 300,
    "reference": "Aq3QKQTXsU98QZpzee6FUbT4ygffK6bxqlRG",
    "customerReference": "23f77125-eac0-4e73-bb83-8562ccdfddb9",
    "total": 300,
    "transaction_fee": 0,
    "source_customer_id": "08c19688-031c-407f-936d-ff8901be6d83",
    "source_customer_accname": "Test Account4",
    "source_customer_accno": "1102038668",
    "source_customer_wallet": "1102038668",
    "source_availableBalance": 49655,
    "source_bookedBalance": 49655,
    "description": "Fund transfer between customers"
  },
  "status": 200,
  "message": "successful"
}
```

#### Merchant balance after: ₦300 lower, no fee

Sent 2026-10-02 09:40:36 UTC, answered in 0.32 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:37 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-HFRrv2pMSj2DW2SFOdQXCTH44qc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49655,
      "availableBalance": 49655
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer A after: ₦300

Sent 2026-10-02 09:40:37 UTC, answered in 0.26 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:37 GMT
content-type: application/json; charset=utf-8
content-length: 129
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"81-9PorDyc7Np+z/KgQOixIhnfskqc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 300,
      "availableBalance": 300
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### The same request again (same CustomerReference)

Sent 2026-10-02 09:40:42 UTC, answered in 0.21 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1102038668",
  "receiverAccount": "1154079370",
  "amount": 300,
  "narration": "OPS-02 rerun WAWU to A",
  "CustomerReference": "OPS02R-W2W-001"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:40:42 GMT
content-type: application/json; charset=utf-8
content-length: 147
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"93-1M6M2NMhbS1Lq5LU1ZjVjI0gC5U"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:40:42.500Z",
  "message": [
    "customerReference already exists"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### Customer A after the duplicate: unchanged

Sent 2026-10-02 09:40:42 UTC, answered in 0.25 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:42 GMT
content-type: application/json; charset=utf-8
content-length: 129
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"81-9PorDyc7Np+z/KgQOixIhnfskqc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 300,
      "availableBalance": 300
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### Customer A to customer B, ₦50

Sent 2026-10-02 09:40:48 UTC, answered in 0.65 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1154079370",
  "receiverAccount": "1151496137",
  "amount": 50,
  "narration": "OPS-02 rerun A to B",
  "CustomerReference": "OPS02R-W2W-002"
}
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:49 GMT
content-type: application/json; charset=utf-8
content-length: 479
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"1df-YdrJi3US4tmYwVbHbjQrOR4wj2g"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "amount": 50,
    "reference": "eJ1qQ84v8iFxoCjAKPHSC4fEZgsw5j67MoEB",
    "customerReference": "6305ae79-1261-483d-bbba-94b8f19caa51",
    "total": 50,
    "transaction_fee": 0,
    "source_customer_id": "aec1ceef-e774-4427-9456-00b585fe8999",
    "source_customer_accname": "Ada Sandbox",
    "source_customer_accno": "1154079370",
    "source_customer_wallet": "1154079370",
    "source_availableBalance": 250,
    "source_bookedBalance": 250,
    "description": "Fund transfer between customers"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer A after: ₦250

Sent 2026-10-02 09:40:49 UTC, answered in 0.23 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:49 GMT
content-type: application/json; charset=utf-8
content-length: 129
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"81-PLWvbGSfk5SQz66NrrL//4yImg8"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 250,
      "availableBalance": 250
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### Customer B after: ₦50

Sent 2026-10-02 09:40:49 UTC, answered in 0.26 s.

```http
GET /api/dev/customer/wallet/balance/bd656a80-6984-4832-9a06-a858f249aec6
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:49 GMT
content-type: application/json; charset=utf-8
content-length: 127
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7f-bypNIgbhBbnoyn9jYokoQdXH9bs"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 50,
      "availableBalance": 50
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### Merchant balance: unchanged (no fee to WAWU either)

Sent 2026-10-02 09:40:49 UTC, answered in 0.62 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:50 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-HFRrv2pMSj2DW2SFOdQXCTH44qc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49655,
      "availableBalance": 49655
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer A to WAWU, ₦10

Sent 2026-10-02 09:40:58 UTC, answered in 0.74 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1154079370",
  "receiverAccount": "1102038668",
  "amount": 10,
  "narration": "OPS-02 rerun A to WAWU",
  "CustomerReference": "OPS02R-W2W-003"
}
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:58 GMT
content-type: application/json; charset=utf-8
content-length: 479
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"1df-2DU9rSc4dYcA0+S21MQYtJY0tR8"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "amount": 10,
    "reference": "A3GRMQ160DVnvlTAV4P76RLP4o244aE1Gdi7",
    "customerReference": "341f9cb1-e00d-4a86-95c9-579c5e835c7d",
    "total": 10,
    "transaction_fee": 0,
    "source_customer_id": "aec1ceef-e774-4427-9456-00b585fe8999",
    "source_customer_accname": "Ada Sandbox",
    "source_customer_accno": "1154079370",
    "source_customer_wallet": "1154079370",
    "source_availableBalance": 240,
    "source_bookedBalance": 240,
    "description": "Fund transfer between customers"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer B to A, ₦1,000 (B holds ₦50): 500

Sent 2026-10-02 09:40:58 UTC, answered in 0.42 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1151496137",
  "receiverAccount": "1154079370",
  "amount": 1000,
  "narration": "OPS-02 rerun B to A, more than B holds",
  "CustomerReference": "OPS02R-W2W-004"
}
```

**Response: HTTP 500**

```http
HTTP/2 500 
date: Fri, 02 Oct 2026 09:40:59 GMT
content-type: application/json; charset=utf-8
content-length: 130
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"82-8uYWQ/cU3EohRvoCG1gCqVjSppo"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 500,
  "timestamp": "2026-10-02T09:40:59.316Z",
  "message": [
    "read ECONNRESET"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### Empty body (validation)

Sent 2026-10-02 09:40:59 UTC, answered in 0.19 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:40:59 GMT
content-type: application/json; charset=utf-8
content-length: 409
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"199-YQzTAkQgeLBNkSzE4LTI5XfGVj8"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:40:59.558Z",
  "message": {
    "statusCode": 400,
    "message": [
      "senderAccount should not be empty",
      "receiverAccount must be a number string",
      "receiverAccount should not be empty",
      "amount should not be empty",
      "amount must be a positive number",
      "amount must be a number conforming to the specified constraints"
    ],
    "error": "Bad Request"
  },
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### Merchant balance: ₦10 higher

Sent 2026-10-02 09:40:59 UTC, answered in 0.33 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:59 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-IxjeQ8xow0/xNoXWICalzGWIIzg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49665,
      "availableBalance": 49665
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer B after the 500: unchanged

Sent 2026-10-02 09:40:59 UTC, answered in 0.25 s.

```http
GET /api/dev/customer/wallet/balance/bd656a80-6984-4832-9a06-a858f249aec6
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:00 GMT
content-type: application/json; charset=utf-8
content-length: 127
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7f-bypNIgbhBbnoyn9jYokoQdXH9bs"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 50,
      "availableBalance": 50
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### The ₦1,000 request again, same reference: insufficient balance

Sent 2026-10-02 09:41:06 UTC, answered in 0.58 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1151496137",
  "receiverAccount": "1154079370",
  "amount": 1000,
  "narration": "OPS-02 rerun B to A, more than B holds",
  "CustomerReference": "OPS02R-W2W-004"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:41:07 GMT
content-type: application/json; charset=utf-8
content-length: 179
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"b3-/cnLq2EeTjfMxdt57RMbaTsviL0"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:41:07.333Z",
  "message": [
    "Insufficient balance on source wallet to complete this transfer."
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- None of the three moves could be made: customer to customer (no
  customers), customer to WAWU's merchant wallet (no customer), WAWU back to
  a customer (no customer). The only probe was WAWU's account to an account
  number that does not exist, ₦100, and an empty body: both 403 before
  validation.
- So these stay unknown: the fee actually charged (`fees.md` says ₦23.25
  under ₦5,000), whether `transaction_fee` in the response shows it, whether
  a repeated `CustomerReference` is refused, whether the merchant wallet can
  be the sender, and the `wallet_to_wallet_transfer_v2` webhook.
- What to run once the merchant is active: two customers A and B; A to B
  ₦100 with reference R1; the same call again with R1 (duplicate test); A to
  WAWU's account `1102038668` ₦100; WAWU to A ₦100; then `GET
  /transaction/reference/R1` (does our reference work there?) and both
  balances.

### Requests and responses

#### WAWU's account to an unknown account, ₦100

Sent 2026-10-02 08:30:17 UTC, answered in 0.24 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1102038668",
  "receiverAccount": "1100000000",
  "amount": 100,
  "narration": "OPS-02 sandbox test",
  "CustomerReference": "OPS02-W2W-001"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:17 GMT
content-type: application/json; charset=utf-8
content-length: 137
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"89-yWR2TukrF6ixuNZcj1ROsjd3a6w"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:17.661Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### Empty body

Sent 2026-10-02 08:30:33 UTC, answered in 0.22 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:33 GMT
content-type: application/json; charset=utf-8
content-length: 137
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"89-gNokZrzmdmyOzAGL5tFHA9pYTJk"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:33.350Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```
