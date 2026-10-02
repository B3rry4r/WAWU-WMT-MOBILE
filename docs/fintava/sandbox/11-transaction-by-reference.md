# GET /transaction/reference/{reference}

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 8 (look up a transaction by reference). Result: **ran, HTTP 200 and 404**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

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

## Requests and responses

### GET /transaction/reference/{reference}

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

### Unknown reference

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
