# GET /txn/merchant: WAWU's history

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 4 (history for WAWU). Result: **ran, HTTP 200, with a caching problem**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- **Responses are cached for about 5 minutes, keyed on `page` and `take`.**
  The first `take=10` read (08:28:32) was empty, correctly. Charges then
  landed from 08:28:44, yet every `take=10` read stayed empty until somewhere
  between 08:33:14 and 08:34:15, while `take=7`, `take=20` and `take=100`
  (new keys) showed them. A `take=20` read first made at 08:31:48 kept
  showing 7 rows until between 08:36:18 and 08:37:19, while `take=21` showed
  8. Adding `type=DEBIT` to `take=10` still returned the cached empty page,
  so the filters do not seem to be part of the cache key.
  **Consequence:** history is not a source of truth for "did this just
  happen". MONEY-16 (nightly check) is fine; a "just paid" screen or a retry
  decision must use the transaction lookups (`11-`, `12-`) or the balance,
  never this list.
- `take=101` was accepted (the docs say 100 is the most).
- `status` must be upper case: `PENDING`, `SUCCESS`, `CANCELLED`, `FAILURE` or
  `ONGOING`. The docs say "success or failed"; `status=success` is a 400.
- `meta.page` and `meta.take` are strings, `itemCount` and `pageCount`
  numbers.
- Each row: `id`, `createdAt`, `updatedAt`, `amount` (**string**, "5.00"),
  `transType`, `entry` (DEBIT/CREDIT), `reference`, **`CustomerReference`**
  (null here), `source`, `destination`, `narration`, `status`,
  `recipientDetails`, `senderDetails`, `senderBank`, `receiverBank`,
  `provider`, `sessionId`, `accountProvider` ("loma") and a `customer`
  object (`id`, names, phone). The docs' `tagapayTransRef` and `TransRef`
  were absent.
- The only rows are this task's compliance charges, all `transType:
  "BVNCHARGE"`, `source: "customer"`, `destination: "compliance"`, narrated
  "Compliance charges (BVNCHARGE)", attributed to the merchant's
  administrator user.

## Requests and responses

### Before any charge: take=10

Sent 2026-10-02 08:28:32 UTC, answered in 0.27 s.

```http
GET /api/dev/txn/merchant?page=1&take=10&order=DESC
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:28:33 GMT
content-type: application/json; charset=utf-8
content-length: 115
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"73-nhgUtv9vsk/6dGCwkbt7TzZIoSY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [],
  "meta": {
    "page": "1",
    "take": "10",
    "itemCount": 0,
    "pageCount": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### After 7 charges: take=10 still empty (cached)

Sent 2026-10-02 08:31:27 UTC, answered in 0.23 s.

```http
GET /api/dev/txn/merchant?page=1&take=10&order=DESC
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:27 GMT
content-type: application/json; charset=utf-8
content-length: 115
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"73-nhgUtv9vsk/6dGCwkbt7TzZIoSY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [],
  "meta": {
    "page": "1",
    "take": "10",
    "itemCount": 0,
    "pageCount": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### Same moment: take=100 with type, status and dates shows the 7 charges

Sent 2026-10-02 08:31:27 UTC, answered in 0.23 s.

```http
GET /api/dev/txn/merchant?page=1&take=100&type=DEBIT&status=SUCCESS&startDate=2026-10-01&endDate=2026-10-03
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:27 GMT
content-type: application/json; charset=utf-8
content-length: 4812
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"12cc-G/QMzk/u+uSYwnLgy6knhbDIt0E"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "100",
    "itemCount": 7,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### status in lower case is refused

Sent 2026-10-02 08:31:27 UTC, answered in 0.19 s.

```http
GET /api/dev/txn/merchant?page=1&take=10&status=success
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 400**

```http
HTTP/2 400 
date: Fri, 02 Oct 2026 08:31:27 GMT
content-type: application/json; charset=utf-8
content-length: 269
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"10d-FQlIJuvqdaQdKEEiqb30Wka2vBw"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 400,
  "timestamp": "2026-10-02T08:31:27.847Z",
  "message": {
    "statusCode": 400,
    "message": [
      "status must be one of the following values: PENDING, SUCCESS, CANCELLED, FAILURE, ONGOING"
    ],
    "error": "Bad Request"
  },
  "path": "/api/dev/txn/merchant?page=1&take=10&status=success"
}
```

### take=101 is accepted

Sent 2026-10-02 08:31:27 UTC, answered in 0.19 s.

```http
GET /api/dev/txn/merchant?page=1&take=101
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:28 GMT
content-type: application/json; charset=utf-8
content-length: 4812
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"12cc-3+l/T/5MT69/q6jg5DcujlVqppo"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "101",
    "itemCount": 7,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### take=10 with type=DEBIT: still the cached empty page

Sent 2026-10-02 08:31:59 UTC, answered in 0.27 s.

