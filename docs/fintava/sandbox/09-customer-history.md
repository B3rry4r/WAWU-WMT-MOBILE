# GET /txn?customerId=: customer history

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 4 (history for a customer).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200; lists only what the customer sent**.
First run 2 Oct 2026, 08:28 to 08:38 UTC, merchant inactive: **partly run: HTTP 404** (kept below).

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only, including the two test customers'
test values; emails show the domain only; the merchant administrator's
name, address and date of birth, which Fintava returns inside transaction
records, are masked, and that person's BVN and NIN are masked completely.
Account numbers are kept: they are sandbox account numbers (WAWU's sandbox
merchant and the two test customers this task created).

## Re-run (merchant active)

### What this tells us

- Shape: `data { data: [rows], meta { page, take, itemCount, pageCount,
  hasPreviousPage, hasNextPage } }`, `message: "Customer transactions
  fetched"`. A new customer is an empty list, not a 404.
- **Only the customer's own debits are listed. Money received is not.**
  Customer A received ₦300 from WAWU and ₦10 from B, and neither appears in
  A's list, which shows only A's sends (₦50 to B, ₦10 to WAWU, and the
  refused bank send). B received ₦50 and its list stayed empty until B sent
  something. `type=CREDIT` is ignored (it still returned B's debit).
  **Consequence:** the app's "money in" rows cannot come from `/txn`. They
  have to come from the webhooks (`wallet_to_wallet_transfer_v2`,
  `account_funded`) recorded by our backend, while the balance shown stays
  Fintava's.
- Row fields: `id`, `createdAt`, `updatedAt`, `amount` (string),
  `transType` (`AATRANSFER` for wallet and bank sends), `entry`,
  `reference`, `CustomerReference` (ours), `source`, `destination`,
  `narration`, `status`, `recipientDetails`, `senderDetails`, `senderBank`,
  `receiverBank`, `provider` (`null` or `""`), `sessionId`,
  `accountProvider`, and `customer { id, firstName, lastName, phoneNumber }`.
- The refused bank send (`14-bank-transfer.md`) is listed as `PENDING`, with
  `source: "Test Account4 ae4de060-..."` (WAWU's merchant name and merchant
  id) although customer A was the sender.
- Caching: not tested here (each read used a new `take`, so it could not be
  a cached page; `10-merchant-history.md` has the cache finding).

### Requests and responses

#### GET /txn, customer A just opened

Sent 2026-10-02 09:40:26 UTC, answered in 0.56 s.

```http
GET /api/dev/txn?customerId=4e8409cf-1234-40f7-963a-5c212c7a9836&page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:40:27 GMT
content-type: application/json; charset=utf-8
content-length: 179
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b3-3Q4X4njCUKiLwzI0fMb7KjvWVzQ"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "data": [],
    "meta": {
      "page": "1",
      "take": "10",
      "itemCount": 0,
      "pageCount": 0,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  },
  "status": 200,
  "message": "Customer transactions fetched"
}
```

#### GET /txn, customer A after the wallet-to-wallet sends

Sent 2026-10-02 09:41:16 UTC, answered in 0.22 s.

```http
GET /api/dev/txn?customerId=4e8409cf-1234-40f7-963a-5c212c7a9836&page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:17 GMT
content-type: application/json; charset=utf-8
content-length: 1644
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"66c-wDeYalyvDoo6w3ecrsEKT84SS3Y"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "data": [
      {
        "id": "bfc65098-f581-4c06-ba52-d512f4241904",
        "createdAt": "2026-10-02T09:40:58.764Z",
        "updatedAt": "2026-10-02T09:40:58.777Z",
        "amount": "10.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "341f9cb1-e00d-4a86-95c9-579c5e835c7d",
        "CustomerReference": "OPS02R-W2W-003",
        "source": "Ada Sandbox 1154079370",
        "destination": "1102038668",
        "narration": "OPS-02 rerun A to WAWU",
        "status": "SUCCESS",
        "recipientDetails": "Test Account4 1102038668",
        "senderDetails": "Ada Sandbox 1154079370",
        "senderBank": "Loma Bank",
        "receiverBank": "Loma Bank",
        "provider": null,
        "sessionId": "090620261002094058517886134534",
        "accountProvider": "loma",
        "customer": {
          "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
          "firstName": "Ada",
          "lastName": "Sandbox",
          "phoneNumber": "*******0101"
        }
      },
      {
        "id": "336ae2dd-d5f0-41ef-8dee-e388e84a6eed",
        "createdAt": "2026-10-02T09:40:49.138Z",
        "updatedAt": "2026-10-02T09:40:49.464Z",
        "amount": "50.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "6305ae79-1261-483d-bbba-94b8f19caa51",
        "CustomerReference": "OPS02R-W2W-002",
        "source": "Ada Sandbox 1154079370",
        "destination": "1151496137",
        "narration": "OPS-02 rerun A to B",
        "status": "SUCCESS",
        "recipientDetails": "Bayo Sandbox 1151496137",
        "senderDetails": "Ada Sandbox 1154079370",
        "senderBank": "Loma Bank",
        "receiverBank": "Loma Bank",
        "provider": "",
        "sessionId": "090620261002094049108727704933",
        "accountProvider": "loma",
        "customer": {
          "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
          "firstName": "Ada",
          "lastName": "Sandbox",
          "phoneNumber": "*******0101"
        }
      }
    ],
    "meta": {
      "page": "1",
      "take": "10",
      "itemCount": 2,
      "pageCount": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  },
  "status": 200,
  "message": "Customer transactions fetched"
}
```

#### GET /txn, customer B after receiving ₦50

Sent 2026-10-02 09:41:36 UTC, answered in 0.47 s.

```http
GET /api/dev/txn?customerId=3c672d13-cc4f-4200-bf13-038f21aab06a&page=1&take=10
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:36 GMT
content-type: application/json; charset=utf-8
content-length: 179
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"b3-3Q4X4njCUKiLwzI0fMb7KjvWVzQ"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "data": [],
    "meta": {
      "page": "1",
      "take": "10",
      "itemCount": 0,
      "pageCount": 0,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  },
  "status": 200,
  "message": "Customer transactions fetched"
}
```

#### GET /txn, customer A after the refused bank send

Sent 2026-10-02 09:44:02 UTC, answered in 0.22 s.

```http
GET /api/dev/txn?customerId=4e8409cf-1234-40f7-963a-5c212c7a9836&page=1&take=11
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:03 GMT
content-type: application/json; charset=utf-8
content-length: 2427
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"97b-4NBX8PLId0eRuGVUGBUZQvKj1Lg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "data": [
      {
        "id": "5b7c2213-ce9f-495f-ab36-079caa816517",
        "createdAt": "2026-10-02T09:41:44.656Z",
        "updatedAt": "2026-10-02T09:41:44.656Z",
        "amount": "100.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "c1240e50-74c2-4d6e-9eba-d867c3e2aa42",
        "CustomerReference": "OPS02R-BC-001",
        "source": "Test Account4 ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
        "destination": "SIMI MICHELLE (0123456789)",
        "narration": "OPS-02 rerun A to bank",
        "status": "PENDING",
        "recipientDetails": "SIMI MICHELLE (0123456789)",
        "senderDetails": "Ada Sandbox 1154079370",
        "senderBank": "Loma Bank",
        "receiverBank": "GTBANK PLC",
        "provider": null,
        "sessionId": "090620261002094144844359705329",
        "accountProvider": "loma",
        "customer": {
          "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
          "firstName": "Ada",
          "lastName": "Sandbox",
          "phoneNumber": "*******0101"
        }
      },
      {
        "id": "bfc65098-f581-4c06-ba52-d512f4241904",
        "createdAt": "2026-10-02T09:40:58.764Z",
        "updatedAt": "2026-10-02T09:40:58.777Z",
        "amount": "10.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "341f9cb1-e00d-4a86-95c9-579c5e835c7d",
        "CustomerReference": "OPS02R-W2W-003",
        "source": "Ada Sandbox 1154079370",
        "destination": "1102038668",
        "narration": "OPS-02 rerun A to WAWU",
        "status": "SUCCESS",
        "recipientDetails": "Test Account4 1102038668",
        "senderDetails": "Ada Sandbox 1154079370",
        "senderBank": "Loma Bank",
        "receiverBank": "Loma Bank",
        "provider": null,
        "sessionId": "090620261002094058517886134534",
        "accountProvider": "loma",
        "customer": {
          "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
          "firstName": "Ada",
          "lastName": "Sandbox",
          "phoneNumber": "*******0101"
        }
      },
      {
        "id": "336ae2dd-d5f0-41ef-8dee-e388e84a6eed",
        "createdAt": "2026-10-02T09:40:49.138Z",
        "updatedAt": "2026-10-02T09:40:49.464Z",
        "amount": "50.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "6305ae79-1261-483d-bbba-94b8f19caa51",
        "CustomerReference": "OPS02R-W2W-002",
        "source": "Ada Sandbox 1154079370",
        "destination": "1151496137",
        "narration": "OPS-02 rerun A to B",
        "status": "SUCCESS",
        "recipientDetails": "Bayo Sandbox 1151496137",
        "senderDetails": "Ada Sandbox 1154079370",
        "senderBank": "Loma Bank",
        "receiverBank": "Loma Bank",
        "provider": "",
        "sessionId": "090620261002094049108727704933",
        "accountProvider": "loma",
        "customer": {
          "id": "4e8409cf-1234-40f7-963a-5c212c7a9836",
          "firstName": "Ada",
          "lastName": "Sandbox",
          "phoneNumber": "*******0101"
        }
      }
    ],
    "meta": {
      "page": "1",
      "take": "11",
      "itemCount": 3,
      "pageCount": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  },
  "status": 200,
  "message": "Customer transactions fetched"
}
```

#### GET /txn, customer B with type=CREDIT

Sent 2026-10-02 09:44:27 UTC, answered in 0.22 s.

```http
GET /api/dev/txn?customerId=3c672d13-cc4f-4200-bf13-038f21aab06a&page=1&take=12&type=CREDIT
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:27 GMT
content-type: application/json; charset=utf-8
content-length: 925
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"39d-FZUw8cdCHIgzWXYaPo15quQ+Wpo"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "data": [
      {
        "id": "95bde900-4042-4bb6-934f-ea328b8cc3a6",
        "createdAt": "2026-10-02T09:42:29.235Z",
        "updatedAt": "2026-10-02T09:42:29.409Z",
        "amount": "10.00",
        "transType": "AATRANSFER",
        "entry": "DEBIT",
        "reference": "d56551bf-4c25-419d-b4c1-153b1a3e19e7",
        "CustomerReference": "OPS02R-W2W-005",
        "source": "Bayo Sandbox 1151496137",
        "destination": "1154079370",
        "narration": "OPS-02 rerun B to A while B frozen",
        "status": "SUCCESS",
        "recipientDetails": "Ada Sandbox 1154079370",
        "senderDetails": "Bayo Sandbox 1151496137",
        "senderBank": "Loma Bank",
        "receiverBank": "Loma Bank",
        "provider": "",
        "sessionId": "090620261002094229218292920234",
        "accountProvider": "loma",
        "customer": {
          "id": "3c672d13-cc4f-4200-bf13-038f21aab06a",
          "firstName": "Bayo",
          "lastName": "Sandbox",
          "phoneNumber": "*******0202"
        }
      }
    ],
    "meta": {
      "page": "1",
      "take": "12",
      "itemCount": 1,
      "pageCount": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  },
  "status": 200,
  "message": "Customer transactions fetched"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- No customer exists (README.md, "The blocker"). An unknown id answers
  `404 ["Customer not found"]`.
- The merchant's own administrator user (the `customer.id` Fintava attaches
  to WAWU's merchant transactions) is **also** "Customer not found" here: the
  merchant's admin user is not a customer, so `/txn` is for customer wallets
  only and WAWU's history comes from `/txn/merchant`.
- Not gated by merchant status. Shape of a real customer history: unseen.

### Requests and responses

#### GET /txn with an unknown customerId

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

#### GET /txn with the merchant administrator's user id

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
