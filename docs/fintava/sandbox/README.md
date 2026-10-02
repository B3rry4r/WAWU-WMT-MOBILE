# Fintava sandbox calls (OPS-02)

Real calls to Fintava's sandbox, `https://dev.fintavapay.com/api/dev`, made on
2 Oct 2026 between 08:28 and 08:38 UTC with the sandbox key (the key is never
written here; it is `Bearer ***` in every file). No other host was called.
Each file holds the exact requests, the full responses (masked) and what they
told us that the published docs (`../reference/`) did not.

## The blocker

**WAWU's sandbox merchant is `inactive` on Fintava's side.** Every call that
creates a customer, reads a customer, checks a BVN, moves money, pays a bill
or freezes a wallet answers:

```json
{"status":403,"timestamp":"...","message":["Merchant is not active"],"path":"..."}
```

The check runs before Fintava reads the body, so these calls taught us
nothing about validation either. The merchant's own record, which Fintava
embeds in `GET /transaction/id/{id}` (`12-transaction-by-id.md`), shows
`status: "inactive"`, `kycComplianceIndicator: "APPROVED"`, `mode:
"SANDBOX"`, business name "Test Account4", account `1102038668`.

**Unblocked when** Fintava (or the owner, if the dashboard offers it) sets the
sandbox merchant to active, so that `POST /create/customer` stops answering
`403 Merchant is not active`. Then re-run the rows marked NOT RUN below; each
file lists what to run.

What works while inactive: bank list, both name enquiries, phone check,
selfie check, merchant balance and history, transaction lookups, customer
history and wallet balance lookups (as "not found"), every bills list, meter
preview.

## The calls

| File | Call | HTTP | Result |
|---|---|---|---|
| `01-bank-list.md` | `GET /banks` | 200 | 358 banks, no paging; Loma Bank is `090620` |
| `02-name-enquiry-external.md` | `GET /name/enquiry` | 200 | sandbox stub name; free |
| `03-name-enquiry-internal.md` | `GET /loma-name/enquiry` | 200 | WAWU's own account; free |
| `04-bvn-check.md` | `GET /compliance/verify/bvn` | 403 | NOT RUN to a result (merchant inactive) |
| `05-bvn-selfie.md` | `POST /compliance/verify/bvn/selfie` | 400 | upstream 404; **charged ₦10** anyway |
| `06-phone-check.md` | `GET /compliance/verify/phone-number` | 400 | "Phone Number not Found"; **charged ₦5** anyway |
| `07-create-customer.md` | `POST /create/customer` (+ customer reads) | 403 | NOT RUN (merchant inactive); 0 customers created |
| `08-wallet-balance.md` | `GET /customer/wallet/balance/{walletId}` | 400 | unknown wallet is 400, not 404 |
| `09-customer-history.md` | `GET /txn?customerId=` | 404 | "Customer not found" (no customer exists) |
| `10-merchant-history.md` | `GET /txn/merchant` | 200 | works, but **cached about 5 minutes** |
| `11-transaction-by-reference.md` | `GET /transaction/reference/{ref}` | 200, 404 | works |
| `12-transaction-by-id.md` | `GET /transaction/id/{id}` | 200 | unknown id is 200 with `data: null`; embeds BVN and NIN |
| `13-wallet-to-wallet.md` | `POST /transaction/wallet-to-wallet` | 403 | NOT RUN (merchant inactive), all three directions |
| `14-bank-transfer.md` | `POST /bank/credit`, `/bank/credit/merchant` | 403 | NOT RUN (merchant inactive): success, failure, reversal |
| `15-freeze-unfreeze.md` | `PATCH /customer/wallet/{id}/freeze`, `/unfreeze` | 403 | NOT RUN (merchant inactive) |
| `16-bills-discos.md` | `GET /billing/discos` | 200 | 22 discos, postpaid included, minimums vary |
| `17-bills-preview-meter.md` | `POST /billing/preview-meter` | 400 | made-up meter: "Http Exception"; free |
| `18-bills-electricity.md` | `POST /billing/electricity` | 403 | NOT RUN (merchant inactive) |
| `19-bills-airtime.md` | `POST /billing/airtime` | 403 | NOT RUN (merchant inactive) |
| `20-bills-data.md` | `GET /billing/data-bundles/{n}`, `POST /billing/data-bundle` | 200 / 403 | lists work (9mobile is `ETISALAT`); purchase NOT RUN |
| `21-bills-cable.md` | `GET /cable-service-name[/{n}]`, `POST /billing/cable-subscription` | 200 / 403 | GOTV and DSTV only; purchase NOT RUN |
| `22-merchant-balance.md` | `GET /merchant/balance` | 200 | returns `tier: "TIER_3"` |
| `23-webhooks.md` | webhooks | none | NOT RUN: no public URL here, and nothing could fire |
| `24-auth-and-errors.md` | no key, wrong keys, error shapes | 401, 400, 404 | wrong key is 400 without `live_`, 404 with it; two error shapes |
| `25-compliance-charges.md` | balance read around each check | 200 | phone ₦5, selfie ₦10, the rest free |

