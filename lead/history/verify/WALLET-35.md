# WALLET-35 verifier report, ROUND 3 (wawu-id e9386cc, mobile 66f0c25, backend 8548d0c unchanged)

Verdict: merge (nothing medium or worse). Both round 2 lows that were wawu-id's are fixed and re-tested; the deploy-order sentence is now right. One new low, one unexplained flake.

## Findings (all low)
1. A POST without the key to a SUB-PATH of the relay route now answers 401 where it was 404: `/internal/mail/send/x` and `/send/x/y` (round 2: 404). Cause: the mount is `app.use('/internal/mail/send', ...)`, which also matches sub-paths; the new `else if (req.method === 'POST')` branch at src/mail/mail-relay-body.ts:39 answers 401 for them. No leak, no memory effect, no real route is behind those paths. `/sendx`, `/send.json`, `/internal/mail` and every other route are unchanged. Fix if wanted: answer 401 only when `req.path === '/'`.
2. `npx jest src/mail --runInBand` on the branch: 1 of 44 failed on the FIRST run (cold cache, load average 17); 4 later runs 44/44. I did not capture which test. CI e9386cc is 4 of 4 green. Watch it; not reproducible.
3. Not a finding, a limit of the stand-in: two Hub sends with the same Idempotency-Key reached the Resend stand-in twice (same key forwarded to the provider, 2 mails recorded). Whether Resend collapses them is the provider's job and stays NOT RUN (as in round 2).

