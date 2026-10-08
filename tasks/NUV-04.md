---
id: NUV-04
title: The account number, adding money by bank transfer, and the balance
owner: YOU
area: MONEY
order: 203
priority: launch
repo: wawu-backend
type: third-party
status: todo
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

## Verifier report

## Owner sign-off
