---
id: FIX-53
title: The privacy export email is sent (wawu-id gets the data-export route the Hub asks for)
owner: YOU
area: FIX
order: 218
priority: launch
repo: wawu-id
type: backend-endpoint
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-53 · The privacy export email is sent (wawu-id gets the data-export route the Hub asks for)

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/H1.md`: FIX-53 PASS, end to end on the stack, two lows). Backend stacked in batch 11 by MERGE-11 (`wmt/H1` `13fe440`, which holds `a5d0a7d`'s note and the mail stand-in); mobile H1 `00ee90b8`. The wawu-id commit `a984298` is NOT in this batch: it stays on wawu-id `wmt/H1`.
- **Branches:** wawu-id `wmt/H1` `a984298` from `origin/main` `8e4ee10`: the route and its spec. Backend `wmt/H1` `a5d0a7d` (the Hub's note, a mail stand-in for the stack, `scripts/dev/stack.sh` passes `STACK_RESEND_API_KEY` through). Mobile `wmt/H1`: this file and the records.
- **Found by:** LINKS-01's audit, row H1 (`tasks/LINKS-01.md`): the Hub's account data export asks wawu-id for `POST /internal/users/:id/data-export`, which wawu-id did not have, so the export email was never sent and every request ended `failed` after 24 hours (BACKEND_GAPS G-131).
- **Merged and live:** nothing of this task (the Hub half is in `wmt/MERGE-11`).
- **Open findings:** none known. **Not run:** a real mail service (never called), the live host. GitHub CI runs on `wmt/**` pushes of both repos: run ids in the hand-back.
- **Next:** the batch 11 pull request merges the backend; wawu-id `wmt/H1` `a984298` merges and deploys first. When SETTINGS-08 (wawu-id `01b751f`) is also on wawu-id main, `sendDataExportLink`'s select needs `status: true, deletedAt: true` (`auth.service.ts` about :1433). The two lows are in `tasks/SWEEP-MONEY.md` (link host not pinned; `fulfil` holds a transaction across the wawu-id call).

Status set to review by the records sync, 25 Oct 2026: merged as wawu-id b201cfc9, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- This task changes `wawu-id` (and one comment, a README line and two dev-script lines in `wawu-backend`). Start the session with both repos and `wawu-wmt-mobile` attached.
- Backend `src/data-export-request/data-export-mailer.ts` (the call), `data-export-fulfilment.service.ts` (the sweep that marks a request `sent`), `data-export-link.ts` (the signed link)
- wawu-id `src/auth/internal.controller.ts` (`users/:userId/money-check-report` is the pattern), `src/mail/data-export-link.ts` (new)

## Goal

A person who asks for a copy of their data gets an email with the link. The Hub already builds the link and asks wawu-id to mail it (`POST /internal/users/:userId/data-export` with `{ downloadUrl, expiresAt }`, behind `X-Service-Key`); wawu-id has no such route, so the Hub got 404, the request stayed `pending` and was marked `failed` a day later. wawu-id owns every address and every email template, so the route is built there. No other route in wawu-id does this job (`internal/mail/send` is the campaign relay and takes an address and finished HTML, which the Hub must not hold).

## Scope

- wawu-id: `POST /internal/users/:userId/data-export` (additive; the same `X-Service-Key` check as the other `/internal` routes). Answers 200 `{ data: { emailed: true } }` only after the mail was handed to the mailer; 400 for a body that is not exactly the export link and a deadline; 404 no such account; 409 no proven email address; 503 when the mailer could not take it (so the Hub keeps the request `pending` and asks again; "nothing sent" is never a 200).
- Not a relay: the link must be the Hub's export link (https, or http to this machine outside production; path `/api/hub/settings/privacy/export/download`; one `token`; no sign-in name or fragment), the deadline within the next 7 days, and the link in the mail is rebuilt from the checked parts. The mail goes to the account's own address by the rule every other mail uses (`provenEmail`).
- Not in scope: the Hub's retry rules, `mock-wawu-id` (it already records the call), the PIN-reset route (G-400), a template for any other mail.

## Capability checks

- [ ] One export end to end on a stack (real Hub, real wawu-id, a local mail stand-in): request, `pending`, then `sent` within a minute, and the stand-in holds one mail to the account with the link; the link opens the file.
- [ ] The route answers 200, 400, 401, 404, 409 and 503 as above, and sends nothing on any but 200 (the wawu-id spec, 28 tests).
- [ ] A body with an extra field, another path, another query value, a sign-in name, a fragment, a bad token, a past or too-far deadline is 400 and reads nothing.
- [ ] No em-dash in the mail; the name is escaped; the deadline reads in Lagos time.
- [ ] Nothing else in wawu-id changes: `src/mail` and `src/auth` specs unchanged and green; tsc and lint on the changed files exit 0.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-53.md](history/FIX-53.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
