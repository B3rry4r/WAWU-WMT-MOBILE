---
id: NUV-06
title: Send to a bank and pay out, with the account name check
owner: YOU
area: MONEY
order: 205
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [NUV-01, WALLET-14]
decisions: [R-39, R-42, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-06 · Send to a bank and pay out, with the account name check

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `guides__send-a-payout.md`, `api-reference__bank-codes.md`, `api-reference__counterparties.md`, `api-reference__payment-details.md`, `api-reference__transfers.md`, `errors.md` (the account details resolution group); SANDBOX-FINDINGS item 7

## Goal

A person can send to any Nigerian bank account, and withdraw to their payout account, after seeing the account
holder's name; WAWU can pay out from its operational account. All of it as Nuvion NIP payouts.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- WALLET-09 (todo, send to a bank): rewired; built on the seam, Nuvion moves the money.
- WALLET-14 (done, saved recipients and payout account): rewired; bank codes come from Nuvion's list, and the name check is Nuvion's `POST /counterparty-lookups`.

## Scope

- `src/nuvion/areas/payouts.ts`: `listBanks` (`GET /bank-codes/NG`); `checkAccountName` (`POST /counterparty-lookups` with `country: NG`, the account number and the bank code; answers the holder's name; the resolution errors mapped); `bankTransfer` from a person or from the operational account: `POST /counterparties`, `POST /payment-details` (`bank-transfer`, NGN, NG, bank code, account number, holder name), then `POST /transfers` (`payment_type: bank-transfer`, `unique_reference`). Counterparty and payment-detail ids are kept on the beneficiary and payout-account rows (new nullable columns) and reused.
- `src/nuvion/handlers/outflows-bank.ts`: bank sends' outcomes; `reconcileSend` and `decideRetry` for bank sends.
- Saved rows made under Fintava's bank codes are matched to Nuvion's list by code, else by bank name, and checked by name again before their first Nuvion send.
- Not in scope: the routes (`POST /money/banks/name-check`, `POST /money/transfers/bank`: WALLET-09, WALLET-14).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] A person can check a 10-digit account at a bank from Nuvion's list and see the holder's name; not found, bank not supported, bad format and a timeout each give their own clear answer and nothing is sent.
- [ ] A send to a bank goes once per reference, also when tapped twice or retried after a lost answer (V8); a second send to the same account reuses its counterparty.
- [ ] A bank send's `outflows.completed`, `.failed`, `.cancelled` and `.refunded` reach the ledger once; a failed send gives the money back once.
- [ ] A payout from WAWU's operational account to a creator's payout account goes once and reaches the ledger once.
- [ ] An account saved in the Fintava days is checked by name before its first Nuvion send.
- [ ] (key) `POST /counterparty-lookups` works with an API key for a sandbox test account (SANDBOX-FINDINGS item 7); if it does not, the report says so and names what unblocks it.

## Builder report

Builder, 11 Oct 2026 (Sonnet agent). wawu-backend `wmt/NUV-06` `df853dd` (built on main `020f055`, MONEY-18 merged; main `f2b6bf6`, BILLS-01 round 4, merged in at the end, no conflict); mobile `wmt/NUV-06` (this file, on main `3b35731`). Nuvion is stood in at `WALLET_PROVIDER` in every spec and run (`test/nuvion/payouts-standin.ts` over NUV-01's and NUV-04's stand-ins, from the docs' own examples): no Nuvion, Fintava, Flutterwave or wawuafrica.com host was called (every NUV spec runs under the outbound guard; the built runs ran in a private network namespace with loopback only, and a preload turned `api.nuvion.dev` into the stand-in and logged any other host: none).

**Built (backend; one additive migration, no route, contract unchanged)**
- `src/nuvion/areas/payouts.ts` (NUV-06's area): `listBanks` (`GET /bank-codes/NG`, kept an hour, one fetch at a time, an empty or unreadable list is never "no banks"); `checkAccountName` (`POST /counterparty-lookups` with `country: NG`, the number and the bank code; each way it ends is its own `outcome`: `matched`, `not_found`, `bank_not_supported` (also a code not in Nuvion's list, nothing asked), `bad_format` (not ten digits, nothing asked), `multiple_matches`, `timeout` (Nuvion's own timeout, its lookup service down, or our deadline); the key, the rate limit and a 5xx are thrown); `bankTransfer` from a person (their one naira account, found by `GET /accounts?entity_id=`) or from the operational account (no entity): the payee first (a counterparty and a bank payment detail, found by a marker in `meta` before one is made, adopted when the answer to a create was lost, reused from the ids the caller kept after Nuvion confirms the payment detail is this very account), then `POST /transfers` with `payment_type: bank-transfer` and our reference as `unique_reference`; plus the reads the handler and the reconciliation use (`getTransfer`, `getPaymentDetail`, `operationalBan`, `findTransferByReference`).
- `src/nuvion/handlers/outflows-bank.ts` + `payouts.handler.ts` (NUV-06's handler file, filled): `outflows.completed`, `.failed`, `.cancelled`, `.refunded` for bank transfers, each re-fetched (`GET /transfers/{id}`) and compared with the delivery before anything is written; then the ledger takes Nuvion's RECORD, not the event's name (`successful` completed, `failed` failed, `reversed` reversed, `pending`/`processing` waits), one `out` row keyed on Nuvion's transfer id and our `unique_reference`, on the person's wallet or on WAWU's operational account (named by its `nuvion_ban`, as NUV-05 names it). Also `reconcileBankSend` and `decideBankRetry` (the bank sends' `reconcileSend` and `decideRetry`).
- The seam (additive, optional): `ProviderPayee`, `payee` on `ProviderBankTransferInput` and `ProviderTransferReceipt`, `outcome` on `ProviderAccountName`. `BankAccountCheckService` gives each outcome its own sentence (still `422 name_check_failed`; a timeout is `503 provider_unreachable`; Fintava keeps its one). `SavedAccountTargetService` (provided by `MoneyModule`): a row saved in the Fintava days is matched to Nuvion's list by code, else by exact bank name (one match), checked by name through Nuvion, and stamped (`nuvionBankCode`, `nuvionCheckedAt`) before its first Nuvion send; a changed name is `name_changed` (shown, not sent to); the payee ids a send made are kept (`rememberBeneficiaryPayee`, `rememberPayoutPayee`) and handed back; saving a different payout account clears them.
- Migration `20261021170000_payout_nuvion_ids`: nullable columns on `MoneyBeneficiary` (4) and `MoneyPayoutAccount` (6: the person's pair and WAWU's operational pair). The adapter gains `get payouts()`. `scripts/nuvion/counterparty-lookup-check.ts` is the (key) check, sandbox only.

**Capability checks**
1. A person can check a 10-digit account and see the holder; not found, bank not supported, bad format and a timeout each give their own answer and send nothing: **passed** (stand-in). `nuvion-payouts.spec.ts` (every outcome from Nuvion's `error_resolution_*` types, from our own checks and from a deadline or a cut connection; the requests that moved money are counted: none), `nuvion-payouts.contract.spec.ts` (the money layer's four sentences and the 503), and over HTTP on the built Hub (`PUT /money/payout-account`, 6 outcomes; a number that is not ten digits is stopped earlier by the route's own validation, 400).
2. A send goes once per reference, tapped twice, at once or retried after a lost answer (V8); a second send to the same account reuses its counterparty: **passed.** Unit: three at once, a repeat, a repeat with the ids lost (the payee is found by its marker, nothing made twice), ids that are not this account are never used, a counterparty or payment detail made whose answer was lost is adopted, a conflict for a repeated reference answers the original only when it is this very send (a different amount, another payee or a failed original is `duplicate_reference`, never a receipt). Built: three processes sent one reference at once: one transfer, one counterparty, Nuvion's balance moved once; a lost answer was `outcome_unknown` (`recordMayExist`, request sent), found again by its reference with no request made, and asked to send again it was still one transfer; a send cut before it arrived reads `unknown / too_soon`, never `absent`.
3. `outflows.completed`, `.failed`, `.cancelled`, `.refunded` reach the ledger once; a failed send gives the money back once: **passed.** Contract spec (real receiver, dispatcher, handler, ledger): each event, a replay, the same send under another event id, two at once, a late event that disagrees with the record (the record wins; a completed row is never failed, a reversed one stays reversed), a pending record waits and is recorded once it settles, a delivery whose figures differ from Nuvion's record records nothing, partial refund / no named send / a send Nuvion still shows as completed are stops, a card refund and a book transfer are left alone. Built: the same on two Hubs (6231 and 6234), deliveries to both at once, the Hub's own 30-second sweep: one row each; a failed send put the money back in Nuvion's `available` and left one failed row.
4. A payout from WAWU's operational account to a creator's payout account goes once and reaches the ledger once: **passed.** Unit, contract and built (tapped twice at once from two processes: one transfer; WAWU's account paid the amount and Nuvion's charge once, R-31; one `merchant` ledger row, named by the account's `nuvion_ban`).
5. An account saved in the Fintava days is checked by name before its first Nuvion send: **passed.** Contract (by code, by name, no bank match, not found, changed name, timeout, checked once, someone else's row) and built (a Hub application context, the real service).
6. (key) `POST /counterparty-lookups` works with an API key: **NOT RUN** (below).

**Decisions (Default (agent), owner may override)**
1. The name check's request body (`country`, `account_number`, `bank_code`) is the task's own words and its answer's field (`account_name`, also read as `account_holder_name` or `holder_name`) is a guess: the endpoint is not in Nuvion's public docs (R-39 names it from Nuvion's dashboard code). The stand-in encodes the same guess, so only the sandbox settles it.
2. A counterparty is made as an individual: first and last name split from the bank's name for the account (one word is used twice), `relationship: vendor`, a marker in `meta`; no address, email or phone (WAWU holds none for a payee). Whether Nuvion requires them is unconfirmed.
3. A failure before the transfer (the account list, the payee) is `unavailable` with `requestNotSent` and `recordMayExist` false: nothing that moves money was sent, so the send is asked again under the same reference (MONEY-18's reading), never an unknown outcome. The transfer's own failures are the client's: `outcome_unknown` for a lost answer or a 5xx, `requestNotSent` only for a connection that never opened.
4. A repeated reference returns the original (docs): it is the receipt only when it is this send (same amount, account, bank transfer, not failed, and a payment detail that names this very account, which also covers two first sends at once each making their own payee); otherwise `duplicate_reference`.
5. `decideBankRetry` never advises a resend for silence (`absent` waits: lead ruling 1, MONEY-17 D1); only a record that says `failed` allows a new reference. Resending under the same reference would be safe once the sandbox shows Nuvion returns the original; NUV-08 can widen it then.
6. The ledger takes Nuvion's record; a sighting never overwrites the figures the sending feature quoted (`figuresStand`: Nuvion's charge plus WAWU's fee on top, R-10), only the amount is compared. `totalKobo` of a receipt is the amount plus Nuvion's own charge (whether Nuvion nets the fee is a (key) fact); WAWU's fee is its own movement (WALLET-09).
7. `outflows.refunded` is documented only for card payments; a bank send's return is read the same way (`meta.source_payment_id` names the original, which must itself be `reversed` and be given back in full). An unnamed or partial one is a stop for review. Unconfirmed until the sandbox shows a bank return.
8. The operational side of the ledger is named by the operational account's `nuvion_ban` (read from `GET /accounts/{id}`), the same value NUV-05's `getPlatformAccount().accountNumber` carries.
9. A bank send's lookups (`reconcileBankSend`, `decideBankRetry`) are not wired into the adapter's `reconcileSend` / `decideRetry`: NUV-05 owns those lines until NUV-08 widens them (SHARED-CHANGES NUV-06 #2 says how). NUV-05's book area answers a bank send's reference `unknown / unrecognised`, never `absent`.
10. Messages: four sentences for the name check, one `BANK_SEND_FAILURE_REASON` ("The bank did not complete this transfer."): no provider name, no em-dash.

**Runs** (load average 14 to 24 from other sessions throughout)
- `npx tsc --noEmit` 0. `eslint --no-fix` on the 16 changed `.ts` files: 0 errors, 0 warnings; prettier clean.
- New specs: `nuvion-payouts.spec.ts` 49/49, `nuvion-payouts.contract.spec.ts` 24/24 (fresh migrated `bn06_spec_test`).
- Specs in a private network namespace (loopback only; a mock WAWU ID on :4001 inside it) on a fresh migrated and seeded `bn06_ns_test`, one jest process: `src/nuvion`, `src/wallet-provider`, `src/money`, `src/account-purge` (the purge map), `src/data-export-request` and `src/about` on `6ca82fb`: 78 suites, 2,710 tests, 76 suites pass. `receipt-units` fails (the Unicode digit table against this Node's runtime, and the 300 ms drawing bound under load) with the same tests failing on main `020f055` in the same namespace; `wallet-payment.contract` R7-1 failed once under load 17 to 24 and passes alone (the whole file passes alone in the namespace, and it passed on main). On the final head `df853dd`: `src/nuvion`, `src/wallet-provider`, `src/money/saved-accounts`, `src/account-purge`, `src/data-export-request`: 20 suites, 1,301 tests, all pass.
- Protected suite `run.sh --fresh HEAD`, lock origin/main `020f055`: 253/253, "all 244 required tests passed".
- Gates: main 16 fail / 95 warn / 76 accepted, branch 16 / 95 / 76; the 16 FAIL lines identical (two comments of mine used "belongs to", which the deferrals gate reads as an ownership deferral; reworded); `check_baseline` OK. Tripwire: no fee or price figure added.
- `npm run contract:build` twice: `contract/openapi.json` byte-identical both times and to main's committed file (sha256 `abca1768...ff968c`). No contract sync into this repo is needed.
- Built Hubs (`dist`, `WALLET_PROVIDER=nuvion`, two processes on :6231 and :6234, mock WAWU ID :6232, the stand-in :6233, three sender processes): 38/38 checks (above). No ERROR line, no key or webhook secret in either Hub log.
- Mutants (24, each applied alone in a separate worktree, the two NUV-06 specs run, the file put back from a copy): 22 killed at once; one survived (M19, a payout account at the same bank with another number keeping the old ids) and one anchor matched twice (M21, a pending transfer recorded before it settles); a test was added for the first and the anchor made exact, and both are killed: **24 of 24**. Harness: `nuv06/mutate.py` in the lead's scratchpad.
- The whole backend suite as deploy.yml runs it (`jest --runInBand --forceExit`), as three serial `--shard=i/3` passes in the namespace (one in-band process is killed for memory with other sessions on the machine), fresh migrated and seeded `bn06_full_test`, on `6ca82fb` (the later commits touch `transferProblem`'s entity check, a test and main's merge): 276 suites, 7,881 tests, 7,831 passed, 4 skipped, 46 failed in 5 suites, none a file this task changed: `marketplace-save.contract` (6) and `shop.contract` (23) hard-code the database `wawu_hub_test`, which this agent may not create (NOT RUN: they need it; unblocked by a session whose brief allows that database); `hub-rate-limits` (11) needs a non-loopback interface and passes 22/22 on the host network; `receipt-units` (4) as above; `fintava-stall` (2, timing under load 17 to 33) passes 120/120 alone, on this branch and on main.
- Mobile `npm run gates` and `npm run tasks`: `npm run gates` EXIT 0 (0 fail, 5 warn, 0 accepted) and `npm run tasks` EXIT 0 (275 tasks), both run after the last edit of this file.

**Gaps and shared changes filed:** BACKEND_GAPS G-660 (what WALLET-09 builds on: the target service, the payee ids, the `name_changed` confirm path, the fee total), G-661 (the name check's sentences), G-662 (what the sandbox must settle); SHARED-CHANGES NUV-06 #1 (the migration), #2 (routing a bank send's lookups at merge with NUV-05, or NUV-08), #3 (the seam members and the module line), #4 (contract unchanged).

**Findings for others.** (a) A person who saved an account under Fintava and saves it again under Nuvion's code gets a second row (the key is bank code plus number), so the list shows it twice until the old one is removed. (b) Re-saving the same bank and number returns the same row, so a `name_changed` account cannot be confirmed except by removing and adding it (G-660 d). (c) The money-moving gates (`@RequireFeesSet`, `assertMayMove`) belong to the send route (WALLET-09); `bankTransfer` itself sends whatever it is asked.

**NOT RUN**
- (key) `POST /counterparty-lookups` works with an API key for a sandbox test account (SANDBOX-FINDINGS item 7; the file was lost, so item 7 was read from the task, R-39 and Nuvion's errors page): unblocked when a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then `scripts/nuvion/counterparty-lookup-check.ts` (it prints the NAMES of the answer's fields and the outcome the area reads). It also settles decisions 1, 2, 4 and 6, 7 above, and whether a repeated `unique_reference` returns the original with a 2xx or a 409 body, whether `GET /transfers` lists newest first (`pagination.order`), the unit of an NGN `amount` (kobo assumed), and whether `error_transfer_beneficiary_name_too_long` has a limit we should cut to.
- A real Nuvion `outflows.*` delivery and a real bank return (`outflows.refunded` for a bank send): NUV-10 (the webhook) and the sandbox.
- A real bank send's settle time and fee: needs the key and Nuvion's NGN fees and limits (NUV-07, NUV-10).

## Verifier report

## Owner sign-off
