# GET /loma-name/enquiry: account name of a Fintava wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 6 (account name, at Fintava). Result: **ran, HTTP 200**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Looked up WAWU's own merchant account `1102038668` (sandbox), name `Test
  Account4`. No customer wallet exists yet to look up (README.md, "The blocker").
- Response: `data { accountNumber, accountName }`, `message: "Account number
  search completed"`. No bank code, no wallet id, no customer id, no frozen
  flag: a name check only.
- Not charged, not blocked by the inactive merchant.
- Still unknown: the answer for an account number that does not exist.

## Requests and responses

### GET /loma-name/enquiry

Sent 2026-10-02 08:28:48 UTC, answered in 0.26 s.

```http
GET /api/dev/loma-name/enquiry?accountNumber=1102038668
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:48 GMT
content-type: application/json; charset=utf-8
content-length: 126
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7e-cE5896XAVOImvE6ekXcQap37dMg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountNumber": "1102038668",
    "accountName": "Test Account4"
  },
  "status": 200,
  "message": "Account number search completed"
}
```

### Repeat, between two balance reads (charge check)

Sent 2026-10-02 08:31:11 UTC, answered in 0.23 s.

```http
GET /api/dev/loma-name/enquiry?accountNumber=1102038668
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:11 GMT
content-type: application/json; charset=utf-8
content-length: 126
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7e-cE5896XAVOImvE6ekXcQap37dMg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountNumber": "1102038668",
    "accountName": "Test Account4"
  },
  "status": 200,
  "message": "Account number search completed"
}
```
