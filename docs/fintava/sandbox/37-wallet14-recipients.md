# Saved beneficiaries and the payout account against the sandbox (WALLET-14)

Task WALLET-14, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
10:52:29 to 10:52:30 UTC. No other Fintava host was called, and nothing on
`id.wawuafrica.com` or `api.wawuafrica.com`.

Run through the routes on the built Hub (wawu-backend branch
`wmt/WALLET-14`, `node dist/src/main.js` on :4951) against a fresh local
database (`w14_hub_test`, dropped afterwards) and the local stand-in WAWU ID
(:4952): two people registered there and signed in through its `/auth/login`
(no minted token). Person A's wallet record was written the way MONEY-12
stores it (no Fintava create in this run); person B has none. The key was
read from a file with `sed` into the Hub's environment, never printed; the
Hub's log and this run's output were checked for every 8 characters of it in
a row (none). Only Fintava's documented sandbox stub was used: account
`0123456789` at GTBank `000013` (`02-name-enquiry-external.md`).

## Every call made

3 calls, all GET, all free (the bank list and the name check cost nothing,
`25-compliance-charges.md`); no money moved and nothing was created:

| # | Time (UTC) | Route that made it | Fintava call | Answer, as the route read it |
|---|---|---|---|---|
| 1 | 10:52:30 | `PUT /money/payout-account` `{000013, 0123456789}` | `GET /banks` | 200, the list (kept in memory for an hour, so no later request asked again) |
| 2 | 10:52:30 | the same request | `GET /name/enquiry?accountNumber=0123456789&sortCode=000013` | 200, `SIMI MICHELLE`, `responseCode "00"`: the route saved bank `GTBANK PLC`, name `SIMI MICHELLE`, `matchesBvnName: null` (person A has no BVN name on record: no sandbox BVN passes, question 11). 0.57 s for both calls |
| 3 | 10:52:30 | `POST /money/beneficiaries` `{bank_account, 000013, 0123456789}` | `GET /name/enquiry?accountNumber=0123456789&sortCode=000013` | 200, the same name: saved, `201` in 0.12 s (the bank list came from memory) |

## The route answers around them (no Fintava call)

| Request | Answer |
|---|---|
| A, before the wallet record: `GET /money/payout-account` | `409 wallet_not_open` |
| A: `GET /money/payout-account` | `200`, `null` (none saved) |
| A, after call 2: `GET /money/payout-account` | `200`, the account as saved |
| A: `PUT /money/payout-account` `{044, 0123456789}` | `422 name_check_failed`: `044` is the old CBN code (the Flutterwave wallet's), not in Fintava's list, so no name check was sent |
| A: `GET /money/beneficiaries`, then `GET /money/wallet` | the saved account; `beneficiaryCount: 1` |
| B (no wallet): list, payout account, `DELETE` of A's beneficiary | `409 wallet_not_open` each; A's list unchanged |
| A: `DELETE /money/beneficiaries/{id}`, then list and wallet | `200 null`; `[]`; `beneficiaryCount: 0` |

## What this tells us

- The name check and the bank list answer exactly as OPS-02 recorded them,
  and the route keeps the bank's name and Fintava's bank code.
- A bank code from the old Flutterwave list is refused before Fintava is
  asked: only Fintava's codes are saved.
- NOT RUN against the sandbox: `matchesBvnName` true or false on a real BVN
  record. It needs a passed BVN check, and no BVN the sandbox accepts is
  known (`README.md` question 11). The comparison is proved in the
  backend's spec against Fintava's documented BVN body, through the real
  `POST /money/identity/bvn` route.
