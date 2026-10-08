---
id: FIX-11
title: The legal thread's opener is written once, metered and locked
owner: YOU
area: FIX
order: 192
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [LEGAL-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-11 · The legal thread's opener is written once, metered and locked

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/LEGAL-01.md` (round 5 verifier: Finding 1)

## Goal

`getThread` writes the assistant's opener with an AI call that is neither metered nor locked: 20 parallel reads of an empty paid thread made 19 AI calls (main 11). Reading a thread must never multiply paid AI calls.

## Scope

The opener is written at most once per thread under a lock (or written at creation), and its AI call is metered like every other. Parallel reads see one opener. No change to the thread's other answers.

## Capability checks

- [ ] 20 parallel reads of an empty thread make exactly 1 AI call (stand the AI client in at its seam; never a real provider).
- [ ] The opener's call is metered like the others.
- [ ] Protected routes 253/253.

## Builder report

Builder, 8 Oct 2026. wawu-backend `wmt/FIX-11` `096e30c` (from `origin/main` `965280e`, which has not moved); mobile `wmt/FIX-11` (from `origin/main` `f6e92e4`, then `1219790` merged). Lead-owned fix. Stand-in AI only (`GEMINI_CLIENT` overridden in every spec; no provider, no live host). Scratch: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bf11/`.

**Reproduced on main first.** Pristine `965280e`, a scratch spec (never committed) over real HTTP, stand-in provider answering after 150 ms: 20 parallel `GET /legal/intake/chat/{id}` on an empty paid thread made **20 AI calls and stored 20 openers, 3 runs of 3**; with the provider failing, 15 sequential reads made 15 calls and 20 parallel reads 20 calls; none was counted anywhere (`repro/repro-main.log`).

**Built.** The opener's AI call is CLAIMED before it is made. `LegalAssistantAllowance.reserveOpener` takes the person's advisory lock (the one every thread line is written under) and, in one transaction: if the thread has a line, nothing to do; if another opener call for the thread is running and its claim has not lapsed, this read waits; otherwise it runs the same `checkLimits` every assistant call goes through and writes a `LegalChatOpenerCall` row, which is both the claim and the meter. Only the claim's holder calls the provider (outside any transaction, as before, with the same instruction and the same one opening request). `finishOpener` then, under the same lock, stores the opener only if the thread is still empty and records the outcome (`written`, `failed`, `superseded`) in the same transaction; a partial unique index keeps one `written` row per thread. A read that lost the claim polls (50 ms) until the thread has a line or the call has ended, at most 20 s, and never calls the provider itself. Every attempt counts toward the person's 30-an-hour allowance (`checkLimits` now counts these rows beside messages and `LegalAssistantCall`s), and at most 5 opener attempts an hour are made (PROVISIONAL below). Over a limit, the read answers 200 with the thread as it is and makes no call. No route, DTO, response shape or contract changes.

**Files (backend).** `src/legal-intake/legal-chat.service.ts` (`getThread`, `openThread`, new `waitForOpener`, `linesOf`), `src/legal-intake/assistant/legal-assistant-allowance.ts` (`reserveOpener`, `finishOpener`, `openerRunning`, the opener rows in `checkLimits`), `src/legal-intake/assistant/legal-assistant-config.ts` (`ASSISTANT_OPENER_ATTEMPTS_PER_HOUR`), `prisma/schema.prisma` and migration `20261015200000_legal_chat_opener` (one new table, additive; SHARED-CHANGES `FIX-11 #1`), `src/account-purge/account-data-map.ts` (OWNED), `src/data-export-request/data-export-sections.ts` (excluded with a reason, as `LegalAssistantCall`), new spec `src/legal-intake/tests/legal-chat-opener.contract.spec.ts` (17 tests). **Mobile:** this file, `SHARED-CHANGES.md`, `docs/LOG.md`, generated files.

**Capability checks.**
- 20 parallel reads of an empty thread make exactly 1 AI call: spec, over real HTTP, 150 ms stand-in, 3 fresh threads in a row: 20 x 200, 1 call, 1 stored line, all 20 responses show that same line (same id), one claim row `written`. Also 100 parallel reads split across TWO Hub instances (own Prisma pools, one database), 300 ms stand-in: 100 x 200, 1 call, one opener seen by all. A failing provider: 20 parallel reads make 1 call (main: 20).
- The opener's call is metered like the others: spec. With 29 of the hour's 30 already spent, the read opens (the 30th spend, a `LegalChatOpenerCall` row for the person) and the client's next message is `429 assistant_rate_limited` with a numeric `retryAfterSeconds` (main: 201, the opener was free). With all 30 spent, 20 parallel reads make 0 calls, write no claim and answer the empty thread; once the allowance frees, the next read opens. With the provider failing, each later read is one more counted call, stopping at 5 (11 reads, 5 calls), and the client can still write and be answered.
- Protected routes: `DATABASE_URL=<f11_protected_test> bash scripts/protected-routes/run.sh --fresh HEAD` (code `096e30c`, lock `origin/main` `965280e`): **253/253, all 244 required**. None of the thread routes is in the registry (`GET`/`POST /legal/intake/chat/{requestId}` are the web's, `/legal/ops/intakes/chat/{requestId}` the dashboard's, `/legal/assistant/*` the app's); the 22 protected `/legal/*` entries pass.
- What else the spec holds: a consultant (`sendAsConsultant`, under the lock) or a client message landing while the opener call is in flight keeps its place, the opener is not stored after it (`superseded`, still counted; main appends it after); a claim left by a Hub that died holds reads for its lapse (700 ms in the spec) and the next read opens; an already lapsed claim holds nothing; the database refuses a second `written` row (P2002); unchanged: a thread not yet open makes no call, someone else's is 403 with no call, the consultant's read never opens, a message after the opener is answered with the opener in its history. Run once by hand, not in the suite (it takes 20 s): a claim live for 40 s, the read answers 200 empty after 20,135 ms with 0 calls (`adhoc-wait.log`).

**Spec against main's product code** (the two product files from `965280e`, this branch's schema): **10 fail, 7 pass** (the 7 are the unchanged behaviour, the request text and the database index); on this branch **17/17 on 7 runs** (`opener-on-main-code.log`, `opener-*.log`, `seed-run.log`). On a freshly migrated and seeded database the spec leaves all 128 tables identical in row count and md5 of every row (`seed-before.txt`, `seed-after.txt`).

**Mutants** (each applied, the opener spec run, `git restore`; `git status` clean after each): **7 of 7 killed.** M1 no running-claim check (4 tests fail); M2 opener rows not counted in the hour (1); M3 opener stored though the thread gained a line (2); M4 a losing read does not wait (3); M5 no opener-attempt cap (1); M6 the claim taken without the person's lock (3); M7 (database) the partial unique index dropped (1), then recreated. `mutants.py`, `mutants.out`, `mut-M*.log`.

**Checks.** `npx tsc --noEmit` 0. eslint 0 on the 6 changed `.ts` files. `src/legal-intake src/account-purge src/data-export-request`: 9 suites, **149 passed, 3 skipped** (the form spec's real-Gemini cases), 0 failed, including LEGAL-01's 59 concurrency tests, with a test-only `ADMIN_JWT_SECRET` and the mock's service key set (without `ADMIN_JWT_SECRET` the 14 `data-export.contract.spec.ts` failures LEGAL-01 round 5 saw come back: the export link cannot be signed, so nothing is emailed; environment, not code). `src/legal`: 2 suites, 40/40. Gates: **16 fail, 59 warn** on 890 files; `origin/main` 16 fail, 58 warn on 889; the 17 FAIL lines identical (diffed); the one new warn is `PROVISIONAL(LEGAL-OPENER-ATTEMPTS-PER-HOUR)`. Tripwire on every added line: empty. Secret scan of the staged diff (long hex or base64 runs, `sk_`, `FLWSECK`, bearer tokens, key headers): none. No em-dash in an added line. `npm run contract:build`: `contract/openapi.json` unchanged (sha1 `d58e5994...`), byte-identical to mobile's, so no `npm run api`. `prisma migrate diff` after deploying: only main's own `DROP INDEX "ContentPiece_specializations_idx"`. Migration stamp sorts after every folder on main and on every `origin/wmt/*` branch (newest `20261015100000_professional_takedown`, `wmt/FIX-06`). Mobile `npm run check` (after merging main `1219790`): **exit 0** (tsc 0, lint 0, 76 suites / 1,377 tests, gates 9 run, 346 files, 0 fail, 224 tasks).

**Decisions** (Default (agent), owner may override):
1. The claim and the meter are a new table, not `LegalAssistantCall`: that table's `legalIntakeId` is required, and a matter made through `POST /legal/requests` has no intake. Not written at payment either: that is the payment verify path, and the opener would then depend on it.
2. A read that finds the claim held waits for the opener (polling every 50 ms, at most 20 s, the same wait a lost brief claim gets) instead of answering empty, so parallel reads all see it; a waiting read never calls the provider, so a failing provider is not called once per read.
3. At most 5 opener attempts a person an hour, `PROVISIONAL(LEGAL-OPENER-ATTEMPTS-PER-HOUR)`, the same number and reason as the brief's attempts: a screen that keeps reading while the provider is down cannot spend the client's whole 30-an-hour allowance. Every attempt, failed ones too, also counts toward the 30.
4. Over the allowance or the cap, the read answers 200 with the thread as it is, as a failed opener always has. A read is never a 429.
5. An opener whose answer returns after the thread gained a line (the client wrote first, or a consultant joined) is not stored (`superseded`) and stays counted; main appended it after that line.
6. The claim lapses after `ASSISTANT_CLAIM_MS` (60 s), the existing claim time, so a Hub that dies mid-call frees the thread by itself.

**Answers that change** (all on unprotected routes, all the point of the task): parallel reads of an empty open thread share one opener; an opener call now counts toward the hour, so a client whose thread was just opened reaches 429 one message sooner; over the allowance a read no longer writes an opener; an opener never lands after another line.

**NOT RUN.** The full backend suite: the private network namespace (`unshare -n`, the `t3ns` scripts) was refused by this session's permission check, and on the host three specs (`notification`, `saved-item`, `blocked-account`) would start a mock on :4001; unblocked by the lead's namespace run. A real model: unblocked by a non-production `GEMINI_API_KEY` in a local `.env`. Clock skew between Hubs on different machines (the claim's expiry is compared with each Hub's clock): unblocked by two Hubs whose clocks differ by seconds. The web's behaviour while a read waits up to 20 s: unblocked by the web calling `GET /legal/intake/chat/{id}` while another read holds the claim. V9 against the droplet: unblocked once merged and deployed.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
