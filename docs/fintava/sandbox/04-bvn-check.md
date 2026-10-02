# GET /compliance/verify/bvn: check a BVN

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 1 (check a BVN).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 400, and charged ₦5**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN to a result: HTTP 403** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- **The merchant gate is gone**: the call reached the BVN provider.
- The example BVN printed on Fintava's Verify BVN page (last 4 `8901`) is
  **not** a sandbox test identity: `400 ["Invalid BVN or BVN does not
  exist"]`, after 2.6 s (an upstream call). The success shape is still
  unseen; it needs a BVN the sandbox knows (question 11 in `README.md`).
- **Charged ₦5 even though it failed**: the merchant balance went from
  49960 to 49955, and `/txn/merchant` shows one ₦5 `BVNCHARGE` row created
  09:40:27.941 (`10-merchant-history.md`). The first run's "a 403 here was
  not charged" stays true; a check that reaches the provider is charged.
- `POST /create/customer` accepted this same BVN, twice
  (`07-create-customer.md`): opening a wallet does not run this check for
  us, so KYC-01 has to call it itself.

### Requests and responses

#### GET /compliance/verify/bvn (documented example BVN)

Sent 2026-10-02 09:40:27 UTC, answered in 2.60 s.

```http
GET /api/dev/compliance/verify/bvn?bvn=*******8901
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:40:30 GMT
content-type: application/json; charset=utf-8
content-length: 157
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"9d-z4hYPfXTkL/HL5YgFP10XdMJXvE"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:40:30.092Z",
  "message": [
    "Invalid BVN or BVN does not exist"
  ],
  "path": "/api/dev/compliance/verify/bvn?bvn=*******8901"
}
```

#### Merchant balance right after: ₦5 lower (49960 before, `22-merchant-balance.md`)

Sent 2026-10-02 09:40:30 UTC, answered in 0.27 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:30 GMT
content-type: application/json; charset=utf-8
content-length: 180
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b4-IKjY8U5HlLtSNqm25+GggyF6m74"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountName": "Test Account4",
    "accountNumber": "1102038668",
    "balance": {
      "bookedBalance": 49955,
      "availableBalance": 49955
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
- Sent with the example BVN printed on Fintava's own Verify BVN page
  (`reference/verify-bvn.md`, last 4 digits `8901`). No real person's BVN was
  used. Whether the sandbox accepts that value is still unknown.
- The BVN check is gated by merchant status, but the phone check and the
  selfie check are **not** (they ran, and were charged: `06-phone-check.md`,
  `05-bvn-selfie.md`). A 403 here was not charged.
- Response shape on success: still only Fintava's documented example.

### Requests and responses

#### GET /compliance/verify/bvn

Sent 2026-10-02 08:28:37 UTC, answered in 0.22 s.

```http
GET /api/dev/compliance/verify/bvn?bvn=*******8901
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:28:37 GMT
content-type: application/json; charset=utf-8
content-length: 146
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"92-PXDCdMPHKT7pQ8WGGaThNckTvpo"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:28:37.490Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/compliance/verify/bvn?bvn=*******8901"
}
```

#### Repeat, between two balance reads (charge check)

Sent 2026-10-02 08:31:20 UTC, answered in 0.21 s.

```http
GET /api/dev/compliance/verify/bvn?bvn=*******8901
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:31:20 GMT
content-type: application/json; charset=utf-8
content-length: 146
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"92-lk+zlK/wPkJ3oqOb5fPA88/7s28"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:31:20.707Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/compliance/verify/bvn?bvn=*******8901"
}
```
