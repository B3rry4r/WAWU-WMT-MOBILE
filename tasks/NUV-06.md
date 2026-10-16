---
id: NUV-06
title: Send to a bank and pay out, with the account name check
owner: YOU
area: MONEY
order: 205
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [NUV-01, WALLET-14]
decisions: [R-39, R-42, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# NUV-06 · Send to a bank and pay out, with the account name check

## Current state

live: send to a bank and pay out with the account name check, backend PR #134 (bac39c4), deploy run 38906156612.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-06.md](history/NUV-06.md).

## Owner sign-off
