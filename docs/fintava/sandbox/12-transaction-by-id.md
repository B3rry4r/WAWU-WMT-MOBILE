# GET /transaction/id/{transactionId}

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`. Plan item: 8 (look up a transaction).
Re-run 2 Oct 2026, 09:39 to 10:19 UTC, merchant active: **ran, HTTP 200**.
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

- The full record of the ₦300 WAWU-to-A transfer: `platformComm: null`,
  `merchantComm: null`, `lomaCharge: null`: no fee of any kind, which
  matches `transaction_fee: 0` and the balances (`13-wallet-to-wallet.md`).
- `tagapayTransRef` holds the transfer response's `reference`; `reference`
  holds the response's `customerReference` (`11-transaction-by-reference.md`).
- `source` "Test Account4 1102038668", `destination` "1154079370" (account
  number only).
- It still embeds WAWU's merchant administrator, with BVN, NIN, date of
  birth, address and login record (masked below). The embedded merchant now
  shows **`status: "active"`, `updatedAt: 2026-10-02T09:22:24.993Z`**: the
  sandbox merchant was activated at 09:22 UTC. The other merchant settings
  are unchanged (`KycFee: "50.00"`, `DebitKycFee: false`,
  `WalletToWalletDebit: false`, `splitstatus: false`, ...).
- Unknown id: still `200` with `data: null`.

### Requests and responses

#### GET /transaction/id/{id}, the ₦300 transfer

Sent 2026-10-02 09:41:16 UTC, answered in 0.20 s.

```http
GET /api/dev/transaction/id/02271ab1-413f-45d0-905b-c6c62a16d77a
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:41:16 GMT
content-type: application/json; charset=utf-8
content-length: 2203
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"89b-sSTtBi1osxo6MZZaD8nOlwEH8ek"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "02271ab1-413f-45d0-905b-c6c62a16d77a",
    "createdAt": "2026-10-02T09:40:36.779Z",
    "updatedAt": "2026-10-02T09:40:36.792Z",
    "amount": "300.00",
    "usdtAmount": null,
    "amountPayable": null,
    "transType": "AATRANSFER",
    "entry": "DEBIT",
    "reference": "23f77125-eac0-4e73-bb83-8562ccdfddb9",
    "CustomerReference": "OPS02R-W2W-001",
    "isRefundable": null,
    "isAcknowledged": false,
    "source": "Test Account4 1102038668",
    "destination": "1154079370",
    "platformComm": null,
    "merchantComm": null,
    "lomaCharge": null,
    "narration": "OPS-02 rerun WAWU to A",
    "currency": "NGN",
    "tagapayTransRef": "Aq3QKQTXsU98QZpzee6FUbT4ygffK6bxqlRG",
    "TransRef": null,
    "status": "SUCCESS",
    "meternumber": null,
    "smartcard_number": null,
    "metertoken": null,
    "discoRef": null,
    "recipientNo": null,
    "dataBundle": null,
    "recipientDetails": "Ada Sandbox 1154079370",
    "senderDetails": "Test Account4 1102038668",
    "senderBank": "Loma Bank",
    "receiverBank": "Loma Bank",
    "provider": null,
    "reason": null,
    "sessionId": "090620261002094036531865681434",
    "deletedAt": null,
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma",
    "customer": {
      "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
      "createdAt": "2026-08-11T13:20:34.026Z",
      "updatedAt": "2026-08-11T13:22:02.629Z",
      "firstName": "***",
      "lastName": "***",
      "phoneNumber": "***",
      "bvn": "<masked: a real person, not a test value>",
      "dateOfBirth": "***",
      "address": "***",
      "roles": [
        "ADMINISTRATOR"
      ],
      "userType": "MERCHANT",
      "nin": "<masked: a real person, not a test value>",
      "twoFA": true,
      "auth": {
        "id": "***",
        "createdAt": "2026-08-11T13:20:34.026Z",
        "updatedAt": "2026-10-02T08:24:09.383Z",
        "isEmailVerified": true,
        "lastLogin": "2026-10-02T08:24:09.384Z",
        "kycComplianceIndicator": "APPROVED",
        "mode": "SANDBOX"
      },
      "merchant": {
        "id": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
        "createdAt": "2026-08-11T13:20:34.026Z",
        "updatedAt": "2026-10-02T09:22:24.993Z",
        "businessEmail": "***@grr.la",
        "businessName": "Test Account4",
        "canDebitOnDashboard": true,
        "status": "active",
        "redirectUrl": null,
        "cardUrl": null,
        "DebitKycFee": false,
        "WalletToWalletDebit": false,
        "DebitStaticWallet": false,
        "splitstatus": false,
        "staticWalletFee": "0.00",
        "payoutroute": "lomabank",
        "staticWalletCapFee": "0.00",
        "KycFee": "50.00",
        "regChannel": "internal"
      }
    }
  },
  "status": 200,
  "message": "successful"
}
```

#### Unknown id: 200 with data null

Sent 2026-10-02 09:44:27 UTC, answered in 0.18 s.

```http
GET /api/dev/transaction/id/00000000-0000-0000-0000-000000000000
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 09:44:28 GMT
content-type: application/json; charset=utf-8
content-length: 49
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"31-U+s86kUBWEbJAk0mPPANEavmFAg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": null,
  "status": 200,
  "message": "successful"
}
```

## First run (merchant inactive)

2 Oct 2026, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was `inactive`. Kept as recorded.

### What this tells us

- **An unknown id answers `200` with `data: null`**, not a 404. The client
  must treat `data === null` as "not found".
- The full record carries the fee fields: **`platformComm`, `merchantComm`
  and `lomaCharge`** ("0.00", "0.00", null on a compliance charge). This is
  very likely where a dashboard merchant charge shows up (`merchantComm`);
  confirm on the first real transfer.
- It also carries bill fields: `meternumber`, `metertoken`, `discoRef`,
  `smartcard_number`, `recipientNo`, `dataBundle`. So an electricity token
  is stored on the transaction (`metertoken`) and can be read back by id,
  even if the purchase response leaves it out. Unconfirmed until an
  electricity purchase runs.
- **It embeds the whole customer**, here WAWU's merchant administrator:
  name, phone, **BVN, NIN**, date of birth, address, roles, an `auth`
  object and the merchant's settings (masked below). Our backend must never
  pass this response to the app, never log it raw, and keep only the fields
  it needs.
- The embedded merchant settings answer one question: our sandbox merchant
  has `status: "inactive"` (the blocker), with `kycComplianceIndicator:
  "APPROVED"` and `mode: "SANDBOX"`. Other settings Fintava keeps per
  merchant: `KycFee: "50.00"`, `DebitKycFee: false`, `WalletToWalletDebit:
  false`, `DebitStaticWallet: false`, `staticWalletFee: "0.00"`,
  `staticWalletCapFee: "0.00"`, `splitstatus: false`, `payoutroute:
  "lomabank"`, `canDebitOnDashboard: true`. Their meaning is a question for
  Fintava (README.md).

### Requests and responses

#### GET /transaction/id/{transactionId}

Sent 2026-10-02 08:37:36 UTC, answered in 0.26 s.

```http
GET /api/dev/transaction/id/fc163c4e-602f-4ae2-90d9-21960fa18c68
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:37:37 GMT
content-type: application/json; charset=utf-8
content-length: 2104
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"838-tvAgACksYH1TrMOgIvuu3s2xmaY"
cf-cache-status: DYNAMIC
```

```json
{
  "data": {
    "id": "fc163c4e-602f-4ae2-90d9-21960fa18c68",
    "createdAt": "2026-10-02T08:32:00.050Z",
    "updatedAt": "2026-10-02T08:32:00.050Z",
    "amount": "5.00",
    "usdtAmount": null,
    "amountPayable": null,
    "transType": "BVNCHARGE",
    "entry": "DEBIT",
    "reference": "1500fb0f-c8d0-4a6e-9433-6683b2ea919f",
    "CustomerReference": null,
    "isRefundable": null,
    "isAcknowledged": false,
    "source": "customer",
    "destination": "compliance",
    "platformComm": "0.00",
    "merchantComm": "0.00",
    "lomaCharge": null,
    "narration": "Compliance charges (BVNCHARGE)",
    "currency": "NGN",
    "tagapayTransRef": null,
    "TransRef": null,
    "status": "SUCCESS",
    "meternumber": null,
    "smartcard_number": null,
    "metertoken": null,
    "discoRef": null,
    "recipientNo": null,
    "dataBundle": null,
    "recipientDetails": "Compliance account",
    "senderDetails": "customer",
    "senderBank": "Loma Bank",
    "receiverBank": "Loma Bank",
    "provider": null,
    "reason": null,
    "sessionId": null,
    "deletedAt": null,
    "metaData": null,
    "settlementStatus": null,
    "settlementSession": null,
    "accountProvider": "loma",
    "customer": {
      "id": "a2162db5-0911-4786-8760-7b99f5d4a69a",
      "createdAt": "2026-08-11T13:20:34.026Z",
      "updatedAt": "2026-08-11T13:22:02.629Z",
      "firstName": "***",
      "lastName": "***",
      "phoneNumber": "***",
      "bvn": "<masked: a real person, not a test value>",
      "dateOfBirth": "***",
      "address": "***",
      "roles": [
        "ADMINISTRATOR"
      ],
      "userType": "MERCHANT",
      "nin": "<masked: a real person, not a test value>",
      "twoFA": true,
      "auth": {
        "id": "***",
        "createdAt": "2026-08-11T13:20:34.026Z",
        "updatedAt": "2026-10-02T08:24:09.383Z",
        "isEmailVerified": true,
        "lastLogin": "2026-10-02T08:24:09.384Z",
        "kycComplianceIndicator": "APPROVED",
        "mode": "SANDBOX"
      },
      "merchant": {
        "id": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
        "createdAt": "2026-08-11T13:20:34.026Z",
        "updatedAt": "2026-08-11T13:26:49.645Z",
        "businessEmail": "***@grr.la",
        "businessName": "Test Account4",
        "canDebitOnDashboard": true,
        "status": "inactive",
        "redirectUrl": null,
        "cardUrl": null,
        "DebitKycFee": false,
        "WalletToWalletDebit": false,
        "DebitStaticWallet": false,
        "splitstatus": false,
        "staticWalletFee": "0.00",
        "payoutroute": "lomabank",
        "staticWalletCapFee": "0.00",
        "KycFee": "50.00",
        "regChannel": "internal"
      }
    }
  },
  "status": 200,
  "message": "successful"
}
```

#### Unknown id: 200 with data null

Sent 2026-10-02 08:29:17 UTC, answered in 0.22 s.

```http
GET /api/dev/transaction/id/00000000-0000-0000-0000-000000000000
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200**

```http
HTTP/2 200 
date: Fri, 02 Oct 2026 08:29:17 GMT
content-type: application/json; charset=utf-8
content-length: 49
server: cloudflare
x-powered-by: Express
access-control-allow-methods: GET, OPTIONS
etag: W/"31-U+s86kUBWEbJAk0mPPANEavmFAg"
cf-cache-status: DYNAMIC
```

```json
{
  "data": null,
  "status": 200,
  "message": "successful"
}
```
