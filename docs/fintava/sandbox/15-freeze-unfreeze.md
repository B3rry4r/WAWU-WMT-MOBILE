# PATCH /customer/wallet/{walletId}/freeze and /unfreeze

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 12 (freeze and unfreeze).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200 both ways; a frozen wallet can neither send nor receive**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **NOT RUN: HTTP 403** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Freeze: `200`, `message: "Wallet frozen successfully"`, and the wallet
  back with `isFrozen: true` (`status` stays `"active"`) plus the embedded
  customer, **with BVN, date of birth and address** (masked below): another
  response the backend must not pass on or log raw.
- Unfreeze: `200`, `message: "Wallet unfrozen successfully"`,
  `isFrozen: false`. Neither call charged anything.
- **A frozen wallet cannot send and cannot receive.** Both directions
  answer `400 ["Kindly confirm both customer accounts are active"]`; nothing
  moved. Its balance can still be read, and `GET /customers/{id}` shows
  `isFrozen: true`.
- **Consequence for R-11 and R-17:** earnings and refunds sent to a frozen
  wallet are refused, not held. A fraud hold or the 30-day deletion window
  (if it freezes the wallet) has to keep the money in WAWU's merchant wallet
  and pay it once the wallet is unfrozen.
- After unfreezing, the send refused while frozen went through with the same
  reference (`OPS02R-W2W-005`).

### Requests and responses

#### PATCH /customer/wallet/{walletId}/freeze, customer B

Sent 2026-10-02 09:42:19 UTC, answered in 0.28 s.

```http
PATCH /api/dev/customer/wallet/bd656a80-6984-4832-9a06-a858f249aec6/freeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "reason": "OPS-02 sandbox test"
}
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:19 GMT
content-type: application/json; charset=utf-8
content-length: 864
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"360-lYiG7PNo5azBdGJOrUL6yhvm7Pg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "bd656a80-6984-4832-9a06-a858f249aec6",
    "createdAt": "2026-10-02T09:40:11.634Z",
    "updatedAt": "2026-10-02T09:42:19.721Z",
    "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
    "accountNumber": "1151496137",
    "accountName": "Bayo Sandbox",
    "isFrozen": true,
    "status": "active",
    "fundMethod": "STATIC_FUND",
    "tagpayCustomerId": "18e44202-924a-4d6e-a03a-87caa0e0c512",
    "tagpayWalletId": "1151496137",
    "currency": "NGN",
    "serviceProvider": "loma",
    "tier": "TIER_2",
    "customer": {
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
      "auth": null
    }
  },
  "status": 200,
  "message": "Wallet frozen successfully"
}
```

#### Frozen B sends ₦10 to A

Sent 2026-10-02 09:42:19 UTC, answered in 0.30 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1151496137",
  "receiverAccount": "1154079370",
  "amount": 10,
  "narration": "OPS-02 rerun B to A while B frozen",
  "CustomerReference": "OPS02R-W2W-005"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:42:20 GMT
