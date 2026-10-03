---
id: MONEY-12
title: Open a Fintava account when someone opens a wallet
owner: YOU
area: MONEY
order: 79
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-06, KYC-01, KYC-02]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-12 · Open a Fintava account when someone opens a wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A8: when a user finishes Open your wallet, they get their own Fintava account (R-6: never at sign-up).

## Scope

Account opening after BVN, NIN and address, safe to retry, a visible 'still opening' state, the account number shown on W1.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /create/customer` requires first and last name, phone, email, `fundingMethod: STATIC_FUND`, address, date of birth, BVN **and NIN**, and returns the account number at once. Store customerId (`userInfo.id`), walletId (`wallet.id`) and the account number. There is no tier in the API: open a normal account; limits are a question for Fintava.

## Capability checks

- [ ] A sandbox user who finishes Open your wallet has an account number that Fintava also reports.
- [ ] Retrying a failed opening never opens two accounts.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-12` `d056461` (on main `e8535d8`); mobile `wmt/MONEY-12` (on main `176a56d`). Neither main moved.
- **Backend:** `src/money/opening/` (controller, `WalletOpeningService` with a 30 s sweep, config, `OpenNairaWalletDto`, 2 specs); migration `20261003100000_wallet_opening` (`FintavaWalletOpening`, `FintavaWallet.accountName`, OWNED in the purge map); client `lookupCustomerByPhone`, `listCustomerSightings` (+ spec, + stall list); `WalletIdentityService.checkedIdentity`, `SelfieMatchService.matchedFor`; 3 codes (`selfie_required` 409, `identity_has_wallet` 409, `account_not_opened` 422); balance answers `409 wallet_opening`; GET `/money/wallet` moved from the declarations; contract, CONVENTIONS section 9, WALLET.md, `.env.example`, deploy README. Mobile: contract and types from the branch, sandbox `32-`, `naira-api.md`, gaps, shared changes.
- **Routes:** `POST /money/wallet/open` (BVN, NIN, A5's name and date of birth, address) and `GET /money/wallet` (`not_open` / `opening` / `open` with Fintava's account number and name), token-keyed, `no-store`.
- **Identity read once (G-25):** `checkedIdentity` compares BVN and NIN (NIN required) in one read and returns that check; the selfie must have matched exactly it (`matchedFor`); the opening records it. Tested with a check for another BVN passing right after the read (opens with the checked and matched BVN, tied to it) and B's BVN with only A's selfie (409).
- **Check 2, a retry never opens two:** per-person row claimed before anything is sent, re-checked just before the create; BVN hash and phone unique across accounts; Fintava asked by phone before every create. Lost answer (timeout, 5xx, unreadable 2xx, "already exists") is `unknown`, shown as opening, reconciled by the next request and the sweep: found by details or the newest-first list is recorded; "not created" only on Fintava's `404 ["Customer not found"]` AND no list row AND money timeout + `FINTAVA_RESEND_SAFETY_MS`. Tests: 15 taps in two waves while the create is in flight (1 create); late 201, 5xx after creating, unreadable 2xx (1 create each); nothing made (waits, then exactly one more create); `{}`, `data: null`, other 404s, 500, slow, list failing, list rows without time, list never reaching the attempt (all wait, nothing sent); sweep for a stopped server; concurrent reconcilers; existing customer adopted; one held by another account (409); a second WAWU account with the same BVN and phone (409). 16 mutants, all killed.
- **Check 1, sandbox:** route against the real sandbox opened account `1192964482`, `GET /customers/{id}` reports the same ids; repeat sent nothing; 5 calls, documented example data, BVN check and selfie seeded as stand-ins (`docs/fintava/sandbox/32-money12-account.md`).
- **Never stored or logged:** no BVN, NIN, address or date of birth in any column (spec and the sandbox database, 512 columns) or log line; 0 of 58 key windows in logs, answers, notes and each staged diff.
- **Runs:** tsc 0; eslint 0 on the 21 changed `.ts` files; Fintava, money, identity, purge, rate-limit specs 26 suites 1,145/1,145 (`m12_test`, stand-in WAWU ID :4902); full `test:contract` on fresh seeded `m12_full_test` (my mock on :4001, `lsof` free before, stopped after): 119 suites, 2,878 passed, 3 skipped, 1 failed (`money-contract` needed the two served routes listed, fixed in `d056461`, then 11/11); protected `--fresh HEAD` 253/253, all 244 required, registry sha256 `767e27bf...` unchanged; tripwire 0 added lines; `hub-rate-limits` 10/10 (no `@Throttle` added); gates main 16 fail / 8 warn, branch 16 / 9 (the one added warn `PROVISIONAL(WALLET-BANK-NAME)`), baseline OK; `contract:build` byte-stable. Mobile `npm run check` exit 0 before (main) and after: typecheck, lint, 19 suites 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks.
- **Defaults (agent), owner may override:** name, date of birth, address are the app's copy, never stored; phone is KYC-01's verified phone, email the token's (none: 422); one BVN and one phone per wallet across WAWU accounts; an unheld Fintava customer for the phone is adopted, not duplicated; a refusal saying the customer exists counts as lost; validation and identity refusals 422, merchant gate, key, rate limit and others 503, all `failed` (new attempt allowed); list scan 10 pages of 100 with 5 min clock skew, recheck at most every 15 s, `opening` stuck after 2 reads + money timeout + 60 s; bank "Loma Bank" (PROVISIONAL), code `090620`, licence lines from config (null hides); `limits` null, `bankTransfers` allowed when open (R-28), `beneficiaryCount` 0 until WALLET-14; `frozen` not answered (no Fintava call on GET); POST always 200, state tells.
- **Filed:** BACKEND_GAPS G-25 and G-12 updated, G-36 (BVN uniqueness lost on account deletion), G-37 (`conflict` openings have no admin view); SHARED-CHANGES MONEY-12 #1 (schema), #2 (contract from branch).
- **NOT RUN:** the whole Open your wallet against the sandbox (BVN check, selfie, open for one person): unblocked when Fintava names a sandbox BVN its check passes (question 11) and shows its real selfie success body (question 6, G-25). A lost create against the sandbox: cannot be provoked; proved against the stand-in. Whether Fintava refuses a repeated phone: not tried (one customer only). V10: no screen (KYC-03, WALLET-01). CI's `ci-check.sh`: tripwire and lock checked by hand; unblocked by the pull request's CI run (no PR opened, by instruction).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
