---
id: FIX-08
title: A request body over the size limit answers 413, not 500
owner: YOU
area: FIX
order: 189
priority: launch
repo: wawu-backend
type: setup
status: done
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-08 · A request body over the size limit answers 413, not 500

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- wawu-backend's global exception filter (`AllExceptionsFilter`) and the body parser config in `src/main.ts`

## Goal

A body over 100 kB answers 500 on every route, because the global exception filter turns the body parser's `PayloadTooLargeError` into a 500. Seen by the SCHOOLS-02 and LEGAL-01 verifiers. It is the caller's error: 413, with the same error shape as other 4xx answers.

## Scope

Map the body parser's size error (and its other client errors: bad JSON, bad encoding) to their 4xx status in the filter. The limit itself does not change. Every route's other answers stay the same.

## Capability checks

- [x] A 101 kB JSON body answers 413 on a public route, a signed-in route and an admin route.
- [x] Malformed JSON answers 400, as it does today (say what it does today first).
- [x] Protected routes 253/253.

## Builder report

Builder, 8 Oct 2026. Backend `wmt/FIX-08` at e91094d, from main 3041887; mobile `wmt/FIX-08` from main 4faa136 (neither main moved during the build). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bf08/` (`bf08/` below). No Fintava, Flutterwave, WAWU ID, AI provider or `wawuafrica.com` call: the live probes ran in a private network namespace with only Postgres relayed in.

- **Today's answers, recorded first** (`bf08/probe-driver.js`, `bf08/probe-before.json`). The built main Hub (`node dist/src/main.js`, as production starts it) on a fresh migrated and seeded `f08_test_probe`, called on five routes: public `POST /admin/auth/login`, signed-in `PATCH /users/me` with a real RS256 token checked by the real strategy, admin `POST /admin/content/:id/reject` with a real admin login, the raw-body webhook `POST /webhooks/fintava`, and a path no route serves. 16 bodies each (80 calls). **500 "Something went wrong" (50 of 80, each logged as a server error):** a 101 kB JSON body, 100 kB plus 1 byte, `charset=latin1` or an unknown charset, `Content-Encoding: bogus`, a gzip body that is not gzip, a small gzip that inflates past 100 kB, a 101 kB form, a form with 1,001 fields, a form nested 40 deep. **400 already:** malformed JSON (`{"a":`) answers `400 "Unexpected end of JSON input"` and a bare JSON string `400` with the parser's message: Nest turns body-parser's SyntaxError into a BadRequestException before the filter. **The route decides:** an empty body with `Content-Type: application/json` (and `Content-Length: 0`) parses as `{}`, so the route answers (400 validation on the login, admin and experience routes, 200 on `PATCH /users/me`, 400 "Webhook body must be JSON." on the webhook). Exactly 100 kB reaches the route (400 "property pad should not exist").
- **Fix** (`src/common/filters/all-exceptions.filter.ts`, fenced; this task names it). The body parser's refusals are `http-errors` errors (status and statusCode equal, `expose` true on a 4xx). The filter now answers those with status 400, 413 or 415 in the usual envelope `{ statusCode, message, data: null }`, with a plain sentence by body-parser's `type` (413 "That request is too large.", 413 "That request has too many fields.", 415 "That request uses a character set this server does not read. Send it as UTF-8.", 415 "That request uses a content encoding this server does not read.", 400 "That request could not be read."), never the parser's own text (it echoes the caller's headers). Not logged, as no other 4xx is. Everything else is answered exactly as before: HttpExceptions (malformed JSON's 400 included), Prisma's 409 and 404, any other status or a non-`expose` error (500). The 100 kB limit, `main.ts` and the parsers are untouched.
- **After** (`bf08/probe-after.json`, same driver, branch build): the 50 former 500s are now 413 (25), 415 (15) or 400 (10); 0 answers are 500; the other 30 answers are byte-identical to before (both 400s for malformed JSON, every empty-body answer, the 100 kB answers); the app logged 0 errors (50 before).
- **Webhook that reads the raw body, unchanged** (`webhook` in both probe files): a signed Fintava delivery 200 `recorded`, the replay 200 `duplicate`, a forged signature 401, one row, its stored `rawBody` byte-identical to what was sent and its `payload` equal to the parsed body; same before and after. `fintava-webhook.contract.spec.ts` and `fintava-webhook-units.spec.ts` unchanged, 41 of 41.
- **Specs** (backend). `src/common/filters/tests/all-exceptions-body-parser.spec.ts`, 23 tests on the filter alone: each refusal's status and exact envelope, nothing logged, the parser text never sent; and what must not change (non-`expose`, mismatched statusCode, 403, 404, 429, 500 stream errors, a plain object, a plain Error, Nest's malformed-JSON 400, a route's own 413, Prisma P2002). `src/common/filters/tests/body-parser-refusals.contract.spec.ts`, 48 tests on the FULL AppModule composed as `main.ts` composes it (HUB_APP_OPTIONS, Express settings, helmet, compression, cookie-parser, pipe, filter, interceptor; throttler lifted; local JWKS stand-in so the signed-in token is checked by the real strategy; admin token from the real login): on each of the five routes a 101 kB body 413; 100 kB reaches the route and 100 kB plus 1 is 413; malformed JSON 400 with JSON.parse's own message; latin1 and unknown charset 415; bogus encoding 415; broken gzip 400; gzip inflating past the limit 413; form 101 kB 413, 1,001 fields 413, too deep 400; empty JSON body left to the route; no refusal logged; and `main.ts` still creates the app with HUB_APP_OPTIONS and this filter and sets no parser or limit of its own. On main's filter 46 of the 71 fail (mutant M0).
- **Mutants: 8 of 8 killed** (`bf08/mutants.py`, `bf08/mutants.out`; each applied, both specs run, then `git restore`): M0 the fix removed (46 fail), M1 `expose` check dropped (1), M2 any 4xx mapped (3), M3 status forced to 400 (36), M4 charset sentence lost (6), M5 refusals logged as errors (2), M6 statusCode agreement dropped (1), M7 parser text sent (45).
- **Checks.** `npx tsc --noEmit` 0; eslint on the three changed files 0. Full suite in a private network namespace (`bf08/ns.sh`, `bf08/inner-full.sh`, copied from `t3ns`; fresh migrated and seeded `f08_test_full`, own stand-in on :4001 there, `bf08/port4001.txt`): 4,714 tests, 4,699 passed, 4 skipped (as on main), 11 failed, all in `hub-rate-limits.contract.spec.ts` ("needs a non-loopback IPv4 interface", which the namespace lacks); that file on the host network: 22 of 22 (`bf08/rate-limits-host.log`). Protected route suite `run.sh --fresh HEAD`, in the namespace on `f08_test_protected`: **253/253, all 244 required**, code e91094d against the lock at origin/main 3041887; the lock is not touched (`git diff origin/main --stat` lists only the three files above). Gates: 16 fail, 58 warn, as main, the same lines (`bf08/gates-before.txt`, `bf08/gates-after.txt`); no new PROVISIONAL. CI tripwire: 0 added lines match. `npm run contract:build`: `contract/openapi.json` unchanged and byte-identical to mobile's synced copy, so no API sync. No em-dash added to anything a user reads. Staged-diff key scan: nothing key-shaped. Mobile `npm run check` exit 0 (76 suites, 1,377 tests; gates 0 fail, 0 warn on 346 files; 222 tasks).
- **Shared changes.** KYC-02 #3 and ME-16 #3 asked for exactly this; both marked made by FIX-08, with the three differences from KYC-02 #3's wording (415 also mapped; only 400, 413, 415; malformed JSON keeps its 400 and message, per this task).
- **Decisions (Default (agent), owner may override).** (1) The five sentences above are new copy, not drawn anywhere; written in the Hub's tone, listed here for the owner to read. (2) No `reason` object on these refusals, money routes included: the parser refuses before any route runs, so there is no route to name a code for; the app sees a 413, 415 or 400 with a plain `message`. (3) Not logged: they are the caller's mistake, like every other 4xx; before, each was an error line with a stack. (4) Only 400, 413 and 415 are mapped; a 403 `entity.verify.failed` stays a 500 (Nest's raw-body hook never throws, so it cannot happen). (5) Fintava now gets 413, not 500, for a delivery over 100 kB; neither was ever recorded, and Fintava resends any refused delivery either way. (6) `profile-works.contract.spec.ts` (ME-16) and `selfie-match.contract.spec.ts` (KYC-02, money code, frozen) still accept 413 or 500; they pass and are left to their owners to tighten to 413.
- **Cleanup.** Probe Hubs and stand-ins stopped by their own PIDs (the driver kills its child; the namespace ends with it); no port left open; `f08_test_probe`, `f08_test_spec`, `f08_test_full`, `f08_test_protected` dropped; the stand-in's generated key removed.
- **NOT RUN.** The fix on the production Hub (unblocked by a deploy of this branch: then `curl -X POST https://<hub>/api/hub/admin/auth/login -H 'content-type: application/json' --data-binary @101kB.json` answers 413).
- **Note.** In production nginx sits in front with `client_max_body_size 25m` (`deploy/install-services.sh`), so a body from 100 kB to 25 MB reaches the Hub and gets this envelope; above 25 MB nginx answers its own 413 page first, as before.

## Verifier report

Verifier, 8 Oct 2026. Independent session; wrote none of this task's code. Checked backend `wmt/FIX-08` @ e91094d (from main 3041887; neither moved during the check, fetched at start and end) and mobile `wmt/FIX-08` @ c11c77f (main 4faa136). Own detached worktrees `vf08b` (branch), `vf08main` (main), `vf08t` (trial merge of e91094d into origin/main, merge commit 6f0a0e1, local only, deleted), `vf08m` (mobile). Backend `npm ci` in `vf08b` and `vf08main`; `vf08t` hard-linked from `vf08b` (same `package-lock.json`; Prisma generates into `generated/`, not `node_modules`) and `vf08m` from the mobile checkout, because the disk was at 3.7 GB free after two installs. Every live run was in a private network namespace with only Postgres relayed in (ports 5531 to 5534 inside it; 4001 only inside the full-suite namespace), so no call could leave the machine; a tripwire stand-in on 5534 took every Fintava, Cardex and WellaHealth base URL and recorded 1 call per run, the deliberate WellaHealth one below, no Fintava call. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vf08/` (`vf08/` below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npx tsc --noEmit` 0 (no output). eslint without `--fix` on the 3 changed files: 0 problems. Gates `scripts/gates/run.py`: 16 fail, 58 warn, 76 accepted on branch and main, every FAIL line identical and the whole output identical except files scanned (887 vs 885, the two new specs); no PROVISIONAL added (`vf08/gates-vf08b.txt`, `gates-vf08main.txt`). Tripwire: 0 added lines match. No em-dash added. `npm run contract:build`: `contract/openapi.json` unchanged, byte-identical to mobile's synced copy, `git status` clean (`vf08/contract-build-b.log`). Mobile `npm run check` on c11c77f exit 0: 76 suites, 1,377 tests, gates 0 fail 0 warn on 346 files, 222 tasks (`vf08/m-check-before.log`). Diff matches the builder's list: backend 3 files (+762, -1), mobile 4 (task file, SHARED-CHANGES rows KYC-02 #3 and ME-16 #3, LOG line, generated PROGRESS). |
| V2 Sweep and specs | passed | 301 calls per build, built Hub (`node dist/src/main.js`) of main then of the branch, same migrated and seeded `vf08_test_sweep`, same request bytes (`vf08/sweep.js`, `sweep/sweep-main.json`, `sweep/sweep-branch.json`, `sweep/compare.json`, `sweep/matrix.md`). 175 answers changed, every one a former 500 now a 4xx (87 to 413, 55 to 415, 33 to 400); 125 identical byte for byte (status, every header but Date, body), 8 of them after blanking `iat` and `exp`, which `GET /users/me` echoes from each run's own token; 1 is a client artifact (below). 0 other differences. Error log lines: main 177, branch 2 (both real server faults). The two specs read below. |
| V3 Regression | passed | Protected suite `run.sh --fresh HEAD` on the trial merge, in a namespace on `vf08_test_protected`: code 6f0a0e1 against the lock at origin/main 3041887, 253 of 253, "all 244 required tests passed" (`vf08/protected.log`). Full contract suite on the trial merge in a namespace (copied from `t3ns`; own mock on :4001 there, `vf08/port4001.txt`), fresh `vf08_test_full`: 182 suites, 4,714 tests, 4,681 passed, 4 skipped, 29 failed (`vf08/full.json`): 11 in `hub-rate-limits.contract.spec.ts` (needs a non-loopback interface; on the host network alone 22 of 22, `vf08/rate-limits-host.txt`) and 18 in `fintava-stall.spec.ts` ("times out on time", 1,041 ms against < 1,000, load average about 7 from other sessions; alone in a namespace 120 of 120, twice, `vf08/stall-alone-1.txt`, `-2.txt`). The two FIX-08 specs: 48 of 48 and 23 of 23 in that run. |
| Mutants | 10 of 12 killed, 2 survive (one equivalent, one test gap T1) | `vf08/mutants.py`, `mutants.out`, `mutants.json`; each applied to the filter, both specs run in a namespace, the original copied back, `git diff --quiet` checked after each (clean every time). Baseline 71 of 71. V0 main's filter: 46 fail (the builder's M0 figure holds). V2 403 mapped too: 1. V3 `expose` OR statusCode agreement: 2. V4 charset and encoding sentences swapped: 12. V5 typeless refusal sends the parser or zlib text: 15. V6 refusals gain a `reason` key: 44. V8 a string `type` required (typeless zlib 400 stays 500): 8. V9 refusals logged as warnings: 1. V10 400 dropped from the set: 15. V11 HTTP status 400 while the body says 413 or 415: 36. Survivors: V1 (the `instanceof Error` guard inside `bodyParserRefusal` replaced by an object check) is equivalent: the filter only calls it inside `else if (exception instanceof Error)`. V7 (each refusal logged at info level with `logger.log`) passes both specs: T1. |

