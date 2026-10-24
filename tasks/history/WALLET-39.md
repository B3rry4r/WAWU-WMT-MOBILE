# WALLET-39 · round history

Moved out of [tasks/WALLET-39.md](../WALLET-39.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 17 Oct 2026 (a Sonnet agent for the lead). Backend `wmt/WALLET-39` 2194ffb on backend main a5e48fc; migration `20261024070000_money_in_all_credits`. CI run 38986718009 and the other runs on that commit (results in the lead's hand-back).
- **Files (backend):** `money-in-notice.service.ts` (four categories; the correction pass `sweepCorrections`/`correctEntry`; the target on each notice), `money-in-sources.ts` (new: a ledger row to its words), `money-in-notice-config.ts`, `notification-event.ts` (kind `money_in_reversed`, `MoneyInSource`, `moneyInShortName`, target kind `transaction`), `push-policy.ts`, `me-notifications.service.ts` and `me-view.type.ts` (resolve the target for its owner only), schema and migration, `contract/openapi.json` (+2 -1), README, `docs/contract/PUSH.md`.
- **Check 1 (friend's send, earning, refund, bank transfer: one notice each, a repeat none): passed.** `money-in-all-credits.contract.spec.ts` (21 tests, real database, ledger, notification service, push sender and Expo stand-in): four rows, four notices; each credit seen again by webhook, history and lookup is the same row; a second process and `noticeEntry` tell nothing more; a pending send is told once, when it completes; a hold's release and refund, with the merchant side left alone; Nuvion rows only by a Nuvion server; "Money in" off mutes all four and does not bring them back.
- **Check 2 (amount and source, no account number): passed.** `money-in-all-credits-units.spec.ts` (25): every wording, no run of six digits, no dash, no wallet or balance language, "Tolu B." not "Tolu Bakare", kobo kept in the words.
- **Check 3 (a reversed credit gets a correction): passed.** For each of the four categories: told, reversed through the ledger's own merge, corrected once, the notice left alone, a repeat and three processes at once write one; nothing for a muted credit or one reversed before it was told; a failed write leaves no mark and is retried; the push carries the target, and "Money in" off silences only the push; the migration's two backfills.
- **Opens the right screen:** `GET /me/notifications` gives `target {kind: transaction, id}` for the owner only (spec). The tap itself is INBOX-21's; not built here.
- **Existing specs changed on purpose** (the behaviour they pinned is what this task changes): `money-in-notice.contract.spec.ts` (the push `data` now has the target; the two "does not tell a transfer / an earning" rows are gone; `beforeAll` also runs the new backfill so other suites' credits are not news), `push-policy.spec.ts` (the new kind's example and its push-only gate). No other test, gate or baseline touched.
- **Checks:** `tsc` 0; eslint (no fix) on the changed files 0; the money-in-notice suites 4 of 4 (116 tests), push, openapi, me, notification, notification-settings and money history 10 suites 285 tests, on a migrated and seeded database; gates 5 FAIL, the same five as main (none in a file this task wrote). `npm run contract:build` twice the same bytes.
- **Filed:** SHARED-CHANGES `WALLET-39 #1` (schema, migration) and `#2` (contract); BACKEND_GAPS G-730, G-731, G-732 closed.
- **NOT RUN:** a real phone and Expo (V10); a real Fintava or Nuvion credit (no provider is called).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

