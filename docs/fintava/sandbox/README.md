# Fintava sandbox calls (OPS-02)

Real calls to Fintava's sandbox, `https://dev.fintavapay.com/api/dev`, with
the sandbox key (the key is never written here; it is `Bearer ***` in every
file). No other host was called. Two runs, both on 2 Oct 2026:

- **First run**, 08:28 to 08:38 UTC, while WAWU's sandbox merchant was
  `inactive`: about 100 requests, most refused with `403 Merchant is not
  active`.
- **Re-run**, 09:39:45 to 09:47:10 UTC, after Fintava told the owner to try
  the APIs again: 82 requests, plus 4 read-only requests at 10:18 UTC to
  re-check two pending records. The merchant was active.

Each file holds the re-run first (exact requests, full masked responses,
what they taught us) and the first run below it under "First run (merchant
inactive)".

## The blocker

**Resolved: the sandbox merchant is active.** At 09:39:46 UTC `POST
/create/customer` got past the merchant gate (the first answer was a NIN
refusal, the next a `201`). The merchant record Fintava embeds in `GET
/transaction/id/{id}` now shows `status: "active"`, updated
`2026-10-02T09:22:24.993Z` (`12-transaction-by-id.md`). Customers, customer
reads, the BVN check, wallet-to-wallet in every direction and freeze and
unfreeze all ran to a result.

