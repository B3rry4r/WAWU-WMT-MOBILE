# POST /bank/credit and /bank/credit/merchant: send to a bank

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 7 (send to a bank: success, failure, reversal).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran: every send refused, HTTP 400 "Unable to find customers"; success, failure and reversal NOT RUN to a result**.
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

- **No bank send went through.** WAWU's send (`/bank/credit/merchant`) and a
  customer's send (`/bank/credit`) both answer `400 ["Unable to find
  customers"]`, to the sandbox stub account (`0123456789`, GTBank `000013`,
  which name enquiry confirms) and even to customer B's own Loma Bank account
  (`090620`). The airtime, data and electricity purchases answer the same
  (`18-`, `19-`, `20-`). It is not about the beneficiary or the sender: it
  looks like a missing setup on Fintava's side for this merchant. **Unblocked
  when** a ₦100 `POST /bank/credit/merchant` to `0123456789`/`000013` stops
  answering "Unable to find customers" (question 17 in `README.md`).
- **`/bank/credit` accepts a `CustomerReference`, and refuses a repeat**:
  the send with `OPS02R-BC-001` was stored with that reference, and sending
  it again answered `400 ["CustomerReference Already Exists"]` (different
  wording and capitals from wallet-to-wallet's "customerReference already
  exists"). Question 1 is answered.
- **A refused bank send is not a clean failure.** Each 400 "Unable to find
  customers" still wrote a ₦100 `AATRANSFER` DEBIT record, `status:
  "PENDING"`, with our reference and a `sessionId`, visible in the history
  (`09-`, `10-`) and by reference; no balance moved; and **the reference is
  used up** (unlike wallet-to-wallet, `13-`). Re-checked about 37 minutes
  later: still `PENDING`, balances unchanged, nothing reversed. MONEY-06 has
  to treat a 400 from a bank send as "refused, but a record may exist", use
  a new reference for a retry, and MONEY-16 must ignore these orphan
  `PENDING` rows.
- **Validation** (`/bank/credit`, empty body): `sourceId` (not empty, a
  uuid), `accountNumber` and `sortCode` ("must be a number conforming to
  the specified constraints", yet the strings we send pass), `amount`
  (positive number). `accountName`, `narration` and `CustomerReference` are
  not required.
- `sourceId` is the customerId (`userInfo.id`). The customer record id from
  the list answers `404 ["No wallet exists for the customer"]`.
- Still unknown: the fee actually charged (₦40 in `fees.md`), `lomaCharge`,
  how a failed send and a reversal show, and the `customer_bank_transfer` and
  `debit_transfer_reversal` webhooks.
- References created, all refused: `OPS02R-MT-001` (WAWU to the stub),
  `OPS02R-MT-002` (WAWU to B's Loma account) and `OPS02R-BC-001` (A to the
  stub) each left a `PENDING` record; `OPS02R-BC-002` (A, with the record id
  as `sourceId`, 404) was not looked up.

### Requests and responses

#### POST /bank/credit/merchant, ₦100 to the stub account

Sent 2026-10-02 09:41:37 UTC, answered in 0.31 s.

```http
POST /api/dev/bank/credit/merchant
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 rerun merchant to bank",
  "CustomerReference": "OPS02R-MT-001"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:41:37 GMT
content-type: application/json; charset=utf-8
content-length: 131
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"83-Z2lp5OHZCKhfFHmks4AlKHASzog"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:41:37.354Z",
  "message": [
    "Unable to find customers"
  ],
  "path": "/api/dev/bank/credit/merchant"
}
```

#### Merchant balance after: unchanged

Sent 2026-10-02 09:41:37 UTC, answered in 0.26 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:37 GMT
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

#### POST /bank/credit, customer A, ₦100 to the stub account, with a CustomerReference

Sent 2026-10-02 09:41:44 UTC, answered in 0.29 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "sourceId": "4e8409cf-1234-40f7-963a-5c212c7a9836",
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 rerun A to bank",
  "CustomerReference": "OPS02R-BC-001"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:41:44 GMT
content-type: application/json; charset=utf-8
content-length: 122
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7a-+zfWBlRpqVehizl8T+2WK6guOuE"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:41:44.712Z",
  "message": [
    "Unable to find customers"
  ],
  "path": "/api/dev/bank/credit"
}
```

#### Customer A after: unchanged

Sent 2026-10-02 09:41:44 UTC, answered in 0.25 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:45 GMT
content-type: application/json; charset=utf-8
content-length: 129
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"81-SeCM0HxcPwBOlQEhtFqgcg0buvc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 240,
      "availableBalance": 240
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### Merchant balance after: unchanged

Sent 2026-10-02 09:41:45 UTC, answered in 0.27 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:45 GMT
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

#### POST /bank/credit with an empty body (validation)

