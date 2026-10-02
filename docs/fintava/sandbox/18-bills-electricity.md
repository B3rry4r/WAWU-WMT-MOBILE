# POST /billing/electricity

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 11 (electricity: pay). Result: **NOT RUN: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Tried ₦500 to AEDC prepaid (the made-up meter). Refused before validation.
- Still unknown: whether the purchase response carries the token and units
  (the transaction record has a `metertoken` field, `12-transaction-by-id.md`),
  the ₦100 fee, and the fact that it debits WAWU's merchant wallet (the call
  takes no customer, so it can only be the merchant's).

## Requests and responses

### POST /billing/electricity, ₦500

Sent 2026-10-02 08:30:16 UTC, answered in 0.53 s.

```http
POST /api/dev/billing/electricity
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "meternumber": "1111111111111",
  "disco": "AEDC",
  "amount": 500,
  "planType": "prepaid"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:17 GMT
content-type: application/json; charset=utf-8
content-length: 128
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"80-J9nVGJFWVcAlQJqGZqhnC8+O/LQ"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:17.107Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/billing/electricity"
}
```