content-type: application/json; charset=utf-8
content-length: 163
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"a3-ilF23y50uNs6pZPh/OHxEhddCbs"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:42:20.119Z",
  "message": [
    "Kindly confirm both customer accounts are active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### A sends ₦10 to frozen B

Sent 2026-10-02 09:42:20 UTC, answered in 0.33 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1154079370",
  "receiverAccount": "1151496137",
  "amount": 10,
  "narration": "OPS-02 rerun A to B while B frozen",
  "CustomerReference": "OPS02R-W2W-006"
}
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 09:42:20 GMT
content-type: application/json; charset=utf-8
content-length: 163
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"a3-fuEUo+pt32AH38N/wx+o7lo5wcU"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T09:42:20.523Z",
  "message": [
    "Kindly confirm both customer accounts are active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

#### Frozen B's balance: readable, unchanged

Sent 2026-10-02 09:42:20 UTC, answered in 0.22 s.

```http
GET /api/dev/customer/wallet/balance/bd656a80-6984-4832-9a06-a858f249aec6
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:20 GMT
content-type: application/json; charset=utf-8
content-length: 127
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7f-bypNIgbhBbnoyn9jYokoQdXH9bs"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 50,
      "availableBalance": 50
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

#### GET /customers/{customerId}, frozen B

Sent 2026-10-02 09:42:20 UTC, answered in 0.21 s.

```http
GET /api/dev/customers/3c672d13-cc4f-4200-bf13-038f21aab06a
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:21 GMT
content-type: application/json; charset=utf-8
content-length: 1167
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"48f-IVdoWQOEMNFTE2uF8uWc1SpweFI"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
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
      "twoFA": false
    },
    "wallet": {
      "id": "bd656a80-6984-4832-9a06-a858f249aec6",
      "createdAt": "2026-10-02T09:40:11.634Z",
      "updatedAt": "2026-10-02T09:42:19.721Z",
      "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
      "accountNumber": "1151496137",
      "accountName": "Bayo Sandbox",
      "isFrozen": true,
      "status": "active",
      "fundMethod": "STATIC_FUND",
      "tagpayCustomerId": "18e44202-924a-4d6e-a03a-87caa0e0c512",
      "tagpayWalletId": "1151496137",
      "currency": "NGN",
      "serviceProvider": "loma",
      "tier": "TIER_2"
    }
  },
  "status": 200,
  "message": "Customer record fetched"
}
```

#### PATCH /customer/wallet/{walletId}/unfreeze

Sent 2026-10-02 09:42:28 UTC, answered in 0.26 s.

```http
PATCH /api/dev/customer/wallet/bd656a80-6984-4832-9a06-a858f249aec6/unfreeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:28 GMT
content-type: application/json; charset=utf-8
content-length: 867
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"363-HkWOpzeBL5Kmp3nlNyUJZq0OB2U"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "bd656a80-6984-4832-9a06-a858f249aec6",
    "createdAt": "2026-10-02T09:40:11.634Z",
    "updatedAt": "2026-10-02T09:42:28.624Z",
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
    "tier": "TIER_2",
    "customer": {
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
      "auth": null
    }
  },
  "status": 200,
  "message": "Wallet unfrozen successfully"
}
```

#### B sends ₦10 to A again, same reference

Sent 2026-10-02 09:42:28 UTC, answered in 0.61 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1151496137",
  "receiverAccount": "1154079370",
  "amount": 10,
  "narration": "OPS-02 rerun B to A while B frozen",
  "CustomerReference": "OPS02R-W2W-005"
}
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:29 GMT
content-type: application/json; charset=utf-8
content-length: 478
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"1de-TZlqkHpkJ4LYjD0NQctitF2YMaE"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "amount": 10,
    "reference": "HlRPy8G4lLSljRauLSDFo6bGYAEzVtjuTQTn",
    "customerReference": "d56551bf-4c25-419d-b4c1-153b1a3e19e7",
    "total": 10,
    "transaction_fee": 0,
    "source_customer_id": "18e44202-924a-4d6e-a03a-87caa0e0c512",
    "source_customer_accname": "Bayo Sandbox",
    "source_customer_accno": "1151496137",
    "source_customer_wallet": "1151496137",
    "source_availableBalance": 40,
    "source_bookedBalance": 40,
    "description": "Fund transfer between customers"
  },
  "status": 200,
  "message": "successful"
}
```

#### B after: ₦40

Sent 2026-10-02 09:42:29 UTC, answered in 0.22 s.

```http
GET /api/dev/customer/wallet/balance/bd656a80-6984-4832-9a06-a858f249aec6
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:42:29 GMT
content-type: application/json; charset=utf-8
content-length: 127
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"7f-DoajvM6grEVvevZX2729T1TNPgs"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "balance": {
      "bookedBalance": 40,
      "availableBalance": 40
    },
    "tier": "TIER_2"
  },
  "status": 200,
  "message": "Wallet details fetched"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- No wallet exists to freeze. Both calls used an all-zero wallet id and were
  refused by the merchant gate before the id was looked up.
- Still unknown: the response shape, whether a frozen wallet can still
  receive money, and what a debit from a frozen wallet answers.

### Requests and responses

#### PATCH .../freeze

Sent 2026-10-02 08:30:17 UTC, answered in 0.23 s.

```http
PATCH /api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/freeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "reason": "OPS-02 sandbox test"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:18 GMT
content-type: application/json; charset=utf-8
content-length: 168
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"a8-37zdEvfvWEBAqcyTddKumZ1BH/Q"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:18.156Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/freeze"
}
```

#### PATCH .../unfreeze

Sent 2026-10-02 08:30:18 UTC, answered in 0.25 s.

```http
PATCH /api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/unfreeze
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:18 GMT
content-type: application/json; charset=utf-8
content-length: 170
server: cloudflare
x-powered-by: Express
access-control-allow-methods: PATCH, OPTIONS
etag: W/"aa-EbI8+/bc3eNg6ySW0n2SWN1hjGY"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:18.466Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/customer/wallet/00000000-0000-0000-0000-000000000000/unfreeze"
}
```
