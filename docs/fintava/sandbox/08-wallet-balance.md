# GET /customer/wallet/balance/{walletId}: customer balance

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 3 (get the balance).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **partly run: HTTP 400 for an unknown wallet** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Shape: `data { balance { bookedBalance, availableBalance }, tier }`,
  `message: "Wallet details fetched"`. Balances are **numbers**. **The tier
  is in the response** (`TIER_2` for a new customer).
- A new wallet starts at 0. Every balance read in this run moved by exactly
  the amount sent (no fee was ever taken: `13-wallet-to-wallet.md`).
  Booked and available were always equal.
- Works on a frozen wallet (`15-freeze-unfreeze.md`).
- End of the run: A ₦250, B ₦40.

### Requests and responses

#### GET /customer/wallet/balance/{walletId}, customer A just opened

Sent 2026-10-02 09:40:19 UTC, answered in 0.33 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:20 GMT
content-type: application/json; charset=utf-8
content-length: 125
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7d-HtkrzMi1yptMKHGd4RIH0iQhspE"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 0,
      "availableBalance": 0
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### Customer A at the end of the transfers

Sent 2026-10-02 09:44:12 UTC, answered in 0.24 s.

```http
GET /api/dev/customer/wallet/balance/3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:12 GMT
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

- No customer wallet exists (README.md, "The blocker"), so only the
  "unknown wallet" answer was seen. It is **`400 ["Wallet not found"]`**, not
  the `404` the docs show. The client must treat this 400 as "no such
  wallet", not as a malformed request.
- Not gated by merchant status.
- WAWU's own balance (`GET /merchant/balance`) worked: `22-merchant-balance.md`.

### Requests and responses

#### GET /customer/wallet/balance/{walletId} with an unknown id

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
