# PATCH /customer/wallet/{walletId}/freeze and /unfreeze

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 12 (freeze and unfreeze). Result: **NOT RUN: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- No wallet exists to freeze. Both calls used an all-zero wallet id and were
  refused by the merchant gate before the id was looked up.
- Still unknown: the response shape, whether a frozen wallet can still
  receive money, and what a debit from a frozen wallet answers.

## Requests and responses

### PATCH .../freeze

Sent 2026-10-02 08:30:17 UTC, answered in 0.23 s.

```http
PATCH /api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/freeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "reason": "OPS-02 sandbox test"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:18 GMT
content-type: application/json; charset=utf-8
content-length: 168
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"a8-37zdEvfvWEBAqcyTddKumZ1BH/Q"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:18.156Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/freeze"
}
```

### PATCH .../unfreeze

Sent 2026-10-02 08:30:18 UTC, answered in 0.25 s.

```http
PATCH /api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/unfreeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:18 GMT
content-type: application/json; charset=utf-8
content-length: 170
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"aa-EbI8+/bc3eNg6ySW0n2SWN1hjGY"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:18.466Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/unfreeze"
}
```
