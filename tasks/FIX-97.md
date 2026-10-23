---
id: FIX-97
title: The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers
owner: YOU
area: MONEY
order: -97
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-97 · The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers

## Current state

As of 23 Oct 2026, review: the verifier (a Sonnet agent that built none of it) passed Part A on backend `wmt/FIX-97` `e678f35` (on `origin/main` `62876ea6`; round 1 `7f9a172`). Mobile record head before this commit `853a0361`. Full report: [history/FIX-97.md](history/FIX-97.md), "Verifier report".

| Fix | After (built) | Verified |
|-----|---------------|----------|
| 1. Name check request | `{country, account_number, issuer: {code}}` | new spec 10 of 10 red on main, green built; dev 200 and 422 read live |
| 2. Name check reader | name from `data.details.name`; 404 `error_resource_not_found` is not found | same spec; dev "Forrest Green" for bank 044, number ending 0031 |
| 3. Counterparty | `profile.email` and `profile.address` are the sending side's own, from its Nuvion entity (WAWU's own sends: the operational account's entity); missing either stops the send before any counterparty or transfer | spec (7 tests); dev: counterparty 201, payment detail 201, transfer 400 insufficient funds, from a Hub-opened person and from the operational account |

- **Part A: PASS.** No blocker, high or medium. tsc, eslint (6 `.ts` files), 11 nuvion suites (659 tests), 4 contract suites on the changed stand-ins (62 tests), `test:protected` (253), gates (0 fail, 133 warn, 88 accepted, same as main) and `check_baseline` all EXIT 0. Round 2's change to `nuvion-standin-statements.spec.ts` is one input (the counterparty's email and address); no assertion changed, and main's copy fails 9 of 9 against the dev-faithful stand-in. A bank send on the local stand-in stack ran end to end (201, completed, balance fell by 105,000 kobo).
- **Part B: blocked by Nuvion.** An NGN card payment intent into a Hub-opened wallet is created (201) but cannot be confirmed with the docs' test card encrypted with the dev PEM: 400 `error_acquiring_currency_not_supported` (3DS required, 3DS disabled, and create-and-confirm alike). The PEM is accepted. So the funded bank send, the move into the operational account, the limit refusal, the month's statement and Nuvion's dev fees (inflow, book transfer, bank payout) are NOT RUN; `money:check` is `clean` (1 of 1 wallets). Written into `docs/nuvion/DEV-RESULTS.md`.
- **Lows to the NUV sweep:** `readLookup` accepts an answer with a name and no `status`; no spec pins the sender-email pattern.
- **Open:** the full backend run (CI) on the head; the lead merges backend `wmt/FIX-97` once it is green. Funding a dev wallet needs Nuvion to enable NGN card acquiring on the dev key, or to name another way.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-97.md](history/FIX-97.md).

