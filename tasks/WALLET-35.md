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

As of 16 Oct 2026, builder round 1.
- **Status:** verifying. Built whole: W38 and its Statements row on W35, the Hub's email routes and WAWU ID's mail relay carrying a file.
- **Branches:** mobile `wmt/WALLET-35` (head of the branch, this file), backend `wmt/WALLET-35` (wawu-backend, 7aa55d3, main 22bb2cc merged in), wawu-id `wmt/WALLET-35` (e57429f, main 7869c95 merged in). Nothing merged. No backend migration.
- **Built:**
  - Backend: `POST /money/statements/email` (`{ from, to, format }`, no address) builds the file exactly as `GET /money/statements` does and mails it as one CSV attachment through WAWU ID's relay to the token's own address, only when the token says `emailVerified` is true. `GET /money/statements/delivery` names that address masked (`u***@x.dev`), `canEmail`, and the formats served (`csv`). New codes `email_not_verified` (409) and `statement_email_failed` (503). The statement limits (5 a minute, 30 an hour) are shared with the download.
  - wawu-id: `POST /internal/mail/send` takes `attachments` (at most 2, plain file name, base64, a short type list, 12 MiB decoded in all) and a 17 MB body on that route only.
  - App: `/wallet-statement` (W38) under `src/features/wallet/statements/`; Wallet settings gets the Statements row and shows "Statement sent to u***@x.dev" over W35 after a send.
- **Decisions taken (defaults, the owner may override):**
  1. Stamped PDF is not drawn (G-68): the Format row shows what `delivery.formats` says. One format is a plain field, more would be the segments.
  2. "Send to" is read only: the account's own confirmed address, masked by the server. A statement lists every movement and counterparty name, so it never goes to a typed address.
  3. An emailed statement is an attachment (G-69's owner question): built as yes, to the account's own confirmed address only.
  4. The Account field has no chevron: one account, nothing to choose. Dates show as the canvas writes them; the calendar is the app's own (no shared date picker exists).
  5. "3 months" is this month and the two before it, from the 1st to today (26 Sep gives 1 Jul to 26 Sep, as drawn). It is the opening choice, as drawn.
- **Checked live** (stack `wallet35`: Hub, mock WAWU ID, web export of this branch, a seeded wallet): 1 to 16 Oct mailed 2 rows, 1 Jul to 16 Oct mailed 3, rows of 20 Jun and outside each period never appeared; the mail went to the token's own address; an account whose token has no confirmed email sees the message and a disabled Send.
- **Open for the lead:**
  1. Deploy order: wawu-id with attachments must be live before the Hub's route is used. An older wawu-id drops the unknown `attachments` field and would mail with no file (BACKEND_GAPS G-69).
  2. G-486: an account with no confirmed email has no screen to confirm it from W38.
  3. SHARED-CHANGES WALLET-35 #1 to #3 (backend contract, mobile contract copy from the branch, a read-only tap-to-choose `TextField`).
- **Findings:** none yet. NOT RUN: V10 (a real device), a real mail provider, the stamped PDF.
- **Next:** a verifier (not the builder) runs V1, V4, V5, V6, V9 on the three branches.
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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-35.md](history/WALLET-35.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
