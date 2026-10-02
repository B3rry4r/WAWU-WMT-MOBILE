# GET /name/enquiry: account name at another bank

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 6 (account name, another bank).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200, unchanged**.
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

- Same stub answer: `0123456789` at GTBank (`000013`) is `SIMI MICHELLE`,
  `responseCode: "00"`. 0.24 s this time (1.16 s on the first call of the
  first run). Free.
- A name match here does **not** mean a bank send to that account will work:
  every bank send to this same stub was refused with `400 ["Unable to find
  customers"]` (`14-bank-transfer.md`).

### Requests and responses

#### GET /name/enquiry (sandbox stub account)

Sent 2026-10-02 09:43:14 UTC, answered in 0.24 s.

```http
GET /api/dev/name/enquiry?accountNumber=0123456789&sortCode=000013
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:43:15 GMT
content-type: application/json; charset=utf-8
content-length: 190
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"be-HE0j0+7rjpKG54EHUAFVN2UNpeA"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "status": true,
    "account": {
      "bankCode": "000013",
      "accountName": "SIMI MICHELLE",
      "accountNumber": "0123456789",
      "responseCode": "00"
    }
  },
  "status": 200,
  "message": "Bank details search completed"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- The sandbox answers with a stub name: account `0123456789` at GTBank
  (`000013`) came back as `SIMI MICHELLE`. It is a sandbox stub, not a real
  account.
- Response shape (undocumented until now): `data.status` (boolean) and
  `data.account { bankCode, accountName, accountNumber, responseCode }`,
  with `responseCode: "00"` for a match; top-level `message: "Bank details
  search completed"`. Read `data.account.accountName`, and treat
  `data.status !== true` or a `responseCode` other than `"00"` as "no match".
- Took about 1.2 s (an upstream call). **Not charged**: the merchant balance
  was the same before and after (`25-compliance-charges.md`).
- Not blocked by the inactive merchant.

### Requests and responses

#### GET /name/enquiry

Sent 2026-10-02 08:28:46 UTC, answered in 1.16 s.

```http
GET /api/dev/name/enquiry?accountNumber=0123456789&sortCode=000013
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:48 GMT
content-type: application/json; charset=utf-8
content-length: 190
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"be-HE0j0+7rjpKG54EHUAFVN2UNpeA"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "status": true,
    "account": {
      "bankCode": "000013",
      "accountName": "SIMI MICHELLE",
      "accountNumber": "0123456789",
      "responseCode": "00"
    }
  },
  "status": 200,
  "message": "Bank details search completed"
}
```

#### Repeat, between two balance reads (charge check)

Sent 2026-10-02 08:31:10 UTC, answered in 0.46 s.

```http
GET /api/dev/name/enquiry?accountNumber=0123456789&sortCode=000013
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:10 GMT
content-type: application/json; charset=utf-8
content-length: 190
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"be-HE0j0+7rjpKG54EHUAFVN2UNpeA"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "status": true,
    "account": {
      "bankCode": "000013",
      "accountName": "SIMI MICHELLE",
      "accountNumber": "0123456789",
      "responseCode": "00"
    }
  },
  "status": 200,
  "message": "Bank details search completed"
}
```
