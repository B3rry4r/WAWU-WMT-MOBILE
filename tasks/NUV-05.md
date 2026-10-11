---
id: NUV-05
title: Pay from the wallet and held money: book transfers and WAWU's operational account
owner: YOU
area: MONEY
order: 204
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [NUV-01]
decisions: [R-39, R-42, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-05 · Pay from the wallet and held money: book transfers and WAWU's operational account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `guides__send-a-payout.md` (Nuvion Direct book transfers), `api-reference__transfers.md`, `core-concepts__accounts.md` (operational accounts), `webhooks__event-types.md`; SANDBOX-FINDINGS item 9

## Goal

Every payment from a wallet to WAWU, every release from WAWU to a person, every refund and every send between two
people moves as a Nuvion book transfer, and money held between payer and payee sits in WAWU's operational account
on Nuvion (R-42, which takes the place of R-19's Fintava merchant wallet).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- MONEY-17 (todo, pay from wallet): rewired. Its branch must go through `WALLET_PROVIDER` (`walletToWallet`, `getPlatformAccount`, `reconcileSend`; MONEY-20 finding 3); this task makes those move money on Nuvion.
- MONEY-18 (todo, hold, release and refund): rewired; WAWU's operational account is the holding account.
- WALLET-07 (send to a WAWU user), WALLET-16 (earnings land) and WALLET-17 (hosts' shares): rewired; they call the seam and move by book transfer.

## Scope

- `src/nuvion/areas/book.ts`: `walletToWallet` (`POST /transfers`, `payment_type: book-transfer`, the receiver's `nuvion_ban`, our reference as `unique_reference` (at most 64 characters), the payer's `entity_id`; WAWU's own movements leave from the operational account); `getPlatformAccount` (`NUVION_OPERATIONAL_ACCOUNT_ID`, `balance.available`); `findTransactionById`; `findTransactionByReference` (Nuvion has no lookup by our reference: we store Nuvion's id, and a resend of the same `unique_reference` returns the original transfer, never a second one); `reconcileSend`, `decideRetry` and `confirmMovement` for book transfers.
- `src/nuvion/handlers/outflows-book.ts`: `outflows.created`, `.completed`, `.failed`, `.cancelled` and `.refunded` for book transfers, re-fetched before acting.
- Not in scope: bank payouts (NUV-06); the payment routes themselves (MONEY-17, MONEY-18).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] A payment from a person's wallet to WAWU's operational account moves once, also when the same reference is sent twice or twice at once (the stand-in returns the original) (V8).
- [ ] A release from the operational account to a person, and a refund to the payer, each move once and reach the ledger once.
- [ ] A transfer whose answer is lost is found again by its reference and never sent again under a new reference.
- [ ] `outflows.failed`, `.cancelled` and `.refunded` reverse the ledger entry once; a replayed delivery changes nothing.
- [ ] After a run of payments, releases and refunds on the stand-in, the ledger's figure for the operational account equals the stand-in's `available` balance (V8: ledger equals provider).
- [ ] A payer without the amount plus fee gets MONEY-19's shortfall answer and no transfer is sent.
- [ ] (key) A sandbox book transfer between two child accounts and from a child to the operational account, by `nuvion_ban` (confirms SANDBOX-FINDINGS item 9).

## Builder report

Builder (Sonnet 5.5 session, the lead's brief for PLAN-PAY wave 2), 11 Oct 2026. wawu-backend `wmt/NUV-05` `3b6ebe5` (backend main `020f055` merged in); this repo `wmt/NUV-05` (mobile main `3b35731` merged in; this file, the SHARED-CHANGES and BACKEND_GAPS rows, LOG). Nuvion is stood in everywhere: no Nuvion, Fintava, Flutterwave or wawuafrica.com host was called. Every NUV spec refuses a non-loopback connection (`test/nuvion/outbound-guard.ts`), and the built Hubs ran behind a preload that sends `api.nuvion.dev` to the local stand-in and logs any other host (the log is empty). SANDBOX-FINDINGS and NUVION-RESEARCH were lost in a container restart: I built from the public docs fetched on 11 Oct (`llms-full.txt`), the NUV-01 to NUV-04 reports, the MONEY-17 to MONEY-19 reports (the verifier's account of the dashboard code: the receiver by `nuvion_ban`) and the stand-in. What I could not confirm is listed under NOT RUN.

**Built** (backend, additive: one table and migration `20261021160000_nuvion_book_transfers`; no route, no contract change, `contract/openapi.json` byte-identical to main):
- `src/nuvion/areas/book.ts` (NUV-05's area). `getPlatformAccount` reads WAWU's operational account (`GET /accounts/{id}`, no entity; its `nuvion_ban` and `balance.available`, never cached, never a sum of our rows). `walletToWallet` is `POST /transfers`, `payment_type: book-transfer`, the receiver by `nuvion_ban`, our reference as `unique_reference` (at most 64), `narration` (at most 100), the payer's `account_id` and `entity_id` (WAWU's operational account sends with none), the amount in kobo as Nuvion takes it; it answers a receipt only for a transfer Nuvion reports `successful` (SHARED-CHANGES MONEY-17 #1), reads a `pending` one again for under four seconds, and then answers `not_confirmed`; a lost answer is `outcome_unknown`; Nuvion's own refusals pass through (insufficient funds, inactive account, its three limits). `isSameAccount` (MONEY-17 R5-1: an account number, id and `nuvion_ban` in any case name one account). For book transfers: `findTransactionByReference`, `findTransactionById`, `reconcileSend`, `decideRetry`, `confirmMovement`, `secondaryReferenceOf`.
- `src/nuvion/areas/book-store.ts` and the table `NuvionBookTransfer`. Nuvion has no lookup by our reference, so every send is written down BEFORE it goes out (the reference, both accounts, the amount) and the transfer's id and status are kept as they are read. A lost answer is found again from that row by walking the sender's transfers (`GET /transfers?entity_id=&account_id=`, each item carries its `unique_reference`). A repeated reference is Nuvion's original (as a `409` or a `2xx`); a reference reused for other accounts or another amount is never sent (`duplicate_reference`). A refusal that moved nothing leaves the reference free to be sent again.
- `src/nuvion/handlers/book.ts` and `book.handler.ts`: `outflows.created`, `.completed`, `.failed`, `.cancelled` and `.refunded` for a book transfer. The transfer is found in the log (by Nuvion's id or our reference; anything else is another rail's or a move on the dashboard and is left alone), read back from Nuvion, checked to be the transfer we sent, and its CURRENT state is merged into the ledger rows the sender wrote: `successful` completes both sides at the charge Nuvion states, `failed` (a cancelled transfer is `failed` with a reason) fails them, `reversed` reverses them. Whatever the order or count of the events, the record decides; an event ahead of the record waits; a record that is not the transfer we sent is a stop for review.
- The adapter's wiring (`nuvion-wallet-provider.ts`, `nuvion.module.ts`: SHARED-CHANGES NUV-05 #1), purge and export map comments, and a section in `docs/contract/CONVENTIONS.md` (14, "Nuvion's book transfer").
- Specs (new): `nuvion-book.contract.spec.ts` (the area against the stand-in over a socket and a real database, 56 tests), `nuvion-book-money.contract.spec.ts` (the real MoneyModule, payments, holds, the ledger, the webhook receiver and dispatcher, 24 tests), `nuvion-book-events.spec.ts` (the handler's decisions on fakes, and the log's status table, 55 tests); the stand-in's book routes `test/nuvion/book-standin.ts`. Existing specs changed on purpose: `nuvion-adapter.spec.ts` (which area answers which method; the book area is no longer a stub), as NUV-04 did for accounts.

**Capability checks**
1. A payment moves once, also when the same reference is sent twice or at once (V8): **passed.** Area spec: the same reference twice (one transfer, the second answered from Nuvion with nothing sent), twice at once from two servers (one transfer), after the log lost the answer under both ways Nuvion may answer a repeat. Money spec: eight requests under one key. Built Hubs (two processes, one database): ten requests under one key, five on each, one payment and one transfer; the same key replayed on the other Hub; and the same reference sent to the adapter four times at once from the two Hubs, three references, three transfers.
2. A release and a refund each move once and reach the ledger once: **passed.** Built Hubs: two releases and a refund each asked twice at once on the two Hubs, three transfers; both ledger sides written once each (WAWU's account out at amount plus Nuvion's charge, R-31; the person in); the payee paid the 85%, the payer the price.
3. A transfer whose answer is lost is found again by its reference, never sent under a new one: **passed.** A lost answer after Nuvion made the transfer (payment and release): pending, the sweep finds it by the sender's history and settles it, one transfer; a lost answer with nothing made: neither failed nor sent again, `unknown` while the send may be in flight and `absent` only after a complete walk, and `decideRetry` never advises a resend; a walk that does not reach the end is `history_incomplete`.
4. `outflows.failed`, `.cancelled` and `.refunded` reverse the ledger entry once; a replayed delivery changes nothing: **passed.** Each event on the built Hubs, delivered to both Hubs at once, twice, and again 35 s later: rows read the same. A refunded delivery is handled in both shapes (the transfer itself; a credit record naming it in `meta.source_payment_id`). Stale `.failed` for a completed transfer and an early `.completed` are covered.
5. After a run of payments, releases and refunds the ledger's operational figure equals the stand-in's `available`: **passed.** Money spec and built Hubs: the ledger's net for WAWU's account since the start (completed rows: credits less debits at their totals) is exactly the change in the stand-in's `available`.
6. A payer without the amount plus fee gets MONEY-19's shortfall answer and no transfer is sent: **passed** (402 `insufficient_funds`, nothing sent, the balance untouched; spec and built Hubs).
7. (key) A sandbox book transfer between two child accounts and from a child to the operational account: **NOT RUN** (below).

**Decisions (Default (agent), owner may override)**
- WAWU's operational account must be of type `operational`; any other type is `bad_response` naming the type (a person's account is never WAWU's by a wrong setting).
- The receiver is named by `nuvion_ban` on the transfer body (the dashboard code, as MONEY-17's verifier recorded it); the public docs route a book transfer through `POST /payment-details`. One place in `book.ts` changes if the sandbox says otherwise.
- A transfer Nuvion has not finished is read again for under four seconds (`PROVISIONAL(NUVION-BOOK-SETTLE-WAIT)`) so most payments complete inside the request; after that it is `not_confirmed` (pending) and its delivery or the sweep settles it.
- Silence is never proof that no money moved: `decideRetry` answers `settled` or `wait`, never a resend, and `absent` needs a complete walk past the send's window.
- A completed transfer whose record states no `applicable_fee` is not a receipt (`not_confirmed`); a charge is never taken as 0.
- The handler never makes a ledger row: it merges into the rows the sender wrote. A hold's release and refund rows are the hold's to write when it settles (so a delivery before that changes nothing, and the hold's sweep settles within about two minutes at worst).
- A payment that was delivered and is later reversed by Nuvion keeps `status completed`; the ledger rows reverse (BACKEND_GAPS G-482, G-483 for a settled hold).
- A connection that provably never opened (`WalletProviderError.requestNotSent`, MONEY-18 round 3, set by the Nuvion client from the socket's code and syscall) marks the log row `refused`, so the same reference may go out again; any other lost answer stays `sending` and is asked about, never resent. The spec refuses a real connection to a closed loopback port, and loses a real answer after the write.
- A reference the log never held is `unknown`, with no request: it is not a book transfer this area sent (a payout or an inflow is its own rail's).
- `NuvionBookTransfer` has no person column, so the purge map and the export list do not name it; it is kept after an account is deleted like the provider's own record (comments say so).
- The history walk is 20 pages of 100 from ten minutes before the send.

**Runs**
- `tsc --noEmit` 0. eslint (no `--fix`) on every file this branch changes, `src/nuvion`, `src/wallet-provider`, `src/money`, `src/account-purge`, `src/data-export-request`, `test/nuvion`: 266 files linted, 0 findings in any file this branch changes. 18 errors and 2 warnings stand in three files it does not touch (`src/account-purge/tests/account-data-map.spec.ts`, `src/data-export-request/data-export-request.controller.ts`, `src/data-export-request/tests/data-export-request.contract.spec.ts`).
- On a fresh migrated database in a private network namespace (the mock WAWU ID on :4001 inside it), `src/nuvion`, `src/wallet-provider`, `src/account-purge` and `src/data-export-request`: taken from the whole run below (fresh migrated and seeded database, private namespace, HEAD `3b6ebe5` less the last spec-only commit): `src/nuvion` 14 suites, 1235 tests; `src/wallet-provider` 2 suites, 66; `src/money` 58 suites, 1411; `src/account-purge` 1 suite, 4; `src/data-export-request` 3 suites, 24. Every test passed except the five listed under the whole suite (one was this branch's own spec and is fixed).
- Protected suite `run.sh --fresh HEAD`, lock at origin/main: 253 of 253 passed, `EXIT 0` (code `1c00d3a`, lock `origin/main` `020f055`).
- Gates: main 16 fail, 95 warn, 76 accepted; fail lines; branch the same 16 FAIL lines (line for line), 96 warnings against main's 95: the one new warning is `PROVISIONAL(NUVION-BOOK-SETTLE-WAIT)`. `check_baseline.py` passes. `npm run contract:build` twice: both `EXIT 0`, `contract/openapi.json` byte-identical to main's and to each other (sha256 `abca1768da142d22`), working tree clean after each.
- The whole backend suite as deploy.yml runs it (`npx jest --runInBand --forceExit` on a fresh migrated and seeded database, the mock WAWU ID on :4001), in three serial shards with `--testTimeout=120000` because of the machine's load: three shards of `npx jest --runInBand --forceExit --testTimeout=120000` on a migrated and seeded database whose name contains `wawu_hub_test` (two specs, `shop` and `marketplace-save`, force that name), mock WAWU ID inside the namespace: 277 suites, 7943 tests, 7871 passed, 4 skipped, 68 failed (each shard's `EXIT 1`). No failure is in code this branch touches except one race in this branch's own spec, fixed after the run. The 68: (1) 52 in `src/common/tests/protected-registry.regression.spec.ts`: its first call to the mock WAWU ID (`loginAs`) found the connection closed under load (`other side closed`); alone on a fresh seeded database it passes 52 of 52; (2) 11 in `src/tests/hub-rate-limits.contract.spec.ts`: it needs a non-loopback IPv4 interface and the namespace has only `lo`; outside the namespace (it calls no host) it passes 22 of 22; (3) 4 in `src/money/receipts/tests/receipt-units.spec.ts`: its Unicode digit table against this runtime's ICU (1154 digits here, 1151 in the table); `src/money/receipts` is not touched here; (4) 1 in `nuvion-book-money.contract.spec.ts` (this branch): it asserted a payment's delivery and its note right after the status turned `completed`, and main's delivery claim (MONEY-18 round 3) comes a moment after; the spec now waits for the end state, 6 runs of 6 pass. An earlier whole run on the tree before main's MONEY-18 merge (`ba4a744`) had the same kinds of environment failures (`fintava-stall` timing under load 25, a random 12-digit admin id matching `\d{11}` in `admin-identity-holds`, `shop` and `marketplace-save` reaching `wawu_hub_test`) and each passed alone.
- Built Hubs (`dist`, `WALLET_PROVIDER=nuvion`, two processes on one database, the stand-in as a process; ports 6221 to 6224): 41 of 41 checks passed, 0 error lines in either Hub's log, no request left for a host but the stand-in. Two Hubs on one database: six payments across both; the same keys again on both; ten requests under one key (one payment, one transfer, the buyer debited once); four payments Nuvion answered pending, completed by deliveries, replayed deliveries changing nothing; Nuvion failing a transfer (both rows failed); `outflows.refunded` (both rows reversed); three held payments released twice and refunded, each asked twice on both Hubs (three transfers); a lost answer on a payment, on a release, and with nothing made; the same reference sent to the adapter four times at once from the two Hubs (three references, three transfers); price in hand without the charge (402, nothing sent); and the ledger's net for WAWU's account (1239000 kobo) equal to the stand-in's `available` delta. Run on `dist` built from `1c00d3a`.
- Mutants (my own, 28, each applied to the source, the three specs run, the file restored): 26 killed, 2 equivalent (an `isSameAccount` case fold that the account lookup repeats; an id check that the problem check repeats). Killers include: the person's entity left off the body, a reference reused for another amount sent, a pending transfer read as a receipt, a failed transfer read as maybe moved, a walk read as complete at its cap, an absent answer advising a resend, the ledger told `completed` whatever the record says, an event ahead of the record acted on, the receiving side not written, a delivery for another transfer read, a refusal that leaves the reference used up, another amount in the record accepted, a completed transfer with no stated charge taken at 0, a late `failed` undoing a completed log row.
- Mobile: `npm run gates` and `npm run tasks` both `EXIT 0` after mobile main `3b35731` was merged in (`npm run tasks`: 275 tasks, 279 artboards covered, `INDEX.md` and `docs/PROGRESS.md` regenerated with `check_tasks.py --write`; `npm run gates`: 10 gates, 0 fail, 5 warn, the same as main).

**Filed**: SHARED-CHANGES NUV-05 #1 to #3; BACKEND_GAPS G-482 (a delivered payment reversed at Nuvion), G-483 (a settled hold reversed), G-484 (what NUV-08 takes over), G-485 (Nuvion's retry window against the webhook window), and G-440 extended with the seven things only the sandbox settles.

**NOT RUN**
- (key) The sandbox book transfer, between two child accounts and from a child to the operational account, by `nuvion_ban` (confirms SANDBOX-FINDINGS item 9, which I could not read: the file was lost). Unblocked when `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env` and a lead brief allows that host. It settles: the receiver field, the `409` body, the list order and `account_id` filter, the operational account's type, what `outflows.refunded` carries for a book transfer, and the real `applicable_fee` (G-440).
- A real selling kind end to end on the built Hubs (G-70, G-445): none is registered on main, so the built Hubs register the kinds in a scratch entry file beside `dist` (the price and payee are in the target id so two processes agree); no product file is changed. Unblocked by HOME-15, INBOX-17 and EVENTS-07 registering their kinds.
- Signing in through the real WAWU ID on the built Hubs: tokens were minted with the mock key and checked against a JWKS double on :6224. Unblocked by a session with a local wawu-id.
- Webhook retries: Nuvion's current docs say five retries at 1, 2, 4, 8 and 16 minutes (31 in all); NUV-01's window is 20 minutes (G-485). Not exercised; unblocked by the sandbox's delivery log.

## Verifier report

## Owner sign-off
