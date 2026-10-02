# POST /billing/airtime

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 11 (airtime).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran: HTTP 400 for ₦50 (minimum ₦100), HTTP 400 "Unable to find customers" for ₦100**.
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

- **Airtime has a ₦100 minimum**: ₦50 answers `400 ["Airtime amount is
  less than 100"]`. The docs do not say so. The app must not offer less.
- ₦100 then gets `400 ["Unable to find customers"]`, like the bank sends
  (`14-bank-transfer.md`). Nothing was debited either time.
- Still unknown: the response, the fee (₦0 in `fees.md`) and the debit from
  WAWU's merchant wallet. Whether the network name `9MOBILE` works here
  (the data list needs `ETISALAT`) was not tried, as no purchase gets far
  enough to tell.

### Requests and responses

#### POST /billing/airtime, ₦50

Sent 2026-10-02 09:42:49 UTC, answered in 0.50 s.

```http
POST /api/dev/billing/airtime
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "vtu_network": "MTN",
  "vtu_amount": 50,
  "vtu_number": "*******0101"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:42:49 GMT
content-type: application/json; charset=utf-8
content-length: 133
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"85-SUiPKRzaWPDuj036C84ogPfYmpQ"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:42:49.572Z",
  "message": [
    "Airtime amount is less than 100"
  ],
  "path": "/api/dev/billing/airtime"
}
```

#### Merchant balance after: unchanged

Sent 2026-10-02 09:42:49 UTC, answered in 0.27 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:49 GMT
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

#### POST /billing/airtime, ₦100

Sent 2026-10-02 09:42:56 UTC, answered in 0.55 s.

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

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:42:56 GMT
content-type: application/json; charset=utf-8
content-length: 126
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7e-AqUPmMmCXddL6e6wt4ckjywNX48"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:42:56.946Z",
  "message": [
    "Unable to find customers"
  ],
  "path": "/api/dev/billing/airtime"
}
```

#### Merchant balance after: unchanged

Sent 2026-10-02 09:42:56 UTC, answered in 0.22 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:57 GMT
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
- Tried ₦100 MTN to a test number ending `0101`.
- Still unknown: response shape, fee (₦0 in `fees.md`), and confirmation that
  it debits WAWU's merchant wallet.

### Requests and responses

#### POST /billing/airtime, ₦100

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
