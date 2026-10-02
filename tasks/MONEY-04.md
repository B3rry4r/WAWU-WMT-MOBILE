---
id: MONEY-04
title: Money conventions and the wallet contract
owner: YOU
area: MONEY
order: 13
priority: launch
repo: wawu-backend
type: contract
status: verifying
depends_on: []
decisions: []
passes: [V1]
artboards: []
---
# MONEY-04 · Money conventions and the wallet contract

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Mobile builds wallet screens against an agreed contract before Fintava is connected.

## Scope

docs/contract/CONVENTIONS.md (money in kobo, phone in +234 normalised by the server, one error shape, Idempotency-Key header, how the PIN is sent, cursor pages). Contract entries for wallet, PIN, transfers, pay-from-wallet, holds and history in the backend's registry, from Fintava's docs (OPS-02). Also: named schemas instead of the duplicated inline response shapes (BACKEND_GAPS G-1).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava amounts are naira decimals (`2.75`, `"100.00"`), not kobo. The contract stays in kobo integers; conversion happens only inside the Fintava client (MONEY-06), by parsing the decimal string, never through a float. Fintava has no Idempotency-Key: ours is enforced by our backend, and our `CustomerReference` goes to Fintava where it is accepted.

## Capability checks

- [ ] Every wallet artboard's data needs (docs/analysis evidence, flow wallet) maps to a contract entry.
- [ ] Conflicts between the canvas and Fintava's real behaviour are listed for the owner, not resolved.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-04` in both repos (wawu-backend commit `b00e4c3`, from main `b7d4e63`).
- **How the contract is declared:** `contract/openapi.json` is generated from the Nest controllers and DTOs (emit) plus handler return types (enrich), and `contract/**` is fenced, so the wallet contract is code: DTOs, named views and controllers in `src/money/`, in `MoneyContractModule`, which AppModule does not import (nothing is served). `emit-openapi.ts` adds its 29 operations marked `x-wawu-served: false` and `x-wawu-built-by: <task>`. A hand-written spec was rejected: the app reads only `openapi.json`, and a second file would drift once the routes are built.
- **Backend files:** `docs/contract/CONVENTIONS.md`, `docs/contract/WALLET.md` (routes, payment kinds, artboard mapping, conflicts, gaps), `src/money/**` (DTOs, views, enums, error envelope, 5 controllers, module, spec), `src/openapi/emit-openapi.ts`, `scripts/enrich-contract.js` (nullable named fields as `allOf` + `nullable`, money types only), `contract/openapi.json` (regenerated; also picks up main's missing profile `headline`), `CLAUDE.md` (pointer). Mobile: this file, `BACKEND_GAPS.md` (G-1 updated, G-7, G-8), `docs/LOG.md`.
- **Conventions chosen:** PIN only in `X-Transaction-Pin` on debits (never URL, body or log; new PINs in the PIN route's body). `Idempotency-Key` required on `transfers/wawu`, `transfers/bank`, `payments`: same key and body replays the stored result, different body is `409 idempotency_key_reused`; refusals before money moves are not stored. Errors: the existing envelope plus `reason.code` (27 codes, one HTTP status each).
- **Check 1 (data needs mapped):** every launch artboard in WALLET-01..06, 11, 13, MONEY-02, 03, KYC-03, 04 is mapped in `WALLET.md` section 3; after-launch ones listed. Not mapped to a Hub route, with reason: A5, A6, A14, A16 (WAWU ID, KYC-01/02), W39 earnings (WALLET-16, existing route), Face ID (MONEY-14). Tested by `src/money/tests/money-contract.spec.ts` (8 tests: not mounted, markers, named bodies, nullable refs, headers, no PIN in URL) and by generating types with openapi-typescript 7.13.0 (parses; `account` is `WalletAccountView | null`).
- **Check 2 (conflicts listed, not resolved):** 11 items in `WALLET.md` section 4, including two nobody has ruled: who pays Fintava's charge on the second leg (creator's 85%, hold release or refund), and whether WAWU's ₦25 comes back on a failed bank send.
- **Gates, backend:** tsc 0 before and after; eslint on changed files 0; gates 16 fail / 0 warn / 76 accepted before and after (all 16 already on main, exit 1 on main too), files scanned 525 to 536; baseline check passes. Protected route suite: 244 of 244 before (origin/main, fresh `money04_protected_test`) and after (this branch, fresh).
- **Gates, mobile:** `npm run check` exit 0 before and after (gates 0 fail, 23 files).
- **Not done:** the wallet-opening request (MONEY-12, needs KYC-01's design), Face ID device routes (MONEY-14), G-1 for served routes (retypes live contract entries; G-1 row), daily limits (no task, G-7). `npm run api` not run here: the app picks the routes up once this merges to backend main.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
