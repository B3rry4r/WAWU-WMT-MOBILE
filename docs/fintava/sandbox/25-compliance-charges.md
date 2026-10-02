# What the checks cost (measured)

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: fees actually charged (OPS-02 prompt). Result: **ran**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Each call below was made once, with a merchant balance read before and
  after it. Results:

| Call | HTTP | Merchant balance after (₦) | Charged (₦) |
|---|---|---|---|
| (start) | | 49980 | |
| name-enquiry-external | 200 | 49980 | 0 |
| name-enquiry-internal | 200 | 49980 | 0 |
| phone-check | 400 | 49975 | 5 |
| bvn-selfie | 400 | 49965 | 10 |
| preview-meter | 400 | 49965 | 0 |
| bvn-check | 403 | 49965 | 0 |

- **Phone check: ₦5 per call. Selfie check: ₦10 per call (two ₦5 rows).
  Both are charged even when they fail.** Name enquiries (external and
  internal), meter preview and the gated BVN check cost nothing.
- Every charge appears in `/txn/merchant` as a ₦5 `BVNCHARGE` DEBIT,
  narration "Compliance charges (BVNCHARGE)", against WAWU's merchant wallet.
  Over the whole task: 4 phone checks and 2 selfies, 8 rows, ₦40, and the
  balance went from ₦50,000 to ₦49,960. The ledger and the balance agree.
- These are sandbox prices. The dashboard list in `fees.md` (BVN ₦60, NIN
  ₦70) is not contradicted, because the BVN and NIN checks never ran. The
  selfie and phone checks are not in that list at all, so their live price
  is still a question for Fintava. The merchant settings also show `KycFee:
  "50.00"` with `DebitKycFee: false` (`12-transaction-by-id.md`).

## Requests and responses

### Balance at the start

Sent 2026-10-02 08:31:09 UTC, answered in 0.57 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:10 GMT
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

### Phone check

Sent 2026-10-02 08:31:11 UTC, answered in 2.38 s.

```http
GET /api/dev/compliance/verify/phone-number?phone_number=*******0101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:31:13 GMT
content-type: application/json; charset=utf-8
content-length: 164
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a4-truy4bznqCCawHc/aIIoHI1PbZs"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:31:13.963Z",
  "message": [
    "Phone Number not Found"
  ],
  "path": "/api/dev/compliance/verify/phone-number?phone_number=*******0101"
}
```

### Balance after it

Sent 2026-10-02 08:31:13 UTC, answered in 0.31 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:14 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-/6vlY88PwhUfHI9iZUGK1i3X/LA"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49975,
      "availableBalance": 49975
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```

### Selfie check

Sent 2026-10-02 08:31:14 UTC, answered in 5.22 s.

```http
POST /api/dev/compliance/verify/bvn/selfie
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "bvn": "*******8901",
  "image": "<base64 PNG, 92 chars, 1x1 white pixel>"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:31:19 GMT
content-type: application/json; charset=utf-8
content-length: 150
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS, GET
etag: W/"96-UUfuDHxM2Hs1PC48aWeO8cchme0"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:31:19.497Z",
  "message": [
    "Request failed with status code 404"
  ],
  "path": "/api/dev/compliance/verify/bvn/selfie"
}
```

### Balance after it

Sent 2026-10-02 08:31:19 UTC, answered in 0.41 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:19 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-GtIRotvouo/bnZFZsjH+ze60Xjg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49965,
      "availableBalance": 49965
    },
    "tier": "TIER_3"
  },
  "status": 200,
  "message": "successful"
}
```
