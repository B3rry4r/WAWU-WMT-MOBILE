---
id: FIX-08
title: A request body over the size limit answers 413, not 500
owner: YOU
area: FIX
order: 188
priority: launch
repo: wawu-backend
type: setup
status: verifying
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

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
