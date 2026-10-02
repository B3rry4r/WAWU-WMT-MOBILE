# GET /transaction/reference/{reference}

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 8 (look up a transaction by reference).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200 and 404**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **ran, HTTP 200 and 404** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- **Our `CustomerReference` works on this path**: `GET
  /transaction/reference/OPS02R-W2W-001` returned the transfer. This answers
  the first run's open point; it also works for a refused bank send
  (`14-bank-transfer.md`).
- **The transfer response names its references the wrong way round.** The
  wallet-to-wallet response's `reference` (`Aq3Q...`, 36 characters) is
  **not** found here (404); it is stored as `tagapayTransRef` on the full
  record (`12-transaction-by-id.md`). The response's `customerReference`
  (`23f77125-...`, a uuid) is **Fintava's** `reference`, not ours, and is
  found. MONEY-06 stores our `CustomerReference` and the response's
  `customerReference` value, and looks up by ours.
- **A `200` here does not always carry a record.** A refused bank send was
  found by our reference at 10:18 UTC, but the OPS-02 verifier's lookups of
  `OPS02R-MT-001` and `OPS02R-BC-001` at 10:27:45 to 10:28:11 UTC answered
  **200 with the body `{}`** while `/txn/merchant` still listed the send as
  `PENDING` (`14-bank-transfer.md`). Check for `data`; `{}` is neither found
  nor not found.
- New fields seen: `transType: "AATRANSFER"`, `sessionId` (30 digits,
  starting with the receiving bank's code `090620`, then the date and time),
  `senderDetails`/`recipientDetails` as "name account".

### Requests and responses

#### GET /transaction/reference/{our CustomerReference}

Sent 2026-10-02 09:41:07 UTC, answered in 0.24 s.

```http
GET /api/dev/transaction/reference/OPS02R-W2W-001
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:07 GMT
content-type: application/json; charset=utf-8
content-length: 756
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f4-1E8FN+kYIDkL7fWS+Z5o//JjJJM"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "02271ab1-413f-45d0-905b-c6c62a16d77a",
    "createdAt": "2026-10-02T09:40:36.779Z",
    "updatedAt": "2026-10-02T09:40:36.792Z",
    "amount": "300.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "23f77125-eac0-4e73-bb83-8562ccdfddb9",
    "CustomerReference": "OPS02R-W2W-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun WAWU to A",
    "currency": "NGN",
    "TransRef": null,
    "status": "SUCCESS",
    "recipientDetails": "Ada Sandbox 1154079370",
    "senderDetails": "Test Account4 1102038668",
    "senderBank": "Loma Bank",
    "receiverBank": "Loma Bank",
    "reason": null,
    "sessionId": "090620261002094036531865681434",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### GET /transaction/reference/{response `reference`}: not found

Sent 2026-10-02 09:41:07 UTC, answered in 0.21 s.

```http
GET /api/dev/transaction/reference/Aq3QKQTXsU98QZpzee6FUbT4ygffK6bxqlRG
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 09:41:07 GMT
content-type: application/json; charset=utf-8
content-length: 167
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a7-lfucfZTsYkVEFaifJpZTcF5Dzh0"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T09:41:07.895Z",
  "message": [
    "Transaction not found!"
  ],
  "path": "/api/dev/transaction/reference/Aq3QKQTXsU98QZpzee6FUbT4ygffK6bxqlRG"
}
```

#### GET /transaction/reference/{response `customerReference`}

Sent 2026-10-02 09:41:07 UTC, answered in 0.22 s.

```http
GET /api/dev/transaction/reference/23f77125-eac0-4e73-bb83-8562ccdfddb9
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:08 GMT
content-type: application/json; charset=utf-8
content-length: 756
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2f4-1E8FN+kYIDkL7fWS+Z5o//JjJJM"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "02271ab1-413f-45d0-905b-c6c62a16d77a",
    "createdAt": "2026-10-02T09:40:36.779Z",
    "updatedAt": "2026-10-02T09:40:36.792Z",
    "amount": "300.00",
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "23f77125-eac0-4e73-bb83-8562ccdfddb9",
    "CustomerReference": "OPS02R-W2W-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "OPS-02 rerun WAWU to A",
    "currency": "NGN",
    "TransRef": null,
    "status": "SUCCESS",
    "recipientDetails": "Ada Sandbox 1154079370",
    "senderDetails": "Test Account4 1102038668",
    "senderBank": "Loma Bank",
    "receiverBank": "Loma Bank",
    "reason": null,
    "sessionId": "090620261002094036531865681434",
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- Works with Fintava's `reference` (a uuid) from a history row.
- Unknown reference: **`404 ["Transaction not found!"]`**.
- The record has fewer fields than the by-id lookup: no `source`,
  `destination`, `customer`, `platformComm`, `merchantComm` or `lomaCharge`.
  It adds `amountPayable`, `isRefundable`, `isAcknowledged`, `currency`
  ("NGN"), `reason`, `metaData`, `settlementStatus`, `settlementSession`.
- Whether this path also finds a transaction by **our** `CustomerReference`
  is still unknown: no transfer could be made to test it (README.md, "The
  blocker"). Until it is known, store Fintava's `reference` from every
  response.
- Not gated by merchant status; not cached as far as seen (one read each).

### Requests and responses

#### GET /transaction/reference/{reference}

Sent 2026-10-02 08:37:36 UTC, answered in 0.45 s.

```http
GET /api/dev/transaction/reference/1500fb0f-c8d0-4a6e-9433-6683b2ea919f
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:37:36 GMT
content-type: application/json; charset=utf-8
content-length: 701
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2bd-NEYz69VBA8ybeQUM4ORvBn8YArY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "fc163c4e-602f-4ae2-90d9-21960fa18c68",
    "createdAt": "2026-10-02T08:32:00.050Z",
    "updatedAt": "2026-10-02T08:32:00.050Z",
    "amount": "5.00",
    "amountPayable": null,
    "transType": "BVNCHARGE",
    "entry": "DEBIT",
    "reference": "1500fb0f-c8d0-4a6e-9433-6683b2ea919f",
    "CustomerReference": null,
    "isRefundable": null,
    "isAcknowledged": false,
    "narration": "Compliance charges (BVNCHARGE)",
    "currency": "NGN",
    "TransRef": null,
    "status": "SUCCESS",
    "recipientDetails": "Compliance account",
    "senderDetails": "customer",
    "senderBank": "Loma Bank",
    "receiverBank": "Loma Bank",
    "reason": null,
    "sessionId": null,
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma"
  },
  "status": 200,
  "message": "successful"
}
```

#### Unknown reference

Sent 2026-10-02 08:29:17 UTC, answered in 0.21 s.

```http
GET /api/dev/transaction/reference/OPS02-does-not-exist
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:29:17 GMT
content-type: application/json; charset=utf-8
content-length: 151
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"97-Os0YcGPCQJEQlsRW9zVOYdaN5ow"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:29:17.329Z",
  "message": [
    "Transaction not found!"
  ],
  "path": "/api/dev/transaction/reference/OPS02-does-not-exist"
}
```