**A narrower blocker remains: nothing that pays out of Fintava works yet.**
Every bank send (`/bank/credit` and `/bank/credit/merchant`) and the airtime,
data and electricity purchases answer `400 ["Unable to find customers"]`,
whatever the sender and the beneficiary (`14-bank-transfer.md`); the cable
purchase answers HTTP 201 with `"service not currently available"`
(`21-bills-cable.md`). Nothing was debited. **Unblocked when** a ₦100 `POST
/bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops
answering "Unable to find customers" (question 17 below). Then re-run
`14-` (success, failure, reversal), `18-` to `21-` (purchases) and, with a
tunnel, `23-` (webhooks).

What blocked the first run (kept for the record): every call that created
or read a customer, checked a BVN, moved money, paid a bill or froze a
wallet answered `{"status":403,...,"message":["Merchant is not active"]}`
before validation, because the merchant record said `status: "inactive"`.

## The calls

| File | Call | First run | Re-run HTTP | Re-run result |
|---|---|---|---|---|
| `01-bank-list.md` | `GET /banks` | 200 | 200 | unchanged: 358 banks, Loma Bank `090620` |
| `02-name-enquiry-external.md` | `GET /name/enquiry` | 200 | 200 | unchanged stub name; free |
| `03-name-enquiry-internal.md` | `GET /loma-name/enquiry` | 200 | 200, 400 | works for a customer wallet; unknown account is a 400 with a leaked JS error |
| `04-bvn-check.md` | `GET /compliance/verify/bvn` | 403 | 400 | "Invalid BVN or BVN does not exist" for the documented example; **charged ₦5** |
| `05-bvn-selfie.md` | `POST /compliance/verify/bvn/selfie` | 400 | 400 | unchanged: upstream 404, charged ₦10 (run once) |
| `06-phone-check.md` | `GET /compliance/verify/phone-number` | 400 | 400 | unchanged: "Phone Number not Found", charged ₦5 (run once) |
| `07-create-customer.md` | `POST /create/customer` and customer reads | 403 | 403, 400, **201**, 200 | 2 customers created, **`TIER_2`**, `nin` returned null, no BVN check, not charged |
| `08-wallet-balance.md` | `GET /customer/wallet/balance/{walletId}` | 400 | 200 | balance and `tier` |
| `09-customer-history.md` | `GET /txn?customerId=` | 404 | 200 | **only the customer's own debits; money received is not listed** |
| `10-merchant-history.md` | `GET /txn/merchant` | 200 | 200 | debits only; refused bank sends listed as `PENDING` |
| `11-transaction-by-reference.md` | `GET /transaction/reference/{ref}` | 200, 404 | 200, 404 | **our `CustomerReference` works**; the response's `reference` does not |
| `12-transaction-by-id.md` | `GET /transaction/id/{id}` | 200 | 200 | no fee fields set; merchant now `active` |
| `13-wallet-to-wallet.md` | `POST /transaction/wallet-to-wallet` | 403 | 200, 400, 500 | **works in all three directions, ₦0 fee**, repeat reference refused |
| `14-bank-transfer.md` | `POST /bank/credit`, `/bank/credit/merchant` | 403 | 400, 404 | **refused: "Unable to find customers"**; `CustomerReference` accepted and repeat refused; refused sends leave `PENDING` records |
| `15-freeze-unfreeze.md` | `PATCH /customer/wallet/{id}/freeze`, `/unfreeze` | 403 | 200 | works; **a frozen wallet can neither send nor receive** |
| `16-bills-discos.md` | `GET /billing/discos` | 200 | 200 | unchanged: 22 discos |
| `17-bills-preview-meter.md` | `POST /billing/preview-meter` | 400 | 400 | unchanged: "Http Exception"; free |
| `18-bills-electricity.md` | `POST /billing/electricity` | 403 | 400 | "Unable to find customers"; NOT RUN to a result |
| `19-bills-airtime.md` | `POST /billing/airtime` | 403 | 400 | **minimum ₦100**; then "Unable to find customers"; NOT RUN to a result |
| `20-bills-data.md` | data lists, `POST /billing/data-bundle` | 200 / 403 | 200 / 400 | list unchanged; purchase "Unable to find customers"; NOT RUN to a result |
| `21-bills-cable.md` | cable lists, `POST /billing/cable-subscription` | 200 / 403 | 200 / **201** | purchase: 201 with "service not currently available"; NOT RUN to a result |
| `22-merchant-balance.md` | `GET /merchant/balance` | 200 | 200 | every read of the run in one table; books balance |
| `23-webhooks.md` | webhooks | none | none | NOT RUN: no public URL and no dashboard access |
| `24-auth-and-errors.md` | no key, error shapes | 401, 400, 404 | 401 | new codes: 201, 403 (NIN blacklisted), 404, 500 ECONNRESET |
| `25-compliance-charges.md` | charges | 200 | (table) | BVN ₦5, phone ₦5, selfie ₦10, create ₦0, transfers ₦0 |
| `26-money06-client.md` | the MONEY-06 client, end to end | | 200, 400, 404 | every read call and ₦10 wallet-to-wallet both ways; lookups answer `200 {}` for SUCCESS records too; a timed-out send landed and reconciled as settled |
| `27-money11-balance.md` | `GET /money/wallet/balance` (the route), end to end | | 200, 503 | the route equals Fintava's read after each of two ₦10 sends; a 50 ms timeout answers `503 provider_unreachable`, never 0 |
| `28-kyc01-bvn-check.md` | `POST /money/identity/bvn` (the route) and the client's BVN check | | 400, 422 | Fintava's other documented example BVN (`0003`) is refused too; the route answers `422 bvn_not_confirmed`, charged ₦5, nothing stored, BVN in no log line |

## Money moved in the re-run

- WAWU's merchant wallet: ₦49,960 → ₦49,650. ₦300 to customer A, ₦10 back
  from A, ₦20 of compliance charges (BVN ₦5, phone ₦5, selfie ₦10).
- Customer A ended with ₦250, customer B with ₦40. WAWU + A + B = ₦49,940
  = start minus the ₦20 of charges. No transfer fee was taken anywhere.
- Whole task: ₦60 of sandbox compliance charges (₦40 first run, ₦20 now).

## What the re-run created

Customers (sandbox): A "Ada Sandbox", customerId
`4e8409cf-1234-40f7-963a-5c212c7a9836`, walletId
`3b84eae9-f1d5-4c7f-b5b7-7dfc52185cf7`, account `1154079370`; B "Bayo
Sandbox", customerId `3c672d13-cc4f-4200-bf13-038f21aab06a`, walletId
`bd656a80-6984-4832-9a06-a858f249aec6`, account `1151496137`. Two
customers, the task's limit.

Our references: `OPS02R-W2W-001` (₦300 WAWU to A), `-002` (₦50 A to B),
`-003` (₦10 A to WAWU), `-005` (₦10 B to A), all `SUCCESS`; `-004` and
`-006` refused, no record. `OPS02R-MT-001`, `OPS02R-MT-002` and
`OPS02R-BC-001`: refused bank sends, each left as a `PENDING` record with no
money moved; `OPS02R-BC-002`: refused with 404. Fintava's references and
transaction ids are listed in `13-` and `14-`.

## Identity test values

- BVN: the example printed on Fintava's Verify BVN page (last 4 `8901`).
  The BVN check answers "Invalid BVN or BVN does not exist" for it, the
  selfie check "Request failed with status code 404". `POST
  /create/customer` accepted it (twice), because create does not check it.
- NIN: the same example (`8901`) is refused at create as **"This NIN is
  blacklisted"**. The BVN shown in Fintava's customer-list example (last 4
  `0003`) was accepted as a NIN; create returns `nin: null` either way.
- Phone: test numbers (last 4 `0101`, `0202`) for the customers; the phone
  check says "Phone Number not Found" for `0101`.
- No real person's BVN, NIN or phone was sent. The merchant administrator's
  identity, which Fintava returns inside `GET /transaction/id/{id}`, is
  masked completely in every file.
- So **no BVN, phone or meter value the sandbox knows has been found**
  (question 11).

## Contradictions

Results that disagree with `../naira-api.md`, `../fees.md`, `../limits.md`
or what `DECISIONS.md` assumes. Each is now corrected where it was wrong:
`naira-api.md` (3, 4, 6, 7, 9 and the questions), `fees.md` (2), `limits.md`
(5); 1 was settled by the owner; 8 is filed as `BACKEND_GAPS.md` G-10 for the
tasks that must handle it. `DECISIONS.md` is the owner's and is unchanged.

1. **Wallet-to-wallet was free.** `fees.md` lists ₦23.25 below ₦5,000 and
   R-10 has the buyer pay "Fintava's balance-transfer charge" on every
   purchase. The sandbox took ₦0 in all three directions:
   `transaction_fee: 0`, `platformComm`/`merchantComm`/`lomaCharge` null,
   balances moved by the exact amount (`13-`, `12-`, `22-`). Possibly the
   merchant setting `WalletToWalletDebit: false`. **Settled by the owner**
   (merged from main while this run was being written up, `fees.md`): the
   dashboard rates are final and the sandbox's ₦0 does not change them. So
   this is a sandbox difference to remember when reconciling sandbox
   balances, not a fee change.
2. **Opening a wallet runs no identity check and costs nothing.**
   `fees.md` says opening a wallet "runs a BVN check (₦60) and a NIN check
   (₦70)". In the sandbox `POST /create/customer` cost ₦0, accepted a BVN
   the BVN check rejects, and accepted the same BVN and NIN twice (`07-`,
   `25-`). The checks happen only if our backend calls them: the
   BVN check (KYC-01, ₦5 in the sandbox) and the selfie (KYC-02); there is no NIN check
   endpoint. `fees.md` also says the BVN check "could not run": it now has.
3. **`/bank/credit` does take a `CustomerReference`.** `naira-api.md` says
   a customer's bank transfer "does not take one" and so "can't be looked
   up by our reference". It accepts one, stores it, refuses a repeat
   (`"CustomerReference Already Exists"`) and the lookup finds it (`14-`).
4. **Create customer differs from the docs.** `naira-api.md` lists the NIN
   as required and the docs show `200`. Validation does not require `nin`,
   success is `201` ("User created successfully"), and the response
   returns `nin: null` even when one is sent (`07-`).
5. **New wallets are Tier 2, not Tier 3.** `limits.md` planned that a user
   who finishes "Open your wallet" holds a Tier 3 wallet from day one, so
   the tier-upgrade screens (A17 to A20) might not be needed (corrected
   there by this run). Create with BVN, NIN and address opened `TIER_2` (₦500,000 a day), and
   the selfie is not part of create (`07-`, `08-`). Nothing seen moves a
   wallet to Tier 3 (question 20). `naira-api.md` says a customer's tier is
   "unknown" anywhere: it is in the wallet balance, the customer list and
   the customer by id.
6. **History does not show money received.** `naira-api.md` gives `GET
   /txn?customerId=` and `GET /txn/merchant` as the history. Both list only
   the debits the account made; credits never appear, and `type=CREDIT` is
   ignored (`09-`, `10-`). Received money has to come from webhooks into our
   own records (question 19).
7. **The wallet-to-wallet response is not what the docs say.**
   `naira-api.md`: "The response shows `transaction_fee` and both balances
   after". It shows only the sender's balance after. Its `reference` cannot
   be looked up (it is stored as `tagapayTransRef`), and its
   `customerReference` is Fintava's reference, not ours (`11-`, `13-`).
   `naira-api.md`'s "Identifiers" lists three ids for a customer; there are
   four (`07-`).
8. **A frozen wallet cannot receive.** `naira-api.md` plans freeze "for
   fraud holds and for the 30-day account deletion window (R-17)". A frozen
   wallet refuses incoming transfers too (`15-`), so R-11 ("earnings land
   in the wallet automatically") and R-19 refunds cannot pay into it: that
   money has to wait in WAWU's merchant wallet until the wallet is
   unfrozen. Filed as `BACKEND_GAPS.md` G-10 (MONEY-18, WALLET-16,
   SETTINGS-06); no ruling changed.
9. **A refused bank send can still leave a record.** Nothing in the docs or
   `naira-api.md` says so: a `400 "Unable to find customers"` wrote a
   `PENDING` debit record with our reference, moved no money, and used the
   reference up; 37 minutes later it was still `PENDING` (`14-`), and from
   10:27 UTC the lookup by reference answered `200 {}` while the history
   still listed it (verifier's calls). MONEY-16's
   ledger check must allow for these.

## Answers to the questions in `../naira-api.md`

1. **Does `/bank/credit` accept a `CustomerReference`; are duplicates
   refused?** **Yes and yes** (`14-`): stored, findable by
   `/transaction/reference/{ours}` at first (a refused send later answers
   `200 {}` there, see below), and a repeat is `400 "CustomerReference
   Already Exists"`. Wallet-to-wallet refuses a repeat too ("customerReference
   already exists"). Catch: a refused bank send uses up its reference and
   leaves a `PENDING` record; a refused wallet-to-wallet send does not. And
   that record later becomes invisible by reference: the verifier's lookups
   at 10:27:45, 10:27:46 and 10:28:11 UTC answered **200 with `{}`** while `/txn/merchant` still
   listed the send as `PENDING`. MONEY-06 must never read `{}` as "not
   found, safe to retry with the same reference"; reconcile from history.
