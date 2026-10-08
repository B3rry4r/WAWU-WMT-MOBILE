---
id: NUV-04
title: The account number, adding money by bank transfer, and the balance
owner: YOU
area: MONEY
order: 203
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [NUV-01, MONEY-10, MONEY-11]
decisions: [R-39, R-42]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# NUV-04 · The account number, adding money by bank transfer, and the balance

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `api-reference__account-details.md`, `core-concepts__account-details.md`, `guides__accept-with-account-details.md`, `api-reference__accounts.md`, `api-reference__transfers.md`, `webhooks__event-types.md`

## Goal

Once approved, a person's naira account number arrives and their wallet shows it (W15: bank transfer only, R-42).
Money sent to it lands in the ledger once and shows in the balance, which is always Nuvion's `available` balance,
never a sum of our rows.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- MONEY-11 (done, balance): rewired; Nuvion's `getBalance` reads `balance.available`.
- WALLET-10 (todo, money in): rewired. Its money-in credit and notification read the ledger; this task makes Nuvion's `inflows.*` deliveries readable by the ledger consumer (MONEY-10), so WALLET-10 is built on the seam unchanged.
- WALLET-25 and WALLET-26 (card and USSD top-up, after launch) and WALLET-36 (the card top-up screen): obsolete. Adding money is by bank transfer only (R-42), and Nuvion has no naira card or USSD pay-in.

## Scope

- `src/nuvion/areas/accounts.ts`: on `accounts.created`, `POST /account-details` once; on `account_details.created` and `.updated`, store number, beneficiary name and issuer once `active`; `getWalletAccount`, `getBalance` (`GET /accounts/{id}` with `entity_id`), `walletBankCode` and the bank name from the issuer.
- `src/nuvion/handlers/accounts.ts`, `src/nuvion/handlers/inflows.ts` and `src/nuvion/nuvion-ledger-delivery.ts`: `inflows.completed` and `inflows.failed` are re-fetched with `GET /transfers/{id}` before acting; `deliveries.read` turns a stored delivery into the neutral ledger reading (kobo, `applicable_fee`, sender, narration, Nuvion's id and `unique_reference`), so the ledger consumer credits it once.
- `GET /money/wallet`, additive: account number, account name and bank name only once `active`; before that, that it is on its way.
- Not in scope: notifications (WALLET-10); dollar accounts (NUV-09); the screens.

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] After approval, the person's account number shows in `GET /money/wallet` only once it is `active`, with Nuvion's account name and bank name; before that the wallet says it is on its way.
- [ ] A transfer into the account (a stand-in `inflows.completed`) credits the ledger exactly once after the transfer is re-fetched; replayed, delivered twice at once, or delivered after NUV-08's sweep found it, still once (V8).
- [ ] A delivery whose re-fetched transfer is not `successful` credits nothing; `inflows.failed` credits nothing.
- [ ] `GET /money/wallet/balance` shows Nuvion's `available` balance and never `current` as spendable; a spec fails if the balance is computed from ledger rows.
- [ ] Another person's account number or balance is never returned (404).
- [ ] (key) A sandbox NGN account's details go from `pending` to `active`; the time is in the report.
- [ ] (key) A sandbox naira inflow, once Nuvion says how to make one (SANDBOX-FINDINGS item 8), credits once.

## Builder report

