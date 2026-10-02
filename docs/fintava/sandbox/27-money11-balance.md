# The balance route against the sandbox (MONEY-11)

Task MONEY-11, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026,
17:30:34 to 17:31:00 UTC. No other Fintava host was called.

The backend was built from the `wmt/MONEY-11` branch and run locally
(`node dist/src/main.js` on :4712) against a local database (`m11_live_test`)
and the mock WAWU ID (:4711), with the sandbox key read from a file and never
printed. A driver script (not committed) refused every request except: the
local app and mock, `GET /customer/wallet/balance/{A's walletId}`, and at most
two `POST /transaction/wallet-to-wallet`.

Masking: as in the other files here. Customer A appears by its test name;
sandbox account numbers and our references are kept. No BVN, NIN or phone was
sent or received. The key appears nowhere below (checked for every 8
characters of it in a row).

Limits kept: OPS-02's customer A only, no customer created, no charged call,
money moved only as two ₦10 wallet-to-wallet sends (WAWU to A, then A back to
WAWU), so every balance ended where it started.

## How the person reached their balance

1. A new identity registered and signed in through the mock WAWU ID's real
   `POST /auth/register` and `POST /auth/login` (no injected token).
2. `GET /api/hub/money/wallet/balance` with that token, before any wallet was
   on record: **409** `wallet_not_open`, "Open your wallet to see your
   balance.", and no Fintava call. Without a token: **401**.
3. A `FintavaWallet` row was written by hand for that person, pointing at
   customer A ("Ada Sandbox", walletId `3b84eae9-...-7dfc52185cf7`, account
   `1154079370`): MONEY-12, which writes these rows when an account opens, is
   not built yet.

## Equals Fintava's after every movement

Each step read the balance twice: through the route (the app calling Fintava)
and straight from Fintava through the same MONEY-06 client.

| Step | Route | Route `availableKobo` | Fintava direct (kobo) | Equal | `Cache-Control` |
|---|---|---|---|---|---|
| start | 200 | 25000 | 25000 | yes | `no-store` |
| ₦10 WAWU to A, `MONEY11-SBX-20261002173034-1` | | | | | |
| after the send | 200 | 26000 | 26000 | yes | `no-store` |
| ₦10 A to WAWU, `MONEY11-SBX-20261002173034-2` | | | | | |
| after the send back | 200 | 25000 | 25000 | yes | `no-store` |

Both sends: `amountKobo` 1000, `feeKobo` 0, `totalKobo` 1000 (the sandbox
still charges nothing for wallet-to-wallet, as in `13-`). The second send's
response gave A's balance after as 25000 kobo, the same figure the route
answered next. Customer A ends at ₦250, where OPS-02 left it.

## Fintava not answering is W6, not 0

The app was restarted with `FINTAVA_TIMEOUT_MS=50` (the sandbox answered reads
in 131 to 717 ms in this run), and the same person asked again at 17:31:00 UTC:

```json
{
  "statusCode": 503,
  "message": "We could not reach your account. Your money is safe. Try again in a moment.",
  "data": null,
  "reason": {
    "code": "provider_unreachable",
    "message": "We could not reach your account. Your money is safe. Try again in a moment.",
    "retryAfterSeconds": 30
  }
}
```

The app logged `wallet balance: unavailable "timed out"` and nothing else.

## Every call made

| # | Time (UTC) | Caller | Call | HTTP | ms |
|---|---|---|---|---|---|
| 1 | 17:30:35 | route | `GET /customer/wallet/balance/{A}` | 200 | 724 |
| 2 | 17:30:35.456 | direct | `GET /customer/wallet/balance/{A}` | 200 | 714 |
| 3 | 17:30:36.175 | direct | `POST /transaction/wallet-to-wallet` (WAWU to A, ₦10) | 200 | 737 |
| 4 | 17:30:37 | route | `GET /customer/wallet/balance/{A}` | 200 | 181 |
| 5 | 17:30:37.107 | direct | `GET /customer/wallet/balance/{A}` | 200 | 177 |
| 6 | 17:30:37.285 | direct | `POST /transaction/wallet-to-wallet` (A to WAWU, ₦10) | 200 | 827 |
| 7 | 17:30:38 | route | `GET /customer/wallet/balance/{A}` | 200 | 157 |
| 8 | 17:30:38.281 | direct | `GET /customer/wallet/balance/{A}` | 200 | 131 |
| 9 | 17:31:00 | route | `GET /customer/wallet/balance/{A}` | none (aborted at 50 ms) | 50 |

Seven balance reads of customer A and two ₦10 sends. Nothing else.

## Not run here

- A frozen wallet: freezing is a write the task did not allow. The route maps
  the client's frozen refusal (`wallet_inactive`) to `423 wallet_frozen`, tested
  against the local double; in the sandbox a frozen wallet's balance can still
  be read (`15-`), so a frozen person sees their balance.
- An unknown walletId: answered `400 "Wallet not found"` in OPS-02 (`08-`); the
  route reads it as 503 (tested against the double), never as "no wallet".
