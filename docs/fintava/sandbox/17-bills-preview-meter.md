# POST /billing/preview-meter: name on the meter

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 11 (electricity: meter preview).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 400, unchanged**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **ran, HTTP 400** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Same answer for the made-up AEDC meter: `400 ["Http Exception"]`, free.
  The success shape still needs a meter number the sandbox knows (question
  11 in `README.md`).

### Requests and responses

#### POST /billing/preview-meter, made-up AEDC meter

Sent 2026-10-02 09:43:20 UTC, answered in 0.25 s.

```http
POST /api/dev/billing/preview-meter
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "meternumber": "1111111111111",
  "disco": "AEDC",
  "planType": "prepaid"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:43:20 GMT
content-type: application/json; charset=utf-8
content-length: 122
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7a-VenxESnzMI4tQYxaM3lYU4ymn8A"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:43:20.776Z",
  "message": [
    "Http Exception"
  ],
  "path": "/api/dev/billing/preview-meter"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- A made-up 13-digit meter number answered `400 ["Http Exception"]` for both
  AEDC and Ikeja: no useful message for the user. The app should say "We
  couldn't find that meter" for any 400 here.
- An empty body showed the validation: `meternumber` must be a number string
  and not empty, `disco` must be a non-empty string. **`planType` is not
  required** by validation.
- Not charged, not gated by merchant status. Success shape still unseen (no
  test meter number is published).
- Validation errors are wrapped differently from other errors (see
  `24-auth-and-errors.md`).

### Requests and responses

#### AEDC, made-up meter

Sent 2026-10-02 08:29:56 UTC, answered in 0.77 s.

```http
POST /api/dev/billing/preview-meter
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "meternumber": "1111111111111",
  "disco": "AEDC",
  "planType": "prepaid"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:29:57 GMT
content-type: application/json; charset=utf-8
content-length: 122
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7a-bFE3Ce22dZr9opFwwLpjGZpBC9M"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:29:57.562Z",
  "message": [
    "Http Exception"
  ],
  "path": "/api/dev/billing/preview-meter"
}
```

#### Ikeja, made-up meter

Sent 2026-10-02 08:30:04 UTC, answered in 0.44 s.

```http
POST /api/dev/billing/preview-meter
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "meternumber": "1111111111111",
  "disco": "Ikeja_Electric_Bill_Payment",
  "planType": "prepaid"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:30:05 GMT
content-type: application/json; charset=utf-8
content-length: 122
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7a-a0jUQF4TtlNwQRSwXJMR/VeCAs8"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:30:05.422Z",
  "message": [
    "Http Exception"
  ],
  "path": "/api/dev/billing/preview-meter"
}
```

#### Empty body

Sent 2026-10-02 08:30:05 UTC, answered in 0.28 s.

```http
POST /api/dev/billing/preview-meter
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:30:05 GMT
content-type: application/json; charset=utf-8
content-length: 281
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"119-svOACC/mDGLaqbE+x7gQ4lFl5LI"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:30:05.743Z",
  "message": {
    "statusCode": 400,
    "message": [
      "meternumber must be a number string",
      "meternumber should not be empty",
      "disco must be a string",
      "disco should not be empty"
    ],
    "error": "Bad Request"
  },
  "path": "/api/dev/billing/preview-meter"
}
```
