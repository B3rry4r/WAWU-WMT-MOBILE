# AUTH-09 · round history

Moved out of [tasks/AUTH-09.md](../AUTH-09.md) word for word, oldest first. The current state is in that file.

## Builder report

**Branches.** wawu-id `wmt/AUTH-09` `7d43650` (6 files, +608/-4); mobile `wmt/AUTH-09` (docs only). No SHARED-CHANGES row (nothing fenced).

**The route.** `src/auth/internal.controller.ts` `pinResetCode` -> `AuthService.sendPinResetCode` (same shape as `data-export`: key first, body parsed by `src/mail/pin-reset-code.ts`, then the account). Answers: 200 `{ data: { sent: true } }` (the mock's exact shape), 400, 401, 404 (also for an id that is not a uuid, so it never reaches Postgres as a 500; also `deletedAt` set or `pending_deletion`), 409 (no proven address, as `provenEmail`; the Hub reads every 4xx as not sent), 503 (`MailSendError`, strict send; the Hub reads a 5xx as maybe sent). Extra body fields are ignored, as the mock does; the mail holds only the code and its life.

**One fact the task text left out.** `sendOtpCode` said "expires in 10 minutes" in its text, but the Hub's code lives 5 (`PIN_RESET_CODE_SECONDS` 300). So the mail now takes an optional `expiresInMinutes` (default 10, so sign-up mail is byte-identical) and the route passes the Hub's figure. `send()` also gained `logRecipient` so this one mail keeps the address (and the provider's error text) out of the log lines; the other mails log as before.

**Checks (wawu-id).** `npx tsc --noEmit` EXIT 0. eslint on the 5 changed files EXIT 0. jest `pin-reset-code-email.spec.ts` (new, 38 tests: 200 sends one mail with the code; 404 unknown, non-uuid, deleted, deleting; 401 no or wrong key; 400 on 19 bad bodies; 409; 503 twice; no code or address in any Logger or console line or answer, on a sent mail, a refused mail, no transport and every refusal) 38 of 38. Mutation: logging the recipient makes 2 of them fail. The six specs that touch `mail.service`, `sendOtpCode` or the internal controller (`pin-reset-code-email`, `data-export-email`, `mail.service`, `email-signup.service`, `signup-sequence.service`, `phone-signup.service`) 241 of 241. Gates `python3 scripts/gates/run.py` EXIT 0 (0 fail, 22 warn, all provisional notices on lines this change did not touch), `check_baseline.py` EXIT 0.

**Proof, real server (port 7870, database `auth09_test_e2e`, dropped; a recording stand-in for Resend on 7871; the backend mock on 7872).** The real route against the mock, 15 requests (good code, 1 minute, no key, wrong key, unknown user, not a uuid, 8 bad bodies): 15 of 15 the same status, the two 200 bodies byte-equal, every error a `message` string (the real one also carries `statusCode`). The Hub's own `NuvionOtpSender` (backend `wmt/MERGE-16` `7e85662`) against the real route: a verified account resolved and the stand-in held one mail to that address with the code and "expires in 5 minutes" and "reset your transaction PIN"; an unproven address 409, a deleting account 404, no address 409, an unknown account 404, each read by the Hub as `refused`. The real server's log held no line with the code or an address ("Email sent" only).

**Not covered / lows.** The mock has no 409, no deleted account and no upper bound on `expiresInMinutes` (the real route refuses over 60, the Hub's own cap); the Hub never sends such a body. The mock answers body-first-after-user (404 before 400); the real route checks the body first, like `data-export`. `scripts/gates/__pycache__/*.cpython-312.pyc` are tracked in wawu-id (running the gates writes `cpython-311` beside them); left alone.

## Verifier report

