---
id: FIX-09
title: No em-dashes in any message a person can read from the backend or the web
owner: YOU
area: FIX
order: 190
priority: launch
repo: wawu-backend, wawuafrica
type: setup
status: done
depends_on: []
decisions: [R-5]
passes: [V1, V2, V3]
artboards: []
---
# FIX-09 · No em-dashes in any message a person can read from the backend or the web

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-09.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-10` (this branch contains it); API types regenerated from backend `wmt/FIX-09` (4e1ee39).
- **Done (backend):** 34 served strings rewritten without an em-dash (error messages, validation messages, the legal intake's option labels and helper, status labels, the AI brief's prompt). A new spec `src/served-strings/tests/no-em-dash.spec.ts` parses every `.ts` under `src/` and `prisma/` (not specs, not tests, not migrations) and fails on a dash in any string or template literal, escaped or as an HTML entity, and in every text asset (`assets/`, json or html under `src/`). A data migration `20261022130000_no_em_dash_stored_labels` rewrites the two stored values older rows still carry (ServiceApplication label and the first timeline note). No schema change.
- **Done (web):** `public/tgif` 02, 03, 04, 05, 06, 09, 10, 12 now equal the backend's book (18 dashes gone, 15 days, `quote` only).
- **Not in scope, left as they are:** code comments, test names and fixtures, the contract's descriptions (they come from JSDoc comments), the mock WAWU ID's console line, text a user or an admin typed.
- **History:** reports go to tasks/history/FIX-09.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: stored notification text from before 21 Sep may still carry a dash; the refund adapter message is stored in DirectMessage.refundError, not logs only. They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head. The website part (wawuafrica `wmt/FIX-09` 2148c7d, public/tgif only) is left alone on its own branch for the lead to merge.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `CLAUDE.md` (no em-dashes in anything a user reads; a product-owner instruction)
- `tasks/EVENTS-11.md` (PR #83's note on the admin events messages) and `tasks/HOME-09.md` (O5: the web's `public/tgif`)

## Goal

The backend still sends em-dashes in error and notification messages (32 found in the admin events messages and others, for example "can only be restored from removed — this one is pending"), and the web's `public/tgif` assets carry 18. The product owner's rule is no em-dashes in anything a person reads.

## Scope

Rewrite every user-readable string the backend sends (error messages, notification text, seeded content, emails) without an em-dash: two sentences, a comma, a colon or brackets. Same in the web's `public/tgif`. Code comments are exempt. Add a gate or spec that fails on an em-dash in a served string. Protected routes whose message changes need the relock-approved label: list each changed protected answer in the PR.

## Capability checks

- [ ] A scan of served strings (messages, notifications, seeds, emails, web public assets) finds no em-dash.
- [ ] A spec or gate fails when one is added back.
- [ ] Protected routes pass with the relabelled lock; the PR lists every changed answer.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-09.md](history/FIX-09.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
