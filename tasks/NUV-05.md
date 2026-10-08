---
id: NUV-05
title: Pay from the wallet and held money: book transfers and WAWU's operational account
owner: YOU
area: MONEY
order: 204
priority: launch
repo: wawu-backend
type: money-path
status: todo
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

## Verifier report

## Owner sign-off