### Before and after (11 routes, 27 bodies, plus 4 baselines)

Routes: public `POST /admin/auth/login`; signed-in `POST /users/me/experience` (real RS256 token, real strategy, local JWKS); signed-in `GET /users/me` with a body; admin `POST /admin/content/:id/reject` (real admin login); raw-body webhook `POST /webhooks/fintava` signed over each body and unsigned; `POST /webhooks/flutterwave` with a wrong hash; money `POST /money/pin` signed in (wallet gate, no Fintava call) and without a token; an unknown path under `/api/hub` and one outside the prefix.

| Body | main | branch | branch sentence |
|------|------|--------|-----------------|
| JSON 101 kB, 100 kB + 1 B, 5 MB, 101 kB chunked | 500 on all 11 routes | 413 on all 11 | That request is too large. |
| gzip bomb and deflate bomb (10 MB inflated) | 500 | 413 | That request is too large. |
| form 101 kB | 500 | 413 | That request is too large. |
| form 1,001 fields | 500 | 413 | That request has too many fields. |
| `charset=latin1`, `klingon`, `utf-99` (JSON), `charset=latin1` (form) | 500 | 415 | That request uses a character set this server does not read. Send it as UTF-8. |
| `Content-Encoding: bogus` | 500 | 415 | That request uses a content encoding this server does not read. |
| gzip that is not gzip, br that is not brotli, form nested 40 deep | 500 | 400 | That request could not be read. |
| JSON exactly 100 kB (102,400 B), form 1,000 fields | route answers (400 validation, 200, 401, 409 `wallet_not_open` with `reason`, 404) | identical | |
| malformed JSON `{"a":`, a bare JSON string, `charset=utf-16` | 400 with JSON.parse's message | identical | |
| empty JSON body (Content-Length 0), JSON type with no body, valid small gzip | route answers | identical | |
| text/plain, multipart and `application/vnd.api+json`, 101 kB each (no parser takes them) | route answers | identical | |
| validation 400; `GET` unknown path 404; bad percent-encoding in a path param 400 | as shown | identical | |
| real server fault: `GET /care/plans`, upstream answers 200 HTML, the route's `JSON.parse` throws | 500, logged | 500, logged | |

