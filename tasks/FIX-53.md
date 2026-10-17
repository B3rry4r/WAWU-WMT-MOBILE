---
id: FIX-53
title: The privacy export email is sent (wawu-id gets the data-export route the Hub asks for)
owner: YOU
area: FIX
order: 218
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-53 · The privacy export email is sent (wawu-id gets the data-export route the Hub asks for)

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by the H1 bundle builder (Sonnet); not yet checked by a second session.
- **Branches:** wawu-id `wmt/H1` `a984298` from `origin/main` `8e4ee10`: the route and its spec. Backend `wmt/H1` `a5d0a7d` (the Hub's note, a mail stand-in for the stack, `scripts/dev/stack.sh` passes `STACK_RESEND_API_KEY` through). Mobile `wmt/H1`: this file and the records.
- **Found by:** LINKS-01's audit, row H1 (`tasks/LINKS-01.md`): the Hub's account data export asks wawu-id for `POST /internal/users/:id/data-export`, which wawu-id did not have, so the export email was never sent and every request ended `failed` after 24 hours (BACKEND_GAPS G-131).
- **Merged and live:** nothing of this task.
- **Open findings:** none known. **Not run:** a real mail service (never called), the live host. GitHub CI runs on `wmt/**` pushes of both repos: run ids in the hand-back.
- **Next:** a fresh verifier (V1 to V4, V9 on the stack); the lead merges wawu-id and the backend together, then deploys wawu-id first.

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

## Builder report

Builder (H1 bundle, Sonnet), 17 Oct 2026. wawu-id `wmt/H1` `a984298` (from `origin/main` `8e4ee10`), backend `wmt/H1` `a5d0a7d` (from `origin/wmt/MERGE-9` `4e444ca`), mobile `wmt/H1`.
- **Built:** the route (`internal.controller.ts` `dataExport`, `auth.service.ts` `sendDataExportLink`, `mail.service.ts` `sendDataExportLink`, new `src/mail/data-export-link.ts` with `parseDataExportLink` and the Lagos deadline text), the contract paragraph in `WAWUAfrica_API_Contracts.md`, and 28 tests (`src/auth/data-export-email.spec.ts`, the mail goes through the real `MailService` to a local stand-in for Resend). The Hub side needed no code: its call already matches; only its mailer comment and README line changed.
- **Proof on the stack** (`h1_test`, ports 7980 to 7987, real Hub and real wawu-id built from these branches, wawu-id's transport pointed at `scripts/dev/mail-standin.cjs` on 7982, Nuvion stand-in as always): a throwaway account signed up and proved its email through wawu-id (the code mail landed in the stand-in too); `POST /settings/privacy/export` answered 201 `pending`; the sweep asked wawu-id and the request became `sent` about 60 seconds later; the stand-in holds one mail "Your WAWUAfrica data is ready to download" to that address, the button link opens the export (200, JSON with `exportedAt`, `requestId`, `accountId`, `notIncluded`, `data`), the deadline reads "Tue 20 Oct 2026 at 16:50" (72 hours, Lagos time), no em-dash; the route without the key is 401. Evidence in the lead's scratchpad folder `h1-b/` (`mail-recorded.keep`, `e2e*.py`).
- **Checks:** wawu-id `npx tsc --noEmit` 0; eslint on the 5 changed files 0; `src/auth/data-export-email.spec.ts` 28/28 and `money-check-report.spec.ts` 27/27; `src/mail` and `src/auth` together 586/588, the 2 failures are `phone-signup.service.spec.ts` timing out at 5 s with load average 21 (a file this task does not touch; see Not run). Backend: no source change for this task, so the FIX-17 checks below cover it.
- **Decisions** (Default (agent), the owner may override): (1) the address rule is `provenEmail`, the one every wawu-id mail uses (an account that typed an email on the phone and never proved it gets 409, a web or legacy account gets the mail), not the stricter verified-only rule of the money check; (2) the link host is not pinned to a configured list (wawu-id knows the Hub only by its loopback address), the path and shape are; a leaked key can mail a person a link of that exact shape to any host, which is no more than `unpaid-warning` allows today; (3) a week is the longest deadline taken (the Hub's is 72 hours).
- **Not run:** a real mail service (never called), the live host. wawu-id gates: 0 fail, 22 warn, 0 accepted (as on main).
- **Found, not fixed (Hub, not this task):** `DataExportFulfilmentService.fulfil` holds a database transaction across the call to wawu-id (up to the 10 s timeout, `FOR UPDATE SKIP LOCKED` row lock) where the common rules say decide, call holding nothing, record. Safe today (batch of 20, one row locked at a time) but a sweep follow-up.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
