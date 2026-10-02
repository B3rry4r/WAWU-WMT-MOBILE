# POST /billing/electricity

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 11 (electricity: pay).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran: HTTP 400 "Unable to find customers"; purchase NOT RUN to a result**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN: HTTP 403** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Past the merchant gate, refused with `400 ["Unable to find customers"]`,
  the same answer as every bank send and the airtime and data purchases
  (`14-bank-transfer.md`). Nothing was debited and no record was written.
  The made-up meter was not the reason: the same error comes back for
  airtime, which has no meter.
- Still unknown: the purchase response (token and units), the ₦100 fee,
  and the debit from WAWU's merchant wallet. Unblocked by the same fix as
  bank sends (question 17 in `README.md`), plus a test meter number.

### Requests and responses

#### POST /billing/electricity, ₦500 AEDC prepaid, made-up meter

Sent 2026-10-02 09:43:03 UTC, answered in 0.30 s.

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

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:43:04 GMT
content-type: application/json; charset=utf-8
content-length: 130
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"82-di4KFanOOP2ZXGe+LfIhD9VWEqI"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:43:04.148Z",
  "message": [
    "Unable to find customers"
  ],
  "path": "/api/dev/billing/electricity"
}
```

#### Merchant balance after the bill attempts: unchanged

Sent 2026-10-02 09:43:04 UTC, answered in 0.28 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:43:04 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-IxjeQ8xow0/xNoXWICalzGWIIzg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49665,
      "availableBalance": 49665
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

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Tried ₦500 to AEDC prepaid (the made-up meter). Refused before validation.
- Still unknown: whether the purchase response carries the token and units
  (the transaction record has a `metertoken` field, `12-transaction-by-id.md`),
  the ₦100 fee, and the fact that it debits WAWU's merchant wallet (the call
  takes no customer, so it can only be the merchant's).

### Requests and responses

#### POST /billing/electricity, ₦500

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
