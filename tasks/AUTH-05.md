---
id: AUTH-05
title: The sign-up sequence end to end
owner: DEV
area: AUTH
order: 46
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: [AUTH-03]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-05 · The sign-up sequence end to end

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Sign-up (A2 to A4, then A11 to A13) is one sequence the server enforces, with no identity checks in it (R-6).

## Scope

The registration state machine and its endpoints; each step refuses to run before the previous one completed.

BACKEND_GAPS G-5 is this task's: wawu-id publishes its OpenAPI contract, so the app's sign-in calls are generated (`npm run api`) instead of read by hand.

## Capability checks

- [ ] Quitting halfway through sign-up and coming back resumes at the next step.
- [ ] A new account has no wallet, and no identity check was run during sign-up.
- [ ] The app's sign-in calls use types generated from wawu-id's published contract (G-5).

## Builder report

Branches `wmt/AUTH-05`: wawu-id from origin/main 873b31f, mobile from origin/main (fast-forwarded to ddafc76, AUTH-02). Hub not changed. Nothing committed or pushed. Evidence: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/AUTH-05/` (below `E/`).
- **wawu-id files:** new `src/auth/signup-sequence.ts` (the order), `signup-sequence.service.ts`, `signup-sequence.controller.ts`, `signup-sequence.config.ts`, `session-reader.ts`, `dto/signup-{resume,progress,email-confirm}.dto.ts`, `src/contract/{build-contract,emit-contract,identity-schemas}.ts`, `contract/openapi.json` (generated), migration `20261003120000_signup_sequence`, `scripts/data/g16-duplicate-phones.mjs`, `test/signup-sequence.local.mjs`; specs `signup-sequence.service.spec.ts`, `phone-signup-resume.spec.ts`, `session-reader.spec.ts`, `src/contract/contract.spec.ts`. Edited: `phone-signup.service.ts` (adds `resume`; signup and confirm unchanged), `auth.controller.ts` and six DTOs (swagger metadata only), `auth.module.ts`, `schema.prisma`, `package.json`/lock, `.env.example`, `deploy/ENV.md`, `WAWUAfrica_API_Contracts.md`. **Mobile:** `scripts/api/sync_contract.py`, `src/api/identity.ts`, new `src/api/identity.generated.ts`, `contract/identity/`, `src/__tests__/identity-contract.test.ts`, `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md`, this file.
- **The sequence:** A2 (type, sent with sign-up) → A3 `POST /auth/signup` → A4 `phone/verify/confirm` (first session) → `email` (prove by mailed code, or Later) → A11 (`creator`) or A12 then A13 (`user` or none) → `done`. Before the session `POST /auth/signup/resume {phone, attempt}` answers `phone` (time left on code and resend, `emailCodeRequired`, type) or `details`; after it `GET/POST /auth/signup/progress` (Bearer access token; refresh tokens refused) completes only the next step (409 `SIGNUP_STEP_OUT_OF_ORDER`), a repeat is idempotent. Web, legacy and phone-only accounts answer `done, inSequence: false` and get no record.
- **Check 1, resume: PASSED locally.** `npm run test:signup-local` (real built wawu-id, local Postgres, local SMS receiver; `E/signup-local-run1.txt`, 36 PASS): quit after A3, resume answers A4 with the time left and sends nothing; made-up secret answers `details`; after A4 sign in again and progress resumes at A12; out-of-order steps refused; two parallel taps on A13 both 200, done once. Unit: 18 sequence and 11 resume tests.
- **Check 2, no wallet, no identity check: PASSED locally.** Same run: the receiver saw only `/sms/send` from wawu-id (no BVN, NIN, selfie, customer or wallet call); a real local Hub (origin/main e8535d8, own DB `a05_hub`) accepted the creator's session and holds 0 rows for it in `CreatorWallet`, `FintavaWallet`, `WalletIdentity`, `KycSubmission`, `BvnCheckAttempt`, `SelfieMatchAttempt`. The sequence never writes the Hub (G-17, G-34).
- **Check 3, generated sign-in types: PASSED.** wawu-id `npm run contract:build` emits 11 operations; `contract.spec.ts` fails when the file drifts from the code, a non-app route leaks in, or the sign-in user's keys differ from `sessionFor`. Mobile `npm run api -- --identity ../WAWU-ID --identity-worktree` generated `identity.generated.ts`; `identity.ts` types login, refresh and forgot-password from it; `identity-contract.test.ts` holds every body sent against the contract. `schema.generated.ts` unchanged.
- **G-27:** `signup/email/start|confirm` (session only, the account's own address, code and address hashed, 4-wrong lockout and 12/day shared with the phone rules, 60 s gap, 5/day). Live: before proof no reset mail; after proof the reset mail goes out.
- **Revert proofs (sha1 restored, `E/revert-proof.txt`, `E/revert-proof-mobile.txt`):** 13 wawu-id fixes and 4 mobile ones, each fails 1 to 3 tests when removed.
- **Counts, wawu-id before → after:** tsc 0 → 0; eslint 29 → 29 errors (same files, none new); jest 11 suites 132 tests → 15 suites 170; gates 0 fail 17 warn 76 files → 0 fail 20 warn 91 files (3 new PROVISIONAL markers); `test:phone-local` (AUTH-03) 103 PASS on the branch. **Mobile `npm run check`:** before (origin/main 176a56d) 19 suites 345 tests, gates 90 files 0 findings, 202 tasks; main then took AUTH-02 (20 suites, 371 tests, 96 files); after, exit 0: 21 suites 377 tests (+6), gates 98 files 0 findings, 202 tasks.
- **Equality set (V3):** AUTH-03 verifier's `v3.mjs` plus 15 sign-up requests, origin/main build vs branch build, each on its own copy of the same freshly migrated DB (`E/v3/`): 83 requests, 80 byte-identical; the 3 that differ are the new routes (404 on main). Old build runs on the new schema.
- **Migration:** additive (2 tables), replayed from empty, `migrate diff` empty; rollback (`DROP TABLE "signup_email_codes"; DROP TABLE "signup_progress";`) leaves the schema equal to origin/main's (`E/rollback-result.txt`).
- **PROVISIONAL (config, `signup-sequence.config.ts`):** email resend gap 60 s, 5 email codes a day per account, 120 resume checks an hour per address. Email code life 600 s matches the mail's own "10 minutes".
- **Defaults (agent), owner may override:** (1) email proof is a sequence step that can be put off (G-27); (2) no pick at A2 reads as `user`, `POST /auth/signup` still accepts none (AUTH-03's contract unchanged); (3) a record is made the first time progress is asked, for any account with a proven phone; (4) the sequence does not copy the account type to the Hub (a `creator` save opens a wallet, G-34); (5) the contract covers the app's 11 routes only (G-38); (6) proving the email sends no welcome mail; (7) G-16 keeper rule (below).
- **G-16, owner stop, NOT RUN on real data:** keeper rule and script recorded in G-16; tested only on scratch DB `a05_g16` (`E/g16-*.txt`: 3 sets, 4 released, revert byte-identical). Unblocked when the owner runs `report` on production and approves the rule.
- **Gaps and shared changes:** G-5, G-13, G-16, G-17, G-27 updated; new G-38. SHARED-CHANGES AUTH-05 #1 to #4 (applied) and F1, F2 (AUTH-04, AUTH-06 screens).
- **NOT RUN:** real Fintava `/sms/send` and real mail (G-15; codes read from the receiver and the log); an Android walk (no screens yet: AUTH-04, AUTH-06); real nginx; `contract/identity/SOURCE_COMMIT` names the uncommitted branch: rerun `npm run api -- --identity ../wawu-id` once wawu-id main has the contract.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
