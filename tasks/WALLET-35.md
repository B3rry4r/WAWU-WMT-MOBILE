---
id: WALLET-35
title: Statements: ask for a statement by email
owner: YOU
area: WALLET
order: 260
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [WALLET-27, WALLET-06]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [W38]
---
# WALLET-35 · Statements: ask for a statement by email

## Current state

As of 16 Oct 2026, builder round 3 (two small wawu-id fixes and a corrected deploy order; round 2 fixed the verifier's medium and two lows).
- **Status:** verifying. Built whole: W38 and its Statements row on W35, the Hub's email routes and WAWU ID's mail relay carrying a file.
- **Branches:** mobile `wmt/WALLET-35` (head of the branch, this file; main 3117807 already in), backend `wmt/WALLET-35` (wawu-backend, 8548d0c; main 18ac5f9 merged in), wawu-id `wmt/WALLET-35` (2263617; main 6740553 merged in). Backend round 1 (7aa55d3) is already on backend main (PR #136, 18ac5f9) and deploying; round 2 is on the branch only. wawu-id and mobile are not merged. No backend migration.
- **Built:**
  - Backend: `POST /money/statements/email` (`{ from, to, format }`, no address) builds the file exactly as `GET /money/statements` does and mails it as one CSV attachment through WAWU ID's relay to the token's own address, only when the token says `emailVerified` is true. `GET /money/statements/delivery` names that address masked (`u***@x.dev`), `canEmail`, and the formats served (`csv`). New codes `email_not_verified` (409) and `statement_email_failed` (503). The statement limits (5 a minute, 30 an hour) are shared with the download.
  - wawu-id: `POST /internal/mail/send` takes `attachments` (at most 2, plain file name, base64, a short type list, 12 MiB decoded in all) and a 17 MB body on that route only. Round 2: it answers `{ id, attachments }` (how many files it handed on) when the body had a list, and the 17 MB parser runs only for a caller that shows the service key.
  - Round 3, wawu-id: `attachments: null` is a 400 before anything is sent (it used to mail and then answer 500); a POST to `/internal/mail/send` without the service key is a 401 and its body is never read, at any size.
  - Round 2, Hub: a mail that carries a file is "sent" only when the relay's answer counts the same number of files (an older relay answers `{ id }` and is `statement_email_failed`); a file over 12 MiB is the final `400 statement_too_large` before anything is sent (`STATEMENT_EMAIL_MAX_BYTES`, next to the row cap), which the app shows as the server's sentence.
  - App: `/wallet-statement` (W38) under `src/features/wallet/statements/`; Wallet settings gets the Statements row and shows "Statement sent to u***@x.dev" over W35 after a send.
- **Decisions taken (defaults, the owner may override):**
  1. Stamped PDF is not drawn (G-68): the Format row shows what `delivery.formats` says. One format is a plain field, more would be the segments.
  2. "Send to" is read only: the account's own confirmed address, masked by the server. A statement lists every movement and counterparty name, so it never goes to a typed address.
  3. An emailed statement is an attachment (G-69's owner question): built as yes, to the account's own confirmed address only.
  4. The Account field has no chevron: one account, nothing to choose. Dates show as the canvas writes them; the calendar is the app's own (no shared date picker exists).
  5. "3 months" is this month and the two before it, from the 1st to today (26 Sep gives 1 Jul to 26 Sep, as drawn). It is the opening choice, as drawn.
- **Checked live** (stack `wallet35`: Hub, mock WAWU ID, web export of this branch, a seeded wallet): 1 to 16 Oct mailed 2 rows, 1 Jul to 16 Oct mailed 3, rows of 20 Jun and outside each period never appeared; the mail went to the token's own address; an account whose token has no confirmed email sees the message and a disabled Send.
- **Open for the lead:**
  1. Deploy order: wawu-id first, then the Hub's round 2. An old Hub with the new wawu-id works (the Hub's request bytes are unchanged and it ignores the extra `attachments` answer). The other way round is not safe: a new Hub on an old relay fails every send (503) and the old relay has already mailed a message with no file each time. The round 1 Hub route is already live, so until wawu-id with this branch is live a statement send mails the person a message with no file.
  2. G-486: an account with no confirmed email has no screen to confirm it from W38.
  3. SHARED-CHANGES WALLET-35 #1 to #3 (backend contract, mobile contract copy from the branch, a read-only tap-to-choose `TextField`).
- **Findings:** the verifier's round 1 medium (an older relay said "sent") and two lows (file over 12 MiB answered a retryable 503; the 17 MB parser before the key check) are fixed in round 2. The statement slot a failed send uses (verifier finding 5) is a sweep row in SWEEP-MONEY, and G-486 stays the lead's open row. NOT RUN: V10 (a real device), a real mail provider, the stamped PDF.
- **Next:** a verifier (not the builder) checks round 3 on wawu-id: `attachments: null` mails nothing, a keyless body of any size is 401 with low memory.
- **History:** reports in tasks/history/WALLET-35.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/designer/BRIEF.md`: its entries for W35 and W38 (the brief is part of the design: build its version)
- The design: `python3 scripts/design/render_design.py W35 W38` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

A user can ask for a statement for a period and get it by email (W38), built whole once WALLET-27 serves
statements. Moved out of WALLET-06, where statements were after launch inside a launch task.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`. This task also adds the Statements row to W35 (WALLET-06), exactly as W35 draws it.

## Artboards

- **W38 · Statements**: Statement request: account, period presets or custom range, format Stamped PDF or CSV, email destination, Send statement; toast on W35.

## Capability checks

- [ ] From W35, a user can tap Statements and reach W38 (this task adds the row).
- [ ] **W38**: a user can pick a period; pick a format; Send statement, and the statement arrives by email with exactly that period's transactions.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W38: Stamped PDF 'for visa and loan applications' (acceptance claim)
- W38: lennox@wawu.africa (sample)

## Designer notes (⚠, unresolved)

- W38: “⚠ This depends on Fintava issuing signed statements.”

## Builder report, round 2

Builder, 16 Oct 2026 (Sonnet). Branches: wawu-backend `wmt/WALLET-35` 8548d0c, wawu-id `wmt/WALLET-35` 9027aec, mobile `wmt/WALLET-35`. **The round 1 backend (7aa55d3) is already on backend main** (PR #136, merge 18ac5f9, merged before its check finished) and deploying; round 2's backend is on the branch only, on top of that main. wawu-id and mobile are not merged. Each fix below is the lead's ruling of 16 Oct 2026; the owner may override.
- **1 (medium) The Hub said "sent" when an older relay dropped the file.** Before: wawu-id (main) drops `attachments` (its body whitelist) and answers `200 { id }`; `WawuIdMailRelay` took any 200 with an `id`; the app drew "Statement sent". After: wawu-id answers `{ id, attachments }` (files handed on) when the body had a list, `{ id }` alone otherwise; the Hub calls a mail that carries files sent only when that number is the one it sent, else `statement_email_failed` (503). A mail with no files (campaign, money-check report) sends the same bytes and is judged by the same rule as before (a spec compares the body byte for byte, and feeds it answers with and without a count). Specs, Hub: an "older relay" stand-in answering `{ id }` fails; counts 0, 2, `"1"`, `null`, a list, `true` fail; the right count is sent. Specs, wawu-id: counts for 0, 1 and 2 files, no list answers `{ id }` only. One honest limit: an older relay has already mailed a message with no file by then, so that person gets one mail without the file and the app says it failed.
- **2 (low) A file over the relay's 12 MiB answered a retryable 503.** Before: 49,990 rows with long names are about 12.5 MB; wawu-id answered 400 and the Hub showed 503 "Try again". After: the Hub measures the file in bytes before building the mail and answers the final `400 statement_too_large` ("This statement is too big to send by email. Pick a shorter range."), the person's place is given back, nothing is sent. The cap is `STATEMENT_EMAIL_MAX_BYTES` (12 MiB) in `statement-config.ts` beside `STATEMENT_MAX_ROWS`. The app already shows the server's sentence for that code (its existing test); no app code changed. Spec: 12 MiB + 2 bytes (counted in bytes, two-byte letters) is the 400 eight times in a row without using the 5 a minute, exactly 12 MiB is sent.
- **3 (low) The 17 MB body parser ran before the service key.** Before: 8 parallel unauthenticated 16 MiB bodies took wawu-id from 204 MB idle to 521 MB peak (16 bodies: 487 MB), each ending 401. After: the key is checked first and only a caller that shows it gets the big parser; anyone else is held to 100 kb like every route. Same script (the verifier's `mem.sh`), same stack: idle 151 MB, 8 bodies 170 MB peak, 16 bodies 188 MB. They now end 500 (the app's usual answer for Express's 413 on any route), a small body without the key is still 401, other routes keep 100 kb. Spec: no key, wrong key and an empty key never get the big parser; with the key 3 MB and 2 MB bodies are taken.
- **Contract.** One line of the email route's summary changed (backend `contract/openapi.json`, built twice equal); wawu-id's contract is unchanged (built twice equal). Mobile `contract/` and `src/api/schema.generated.ts` re-copied from backend 8548d0c (SHARED-CHANGES WALLET-35 #2: the diff also carries what other tasks added to backend main since the last copy).
- **Sweep, no code.** A failed send still uses one of the statement slots (verifier finding 5): row WALLET-35 V-5 in SWEEP-MONEY. G-486 (no screen to confirm an email) stays the lead's open row.
- **Checks.** Backend: `tsc` EXIT 0, eslint EXIT 0 on the touched files, `statement-email.contract.spec` 19/19 and `wawu-id-mail-relay.spec` 9/9 (the other four statements specs in `src/money/statements` pass too), `contract:build` twice equal, a mutation run (count check off, size check off) failed 5 of the new tests. GitHub, 8548d0c: all green except Executable gates, with the same FAIL lines as main 18ac5f9 (18 lines both). wawu-id: `tsc` EXIT 0, eslint EXIT 0, `src/mail` 44/44, `contract:build` twice equal; GitHub 9027aec: all green. App: no app code changed; the full local check once at the end, `typecheck && lint && jest (2 workers) && gates && tasks`: typecheck and lint 0, 158 suites / 2855 tests passed, gates 0 fail / 5 warn (as before). Its last step `tasks` failed once on my own edit (a depends_on I added to SWEEP-MONEY, order 248 before 260); I removed that edit and `tasks` then passed (EXIT 0, below).
- **Deploy order.** wawu-id (this branch) first, then the Hub's round 2. The round 1 Hub is live now, so until wawu-id is live a send mails a message with no file and the app says sent; the Hub's round 2 turns that into a failure. A Hub deployed before wawu-id fails every send (503) AND the old relay mails a message with no file each time (corrected in round 3; round 2 wrongly called this safer); a new wawu-id under an old Hub works, so wawu-id goes first. Within the deploy window an `Idempotency-Key` retry that reaches the new wawu-id may be answered by the provider with the earlier, file-less mail, and the Hub would call it sent: keep the window short.
- **NOT RUN.** A real delivered mail (no mail key on this machine), V10 (a device), the stamped PDF. The Hub against the real new wawu-id with a stand-in for the provider was not run end to end; each half is tested against the other's answer shape.

## Builder report, round 3

Builder, 16 Oct 2026 (Sonnet). wawu-id `wmt/WALLET-35` 2263617 (main 6740553 merged in); mobile `wmt/WALLET-35` head; backend unchanged at 8548d0c. Each item is the lead's ruling of 16 Oct 2026 on the round 2 verifier's lows.
- **1. `attachments: null` mailed, then answered 500.** Chosen: refuse with 400 before sending. Reason: a caller that means to attach a file and sends null has a bug, and a mail without its file is the wrong mail (round 1's medium was exactly that). The DTO's `@IsOptional` let null through and the service read `.length` after the mail had gone, giving the cap slot back; now only an absent key skips the check (`@ValidateIf(attachments !== undefined)`), so null fails `@IsArray`. Before: null sent the mail, then 500. After: null is 400, no mail, no slot used. Spec: null is 400 and the provider stand-in sees nothing.
- **2. Keyless oversize body answered 500.** `mail-relay-body.ts` now answers a POST to `/internal/mail/send` without the right key with the guard's own 401 (`{ statusCode, message }`) before any body is read. Before: over 100 kb without the key was 500. After: 401 at any size; other routes keep 100 kb and their 500, and a GET on the path is untouched (404). Spec: no key, wrong key, empty key with a 2 MB body are 401 with that body; small ones are 401.
- **Memory (the verifier's `mem.sh`, own stack, wawu-id 2263617).** 8 keyless 16 MiB bodies: peak 133 MB, all 401 in 0.5 s; 16 bodies: peak 151 MB, all 401 in 0.7 s (round 2, builder run: 170 and 188 MB; verifier run: 255 and 260 MB). With the key: a 150 KB body reaches validation (400).
- **3. Deploy order.** The round 2 report's sentence was wrong (a new Hub on an old relay still lets the old relay mail a file-less message; the Hub answers 503 but the mail went). Corrected in place in the round 2 report and in Current state: wawu-id first, then the Hub; an old Hub with the new relay works.
- **Checks.** wawu-id: `tsc` EXIT 0, eslint EXIT 0 on the three touched files, `src/mail` 44/44, `contract:build` twice equal (no diff from the branch). Mobile: no app code changed; gates and tasks below. NOT RUN: a real Resend, V10, the full wawu-id suite (GitHub).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-35.md](history/WALLET-35.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
