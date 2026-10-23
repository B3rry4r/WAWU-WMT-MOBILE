---
id: FIX-97
title: The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers
owner: YOU
area: MONEY
order: -97
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-97 · The Nuvion name check and bank-send set-up use the shapes Nuvion DEV answers

## Current state

As of 23 Oct 2026, building (a fix round): FIX-97 is merged (backend `origin/main` `412bba2`), and the verifier's funded dev run found a high defect in it. Round 1 and 2 reports and both verifier reports: [history/FIX-97.md](history/FIX-97.md).

- **Open, high (the fix round):** a bank send from a funded dev wallet fails. The counterparty's address is `{line1, city, country}`, and Nuvion's `POST /transfers` needs `state_or_province` and `postal_code` on it as well: 422 `counterparty.address.state` and `counterparty.address.postal_code` required (request 01M5MJABG4WBBV51HMQC8YZ52C). The sender's entity holds both (`address.state`, `address.postal_code`). Fix in `src/nuvion/areas/payouts.ts` (`createCounterparty`, `readSenderContact`): read both, stop the send before any counterparty when either is missing (as for the email), and make `test/nuvion/payouts-standin.ts` and `scripts/dev/nuvion-standin.cjs` refuse a transfer whose counterparty lacks them, with a spec that is red before. Proven the only gap: after a PATCH adding the two fields to the Hub's counterparty, the Hub's send ran end to end (201 pending, Nuvion transfer `successful`, fee 50,000, Hub `completed`, balance fell by 152,500).
- **Open, medium, to rule (not FIX-97's diff):** after a refused bank send the fee give-back leaves WAWU's fee-collect ledger row `reversed` while Nuvion shows that transfer `successful`; the NUV-08 sweep flags it and `money:check` stays at `differences` (2,500 kobo, row dd9b8c36).
- **Done and passed:** Part A of round 1 (new spec red on main, green built; tsc, eslint, nuvion and contract suites, `test:protected`, gates, baseline; the stack walk), the name check on dev, the counterparty with email and address, and from the funded run: naira landed (EUR funding session in Chromium, FX quote, book transfer to the wallet's `nuvion_ban`), the fee quote, a payment into the operational account, a book transfer, the statement against the transfers.
- **Dev fees in kobo:** bank payout 50,000 (flat), book transfer 0, naira inflow by FX book transfer 0, EUR open-banking inflow 500 EUR cents on 1,000; NGN card inflow not measured (Nuvion refuses NGN cards). All in `docs/nuvion/DEV-RESULTS.md` with request ids.
- **Not run:** a limit refusal (insufficient funds answers first at this balance); CI on the merged head.
- **Low:** the stack's default bank-payout fee (2,500 kobo) is far under Nuvion's (50,000); the production `NUVION_FEE_BANK_PAYOUT` is the owner's setting.

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
- [ ] The counterparty also carries the sender's state and postal code, and a bank send from a funded dev wallet reaches Nuvion's transfer (spec red before; the stand-ins refuse a transfer without them).
- [ ] The full backend run (CI) is green on the head.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-97.md](history/FIX-97.md).


