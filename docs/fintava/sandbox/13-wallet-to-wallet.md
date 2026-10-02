# POST /transaction/wallet-to-wallet

Task OPS-02, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Plan item: 9 and 10 (customer to customer; customer to WAWU and back). Result: **NOT RUN: HTTP 403**.

Masking: the API key is `Bearer ***`; every 11-digit number (BVN, NIN,
phone) shows its last 4 digits only; emails show the domain only; the
merchant administrator's name, address and date of birth, which Fintava
returns inside transaction records, are masked, and that person's BVN and
NIN are masked completely. Account numbers are kept: they are sandbox
account numbers.

## What this tells us

- Fintava refused it with `403 Merchant is not active` before reading the body, because WAWU's sandbox merchant is `inactive` on Fintava's side (README.md, "The blocker"). Nothing was debited.
- None of the three moves could be made: customer to customer (no
  customers), customer to WAWU's merchant wallet (no customer), WAWU back to
  a customer (no customer). The only probe was WAWU's account to an account
  number that does not exist, ₦100, and an empty body: both 403 before
  validation.
- So these stay unknown: the fee actually charged (`fees.md` says ₦23.25
  under ₦5,000), whether `transaction_fee` in the response shows it, whether
  a repeated `CustomerReference` is refused, whether the merchant wallet can
  be the sender, and the `wallet_to_wallet_transfer_v2` webhook.
- What to run once the merchant is active: two customers A and B; A to B
  ₦100 with reference R1; the same call again with R1 (duplicate test); A to
  WAWU's account `1102038668` ₦100; WAWU to A ₦100; then `GET
  /transaction/reference/R1` (does our reference work there?) and both
  balances.

## Requests and responses

### WAWU's account to an unknown account, ₦100

Sent 2026-10-02 08:30:17 UTC, answered in 0.24 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{
  "senderAccount": "1102038668",
  "receiverAccount": "1100000000",
  "amount": 100,
  "narration": "OPS-02 sandbox test",
  "CustomerReference": "OPS02-W2W-001"
}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:17 GMT
content-type: application/json; charset=utf-8
content-length: 137
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"89-yWR2TukrF6ixuNZcj1ROsjd3a6w"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:17.661Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```

### Empty body

Sent 2026-10-02 08:30:33 UTC, answered in 0.22 s.

```http
POST /api/dev/transaction/wallet-to-wallet
Host: dev.fintavapay.com
Authorization: Bearer ***
Accept: application/json
Content-Type: application/json

{}
```

**Response: HTTP 403**

```http
HTTP/2 403 
date: Fri, 02 Oct 2026 08:30:33 GMT
content-type: application/json; charset=utf-8
content-length: 137
server: cloudflare
x-powered-by: Express
access-control-allow-methods: POST, OPTIONS
etag: W/"89-gNokZrzmdmyOzAGL5tFHA9pYTJk"
cf-cache-status: DYNAMIC
```

```json
{
  "status": 403,
  "timestamp": "2026-10-02T08:30:33.350Z",
  "message": [
    "Merchant is not active"
  ],
  "path": "/api/dev/transaction/wallet-to-wallet"
}
```
