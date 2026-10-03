# Opening the account against the sandbox (MONEY-12)

Task MONEY-12, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
05:21:54 to 05:47:44 UTC. No other Fintava host was called, and nothing
called `live.fintavapay.com`.

The backend was built from the `wmt/MONEY-12` branch and run locally
(`node dist/src/main.js` on :4901) against a local database (`m12_hub`)
and the stand-in WAWU ID (:4902), with the sandbox key read from a file into
the process environment and never printed. The person signed in through the
stand-in's real login (`POST /auth/login`), no minted token. Two of the five
calls were made with a one-call script (`GET` only, host fixed to
`dev.fintavapay.com`, output masked); the other three were made by the
route itself and are known from the server's log lines (the client logs the
operation, the status and the time, never a URL, a header or a body). The
scripts were not committed.

Masking: as in the other files here. Every 11-digit number shows its last 4
digits only; emails show the domain only. Every identity value sent is
Fintava's own documented example (`reference/create-customer-copy.md`: the
name `john ugochukwu`, the phone ending `5863`, the address `lugbe,abuja`,
the date of birth `1992-05-17`; the BVN ending `8901` and the NIN ending
`0003` that OPS-02's two creates used, `07-create-customer.md`), never a
person's. The email is `***@example.com`. Account numbers are kept: they are
sandbox account numbers. The key appears nowhere below.

**What was a stand-in, and why.** The BVN check (KYC-01) and the selfie
match (KYC-02) were not run: no sandbox BVN passes the BVN check (question
11) and no selfie can match until Fintava shows its real selfie success body
(question 6; BACKEND_GAPS G-25). So the person's passed BVN check and
matched selfie were written into `m12_hub` directly, as the routes would
have written them: the keyed hashes of that BVN and NIN, their last 4
digits, the check's time and the proved phone (`WalletIdentity`), and one
`matched` selfie row tied to exactly that check (`SelfieMatchAttempt`, its
`bvnVerifiedAt` and `bvnHash`). Everything from `POST /money/wallet/open`
on is the real route against the real sandbox.

Limits kept: one customer created (the task names no number; OPS-02 made
two). 5 calls in all, none charged (create costs ₦0, `25-compliance-charges.md`).

## The calls

| # | Sent (UTC) | By | Call | HTTP | Result |
|---|---|---|---|---|---|
| 1 | 05:21:54.910 | script | `GET /customers/details?phone=*******5863` | 404 | `["Customer not found"]`, 0.69 s: the shape of "absent" |
| 2 | 05:47:29 | route | `GET /customers/details?phone=*******5863` | 404 | "Customer not found": no customer for the phone yet, so a create may go |
| 3 | 05:47:29 | route | `POST /create/customer` | 201 | in 431 ms; account `1192964482` recorded |
| 4 | 05:47:43.488 | script | `GET /customers/14acc2fc-2952-43b6-be71-168633aa086c` | 200 | Fintava reports account `1192964482`, the same walletId, `TIER_2` |
| 5 | 05:47:44 | route | `GET /customer/wallet/balance/2950137f-...` (`GET /money/wallet/balance`) | 200 | in 305 ms; `availableKobo: 0` |

## What this tells us

- **Fintava's own "absent" for a customer is `404 ["Customer not found"]`**
  in its business shape `{ status, timestamp, message: [string], path }`
  (call 1, and again from the route in call 2). This is the only answer the
  backend reads as "Fintava has no customer for this phone"
  (`FintavaClient.lookupCustomerByPhone`); any other 404, a `{}` or a
  `data: null` is "unknown" and never leads to a second create.
- **The route opened a real sandbox account** for a person whose identity
  steps had passed (stand-ins, above): it asked Fintava first (call 2),
  sent one create (call 3) and answered `state: "open"` with account number
  `1192964482`, account name `john ugochukwu`, bank `Loma Bank`, code
  `090620`.
- **Fintava reports the same account** (call 4): `userInfo.id` is the
  stored customerId, `wallet.id` the stored walletId, `wallet.accountNumber`
  `1192964482`, the wallet `TIER_2` and `active`, `nin: null` again (as in
  `07-`). The balance route reads that wallet (call 5).
- **A second `POST /money/wallet/open` sent nothing to Fintava** (no log
  line between it and call 4) and answered byte for byte the first answer.
- **Nothing identity-shaped was kept or logged.** The full BVN, the NIN, the
  address and the date of birth appear in no column of `m12_hub` (512 text
  columns scanned) and in no line of the server's log; no 8-character window
  of the key (58 of them) appears in the log, the answers or the script
  output. Stored: the three ids, the account name, the keyed BVN hash and
  the phone (`FintavaWalletOpening`).

## Requests and responses

### Call 1: `GET /customers/details`, a phone Fintava has no customer for

