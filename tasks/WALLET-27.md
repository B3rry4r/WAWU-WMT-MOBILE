---
id: WALLET-27
title: Statements
owner: YOU
area: WALLET
order: 259
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: done
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

### Builder round 4

Builder, 4 Oct 2026 (the builder of rounds 1 to 3). wawu-backend `wmt/WALLET-27` **5c36881**: round 4 is fd1fa75 on 9f884dc, then backend main e6bd701 (HOME-05) merged in with no conflict. Mobile `wmt/WALLET-27`: the verifier's 58c07d9, then mobile main f8130cd (ME-06) and 2874688 (HOME-05) merged in. `BACKEND_GAPS.md` keeps G-95 and main's G-100 to G-103 and G-110 to G-113; PROGRESS was taken from main and regenerated. Both mains moved while round 4 was being checked. The container restarted part-way through the checks, so the checks were run again from the start.
- **Defect 2: the route's own 400s no longer count against the person.**
  - The controller now checks the period with `checkedPeriod` before `StatementRateLimiter.take`. A day not on the calendar, `from` after `to`, a future `to` and more than 366 days are all 400 before the person is counted. The DTO's 400s were already refused before the handler.
  - `take` now returns a one-shot give-back. `400 statement_too_large` gives its place back (lead ruling); it only touches the windows it was counted in, and a second call does nothing.
  - A `503 statement_busy` still counts (round 3's default).
  - Test, over HTTP with the real limiter: one person sends each of the five 400s (`2026-02-30`, `from` after `to`, `to` tomorrow, 367 days, and `statement_too_large` over 50,001 real rows) five times, so 25 × 400. Five good requests then get 200, and the sixth is `429 statement_rate_limited`: none of the 25 counted, and the limit still holds.
- **Defect 3:** CONVENTIONS section 12 is rewritten as built.
  - The round-2 throttle text (`@Throttle`, `STATEMENT_THROTTLE`, the address-plus-`sub` bucket) is gone.
  - It now describes the global per-address limits, unchanged on this route.
  - It describes `StatementRateLimiter`: 5 a minute and 30 an hour, fixed windows per verified wawuUserId, counted after the sign-in check and the gate, the swept map, and `retryAfterSeconds` rounded up.
  - It lists what counts (a statement served, a busy answer) and what does not (the DTO's 400s, the period's 400s, `statement_too_large`, the gate's 409s, the token's 401).
  - It describes `StatementSlots`: 2 at once, waiting in order up to 5 s, then `503 statement_busy`.
- **Test gap X4:**
  - The limiter is asked 500 ms into a full minute and must answer `retryAfterSeconds` 60, not 59.
  - A busy answer after a 1.5 s wait must say 2, not 1.
  - Giving a place back twice gives back one.
- **Mutants** (each alone, file restored by copy): all 5 killed. They are: the period not checked before `take`, no give-back, `Math.floor` in the limiter, `Math.floor` in the busy answer, and a give-back that works twice.
- **Main finding A filed as BACKEND_GAPS G-95** (medium): the throttler's `resetBlockdRequest` clears every caller's timers, so one address can push other people into 429 on every route. It is not fixed here; a lead task owns it.
- **Checks on fd1fa75, then on the merged head 5c36881:**
  - `tsc --noEmit` 0; eslint 0 on every changed `.ts`.
  - Statement, rate-limit and money-contract specs: 4 suites, 59/59.
  - Protected suite: `run.sh --fresh fd1fa75` (lock 9a370c0) was 253/253, and `run.sh --fresh 5c36881` (lock origin/main e6bd701) is **253/253**. All 244 required passed both times; no lock file touched.
  - Statement, rate-limit and money-contract specs on 5c36881: 59/59.
  - Full suite on 5c36881, as deploy runs it: fresh migrated and seeded `w27_full9_test`, with my WAWU ID stand-in on :4001 for the whole run. :4001 was free before; the stand-in started 06:36:40 UTC and stopped 06:43:42, and `lsof` was empty after. Result: **144/144 suites, 3,448 passed, 3 skipped, 0 failed**, at load average 9.0.
  - Full suite on fd1fa75: fresh migrated and seeded `w27_full8_test`, with my WAWU ID stand-in on :4001 for the whole run (free before; started 06:14:25 UTC, stopped 06:23:15, `lsof` empty after): 143 suites, 3,422 passed, 3 skipped, **1 failed**. The failure was `fintava-stall` "a balance whose body lands at half the timeout is read" (`unavailable`), a timing test from FIX-01, at load average 7.9 with other sessions' jest runs on the machine. The spec passes 120/120 alone, twice right after. This branch does not touch `src/fintava`. Finding for the lead: the timing test is load-sensitive (WORKFLOW section 10: a flaky suite is fixed, not retried); I did not change it.
  - Gates on 5c36881: 16 fail / 27 warn / 76 accepted on 687 files. Main e6bd701 is 16 / 24 / 76 on 679, the same line for line plus the three statement PROVISIONALs (`STATEMENT-RATE-LIMITS`, `STATEMENT-CONCURRENCY`, `STATEMENT-MAX-DAYS`). `check_baseline.py` is clean.
  - Mobile `contract/` is main's (backend e6bd701, after the HOME-05 merge), so `sync_contract.py` has nothing to add; the statement route is not on backend main yet and it reaches the app's types when the backend branch merges.
  - `contract:build`: round 4 changed only the operation's summary text. After the merge a rebuild equals the committed file. Against main, the contract still only adds the route, `StatementView` and the three codes.
  - CI tripwire: 0 added lines. Key scan: 0 of 58 windows.
  - Mobile `npm run check` (main 2874688 merged): exit 0, with typecheck 0, lint 0, 33 suites / 602 tests, gates 0 fail / 0 warn on 157 files, and 205 tasks.
- **Not changed:** round 1's NOT RUN items (G-68, G-69 and its owner question, V10) and finding G-44. Verifier finding B (text after a valid bearer token is ignored) and observation D are not this task's, and no action was asked. No sandbox call.

### Builder round 3

Builder, 4 Oct 2026 (the builder of rounds 1 and 2).
- **Branches.**
  - wawu-backend `wmt/WALLET-27` **9f884dc**:
    - 359ccff: round 3.
    - b9797a7's merge of main aa11bcc (INBOX-09, no conflict).
    - 9f884dc: merge of main 9a370c0 (ME-05, ME-09, HOME-04, no conflict).
  - Mobile `wmt/WALLET-27`: the verifier's a16f2cb, then mobile main 9a0c1be (which includes d60edd3) merged in. PROGRESS was taken from main and regenerated. `sync_contract.py --backend` changes nothing, because main already holds backend 9a370c0.
- **Defect 1 (forged-`sub` flood), fixed by the lead's ruling.**
  - **No throttler override.** The route has no `@Throttle` and no tracker of its own. `statementTracker`, `bearerSubject` and `STATEMENT_THROTTLE` are gone. The global `short` (20 a second) and `medium` (200 a minute) apply per address, exactly as on every route.
  - **Per-person limit, after authentication.**
    - `StatementRateLimiter` (`statement-config.ts`, `PROVISIONAL(STATEMENT-RATE-LIMITS)`) allows 5 a minute and 30 an hour, each a fixed window per verified `wawuUserId`. Over the limit is `429 statement_rate_limited` with `retryAfterSeconds`.
    - It is called in the handler, after WawuAuthGuard, the wallet gate and validation, so a forged token or no token never makes an entry. A gate refusal or a 400 is not counted.
    - Memory is bounded by a map, swept at most once a minute, that drops a person whose windows have both ended. No timer is kept per request.
    - Default (agent/lead), owner may override: a `statement_busy` answer still counts as one of the person's 5.
  - **Two at once.**
    - `StatementSlots` (`PROVISIONAL(STATEMENT-CONCURRENCY)`) builds at most 2 statements at once in the process; the count, the read and the file are all built inside a place.
    - Others wait in order up to 5 s, each with one timer, then get `503 statement_busy`: "Statements are busy right now. Try again in a few seconds." with `retryAfterSeconds` 1.
  - The two new codes are in `MONEY_ERROR_STATUS`, CONVENTIONS section 3's table and section 12, and the contract.
  - **Finding 4:** the row read is now `LIMIT 50,001` and re-checked, so rows landing between the count and the read can no longer push a file past the cap.
- **Tests.** Statement specs: 46, plus `hub-rate-limits` 11.
  - Behind the real `HUB_THROTTLERS` and global guard:
    - 30 forged tokens, each with a new `sub`, from one address: 20 × 401, then 10 × 429. The global headers say 20 and 200, and the limiter gained no entry.
    - A verified person gets 200 × 5, then `429 statement_rate_limited` (with `retryAfterSeconds` 1 to 60). Another verified person at the same address gets 200. With the clock 61 s on, the first person gets 200 again.
  - Without the throttlers, 10,000 forged requests with 10,000 different `sub`s all get 401, and the limiter's size is unchanged.
  - Limiter unit tests:
    - 30 in an hour, then `retryAfterSeconds` 3,240.
    - 10,000 people, then one more an hour later, leaves 1 entry.
  - Slots unit tests: at most 2 at once. A waiter gets the freed place. Past the wait the answer is 503, and the place is not lost.
  - Over HTTP, 5 people at once with each count delayed:
    - With a 200 ms wait: 2 × 200 and 3 × `503 statement_busy`, peak 2.
    - With the real 5 s wait: 5 × 200, peak 2.
  - **N4:** the route's declared responses (the decorator metadata `contract:build` reads) and the committed contract both list exactly 400 `statement_too_large`, 409, 423, 429 `statement_rate_limited` and 503 `statement_busy`.
  - **Finding 4:** a count forced to 50,000 over 50,001 rows still answers 400.
  - `hub-rate-limits` asserts that the statement route carries no throttler metadata, the exact limits (5 per 60,000 ms, 30 per 3,600,000 ms), and 2 places with a 5,000 ms wait.
  - **Mutants**, each alone, file restored by copy:
    - Killed: no `take`, a minute limit of 6, no sweep, 3 places, no slots, `statement_busy` or `statement_too_large` left out of `@MoneyErrors`, a route `@Throttle` put back, and the re-check after the read removed.
    - One equivalent in outcome: the read's `LIMIT` alone removed. The re-check still answers 400; only memory differs.
- **The verifier's flood, re-run** (`vw27r2/throttle.js` with N = 5,000 and a 15 s ping, against my built hub on :4991 with the stand-in WAWU ID on :4992). Output: `scratchpad/w27r3/throttle.out`.
  - T1: a real token, 200 × 5 then 429; the headers are the global 20 and 200.
  - T5b: 400 forged random-`sub` statements from one address are now **20 × 401, 380 × 429**, the same as `/money/transactions` (T5a).
  - T6: 5,000 forged requests from one address: **100 × 401, 4,900 × 429**, 3 database transactions, RSS 203 to 289 MB, then 165 MB.
  - T7: `/health` max 5 ms over the next 15 s.
  - T2 and T3: a forged token with V's `sub` gets 401 and does not touch V.
  - T4: a valid token followed by extra text is still accepted, as on main; it got 429 here only because A had used its 5.
  - Five people at 49,999 rows each, at once from five addresses (`w27r3/heavy.js`): all 200, built two at a time, 0.4 to 2.1 s each. RSS peaked at 516 MB on the first batch and 597 MB on the second, against the verifier's 744 and 1,224 MB without the cap.
- **Checks on 9f884dc.**
  - `tsc --noEmit` 0; eslint 0 on every changed `.ts`.
  - Statement, history, gate, money-contract, fees and `hub-rate-limits` specs: 11 suites, 187/187.
  - Protected `run.sh --fresh 9f884dc` (lock origin/main 9a370c0): 253/253, all 244 required, no lock file touched.
  - **Full suite on fresh seeded `w27_full6_test`: 0 failures in total**, in two runs:
    - :4001 was held by another session, so the whole suite ran with the stand-in on :4992: 143 suites, 3,378 passed, 3 skipped, 43 failed. All 43 were in the 7 suites that hard-code :4001.
    - Those 7 then ran with my stand-in on :4001 once it was free (started 01:57:27, stopped 01:57:33, `lsof` empty after): 7/7, 67/67.
  - Gates: main 9a370c0 is 16 fail / 21 warn / 76 accepted. The branch is 16 / 24 / 76, the same line for line plus the three statement PROVISIONALs (`STATEMENT-RATE-LIMITS`, `STATEMENT-CONCURRENCY`, `STATEMENT-MAX-DAYS`). `check_baseline.py` is clean.
  - `contract:build`: against main, the contract only adds the route, `StatementView` and three codes. A rebuild after the last merge equals the committed file.
  - CI tripwire: 0 added lines. Key scan: 0 of 58 windows.
  - Mobile `npm run check` (main 9a0c1be merged): exit 0, with typecheck 0, lint 0, 29 suites / 556 tests, gates 0 fail / 0 warn on 135 files, and 205 tasks.
- **Not changed:** round 1's NOT RUN items (G-68, G-69 and its owner question, V10) and finding G-44 stand. No sandbox call.

### Builder round 2

Builder, 3 Oct 2026 (the round-1 builder). wawu-backend `wmt/WALLET-27` **b9797a7**: round 2 is c98ef6d, then backend main 44fdd7d (WALLET-15) merged in as aba971c and main 1e6b807 (INBOX-08) as b9797a7. Mobile `wmt/WALLET-27`: the verifier's afb9cbe, then mobile main 42309b2 (PROGRESS taken from main, regenerated) and c733413 merged in.
- **Load (verifier finding 1, lead ruling):**
  - **Rate limit.** `GET /money/statements` now has its own `@Throttle(STATEMENT_THROTTLE)` (`src/money/statements/statement-config.ts`, `PROVISIONAL(STATEMENT-RATE-LIMITS)`): 5 a minute and 30 an hour, on the app's `short` and `medium` throttlers. The bucket is the caller's address (read as the BVN check reads it, behind nginx) plus the token's `sub`. The `sub` is read unverified only to pick the bucket: the global throttler runs before WawuAuthGuard, and a forged token is a 401 straight after. So people behind one carrier NAT address do not share a bucket, and a token forged with someone's id can only use up that person's bucket from that same address.
  - `hub-rate-limits.contract.spec.ts` lists the override with its exact limits (short 5 per 60,000 ms, medium 30 per 3,600,000 ms, no block) and checks that it only tightens the limits.
  - A new HTTP test runs behind the real `HUB_THROTTLERS` and global guard. The first answer carries `x-ratelimit-limit-short` 5 and `-medium` 30; the 6th call in a minute is 429; another person at the same address and the person's history route are not held back. Unit cases cover the bucket key.
  - **Row cap.** The rows are counted first (`COUNT(*)` over the same keys, no further than 50,001). Above `STATEMENT_MAX_ROWS` (50,000) the answer is `400 statement_too_large`: "This period has more than 50,000 movements, more than one statement lists. Pick a shorter range." This is a new money error code (`MONEY_ERROR_STATUS` 400, CONVENTIONS section 3 table and section 12).
  - Test: 50,001 rows inserted by SQL answer that 400. A spy on the queries shows one count and no row select. A one-day range of the same wallet is served (2,759 rows). Exactly 50,000 rows is a 200 with 50,000 lines.
  - The `STATEMENT_MAX_DAYS` comment no longer claims it bounds the read: it says it bounds days, not rows, and points to the cap and the throttle.
  - Default (agent/lead), owner may override.
- **Test gap M10 (verifier finding 2):** one row carries our reference and every one of Fintava's (`fintavaReference`, session, transaction id, tagapay). The statement shows ours, equal to W27. A second row has no reference of ours, and Fintava's reference comes next, ahead of the session id.
- **Mutants** (each alone, file restored by copy): all 8 killed. They are M10 (Fintava's reference first), session before Fintava's reference, the cap off by one (`>=`), no cap, a 60,000 cap, short 6, medium 31, and an address-only bucket.
- **Merges:**
  - Backend 44fdd7d: conflicts in `money.module.ts`, `money-contract.spec.ts`, the two gated-route spec titles, CONVENTIONS and the contract. Both sides were kept. WALLET-15's fee quote stays CONVENTIONS section 11; statements move to section 12 (WALLET.md's row follows). `contract/openapi.json` was regenerated by `contract:build`.
  - Backend 1e6b807 merged cleanly. A fresh `contract:build` equals the committed file. Against main, the contract only adds: the route, `StatementView` and the `statement_too_large` code.
  - Mobile c733413: `BACKEND_GAPS.md` and the sandbox README rows were kept from both sides, in number order. `contract/SOURCE_COMMIT` was taken from main, and `sync_contract.py --backend` then changes nothing (main already holds backend 1e6b807). `StatementView` reaches the app's types when the backend branch merges.
- **Checks on b9797a7:**
  - `tsc --noEmit` 0; eslint 0 on every changed `.ts`.
  - Statement, history, gate, money-contract, fees and `hub-rate-limits` specs: 11 suites, 180/180 on aba971c.
  - Money, Fintava, KYC, identity and rate-limit specs on b9797a7: 44 suites, 1,556 passed, 22 failed, all in `kyc-submission`, which hard-codes :4001; it passes below.
  - Protected `run.sh --fresh b9797a7` (lock origin/main 1e6b807): 253/253, all 244 required, no lock file touched.
  - Full suite, as deploy runs it, on fresh seeded databases:
    - aba971c (main 44fdd7d inside), with my WAWU ID stand-in on :4001 for the whole run: **138/138 suites, 3,303 passed, 3 skipped, 0 failed**. :4001 was free before; the stand-in was stopped straight after, and `lsof` was empty again.
    - b9797a7: :4001 was held by another session, so the run used the stand-in on :4992. Result: 139 suites, 3,296 passed, 3 skipped, 30 failed, all in the four suites that hard-code :4001 (`kyc-submission`, `privacy-settings`, `credits-state`, `account`). Once :4001 was free, those four ran with my stand-in there: 4/4, 40/40. So 0 failures.
  - Gates: main 1e6b807 is 16 fail / 14 warn / 76 accepted on 656 files; the branch is 16 / 16 / 76 on 664. The findings are the same line for line, plus the two PROVISIONAL warnings (`STATEMENT-RATE-LIMITS`, `STATEMENT-MAX-DAYS`). `check_baseline.py` is clean.
  - CI tripwire: 0 added lines against main. Key scan: 0 of 58 windows on the diff against main.
  - Mobile `npm run check` (main c733413 merged): exit 0, with typecheck 0, lint 0, 28 suites / 485 tests, gates 0 fail / 0 warn on 123 files, and 205 tasks.
- **Not changed:** round 1's NOT RUN items, the owner question (G-69) and finding G-44 stand. No sandbox call this round (the route never calls Fintava).

### Builder round 1

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

### Verifier report, round 4

Verifier, 4 Oct 2026 (the verifier of rounds 1 to 3; wrote none of this code). Backend `wmt/WALLET-27` **5c36881** (round 4 fd1fa75 on 9f884dc, then backend main e6bd701 merged in); mobile **68dff0c**. Fresh built hub (`node dist/src/main.js`, trust proxy as in production) on :4993, my WAWU ID stand-in on :4994, probe DB `vw27r4_probe_test`. The container had restarted, so I rebuilt and reran from the start. Evidence: `/tmp/.../scratchpad/vw27r3/` (round-4 files are named `r4-*`).

**Verdict: both defects are fixed; no defect is open; status review.** Two test gaps and one environment limitation are noted below, none blocking.

| Check | Result | Evidence |
|------|--------|----------|
| Defect 2: the route's own 400s do not count | **fixed.** One person (a 50,001-row wallet) sent each of the five 400s five times: `2026-02-30`, `from` after `to`, a future `to`, 367 days, and `statement_too_large` (the full month). All 25 were 400. Then five one-day requests were 200 and the sixth was `429 statement_rate_limited`. So none of the 25 counted and the 5-a-minute limit still holds. | `r4-defect2.out` |
| Give-back cannot be abused | **confirmed safe.** `statement_too_large` is thrown inside `StatementSlots.run`, so it competes for the same 2 build-slots as a real statement and never runs the full build (only a capped `COUNT ... LIMIT 50,001`). A 60-request too_large flood from one person held the server to **2 statement queries at once** (pg sampled every 8 ms: max 2), and the per-person limiter still answered 429 to 36 of the 60 because `take()` counts before the async build returns and gives back. The person's 5-a-minute for real statements was intact afterwards (5 x 200 then 429). So no unbounded statements while a real one builds. | `r4-abuse.out`, `r4-pgpeak.out` |
| 503 statement_busy still counts | **confirmed** by the controller: the catch calls `giveBack()` only for `statement_too_large`, so a 503 does not give its place back. (A regression here is untested: see test gap A.) | `money-statement.controller.ts` |
| Defect 3: CONVENTIONS section 12 matches the code | **fixed.** Section 12 describes the global per-address limits (unchanged on this route), `StatementRateLimiter` (5 a minute / 30 an hour, fixed windows per verified wawuUserId, counted after the guard and gate, swept map, `retryAfterSeconds` rounded up), what counts (a statement served, a 503) and what does not (the DTO's 400s, the period's 400s, `statement_too_large`, the gate's 409s, the token's 401), and `StatementSlots` (2 at once, wait 5 s, then 503). Every line matches `statement-config.ts` and the controller. No `@Throttle`, `STATEMENT_THROTTLE`, `statementTracker`, `bearerSubject` or address-plus-`sub` bucket remains anywhere in the doc or `src/`. | CONVENTIONS section 12 |
| X4 (my round-3 mutant) killed | **killed.** `Math.ceil` -> `Math.floor` in the limiter's `retryAfterSeconds` now fails the suite (1 failed). The builder added the test (asked 500 ms into a minute: 60, not 59; and the busy wait 1.5 s: 2). | `r4-mutants/X4.log` |
| Two new mutants of mine | **both SURVIVED (test gaps, not defects).** M-A: the catch gives the place back for `statement_busy` as well as `statement_too_large` (so a 503 would stop counting) passes all 59 tests, so the "503 counts" ruling is not pinned by a test. M-B: dropping the give-back's own-window guard (`now.starts[i] === starts[i]`) passes all 59, so a give-back landing after its window rolled over is never exercised. | `r4-mutants/summary.txt`, `M-A.log`, `M-B.log` |
| Statement, rate-limit, money-contract specs | passed. Baseline 4 suites, **59/59**, against a fresh migrated `vw27r4_specs_test`, WAWU ID on :4994. | `r4-baseline.log` |
| Protected suite | passed. `run.sh --fresh 5c36881` (lock origin/main, 95d8bd4 by run time): **253/253, all 244 required**; no lock file in the diff. | `r4-protected.out` |
| Gates | passed, exactly as expected. Main e6bd701: **16 fail / 24 warn / 76 accepted** on 679 files. Branch: **16 / 27 / 76** on 687. The diff is only the three statement PROVISIONALs (`STATEMENT-RATE-LIMITS`, `STATEMENT-CONCURRENCY`, `STATEMENT-MAX-DAYS`); 16 fail is unchanged. `check_baseline.py` clean. | `r4-gates-main.out`, `r4-gates-branch.out` |
| contract:build, tsc, eslint | passed. `contract:build` leaves the tree clean; `tsc --noEmit` 0; eslint 0 on every changed `.ts`. | `r4-contract-build.out`, `r4-tsc.out`, `r4-eslint.out` |
| Tripwire, key scan | passed. Tripwire 0 added lines (nothing touches the protected registry, `compareShape`, or `.pipeline`). Key scan: 0 of 58 live-key windows in the backend diff, the mobile diff and my outputs; the generic-secret grep hits are benign HOME-05 test fixtures (a random `whsec_local_...`, an error string, a `'stand-in'` password). | `r4-tripwire.out`, `r4-b.diff`, `r4-m.diff` |
| Mobile `npm run check` | passed: **exit 0**, typecheck 0, lint 0, **33 suites / 602 tests**, gates 0 fail / 0 warn on 157 files, 205 tasks. | `r4-mobile-check.out` |
| Full suite, the way deploy runs it | **partially run (environment-blocked), no branch defect.** Fresh migrated and seeded `vw27r4_full_test`: **137 of 144 suites passed, 3,405 tests passed, 3 skipped**. The 7 that failed (43 tests: kyc-submission, notification, account, saved-item, credits-state, privacy-settings, blocked-account) are unrelated to WALLET-27 and all fail for one reason (finding C). | `r4-full-suite.log` |

**Findings (none blocking)**
- **A. Test gap: the "503 statement_busy counts" ruling is not tested.** Mutant M-A (the controller also gives the place back on `statement_busy`) passes all 59 statement, rate-limit and money-contract tests. The round-4 ruling says a busy answer counts as one of the person's 5; a refactor that made 503 stop counting would not be caught. Suggest a test: fill both slots, force a 503 for a person, and show it uses one of their 5. Low severity (behaviour is correct today).
- **B. Test gap: the give-back's own-window guard is not exercised.** Mutant M-B (drop `now.starts[i] === starts[i]` from the give-back) passes all 59. The guard stops a give-back from decrementing a window that has since rolled over. It is defensive and correct; it is simply untested. Very low severity.
- **C. Environment limitation, not a branch defect: 7 unrelated suites could not run here.** Those 7 suites sign in through a WAWU ID stand-in they expect on **:4001**, and the app under test must verify tokens against that same stand-in's key. Another Claude Code session on this shared machine holds `0.0.0.0:4001` for the whole window with its own mock, whose `/auth/login` returns no token for the seeded users, so every token is rejected (401/403) in exactly those 7 suites and nowhere else. The sanctioned ways to give my own stand-in port 4001 in isolation were each refused by this environment's permission system (a matching DB role, switching to the `postgres` OS user for the socket, and a process-local `connect()` redirect), so I could not reproduce the single-stand-in-on-:4001 layout the deploy uses. The 137 suites that did run include every WALLET-27 surface (statements, rate limits, money) and the HOME-05 feed-cards suite, all green. The builder's identical full run on 5c36881, with their own stand-in on :4001, was 144/144 (3,448 passed, 0 failed). I am confident the 7 would pass with a correct stand-in; they should be re-run on a machine where :4001 is free, or with a per-session stand-in port.

**Still standing from earlier rounds / NOT RUN:** round 1's PDF (G-68), email (G-69) and V10; main finding A (one address 429s others, now filed as BACKEND_GAPS G-95); verifier finding B (text after a valid bearer token ignored, harmless, also on main) and observation D. No Fintava call (the route never calls Fintava). The 5 s slot wait never ran out over HTTP; the 503 path is shown at unit level.

### Verifier report, round 3

Verifier, 4 Oct 2026 (the verifier of rounds 1 and 2; wrote none of this code). Backend `wmt/WALLET-27` **9f884dc** (fix 359ccff, then main aa11bcc and 9a370c0 merged in); mobile **ce5a7c3**. Neither main has moved (backend 9a370c0, mobile 9a0c1be). Fresh worktrees `/home/user/wt/vw27b3` and `/home/user/wt/vw27m3`. The built hub (`node dist/src/main.js`, trust proxy as in production) ran on :4993, the stand-in WAWU ID on :4994, and :4001 was used only for the full suite. Databases `vw27r3_*`, all dropped. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw27r3/` (below, `vw27r3/`).

**Verdict: defect 1 is fixed; 2 new defects are open (both small); status building.**

| Check | Result | Evidence |
|------|--------|----------|
| Defect 1 (forged-`sub` flood) | **fixed**. 400 forged random-`sub` statements from one address: 20 × 401, 380 × 429, the same as `/money/transactions` (T5a, T5b). 100,000 from one address: 200 × 401, 99,800 × 429, in 69 s. 41 database transactions during it, about an idle hub's own. Hub RSS was 223 MB, peaked at 436 MB during the flood, and was 174 MB after. A forged token with V's `sub` from V's own address no longer affects V (V gets 200). | `vw27r3/throttle.out` |
| No stall during or after | passed. `/health` from another address once a second, from the start of the flood to 17 minutes after it ended. The worst answer took 435 ms, during the 1.2 M-row inserts for the load test, not during the flood. Five answers were 429s from main's throttler bug (main finding A), and none came from the statement route. | `vw27r3/pinger.log` |
| Per-person limiter, window maths | passed. 5 requests, then 429 with retry 60. At +59.999 s still 429 with retry 1; at +60.000 s allowed. 30 spread over 30.5 minutes, then 429 with retry 1,770; at the hour's end allowed. A refused request does not count (mutant X1 is killed). Fixed windows allow a burst at the edge: 9 requests within one second, 5 a minute in each window, as `STATEMENT_RATE_LIMITS` documents. | `vw27r3/limiter-unit.out` |
| Per-person limiter, memory | passed. 200,000 people in one minute make 200,000 entries (+50 MB heap); one hour later a single request sweeps them down to 2, in 75 ms. Only a verified person with an open wallet makes an entry: the forged flood added none (T6), and a gate refusal adds none. | `vw27r3/limiter-unit.out`, `limiter-http.out` |
| Gate refusal, 400 | **failed (defect 2)** | `vw27r3/limiter-http.out` |
| Concurrency cap | passed. Postgres showed at most 2 statement queries active at once (2,000 samples, 10 ms apart, during 10 at once). 5 people at 49,999 rows at once: 5 × 200 in 3.8 s, RSS peak 613 MB. 10 at once, three times: 10 × 200 each time, in 5.5 to 7.0 s, RSS peak 676 to 737 MB (round 2 reached 1,224 MB with 5). None waited past the 5 s limit, so there was no 503 over HTTP. With the slots alone (300 ms wait, 200 ms builds, 10 at once): 4 × 200, 6 × 503, peak 2; four failing builds each give their place back. | `vw27r3/concurrency.out`, `concurrency2.out`, `pgsample.out`, `limiter-unit.out` |
| Row cap re-check | passed. 50,001 rows asked 6 times: 400 × 5, then 429 (`statement_too_large` counts toward the limit; part of defect 2) | `vw27r3/rowcap.out` |
| Mutants (mine) | 3 of 4 killed. X1, a refused request still counted: killed. X2, the sweep forgets the hour window: killed. X3, a handed-over place is freed as well: killed. **X4 survives**: `retryAfterSeconds` rounded down instead of up (finding C, test gap). | `vw27r3/mutate.py`, `mutants/summary.txt` |
| T4 (the builder's note) | main finding B, not this task's: the same on main 9a370c0 and on this branch | `vw27r3/t4-main.out`, `t4-branch.out` |
| Full suite, as deploy runs it | passed. Fresh seeded `vw27r3_full2_test`, mock on :4001 (free before; stopped straight after; free again): **143/143 suites, 3,421 passed, 3 skipped, 0 failed** | `vw27r3/full-suite.log` |
| Protected suite | passed. `run.sh --fresh 9f884dc` (lock origin/main 9a370c0): 253/253, all 244 required; no lock file in the diff | `vw27r3/protected.out` |
| Gates | passed. Main 9a370c0: 16 fail / 21 warn / 76 accepted on 673 files. Branch: 16 / 24 / 76 on 681. The diff of the two outputs is exactly the three statement PROVISIONALs (`STATEMENT-RATE-LIMITS`, `STATEMENT-CONCURRENCY`, `STATEMENT-MAX-DAYS`). `check_baseline.py` clean. `tsc` 0; eslint 0 on every changed `.ts` | `vw27r3/gates-*.out` |
| Contract, tripwire, key scan | passed. `contract:build` leaves the tree clean. Tripwire: 0 lines. Key scan: 0 of 58 windows in both diffs and in my outputs | `vw27r3/contract-build.out`, `tripwire.out` |
| Mobile `npm run check` | passed: exit 0, typecheck 0, lint 0, 29 suites / 556 tests, gates 0 fail / 0 warn on 135 files, 205 tasks | `vw27r3/mobile-check.out` |

**Defect 2: the statement route's own 400s count against the person's limit; only the DTO's 400s and the gate's refusals do not.** The builder's report says "A gate refusal or a 400 is not counted". The controller calls `limiter.take()` before `StatementService.statement()`, and `checkedPeriod()` runs inside the service. Reproduction (`vw27r3/limiter-http.js`), a fresh person each time, six identical requests, then one good request:
- `format=pdf` or an extra field: 400 × 6, then 200. Not counted.
- `from=2026-02-30`, `from` after `to`, `to` in the future, and more than 366 days: in each case 400 × 5, then `429 statement_rate_limited` on the 6th, and the good request after them is 429 too. Counted.
- `400 statement_too_large` also counts: 50,001 rows asked 6 times gives 400 × 5, then 429.
- A person who picks a wrong range five times is locked out of statements for a minute, and each mistake uses one of the 30 an hour.

Fixed when the period is checked before the person is counted, and `statement_too_large` is either not counted or documented as counted. A test should send each of the five 400s five times and then get a 200.

**Defect 3: CONVENTIONS section 12 still describes round 2's throttle.** It says "The route has its own `@Throttle` (`STATEMENT_THROTTLE`, ...): at most 5 a minute and 30 an hour per person per address (the bucket is the caller's address as the BVN check reads it, plus the token's `sub`), on the app's `short` and `medium` throttlers". That is the design defect 1 removed. The code has no `@Throttle`, no `STATEMENT_THROTTLE` and no address in the bucket. Only section 3's table and the controller's comment describe round 3 (per verified person, after the guard; two at once; `503 statement_busy`). Fixed when section 12 describes `StatementRateLimiter` and `StatementSlots` as built, including which refusals count.

**Findings**
- **A. Main finding, not this task's (medium): one address can make the global throttler answer 429 to other addresses.**
  - **Cause.** `@nestjs/throttler` 6.5's in-memory storage keeps one list of expiry timers per throttler name for all callers. When any caller's block ends, `resetBlockdRequest` calls `clearExpirationTimes(name)`, which clears every caller's timers. Everyone else's counts then stop going down, and they reach the limit.
  - **Reproduction** (`vw27r3/xaddr.js`, 60 s each):
    - A victim at 2 requests a second to `/health` gets 120 × 200 with no attacker.
    - The same victim gets 6 × 429 (at about 15 s, 31 s and 47 s) while another address sends bursts of 25 every 1.5 s.
    - Identical on main 9a370c0 (`xaddr-main.out`) and on this branch (`xaddr-branch.out`). The pinger also saw it during the flood.
  - **Who it touches.** It affects every route, and round 3 now relies on that throttler.
  - **Fixed when** a block ending clears only its own key's timers: another storage, or a library version that does this.
- **B. Main finding, not this task's (harmless): extra text after a valid bearer token is ignored.**
  - On main 9a370c0 and on the branch alike:
    - Accepted (200): `Bearer <valid> junk`; `Bearer <valid> x.<payload with another sub>.y`; `Bearer <valid> <a forged token>`; `Bearer\t<valid>\t<anything>`.
    - Refused (401): `Bearer <forged> <valid>`; `Bearer <valid>junk` (no space); `<header>.<payload with another sub>.<valid signature>`; `junk Bearer <valid>`.
  - **Why.** `ExtractJwt.fromAuthHeaderAsBearerToken()` (passport-jwt) parses the header with `(\S+)\s+(\S+)`. It takes the first whitespace-separated value after the scheme and ignores the rest.
  - **Why it is harmless.** The signature and expiry are checked on that first value only, and nothing reads claims from the rest. The crafted header answered the valid token's own rows (`CAP-8777772012-...`, that person's account).
  - **This branch did not make it worse.** Round 3 removed round 2's own header parsing (`bearerSubject`), and nothing under `src/money/statements` reads `authorization`. It is parsing slack, not a signature bypass.
- **C. Test gap (not a defect).** Mutant X4, `retryAfterSeconds` from `Math.floor` instead of `Math.ceil`, passes all 57 statement, rate-limit and money-contract tests. A client told 1 s may come back early and be refused again.
- **D. Observation.** With 10 at once, the 200s finished together at 5 to 7 s, not two at a time. Turning the 9 MB file into the response happens after `StatementSlots` hands the place on, so several responses are serialised at once. Memory still peaked at 737 MB, so nothing is asked.

**NOT RUN:** round 1's items stand (PDF G-68, email G-69, V10). No Fintava call (the route never calls Fintava). The 5 s wait never ran out over HTTP: ten 49,999-row statements finished inside it on this machine. The 503 path was shown at unit level with a 300 ms wait.

### Verifier report, round 2

Verifier, 3 to 4 Oct 2026 (the round-1 verifier; wrote none of this code). Backend `wmt/WALLET-27` **b9797a7** (round 2 is c98ef6d, then main 44fdd7d and 1e6b807 merged in); mobile **6ccc3fe**. Neither main moved (backend 1e6b807, mobile c733413). Fresh worktrees `/home/user/wt/vw27b2` and `/home/user/wt/vw27m2`. Built hub `node dist/src/main.js` on :4993 (trust proxy as in production: loopback peer, last X-Forwarded-For entry is the caller), stand-in WAWU ID on :4994. Databases `vw27r2_*`, all dropped. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw27r2/` (below, `vw27r2/`). The container restarted after the protected suite; nothing that ran before it is affected, and nothing was re-run.

**Verdict: 1 defect open, status building.** The new per-route throttle lets one address with no account freeze the whole server.

| Check | Result | Evidence |
|------|--------|----------|
| Throttle, real tokens | passed. A real token from one address: 200 ×5, then 429; headers `x-ratelimit-limit-short` 5, `-medium` 30. A forged token carrying V's `sub` from another address uses up only that address's bucket: V's real token from a third address is then 200 | `vw27r2/throttle.out` T1, T3 |
| Throttle, forged `sub` floods | **failed (defect 1)** | `vw27r2/throttle.js`, `throttle.out`, `storage-bench.out`, `pinger.log` |
| Trust-proxy reading | passed. `statementTracker` uses `bvnCheckTracker` itself. Through loopback, the last X-Forwarded-For entry is the address (T3). A direct caller (192.0.2.2) sending a different X-Forwarded-For on each of 7 calls got 200 ×5, then 429, 429: the header is ignored | `vw27r2/direct.out` |
| Forged token reaches no database | passed. 100,000 forged requests over 205 s: 45 database transactions, against 14 a minute (about 48 in 205 s) from an idle hub's own jobs. So none came from the forged requests: every one is a 401 from `WawuAuthGuard`, after the throttler and before the gate | `vw27r2/throttle.out` T6, `idle-db.out` |
| Row cap | passed. Exactly 50,000 completed rows (plus 3,000 failed, not counted): 200, `rowCount` 50000, 9.2 MB, 1.2 s. 50,001: `400 statement_too_large` in 40 ms with the stated message. 100,000 over 366 days: the same 400 in 32 to 52 ms, with no memory rise. The compiled service, given a count of 50,001, makes 1 query (the `COUNT(*)` over `LIMIT 50001`) and throws; at 50,000 or 0 it makes the count and then the row select | `vw27r2/rowcap.out`, `countfirst.out` |
| 5 at once just under the cap | `unclear` (finding 2) | `vw27r2/rowcap.out` |
| M10 | killed (1 failed, 49 passed) | `vw27r2/mutants/M10.log` |
| 4 new mutants | 3 killed. N1, the count limited to the cap and so never above it: killed. N2, the hour window shortened to a minute: killed. N3, the bucket keyed by `sub` alone, without the address: killed. **N4 survives** (finding 3) | `vw27r2/mutate.py`, `mutants/summary.txt` |
| Merges | passed; nothing dropped. Every line on backend main 1e6b807 is still on the branch, except the two gated-route test titles, which were rewritten to add "statements (WALLET-27)". Every line of round 2 (c98ef6d) survives except where main changed the same line: the fee-quote rows in `WALLET.md`, `FEE_QUOTE_KINDS`, and the section number. `money.module.ts` and `SERVED_MONEY_ROUTES` hold both WALLET-15 and WALLET-27. Both gated-route lists hold `fees/quote` and `statements`. CONVENTIONS: section 11 is the fee quote and section 12 is statements; section 12's body equals round 2's section 11 word for word. Mobile: `BACKEND_GAPS.md`, the sandbox README and `docs/LOG.md` lose nothing from main c733413 or from afb9cbe. Mobile `contract/` equals backend main 1e6b807 byte for byte (as `sync_contract.py` defines) | `vw27r2/b.diff`, `m.diff` |
| Contract | passed. `npm run contract:build` leaves `contract/openapi.json` unchanged (git status clean) | `vw27r2/contract-build.out` |
| Full suite, as deploy runs it | passed. Fresh migrated and seeded `vw27r2_full2_test`, `mock-wawu-id/server.js` on :4001 (free before; my stand-in stopped straight after; free again), `npx jest --runInBand --forceExit`: **139/139 suites, 3,326 passed, 3 skipped, 0 failed** | `vw27r2/full-suite.log` |
| Protected suite | passed. `run.sh --fresh b9797a7` (lock origin/main 1e6b807): 253/253, all 244 required; no lock file in the diff | `vw27r2/protected.out` |
| Gates | passed. Branch: 16 fail / 16 warn / 76 accepted on 664 files. Main 1e6b807: 16 / 14 / 76 on 656. The diff of the two outputs is exactly `PROVISIONAL(STATEMENT-RATE-LIMITS)` and `PROVISIONAL(STATEMENT-MAX-DAYS)`. `check_baseline.py` clean. `tsc --noEmit` exit 0; eslint exit 0 on every changed `.ts` | `vw27r2/gates-branch.out`, `gates-main.out`, `tsc.out`, `eslint.out` |
| Tripwire, key scan | passed. 0 added lines match the tripwire. 0 of 58 key windows in either diff or in the probe output | `vw27r2/tripwire.out` |
| Mobile `npm run check` | passed (exit 0 on the branch, before and after this report): typecheck 0, lint 0, 28 suites / 485 tests, gates 0 fail / 0 warn on 123 files, 205 tasks. Two of four runs (the first before the report, at load 4.1, and the first after it, at load 8.3) failed one test on a 5 s timeout: main's KYC-05 test `OpenWalletScreen.test.tsx` (A26, "a user sees a loading view first"). Each rerun passed. Nothing on this branch touches that file. It is a flaky test on mobile main under machine load, for the lead, not a WALLET-27 finding | `vw27r2/mobile-check-before.out`, `mobile-check-before2.out`, `mobile-check-after.out`, `mobile-check-after2.out` |

**Defect 1: a forged-token flood from one address goes unthrottled, leaves state that is never freed, and freezes the whole server an hour later.**
- **What changed.** `@Throttle(STATEMENT_THROTTLE)` overrides the app's `short` and `medium` throttlers for this route. It overrides their trackers as well as their limits, so the per-address global limit no longer applies here. The bucket is `address|sub`, and the `sub` is read before any signature check.
- **No 429 from one address.** A caller with no account can therefore send unlimited requests from one address, each with a fresh random `sub`, and never get a 429.
  - 400 such requests to `/money/statements`: 400 × 401, none 429.
  - The same 400 to `/money/transactions`: 20 × 401, then 380 × 429 (T5a, T5b).
- **Two-step reproduction (`vw27r2/throttle.js` T6, `pinger.js`).**
  - **The flood.** From one address, send 100,000 `GET /money/statements?from=2026-09-01&to=2026-09-30&format=csv`, each `Authorization: Bearer <{"alg":"RS256","kid":"mock-wawu-id-key-1"}>.<{"sub":"<random uuid>"}>.bm9wZQ`. Results:
    - All 100,000 answered 401 and none 429, at 486 a second (205 s).
    - The attacker's slowest request waited 79 s.
    - Hub RSS rose from 210 MB to 879 MB, and was still 348 MB afterwards.
  - **One hour later.** Ping `/health` once a second from another address. The flood ran from 22:05:45 to 22:09:10 UTC. From 23:05:45 to about 23:09:30 the hub served almost nothing:
    - `/health` took 1.0 s, 4.0 s, 29.3 s, **139.9 s** and 47.3 s.
    - Only 19 pings were answered in about 3 minutes, against 60 a minute before and after.
- **Why.** `@nestjs/throttler` 6.5's in-memory `ThrottlerStorageService` keeps state that the flood inflates:
  - It keeps one storage entry per distinct key and never deletes one, so the memory stays.
  - It sets one timer per hit, kept in one array per throttler name, and on each expiry it rebuilds that array with `filter`, so each expiry costs O(n).
  - The route's `medium` window is an hour, so 100,000 timers expire together an hour later and block the event loop.
  - The library alone (`vw27r2/storage-bench.js`): 100,000 keys with a 3 s window stalled the event loop for 108 s and left 100,000 entries (+36 MB) in place; 25,000 keys stalled it for 1.1 s.
- **Why main cannot reach this from one address.** On main every route's bucket is the address alone. Requests over the limit add no timer, and the longest window is 60 s. One address therefore adds at most about 200 timers a minute per route.
- **Fixed when** a request whose token does not verify can neither pick a new bucket nor skip the per-address limit. A test should send forged tokens with many different `sub`s from one address and get 429 after the per-address limit. Two ways to get there:
  - key the bucket on the address alone, and count the per-person limit after `WawuAuthGuard`;
  - or verify the token before using its `sub` in the tracker, and use the address alone when it does not verify.

**Findings**
1. Defect 1 above.
2. `unclear` (bound for a one-process droplet; nothing in either repo states the droplet's RAM). Under the cap a statement is still heavy:
   - One statement at 49,999 rows: 0.9 to 1.2 s, 9.2 MB.
   - Five people at 49,999 rows each, at once from five addresses (all inside the throttle): about 3.6 to 3.9 s each.
   - Hub RSS: 354 MB → 744 MB peak on the first batch; 1,224 MB on a second batch 3 s later; 982 MB at the end (garbage not yet collected).
   - The per-person throttle does not bound how many different people build statements at once.
   - Under 2 GB of RAM, a few heavy statements at once can still exhaust the one process.
   - A bound that fixes it, whichever the owner prefers:
     - at most N statements (for example 2) building at once in the process, the rest answered 429 or 503 with "try again";
     - or a lower row cap (about 10,000 rows is about 1.8 MB and 0.2 s);
     - or streaming the file.
3. Test gap (not a defect). Mutant N4 survives: removing `'statement_too_large'` from `@MoneyErrors(...)` on the controller passes the statement, rate-limit and money-contract specs (50/50). The generated contract would then lose the 400. None of those specs compares the committed contract with a fresh build; the gap is only seen when someone runs `contract:build` by hand.
4. Minor (no action asked). The count and the row select are two queries outside one transaction, and the select has no `LIMIT`. Rows written between them can push a file a few rows past 50,000. Only real movements can arrive in that gap, so this cannot be abused.

**NOT RUN:** round 1's items stand (PDF G-68, email G-69, V10). No Fintava call (the route never calls Fintava).

### Verifier report, round 1

Verifier, 3 Oct 2026 (wrote none of this code). Backend `wmt/WALLET-27` **5cd55c1** on main fe1ec6c (backend main has not moved); mobile `wmt/WALLET-27` **33484cf** on e7dc879. Mobile main has since moved to 42309b2 (KYC-05); not merged here, the branch's own changes are docs and the task file. Fresh detached worktrees `/home/user/wt/vw27b` and `/home/user/wt/vw27m`; databases `vw27_full_test`, `vw27_probe_test`, `vw27_protected_test` (all dropped); hub :4993, stand-in WAWU ID :4994, and :4001 only for the full suite (`lsof` empty before; my stand-in stopped straight after; `lsof` empty again). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw27/` (below, `vw27/`).

**Verdict: no open defect, status review.** Two findings below (one `unclear` on load, one test gap) and one `differs-for-recorded-reason`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Backend: `tsc --noEmit` exit 0 (0 lines); eslint exit 0 on every changed `.ts`; gates 16 fail / 14 warn / 76 accepted on 652 files vs main fe1ec6c 16 / 13 / 76 on 645, and the diff of the two outputs is exactly one added warning, `PROVISIONAL(STATEMENT-MAX-DAYS)` (`statement.service.ts:27`); `check_baseline.py` exit 0. Mobile `npm run check` exit 0: typecheck 0, lint 0, 26 suites / 431 tests, gates 0 fail / 0 warn on 110 files, 205 tasks | `vw27/tsc.out`, `eslint.out`, `gates-branch.out`, `gates-main.out`, `mobile-check-before.out` |
| V2 Contract | passed. 70 of 70 HTTP probes on the built server (`node dist/src/main.js`, real sign-in, below) and 30 unit probes; builder's statement specs 25/25 plus gate, history and money-contract specs: 8 suites, 128/128 | `vw27/probe.js`, `probe.out`, `units.js`, `units.out`, `targeted.log` |
| V3 Regression | passed. Protected `run.sh --fresh 5cd55c1` (lock origin/main fe1ec6c): 253/253, all 244 required; no lock file in the diff. CI tripwire: 0 added lines matching `test/protected-routes\|src/protected-routes\|compareShape\|protected-registry`. Full suite as deploy runs it (fresh migrated and seeded `vw27_full_test`, `mock-wawu-id/server.js` on :4001 with a keypair made by deploy.yml's two `openssl` lines, `npx jest --runInBand --forceExit`): **136/136 suites, 3,261 passed, 3 skipped, 0 failed**, exit 0. `hub-rate-limits.contract.spec.ts` alone: 10/10 | `vw27/protected.out`, `tripwire.out`, `full-suite.log` |
| V4 Field trace | passed. Writer: ledger (MONEY-10) only. Reader: one SQL in `statement.service.ts` with the history's three keys (`walletKind` user, token's wawuUserId, the gate's account number) and `status = 'completed'`. Each line's description, counterparty and reference equal the history row's (`GET /money/transactions?month=2026-09`, 10 rows compared), and the month's lines add up to `GET /money/transactions/summary?month=2026-09` (in 900719925479099, out 2510501 kobo, both equal). B's statement names A by A's wallet name, as B's history does | `vw27/probe.out` |
| V9 Live seam | passed. Built server on :4993; four people signed up and signed in through the stand-in WAWU ID's real `POST /auth/register` and `POST /auth/login` (no minted token); wallets and ledger rows stored in the probe database by SQL; the statement served rows only the server had. Fintava not called by the verifier: nothing under `src/money/statements` imports a Fintava client, and the builder's sandbox record is `docs/fintava/sandbox/40-wallet27-statements.md` | `vw27/probe.out`, `hub4993.log` |
| Capability check: a statement for last month lists exactly last month's transactions | passed. Sep 2026 for A lists exactly the 6 completed Sep rows, oldest first: 00:00:00.000 Lagos on 1 Sep (23:00Z 31 Aug) and 23:59:59.999 Lagos on 30 Sep are in; 22:59:59.999Z 31 Aug and 23:00Z 30 Sep are not; pending, failed, reversed, a row that completed then reversed (0 times, not twice), A's id on another account, merchant rows on A's account (with and without A's id), and B's id on A's account are all absent | `vw27/probe.out` |
| Mutations (verifier's own) | 14 of 15 killed; **M10 survives** (finding 2) | `vw27/mutate.py`, `vw27/mutants/` |
| Secret scan | passed. 0 of 58 eight-character windows of the Fintava key in the backend diff, the mobile diff, the probe output and the load output | (scan run in a command's environment, key never printed) |

**Privacy (every way in, as B, with A's rows in the database):** `wawuUserId=`, `accountNumber=`, `userId=`, `sub=`, `from[]=`, `from[x]=`, `__proto__[wawuUserId]=`, `constructor[prototype][wawuUserId]=` are 400 ("property ... should not exist"); a duplicated `from` or `format` is 400; headers `x-wawu-user-id`, `x-user-id`, `x-forwarded-user` naming A are ignored (B gets B's own statement); `/money/statements/<A's id>`, `..%2Fstatements`, `;wawuUserId=`, `//statements`, `.csv` are 404; `/money/statements/` is B's own; a token with no wallet is `409 wallet_not_open` (even with a bad query and `wawuUserId=`: the gate runs first), an opening wallet `409 wallet_opening`, no token 401, B's token with its `sub` swapped to A 401, `alg: none` 401. No line carries a full bank account number (a row with `counterpartyAccountNumber` 0123456789 shows neither it nor its last four), the narration (which held a phone number), either wallet's account number, an email or a person's id. BVN and NIN are not in the ledger.

**Range:** Lagos midnight both ends (above); 29 Feb 2024 lists 23:30Z on the 28th and noon on the 29th, not 23:00Z on the 29th; 31 Dec 2025 to 1 Jan 2026 spans the year (23:30Z on 31 Dec is dated 2026-01-01 00:30); `from` equal to `to` is the whole Lagos day; 366 days 200 (also 2024-01-01 to 2024-12-31), 367 days 400; an empty month is 200 with the header alone and `rowCount` 0; year 0001 is 200 (no 500), 0000 and 2026-02-30 are 400. With the clock at 23:30Z on 3 Oct, `to=2026-10-04` is accepted (Lagos today) and at 22:59Z it is 400; `to` = the UTC day while Lagos is already on the next is accepted (Lagos is never behind UTC, so the reverse case cannot occur).

**Money and the file:** 0, 1, 99, 100, 101, 125050 and 9007199254740991 kobo are `0.00`, `0.01`, `0.99`, `1.00`, `1.01`, `1250.50`, `90071992547409.91`; a negative or fractional amount throws (the ledger writer refuses both, so it cannot reach a statement). A quoted fee split shows out `25065.00`, fees `65.00`; an in row leaves both out cells empty. Cells starting `=`, `+`, `-`, `@`, tab and CR get a `'`; a note `=HYPERLINK("http://evil","x"), and "quotes"` + CRLF + `line two` stays one cell, quotes doubled. The file starts with U+FEFF and every line ends CRLF (no bare LF outside a quoted cell). `Cache-Control: no-store`.

**Shared files:** `money.module.ts` +1 controller, +1 provider; `SERVED_MONEY_ROUTES` +1; MONEY-13's two gated-route lists +1 entry each (`GET money/statements`) and their test titles; `WALLET.md` route row and W38 rows; CONVENTIONS section 11 matches the code. The gate runs on the route (409s above; the coverage spec lists it). The committed `contract/openapi.json` equals a fresh `npm run contract:build` byte for byte.

**Findings**

1. `unclear` (load; owner or lead to decide). The route has no throttle of its own, only the global one (`HUB_THROTTLERS`: 20 a second, 200 a minute, per caller address), and its cost grows with the rows in the period, with no cap on rows. A wallet with 100,000 rows over the year (90,010 completed): one 366-day statement takes 1.2 to 1.4 s and answers 15.7 MB; the hub's RSS rose from 218 MB to 463 MB on the first call; 20 concurrent calls from one address (all inside the global limit) took 39 s and peaked at 1,632 MB RSS. At about 10,000 rows: 130 to 300 ms, 1.7 MB, 20 concurrent 2 s and 429 MB. In that database the one wallet held 90% of the table, so Postgres scanned the table and sorted 90,010 rows (5 MB spilled to disk); with many wallets the `(wawuUserId, occurredAt)` index applies, but the row count per call is the same. `statement.service.ts` says the 366-day cap means "one request never reads an unbounded slice of the ledger"; it bounds days, not rows. A wallet needs tens of thousands of real completed movements to get there, so this is not reachable cheaply today. Unblocked by a ruling: a per-route `@Throttle` (as `BVN_CHECK_THROTTLE`), a row cap, or accepting the cost. Evidence `vw27/load.js`, `load.out`, `load10k.out`, `explain.out`.
2. Test gap (not a defect). Mutant M10, `COALESCE(e."fintavaReference", e."customerReference", ...)` (Fintava's reference before ours) passes all 25 statement tests: every test row carries exactly one reference, so the order is never exercised. Real sends store both (`fintava-client.ts` `fintavaReference`, our `customerReference`), so this mutant would put Fintava's reference on the sender's line while W27 shows ours. A test with both references on one row closes it. Evidence `vw27/mutants/M10.log`, `summary.txt`.
3. `differs-for-recorded-reason`. Mobile `contract/` and `src/api/schema.generated.ts` hold backend main fe1ec6c (byte-identical to `git show fe1ec6c:contract/openapi.json`), not the branch's contract, so `StatementView` is not in the app's types yet. `scripts/api/sync_contract.py` copies origin/main by design, and the builder report says the route reaches the app's types when the backend branch merges.

Mutants (each alone, the file restored by copy and checked equal): M1 a lone CR not quoted, M2 only the first quote doubled, M3 no byte-order mark, M4 LF line ends, M5 kobo not zero-padded, M6 the guard misses tab and CR, M7 a fee on money-in rows, M8 the counterparty skips the wallet name, M9 the bank left out of the description, M11 367 days allowed, M12 any `format` string, M13 year 0000 allowed, M14 the time column in UTC, M15 a name for a movement with no other side: all killed. M10: survived (finding 2).

Not findings: a cell starting with a space, LF or a full-width `＝` is not prefixed; that is the OWASP list the builder chose (decision 7). Not tried in a spreadsheet application here.

**NOT RUN:** the stamped PDF (G-68; unblocked by Fintava confirming a statement endpoint) and email (G-69; unblocked by the owner naming a provider and its credentials in the backend env), as the builder recorded. A Fintava sandbox call by the verifier: not needed for this route (it never calls Fintava) and the brief allows only free GETs with documented data; the builder's real round trip is `docs/fintava/sandbox/40-wallet27-statements.md`. V9's ledger rows were stored by SQL, not by MONEY-10's writer; the builder's spec, re-run here, writes them with `LedgerService.record` and `applyReversal`. V10: no screen (WALLET-35).

## Lead merge note (4 Oct 2026)

Merged to main by the lead. Backend PR #61 (5236f12) carries the statements
route, the per-person limiter and the two build slots; the lead merged main
c4d17bb (FIX-05) into it, which merged clean including
`src/tests/hub-rate-limits.contract.spec.ts`, and ran the full suite on a fresh
seeded database: 145 of 145 suites, 3,478 passed, 0 failed. Mobile contract is
synced in the SETTINGS-04 merge that follows (backend main dfaa53b). Open test
gaps from round 4, not defects: no test pins that a 503 keeps its place
(mutant M-A) or the give-back's own-window guard (mutant M-B).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
