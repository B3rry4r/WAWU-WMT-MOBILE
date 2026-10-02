# GET /compliance/verify/bvn: check a BVN

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 1 (check a BVN). Result: **NOT RUN to a result: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Sent with the example BVN printed on Fintava's own Verify BVN page
  (`reference/verify-bvn.md`, last 4 digits `8901`). No real person's BVN was
  used. Whether the sandbox accepts that value is still unknown.
- The BVN check is gated by merchant status, but the phone check and the
  selfie check are **not** (they ran, and were charged: `06-phone-check.md`,
  `05-bvn-selfie.md`). A 403 here was not charged.
- Response shape on success: still only Fintava's documented example.

## Requests and responses

### GET /compliance/verify/bvn

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

### Repeat, between two balance reads (charge check)

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