2. **A hold or lien on a customer wallet?** Unknown; none published. Freeze
   is not one: it stops money in as well as out (`15-`). Plan unchanged
   (R-19).
3. **`lomaCharge`, `charges`, merchant charges.** Partly: on
   wallet-to-wallet all fee fields were 0 or null (`12-`, `13-`); no bank
   send or bill has gone through, so `lomaCharge` and `charges` are still
   unseen there. Measured compliance charges: BVN ₦5, phone ₦5, selfie ₦10,
   all charged on failure (`25-`).
4. **Tiers.** Partly: `POST /create/customer` opens **`TIER_2`**; the tier
   is shown by the wallet balance, the customer list and the customer by id,
   not by the create response (`07-`, `08-`). How a wallet reaches Tier 3:
   unknown. No limit error seen.
5. **Licence wording for Loma Bank.** Unknown (not an API question).
6. **Selfie result; liveness.** Partly, unchanged: a failure is `400
   ["Request failed with status code 404"]` and costs ₦10. Success needs a
   BVN the sandbox knows.
7. **Electricity token and units.** Unknown: the purchase is refused with
   "Unable to find customers" (`18-`).
8. **Rate limits.** Unknown. No headers and no 429 in 82 calls over 7.5
   minutes (`24-`).
9. **Cardex NGN treasury.** Unknown; not something the Naira sandbox shows.

