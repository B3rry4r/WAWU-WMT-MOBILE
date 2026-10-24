# FIX-09 · round history

Moved out of [tasks/FIX-09.md](../FIX-09.md) word for word, oldest first. The current state is in that file.

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

**Checks.** `tsc --noEmit` exit 0; eslint on the new spec clean, and prettier shows no new diff on any changed line (two files reflowed); served-strings, plans-config and the legal assistant prompt specs 62 of 62. Contract specs on the stack (DB seeded): content review, events, KYC review, verification review, payments, creators, community, community messages, service application, professional, content piece, shop, legal intake, admin auth, account purge: 52 + 512 passed, 0 caused by this change. CI on 5df5420 (Branch checks 38901873984, Protected routes 38901873762, Gates 38901873810): suite 3 of 3, netns, contract, protected routes, baseline and deploy-in-sync green; gates red with the same 16 FAIL lines as main 56f94d0 (diff empty). Mobile, local: typecheck and lint clean, jest 151 of 152 suites (the one killed for memory, `flowReturn`, passes alone 3 of 3), gates 0 findings, tasks check 283 tasks (`docs/PROGRESS.md` regenerated for the status change).

**Not run here.** `kyc-submission.contract.spec.ts` hard-codes the mock WAWU ID on :4001 (not my port); no assertion in it reads the one message changed. Protected routes (the lock stores shapes, `message: "string"`, so no relabel is needed and none was made), gates and contract:build run in CI. The contract file is unchanged: its descriptions come from JSDoc comments, which are exempt.

**For the lead.** `scripts/dev/stack.sh` does not export the mock's service key, so four suites (verification review, payments, professional, community rooms) fail with a 401 or a handle for a name until `MOCK_WAWU_ID_INTERNAL_SERVICE_KEY` and `WAWU_ID_INTERNAL_SERVICE_KEY` are set from the mock's environment. The web branch only copies the backend's book over 8 files; nothing in the web's own code changed.

## Verifier report

_Not started._