Sent 2026-10-02 09:41:58 UTC, answered in 0.48 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:41:59 GMT
content-type: application/json; charset=utf-8
content-length: 541
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"21d-j96vEfMWqmM8uqT5828eUlck5Co"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:41:59.254Z",
  "message": {
    "statusCode": 400,
    "message": [
      "sourceId should not be empty",
      "sourceId must be a UUID",
      "accountNumber should not be empty",
      "accountNumber must be a number conforming to the specified constraints",
      "sortCode must be a number conforming to the specified constraints",
      "sortCode should not be empty",
      "amount should not be empty",
      "amount must be a positive number",
      "amount must be a number conforming to the specified constraints"
    ],
    "error": "Bad Request"
  },
  "path": "/api/dev/bank/credit"
}
```

#### POST /bank/credit with the customer record id as sourceId

Sent 2026-10-02 09:41:59 UTC, answered in 0.21 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "sourceId": "a4d75fbd-0262-44b0-873c-022fbf309d7b",
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 rerun A to bank",
  "CustomerReference": "OPS02R-BC-002"
}
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 09:41:59 GMT
content-type: application/json; charset=utf-8
content-length: 131
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"83-pib2dBukMa5XvOBx5CGIX+CyDwQ"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T09:41:59.572Z",
  "message": [
    "No wallet exists for the customer"
  ],
  "path": "/api/dev/bank/credit"
}
```

#### POST /bank/credit/merchant, ₦100 to customer B's Loma Bank account

Sent 2026-10-02 09:42:09 UTC, answered in 0.55 s.

```http
POST /api/dev/bank/credit/merchant
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "accountNumber": "1151496137",
  "accountName": "Bayo Sandbox",
  "sortCode": "090620",
  "amount": 100,
  "narration": "OPS-02 rerun merchant to Loma account",
  "CustomerReference": "OPS02R-MT-002"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:42:10 GMT
content-type: application/json; charset=utf-8
content-length: 131
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"83-TF7PMyiIXG7JHjcF14LisRkTLnE"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:42:10.126Z",
  "message": [
    "Unable to find customers"
  ],
  "path": "/api/dev/bank/credit/merchant"
}
```

#### Merchant balance after: unchanged

Sent 2026-10-02 09:42:10 UTC, answered in 0.27 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:10 GMT
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

#### GET /transaction/reference/OPS02R-MT-001: a PENDING record

Sent 2026-10-02 09:44:02 UTC, answered in 0.45 s.

```http
GET /api/dev/transaction/reference/OPS02R-MT-001
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:02 GMT
content-type: application/json; charset=utf-8
content-length: 756
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f4-DWsqp0dYlDG3eRf5KSFP1Q9mhzw"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "55788ec8-13f3-479c-a994-5e78e741887b",
    "createdAt": "2026-10-02T09:41:37.284Z",
    "updatedAt": "2026-10-02T09:41:37.284Z",
    "amount": "100.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "6c3dd7c2-ced0-4119-bdb0-1e44a080c57a",
    "CustomerReference": "OPS02R-MT-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun merchant to bank",
    "currency": "NGN",
    "TransRef": null,
    "status": "PENDING",
    "recipientDetails": "SIMI MICHELLE (0123456789)",
    "senderDetails": "Test Account4",
    "senderBank": "Loma Bank",
    "receiverBank": "GTBANK PLC",
    "reason": null,
    "sessionId": "000013261002094137685648997507",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### POST /bank/credit again with OPS02R-BC-001

Sent 2026-10-02 09:44:11 UTC, answered in 0.20 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "sourceId": "4e8409cf-1234-40f7-963a-5c212c7a9836",
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 rerun A to bank",
  "CustomerReference": "OPS02R-BC-001"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:44:11 GMT
content-type: application/json; charset=utf-8
content-length: 130
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"82-vvBqmc0xksnzoi1+hNp2U+2EnDI"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:44:11.942Z",
  "message": [
    "CustomerReference Already Exists"
  ],
  "path": "/api/dev/bank/credit"
}
```

#### GET /transaction/reference/OPS02R-BC-001: a PENDING record

Sent 2026-10-02 09:44:11 UTC, answered in 0.17 s.

```http
GET /api/dev/transaction/reference/OPS02R-BC-001
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:12 GMT
content-type: application/json; charset=utf-8
content-length: 758
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f6-ZfioItQcKkg5gtBXfB7WUB+TCYM"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "5b7c2213-ce9f-495f-ab36-079caa816517",
    "createdAt": "2026-10-02T09:41:44.656Z",
    "updatedAt": "2026-10-02T09:41:44.656Z",
    "amount": "100.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "c1240e50-74c2-4d6e-9eba-d867c3e2aa42",
    "CustomerReference": "OPS02R-BC-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun A to bank",
    "currency": "NGN",
    "TransRef": null,
    "status": "PENDING",
    "recipientDetails": "SIMI MICHELLE (0123456789)",
    "senderDetails": "Ada Sandbox 1154079370",
    "senderBank": "Loma Bank",
    "receiverBank": "GTBANK PLC",
    "reason": null,
    "sessionId": "090620261002094144844359705329",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### About 37 minutes later: OPS02R-MT-001

Sent 2026-10-02 10:18:41 UTC, answered in 0.56 s.

```http
GET /api/dev/transaction/reference/OPS02R-MT-001
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 10:18:42 GMT
content-type: application/json; charset=utf-8
content-length: 756
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f4-DWsqp0dYlDG3eRf5KSFP1Q9mhzw"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "55788ec8-13f3-479c-a994-5e78e741887b",
    "createdAt": "2026-10-02T09:41:37.284Z",
    "updatedAt": "2026-10-02T09:41:37.284Z",
    "amount": "100.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "6c3dd7c2-ced0-4119-bdb0-1e44a080c57a",
    "CustomerReference": "OPS02R-MT-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun merchant to bank",
    "currency": "NGN",
    "TransRef": null,
    "status": "PENDING",
    "recipientDetails": "SIMI MICHELLE (0123456789)",
    "senderDetails": "Test Account4",
    "senderBank": "Loma Bank",
    "receiverBank": "GTBANK PLC",
    "reason": null,
    "sessionId": "000013261002094137685648997507",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### About 37 minutes later: OPS02R-BC-001