- **Envelope.** A refusal is `{"statusCode":413,"message":"...","data":null}`, the same three keys in the same order as the validation 400 beside it, `application/json; charset=utf-8`, with the same helmet and CORS headers. The only header difference from a validation 400 is that a refusal has no `x-ratelimit-*` headers, because the parser refuses before the throttler guard runs; main's 500s had none either, so nothing changed there. No em-dash, no parser text (0 of 175 changed answers contain `entity`, `unsupported`, `incorrect header`, `depth`, `parameters`, a charset or the encoding name), no stack.
- **Multipart route.** None exists: no multer, `FileInterceptor` or `multipart` in `src`; uploads go to S3 by presigned URL. A 101 kB multipart body reaches the route with an empty body on both builds.
- **The client artifact.** Node's client sends a `GET` body with neither Content-Length nor chunked framing, so the server reads the bytes as a second, malformed request. That is a race between Node's own bare 400 and a reset, on either build (re-probe, 5 tries each: main 4 resets and 1 bare 400, branch 5 resets; `sweep/reprobe-*.json`). The same `GET` correctly framed as chunked: main 500, branch 413, 5 of 5.
- **Webhooks** (`webhook` in both sweep files). Fintava signed delivery 200 `recorded`; replay 200 `duplicate`; forged signature 401 "Webhook signature rejected."; the same delivery gzip-compressed, signed over the plain bytes, 200 `duplicate`; 1 row; stored `rawBody` byte-equal to what was sent; `payload` equal to the parsed body. Identical on main and branch. Flutterwave's wrong hash 401 is unchanged.
- **Logging.** Main logged 177 error lines with stacks: one per parser refusal (175) and the two real faults. The branch logged 0 for the 175 refusals and the same 2 for the real faults (the WellaHealth SyntaxError 500 and the item O2 below), so real 500s are still logged.

