---
id: MONEY-10
title: The ledger
owner: YOU
area: MONEY
order: 62
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-07]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-10 · The ledger

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Our record of every movement of money, mirrored from Fintava, in kobo.

## Scope

Transaction store: amount in kobo, direction, counterparty, category, note, Fintava reference, status.

## Capability checks

- [ ] Every sandbox movement in MONEY-06 to MONEY-08 appears once in the ledger with the right sign.
- [ ] Amounts survive round trips exactly (no floats).

## Builder report

Backend `wmt/MONEY-10` f94f442, origin/main 14a7fb2 merged as da74274; mobile `wmt/MONEY-10` from main ca6d6cb.
- Files: `src/money/ledger/` (service, consumer + sweep, webhook reader, config, module, 2 specs), `FintavaLedgerEntry` + `FintavaLedgerReference` and additive migration `20261002210000_fintava_ledger` (5 enums, 2 tables; diff on a fresh DB shows only the old `ContentPiece_specializations_idx` drift), `money.module.ts` imports it, `account-data-map.ts` classifies the 3 new wawu columns, `.env.example`, `scripts/fintava/ledger-sandbox-check.ts`. No route (history is MONEY-15), contract unchanged (regenerated: order-only diff, not committed).
- Once: every reference a row is known by is a key row (account, direction, value); insert with `ON CONFLICT DO NOTHING`, a collision folds into the holder (locked, re-checked). Deliveries are locked `FOR UPDATE SKIP LOCKED` and marked processed in the same transaction. Tests: 3 shapes x 2 copies consumed concurrently (6 consumes + a sweep), one row per side; 10 racing writers with overlapping references, one row. G-19: a delivery matches on any field (ours, Fintava's, tagapay, id).
- Sign and kobo: out on the sender, in on the receiver; naira to kobo once (`fintavaAmountToKobo`), BIGINT, back exactly (every kobo 1..100000 and edge values round-trip; 3 decimals refused, event `failed`, nothing written). Never a balance (a test greps the ledger code for any sum).
- Reversal: the row becomes `reversed` with Fintava's amounts; replay and a late SUCCESS change nothing; one row, never a second debit. Before its debit it waits; with no debit past the window it fails and writes nothing.
- Unknown: undocumented events stay `unrecognised`, card events stay pending (WALLET-22); no WAWU wallet: processed, nothing written. `{}` lookup: pending, then lands.
- Mutation checks (8): no ON CONFLICT, status moving back, sides swapped, float kobo, reversal not marking, references never colliding, every event swept, reversal writing a debit: each fails the specs.
- Checks: tsc 0; eslint clean on changed files; ledger specs 29/29 (8 repeat runs green). Full `test:contract` on fresh seeded `m10_full_test`, mock WAWU ID on :4761: 101/104 suites, 2013 passed, 3 skipped; 35 failed = `kyc-submission`, `privacy-settings`, `credits-state`, which hardcode `localhost:4001` (fetch failed): NOT RUN on this session's ports. Protected `run.sh --fresh wmt/MONEY-10` on `m10_protected_test`: 253/253 (244 required), lock unchanged. Gates before 16 fail / 3 warn / 76 accepted; after 16 / 5 / 76, the same 16 fails as main 14a7fb2 (main 4 warn; +1 `PROVISIONAL(LEDGER-CONFIRM-WINDOW)`). Mobile `npm run check` before (98ad860) exit 0, gates 0 fail on 75 files; after (main ca6d6cb merged) exit 0: 16 suites / 285 tests, gates 0 fail on 75 files, 201 tasks. `npm run api` not run: no route, contract unchanged.
- Sandbox (`docs/fintava/sandbox/28-money10-ledger.md`): two ₦10 round trips, WAWU to A and back, WAWU to B and back; 8 rows for 4 movements, each once per side with the right sign, from receipt, lookup, history/by-id and locally signed webhooks (no tunnel, R-25) in every order; balances back where they started; 31 + 7 calls, dev host only, no key window in any output. Found and fixed: a delivery whose other side was held waited on Fintava; it now takes the held row's references.
- Default (agent), owner may override: a 30-second sweep, not on receipt (MONEY-07's route stays as built); a w2w delivery with no status is completed; `account_funded` and `virtual_wallet_payment` trusted alone (history lists no credits); confirm window 72 h (PROVISIONAL); ledger rows `OWNED` in account deletion like `WalletLedgerEntry` (retention of money records is the owner's call); MONEY-08 and WALLET-10 work from ledger rows (G-25).
- Gaps: G-19 updated (matching built), G-25 filed. No shared-change request.
- NOT RUN: bank sends, their reversals and bills in the sandbox (question 17); `account_funded` in the sandbox (needs a bank and a tunnel); real deliveries (OPS-10); V10 (no screen).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
