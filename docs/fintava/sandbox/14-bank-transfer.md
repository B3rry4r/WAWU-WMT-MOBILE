# POST /bank/credit and /bank/credit/merchant: send to a bank

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 7 (send to a bank: success, failure, reversal). Result: **NOT RUN: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

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

## Requests and responses

### POST /bank/credit, full body

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

### POST /bank/credit with only CustomerReference

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

### POST /bank/credit/merchant, ₦100

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
