---
id: KYC-02
title: Selfie match to the BVN photo
owner: YOU
area: KYC
order: 76
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [KYC-01]
decisions: [R-6]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# KYC-02 · Selfie match to the BVN photo

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A6, A7, A16: a selfie must match the BVN photo.

## Scope

Fintava's face match (`/compliance/verify/bvn/selfie`) through the backend's Fintava client (MONEY-06),
retries limited to 3 a day per user because each attempt costs WAWU even when it fails (`docs/fintava/fees.md`),
result stored.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /compliance/verify/bvn/selfie` (base64 image and BVN) is a face match. Fintava offers no liveness check, so nothing claims one: the selfie is captured and matched, and nothing on A6, A7 or A16 says or suggests a liveness check (BRIEF A6).

## Capability checks

- [ ] A matching selfie passes; a selfie of a different person fails the match; three failures show A16 and the retry rule.

## Builder report

Backend `wmt/KYC-02` `60dfe3f` (on main `d27ad37`); mobile `wmt/KYC-02`.
- **Backend:** `src/money/identity/` (`selfie-match.service.ts`, controller routes, `SelfieMatchDto`, `SelfieMatchView`, 2 new specs, 1 extended), migration `20261002210000_selfie_match` (`SelfieMatchAttempt`, OWNED in the purge map), 3 money codes, MONEY-06 client (`verifyBvnSelfie` typed `{ matched, confidence }`, base64 runs masked in logged messages), CONVENTIONS section 8, WALLET.md, `.env.example`, deploy README. KYC-01 reused, not copied: its limiter is now the shared `reserveDailyAttempt`; `matchesCheckedIdentity(user, bvn, null)` compares the BVN alone.
- **Routes:** `POST /money/identity/selfie` `{ bvn, image }`, `GET /money/identity/selfie` -> `{ matchedAt, checksLeft }`; WAWU ID guard, caller from the token, `no-store`.
- **Mobile:** `fetchSelfieMatch`, `matchSelfie`, `selfieProblem`, `selfieMatchQuery` in `src/api/walletIdentity.ts` + 5 tests; types from the branch contract (`SOURCE_COMMIT` 60dfe3f). No screen (A6, A7, A16 are KYC-03's).
- **Pass / fail (A7, A16):** tested over HTTP against the Fintava double: the sandbox's own failed match (`400 "Request failed with status code 404"`) -> `422 selfie_not_matched`, A16's words, `checksLeft`; a 2xx verdict `false` -> same, score kept; Fintava's 2xx envelope around its documented `{}` example, and a richer echoing answer -> 200, `matchedAt`, confidence stored. A new BVN check needs a new selfie; a matched selfie is not sent again (409).
- **3 a day (PROVISIONAL(SELFIE-CHECKS-PER-DAY)):** 2, 1, 0 left, the 4th `429 selfie_checks_exhausted` (A16 + retry rule), Fintava saw 3; 10 parallel: at most 3 reach Fintava, rows <= 3. Per address: `short`/`medium` through AppModule's real guard (4th -> 429, Fintava saw 3); metadata names no `default`.
- **Never stored or logged:** the whole spec's stdout, stderr, console and Nest logs plus every answer: 0 hits for any 40-char window of every image, the echoed photo, BVNs, NIN, both keys, incl. a refusal echoing selfie, BVN and photo. Every text/json/bytea/array column of every table: 0 hits.
- **Isolation, 503:** 401 without a token; `wawuUserId` in a body 400; B cannot use A's BVN or read A's result. Production boot with no `FINTAVA_*` and no `IDENTITY_HASH_KEY`: boots, selfie 503, nothing sent or counted, read 200. Bad BVN/image 400 before any charge.
- **Mutations (20), all killed:** limit off, count-before-insert, image stored, image logged, BVN logged, BVN re-check off, null NIN skipping the BVN, throttle removed / on `default`, masking off, 2xx always a match, 5xx given back, match for any BVN check, settings check off, already-matched off, wallet check off, any format, guard off, confidence not stored, shared BVN count.
- **Runs:** tsc 0, eslint 0 on 21 changed files. Full `test:contract` fresh `k02_full_test`: 107 suites, 2058 passed, 3 skipped, 35 failed only in the 3 suites hard-coding :4001 (nothing there); rerun with my mock on :4001: those paths 15 suites 164/164. Protected `--fresh` `k02_protected_test`: 253/253 (244 required), lock unchanged. Gates 16 fail before and after (same lines), warns 6 -> 7. Mobile `npm run check` exit 0 before (17 suites, 289 tests) and after (17, 294), gates 0.
- **Sandbox (2 charged calls, `sandbox/29-kyc02-selfie.md`):** documented example BVN `*******8901` + a synthetic cartoon JPEG: client 400 `identity_refused`; route `422 selfie_not_matched`; ₦10 each; 0 BVN, image or key windows in any log or column.
- **NOT RUN:** a matching selfie on a real record (no sandbox BVN passes, questions 6 and 11; unblocked when Fintava names one); a phone (no screen).
- **Defaults (agent), owner may override:** base64 JSON body (an upload key would store the image), JPEG/PNG 1 KB to 100,000 chars, under the global 100 KB limit; the route takes the BVN only (Fintava needs no NIN); a 2xx is a match unless a verdict field says `false` (success body unseen); only a missing or refused key gives a try back (the selfie was charged with the merchant inactive); the BVN check's per-address limit reused; a match counts for the BVN check it followed; error copy for 429, 409, 503 written in A16's tone.
- **Filed:** SHARED-CHANGES KYC-02 #1 (schema), #2 (`src/api`, branch contract), #3 (global filter answers an oversize body 500, asks 413), #4 (`ApiError` without `checksLeft`/`retryAfterSeconds`); G-25 notes `selfieMatched` for MONEY-12.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