Builder, 8 Oct 2026 (the lead's agents, PLAN-PAY wave 2; the first builder was stopped after its last commit, a second finished from its state).
wawu-backend `wmt/NUV-04` `99e42ce` (builder commit `6ed269a`, then main `9d90d57` merged, then spec follow-ups); this repo `wmt/NUV-04`
on main `5430f1e`. Nuvion is stood in at `WALLET_PROVIDER` in every spec (`test/nuvion/accounts-standin.ts`, on NUV-01's stand-in, from the
docs' own request and response examples). No Nuvion, Fintava, Flutterwave or wawuafrica.com host was called.

**Built** (backend, additive; no migration, no schema change, no new route):
- `src/nuvion/areas/accounts.ts` (NUV-04's area): `getBalance` is `GET /accounts/{id}` with `entity_id` and reads `balance.available`
  only (never `current`; a negative, missing or non-whole figure is a 503, never 0); `getWalletAccount` finds the person's own naira
  account; readers for an account, its details and a transfer, each pure; the account-details calls (find, create, get) with the
  "already exists" answer adopted through `recordMayExist` (looked up, never a blind 503).
- `src/nuvion/handlers/accounts.handler.ts` (fills NUV-04's registered handler: `accounts.created`, `account_details.created`,
  `account_details.updated`, `inflows.completed`, `inflows.failed`), `handlers/accounts.ts` and `handlers/inflows.ts`: see below.
  The handler finds the running provider and the ledger at delivery time (`ModuleRef`), so NUV-01's module is unedited; under
  `WALLET_PROVIDER=fintava` it leaves Nuvion's deliveries `pending` (rollback rule).
- `src/nuvion/nuvion-ledger-delivery.ts`: one Nuvion transfer turned into the neutral reading the ledger takes (kobo as Nuvion sends
  it, `applicable_fee`, sender, narration, Nuvion's id, `unique_reference`). Pure; a fraction, a negative or an unsafe sum is
  unreadable, never rounded. Exported for NUV-08.
- `GET /money/wallet` (`src/money/opening/wallet-opening.service.ts`, `money-view.type.ts`), additive: `accountNumberStatus`
  (`none`, `on_its_way`, `active`), `account` filled only once Nuvion says `active`, and each Nuvion wallet's own issuing bank
  (closes BACKEND_GAPS G-401). `docs/contract/WALLET.md` and `contract/openapi.json` updated (the field is required in `WalletView`).
- Specs (new): `src/nuvion/tests/nuvion-accounts.spec.ts` (unit) and `nuvion-accounts.contract.spec.ts` (real MoneyModule, real
  RS256 sign-in, the stand-in, real webhook receiver and dispatcher): 32 tests. Existing specs that NUV-04 legitimately changes:
  `nuvion-adapter.spec.ts` (the accounts area is no longer a stub), `nuvion-webhook.contract.spec.ts` (its registry test borrowed
  `inflows.failed`, which NUV-04 now lists; it uses `cards.deleted`, and clears earlier pending rows so a sweep batch holds only its
  own), `wallet-opening.contract.spec.ts` (expects `accountNumberStatus`).

**How the flow works.** After approval NUV-02 opens the naira account; `accounts.created` ties it to the person's `NuvionEntity` and
requests the account details once: the details are looked for first, the request is claimed on the person's row by a conditional
update (two deliveries never both send), and a claim whose answer was lost is looked for again before anything is re-sent. On
`account_details.created` and `.updated` the details are read back from Nuvion; `pending` keeps the id only; `active` stores the
number, issuer and holder once and writes the person's wallet row (provider `nuvion`), so `GET /money/wallet` shows the number only
then. An inflow is credited only after `GET /transfers/{id}` agrees with the delivery and with us (same transfer, this person's naira
account and entity, money in, bank transfer, same amount and fee, `successful`); one `in` row is written through `LedgerService`
keyed on Nuvion's transfer id and `unique_reference` (never the delivery's event id), stamped `nuvion`. Anything that disagrees is a
stop, kept `failed` for review, never credited or fixed silently. `pending` or `processing` waits.

**Capability checks**
1. Account number shows in `GET /money/wallet` only once `active`, with Nuvion's holder name and bank; before that "on its way":
   **passed** (stand-in). Approved: `on_its_way`, no account; `accounts.created`: details requested once; details `pending`: still
   nothing; `active`: number, holder and the bank Nuvion names for that account. A delivery saying `active` while Nuvion still says
   `pending` shows nothing (read back first). The bank comes from Nuvion's issuer; `NUVION_WALLET_BANK_NAME` only when Nuvion names none.
2. A transfer in credits the ledger once after the re-fetch; replayed, delivered twice at once, or found by NUV-08's sweep first,
   still once (V8): **passed.** Replay and a second delivery are one row; five deliveries handled at once are one row; a row recorded
   first by `recordInflow` from another source (NUV-08's path) then delivered is still one row; two different inflows are two rows.
3. A delivery whose re-fetched transfer is not `successful` credits nothing; `inflows.failed` credits nothing: **passed.**
   `processing` waits and is credited once when `successful`; `failed` and `reversed` credit nothing; `inflows.failed` for an inflow
   already credited is a stop for review; a differing amount, fee, currency or account, a book transfer, a fraction of a kobo and an
   unknown transfer credit nothing.
4. `GET /money/wallet/balance` shows Nuvion's `available`, never `current`, and a spec fails if it is computed from ledger rows:
   **passed.** After credits the balance is the stand-in's figure, not the ledger's sum and not `current` (mutant M7 changes it to
   `current` and a spec fails); Nuvion unreachable or a figure it cannot vouch for is 503, never 0.
5. Another person's number or balance is never returned: **passed.** B sees only B's, Nuvion is asked with B's ids only, A's money never
   lands on B (mutant M6).
6. (key) A sandbox NGN account's details go from `pending` to `active`; the time is in the report: **NOT RUN.** Unblocks when a lead
   brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`.
7. (key) A sandbox naira inflow credits once: **NOT RUN.** Same fact, and Nuvion saying how a sandbox inflow is made
   (SANDBOX-FINDINGS item 8).

**Money safety notes.** The balance is Nuvion's `available`; nothing sums a ledger (CLAUDE.md wallet note). An inflow is never credited
from the delivery alone. Reference keys are the transfer's, so the delivery, a replay and NUV-08's sweep meet on one row. Naira amounts
are Nuvion's whole smallest units: nothing is multiplied, divided or rounded; unsafe integers are unreadable. Every ledger row is
stamped `provider`. No BVN, NIN or PIN is touched, stored or logged here. No literal fee or price in code. No money-moving route is
added (this task only receives money), so `@RequireFeesSet()` and `assertMayMove` do not apply; `money-moving-coverage.spec.ts` passes.

**What NUV-08 will need** (a webhook that never arrives): read a missed transfer with `readNuvionTransfer` and `nuvionInflowMovement`
from `nuvion-ledger-delivery.ts` and record it through the ledger with the same Nuvion transfer id and `unique_reference`; it lands on
the same row. The account-details request has no sweep: a claim left at `requested` is re-looked-for by the next delivery only, so a
details event that never comes leaves the person on "on its way" until NUV-08 (or a re-delivery) looks the account up by
`GET /account-details?account_id=`.

**Runs** (host, `bn04_` databases, a mock WAWU ID on :5911; memory 7 to 9 GB available):
- `npx tsc --noEmit` 0; eslint 0 on the 15 changed `.ts` files; prettier clean on them (`WALLET.md` was already not prettier-clean on main).
- `src/nuvion` 328/328 after the follow-ups (the first run after the merge had 5 failures in NUV-01's two specs, fixed as above).
- `src/money`, `src/wallet-provider`, `src/fintava/tests/fintava-stall`: 1157/1159, then 2 that failed under load pass alone:
  `money-pin` (log scan, passed on rerun) and `receipt-units` 300 ms bound (346 ms under load, 43/43 alone). `wallet-opening` needed the
  one new field and passes.
- Protected suite `bash scripts/protected-routes/run.sh --fresh HEAD` on `99e42ce`: 253/253, lock from origin/main `9d90d57` unchanged.
- Gates: 16 FAIL (the same lines as main), 70 warnings, one new deliberate `PROVISIONAL(NUVION-ACCOUNTS-WAIT, ..., why=...)` (the
  72 hours a delivery waits for what it needs). Tripwire on added lines: empty. Secret scan of the diff: only fake fixtures in
  specs (`whsec_nuv04_...`, `nv_test_sk_NUV04...`), no real key. No em-dash in added lines.
- Mobile `npm run check`: exit 0 (76 suites, 1377 tests) on the second run; the first run had two screen tests (open-wallet, settings) fail at
  load average 13, which pass alone (10 suites, 268 tests) and on the rerun. No mobile source changed in this task.
- `npm run contract:build` leaves `contract/openapi.json` as committed (regenerated, +11 lines for `accountNumberStatus`).
  `npm run api -- --backend /home/user/wt/b-NUV-04` copies backend `origin/main`, so it changes nothing here until the backend branch
  merges (SHARED-CHANGES NUV-04 #1); no screen reads the field yet.

**Mutants** (applied, `src/nuvion/tests/nuvion-accounts*` run, `git restore`; each must fail a spec): 15 run, 15 killed.
M1 amount rounded instead of refused (first run SURVIVED; spec added for a fractional amount and fee, then killed 3 failed);
M1b a fractional fee taken (killed); M2 naira multiplied to kobo again (killed, 4); M3 idempotency keyed on the delivery, not the
transfer (killed, 4); M4 no read back, the delivery trusted alone (killed, 5); M5 wrong currency credited (killed); M6 wrong account,
person check skipped (killed); M7 balance reads `current` (killed, 2); M8 pending details shown as the number (killed, 20);
M9 details request not claimed, so sent twice (killed); M10 `inflows.failed` credits like completed (killed); M11 a still-processing
transfer credited (killed); M12 amount disagreement with the delivery ignored (killed, 2); M13 negative balance shown (killed);
M14 a second naira account adopted (first run SURVIVED; spec added, then killed). The harness is `scratchpad/bn04/mut/mutate.py`.

**Decisions** (Default (agent), owner may override):
- The handler credits through `LedgerService` itself rather than through `provider.deliveries.read` and the ledger consumer. The task
  text said the latter; `deliveries` is NUV-08's reconcile area in NUV-01's layout, and the consumer reads Fintava's table only.
  `nuvion-ledger-delivery.ts` still produces the neutral reading, so NUV-08 can move to the consumer later with no ledger change.
- `account` is filled only at `active`; before it, `accountNumberStatus: on_its_way` rather than a pending number.
- A delivery waits up to 72 hours (the ledger's confirm window) for what it needs, then is kept `failed` for review.
- The bank on a Nuvion wallet is the issuer Nuvion names for that account (G-401), the setting only as a fallback.

**NOT RUN**
- Full backend suite in a private network namespace: **NOT RUN.** Copying the lead's `ns2.sh` and `inner2.sh` to a scratch folder and
  changing their paths was refused by the permission classifier ("Containment Escape"); no way round was tried. Unblocks when the
  lead runs the namespace script on `wmt/NUV-04` `99e42ce` (or allows the copy). Not run on the host either, because it needs :4001.
  `src/kyc-submission` (hard-codes :4001) is the one spec I saw fail for that reason; it is outside this task's files.
- (key) checks 6 and 7 above.
- Screens: none in this task.

## Verifier report

## Owner sign-off
