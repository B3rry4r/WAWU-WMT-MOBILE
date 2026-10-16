---
id: FIX-42
title: Bills follow-ups, a skewed clock cannot settle a bill with the last bill's record, and the late-success look reaches every recent failure
owner: YOU
area: MONEY
order: 292
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [BILLS-04]
decisions: [R-19, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-42 · Bills follow-ups, a skewed clock cannot settle a bill with the last bill's record, and the late-success look reaches every recent failure

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Built on `wmt/FIX-40` (so on `wmt/BILLS-04` `ba5e043`): backend `wmt/FIX-42` `4d7158f`. From the BILLS-04 verifier's round 2 (findings 1 and 2), with the lead's rulings of 16 Oct 2026.
- **History guard:** when the earlier delivered bill (same meter or number, same amount) stored no record id, nothing in Fintava's history before its delivery plus the history skew (10 s) can settle the second bill, so with a skewed clock and a lost second purchase the bill stays `processing` with its hold held (the safe side). A bill whose record id or reference is stored is excluded by it, as before, with no allowance.
- **Late-success look (every 30 minutes):** newest failures first (50 a pass, already-noted ones left out in the query); Fintava's merchant history read a page at a time (100 records, at most 10 pages) back to the oldest failure being looked at, and a bill older than what was read is left for a later pass with a warning; an index on `WalletBill(status, failedAt)` (migration `20261023230000_wallet_bill_failed_at_index`, SHARED-CHANGES FIX-42 #1); only bills whose payment belongs to the provider this server runs (R-39: under Nuvion a Fintava bill left in the database is never asked about at Fintava and gets no ledger row); one pass at a time (a flag in the process, and a conditional claim on the newest failure's `checks` across servers; nothing is held across the call to Fintava).
- **Open findings:** none yet.
- **Id and order:** filed after-launch at order 292, the way FIX-40 (order 291) is: the checker keeps launch tasks before CHECK-3 (order 253). The lead can move it.
- **Next:** an independent verifier.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/BILLS-04.md` and its history (the verifier's round 2 report), `tasks/FIX-40.md`

## Goal

A lost bill purchase is never settled with another bill's record, even when Fintava's clock and ours differ, and a bill that failed and was refunded but was bought after all is found whatever the merchant wallet's traffic.

## Scope (backend only)

`src/wallet-bills/wallet-bill.service.ts` (`guardFor`, `scanLateSuccesses` and its helpers), `src/wallet-bills/wallet-bills.module.ts` (the wallet provider seam is imported), `prisma/schema.prisma` and the migration (one index). Specs: `src/wallet-bills/tests/wallet-bill-fix42.contract.spec.ts`.

## Capability checks

- [ ] The first bill answered with no ids, Fintava's clock 500 ms and 3000 ms ahead, the second bill's purchase answered 504 (nothing bought): the second stays processing, no token, hold held.
- [ ] More failures than one pass reads: the newest failure's late success is found.
- [ ] A record that sits behind 150 newer records (page 2) is found.
- [ ] The index on `failedAt` exists after the migration.
- [ ] A server that runs another provider makes no Fintava call for a Fintava bill and writes no ledger row; a Nuvion payment's bill is left alone by a Fintava server.
- [ ] Two calls in one process look once; a second server that claims from the same state does not look.
- [ ] Backend `tsc --noEmit` and eslint on the touched files exit 0; CI gates show the same FAIL lines as the base.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-42.md](history/FIX-42.md).

## Owner sign-off
