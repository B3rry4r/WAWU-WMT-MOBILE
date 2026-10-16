# FIX-42 · round history

Moved out of [tasks/FIX-42.md](../FIX-42.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-42` `4d7158f` on `wmt/FIX-40` `79cf759` (on `wmt/BILLS-04` `ba5e043`). Mobile on `wmt/FIX-40` (docs only).
- **Red on `79cf759`:** the new spec file, 9 cases: 7 failed, 2 passed (skew 0 and the sanity case). Skew 500 and 3000: the second bill `delivered` with the first bill's token (zz-vattack7 T2 made into assertions); the newest failure and the record on page 2 are not found; no index on `failedAt`; a server running Nuvion called Fintava for a Fintava bill (1 history call); two calls looked twice (2 history calls).
- **Green:** the same 9 cases pass (EXIT 0), and all of `src/wallet-bills` (6 suites, 55 tests).
- **A choice for the verifier:** the +10 s allowance on the earlier bill's delivery time is added only when that bill stored neither a record id nor a reference. A bill whose record is stored is excluded by it exactly, and BILLS-04's own specs (several delivered bills on one meter within seconds) need the plain delivery time for those. T2 is the no-ids case and is fixed.
- **Across servers:** the pass is claimed by a conditional update of the newest failure's `checks` from the value read; it stops two servers that wake together (the cron ticks line up), not a second pass that starts after the first has claimed. Every write the pass makes is conditional, so a repeat is harmless.
- **Migration:** `20261023230000_wallet_bill_failed_at_index`, one `CREATE INDEX`; `prisma migrate diff` against the migrated database shows no `WalletBill` difference (its only output is a ContentPiece index that was already there). SHARED-CHANGES FIX-42 #1.
- **Checks:** `tsc --noEmit` EXIT 0; eslint --no-fix on the touched files EXIT 0; `contract:build` twice, same file as committed (no route changed).