About 100 requests in all (most of them the cache test in `10-`). Money
spent: ₦40 of sandbox compliance charges, from ₦50,000 to ₦49,960. Nothing
else moved.

## Identity test values

- BVN: the example printed on Fintava's Verify BVN page
  (`../reference/verify-bvn.md`, last 4 `8901`), used for the BVN check, the
  selfie check and the create-customer attempt (also as the NIN). The BVN
  check and create were refused by the merchant gate; the selfie check got
  "Request failed with status code 404". **No value was accepted yet**; which
  test BVN and NIN the sandbox accepts is still to find once the merchant is
  active (ask Fintava for their sandbox test identities).
- Phone: the number in Fintava's documentation example (last 4 `5863`) and a
  test number (last 4 `0101`): both "Phone Number not Found".
- No real person's BVN or NIN was sent. One real person's BVN and NIN were
  **received**: Fintava returns the merchant administrator's identity inside
  `GET /transaction/id/{id}`. They are masked completely in
  `12-transaction-by-id.md`.

## Answers to the questions in `../naira-api.md`

1. **Does `/bank/credit` accept a `CustomerReference`; are duplicates
   refused?** Unknown. The merchant gate answers before validation, even for
   a body holding only `CustomerReference` (`14-bank-transfer.md`). Partial
   evidence: every transaction record has a `CustomerReference` field
   (`10-`, `11-`, `12-`).
2. **A hold or lien on a customer wallet?** Unknown; no such endpoint is
   published, and no customer wallet could be made to look for one. Plan
   unchanged: WAWU's merchant wallet (R-19).
3. **`lomaCharge`, `charges`, merchant charges.** Partly answered. A full
   transaction record (`12-transaction-by-id.md`) carries `platformComm`,
   `merchantComm` and `lomaCharge`; a dashboard merchant charge most likely
   lands in `merchantComm`. Unconfirmed: no transfer ran. Measured
   compliance charges: phone check ₦5, selfie ₦10, charged even on failure
   (`25-compliance-charges.md`).
4. **Tiers.** Partly answered. The API does report a tier:
   `GET /merchant/balance` returns `"tier": "TIER_3"` for WAWU
   (`22-merchant-balance.md`). Which tier `POST /create/customer` gives, and
   whether its response shows it: unknown (403). No limit error was seen.
5. **Licence wording for Loma Bank.** Unknown (not an API question). The API
   names the bank `LOMA BANK` (code `090620`) in the bank list and `Loma Bank`
   in `senderBank`/`receiverBank`.
6. **Selfie result; liveness.** Partly answered. A failed check is `400
   ["Request failed with status code 404"]` and still costs ₦10. The success
   shape is unknown; nothing suggests liveness.
7. **Electricity token and units.** Partly answered. The transaction record
   has `metertoken`, `meternumber` and `discoRef` fields, so the token can be
   read back by transaction id. The purchase response is unknown (403).
8. **Rate limits.** Unknown. No rate-limit headers, no 429 in about 100
   calls over 10 minutes (`24-auth-and-errors.md`).
9. **Cardex NGN treasury.** Unknown; not something the Naira sandbox shows.

### New questions from the sandbox

10. Please activate WAWU's sandbox merchant ("Test Account4"); it is
    `inactive` and every customer, transfer and bill call is refused.
11. Which BVN, NIN, phone and meter numbers does the sandbox accept as test
    values?
12. What are the merchant settings `KycFee` (50.00), `DebitKycFee`,
    `WalletToWalletDebit`, `DebitStaticWallet`, `staticWalletFee`,
    `staticWalletCapFee` and `splitstatus`, and which should WAWU turn on?
13. Why does `GET /transaction/id/{id}` return the customer's BVN, NIN and
    login record, and can it stop?
14. Is the about-5-minute cache on `/txn/merchant` deliberate, and does
    `/txn` (customer history) do the same?
15. Ikeja has two prepaid codes (`Ikeja_Electric_Bill_Payment`,
    `Ikeja_Token_Purchase`): which one?

## Tier questions in `../limits.md`

- Which tier does `POST /create/customer` open? **Unknown** (403).
- Does the response show it? **Unknown** for a customer. The merchant
  balance response does show one (`tier: "TIER_3"`), so a tier field exists
  in the API.
- Any limit errors? **None seen**; no call got far enough to hit one.

## Running these again

Load `FINTAVA_BASE_URL` and `FINTAVA_API_KEY` from the backend's local
`.env` (never committed), call only the sandbox host, and save each call
here in the same format: request with `Authorization: Bearer ***`, full
response, BVN, NIN and phone numbers cut to their last 4 digits, emails cut
to the domain.