### Classification: what counts as a parser refusal

`bodyParserRefusal` accepts an `Error` whose `status` is a number equal to `statusCode`, whose `expose` is `true`, and whose status is 400, 413 or 415. `type` only picks the sentence. The check is structural: it does not ask where the error came from. I searched for any other source of that shape (`vf08/classify.js`, `classify.json`: real errors fed to both compiled filters).
- In the dependency tree, only `http-errors` sets `expose`, and only body-parser, raw-body, send and express depend on it. Nothing in `src` imports `http-errors`, `raw-body`, `body-parser`, `send` or serve-static, and no route calls `res.sendFile`, `res.download` or `res.format`. raw-body runs only inside body-parser. Today nothing but the parser can produce a matching error.
- Errors that stay as they were on the branch: raw-body `stream.not.readable` and `stream.encoding.set` (500, not exposed); Express `res.format` 406; the router's `URIError` (status 400 but no statusCode or expose, and Nest turns it into a 400 before the filter anyway); axios-like and AWS-SDK-like errors; an undici `fetch failed`; a SyntaxError thrown inside a route. All 500 and logged on both builds.
- Errors that would now answer as refusals if they ever reached the filter: a raw-body `entity.too.large` from reading an upstream stream, a `send` 400 (bad path), any `http-errors` 400 or 415 thrown inside a route, a verify hook throwing its own 400, and `request.aborted` or a socket error that body-parser wraps as 400. Only the last can happen today, and it is the caller's side (the caller hung up, so nobody reads the answer). Observation O1 below.
- **Decision 4 (`entity.verify.failed`).** The only trigger is body-parser's `verify` option throwing. Nest's hook (`@nestjs/platform-express` `get-body-parser-options.util.js`, `rawBodyParser`) only stores the buffer and returns true, so it cannot throw. Through the real body-parser with a throwing `verify`, the 403 error is answered 500 and logged, on main and on the branch. 500 is right: the only verify hook here is the server's own code, so a throw there is a server bug, not the caller's.

