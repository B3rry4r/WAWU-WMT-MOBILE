# POST /compliance/verify/bvn/selfie: selfie against the BVN photo

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 1 (selfie against the BVN). Result: **ran, HTTP 400, and charged**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Sent the documented example BVN (last 4 `8901`) with a 1x1 white PNG.
  Fintava answered `400` with `message: ["Request failed with status code
  404"]`, which is Fintava passing on its upstream provider's 404 (most
  likely "no BVN record"). The success shape is still undocumented and
  unseen.
- **It was charged even though it failed**: ₦10 per call, recorded on WAWU's
  merchant wallet as **two** ₦5 `BVNCHARGE` debits each time
  (`25-compliance-charges.md`). So every selfie attempt costs money,
  including retries after a bad photo. KYC-04 should limit retries and make
  sure the photo is usable before sending it.
- Not blocked by the inactive merchant (unlike the BVN check).
- Took 5 to 6 s. The app must show progress, and our client timeout must be
  well above that.
- Liveness: nothing in the request or response suggests one. Still a
  question for Fintava.

## Requests and responses

### POST /compliance/verify/bvn/selfie

Sent 2026-10-02 08:29:10 UTC, answered in 5.61 s.

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
date: Fri, 02 Oct 2026 08:29:15 GMT
content-type: application/json; charset=utf-8
content-length: 150
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS, GET
etag: W/"96-vcbTZ1hCfVntS5Plq0OSJaRLk80"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:29:15.880Z",
  "message": [
    "Request failed with status code 404"
  ],
  "path": "/api/dev/compliance/verify/bvn/selfie"
}
```

### Merchant balance just before the second selfie call

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

### Second selfie call

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

### Merchant balance just after: ₦10 lower

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
