# GET /compliance/verify/phone-number: check a phone number

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 1 (identity checks; listed in the OPS-02 prompt). Result: **ran, HTTP 400, and charged**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Every call came back `400 ["Phone Number not Found"]`: the first used the
  phone number in Fintava's own documentation example, the others an obvious
  test number ending `0101`. The success shape is still unseen.
- There were four phone checks in this task, all saved: two below, the third
  in `25-compliance-charges.md` (the charge test), and the fourth below
  (08:31:59, made during the cache test in `10-merchant-history.md`). The
  fourth is the ₦5 `BVNCHARGE` row created 08:32:00.050, transaction
  `fc163c4e-...`, the one looked up in `12-transaction-by-id.md`.
- **Charged ₦5 each time, including "not found"**, as a `BVNCHARGE` debit
  on WAWU's merchant wallet (`25-compliance-charges.md`). Four calls in this
  task cost ₦20.
- Takes about 3 s (upstream). Not blocked by the inactive merchant.
- The query parameter is `phone_number` in local format (`080...`).

## Requests and responses

### GET /compliance/verify/phone-number (documentation example number)

Sent 2026-10-02 08:28:43 UTC, answered in 3.10 s.

```http
GET /api/dev/compliance/verify/phone-number?phone_number=*******5863
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:28:46 GMT
content-type: application/json; charset=utf-8
content-length: 164
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a4-n2Nr7XqR25ebZq6loeF+ZsuQWZo"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:28:46.853Z",
  "message": [
    "Phone Number not Found"
  ],
  "path": "/api/dev/compliance/verify/phone-number?phone_number=*******5863"
}
```

### GET /compliance/verify/phone-number (test number)

Sent 2026-10-02 08:30:33 UTC, answered in 2.68 s.

```http
GET /api/dev/compliance/verify/phone-number?phone_number=*******0101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:30:36 GMT
content-type: application/json; charset=utf-8
content-length: 164
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a4-jYQQLNYjfYR5vdNan7ARbOpH3Bk"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:30:36.089Z",
  "message": [
    "Phone Number not Found"
  ],
  "path": "/api/dev/compliance/verify/phone-number?phone_number=*******0101"
}
```

### Fourth phone check (test number), during the cache test

Sent 2026-10-02 08:31:59 UTC, answered in 2.65 s.

```http
GET /api/dev/compliance/verify/phone-number?phone_number=*******0101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:32:02 GMT
content-type: application/json; charset=utf-8
content-length: 164
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"a4-IQnSS4DIFJe8RRAhnkU0Gy0kkyc"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:32:02.079Z",
  "message": [
    "Phone Number not Found"
  ],
  "path": "/api/dev/compliance/verify/phone-number?phone_number=*******0101"
}
```

### Merchant balance right after it: ₦49,960

Sent 2026-10-02 08:32:02 UTC, answered in 0.36 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:32:02 GMT
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
