# GET /customer/wallet/balance/{walletId}: customer balance

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 3 (get the balance). Result: **partly run: HTTP 400 for an unknown wallet**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- No customer wallet exists (README.md, "The blocker"), so only the
  "unknown wallet" answer was seen. It is **`400 ["Wallet not found"]`**, not
  the `404` the docs show. The client must treat this 400 as "no such
  wallet", not as a malformed request.
- Not gated by merchant status.
- WAWU's own balance (`GET /merchant/balance`) worked: `22-merchant-balance.md`.

## Requests and responses

### GET /customer/wallet/balance/{walletId} with an unknown id

Sent 2026-10-02 08:29:16 UTC, answered in 0.40 s.

```http
GET /api/dev/customer/wallet/balance/00000000-0000-0000-0000-000000000000
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:29:17 GMT
content-type: application/json; charset=utf-8
content-length: 163
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a3-A+8PaABdmotdnD5FTEa+51xeEpI"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:29:17.068Z",
  "message": [
    "Wallet not found"
  ],
  "path": "/api/dev/customer/wallet/balance/00000000-0000-0000-0000-000000000000"
}
```