### Questions raised by the sandbox

10. ~~Please activate WAWU's sandbox merchant.~~ **Done**: active since
    09:22 UTC on 2 Oct 2026.
11. Which BVN, NIN, phone, meter and smartcard numbers does the sandbox
    accept as test values? (The documented example BVN is unknown to the
    BVN check and blacklisted as a NIN.)
12. What do the merchant settings `KycFee` (50.00), `DebitKycFee`,
    `WalletToWalletDebit`, `DebitStaticWallet`, `staticWalletFee`,
    `staticWalletCapFee` and `splitstatus` do, and which should WAWU turn
    on?
13. Why do `GET /transaction/id/{id}` and the freeze and unfreeze responses
    return the customer's BVN, NIN, date of birth, address and login record,
    and can they stop?
14. Is the about-5-minute cache on `/txn/merchant` deliberate, and does
    `/txn` do the same? (Not re-tested.)
15. Ikeja has two prepaid codes (`Ikeja_Electric_Bill_Payment`,
    `Ikeja_Token_Purchase`): which one?
16. Does a wallet-to-wallet payment from a customer into WAWU's merchant
    wallet count toward the customer's tier daily limit? (Added by MONEY-04
    on main; WAWU counts it until Fintava says otherwise.)
17. **New.** Why do bank sends and the airtime, data and electricity
    purchases answer `400 "Unable to find customers"`, and the cable
    purchase `201 "service not currently available"`? What is missing on
    WAWU's sandbox merchant?
