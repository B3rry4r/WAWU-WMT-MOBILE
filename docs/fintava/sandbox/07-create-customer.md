# POST /create/customer: open a wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 2 (create a customer with BVN, NIN and address).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran: HTTP 201, two test customers created**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN to a result: HTTP 403** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- **The merchant is active.** The first call at 09:39:46 got past the
  merchant gate. The merchant record (`12-transaction-by-id.md`) now shows
  `status: "active"`, last updated `2026-10-02T09:22:24.993Z`.
- **403 does not only mean "merchant inactive".** The first attempt used the
  documented example value (last 4 `8901`) as both BVN and NIN and got `403
  ["This NIN is blacklisted", "please contact support for assistance."]`.
  MONEY-06 must read the message, not the code.
- **Validation** (empty body, 400, nested shape): `firstName`, `lastName`,
  `phoneNumber` (must be a valid phone number), `email`, `fundingMethod`
  ("Invalid funding method"), `bvn` (11 characters, a number string, not
  empty), `dateOfBirth` (ISO 8601), `address`. **`nin` is not validated**
  although the docs mark it required.
- **Success is HTTP 201**, body `status: 201`, `message: "User created
  successfully"` (the docs show 200 and "successful"). Accept 201 as well
  as 200 here; for purchases a 2xx alone proves nothing
  (`21-bills-cable.md`).
- Response: `data.userInfo { firstName, lastName, phoneNumber, roles:
  ["USER"], userType: "CUSTOMER", address, bvn, dateOfBirth, nin, id,
  createdAt, updatedAt, twoFA }` and `data.wallet { id, accountNumber,
  accountName, isFrozen, status, fundMethod }`. The account number is there
  straight away. **`nin` comes back `null`** although one was sent (last 4
  `0003`), on create and on every read. Whether Fintava stored it is
  unknown. **No tier in the create response.**
- **The new wallets are `TIER_2`.** Not in the create response, but in
  `wallet.tier` on `GET /customers/list` and `GET /customers/{id}`, and in
  `data.tier` on the wallet balance (`08-wallet-balance.md`). Opened with
  BVN, NIN and address, and no selfie. Each record also shows
  `approvalStatus: "PENDING"` and `kycComplianceIndicator: "NOT_STARTED"`.
- **The sandbox does not check the BVN or refuse a repeat.** The BVN check
  says the example BVN does not exist (`04-bvn-check.md`), yet create
  accepted it, and accepted the same BVN and NIN again for customer B.
  Duplicate phone or email: NOT RUN (if accepted it would have made a
  third customer; the task allows two).
- **Not charged**: merchant balance 49960 before and after both creates,
  although the merchant settings say `KycFee: "50.00"` (with `DebitKycFee:
  false`).
- **Four different ids** for one customer: `userInfo.id` (the customerId:
  `/customers/{id}`, `/txn?customerId=`, the bank-send `sourceId`); the
  record `id` in the list and details responses (a different uuid: as a
  `sourceId` it answers `404 "No wallet exists for the customer"`,
  `14-bank-transfer.md`); `wallet.id` (balance, freeze); and
  `wallet.tagpayCustomerId`, which is what transfer responses call
  `source_customer_id` (`13-wallet-to-wallet.md`). The wallet also has
  `tagpayWalletId` (equal to the account number), `currency: "NGN"`,
  `serviceProvider: "loma"`.
- `GET /customers/details?phone=` takes the local format (`080...`) and
  returns the record without the wallet. `GET /customers/{id}` takes the
  customerId and returns the record with the wallet. The list is paged
  (`meta`) and newest first.
- Created (sandbox, kept for later runs):

| | customerId (`userInfo.id`) | walletId | account | phone, BVN (last 4) |
|---|---|---|---|---|
| A, Ada Sandbox | `4e8409cf-1234-40f7-963a-5c212c7a9836` | `3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7` | `1154079370` | `0101`, `8901` |
| B, Bayo Sandbox | `3c672d13-cc4f-4200-bf13-038f21aab06a` | `bd656a80-6984-4832-9a06-a858f249aec6` | `1151496137` | `0202`, `8901` |

### Requests and responses

#### Merchant balance before anything (₦49,960)

