# Authentication and error shapes

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: all calls (error handling for MONEY-06). Result: **ran**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- **No key: `401 ["API Key is required"]`. A wrong key is 400 or 404,
  depending on its shape**, never the documented 401:
  - a key without the `live_` prefix: `400 ["Invalid API key"]`;
  - a key **with** the `live_` prefix that Fintava does not recognise (which
    is what a revoked or rotated real key looks like): `404 ["Invalid API
    Key"]`, capital K.
  MONEY-06 must treat both as an authentication failure: match the message
  case-insensitively on "invalid api key" (and "api key is required"),
  whatever the status code, then alert and do not retry. It must never read
  that 404 as "not found" or that 400 as a bad request from the user.
- **Errors are not plain NestJS.** Two shapes were seen:
  - Business errors: `{ status, timestamp, message: [string], path }`.
    `message` is always an array, even for one message. There is no `error`
    and no `statusCode`.
  - Validation errors: `{ status, timestamp, message: { statusCode, message:
    [string], error }, path }`: the NestJS object is nested inside `message`.
  The client should read `status`, then take the text from `message` if it
  is an array or from `message.message` if it is an object.
- Status codes seen: 200, 400 (validation, wrong key without `live_`, wallet not found,
  upstream failures such as "Http Exception" and "Request failed with
  status code 404", "Phone Number not Found"), 401 (no key), 403 (merchant
  inactive), 404 (customer not found, transaction reference not found,
  unknown data provider, wrong key with `live_`).
- No rate-limit headers on any response (no `x-ratelimit-*`, no
  `retry-after`), and no 429 across about 100 calls in 10 minutes. Rate
  limits stay unknown.
- Responses come through Cloudflare from an Express app
  (`x-powered-by: Express`); `access-control-allow-origin: *`.

## Requests and responses

### No Authorization header

Sent 2026-10-02 08:30:43 UTC.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
```

**Response: HTTP 401**

```http
HTTP/2 401 
date: Fri, 02 Oct 2026 08:30:43 GMT
content-type: application/json; charset=utf-8
content-length: 122
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7a-N2eBbRBgkCBn090j+CpctxxPDQ4"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 401,
  "timestamp": "2026-10-02T08:30:43.533Z",
  "message": [
    "API Key is required"
  ],
  "path": "/api/dev/merchant/balance"
}
```

### Wrong key without the live_ prefix (08:30)

Sent 2026-10-02 08:30:43 UTC.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer *** (deliberately fake value without the live_ prefix, not the sandbox key)
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:30:44 GMT
content-type: application/json; charset=utf-8
content-length: 118
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"76-/ogE5jC26iNefyOW2EMcZN97VOc"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:30:44.006Z",
  "message": [
    "Invalid API key"
  ],
  "path": "/api/dev/merchant/balance"
}
```

### Wrong key without the live_ prefix (08:51, confirmation)

Sent 2026-10-02 08:51:41 UTC.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer *** (deliberately fake value without the live_ prefix, not the sandbox key)
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:51:41 GMT
content-type: application/json; charset=utf-8
content-length: 118
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"76-5QikDdb3aHl1poVh2s/KLBD7eFs"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:51:41.863Z",
  "message": [
    "Invalid API key"
  ],
  "path": "/api/dev/merchant/balance"
}
```

### Wrong key with the live_ prefix: 404

Sent 2026-10-02 08:51:41 UTC.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer *** (deliberately fake value starting with live_, not the sandbox key)
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:51:41 GMT
content-type: application/json; charset=utf-8
content-length: 118
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"76-bX0njlLW5R041U/sdmNoojiBhls"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:51:41.447Z",
  "message": [
    "Invalid API Key"
  ],
  "path": "/api/dev/merchant/balance"
}
```

### A validation error (nested shape)

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

### A business error (flat shape)

Sent 2026-10-02 08:28:33 UTC, answered in 0.20 s.

```http
GET /api/dev/customers/list?page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:28:33 GMT
content-type: application/json; charset=utf-8
content-length: 138
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"8a-OAOTkKtbtpwkzummew2xMeO3Z9Y"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:28:33.377Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customers/list?page=1&take=10"
}
```
