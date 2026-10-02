# GET /merchant/balance: WAWU's balance

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: merchant balance (OPS-02 prompt).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **ran, HTTP 200** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Same shape and `TIER_3`. Every merchant balance read in this run, in
  order (the requests and responses are in the files named):

| Time (UTC) | After | Balance (₦) | File |
|---|---|---|---|
| 09:39:45 | start | 49960 | below |
| 09:40:18 | two customers created | 49960 | `07-` |
| 09:40:30 | BVN check | 49955 | `04-` |
| 09:40:36 | ₦300 to customer A | 49655 | `13-` |
| 09:40:49 | A to B (no merchant part) | 49655 | `13-` |
| 09:40:59 | ₦10 from customer A | 49665 | `13-` |
| 09:41:37 to 09:42:10 | three refused bank sends | 49665 | `14-` |
| 09:42:49 to 09:43:04 | refused bill purchases | 49665 | `18-` to `20-` |
| 09:43:23 | phone check | 49660 | `06-` |
| 09:43:35 | selfie check | 49650 | `05-` |
| 10:18:42 | re-check | 49650 | `14-` |

- **The books balance**: WAWU ₦49,650 + customer A ₦250 + customer B ₦40 =
  ₦49,940 = ₦49,960 minus ₦20 of compliance charges. Money moved between
  wallets lost nothing to fees.

### Requests and responses

#### GET /merchant/balance at the start (also saved in `07-`)

Sent 2026-10-02 09:39:45 UTC, answered in 1.45 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:39:46 GMT
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

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

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

### Requests and responses

#### Before any call that costs money

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

#### After the first phone checks and selfie

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

#### End of the task

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