Sent 2026-10-02 09:39:45 UTC, answered in 1.45 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:39:46 GMT
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

#### POST /create/customer, documented example as BVN and NIN: NIN blacklisted

Sent 2026-10-02 09:39:46 UTC, answered in 0.27 s.

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
date: Fri, 02 Oct 2026 09:39:46 GMT
content-type: application/json; charset=utf-8
content-length: 166
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"a6-AIqwZxQCvq0dCwksv4LtcHBno+g"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T09:39:46.851Z",
  "message": [
    "This NIN is blacklisted",
    "please contact support for assistance."
  ],
  "path": "/api/dev/create/customer"
}
```

#### POST /create/customer with an empty body (validation)

Sent 2026-10-02 09:40:02 UTC, answered in 0.55 s.

```http
POST /api/dev/create/customer
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:40:03 GMT
content-type: application/json; charset=utf-8
content-length: 495
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"1ef-953XRCjd8mgf8B7wC8KWtfcc8o4"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:40:03.579Z",
  "message": {
    "statusCode": 400,
    "message": [
      "firstName should not be empty",
      "lastName should not be empty",
      "phoneNumber must be a valid phone number",
      "email must be an email",
      "Invalid funding method",
      "bvn must be longer than or equal to 11 characters",
      "bvn must be a number string",
      "bvn should not be empty",
      "dateOfBirth must be a valid ISO 8601 date string",
      "address should not be empty"
    ],
    "error": "Bad Request"
  },
  "path": "/api/dev/create/customer"
}
```

#### POST /create/customer, customer A (NIN last 4 `0003`)

Sent 2026-10-02 09:40:03 UTC, answered in 0.54 s.

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
  "nin": "*******0003"
}
```

**Response: HTTP 201**

```http
HTTP/2 201 
date: Fri, 02 Oct 2026 09:40:04 GMT
content-type: application/json; charset=utf-8
content-length: 588
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"24c-MTJz4Ofasq5MK2hMgrmziN3HLfA"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "userInfo": {
      "firstName": "Ada",
      "lastName": "Sandbox",
      "phoneNumber": "*******0101",
      "roles": [
        "USER"
      ],
      "userType": "CUSTOMER",
      "address": "1 Test Street, Ikeja, Lagos",
      "bvn": "*******8901",
      "dateOfBirth": "1992-10-04",
      "nin": null,
      "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
      "createdAt": "2026-10-02T09:40:03.904Z",
      "updatedAt": "2026-10-02T09:40:03.904Z",
      "twoFA": false
    },
    "wallet": {
      "id": "3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7",
      "accountNumber": "1154079370",
      "accountName": "Ada Sandbox",
      "isFrozen": false,
      "status": "active",
      "fundMethod": "STATIC_FUND"
    }
  },
  "status": 201,
  "message": "User created successfully"
}
```

#### POST /create/customer, customer B with A's BVN and NIN

Sent 2026-10-02 09:40:11 UTC, answered in 0.47 s.

```http
POST /api/dev/create/customer
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "firstName": "Bayo",
  "lastName": "Sandbox",
  "phoneNumber": "*******0202",
  "email": "***@example.com",
  "fundingMethod": "STATIC_FUND",
  "address": "2 Test Street, Yaba, Lagos",
  "dateOfBirth": "1990-01-15",
  "bvn": "*******8901",
  "nin": "*******0003"
}
```

**Response: HTTP 201**

```http
HTTP/2 201 
date: Fri, 02 Oct 2026 09:40:11 GMT
content-type: application/json; charset=utf-8
content-length: 589
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"24d-GdCjtdm9U9iHjKXtMPQDCEe2Jp0"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "userInfo": {
      "firstName": "Bayo",
      "lastName": "Sandbox",
      "phoneNumber": "*******0202",
      "roles": [
        "USER"
      ],
      "userType": "CUSTOMER",
      "address": "2 Test Street, Yaba, Lagos",
      "bvn": "*******8901",
      "dateOfBirth": "1990-01-15",
      "nin": null,
      "id": "3c672d13-cc4f-4200-bf13-038f21aab06a",
      "createdAt": "2026-10-02T09:40:11.634Z",
      "updatedAt": "2026-10-02T09:40:11.634Z",
      "twoFA": false
    },
    "wallet": {
      "id": "bd656a80-6984-4832-9a06-a858f249aec6",
      "accountNumber": "1151496137",
      "accountName": "Bayo Sandbox",
      "isFrozen": false,
      "status": "active",
      "fundMethod": "STATIC_FUND"
    }
  },
  "status": 201,
  "message": "User created successfully"
}
```

