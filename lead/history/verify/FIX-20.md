# FIX-20 verifier report (16 Oct 2026)

Verdict: MERGE (nothing medium or worse). Three low findings go to the area sweep list.

Code under test: backend `wmt/FIX-20` bb9bbd1, trial-merged into backend main 56f94d0 (clean, 0 conflicts, no contract change);
mobile `wmt/FIX-20` 8c3a2f0 (docs only). Stack `fix_20` (the name `fix-20` is not a legal stack name; hyphen refused by stack.sh).
No CI run exists for bb9bbd1 (branch predates OPS-CI), so GitHub has not run the full suite on it.

## Findings

1. LOW. The "failed" row in CONVENTIONS section 21 and `WEBHOOK_STATE_RULES.failed.why` (src/webhook-retention/webhook-retention-config.ts)
   say a held `failed` delivery is "a stop for review (a reversal with no debit, a disagreement)". The code marks a disagreement
   delivery `processed`, not `failed` (src/money/ledger/ledger-consumer.service.ts:413 for a movement whose amount disagrees,
   :487-495 for a reversal that "disagrees"), so it is cleared at day 90 while its ledger row may still be pending MONEY-16 review.
   The figures of both sides stay on the ledger row (`discrepancy`: "Fintava's record says X kobo, the delivery Y"), so no
   amount is lost; the raw bytes are. The same holds for ledger-consumer.service.ts:253 ("no WAWU wallet on either side; nothing
   recorded", `processed`): the only local copy of such a delivery goes at day 90. Repro: read the three call sites above against the
   table. Fix: correct the sentence, or hold a `processed` row whose ledger row carries an open `discrepancy`; lead's choice.
2. LOW (decision for the lead/owner, already filed as G-750). The task's capability check says "a delivery older than the period has
   no body"; the job clears only `processed` (and Nuvion `test`). `failed`, `unrecognised` and `pending` keep their body for ever.
   `pending` is correct to hold while a reader needs it, but 15 of Nuvion's 27 documented events have no handler (accounts.updated,
   accounts.deleted, account_details.deleted, funding_sessions.updated, payment_intent.*, payment_dispute.*, payment_refund.*,
   cards.*), and Fintava `card_payment`/`dynamic_card_payment` have no consumer before WALLET-22. If NUV-10 subscribes the Nuvion
   webhook to those events, their rows (names, account numbers) are kept for ever. Suggest NUV-10 subscribes only handled events,
   or a later rule clears a pending row no handler lists. Not a defect against the builder's documented rule.
3. LOW. Migration stamp 20261021230000 sorts before main's 20261021240000, 250000 and 260000 (and the lead renames at merge, as the
   report says); CONVENTIONS section 21 numbering and the "see section 21" comments (account-data-map.ts, data-export-sections.ts)
   must be renumbered together. Also the "privacy data map" the task names was taken as the purge map and export list (code
   comments); mobile `docs/release/DATA-INVENTORY.md` I-092 and I-281 (provider webhook payload stored whole) were not updated
   to say "cleared after 90 days".

No blocker, high or medium found. Nothing needed for a refund, dispute or reconciliation that a reader uses is deleted: see checks 1 and 2.

## Checks

1. Readers of the two tables, scanned independently over backend main and all 14 other `wmt/*` branches (Prisma accessors and quoted SQL
   names): only the six files on the builder's list (receivers, ledger consumer, LedgerService.markAbsentFailed, Nuvion dispatcher,
   sandbox script). Consumer, dispatcher and retention read bodies of `pending` rows only; no code moves a row back to `pending`;
   MONEY-16 and the other branches add no reader. `sourceEventId` is an id string, not a read of the table. PASS.
2. Migration on live-shaped rows: 150,000 Fintava + 150,000 Nuvion rows, 0.5 to 6 KB bodies, all states, 150 legacy rows with a
   NULL hash, 437 MB. Applied in one transaction in 0.71 s; a concurrent insert waited 0.35 s; every existing row passes the CHECK.
   rollback.sql run and the migration re-applied: clean (rollback leaves 0 columns, checks, indexes). `prisma migrate diff` against the
   migrated DB: only the old `ContentPiece_specializations_idx` drift, nothing from this task. PASS.
3. Job at volume on that table, default limits, with 3 workers sending new deliveries and repeats: 41,250 Fintava (207 batches) and
   47,143 Nuvion (236 batches) cleared in 35 s; exactly the due `processed` and `test` rows; held rows (failed, pending,
   unrecognised) and hash-less rows untouched; 3,528 requests, p50 25 ms, p99 108 ms, max 245 ms, 0 wrong answers. PASS.
4. Storm: two job instances on two connection pools, batch 10, 1,500 old rows a table (750 + 856 due) while 4 workers replayed signed
   bodies of both providers and 2 workers posted new ones: each due row cleared exactly once (A + B = due), no error or deadlock,
   every repeat 200 duplicate, every new delivery recorded whole and untouched, a third run cleared 0, and a final replay of
   everything after clearing was 200 duplicate with no new row. Repeated at 300 rows. PASS.
5. Time zones: Node TZ (Pacific/Kiritimati, America/Los_Angeles, Asia/Tokyo) against database zones (Los_Angeles, Kolkata, Kiritimati):
   89 d 23 h 50 m kept, 90 d 10 m cleared on both tables each time; `receivedAt` and `bodyClearedAt` are UTC now (skew under 250 ms). PASS.
6. Setting: 0, 6, 3651, -1, 90.5, 1e2, 0x10, abc, a full-width digit string, 99999999999999999999, +90, "90 days", "9 0" are refused; 7, 90, " 90 ", 3650,
   007 and empty accepted. Real AppModule boot: exactly one `webhook-retention` job, `0 40 2 * * *`, next 17 Oct 02:40 UTC; a value
   of 3 stops the boot. PASS.
7. Builder specs plus neighbours: webhook-retention (44) + fintava/webhook + nuvion/webhook, 85 tests in 5 suites, pass; account-data-map
   and data-export-map specs 9 pass. `tsc --noEmit` 0 errors; eslint --no-fix on the 10 changed .ts files clean; gates 16 fail
   (same Flutterwave and notification files as main, none in this task), 104 warn, one new warn `PROVISIONAL(WEBHOOK-RETENTION-DAYS)`;
   `check_baseline.py` 108 entries ok; `contract:build` leaves contract/ unchanged. PASS.
8. Docs: BACKEND_GAPS G-750 to G-752 (5 columns, ids free on main and every branch), SHARED-CHANGES FIX-20 #1 to #3, README and
   .env.example accurate, no em-dash in any new user-facing line. PASS.

Not run: the full backend suite and protected routes 253/253 (no CI run on this sha; the change adds no route, and the real AppModule
boots); a real provider re-delivery; a wall-clock 02:40 tick (the registered job and its expression were checked).

## Cleanup
Stack `fix_20` down (Hub pid 10855, mock ID pid 10840 stopped, ports 7051-7054 closed); databases fix_20_wawu_hub_test and
fix_20_mig_test dropped; worktrees v-fix-20-be and v-fix-20-mrg removed; nothing pushed. My attack specs are kept in the scratchpad
as f20v-attack.contract.spec.ts.keep and f20v-boot.contract.spec.ts.keep; logs are scratchpad/logs/f20v-*.log.
