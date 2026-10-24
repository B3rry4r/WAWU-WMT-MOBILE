---
id: WALLET-35
title: Statements: ask for a statement by email
owner: YOU
area: WALLET
order: 306
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
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-35.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/SCHOOLS-10` (this branch contains it); API types regenerated from backend `wmt/WALLET-35` (b9cda2a).
- **Branches:** mobile `wmt/WALLET-35` (head of the branch, this file; main 3117807 already in), backend `wmt/WALLET-35` (wawu-backend, 8548d0c; main 18ac5f9 merged in), wawu-id `wmt/WALLET-35` (e9386cc; main 6740553 merged in). Backend round 1 (7aa55d3) is already on backend main (PR #136, 18ac5f9) and deploying; round 2 is on the branch only. wawu-id and mobile are not merged. No backend migration.
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
- **History:** reports in tasks/history/WALLET-35.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 5 in SWEEP-MONEY (a statement mail that fails still uses a rate slot, a burst of oversize requests, relay capacity, a keyless POST to a relay sub-path answers 401, one wawu-id spec flake under load); round 2 and 3 items R2-1 to R2-3 are fixed. They are in tasks/SWEEP-MONEY.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-35.md](history/WALLET-35.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
