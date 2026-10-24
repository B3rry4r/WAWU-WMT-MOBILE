---
id: AUTH-09
title: WAWU ID emails the wallet PIN reset code
owner: YOU
area: AUTH
order: 220
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-72, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# AUTH-09 · WAWU ID emails the wallet PIN reset code

## Current state

As of 19 Oct 2026, merging (lead): checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/AUTH-09.md`: MERGE, no blocker, high or medium; one low and two info rows, now in `tasks/SWEEP-AUTH.md`) and stacked in batch 26 (wawu-id `wmt/MERGE-26` = `wmt/AUTH-09` `7d43650`; mobile `710f9726`).
- **Status:** merging (lead).
- **Branches:** wawu-id `wmt/AUTH-09` at `7d43650` (one commit on origin/wmt/MERGE-16 `22b5f0f`, no pull request); mobile `wmt/AUTH-09` (this file, `BACKEND_GAPS.md` G-400, PROGRESS and INDEX). Backend: no change.
- **Merged / live:** nothing. Deploys with the next wawu-id release; no Hub change, no new variable, no migration.
- **Findings:** L1 (low): the route mails the typed email of an account with no phone proof and an unproven email (the rule is `emailVerified || !phoneVerifiedAt`); hardening is to require `emailVerified`. Not reachable from the Hub today. Two info rows (one shared service key and no per-user rate limit; body-parser errors before the key check, pre-existing). All three are rows of `tasks/SWEEP-AUTH.md`, open for the lead.
- **Next:** the batch 26 pull request (the lead).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md` R-72 (the PIN reset code goes by email at launch) and R-39 (one provider seam; no SMS under Nuvion)
- `BACKEND_GAPS.md` G-400 (the route's contract) and G-402 (W37 reads the masked email)
- wawu-id `src/auth/internal.controller.ts` (`unpaid-warning`, `data-export`), `src/mail/data-export-link.ts`, `src/auth/data-export-email.spec.ts`
- backend `src/nuvion/nuvion-otp-sender.ts` (the caller) and `mock-wawu-id/server.js` (`pin-reset-code`, the answers to match)

## Goal

Forgot PIN (W37) works under `WALLET_PROVIDER=nuvion`: the Hub asks WAWU ID to email the code and the person gets it. Today no WAWU ID branch has the route, so every reset answers 503 and its code never arrives.

## Scope

wawu-id only: `POST /internal/users/:userId/pin-reset-code` behind `X-Service-Key`, body `{ code, expiresInMinutes }`; it looks up the account's own proven email and sends `MailService.sendOtpCode(email, code, 'reset your transaction PIN')`. 200 `{ data: { sent: true } }` when sent; 404 unknown or deleted; 401 no key; 400 bad body; never logs or returns the code or the address. The Hub and the mock are not changed.

## Capability checks

- [ ] A Hub call with a good code reaches the account's email once, with the code and its real life in minutes in the mail.
- [ ] An unknown, non-uuid, deleted or deleting account is 404 and nothing is sent; no key or a wrong key is 401 before anything is read.
- [ ] A bad body (not 6 digits, a life that is not a whole number of 1 to 60 minutes) is 400 and nothing is read or sent.
- [ ] A mail the mailer did not take is never a 200 (503); an account with no proven address is 409.
- [ ] The code and the address appear in no log line and no answer.
- [ ] The Hub's own `NuvionOtpSender` against the real route sends; against the mock it answers the same 200, 400, 401, 404.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AUTH-09.md](history/AUTH-09.md).

## Owner sign-off
