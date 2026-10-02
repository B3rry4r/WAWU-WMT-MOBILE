# GET /loma-name/enquiry: account name of a Fintava wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 6 (account name, at Fintava).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200 for a customer wallet, HTTP 400 for an unknown account**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **ran, HTTP 200** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Works for a customer wallet: test customer A's new account `1154079370`
  came back as `Ada Sandbox` (first name and last name, the wallet's
  `accountName`). Same shape as for the merchant: `data { accountNumber,
  accountName }`, `message: "Account number search completed"`.
- **An account that does not exist is a 400 with a leaked JavaScript error**:
  `["Cannot read properties of undefined (reading 'accountName')"]`. This
  answers the first run's open point. MONEY-06 must treat any 400 here as
  "no such WAWU account", and never show the message to a user.
- Free.

### Requests and responses

#### GET /loma-name/enquiry, test customer A's wallet

Sent 2026-10-02 09:40:27 UTC, answered in 0.29 s.

```http
GET /api/dev/loma-name/enquiry?accountNumber=1154079370
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:27 GMT
content-type: application/json; charset=utf-8
content-length: 124
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7c-j+bU12ZjrjPns4xh5jm7mkgoc40"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "accountNumber": "1154079370",
    "accountName": "Ada Sandbox"
  },
  "status": 200,
  "message": "Account number search completed"
}
```

#### GET /loma-name/enquiry, an account that does not exist

Sent 2026-10-02 09:47:09 UTC, answered in 0.96 s.

```http
GET /api/dev/loma-name/enquiry?accountNumber=1100000000
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:47:10 GMT
content-type: application/json; charset=utf-8
content-length: 188
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"bc-VlYzPwEZRhhiuXU6EcJwfgsszN8"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:47:10.202Z",
  "message": [
    "Cannot read properties of undefined (reading 'accountName')"
  ],
  "path": "/api/dev/loma-name/enquiry?accountNumber=1100000000"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- Looked up WAWU's own merchant account `1102038668` (sandbox), name `Test
  Account4`. No customer wallet exists yet to look up (README.md, "The blocker").
- Response: `data { accountNumber, accountName }`, `message: "Account number
  search completed"`. No bank code, no wallet id, no customer id, no frozen
  flag: a name check only.
- Not charged, not blocked by the inactive merchant.
- Still unknown: the answer for an account number that does not exist.

### Requests and responses

#### GET /loma-name/enquiry

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

#### Repeat, between two balance reads (charge check)

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
