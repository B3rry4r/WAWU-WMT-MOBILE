# The pending sweep against the sandbox (MONEY-08)

Task MONEY-08, sandbox `https://dev.fintavapay.com/api/dev`, 3 Oct 2026,
05:31:49 to 05:31:51 UTC. No other Fintava host was called.

Run by wawu-backend `scripts/fintava/status-sandbox-check.ts` (branch
`wmt/MONEY-08`; its header says how), against a fresh local database
(`m08_live_test`, dropped afterwards). A fetch guard in the script refused any
host but the sandbox and **any method but GET**: this run moved no money,
created nothing at Fintava and made no charged call. The key was read from a
file with `sed` into the command's environment, never printed; the output
was checked for every 8 characters of it in a row (none).

## What it did

It wrote four `pending` ledger rows the way a sending feature does after
losing a send's answer (our reference only, `source: send`), for three of
MONEY-10's real ₦10 sends of 2 Oct 2026 (`30-money10-ledger.md`) and one
reference that never existed. Every webhook was withheld: none was posted
(there is no tunnel, R-25). Then it ran the real sweep,
`LedgerStatusService.sweep()`, once.

| # | Row (our reference) | Recorded as | After one sweep | How |
|---|---|---|---|---|
| 1 | WAWU to A, `MONEY10-SBX-20261002201756-1` | WAWU out ₦10, 3 minutes old | **completed**, Fintava's reference and transaction id filled | lookup by our reference: 200, SUCCESS; the by-id record read for the tagapay reference |
| 2 | A to WAWU, `MONEY10-SBX-20261002201756-2` | A out ₦10 (A's wallet: OPS-02's customer A, account ending 9370) | **completed**, references filled | lookup by our reference: 200, SUCCESS; by id |
| 3 | a reference that never existed, `MONEY08-SBX-20261003053150-ABSENT` | WAWU out ₦10, 11 minutes old (past the money timeout plus the 10-minute resend safety) | **failed**, "Fintava has no record of this transfer, so no money moved." | lookup: Fintava's own `404 "Transaction not found!"`; WAWU's history (page 1, 82 rows) has no row for it |
| 4 | WAWU to B, `MONEY10-SBX-20261002201756-3` | WAWU out recorded as **₦20** (Fintava has ₦10) | **pending**, `discrepancy` "status check: amountKobo 2000 vs 1000", status not moved | lookup: 200, SUCCESS, ₦10: a stop, recorded for review |

Sweep result: `{"settled":2,"failed_absent":1,"waiting":0,"disagrees":1,"skipped":0}`.
No lookup answered `{}` this time, so no second sweep was needed.

## Every call made

8 calls, all GET, all to the sandbox:

| Call | Answer |
|---|---|
| `GET /merchant/balance` (WAWU's account number, for the rows) | 200 |
| `GET /transaction/reference/MONEY08-SBX-20261003053150-ABSENT` | 404 "Transaction not found!" |
| `GET /txn/merchant?page=1&take=82&order=DESC` | 200 |
| `GET /transaction/reference/MONEY10-SBX-20261002201756-1` | 200 |
| `GET /transaction/id/d0083283-...` | 200 |
| `GET /transaction/reference/MONEY10-SBX-20261002201756-2` | 200 |
| `GET /transaction/id/1e5d1989-...` | 200 |
| `GET /transaction/reference/MONEY10-SBX-20261002201756-3` | 200 |

The app logged two lines: the client's warning for the 404 (operation,
status, our reference and Fintava's message) and the sweep's error for row 4
(the row id only). No name, account number or key in either.

## Not run

- A bank send whose webhook is withheld, and one Fintava reports FAILURE
  with its `debit_transfer_reversal`: the sandbox refuses every payout with
  `400 "Unable to find customers"` (question 17 in `../naira-api.md`).
  Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub
  `0123456789`/`000013` stops answering "Unable to find customers". Both are
  tested with Fintava's record shapes from `11-` and `09-` and locally signed
  documented deliveries (`ledger-status.contract.spec.ts`).
- Bills: the same refusal (`18-` to `21-`).
- A fresh ₦10 send with its webhook withheld: not needed for the seam (a
  withheld webhook is the normal state here, with no tunnel), and the run was
  kept read-only. MONEY-10's real sends were settled instead.
