---
id: WALLET-27
title: Statements
owner: YOU
area: WALLET
order: 186
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-15]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-27 · Statements

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W38: statements for a date range, as CSV now and a stamped PDF from Fintava.

## Scope

CSV export; stamped PDF if Fintava provides it; emailed to the user.

## Capability checks

- [ ] A statement for last month lists exactly last month's transactions.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/WALLET-27` **5cd55c1** on main fe1ec6c (main did not move); mobile `wmt/WALLET-27` on main e7dc879 (did not move). MONEY-15 (`depends_on`) is `done`.
- **Built (backend, additive):** `GET /money/statements?from=&to=&format=csv` (`src/money/statements/`: controller, `StatementService`, `statement-csv.ts`, query DTO, `StatementView`), behind MONEY-13's gate, `no-store`, read from the MONEY-10 ledger only (never calls Fintava). Answers the CSV as text in the usual envelope (`content`, `fileName`, `contentType`, `rowCount`, `from`, `to`, `timeZone`, `generatedAt`). Rules in backend `docs/contract/CONVENTIONS.md` section 11; `WALLET.md` route row and W38 mapping; contract regenerated (one operation and `StatementView` added, nothing else moved). Small edits in other tasks' files: `money.module.ts` (one controller, one provider), `SERVED_MONEY_ROUTES` (+1), MONEY-13's two gated-route lists (+1 each). Script `scripts/fintava/statement-sandbox-check.ts`.
- **The period is two calendar days in Africa/Lagos time, both included** (`from` 00:00 to the end of `to`, Lagos), said in the DTO, the operation's summary and CONVENTIONS. 400 for: a day not `YYYY-MM-DD`, a day not on the calendar (`2026-02-30`, year 0000), `from` after `to`, `to` after today in Lagos, more than 366 days, any `format` but `csv`, and any extra query field (`wawuUserId=`, `accountNumber=`: forbidNonWhitelisted). The route takes no person or wallet, so a user only ever gets their own statement.
- **Check: a statement for last month lists exactly last month's transactions: passed** (`money-statement.contract.spec.ts`, real tokens, rows from the ledger's own writer). Last month is computed from today's Lagos date; rows at its first and last Lagos instants and between are listed oldest first; rows 1 ms before and at the next month's first instant, pending, failed and reversed rows, another person's rows, rows with the person's id on another account, another person's id on the account, and merchant-wallet rows are not; the lines add up to `/money/transactions/summary` for that month. Month boundary and ranges across it: 1 to 30 Sep, 31 Aug to 1 Sep, 30 Sep to 1 Oct, single days, a row at 23:30 UTC on 31 Aug (1 Sep in Lagos) and on 30 Sep (1 Oct in Lagos); each line's date and time are Lagos time. Every line equals its own W27 receipt (description, counterparty, reference, note, in, out, fee); three unlocks of one piece are three lines while W26 groups them; a quoted fee split shows `25065.00` out, `65.00` fees. 25 tests (14 HTTP, 11 unit). 13 one-line mutants of the service and CSV (UTC range, end inclusive, `to` exclusive, no status, no person, no account, no wallet kind, newest first, no formula guard, no future check, UTC day, 365-day cap, raw fee): all killed.
- **Sandbox** (`docs/fintava/sandbox/40-wallet27-statements.md`, 9 calls, 20:32 UTC): a real ₦10 round trip A to B and back; A's and B's statements for the Lagos day list exactly their two movements; A's send line carries the same reference and amount (1000 kobo, `SUCCESS`) as Fintava's own `GET /txn` record; balances unchanged; `to` in the future 400. Key scan 0 of 58 windows on the output and on the diff.
- **Checks:** `tsc --noEmit` 0; eslint 0 on every changed `.ts`. Money, Fintava, KYC, identity and rate-limit specs (`src/money src/fintava src/kyc-submission src/admin/kyc-review hub-rate-limits`, 42 suites): 1,511 passed, 25 failed, all in two suites unrelated to this change: `fintava-stall` (timing windows, run while the protected suite loaded the machine; 120/120 alone) and `kyc-submission` (hard-codes :4001; passes below). Full suite (`npx jest --runInBand --forceExit`) on fresh seeded `w27_full_test`, WAWU ID stand-in :4992: 126 suites, 3,037 passed, 3 skipped, 9 failed, all in `credits-state` and `account`, which hard-code :4001; the 12 suites that hard-code :4001 then ran with my stand-in there (`lsof` empty before and after, stopped straight after): 12/12, 224/224. So 0 failures. `hub-rate-limits` passes; no `@Throttle` added. Protected `run.sh --fresh 5cd55c1` (lock fe1ec6c): 253/253, all 244 required, no lock file touched. Gates before 16 fail / 13 warn / 76 accepted (645 files), after 16 / 14 / 76 (652 files), the same findings line for line plus one deliberate warning, `PROVISIONAL(STATEMENT-MAX-DAYS)`; `check_baseline.py` clean. CI tripwire 0 added lines. `contract:build` then mobile `sync_contract.py --backend`: copies backend origin/main fe1ec6c (ME-17's upload allowance types come with it); the statement route reaches the app's types when the backend branch merges. Mobile `npm run check` on this branch: exit 0 (typecheck 0, lint 0, 26 suites / 431 tests, gates 0 fail / 0 warn on 110 files, 205 tasks); the mobile change is docs, the task file, `BACKEND_GAPS.md` (G-68, G-69), the sandbox note and the synced contract.
- **Default (agent), owner may override:** (1) only `completed` movements are listed, the rows W26's summary adds up; pending, failed and reversed are left out (a reversed send's kept charges, if Fintava ever keeps any, would then not show). (2) No opening or closing balance and no totals: Fintava gives no past balance, and a sum is not a balance. (3) Unlock earnings one per line, never grouped. (4) At most 366 days, both counted (`PROVISIONAL(STATEMENT-MAX-DAYS)`); `to` may be today, never later. (5) The file travels as text in the JSON envelope, not as a download, so the envelope, the error shape and the generated client stay one. (6) Columns: Date, Time, Description, Counterparty, Reference, Note, Money in (₦), Money out (₦) (fees included), Of which fees (₦); naira with two decimals from integer kobo; UTF-8 byte-order mark, CRLF. (7) A text cell starting `=`, `+`, `-`, `@`, tab or CR gets a `'` first, so `@handle` shows as `'@handle`. (8) Copy the canvas does not draw: the column names and the four 400 messages ("from is not a day on the calendar", "from must be on or before to", "to cannot be after today in Lagos time", "A statement covers at most 366 days").
- **NOT RUN:** stamped PDF: Fintava publishes no statement endpoint (G-68); unblocked by Fintava confirming one. Emailing the statement: the backend has no email sender and none was added (G-69); unblocked by the owner question below and that provider's credentials in the backend env. V9 real sign-in: the verifier's pass (the sandbox run signed in at the stand-in WAWU ID). V10: no screen (WALLET-35 builds W38).
- **Owner question (G-69):** which email provider sends WAWU's mail, from which address, and may a statement (every movement and counterparty name for the period) be sent as an email attachment?
- **Findings:** the receiver's line carries Fintava's reference, not ours (G-44, MONEY-15's), so the two people's statements show different references for one transfer.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