#### Merchant balance after both: unchanged

Sent 2026-10-02 09:40:18 UTC, answered in 0.36 s.

```http
GET /api/dev/merchant/balance
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:18 GMT
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

#### GET /customers/list

Sent 2026-10-02 09:40:18 UTC, answered in 0.43 s.

```http
GET /api/dev/customers/list?page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:19 GMT
content-type: application/json; charset=utf-8
content-length: 2497
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"9c1-wOI4qX8AHmPdDELgM6TCqKsJg0c"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "b510bd5f-5328-4727-9c9f-2e5c77cdf06f",
      "createdAt": "2026-10-02T09:40:11.634Z",
      "updatedAt": "2026-10-02T09:40:11.634Z",
      "phone": "*******0202",
      "email": "***@example.com",
      "customerType": "INDIVIDUAL",
      "approvalStatus": "PENDING",
      "approvalAt": null,
      "rejectedAt": null,
      "kycComplianceIndicator": "NOT_STARTED",
      "userInfo": {
        "id": "3c672d13-cc4f-4200-bf13-038f21aab06a",
        "createdAt": "2026-10-02T09:40:11.634Z",
        "updatedAt": "2026-10-02T09:40:11.634Z",
        "firstName": "Bayo",
        "lastName": "Sandbox",
        "phoneNumber": "*******0202",
        "bvn": "*******8901",
        "dateOfBirth": "1990-01-15",
        "address": "2 Test Street, Yaba, Lagos",
        "roles": [
          "USER"
        ],
        "userType": "CUSTOMER",
        "nin": null,
        "twoFA": false,
        "wallet": {
          "id": "bd656a80-6984-4832-9a06-a858f249aec6",
          "createdAt": "2026-10-02T09:40:11.634Z",
          "updatedAt": "2026-10-02T09:40:11.634Z",
          "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
          "accountNumber": "1151496137",
          "accountName": "Bayo Sandbox",
          "isFrozen": false,
          "status": "active",
          "fundMethod": "STATIC_FUND",
          "tagpayCustomerId": "18e44202-924a-4d6e-a03a-87caa0e0c512",
          "tagpayWalletId": "1151496137",
          "currency": "NGN",
          "serviceProvider": "loma",
          "tier": "TIER_2"
        }
      },
      "businessInformation": null,
      "reasonForRejection": null
    },
    {
      "id": "a4d75fbd-0262-44b0-873c-022fbf309d7b",
      "createdAt": "2026-10-02T09:40:03.904Z",
      "updatedAt": "2026-10-02T09:40:03.904Z",
      "phone": "*******0101",
      "email": "***@example.com",
      "customerType": "INDIVIDUAL",
      "approvalStatus": "PENDING",
      "approvalAt": null,
      "rejectedAt": null,
      "kycComplianceIndicator": "NOT_STARTED",
      "userInfo": {
        "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
        "createdAt": "2026-10-02T09:40:03.904Z",
        "updatedAt": "2026-10-02T09:40:03.904Z",
        "firstName": "Ada",
        "lastName": "Sandbox",
        "phoneNumber": "*******0101",
        "bvn": "*******8901",
        "dateOfBirth": "1992-10-04",
        "address": "1 Test Street, Ikeja, Lagos",
        "roles": [
          "USER"
        ],
        "userType": "CUSTOMER",
        "nin": null,
        "twoFA": false,
        "wallet": {
          "id": "3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7",
          "createdAt": "2026-10-02T09:40:03.904Z",
          "updatedAt": "2026-10-02T09:40:03.904Z",
          "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
          "accountNumber": "1154079370",
          "accountName": "Ada Sandbox",
          "isFrozen": false,
          "status": "active",
          "fundMethod": "STATIC_FUND",
          "tagpayCustomerId": "aec1ceef-e774-4427-9456-00b585fe8999",
          "tagpayWalletId": "1154079370",
          "currency": "NGN",
          "serviceProvider": "loma",
          "tier": "TIER_2"
        }
      },
      "businessInformation": null,
      "reasonForRejection": null
    }
  ],
  "meta": {
    "page": "1",
    "take": "10",
    "itemCount": 2,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "message": "Merchant customers list fetched",
  "status": 200
}
```

#### GET /customers/details?phone=

Sent 2026-10-02 09:40:19 UTC, answered in 0.25 s.

```http
GET /api/dev/customers/details?phone=*******0101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:19 GMT
content-type: application/json; charset=utf-8
content-length: 730
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"2da-Ua6R7wVaDKWMOFct1/YigdleDhQ"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "a4d75fbd-0262-44b0-873c-022fbf309d7b",
    "createdAt": "2026-10-02T09:40:03.904Z",
    "updatedAt": "2026-10-02T09:40:03.904Z",
    "phone": "*******0101",
    "email": "***@example.com",
    "customerType": "INDIVIDUAL",
    "approvalStatus": "PENDING",
    "approvalAt": null,
    "rejectedAt": null,
    "kycComplianceIndicator": "NOT_STARTED",
    "userInfo": {
      "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
      "createdAt": "2026-10-02T09:40:03.904Z",
      "updatedAt": "2026-10-02T09:40:03.904Z",
      "firstName": "Ada",
      "lastName": "Sandbox",
      "phoneNumber": "*******0101",
      "bvn": "*******8901",
      "dateOfBirth": "1992-10-04",
      "address": "1 Test Street, Ikeja, Lagos",
      "roles": [
        "USER"
      ],
      "userType": "CUSTOMER",
      "nin": null,
      "twoFA": false,
      "auth": null
    }
  },
  "status": 200,
  "message": "Customer record fetched"
}
```

#### GET /customers/{customerId}

Sent 2026-10-02 09:40:19 UTC, answered in 0.22 s.

```http
GET /api/dev/customers/4e8409cf-1234-40f7-963a-5c212c7a9836
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:19 GMT
content-type: application/json; charset=utf-8
content-length: 1166
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"48e-KUvRYrA8khuzq0NMbWpdTCoE+hc"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "a4d75fbd-0262-44b0-873c-022fbf309d7b",
    "createdAt": "2026-10-02T09:40:03.904Z",
    "updatedAt": "2026-10-02T09:40:03.904Z",
    "phone": "*******0101",
    "email": "***@example.com",
    "customerType": "INDIVIDUAL",
    "approvalStatus": "PENDING",
    "approvalAt": null,
    "rejectedAt": null,
    "kycComplianceIndicator": "NOT_STARTED",
    "userInfo": {
      "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
      "createdAt": "2026-10-02T09:40:03.904Z",
      "updatedAt": "2026-10-02T09:40:03.904Z",
      "firstName": "Ada",
      "lastName": "Sandbox",
      "phoneNumber": "*******0101",
      "bvn": "*******8901",
      "dateOfBirth": "1992-10-04",
      "address": "1 Test Street, Ikeja, Lagos",
      "roles": [
        "USER"
      ],
      "userType": "CUSTOMER",
      "nin": null,
      "twoFA": false
    },
    "wallet": {
      "id": "3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7",
      "createdAt": "2026-10-02T09:40:03.904Z",
      "updatedAt": "2026-10-02T09:40:03.904Z",
      "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
      "accountNumber": "1154079370",
      "accountName": "Ada Sandbox",
      "isFrozen": false,
      "status": "active",
      "fundMethod": "STATIC_FUND",
      "tagpayCustomerId": "aec1ceef-e774-4427-9456-00b585fe8999",
      "tagpayWalletId": "1154079370",
      "currency": "NGN",
      "serviceProvider": "loma",
      "tier": "TIER_2"
    }
  },
  "status": 200,
  "message": "Customer record fetched"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

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

### Requests and responses

#### POST /create/customer

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

#### GET /customers/list

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

#### GET /customers/details

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

#### GET /customers/{customerId}

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
