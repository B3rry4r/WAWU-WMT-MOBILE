# POST /create/customer: open a wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 2 (create a customer with BVN, NIN and address). Result: **NOT RUN to a result: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- Sent with every field the docs require: fake name, a test phone (last 4
  `0101`), an `example.com` email, `STATIC_FUND`, an address, a date of birth
  and the documented example BVN (last 4 `8901`) as both BVN and NIN.
- Because the gate runs before validation, this call could not tell us
  whether the sandbox accepts these test identity values, which tier the new
  wallet gets, whether the response shows the tier, or whether a duplicate
  phone, email or BVN is refused.
- The customer reads are gated too: `GET /customers/list`, `GET
  /customers/details?phone=` and `GET /customers/{id}` all answer 403.
- No customer was created in this task (0 of the allowed 3).

## Requests and responses

### POST /create/customer

Sent 2026-10-02 08:28:56 UTC, answered in 0.24 s.

```http
POST /api/dev/create/customer
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "firstName": "Ada",
  "lastName": "Sandbox",
  "phoneNumber": "*******0101",
  "email": "***@example.com",
  "fundingMethod": "STATIC_FUND",
  "address": "1 Test Street, Ikeja, Lagos",
  "dateOfBirth": "1992-10-04",
  "bvn": "*******8901",
  "nin": "*******8901"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:28:57 GMT
content-type: application/json; charset=utf-8
content-length: 124
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"7c-OKzvv71trRaiFM4fP6RxtION+0Y"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:28:57.131Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/create/customer"
}
```

### GET /customers/list

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

### GET /customers/details

Sent 2026-10-02 08:29:15 UTC, answered in 0.21 s.

```http
GET /api/dev/customers/details?phone=*******0101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:29:16 GMT
content-type: application/json; charset=utf-8
content-length: 144
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"90-rvEI0TPhSqRGhSSNHYDiONwvqL0"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:29:16.129Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customers/details?phone=*******0101"
}
```

### GET /customers/{customerId}

Sent 2026-10-02 08:29:16 UTC, answered in 0.18 s.

```http
GET /api/dev/customers/00000000-0000-0000-0000-000000000000
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:29:16 GMT
content-type: application/json; charset=utf-8
content-length: 155
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"9b-vPKhi8M/2I3FI1v1uGF8+HQeS4Y"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:29:16.353Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customers/00000000-0000-0000-0000-000000000000"
}
```
