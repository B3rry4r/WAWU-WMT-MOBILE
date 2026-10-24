# SWEEP-MONEY · round history

Moved out of [tasks/SWEEP-MONEY.md](../SWEEP-MONEY.md) word for word, oldest first. The current state is in that file.

## Builder report

Part 1 (W4a, builder, 17 Oct 2026). Rows 1 to 52 of the table (KYC-07 L2 to FIX-20 L3); each row carries its outcome.
- Heads: backend `wmt/SWEEP-MONEY-1` from MERGE-12 98efeef: 8f93cf8, e2a07bb, 62d6d92 (e2a07bb had a quote error, fixed in 62d6d92). Mobile `wmt/SWEEP-MONEY-1` from MERGE-12 c840ed6d: adb31d2e and the table commit after it.
- Fixed with a spec: KYC-07 L2, SCHOOLS-09 L1, MONEY-16 RF-1 RF-5 RF-6, NUV-06 F3, NUV-03 N2, WALLET-06 T4, WALLET-07 D3, WALLET-04 D2 D3 D4, POINTS-04 L3, FIX-20 L1 L3, NUV-06 F1 F2 (records). Closed elsewhere: WALLET-07 D4 (SETTINGS-06), WALLET-09 F8 (FIX-41).
- Ruled no (24): Fintava code (BILLS-01 R4-1 to R4-5), unnamed mutants, by design, accepted, or not worth the risk (POINTS-04 L1 was tried and reverted: three crash specs model a kill as `drive()` throwing).
- Waits: MONEY-16 RF-3 RF-4 (wawu-id repo), FIX-41 F1 (G-767), FIX-20 L2 (NUV-10). Not reached: WALLET-07 D1 D2, TIER-02 D11 T14, WALLET-10 L5.
- Changed assertions of tests I did not write, because the row changes the behaviour: money-check-units.spec.ts (a mail answer is taken only with `emailed: true`).
- Checks: backend tsc EXIT 0; eslint EXIT 0 on changed files; protected suite 253 of 253 (seeded test DB, mock WAWU ID on 7885); gates passed, baseline EXIT 0; specs run: money-check units 36, money-check contract, nuvion-payouts contract and unit, nuvion-opening (one test, mutant checked), school-report 12 of 12, points-convert-nuvion and points-cash-out-crash 27 of 27, webhook-retention config, wallet-provider-error. wallet-transfer.contract.spec.ts was run by mistake in a batch (it uses the Fintava double and failed 34 on auth in this setup); it is Fintava, not used as evidence, nothing reached a provider.
- Mobile: jest of touched features (open-wallet 22 suites 337 tests, history and PIN specs) passed; eslint EXIT 0; `tsc` shows only the missing `react-native-view-shot` module (shared node_modules older than the lockfile), nothing from these files.

Part 2 (builder, 17 Oct 2026). Rows from WALLET-07 D1 to the end of the table (AITOOLS-01 L4), plus the lead's two notes; each row carries its outcome.
- Heads: backend `wmt/SWEEP-MONEY-2` from MERGE-13 6bc7b20: 5dd4efe, 634d9c1, c7dfc2f. Mobile `wmt/SWEEP-MONEY-2` from `wmt/SWEEP-MONEY-1` 72bf80be with MERGE-13 4c7b2acd merged: 686ba56c, a4b9b333 and the table commit after it. wawu-id `wmt/SWEEP-MONEY-2` from MERGE-12 af96333: 4b81958.
- Fixed with a spec (24): WALLET-07 D1 D2, WALLET-39 F1 F4, FIX-26 L1, LEGAL-06 B3a L4 and L5, LEGAL-05 B1 F5, WALLET-16 R55-1 R55-2, AITOOLS-01 L2, POINTS-02 L2 L3, TIER-04 L1, SCHOOLS-09 L1 (the other five waits), SETTINGS-06 L15, FIX-17 F5, MONEY-16 RF-3 (wawu-id), KYC-07 L5; comments or .env.example: WALLET-37 L2, WALLET-17 L2, WALLET-23 L4, WALLET-16 B1 F2, INBOX-24 L1 (listed; the move to admin settings waits).
- Closed elsewhere or already (6): TIER-06 L3 (FIX-45), KYC-06 L3, KYC-07 L1, WALLET-38 L3, SETTINGS-06 L7 L8.
- Ruled no (80): Fintava (WALLET-23 L1 to L3, WALLET-09 R2-2, FIX-42, WALLET-40, SETTINGS-06 L5 L9), by design or accepted, needs an owner call, or a T2 change that needs its own round (FIX-41 F3, SCHOOLS-11 L1, TIER-05 R2-L2, WALLET-10 L5). SETTINGS-06 L16 (b) and (c) stay ruled no (the round 9 spec pins `ada@localhost` as an email); round 2 moved L10 and L16 (a) to waits. Part 1's BILLS-01 R4-6 reason is corrected to "deferred: web paused (R-49)".
- Mutants run by hand: WALLET-07 M02, M20, M21 each fail the new specs; the code of each fix was put back to its old form once and the new spec failed (LEGAL-06 L4, LEGAL-05 F5, AITOOLS-01 L2, WALLET-39).
- Checks: backend tsc EXIT 0; gates passed, baseline EXIT 0; protected suite 253 of 253 (with the storable-text pipe wired in); specs run on the Nuvion stand-in only, none under test/fintava/ and none importing the Fintava double. Mobile: jest OpenWalletScreen 39 of 39, legalModels 16 of 16. wawu-id: tsc EXIT 0, money-check-report 28 of 28.
- Changed assertions of tests I did not write: none. New cases added to existing specs, one file made (deletion-hid.spec.ts).

Part 2, round 2 (builder, 17 Oct 2026). The verifier overturned AITOOLS-01 L2 (medium) and three record rows.
- AITOOLS-01 L2: the first fix released the hold on any `record()` error, including the lost race on the unique index, where the hold is the winner's (a same-key request with other words got 409 and ended the running job: no audio, points back). Now the hold is given back only when the job row cannot be written (not a unique violation), and only if no row exists under that id; the lost race never touches it. Backend head: 1b49b11 on `wmt/SWEEP-MONEY-2` (after c7dfc2f); mobile records: the commit after 85e65da7. Spec added in ai-tools.contract.spec.ts: the loser gets 409, the winner's hold stays held and the job ends `done` with the hold `committed` (it fails on the first fix: hold `released`); the create-failure case still releases.
- Records: SETTINGS-06 L10 now waits for FIX-65 with G-SETTINGS-06-1 in BACKEND_GAPS.md (which uploads stay, from the code); SETTINGS-06 L16 (a) waits with its own reason, (b) and (c) stay ruled no; INBOX-24 L1b is its own open row.
- Side effect to know: after a failed job write the reference is spent, so a repeat under the same Idempotency-Key answers 409 `points_hold_settled` ("Start the job again to hold new points") and needs a new key. Before the L2 fix that repeat would have succeeded. Not changed here; the lead rules it.
- Checks: ai-tools specs 35 of 35 (Nuvion stand-in stack ports, own database, no Fintava spec); tsc and eslint on the changed files, gates, in the hand-back.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

