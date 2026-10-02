# GET /merchant/balance: WAWU's balance

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: merchant balance (OPS-02 prompt). Result: **ran, HTTP 200**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Shape (undocumented until now): `data { accountName, accountNumber,
  balance { bookedBalance, availableBalance }, tier }`. Balances are
  **numbers** (49960), not strings.
- **The API does return a tier: `"tier": "TIER_3"`** for WAWU's merchant
  account. `naira-api.md` said the API has no tiers; corrected. Whether a
  customer wallet reports its tier the same way is unknown (no customer
  could be made).
- WAWU's sandbox merchant account is `1102038668`, "Test Account4" (sandbox
  values). It started with ₦50,000 and ended this task at ₦49,960: ₦40 of
  compliance charges, nothing else (`25-compliance-charges.md`).
- Works while the merchant is inactive.

## Requests and responses

### Before any call that costs money

Sent 2026-10-02 08:28:32 UTC, answered in 0.59 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:32 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-04T2I1OU9Z2Gc5Heb3PNFuPfi6c"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 50000,
      "availableBalance": 50000
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

### After the first phone checks and selfie

Sent 2026-10-02 08:30:55 UTC, answered in 0.66 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:30:55 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-uA1D+x6QjE70orm+/GFvm24fTv0"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49980,
      "availableBalance": 49980
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

### End of the task

Sent 2026-10-02 08:38:11 UTC, answered in 0.28 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:38:11 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-Q/2y/hlCqnAxRbME5j9O7sBjbEI"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49960,
      "availableBalance": 49960
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```
