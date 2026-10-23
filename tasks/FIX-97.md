---
id: FIX-97
title: The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers
owner: YOU
area: MONEY
order: -97
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-97 · The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers

## Current state

As of 23 Oct 2026, verifying: built by a Sonnet builder (tier T2; backend `wmt/FIX-97` `e678f35` (round 1 `7f9a172`) on `origin/main` `62876ea6`; this record on mobile `wmt/FIX-97` from `origin/wmt/NUV-KEYS` `ac57b790`). Only `src/nuvion/areas/payouts.ts`, its stand-ins (in-process and the local stack's) and its specs changed, plus the lookup check script. No schema, route or table.

| Fix | Before (origin/main) | After (built) | Spec (fails before, passes after) |
|-----|----------------------|---------------|------------------------------------|
| 1. Name check request | `{country, account_number, bank_code}`; dev 422 "The 'issuer' field is required" | `{country, account_number, issuer: {code}}` | `nuvion-payouts-dev-answers.spec.ts` "fix 1": red on main (HTTP 422), green |
| 2. Name check reader | read `account_holder_name`, `account_name`, `holder_name`: found no name on dev's answer; a made-up number's 404 `error_resource_not_found` was thrown, not "not found" | name from `data.details.name` (with `details.account_number`, `details.issuer.code`, `status` must be `successful`); the three guessed fields are not read (the public docs name none for a lookup); 404 `error_resource_not_found` is `not_found` | "fix 2" (2 tests): red on main, green |
| 3. Counterparty | no `email`, no `address`: dev 422 on every bank send | `profile.email` and `profile.address {line1, city, country}` are the SENDING side's own, read from its entity (`GET /entities/{id}`: `person.email` or `business.email`, and `address`, else the first complete of `addresses`); WAWU's own sends read the operational account's entity; either missing stops the send with a `validation` refusal before any counterparty, payment detail or transfer (the Hub marks that send failed and gives the fee back); an unreadable entity is a send that did not start; nothing is ever made up; the relationship stays `vendor` (dev took it) | "fix 3" (7 tests): red on main (5 are the dev 422, 2 are "a counterparty was posted"), green |

- **Both runs of the new spec** (10 tests): origin/main `62876ea6`, spec copied in, 10 failed, EXIT 1 (`fix97-b/logs/base-unit.log`); built `7f9a172`, 10 passed, EXIT 0.
- **Pinned guesses updated** (sweep rule): `nuvion-payouts.spec.ts` pinned the guessed lookup body, the three guessed name fields and a counterparty without contact; those three assertions now say dev's. The payouts stand-in (`test/nuvion/payouts-standin.ts`) answers the lookup, the counterparty and `GET /entities/{id}` as dev does (a default complete contact for every entity with an account; `pay.contacts` leaves one out).
- **Dev, 23 Oct** (key `nuvion-dev.env`, api.nuvion.dev only; each answer with its request id is in `docs/nuvion/DEV-RESULTS.md`, NUV-06 rows, both now PASSED): through the Hub (local, `WALLET_PROVIDER=nuvion`, real dev key) `POST /money/banks/name-check` for bank 044 and the account ending 0031 answers 200 "Forrest Green"; a made-up number answers 422 `name_check_failed` "We could not find an account with that number at that bank." A bank send through the built payouts area (the call the Hub makes) reaches counterparty 201 and payment detail 201 and stops at 400 `error_transfer_insufficient_funds`, from a dev person and from the operational account. The Hub's own send route cannot show this: it reads the balance first and refuses an unfunded wallet itself, before Nuvion is called.
- **Checks (EXIT lines in logs under `fix97-b/logs/`):** `tsc --noEmit` EXIT 0; eslint (no `--fix`) on the four changed files EXIT 0; nuvion specs in band (8 suites, 373 tests, the new one included) EXIT 0; contract specs that use the payouts stand-in (`nuvion-payouts.contract`, `nuvion-dispatch-burst.contract`, `wallet-transfer-bank-nuvion.contract`, `school-settlement-failed-payout-nuvion.contract`: 4 suites, 62 tests) EXIT 0; `db:seed` then `test:protected` 2 suites, 253 tests EXIT 0 (base lock); `gates/run.py` EXIT 0 (0 fail, 133 warn, 88 accepted, the same as `origin/main`); `check_baseline.py` EXIT 0 (124 entries). Mobile: `check_tasks.py --write` EXIT 0 then `check_tasks.py` EXIT 0 (397 tasks); `gates/run.py` EXIT 0 (0 fail, 18 warn, 0 accepted); `check_baseline.py` EXIT 0 (0 entries).
- **Not run:** the whole backend suite (CI); `nuvion-adapter.spec.ts` and `nuvion-rollback.contract.spec.ts` (import Fintava); anything Fintava; a real send that moves money (no dev account holds naira).
- **Round 2 (lead ruling: the two files matched to dev; backend `e678f35`).** `scripts/dev/nuvion-standin.cjs` (the local stack's stand-in): the lookup takes `issuer.code` (a body without it is dev's 422) and answers `data.details.name`; an unknown number is 404 `error_resource_not_found`; an individual's counterparty without `profile.email` and `profile.address` is dev's 422; `GET /entities/{id}` carries the person's `address`, and WAWU's own business entity (email and address) which the Hub now reads. `scripts/nuvion/counterparty-lookup-check.ts` sends the issuer body and prints the names of `details`. `nuvion-standin-statements.spec.ts` posted a counterparty with no contact (it runs the stack stand-in): that one input now has an email and an address (the stand-in refuses one without).
- **Shown on a local stack** (`stack.sh up --name fix97 --ports 7860-7867`, the Nuvion stand-in, a seeded funded wallet): name check bank 044 and the account ending 0031 answered 200 "Forrest Green"; a made-up number (000...) answered 422 `name_check_failed` "We could not find an account with that number at that bank."; a bank send of 1,000 naira (fee quote total 1,050) answered 201 pending, and the stand-in's log shows lookup 200, entity read 200, counterparty 201, payment detail 201, transfer 201. Straight at the stand-in: a `bank_code` lookup body is the 422 about `issuer`, and a counterparty without email and address is the 422 naming `address` and `email`, as on dev. Stack stopped, ports empty, database dropped.
- **Round 2 checks (EXIT lines under `fix97-b/logs/r2-*` and `r3-*`):** `tsc` EXIT 0; eslint (no `--fix`) on the two changed `.ts` files EXIT 0; the same 8 nuvion suites in band (373 tests) EXIT 0 (the first run, `r2-nuvion-unit`, EXIT 1: the statements spec's counterparty, fixed as above), plus `nuvion-standin-hold-selfie.spec.ts` (9 tests) EXIT 0; backend gates EXIT 0 (0 fail, 133 warn, 88 accepted); `check_baseline.py` EXIT 0.
- **Next:** a verifier runs the new spec on `origin/main` and built, and the lookup and a bank send on dev. The lead merges backend `wmt/FIX-97` once CI is green on it.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `docs/nuvion/DEV-RESULTS.md` (the NUV-06 rows and "Failures for fix tasks"), `tasks/NUV-06.md`, DECISIONS.md R-39 and R-20
- backend `CLAUDE.md`; Nuvion's docs (Counterparties, Payment details, Transfers, Errors): the lookup is not in the public docs, its shape is what dev answered

## Goal

A person sees the holder's name for a Nigerian account, and a bank send gets as far as Nuvion's transfer, with the request and the answers Nuvion DEV really gives.

## Scope

`wawu-backend`: `src/nuvion/areas/payouts.ts`; `test/nuvion/payouts-standin.ts`; `src/nuvion/tests/nuvion-payouts.spec.ts` (three pinned guesses); `src/nuvion/tests/nuvion-payouts-dev-answers.spec.ts` (new); round 2: `scripts/dev/nuvion-standin.cjs`, `scripts/nuvion/counterparty-lookup-check.ts`, `src/nuvion/tests/nuvion-standin-statements.spec.ts` (one input). `wawu-wmt-mobile`: this file, `docs/nuvion/DEV-RESULTS.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`, `docs/LOG.md`.

## Capability checks

- [x] The name check sends `issuer.code` and reads `details.name`; a made-up number is "not found" (spec red on main, green built; dev through the Hub).
- [x] A counterparty carries the sending side's own email and address, never made up; either missing stops the send before any counterparty or transfer (spec; dev: counterparty 201, payment detail 201, insufficient funds).
- [x] `tsc`, eslint, the nuvion and contract specs, `test:protected` (base lock), the gates and the baseline check pass.
- [x] The local stack's stand-in and the lookup check script answer and send as dev does (stack walk above).
- [ ] The full backend run (CI) is green on the head.

## Builder report

- **Files (backend):** as in Scope. 4 files in round 1 (one new), 3 more in round 2.
- **Setup.** Database `fix97_hub_test` (migrated, seeded), dropped at the end; a Hub on 7860 and the mock WAWU ID on 7867 for the dev name check (a net guard that allows only this machine and api.nuvion.dev), stopped; the worktrees removed. Nothing Fintava was run; no key in any file, log or commit.
- **Gate counts.** Backend gates after: 0 fail, 133 warn, 88 accepted (same as main, 1 more file scanned). Mobile: 0 fail, 18 warn, 0 accepted; this task changes no mobile code, only its records.
- **Gaps / decisions.** The sender's email is the one on its Nuvion entity (the email WAWU sent when the wallet was opened). A dev transfer needs `narration`; `bankTransfer` only sends one when its caller gives one, and the Hub always does. Not changed.