## Checks (stack wallet_35: Hub 8548d0c, wawu-id e9386cc built by stack.sh, Resend stand-in on 7105; baseline = wawu-id 9027aec (round 2) built in its own worktree on 7102)
- 1 `attachments: null`: 6 x null (also null + empty subject) = 400 each, 0 mails reached the stand-in; with `MAIL_RELAY_DAILY_CAP=3` the order 5 x null, 2 good, null, 1 good gave 200 200 200 then 429 MAIL_DAILY_CAP on the 4th good, and null at the cap is still 400: null takes no slot. Baseline round 2 on the same input: 500 and 1 mail recorded (bug reproduced). Absent = 200 `{id}`, `[]` = 200 `{id, attachments:0}`, 1 file 1, 2 files 2, 3 files 400; string, {}, true, 0, [null] = 400 (all as round 2). 12 MiB 200, 12 MiB + 1 byte 400, 2 x 6 MiB 200.
- 2 Keyless: 59-case matrix on both builds, 41 identical, 18 differ and all 18 are the intended 500 -> 401: no key, wrong key and empty key at 101 KB, 2 MB, 16 MiB and 17 MiB + 10, urlencoded, invalid JSON, chunked 16 MiB, trailing slash. Body is `{"statusCode":401,"message":"Invalid service key"}` (the guard's). 100 B and 99 KB were 401 already. Unchanged (identical on both builds): GET, PUT, PATCH, DELETE, HEAD (404), OPTIONS (204) on the path with and without a key; `/sendx`, `/internal/mail`, `/auth/login` and `/auth/refresh` at 200 KB (500), `/nowhere` (404 small, 500 at 200 KB), `/health` 200; with the key: 150 KB and 16 MiB reach validation (400), 17 MiB + 10 is 500, bad JSON 400. Announced 16 MiB with 10 bytes sent: 401 in 0 s (round 2: hung 10 s). Pipelined GET after a 2 MB keyless body: 2 answers, 401 then 200; a second request hidden inside a keyless body got 1 answer in total (the inner one never ran); duplicate key headers 401.
- mem.sh on PID of wawu-id e9386cc: 8 bodies of 16 MiB peak 225 MB (idle 225), 16 bodies peak 236 and 241 MB (idle 225 and 240), all 401 within 0.4 s. Baseline 9027aec: idle 181, peak 197 and 204 MB, all 500. Builder's 133 and 151 MB are a different idle; the shape (peak within 12 MB of idle) agrees.
- 3 Deploy order (tasks/WALLET-35.md on 66f0c25, Current state 1 and the round 2 and round 3 reports): "A Hub deployed before wawu-id fails every send (503) AND the old relay mails a message with no file each time" and "wawu-id first" match round 2's observed behaviour (503 plus a file-less mail on the stand-in). "An old Hub with the new wawu-id works" checked by reading 18ac5f9 email-provider.ts (accepts `response.ok && id`, extra `attachments` ignored); not run. Mobile diff d2cf62d..66f0c25 is that one file (15 added, 5 removed lines), no app code, no em-dashes.
- End to end (Hub 8548d0c to the new wawu-id to the stand-in): alice September 2026: delivery 200 masked address; POST 200; the stand-in got one mail to alice only, one attachment `statement-2026-09-01-to-2026-09-30.csv` 323 bytes, sha equal to the GET file, 3 ALICE rows and 0 BOB. bob: 175 bytes, equal to his GET file, 0 ALICE. carol (no confirmed email): 409 email_not_verified, 0 mails. Extra body field `email`: 400. Same Idempotency-Key twice: 200 both (see finding 3).
- CI: wawu-id e9386cc 4 of 4 green (build, deploy-build-in-sync, baseline, Executable gates). Mobile 66f0c25: not readable from here (no GitHub access to that repo). Backend unchanged, round 2 CI recorded below. No em-dashes in the added lines of either repo.
- Deviations: stack.sh in my worktree got three one-line passthroughs (Resend key and URL, a service key I choose, the mail cap) so I could point wawu-id at the stand-in and read no key from a process; nothing else changed. The baseline wawu-id ran by hand on 7102 with throwaway keys. Both stopped by PID; stack down; ports 7100-7107 checked; worktrees v-wallet-35-* removed.
- NOT RUN: a real Resend, an old Hub against the new relay, app screens (no app code changed), the full wawu-id suite (GitHub).

## Sweep rows (paste into SWEEP-MONEY)
- WALLET-35 R3-1 | wawu-id: a keyless POST to a sub-path of /internal/mail/send answers 401, was 404 (mail-relay-body.ts:39); match `req.path === '/'` if it matters.
- WALLET-35 R3-2 | wawu-id: one src/mail spec failed once under load on a cold cache (44/44 on 4 reruns); name it if it fails again.


---- ROUND 2 and ROUND 1 (kept) ----

# WALLET-35 verifier report, ROUND 2 (backend 8548d0c, wawu-id 9027aec, mobile d2cf62d)

Verdict: merge (nothing medium or worse). Round 1's medium and two of its lows are fixed and re-tested; five new lows go to SWEEP-MONEY.

## Round 1 items
- 1 (medium, older relay said "sent"): FIXED. Real old relay (wawu-id 7869c95 build, DTO has no `attachments`) behind the new Hub: 503 statement_email_failed, Hub log "sent 1, it took none". The old relay had already mailed a file-less message (Resend stand-in recorded 1 mail, 0 files).
- 2 (low, file over 12 MiB was a retryable 503): FIXED. 12 MiB sends, 12 MiB + 1 is the final 400, no slot used.
- 3 (low, 17 MiB parser before the key): FIXED. RSS under 16 unauthenticated 16 MiB bodies: 227 to 260 MB (round 1: 209 to 474 MB).
- 4 (G-486, no screen to confirm an email) and 5 (a failed send uses a slot, SWEEP V-5): still open, as the builder says.

## Findings (all low)
1. wawu-id `attachments: null` sends the mail and then answers 500. src/mail/mail-relay.service.ts:68-70 (`dto.attachments === undefined ? {id} : {id, attachments: dto.attachments.length}`); `@IsOptional` lets null through the DTO, so the TypeError comes after `sendRelayed`, and `release()` hands the day's cap slot back for a mail that went out. New in round 2 (round 1: null answered 200). No caller sends null (the Hub omits the key). Repro: POST /internal/mail/send with the key and `"attachments": null`; the Resend stand-in shows the mail. Fix: `dto.attachments == null`. It is a one-line change in the service that ships first, so worth taking now.
2. Judged choice: unauthenticated or wrong-key body over 100 KB now answers 500 (was 401). A 500 is acceptable to ship: every other route of this service answers 500 for a body over 100 KB (even with the key: /auth/login, /auth/refresh, /internal/mail/sendx 200 KB all 500), nothing big is read, and only a caller without the key is affected. 401 is the better answer and 413 is not reachable cheaply (src/common/http-exception.filter.ts turns every non-HttpException into 500, a change to all routes). Why not leave it: after a one-sided key rotation the Hub sees 401 for statements under ~100 KB but 500 "Internal server error" (WawuIdMailRelay marks 5xx transient, logs "WAWU ID answered 500") for larger ones, which reads as a wawu-id fault, and each one logs a stack. Fix (about 3 lines): in src/mail/mail-relay-body.ts, when the key does not match on POST /internal/mail/send, answer 401 and read no body.
3. Builder's deploy-order text is wrong on one point (tasks/WALLET-35.md, round 2 report, "Deploy order"): "A Hub deployed before wawu-id fails every send (503) instead of mailing without a file, which is safer". Observed: it fails every send AND the old relay mails a message with no file each time (the Resend stand-in recorded the mail with 0 files). The order wawu-id first is right and checks out against the code: request bytes are identical between the live 7aa55d3 and 8548d0c (only the judgement block changed), the old Hub ignores the new `attachments` answer, so "wawu-id new, Hub old" is a working state (e2e below). Fix the sentence.
4. A burst of simultaneous oversize requests: 10 in parallel gave 6 x 400 and 4 x 429 (the slot is taken before the build, given back after). Sequential: 8 x 400, none counted. Only a person sending more than 5 at once.
5. Capacity, not new: 4 parallel 12 MiB mails to wawu-id peaked at 837 MB RSS (idle 204), about 160 MB each; the Hub's limit is per person, so many people can stack them. Only the key holder can do it.

## Checks
- Odd counts, 1 file sent (compiled Hub class vs a stand-in relay, 16 answers): only 1 and 1e0 pass; absent, 0, 2, "1", null, [1], [], true, 1.5, -1, {} fail non-transient; non-numeric id, empty id, 500 with count fail (transient). 2 files: count 1 fails, 2 passes.
- No-file mail, new class vs main 18ac5f9 transpiled: 4 message shapes x 10 answers = 40 cases, 0 differences in verdict, transient flag, error text or request bytes. `git diff 18ac5f9 8548d0c` on email-provider.ts changes only the judgement block.
- Size: exact 12,582,912 bytes (40,000 rows) sent, the Resend stand-in got 12,582,912 bytes. +1 byte: 8 x 400 statement_too_large, 0 mails, and then 4 small sends 200 and the next two 429 (so 1 + 4 = the 5 a minute; oversize used none). Direct to the relay: 12 MiB 200, +1 400, +2 400, 2 x 6 MiB 200, 2 x 6 MiB + 1 400. The Hub's cap equals the relay's.
- Parser order (mem.sh on the new wawu-id): 8 bodies peak 255 MB, 16 bodies 260 MB, all 500 in under 1.5 s. No key 100 B/99 KB = 401, 101 KB = 500; with the key a 16 MiB body reaches validation (400); with the key 17 MiB + 10 = 500.
- End to end (stack `up --with id`, Hub 8548d0c, wawu-id 9027aec built from the branch, Resend stand-in via RESEND_BASE_URL): alice September, 1 mail to her own address only, attachment bytes and sha equal the GET file (3 ALICE rows, 0 BOB). Direct relay answers: absent {id}, [] {id,attachments:0}, 1 file 1, 2 files 2, 3 files 400, null 500 (finding 1), string/{}/true/[null]/0 400.
- CI: backend 8548d0c 8 of 9 green, Executable gates red with 18 FAIL lines identical to main 18ac5f9 (diffed); wawu-id 9027aec 4 of 4 green. Mobile contract/openapi.json is byte-identical to the backend branch's. No em-dashes in added lines of either repo.
- Deviation from "stack.sh only": stack.sh fixes RESEND_API_KEY empty, so for the provider stand-in I stopped the stack's wawu-id by PID and started the same dist with the same env (plus RESEND_API_KEY and RESEND_BASE_URL to 127.0.0.1:7105) by hand; the old-relay build was /home/user/wt/vid-JOIN-03r6-main (wawu-id 7869c95, read only, started the same way). Everything stopped by PID, ports 7100-7107 free, databases dropped by `down`, worktrees removed.
- NOT RUN: a real Resend (what it does with the same Idempotency-Key and a different body inside the deploy window), app screens (no app code changed in round 2), full suites (GitHub).

## Sweep rows (paste into SWEEP-MONEY)
- WALLET-35 R2-1 | wawu-id relay: `attachments: null` mails then 500, cap slot released (mail-relay-service.ts:68-70). Take with the wawu-id deploy.
- WALLET-35 R2-2 | wawu-id: body over 100 KB without the key answers 500, should be 401 (early reject in mail-relay-body.ts).
- WALLET-35 R2-3 | Builder's deploy-order sentence in tasks/WALLET-35.md is wrong (an old relay still mails a file-less message).
- WALLET-35 R2-4 | Parallel oversize requests can see 429 before their 400.
- WALLET-35 R2-5 | wawu-id: no concurrency cap on mails with files (~160 MB each).

---- ROUND 1 (kept) ----

# WALLET-35 verifier report (backend 7aa55d3, wawu-id e57429f, mobile c58f09b)

Verdict: fix (one medium).

Note on main: backend origin/main is now 18ac5f9, which is PR #136 = this backend branch (7aa55d3). So every Hub finding is also on main; none is pre-existing apart from the branch.

## Findings
1. MEDIUM. An old wawu-id (current main 7869c95) silently mails with no file and the Hub says "sent".
   - Old SendMailDto after the app's ValidationPipe (whitelist true): keys `to,subject,html,text,headers,tag`, no `attachments` (scratchpad/wallet-35-v/pipe_old.js). The old relay answers 200 {id}.
   - The Hub accepts any 200 with an `id`: src/admin/notifications/email/email-provider.ts:197 (`response.ok && id`), called from src/money/statements/statement-email.service.ts:69. It never checks that the file arrived. App then draws "Statement sent to a***@...".
   - Hub route is already on main (#136); wawu-id main has no attachments. Deploy order is the only guard.
   - Fix: wawu-id answers {id, attachments: n}; the Hub treats a missing or different n as `statement_email_failed`.
2. LOW. A statement inside the Hub's 50,000-row cap can exceed the relay's 12 MiB: 49,990 rows (100-char note, 60-char counterparty) = 12,497,605 bytes (cap 12,582,912); slightly longer names go over. wawu-id answers 400 "too large"; the Hub shows 503 "Try again in a moment", which can never succeed. Fix: size check in the Hub before sending, answer as statement_too_large.
3. LOW. wawu-id's 17 MiB parser runs before the service-key guard: src/mail/mail-relay-body.ts:14, src/main.ts:12. 8 parallel unauthenticated 16 MiB bodies took RSS 209 MB to 474 MB; 16 bodies 483 MB, 2 s of event loop; each ends 401. Was 100 kb before. Fix: a small key check ahead of the big parser.
4. LOW (lead's, recorded G-486). With no confirmed email W38 shows "Confirm your email address..." and a disabled Send, and the app has no screen to confirm. The Hub's own comment says a mobile sign-up never confirms its email by itself, so most mobile users cannot use W38 until one exists.
5. LOW. A mail that fails (503) still takes one of the 5 a minute / 30 an hour (take() runs before send): statement-email controller, `this.limiter.take`.
Not findings: same Idempotency-Key with another period answers 200 for the new period on the mock but sends nothing (mock keeps the first mail; the real relay hands the key to Resend, untestable here); the app makes a new key when the period changes (StatementScreen.tsx:162).

## Checks (stack wallet_35; Hub on mock WAWU ID, then Hub on real wawu-id)
- Destination: bob/carol (no emailVerified) POST = 409 email_not_verified, 0 mails. Extra body fields to,email,address,recipient,cc,bcc,sendTo,destination,emailAddress,toEmail,wawuUserId,accountNumber,walletId = 400 "should not exist" (11 of 11). Query extras ignored. Mail went to the token's address only (outbox). Forged tokens (emailVerified edited, alg none, email edited, garbage) = 401. No-wallet user = 409 wallet_not_open on both routes.
- Other person: alice file has 3 ALICE rows, 0 BOB; bob file 0 ALICE (real wawu-id, both confirmed).
- Period: Lagos edges in (1 Sep 00:00, 30 Sep 23:59:59.999), out (31 Aug 23:59:59.999, 1 Oct 00:00), pending and failed out. Bad inputs (pdf, no format, from>to, future, >366 d, 30 Feb, numbers, array) = 400, none counted.
- Limits: 3 GET + 4 POST in parallel = exactly 5 pass, 2 x 429 statement_rate_limited (shared). 5 POSTs then the app = 429 sentence on W38. Same key twice = one mail; parallel same key = one mail.
- wawu-id relay (31 cases, branch): 3 files 400; 2 files = 12 MiB passes, +1 byte 400; one file 12 MiB+3 400; types text/html and exe 400; names with path, CRLF, space, dot, 129 chars 400; bad base64 400; no attachments / null / [] pass. 17 MiB+ body on the route 500 (as 100 kb elsewhere); 200 KB and 2 MB on /auth/login, /auth/refresh, /internal/mail/sendx, urlencoded = still refused.
- CI: backend 7aa55d3 all green except Executable gates (16 findings, same as main per builder); wawu-id e57429f all green.
- Pictures (390 px, light and dark beside the artboard): scratchpad/wallet-35-v/pics/cmp-w38-dark.png, cmp-w38-light.png, cmp-w35-toast-dark.png, cmp-extra.png (no-email light, dark, toast light), w35-toast-rl-dark.png (429), cmp-v9.png (calendar, real 503). Only differences are the recorded decisions 1, 2, 4; "3 months" = 1 Aug to 16 Oct is right for 16 Oct.
- V9: signed in through the real login in the UI (POST wawu-id /auth/login 200), delivery 200 with the masked address, send 503 on the real relay (no mail key here). NOT RUN: a real delivered mail, V10 device.
- No em-dashes in new user-facing strings.
