---
id: FIX-09
title: No em-dashes in any message a person can read from the backend or the web
owner: YOU
area: FIX
order: 190
priority: launch
repo: wawu-backend, wawuafrica
type: setup
status: verifying
depends_on: []
decisions: [R-5]
passes: [V1, V2, V3]
artboards: []
---
# FIX-09 · No em-dashes in any message a person can read from the backend or the web

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Built, waiting for an independent verifier. Backend `wmt/FIX-09`, web `wmt/FIX-09`, mobile `wmt/FIX-09` (this file only). No PR.
- **Done (backend):** 34 served strings rewritten without an em-dash (error messages, validation messages, the legal intake's option labels and helper, status labels, the AI brief's prompt). A new spec `src/served-strings/tests/no-em-dash.spec.ts` parses every `.ts` under `src/` and `prisma/` (not specs, not tests, not migrations) and fails on a dash in any string or template literal, escaped or as an HTML entity, and in every text asset (`assets/`, json or html under `src/`). A data migration `20261022130000_no_em_dash_stored_labels` rewrites the two stored values older rows still carry (ServiceApplication label and the first timeline note). No schema change.
- **Done (web):** `public/tgif` 02, 03, 04, 05, 06, 09, 10, 12 now equal the backend's book (18 dashes gone, 15 days, `quote` only).
- **Not in scope, left as they are:** code comments, test names and fixtures, the contract's descriptions (they come from JSDoc comments), the mock WAWU ID's console line, text a user or an admin typed.
- **Next:** a verifier checks the report below against the branch, then the lead merges backend and web.
- **History:** reports go to tasks/history/FIX-09.md.

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

## Builder report

Builder, 16 Oct 2026. Backend `wmt/FIX-09` at 5df5420 (from main 56f94d0), web `wmt/FIX-09` at 2148c7d (from main 5b45d65), mobile `wmt/FIX-09` (this file only). No provider, wawuafrica.com or production Hub call. Stack `fix_09` on 7190-7191 (Hub and mock WAWU ID), stopped at the end. Migration stamp 20261022130000.

**The scan (capability 1).** The first look at the backend found 2,365 dashes in 500 files; almost all are comments. A parser pass over every string and template literal (comments cannot match) found 37 in shipped code, plus one only written as an escape (`plans-config.ts`, a guard). Seeds (`prisma/seed.ts`), `assets/` (TGIF book already clean since HOME-09), the receipts, `src/plans/plans.config.json` and the migrations carry none in served text. The web's `public/tgif` had 18 in 8 files.

**The gate (capability 2).** `src/served-strings/tests/no-em-dash.spec.ts` (10 tests, no database): every `.ts` under `src/` and `prisma/` outside specs, tests and migrations is parsed and any string or template literal with U+2014, its escape or `&mdash;` fails with `file:line`; every text asset (`assets/`, json or html under `src/`) is read raw. Its own cases prove a literal, a template head, middle and tail, an escape and an entity are caught and a comment, a JSDoc block and a regular expression are not. Mutation: a dash put back into `admin-events.service.ts` and into `assets/tgif/01.json` failed 2 tests with both lines named; both files restored.

**Every changed answer.** Same status code and shape everywhere; only the text moved (a dash became a full stop, a colon, a comma or brackets).
- Admin: content review "reviewed. This one is already live" and the reject, take-down, event, KYC and verification "reason is required. The ... is shown it." (400); events "approved from pending. This one is published" (400); payments "being settled. A redelivery" (409), "not failed. There is nothing to retry" (409), "pretend otherwise. Open the creator" (the re-verify block reason); creator search (400 for an email or phone); the admin token log line.
- App: community "already approved. This person is a member" and "Nothing to update. Send a name" (400, 409); community message "something in it. Write something" (400); content "separate free preview: previewAsset" (400) and "This content is free, so no unlock is required" (400); KYC "no creator state. A creator account type" (403); professional "licence is required. A portfolio" (400); shop "cannot go live. Shoppers would see" (admin) and "charged for it. Contact support" (409).
- Legal intake: three 503 messages "saved. Please try again"; option labels "No rush (2 to 4 weeks)", "Soon (1 to 2 weeks)", "Urgent (3 to 7 days)", "Very urgent (within 48 hours)", "Immediate (today)", "Partly (messages or emails only)" (values unchanged); helper "A range is fine. Your consultant"; the AI brief's prompt line.
- Service applications: label "Submitted, under review" and the first timeline note "... for <type>: <nature>."; the migration rewrites older rows (tested on four planted rows, a second run changes none; the applicant's own text is never touched).
- Logs only: refund adapter message, account-purge delegate line.
- Ten expected messages in contract specs that asserted the old text were changed to the new text (admin content review, events x3, KYC, verification, community x3, service application fixture); nothing else in those specs.

**Checks.** `tsc --noEmit` exit 0; eslint on the new spec clean, and prettier shows no new diff on any changed line (two files reflowed); served-strings, plans-config and the legal assistant prompt specs 62 of 62. Contract specs on the stack (DB seeded): content review, events, KYC review, verification review, payments, creators, community, community messages, service application, professional, content piece, shop, legal intake, admin auth, account purge: 52 + 512 passed, 0 caused by this change. CI on 5df5420: see the run ids in the hand-back.

**Not run here.** `kyc-submission.contract.spec.ts` hard-codes the mock WAWU ID on :4001 (not my port); no assertion in it reads the one message changed. Protected routes (the lock stores shapes, `message: "string"`, so no relabel is needed and none was made), gates and contract:build run in CI. The contract file is unchanged: its descriptions come from JSDoc comments, which are exempt.

**For the lead.** `scripts/dev/stack.sh` does not export the mock's service key, so four suites (verification review, payments, professional, community rooms) fail with a 401 or a handle for a name until `MOCK_WAWU_ID_INTERNAL_SERVICE_KEY` and `WAWU_ID_INTERNAL_SERVICE_KEY` are set from the mock's environment. The web branch only copies the backend's book over 8 files; nothing in the web's own code changed.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