```http
GET /api/dev/txn/merchant?page=1&take=10&type=DEBIT
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:31:59 GMT
content-type: application/json; charset=utf-8
content-length: 115
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"73-nhgUtv9vsk/6dGCwkbt7TzZIoSY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [],
  "meta": {
    "page": "1",
    "take": "10",
    "itemCount": 0,
    "pageCount": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### After an 8th charge: take=20 (cached at 08:31:48) shows 7

Sent 2026-10-02 08:32:02 UTC, answered in 0.17 s.

```http
GET /api/dev/txn/merchant?page=1&take=20
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:32:02 GMT
content-type: application/json; charset=utf-8
content-length: 4811
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"12cb-XFIZXsfKjUk5NkkdntmaAUxuzKY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "20",
    "itemCount": 7,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### Same moment: take=21 shows 8

Sent 2026-10-02 08:32:02 UTC, answered in 0.25 s.

```http
GET /api/dev/txn/merchant?page=1&take=21
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:32:02 GMT
content-type: application/json; charset=utf-8
content-length: 5482
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"156a-+l0DKIDerg2J0KOe7dPM7MxQCsY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "fc163c4e-602f-4ae2-90d9-21960fa18c68",
      "createdAt": "2026-10-02T08:32:00.050Z",
      "updatedAt": "2026-10-02T08:32:00.050Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1500fb0f-c8d0-4a6e-9433-6683b2ea919f",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "21",
    "itemCount": 8,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### take=20 at 08:36:18: still 7

Sent 2026-10-02 08:36:18 UTC, answered in 0.45 s.

```http
GET /api/dev/txn/merchant?page=1&take=20
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:36:19 GMT
content-type: application/json; charset=utf-8
content-length: 4811
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"12cb-XFIZXsfKjUk5NkkdntmaAUxuzKY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "20",
    "itemCount": 7,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### take=20 at 08:37:19: now 8

Sent 2026-10-02 08:37:19 UTC, answered in 0.42 s.

```http
GET /api/dev/txn/merchant?page=1&take=20
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:37:19 GMT
content-type: application/json; charset=utf-8
content-length: 5482
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"156a-8cjdc+/mXSJDsM79aL3ZTz4q5/k"
cf-cache-status: DYNAMIC
```

```json
{
  "data": [
    {
      "id": "fc163c4e-602f-4ae2-90d9-21960fa18c68",
      "createdAt": "2026-10-02T08:32:00.050Z",
      "updatedAt": "2026-10-02T08:32:00.050Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1500fb0f-c8d0-4a6e-9433-6683b2ea919f",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "cc8f40c6-62dd-4499-8581-49d393ef5f4c",
      "createdAt": "2026-10-02T08:31:14.852Z",
      "updatedAt": "2026-10-02T08:31:14.852Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "4e7c79df-d7ba-463d-91d6-4108f7dbbcb7",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "f3d694e3-ca22-4765-a943-1e1627adf151",
      "createdAt": "2026-10-02T08:31:14.652Z",
      "updatedAt": "2026-10-02T08:31:14.652Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "2997f093-8e9b-488b-991e-b84df5f2e1c5",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "33ae41e0-0800-4f01-aac7-682fea57b87e",
      "createdAt": "2026-10-02T08:31:11.960Z",
      "updatedAt": "2026-10-02T08:31:11.960Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "341a6b18-7153-4d31-b62d-ae6e1c3e7596",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "ff0266ef-03b7-4e30-94b8-2eae11cff21d",
      "createdAt": "2026-10-02T08:30:33.753Z",
      "updatedAt": "2026-10-02T08:30:33.753Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "1c0577a0-e667-4c29-9ebe-9d64e4ade7f1",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "0a637df8-a60a-41b3-8073-ae10534c96b7",
      "createdAt": "2026-10-02T08:29:11.254Z",
      "updatedAt": "2026-10-02T08:29:11.254Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "7b07010d-3c36-4532-8ed9-9c49263b7f51",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "30838964-fa46-47dd-8a8c-351fec526fda",
      "createdAt": "2026-10-02T08:29:11.041Z",
      "updatedAt": "2026-10-02T08:29:11.041Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "a66b6444-8bce-4bbe-a240-9b42fe33a096",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    },
    {
      "id": "89cf76b9-c66e-4faa-a9e4-1d7e933b8e92",
      "createdAt": "2026-10-02T08:28:44.233Z",
      "updatedAt": "2026-10-02T08:28:44.233Z",
      "amount": "5.00",
      "transType": "BVNCHARGE",
      "entry": "DEBIT",
      "reference": "66a8b3d5-7be3-4788-82f9-227a3ee41209",
      "CustomerReference": null,
      "source": "customer",
      "destination": "compliance",
      "narration": "Compliance charges (BVNCHARGE)",
      "status": "SUCCESS",
      "recipientDetails": "Compliance account",
      "senderDetails": "customer",
      "senderBank": "Loma Bank",
      "receiverBank": "Loma Bank",
      "provider": null,
      "sessionId": null,
      "accountProvider": "loma",
      "customer": {
        "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
        "firstName": "V***",
        "lastName": "A***",
        "phoneNumber": "*******1201"
      }
    }
  ],
  "meta": {
    "page": "1",
    "take": "20",
    "itemCount": 8,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```
