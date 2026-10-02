# GET /txn?customerId=: customer history

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 4 (history for a customer). Result: **partly run: HTTP 404**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- No customer exists (README.md, "The blocker"). An unknown id answers
  `404 ["Customer not found"]`.
- The merchant's own administrator user (the `customer.id` Fintava attaches
  to WAWU's merchant transactions) is **also** "Customer not found" here: the
  merchant's admin user is not a customer, so `/txn` is for customer wallets
  only and WAWU's history comes from `/txn/merchant`.
- Not gated by merchant status. Shape of a real customer history: unseen.

## Requests and responses

### GET /txn with an unknown customerId

Sent 2026-10-02 08:29:16 UTC, answered in 0.23 s.

```http
GET /api/dev/txn?customerId=00000000-0000-0000-0000-000000000000&page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:29:16 GMT
content-type: application/json; charset=utf-8
content-length: 171
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"ab-S8C03keVRbs3QKC/LzvASBuq6ck"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:29:16.609Z",
  "message": [
    "Customer not found"
  ],
  "path": "/api/dev/txn?customerId=00000000-0000-0000-0000-000000000000&page=1&take=10"
}
```

### GET /txn with the merchant administrator's user id

Sent 2026-10-02 08:37:37 UTC, answered in 0.20 s.

```http
GET /api/dev/txn?customerId=a2162db5-0911-4786-8760-7b99f5d4a69a&page=1&take=30
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**

```http
HTTP/2 404 
date: Fri, 02 Oct 2026 08:37:37 GMT
content-type: application/json; charset=utf-8
content-length: 171
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"ab-yOVos6YZ7XIQaGOMpx5aTh4rvG4"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 404,
  "timestamp": "2026-10-02T08:37:37.380Z",
  "message": [
    "Customer not found"
  ],
  "path": "/api/dev/txn?customerId=a2162db5-0911-4786-8760-7b99f5d4a69a&page=1&take=30"
}
```
