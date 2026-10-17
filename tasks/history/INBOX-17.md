# INBOX-17 · round history

Moved out of [tasks/INBOX-17.md](../INBOX-17.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B3a, 17 Oct 2026 (Sonnet builder), backend `wmt/B3a` `ed45009`.
- Files: `src/direct-message/wallet/` (rules, dto, view types, service, controller, module, 11-test spec); `src/direct-message/dm-answered-hooks.ts` and `dm-reply-writer.ts` (the post-commit step after an answer); `dm-refund.service.ts` and `src/scheduler/scheduler.service.ts` (the Flutterwave refund sweeps skip `wallet:` questions); `src/money/dto/money-enums.ts`, `src/money/money-contract.ts`, `docs/contract/CONVENTIONS.md` (`question_already_waiting`, 409); `docs/contract/WALLET.md`; `prisma/schema.prisma` and migration `20261025150000_paid_dm_drafts`; `src/account-purge/account-data-map.ts`; the two route inventories; `contract/openapi.json`.
- Checks: tsc 0; eslint 0 on the new files (3 prettier lines in `direct-message.module.ts` and `scheduler.service.ts` are older than this task); gates 0 fail; 11 of 11 new tests; the legacy DM, hold, money and account purge specs pass (the 100,000-character scrub timing spec failed once under load and passed alone).
- Port note: 7720, 7726 and 7727 were in use by another stack; this run used 7920 to 7927 (database `b3a_wawu_hub_test`, removed).
- Not done: a mutation run; a load measurement; the Fintava specs (never run).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Builder report (round 2, B3a, 17 Oct 2026)

Files: backend `src/money/holds/wallet-hold.service.ts` (`release(..., { asEarning })`), `hold-rules.ts`, `src/direct-message/wallet/paid-dm-wallet.service.ts` (release as earning, refund with `returnCharge`), `src/money/earnings/earnings-view.service.ts` (no double count), `src/account/account-deletion-money.service.ts`, `src/data-export-request/data-export-sections.ts`, migration `20261025170000_hold_release_earnings`, docs WALLET.md and CONVENTIONS.md.
Checks: `tsc --noEmit` EXIT 0; lint clean on the changed source files; gates 0 fail; 36 suites, 721 passed, 3 skipped (EXIT 0) over the DM, event, tip, unlock, legal, data export, earnings and Nuvion hold specs.
Each new or changed spec fails on `ed45009` and passes after: `paid-dm-wallet.contract.spec.ts` (4 failed before: earning shape, no wallet, lapse returns the charge, two answers in one move), `data-export.contract.spec.ts` and `data-export-map.spec.ts`.
Not run: Fintava specs (rule); the app.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-17.md](history/INBOX-17.md).

