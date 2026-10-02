# The Fintava client against the sandbox (MONEY-06)

Task MONEY-06, sandbox `https://dev.fintavapay.com/api/dev`, 2 Oct 2026.
Calls made through the backend's Fintava client (wawu-backend `src/fintava/`)
by `scripts/fintava/sandbox-check.ts`, which anyone can run again (its header
says how). No other host was called. The key is never printed; every output
below was checked for any 8 characters of it in a row (none).

Masking: as in the other files here. Test customers appear by their test
names; sandbox account numbers and our references are kept. No BVN, NIN or
phone appears, because no identity check was run and the client drops the
identity Fintava embeds (transaction by id, freeze).

Limits kept: the two OPS-02 test customers only (A `1154079370`, B
`1151496137`), no customer created, no charged call (BVN, selfie, phone),
money moved only as ₦10 wallet-to-wallet between WAWU's merchant wallet and
A or B, each sent back, so every balance ended where it started.

## What this adds to what OPS-02 found

- **`200 {}` is not only for refused bank sends.**
  `GET /transaction/reference/{ours}` answered `200` with the body `{}`
  (2 bytes) for records that exist, of every status, SUCCESS included
  (`OPS02R-W2W-001` and this task's own ₦10 sends). What was seen:
  - A fresh send was found in full by our reference straight after it was
    made, in every run.
  - `MONEY06-SBX-20261002153323-3` (sent during run 1, 15:33:23 to
    15:33:37) was served in full at 15:34:20.9 and answered `{}` at
    15:34:22.8; `OPS02R-W2W-001` was served in full at 15:34:21.1 and
    answered `{}` at 15:34:22.9.
  - From 15:34:22 to 15:39:10 every reference probed answered `{}`, singly
    and spaced 20 s apart.
  - `OPS02R-BC-001` and `OPS02R-MT-002`, `{}` for the OPS-02 verifier at
    10:27, were served in full again at 15:33.
  - The MONEY-06 verifier, at 16:00 UTC: `MONEY06-SBX-20261002154144-1`,
    18.5 minutes after its send, was served in full and answered `{}` 1.2 s
    later; `OPS02R-MT-001` the same, 1.1 s apart.
  - A reference that never existed answered `404 "Transaction not found!"`
    every time.
  So `{}` can come back for an existing reference at any time, from about a
  minute to at least 18.5 minutes after the send (and on hours-old OPS-02
  records), flipping with the full record within about 1 to 2 seconds. It looks
  like "a record exists but its body was not served".
- **The unknown id answers `data: null`.** `GET /transaction/id/00000000-...`
  answered `200 { data: null }` in run 1 and for the MONEY-06 verifier at
  16:00:20 UTC. In runs 2 and 3 (15:40 and 15:41 UTC) the same call came
  back without `data`, which the client read as unknown. The client reads
  `data: null` as absent and a body without `data` as unknown, and never
  decides a resend from this call.
- **A timed-out send landed.** In run 2 the script's client waited 3 s for
  `A to WAWU ₦10` (`MONEY06-SBX-20261002153955-2`) and gave up
  (`outcome_unknown`). The money moved anyway: the balances ended at their
  start values. The client's `reconcile` then found it by our reference,
  SUCCESS, and decided `settled`: it would not have been sent again. (Runs 1
  and 3 waited 3 s and 10 s; those sends answered in about 0.7 to 1.0 s.)
- **A wallet-to-wallet send refused while the receiver was frozen leaves no
  record:** the lookup by its reference answers 404, so the client's retry
  sent it again under the same reference once B was unfrozen, and Fintava
  accepted it (all three runs). This is the only case where a reference is
  reused.
- The sandbox still charges no fee on wallet to wallet (`transaction_fee: 0`,
  every fee field null on the record by id); the dashboard rates in
  `../fees.md` stand.

## Run 3 (the script as committed), 15:41:44 to 15:42:05 UTC, 44 calls

| Step (plan item) | Result | What came back |
|---|---|---|
| 3. merchant balance (start) | PASS | Test Account4 1102038668, ₦49650.00 available, TIER_3 |
| 3. wallet balances A and B (start) | PASS | A ₦250.00 TIER_2; B ₦40.00 TIER_2 |
| 5. bank list | PASS | 358 banks (unique codes), Loma Bank 090620 |
| 6. name at another bank (sandbox stub) | PASS | matched true, SIMI MICHELLE, responseCode 00 |
| 6. name of a Fintava wallet, and of none | PASS | A is "Ada Sandbox"; 1100000000 is null (the leaked-JS-error 400) |
| 2. customers A and B by id: four ids each | PASS | A: TIER_2, frozen false, 4 distinct ids; B: TIER_2, frozen false, 4 distinct ids |
| 2. customer list | PASS | 2 customers, first Bayo TIER_2 |
| 4. customer history (A) and merchant history | PASS | A: 5 rows, all DEBIT; merchant: 19 rows (debits only) |
| 10. WAWU to A ₦10 (MONEY06-SBX-20261002154144-1) | PASS | accepted: amount ₦10.00, fee ₦0.00, sender after ₦49640.00 |
| 8. lookups: ours found, response `reference` absent, response `customerReference` found | PASS | ours: found; response .reference: absent; response .customerReference: found |
| 8. by id: the full record; its tagapayTransRef is the response .reference | PASS | id via lookup; found, tagapayTransRef matches, fees platform null merchant null loma null |
| 8. unknown id: absent (200 data null) or unknown (200 `{}`), never found | PASS | unknown |
| 9. the same request again: refused, nothing moved | PASS | duplicate_reference; A ₦260.00 (start + ₦10 once) |
| reconcile + retry of a settled send: settled, nothing sent | PASS | decision settled, nothing sent |
| 10. A to WAWU ₦10 (MONEY06-SBX-20261002154144-2) | PASS | accepted, sender after ₦250.00 |
| 12. freeze B | PASS | isFrozen true, status active |
| 12. WAWU to frozen B ₦10 (MONEY06-SBX-20261002154144-3): refused; balance still readable | PASS | wallet_inactive; B ₦40.00 unchanged |
| 12. unfreeze B | PASS | isFrozen false |
| retry of the refused send (MONEY06-SBX-20261002154144-3): reconcile, then resend only if Fintava has none | PASS | lookup 404; decision resend_same_reference; accepted ₦10.00 |
| 9. B to WAWU ₦10 (MONEY06-SBX-20261002154144-4) | PASS | accepted, sender after ₦40.00 |
| 8. OPS02R-MT-001 (an OPS-02 refused bank send): never sent again | PASS | lookup unknown; reconcile history PENDING; decision wait |
| auth: a wrong key without live_ (400) and with live_ (404) | PASS | auth, auth |
| 11. bill lists: discos, MTN and 9mobile data, cable | PASS | 22 discos; MTN 53 bundles; 9mobile (ETISALAT) 14; cable GOTV/DSTV; GOTV 7 plans |
| 11. meter preview, made-up meter: null (free) | PASS | null |
| 3. balances at the end: back where they started | PASS | WAWU ₦49650.00, A ₦250.00, B ₦40.00 |
| 1. verify BVN, BVN selfie, phone | NOT RUN | charged calls: not allowed in this run |
| 2. create customer, find by phone | NOT RUN | no new customers; the test phones are only on record masked |
| 7. bank sends (customer and merchant) | NOT RUN | sandbox refuses every payout: question 17 |
| 11. bill purchases (electricity, airtime, data, cable) | NOT RUN | sandbox refuses every payout: question 17 |
| 13. webhooks | NOT RUN | MONEY-07 receives them; no call to make |

25 passed, 0 failed, 5 not run.

### The client's own log for run 3

What the client logged: the operation, the HTTP status, the error kind, our
reference and Fintava's message (masked). Never a URL, a body or a header.

```
merchant balance: HTTP 200 in 538 ms
wallet balance: HTTP 200 in 127 ms
wallet balance: HTTP 200 in 504 ms
list banks: HTTP 200 in 162 ms
bank name enquiry: HTTP 200 in 103 ms
wallet name enquiry: HTTP 200 in 114 ms
wallet name enquiry: refused HTTP 400 "Cannot read properties of undefined (reading 'accountName')"
get customer: HTTP 200 in 125 ms
get customer: HTTP 200 in 84 ms
list customers: HTTP 200 in 133 ms
customer history: HTTP 200 in 116 ms
merchant history: HTTP 200 in 107 ms
wallet to wallet: HTTP 200 in 729 ms ref MONEY06-SBX-20261002154144-1
transaction by reference: HTTP 200 in 100 ms ref MONEY06-SBX-20261002154144-1
transaction by reference: not_found HTTP 404 ref AC8BOuIkS76koajKdmj66u47I85SL3CFavpB "Transaction not found!"
transaction by reference: HTTP 200 in 123 ms ref f203e57d-f44e-44ab-a299-527636bf16a4
transaction by id: HTTP 200 in 89 ms
transaction by id: HTTP 200 in 93 ms
wallet to wallet: duplicate_reference HTTP 400 ref MONEY06-SBX-20261002154144-1 "customerReference already exists"
wallet balance: HTTP 200 in 130 ms
transaction by reference: HTTP 200 in 75 ms ref MONEY06-SBX-20261002154144-1
merchant history: HTTP 200 in 118 ms
wallet to wallet: HTTP 200 in 931 ms ref MONEY06-SBX-20261002154144-2
freeze wallet: HTTP 200 in 141 ms
wallet to wallet: wallet_inactive HTTP 400 ref MONEY06-SBX-20261002154144-3 "Kindly confirm both customer accounts are active"
wallet balance: HTTP 200 in 127 ms
unfreeze wallet: HTTP 200 in 142 ms
transaction by reference: not_found HTTP 404 ref MONEY06-SBX-20261002154144-3 "Transaction not found!"
wallet to wallet: HTTP 200 in 1009 ms ref MONEY06-SBX-20261002154144-3
wallet to wallet: HTTP 200 in 925 ms ref MONEY06-SBX-20261002154144-4
transaction by reference: HTTP 200 in 114 ms ref OPS02R-MT-001
transaction by reference: HTTP 200 in 472 ms ref OPS02R-MT-001
merchant history: HTTP 200 in 153 ms
merchant balance: auth HTTP 400 "Invalid API key"
merchant balance: auth HTTP 404 "Invalid API Key"
list discos: HTTP 200 in 114 ms
list data bundles: HTTP 200 in 122 ms
list data bundles: HTTP 200 in 89 ms
list cable providers: HTTP 200 in 147 ms
list cable plans: HTTP 200 in 92 ms
preview meter: refused HTTP 400 "Http Exception"
merchant balance: HTTP 200 in 166 ms
wallet balance: HTTP 200 in 160 ms
wallet balance: HTTP 200 in 310 ms
```

## Runs 1 and 2 (earlier copies of the script)

- Run 1, 15:33:23 to 15:33:37 UTC, 44 calls: 23 passed, 2 failed. Both failures were
  the script's own expectations, not the client: the lookup of the record by
  id answered `{}` (unknown) where the script expected a record, and
  `OPS02R-MT-001` answered with its PENDING record where the script expected
  `{}`. The script now accepts either and checks only that nothing is sent
  again. Money moved: four ₦10 sends, all returned.
- Run 2, 15:39:55 to 15:40:15 UTC, 44 calls: 23 passed, 2 failed: the unknown id
  answered `{}` (script expected `data: null`), and the timed-out send
  above. Money moved: four ₦10 sends, all returned (the timed-out one
  included).
- Between and after the runs, 31 read-only probes of the lookups (15:33 to
  15:41 UTC) gave the `{}` findings above, and the reconcile of the
  timed-out send.

## Not run

- Verify BVN, BVN selfie, phone check: charged calls, not allowed here.
  Covered by the client's tests against the documented and the OPS-02
  answers.
- Create customer and find by phone: no new customers; the test phones are
  on record only masked.
- Bank sends (`/bank/credit`, `/bank/credit/merchant`) and bill purchases:
  the sandbox refuses every payout ("Unable to find customers", question 17
  in `../naira-api.md`). Unblocked when a ₦100 `POST /bank/credit/merchant`
  to `0123456789`/`000013` stops answering that.
- Webhooks: MONEY-07 receives them; there is no call to make.

## Totals

163 sandbox calls in all (three runs of 44, and 31 read-only probes). Money: 12 accepted ₦10 wallet-to-wallet sends (WAWU to A and
back, WAWU to B and back, three times), 3 refused repeats of a reference and
3 refused sends to frozen B, nothing else. B was frozen and unfrozen three
times. Balances at the end: WAWU ₦49,650, A ₦250, B ₦40, as before.
