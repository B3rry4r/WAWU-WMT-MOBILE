# No wallet yet: the wallet gate against the sandbox (MONEY-13)

Task MONEY-13, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
10:42:07 to 10:43:14 UTC. No other Fintava host was called, and nothing
called `live.fintavapay.com`, `id.wawuafrica.com` or `api.wawuafrica.com`.

The backend was built from the `wmt/MONEY-13` branch and run locally
(`node dist/src/main.js` on :4911) against a fresh local database
(`m13_hub_test`, dropped afterwards) and the stand-in WAWU ID (:4912). The
sandbox key was read from a file into the process environment and never
printed. Every person signed in through the stand-in's real
`POST /auth/register` then `POST /auth/login`; no token was minted.

Masking: as in the other files here. No BVN, NIN, address or date of birth
was sent or read back by anything in this file. Account numbers and ids are
kept: they are the sandbox account MONEY-12 opened (`32-money12-account.md`).
The key appears nowhere below.

**What was a stand-in, and why.** The gate reads only our own database, so
each kind of person without a wallet was written into `m13_hub_test`
directly, as the earlier steps would have left them: a web creator with a
Flutterwave wallet (`CreatorWallet`) and a PIN set before MONEY-13 gated the
PIN routes, an opening that `failed`, and an opening `conflict` held for
review (shown as "opening"). The wallet holder's `FintavaWallet` row points
at the sandbox account MONEY-12 opened, with the ids Fintava reports in call
1. Rows in `opening` or `unknown` were not used here, because the Hub's
30-second opening sweep would have asked Fintava about made-up phones; those
two states are proved against the stand-in (`wallet-gate.contract.spec.ts`).

Limits kept: 2 calls in all, both reads, neither charged.

## The calls

| # | Sent (UTC) | By | Call | HTTP | Result |
|---|---|---|---|---|---|
| 1 | 10:42:07.682 | script | `GET /customers/14acc2fc-2952-43b6-be71-168633aa086c` | 200 | 432 ms; `userInfo.id` as stored, `wallet.id` `2950137f-aadd-4e02-8544-50d3387c422d`, account `1192964482`, `john ugochukwu`, `active`, `TIER_2`. The script printed only these fields |
| 2 | 10:43:13.5 | route | `GET /customer/wallet/balance/2950137f-...` (`GET /money/wallet/balance`, the wallet holder) | 200 | 511 ms; `availableKobo: 0` |

The Hub's log shows exactly one Fintava line in the run, call 2
(`wallet balance: HTTP 200 in 511 ms`). Every refusal below was answered
from our database with no call to Fintava.

## What the Hub answered

Each person called every gated route (`GET`, `POST`, `PUT /money/pin`,
`POST /money/pin/verify`, `GET /money/wallet/balance`) twice: once bare, and
once with `X-Transaction-Pin: 0000` and a wrong body.

| Person | `GET /money/wallet` | Every gated route, both ways |
|---|---|---|
| New, nothing stored | 200, `state: "not_open"` | 409 `wallet_not_open`, 10 of 10 |
| Web creator: Flutterwave wallet, a PIN from before the gate | 200, `not_open` (`pin.isSet: true`) | 409 `wallet_not_open`, 10 of 10 |
| Last opening `failed` | 200, `not_open` | 409 `wallet_not_open`, 10 of 10 |
| Opening held for review (`conflict`) | 200, `opening` | 409 `wallet_opening`, 10 of 10 |
| Holds the sandbox wallet `1192964482` | 200, `open`, `Loma Bank`, `1192964482` | PIN set 201, read 200, checked 200; balance 200 from Fintava (call 2) |

- **One body per code.** `wallet_not_open` was always
  `{"statusCode":409,"message":"You don't have a wallet yet. Open your wallet to continue.","data":null,"reason":{"code":"wallet_not_open","message":"You don't have a wallet yet. Open your wallet to continue."}}`;
  `wallet_opening` always "Your account is still being opened. Check again
  in a moment.". The same bytes on every route.
- **No PIN try used without a wallet.** The web creator then sent five wrong
  PINs to `POST /money/pin/verify`: five `409 wallet_not_open`, and their
  PIN row still reads 0 wrong tries, no lock.
- **20 requests at once** across the five routes, as the new person: 20
  answers, all 409, one distinct body. No 500.
- **No token:** 401 on all five routes.
- **Nothing leaked.** No 8-character window of the key (58 of them) appears
  in the Hub's log, the drive output or the script output.