```http
GET /api/dev/customers/details?phone=*******5863
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 404**, `content-type: application/json; charset=utf-8`

```json
{
  "status": 404,
  "timestamp": "2026-10-03T05:21:55.598Z",
  "message": [
    "Customer not found"
  ],
  "path": "/api/dev/customers/details?phone=*******5863"
}
```

### Calls 2 and 3: `POST /api/hub/money/wallet/open` (the route)

Sent 2026-10-03 05:47:28.770 UTC with the person's token, answered in
0.97 s.

```json
{
  "bvn": "*******8901",
  "nin": "*******0003",
  "firstName": "john",
  "lastName": "ugochukwu",
  "dateOfBirth": "1992-05-17",
  "address": "lugbe,abuja"
}
```

The server's log lines for it, in order (nothing else was logged):

```text
WARN [FintavaClient] look up customer: not_found HTTP 404 "Customer not found"
LOG  [FintavaClient] create customer: HTTP 201 in 431 ms
LOG  [WalletOpeningService] wallet opening: account recorded
```

The create the route sent (built by the MONEY-06 client from the body above,
the verified phone and the token's email; the body itself is never logged):

```json
{
  "firstName": "john",
  "lastName": "ugochukwu",
  "phoneNumber": "*******5863",
  "email": "***@example.com",
  "fundingMethod": "STATIC_FUND",
  "address": "lugbe,abuja",
  "dateOfBirth": "1992-05-17",
  "bvn": "*******8901",
  "nin": "*******0003"
}
```

**The route's answer: HTTP 200**

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "state": "open",
    "account": {
      "accountNumber": "1192964482",
      "accountName": "john ugochukwu",
      "bankName": "Loma Bank",
      "bankCode": "090620",
      "licenceLine": null,
      "depositInsuranceLine": null,
      "openedAt": "2026-10-03T05:47:29.736Z"
    },
    "limits": null,
    "pin": { "isSet": false, "changedAt": null, "triesLeft": 5, "lockedUntil": null },
    "bankTransfers": { "allowed": true, "blockedBy": null },
    "beneficiaryCount": 0
  }
}
```

What was stored (`m12_hub`):

| table | row |
|---|---|
| `FintavaWallet` | customerId `14acc2fc-2952-43b6-be71-168633aa086c`, walletId `2950137f-aadd-4e02-8544-50d3387c422d`, account `1192964482`, accountName `john ugochukwu` |
| `FintavaWalletOpening` | state `open`, attempts 1, phone `+234*******5863`, failure null, a 64-character keyed BVN hash |

Before the open, `GET /money/wallet` answered `state: "not_open"`,
`account: null`; after it, the same answer as above, read from the database
without calling Fintava. A second `POST /money/wallet/open` with the same
body answered the same bytes and sent nothing.

### Call 4: `GET /customers/{customerId}`, Fintava's own record

```http
GET /api/dev/customers/14acc2fc-2952-43b6-be71-168633aa086c
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
```

**Response: HTTP 200** in 0.49 s

```json
{
  "data": {
    "id": "fd1772d5-c554-4761-b27d-e39ff773d381",
    "createdAt": "2026-10-03T05:47:29.435Z",
    "updatedAt": "2026-10-03T05:47:29.435Z",
    "phone": "*******5863",
    "email": "***@example.com",
    "customerType": "INDIVIDUAL",
    "approvalStatus": "PENDING",
    "approvalAt": null,
    "rejectedAt": null,
    "kycComplianceIndicator": "NOT_STARTED",
    "userInfo": {
      "id": "14acc2fc-2952-43b6-be71-168633aa086c",
      "createdAt": "2026-10-03T05:47:29.435Z",
      "updatedAt": "2026-10-03T05:47:29.435Z",
      "firstName": "john",
      "lastName": "ugochukwu",
      "phoneNumber": "*******5863",
      "bvn": "*******8901",
      "dateOfBirth": "1992-05-17",
      "address": "lugbe,abuja",
      "roles": ["USER"],
      "userType": "CUSTOMER",
      "nin": null,
      "twoFA": false
    },
    "wallet": {
      "id": "2950137f-aadd-4e02-8544-50d3387c422d",
      "createdAt": "2026-10-03T05:47:29.435Z",
      "updatedAt": "2026-10-03T05:47:29.435Z",
      "merchant": "ae4de060-0058-4f5b-a63c-aabe94b9b2c0",
      "accountNumber": "1192964482",
      "accountName": "john ugochukwu",
      "isFrozen": false,
      "status": "active",
      "fundMethod": "STATIC_FUND",
      "tagpayCustomerId": "5494c4d4-4bdc-44ff-aaed-0636139893d2",
      "tagpayWalletId": "1192964482",
      "currency": "NGN",
      "serviceProvider": "loma",
      "tier": "TIER_2"
    }
  },
  "status": 200,
  "message": "Customer record fetched"
}
```

### Call 5: `GET /api/hub/money/wallet/balance` (the route)

Sent 2026-10-03 05:47:44 UTC; the server logged `wallet balance: HTTP 200 in
305 ms` and answered `{ "availableKobo": 0, "asOf": "2026-10-03T05:47:44.307Z" }`.

## NOT RUN

- **The whole of Open your wallet against the sandbox** (the BVN check, the
  selfie match, then the open, for one person): unblocked when Fintava names
  a sandbox BVN that its BVN check passes (question 11) and shows the real
  success body of a selfie match on a record it matches (question 6), so a
  real selfie can pass KYC-02's allowlist (BACKEND_GAPS G-25).
- **A lost create answer against the sandbox** (a timeout or a 5xx after
  Fintava made the customer): it cannot be asked of the sandbox; it is
  proved against the stand-in (`wallet-opening.contract.spec.ts`).
- **Whether Fintava refuses a second customer with the same phone** (OPS-02
  left it NOT RUN): not tried, to keep to one new customer. The backend does
  not rely on it: a second WAWU account with the same phone or BVN is
  refused before anything is sent, and Fintava is asked by phone before
  every create.