### The builder's two specs

- `all-exceptions-body-parser.spec.ts` (23): does what it says. The errors are built in the http-errors shape by hand, not by `http-errors` itself, but the shapes match what the library builds (checked in `classify.json`). The "nothing logged" test watches `error` and `warn` only (T1).
- `body-parser-refusals.contract.spec.ts` (48): the real parser through the full AppModule on a real port, on 5 routes. It does what it claims, with one exception: it says the app is "composed as src/main.ts composes it" but leaves out `app.enableCors(...)`. That does not touch the parser path (my sweep sent an Origin, and the CORS headers are on every refusal), so this is a nit, not a defect. On the webhook and the unknown path, the exactly-100 kB case asserts only "not 413 and below 500"; my sweep pins those answers (200 `recorded` when signed, 401 unsigned, 404).
- Both pass alone and in the full suite. The builder's figures hold: 46 of 71 fail on main's filter.

### Capability checks, as written

- A 101 kB JSON body answers 413 on a public, a signed-in and an admin route: **passed** (also on 8 other routes, and for 100 kB + 1, 5 MB, chunked and both bombs).
- Malformed JSON answers 400, as it does today: **passed**. Today, main answers `400 "Unexpected end of JSON input"`, not logged, and the branch answers the same bytes.
- Protected routes 253/253: **passed** (V3).

