# GET /transaction/id/{transactionId}

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 8 (look up a transaction). Result: **ran, HTTP 200**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

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

## Requests and responses

### GET /transaction/id/{transactionId}

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
      "firstName": "V***",
      "lastName": "A***",
      "phoneNumber": "*******1201",
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

### Unknown id: 200 with data null

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
