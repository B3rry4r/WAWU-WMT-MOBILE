# POST /billing/airtime

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 11 (airtime). Result: **NOT RUN: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Tried ₦100 MTN to a test number ending `0101`.
- Still unknown: response shape, fee (₦0 in `fees.md`), and confirmation that
  it debits WAWU's merchant wallet.

## Requests and responses

### POST /billing/airtime, ₦100

Sent 2026-10-02 08:29:45 UTC, answered in 0.21 s.

```http
POST /api/dev/billing/airtime
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "vtu_network": "MTN",
  "vtu_amount": 100,
  "vtu_number": "*******0101"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:29:45 GMT
content-type: application/json; charset=utf-8
content-length: 124
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7c-E39ftJe0IC30KmVKlTbxcVcObis"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:29:45.735Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/billing/airtime"
}
```