18. **New.** Why does the sandbox charge ₦0 for wallet-to-wallet (is it
    `WalletToWalletDebit: false`)? The owner has ruled the dashboard rates
    (₦15.75 to ₦23.25) final, so this only affects sandbox reconciliation.
19. **New.** Why do `/txn` and `/txn/merchant` list only debits? How do we
    list money a wallet received?
20. **New.** How does a customer wallet move from `TIER_2` to `TIER_3`
    (after the selfie check, from the dashboard, or by an API call), and
    does create always open `TIER_2`?
21. **New.** A refused bank send leaves a `PENDING` record and uses up its
    `CustomerReference`; later the lookup by reference answers `200 {}`
    while `/txn/merchant` still lists it as `PENDING`. Will those records
    ever resolve, why does the lookup go empty, and how should we retry?
22. **New.** `POST /create/customer` returns `nin: null` even when a NIN is
    sent. Is the NIN stored?

## Tier questions in `../limits.md`

- Which tier does `POST /create/customer` open? **`TIER_2`** (both test
  customers, opened with BVN, NIN and address; `07-create-customer.md`).
- Does the response show it? **Not the create response.** The wallet
  balance (`data.tier`), the customer list and the customer by id
  (`wallet.tier`) do (`08-wallet-balance.md`, `07-`).
- Any limit errors? **None seen**; the largest amount moved was ₦300.

## Running these again

Read `FINTAVA_API_KEY` with `sed -n 's/^FINTAVA_API_KEY=//p'` (never
`source` the file: the key contains `$`), call only the sandbox host, and
save each call here in the same format: request with `Authorization: Bearer
***`, full response, BVN, NIN and phone numbers cut to their last 4 digits,
emails cut to the domain, the merchant administrator's identity masked
completely. Reuse customers A and B rather than creating more.