Sent 2026-10-02 10:18:42 UTC, answered in 0.27 s.

```http
GET /api/dev/transaction/reference/OPS02R-BC-001
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 10:18:42 GMT
content-type: application/json; charset=utf-8
content-length: 758
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f6-ZfioItQcKkg5gtBXfB7WUB+TCYM"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "5b7c2213-ce9f-495f-ab36-079caa816517",
    "createdAt": "2026-10-02T09:41:44.656Z",
    "updatedAt": "2026-10-02T09:41:44.656Z",
    "amount": "100.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "c1240e50-74c2-4d6e-9eba-d867c3e2aa42",
    "CustomerReference": "OPS02R-BC-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun A to bank",
    "currency": "NGN",
    "TransRef": null,
    "status": "PENDING",
    "recipientDetails": "SIMI MICHELLE (0123456789)",
    "senderDetails": "Ada Sandbox 1154079370",
    "senderBank": "Loma Bank",
    "receiverBank": "GTBANK PLC",
    "reason": null,
    "sessionId": "090620261002094144844359705329",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### Merchant balance at the re-check

Sent 2026-10-02 10:18:42 UTC, answered in 0.35 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 10:18:43 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-36PZVvZpIKK+B7ehQlrajJMGkjo"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49650,
      "availableBalance": 49650
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

#### Customer A at the re-check

Sent 2026-10-02 10:18:43 UTC, answered in 0.80 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 10:18:44 GMT
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

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Tried: a customer send (`/bank/credit`, unknown `sourceId`, ₦100, with a
  `CustomerReference`), the same with only a `CustomerReference` in the body,
  and WAWU's merchant send (`/bank/credit/merchant`, ₦100 to the sandbox stub
  account `0123456789` at GTBank, reference `OPS02-MT-001`). All 403 before
  validation, so **whether `/bank/credit` accepts `CustomerReference` is
  still unknown** (a validation pass would have named an unexpected
  property).
- Success, failure and reversal: not run. Nothing is known yet about the fee
  charged (₦40 in `fees.md`), `lomaCharge`, how a failed send shows (the docs
  say only the `debit_transfer_reversal` webhook) or how the sandbox
  simulates a failure.
- What to run once the merchant is active: ₦100 to `0123456789`/`000013`
  (the stub that name enquiry answers) for success; ₦100 to an account the
  name enquiry rejects for failure; read both by reference and id; watch the
  balance and history for a reversal over the next hour.

### Requests and responses

#### POST /bank/credit, full body

Sent 2026-10-02 08:30:17 UTC, answered in 0.17 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "sourceId": "00000000-0000-0000-0000-000000000000",
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 sandbox test",
  "CustomerReference": "OPS02-BC-001"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:17 GMT
content-type: application/json; charset=utf-8
content-length: 120
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"78-cFcpF5CwY7YfWtIVrEODaMM7pRs"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:17.880Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/bank/credit"
}
```

#### POST /bank/credit with only CustomerReference

Sent 2026-10-02 08:30:32 UTC, answered in 0.53 s.

```http
POST /api/dev/bank/credit
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "CustomerReference": "OPS02-BC-VAL"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:33 GMT
content-type: application/json; charset=utf-8
content-length: 120
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"78-ZVbl99ljwuUagATdVSu/z+BnxEM"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:33.086Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/bank/credit"
}
```

#### POST /bank/credit/merchant, ₦100

Sent 2026-10-02 08:29:57 UTC, answered in 0.20 s.

```http
POST /api/dev/bank/credit/merchant
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "accountNumber": "0123456789",
  "accountName": "SIMI MICHELLE",
  "sortCode": "000013",
  "amount": 100,
  "narration": "OPS-02 sandbox test",
  "CustomerReference": "OPS02-MT-001"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:29:58 GMT
content-type: application/json; charset=utf-8
content-length: 129
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"81-PgHy8E3Kx4cWYV00fmufxrDmrUA"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:29:58.079Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/bank/credit/merchant"
}
```