### Findings

No defect is open.
- **T1, test gap (not a defect).** Decision 3 says refusals are "not logged". Both specs only check that nothing is logged at error or warn, so a refusal logged at info level (mutant V7) passes. A spy on `Logger.prototype.log` and `debug` in the "no refusal is logged" tests would pin the decision.
- **U1, unclear (owner).** `docs/contract/CONVENTIONS.md` section 3 says money routes "always fill `reason`" and that a 400 without `reason` is the ValidationPipe. On a money route, a parser refusal (400, 413 or 415) now has no `reason` (decision 2, owner may override). Main's 500 had none either, and the app copes: `toApiError` gives no code, and 413 and 415 map to kind `unknown` with the server's sentence. Either the doc gains a line ("a body the parser refuses is 400, 413 or 415 without `reason`, before any route runs"), or the owner wants a code such as `body_too_large` on money routes.
- **O1, observation (no change needed now).** The refusal test is structural, not by origin. Nothing but the parser matches it today (above). A future route that reads a provider's stream with raw-body, or serves files with `res.sendFile`, would have that library's 413 or 400 answered as "That request is too large." or "That request could not be read." and not logged. Whoever adds such a caller should catch its errors in the route. Tying the check to body-parser's own `type` values would not be enough on its own, because a broken gzip stream reaches the filter as a 400 with no `type`.
- **O2, out of scope, pre-existing on main (OPS-11).** When the socket is already gone before anything reads `req.ip`, `hubTrustProxy` calls `isLoopbackAddress(undefined)` and throws `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`, logged as a 500 (reproduce: a `GET` with an unframed body, `sweep/reprobe-*.json`, 5 of 5 on both builds). Nobody receives the answer. Worth a guard in `src/hub-app-options.ts` in its own task; FIX-08 does not touch it.

### NOT RUN

- The fix on the production Hub. Unblocked by a deploy of this branch; then `curl -X POST https://<hub>/api/hub/admin/auth/login -H 'content-type: application/json' --data-binary @101kB.json` answers 413 "That request is too large." Behind nginx a body over 25 MB still gets nginx's own 413 page (`deploy/install-services.sh`, `client_max_body_size 25m`).
- The full contract suite on main for a side-by-side failure count. Not asked (the brief asks for the trial merge); the two failing files are explained above and pass alone.

Cleanup: every server, relay and stand-in ran under the namespace scripts and ended with them (`ps` shows none left); `vf08_test_sweep`, `vf08_test_spec`, `vf08_test_protected` and `vf08_test_full` dropped; backend worktrees `vf08b`, `vf08main` and `vf08t` removed (so the trial merge 6f0a0e1 was never pushed); `vf08m` removed after this push. Staged-diff key scan: nothing key-shaped.

## Lead merge note (8 Oct 2026)

Merged after the independent verifier (report 862e8e6) and backend PR #84 (merge f7e651a): 175 former 500s now answer 413, 415 or 400; 125 other answers byte-identical; protected suite 253/253; webhooks unchanged. The lead added one line to the backend's docs/contract/CONVENTIONS.md section 3 (a parser refusal carries no reason, money routes too), closing the verifier's U1. Follow-ups, not defects: T1 (a refusal logged at info level passes the specs) and O2 (pre-existing on main: hubTrustProxy throws isLoopbackAddress(undefined) when the socket is already gone, logged as a 500).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
