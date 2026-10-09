---
id: NUV-02
title: Open a wallet on Nuvion: the person, BVN and NIN, review, approved or rejected
owner: YOU
area: MONEY
order: 201
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [NUV-01, MONEY-12, KYC-01]
decisions: [R-39, R-42, R-6]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# NUV-02 · Open a wallet on Nuvion: the person, BVN and NIN, review, approved or rejected

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `core-concepts__entities.md`, `api-reference__entities.md`, `quickstart.md`, `api-reference__accounts.md`, `webhooks__event-types.md`; SANDBOX-FINDINGS items 2 and 3

## Goal

A Nigerian opening a wallet becomes a Nuvion child entity (WAWU is the parent) with their name, date of birth,
email, phone, address, BVN, NIN and ID details. Once NUV-03 has submitted their documents, Nuvion's decision
reaches them: approved opens their naira account, rejected says why in plain words and what to fix.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- MONEY-12 (done, open a Fintava account): rewired. Under `nuvion`, `openWallet` answers `provisioning` until Nuvion approves (the seam already handles it); Fintava's path is unchanged.
- KYC-01 (done, BVN check): rewired. Nuvion has no separate BVN lookup, so `checkIdentity` answers `not_supported` and the BVN and NIN are verified inside Nuvion's review.

## Scope

- `src/nuvion/areas/opening.ts`: `submitKyc` creates the entity (`POST /individual-entities` with `person`, `address`, `identification.document` and the BVN and NIN; no `entity_id` on create, the child's `entity_id` on every later call); `openWallet` answers `provisioning` until approved, then creates one NGN `checking` account (`POST /accounts`); `getWalletAccount`; the phone and sighting lookups answer from `NuvionEntity` (Nuvion has no Fintava-style phone lookup).
- `src/nuvion/handlers/entities.ts`: `entities.updated` re-fetches `GET /entities/{id}` before acting (the docs advise it), records the status and each identity number's and document's `verification_status`, and on `approved` creates the account once.
- `src/money/opening/*`, Nuvion path only, additive fields in `GET /money/wallet` and `POST /money/wallet/open`: `needs_documents` (NUV-03 not finished), `checking`, `approved` (account number on its way, NUV-04), `rejected` (Nuvion's reasons in plain words and what to fix; submitting again allowed). No existing field changes meaning (V3).
- BVN and NIN are sent to Nuvion once and never stored or logged in the clear (hashed with `IDENTITY_HASH_KEY` as today, shown masked to the last 4).
- The phone and the BVN (R-42): record what Nuvion's review says; A14 (phone does not match the BVN) is answered only when Nuvion's response names a phone mismatch. The docs say it never does (SANDBOX-FINDINGS item 3); see owner question 4 in `docs/PAYMENTS-PLAN.md`.
- Not in scope: document uploads, the selfie and the submit call (NUV-03); the account number (NUV-04); people outside Nigeria (NUV-09); the Open your wallet screens (cut from the round 2 boards).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [x] A person with BVN, NIN, date of birth, address and ID details can start opening: one child entity is created, and `GET /money/wallet` tells them what is still needed.
- [x] Tapping open twice, or a create whose answer is lost, still leaves one entity (the opening is recorded before the call and checked before any retry) (V8).
- [x] An `approved` delivery, re-fetched first, creates exactly one NGN checking account, also when replayed or delivered twice at once (V8).
- [x] A `rejected` result tells the person the reason in plain words and what to fix, and they can submit again; `failed` and `suspended` stop money routes with the existing no-wallet answer.
- [x] No BVN or NIN appears in the clear in a log line, a response or a stored column (the spec scans logs and rows).
- [x] Under `fintava` the opening behaves exactly as before (existing opening specs pass unchanged).
- [ ] (key) A sandbox entity with the docs' example identity numbers reaches a decision; the time it took is in the report.
- [ ] (key) The full `GET /entities/{id}` body after review is in the report (identity numbers masked), saying whether any field reports the BVN's phone.

## Builder report

Builder, 8 Oct 2026 (two sessions: a first builder wrote the code and was stopped; this session finished from its worktree, merged
backend main 9d90d57 and ran the checks). wawu-backend `wmt/NUV-02` 9184ee0 (on main 9d90d57); mobile `wmt/NUV-02` (this file,
contract copy, SHARED-CHANGES and BACKEND_GAPS rows). Stand-in only: no Nuvion, Fintava or wawuafrica.com host was called (the
NUV-01 outbound guard is on in the spec; the spec's last test proves nothing left the machine). The mock WAWU ID ran on :5901.

**Built** (backend), all additive; under `WALLET_PROVIDER=fintava` every answer is byte-for-byte what it was:
- `src/nuvion/areas/opening.ts` (NUV-02's file): `submitKyc`-side creation of the child entity (`POST /individual-entities`
  with `person`, `address`, `identification.document`, the BVN and the NIN as identity numbers; no `entity_id` on create, the
  child's `entity_id` on every later call); `openWallet` answers `provisioning` with the review state (never `open`: the account
  comes only after approval); `readEntity` (`GET /entities/{id}`, ids, Nuvion's words and times, the phone and email only to match,
  Nuvion's texts masked); `correctEntity` (`PATCH /individual-entities/{id}`, BVN and NIN sent again only when the review named
  one of them); `findNairaAccount` (`GET /accounts` read to its end) and `openNairaAccount` (`POST /accounts`, one NGN `checking`
  account); the entity lookup after a lost answer (by phone, on Nuvion's list). `findCustomerByPhone` answers `unknown`
  (Nuvion has no Fintava-style phone lookup), `checkIdentity` stays `not_supported` (BVN and NIN are checked inside Nuvion's review).
- `src/nuvion/handlers/opening.handler.ts` (NUV-02's file): `entities.created` and `entities.updated` re-fetch the entity first and
  act on what Nuvion says, never on the delivery; record the review (status, BVN, NIN, document and proof-of-address words,
  Nuvion's refusal reasons masked, `decidedAt`); adopt an entity a lost create made (only when exactly one in-flight opening of ours
  has that phone and was sent before the entity was made); on `approved` open the one NGN account behind a claim
  (`accountRequestedAt`, a conditional update before anything is sent), look at Nuvion's account list before any request and after
  any lost or "already exists" answer, and never send again inside the resend window. Under a server that does not run Nuvion the
  delivery waits, asking nothing (rollback safety).
- `src/money/opening/reviewed-opening.ts`, `review-stage.ts`, `dto/open-wallet.dto.ts`, `wallet-opening.service.ts`,
  `money-wallet-opening.controller.ts`: the opening for a provider that reviews the person (`capabilities.separateKyc`). The
  attempt is recorded before the call (`FintavaWalletOpening`, the same row Fintava uses, stamped `provider`); ten taps at once
  make one create; a lost answer leaves `unknown`, nothing is resent inside the window, and past it the next tap looks on
  Nuvion first; a rejection followed by corrected details corrects the same entity. `GET /money/wallet` and
  `POST /money/wallet/open` gain two additive, optional fields, `openingFlow` (`review`, sent only under such a provider; absent
  means `check`) and `review` (`{ stage, decidedAt, reasons[], canResubmit, ... }`); `stage` is `needs_documents`, `checking`,
  `approved` (account number on its way, NUV-04), `rejected` or `stopped`; no existing field changes meaning (V3).
  `OpenNairaWalletDto` gains optional fields for what Nuvion needs (gender, nationality, address parts, ID document, proof of
  address type); an A5 body with none of them is still valid under Fintava and, under Nuvion, is a plain 400 naming the first one
  missing (BACKEND_GAPS G-460).
- `wallet-provider.interface.ts` and `wallet-provider-error.ts` (the MONEY-20 seam): `ProviderOpenWalletInput.review?`,
  `ProviderReviewState`, `provisioning` carries `review?`; the NUV-01 `under_review` kind now answers `409 identity_under_review`
  (a new money reason code, NUV-01's verifier rule: a money route always fills `reason`), the same sentence as before.
- Migration `20261016220000_nuvion_entity_review` (the stamp reserved for this task, sorts after every folder on main): eight
  nullable columns on `NuvionEntity` (`bvnStatus`, `ninStatus`, `documentStatus`, `addressProofStatus`, `identificationStatus`,
  `reviewReadAt`, `correctedAt`, `accountRequestedAt`). Never a number or a document. Rollback: drop the columns.
- SHARED-CHANGES NUV-01 #3 applied (`PinResetView.sentTo` doc line, `money-view.type.ts`). G-400 (WAWU ID's pin-reset-code route)
  is still open and untouched by this task.
- Specs: `src/nuvion/tests/nuvion-opening.contract.spec.ts` (37 tests, real database, the NUV-01 stand-in at its seam, real HTTP
  through AppModule's guards), `nuvion-opening-review.spec.ts` (the pure stage and the entity reader), and NUV-01's
  `nuvion-adapter.spec.ts` updated where `openWallet` and `findCustomerByPhone` are no longer `not_supported`.

**Capability checks** (stand-in; each is a named test in `nuvion-opening.contract.spec.ts` unless stated)
1. A person with BVN, NIN, date of birth, address and ID details starts opening: "one child entity is made with what was sent,
   and GET /money/wallet says the documents are still needed"; the request body Nuvion received is compared field by field
   (BVN and NIN present once, ID type, a national ID sent as the NIN slip), plus the refusals (check handle, no email, a phone
   that is not Nigerian, another account's BVN, Nuvion refusing, Nuvion's compliance review) each with nothing sent. PASSED.
2. Two taps, or a lost answer, leave one entity (V8): "ten taps at once: one create"; a lost answer is `unknown` and nothing is
   resent; Nuvion's `entities.created` delivery records it; with no delivery the next tap past the window looks first, finds it
   and makes none; the sweep settles from the recorded entity and never makes one; "nothing was made" is proved on Nuvion's list
   before one is made; a list that cannot be read makes nothing; someone else's entity (another phone) is never adopted. PASSED.
3. An `approved` delivery, re-fetched first, creates exactly one NGN checking account (V8): one account and `GET /money/wallet`
   says `opening`/`approved`; a delivery that says approved for an entity Nuvion still has pending opens nothing; replayed and
   delivered twice at once: one account; a lost account request is not sent again inside the window and the list is read first
   after it; "account already exists" is adopted from the list; a refused request releases the claim; through the dispatcher a
   stored delivery is processed. PASSED.
4. A `rejected` result says why in plain words and what to fix and the person may submit again; `failed` and `suspended` stop
   money routes with the existing no-wallet answer (`it.each(['failed','suspended'])`); a BVN refusal corrects the same entity
   and sends the numbers again, a document refusal sends none; A14 (the phone does not match the BVN) only when Nuvion's own
   words name the phone, else "details". PASSED.
5. No BVN or NIN in the clear: the spec scans every log line and every answer, and every text column of every table, for the
   BVN, NIN and ID number sent. PASSED, and mutant M5 (below) shows the scan catches a stored BVN.
6. Under `fintava` the opening is exactly as before: `wallet-opening.contract.spec.ts`, `money-identity`, `selfie-match`,
   `fintava-*` and the protected suite pass unchanged. PASSED.
7. (key) A sandbox entity with the docs' example identity numbers reaches a decision, time in the report: NOT RUN, see below.
8. (key) The full `GET /entities/{id}` body after review, whether any field reports the BVN's phone: NOT RUN, see below.

**Money safety notes**
- The provider is authoritative: nothing here sums a balance; the account is the one Nuvion lists, recorded by its own id.
- An unknown outcome is reconciled, never retried blindly: a lost entity create and a lost account request are both settled by
  reading Nuvion's list first, inside a recorded claim and a resend window (NUV-01's `moneyTimeoutMs` + `resendSafetyMs`).
- "Already exists" refusals carry `recordMayExist` and are caught and adopted (the entity or the account is looked up), never a
  blind 503. `under_review` has its reason code (`identity_under_review`) before any route answers it.
- BVN and NIN go to Nuvion once; stored only as the keyed hash (`IDENTITY_HASH_KEY`); shown masked to the last 4; Nuvion's own
  texts are masked before they are stored or shown. The ID document number is never stored.
- Every ledger row written stamps `provider` (no ledger row is written by this task). No route here moves money, so
  `@RequireFeesSet()` and `assertMayMove` are not needed; `money-moving-coverage.spec.ts` (FIX-21) passes.
- A disagreement between Nuvion and our record is a stop: an entity that matches an opening which already holds another, or an
  account recorded for someone else, is logged without the numbers and left for review (`failed`), not fixed silently.

**Mutants** (applied to the code, the two NUV-02 specs run, `git restore`; 9 of 9 killed; log `mutants.txt` in the scratch folder)
M1 the account request sends USD: 4 tests fail. M2 the claim removed (two deliveries both open): "replayed and delivered twice at
once: one account" fails. M3 no look-first before the request: the lost-request test fails. M4 a lost answer is retried blindly:
2 fail. M5 the BVN stored in the clear instead of hashed: the "in no stored column" scan fails. M6 acts on a status that is not
approved: the lost-answer test fails. M7 the account recorded with the wrong currency: the first approved test fails. M8 a second
request claimed while the first is in flight (claim window inverted): fails. M9 an unknown opening resent without waiting for
the window: 2 fail.

**Checks** (backend 9184ee0, merged with main 9d90d57)
- `npx tsc --noEmit`: 0. eslint on every changed file: 0 (one unnecessary assertion in the spec removed).
- Related suites one at a time on the host (`src/nuvion src/money src/fintava src/wallet-provider src/kyc`): 60 of 62 suites, 2122
  tests pass. The two others, both environment: `kyc-submission.contract.spec.ts` hard-codes the mock on :4001 (never used on the
  host; it ran in the namespace, below) and `selfie-match` "no column of any table holds a selfie" timed out at 5 s on a 142 MB
  test database full of earlier runs; on a freshly migrated database the same file passes 182 of 182.
- Protected suite `--fresh HEAD`: 253/253 (244 required), lock unchanged.
- Gates: 16 fail (the same 16 lines as main); my first run showed a 17th (`reviewed-opening.ts`, the wire-types rule on an inline
  `type` import), fixed. Warnings: 69 against the 66 in my first main run, the three extra are POINTS-01's, from main; this task
  adds no `PROVISIONAL` and no warning line of its own. CI tripwire on added lines: empty.
- `npm run contract:build`: leaves the committed file unchanged after the regenerate commit. The regenerate also reorders some
  `pending/rejected/approved` enums to the schema's order; that drift was already on main (it is not from this task).
- Mobile: contract copied from the branch (`contract/SOURCE_COMMIT` `wmt/NUV-02@9184ee0`; `npm run api` reads origin/main only, so
  the copy follows the FIX-24 precedent) and the client regenerated; `npm run check` exit 0.
- Full suite in a private network namespace (`ns2.sh`/`inner2.sh` copied, fresh migrated and seeded database): `jest --runInBand` over all 216 suites under the host's load (other sessions' suites were running): 208 suites and 5686 tests passed, 4 skipped, 8 suites (53 tests) failed, all by a 5 s hook or test timeout or a timing bound, none by an assertion about this task. Each of the 8 passes when run alone: `admin-ads` 194/194, `fintava-stall` 120/120, `selfie-image` 52/52, `points.service` 53/53, `hub-rate-limits` 22/22 (host network, as the common rules say), and, on a freshly migrated database with the mock restarted (my own copy of `inner2.sh` removes the mock's key files when it ends), `identity-production-boot` 4/4, `identity-throttle` 7/7 and `selfie-match` 182/182. `kyc-submission` (22 tests, needs :4001) passed inside the namespace, so it is not in the failure list. The namespace's :4001 listener was mine alone before, during and after the run (`port4001.txt`).

**Decisions** (Default (agent), owner may override)
- `identity_under_review` is a new money reason code answered `409`, the status the old plain 409 already had.
- `openingFlow` and `review` are sent only under a provider that reviews the person; under Fintava the answer has neither field,
  so its shape is byte-identical to main's (an absent `openingFlow` means `check`).
- A rejected person who sends corrected details corrects the same entity (`PATCH`), and the review starts again from the
  documents (NUV-03); the BVN and NIN are sent again only when the review named one of them.
- An unknown Nuvion review word reads as `checking` (the person waits; nothing is sent), never approved or rejected on a guess.
- No phone-to-BVN match is required at launch (PAYMENTS-PLAN default); the review's own word is recorded and A14 shows only when
  Nuvion's reasons name the phone.
- The NUV-01 `provisioning` answer carries the review state so `GET /money/wallet` reads from one place.

**NOT RUN**
- (key) checks 7 and 8: the sandbox key answered 401 on 7 Oct. Unblocked when a lead brief allows `api.nuvion.dev` and
  `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`; then create an entity with the docs'
  example numbers, record the time to a decision, and attach the full `GET /entities/{id}` body (numbers masked).
- The Open your wallet screens (A5 to A8, KYC-03 to KYC-05) send none of the new fields, so under `nuvion` a person's open is a
  400 naming the first missing one (G-460). Unblocked when a mobile task adds the fields to the screens; under `fintava`
  nothing changes. No screen was built or changed here (the task says the screens are cut from the round 2 boards), so no
  screenshots.
- Document upload, the selfie and the submit call are NUV-03; the account number is NUV-04; people outside Nigeria NUV-09.


## Verifier report

Verifier, 8 Oct 2026 (independent; wrote none of this). Backend `wmt/NUV-02` `9184ee0` in detached worktree `vnuv-02b`; backend main
`dc3baa2` in `vnuv-02main` for every comparison; the real wawu-id `fb8717e` (origin/main, its own `npm ci`) in `vnuv-02id`; mobile
`wmt/NUV-02` `9bfd5ed` in `vnuv-02m`. Evidence: the lead's scratchpad `vnuv-02/` (`live/` the live phases and their outputs, `v1/`,
`prot/`, `ns/` the namespace runs, `mut/` the mutants, `mobile/`). **No Nuvion, Fintava, wawuafrica.com or AI host was called.** Every
built server ran inside a private network namespace with loopback only (Postgres through a unix-socket relay), and a preload sent
`https://api.nuvion.dev` to my own stand-in on 127.0.0.1:5943 (answers modelled on the docs' examples) and refused every other
non-loopback host. Two slips of mine, both harmless: Postgres was down when I started (I ran `pg_ctlcluster 16 main start`), and one
phase script ran once on the host network by mistake (my ports 5941 to 5944 only, the preload refused outbound hosts, nothing touched
`:4001`). **Backend main moved** since the build (`9d90d57` to `dc3baa2`: SCHOOLS-04, EVENTS-01): a trial merge of `dc3baa2` into a
throwaway copy of the branch is clean (only `contract/openapi.json` auto-merged), `tsc` 0, `npm run contract:build` leaves the merged
contract unchanged (sha256 `343265e0...a2d6`), the migration stamp `20261016220000` still sorts after main's newest
(`20261016200000_points`), and the NUV specs on the merged tree pass (9 suites, 426 tests, in a namespace). Nothing was pushed or kept.

**Verdict: building, 7 defects open** (D1 to D7 below; D1 to D4 are identity or review-state defects, D5 to D7 are low). Everything else
the brief asked about the money and identity paths held on the built servers: one entity per person under ten taps (also past the
resend window and for ten simultaneous corrections), a lost create adopted from Nuvion's list before any resend (and nothing made when
the list cannot be read), the review states from Nuvion's words, the same entity corrected after a rejection, exactly one NGN account
behind a claim (seven deliveries of one approval, two servers, a lost account answer, an account Nuvion already had), a delivery that
lies about the status opening nothing, a Fintava server leaving the delivery alone, the new reason code, and the additive migration.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: `tsc --noEmit` 0 (`v1/tsc-b.log`). eslint `--no-fix` on the 15 changed `.ts` files: 0 problems (`v1/eslint.log`). Gates (`v1/gates-b.out`, `gates-main.out`): branch 997 files scanned, 16 fail, 69 warn, 76 accepted; main `dc3baa2` 1004 files, 16 fail, 69 warn, 76 accepted; the 16 FAIL file:line lines are identical and so are the warn lines; the branch adds no `PROVISIONAL`. Tripwire on added lines: 0 matches. `npm run contract:build`: `contract/openapi.json` unchanged (sha256 `2d36158c...fc13` before and after); the mobile copy is byte-equal and `python3 scripts/api/sync_contract.py` (regenerate only) leaves `openapi.mobile.json` and `schema.generated.ts` unchanged. Against current main's contract the branch adds only `WalletReviewView`, `WalletReviewReasonView`, `WalletView.openingFlow` and `.review` (optional, not in `required`), 11 optional `OpenNairaWalletDto` properties, `identity_under_review` in `MoneyErrorReason.code`, and the 409 and 422 descriptions of `POST /money/wallet/open`; every other difference is main moving on or enum-order drift that already exists. Mobile `npm run check` on `9bfd5ed`: exit 0 (typecheck, lint, 76 suites and 1,377 tests, gates 0 fail 0 warn on 346 files, 262 tasks and 279 artboards; `mobile/check-9bfd5ed.txt`). Key-shaped strings in the diff: none. |
| V2 Contract | passed except D2 | Built branch server under `WALLET_PROVIDER=nuvion`, real wawu-id sign-in, Nuvion stood in (`live/p-open.txt` 41 of 41, `p-review.txt` 36 of 40, `p-odd.txt` 21 of 24, `p-null.txt`, `p-forge.txt` 4 of 4; the failing lines are the findings below). 60 odd bodies (bad numbers, Arabic-Indic and full-width digits, 10 and 12 digit numbers, HTML, NUL, emoji, dates out of range, over-long fields, wrong enums, arrays, `null`, text/plain, 2 MB): 56 were 400, one 413, three 200 (`gender: null`, which is D2, and the two prototype keys below); no 5xx. Boundary body (50-letter names with apostrophes and accents, 60-character street, second line, postal code with a dash, passport with issue and expiry dates, bank statement) reaches Nuvion field by field as sent; a national ID goes as the NIN slip. The body Nuvion received on create was compared field by field with the docs (`name`, `person`, `address`, `identification.document`, `proof_of_address`, no `entity_id`, Bearer key, `X-API-Version`). A non-Nigerian phone: `422 phone_not_nigerian`, nothing sent. `__proto__` and `constructor` keys are ignored and reach nothing (main accepts them too). |
| V3 Regression | passed (timing aside) | Protected suite `run.sh --fresh HEAD` (namespace): 253/253, "all 244 required tests passed"; lock files identical to origin/main (0 diff lines) (`prot/protected.txt`). Touched modules (`src/nuvion src/money src/fintava src/wallet-provider src/kyc`, fresh migrated and seeded database, mock WAWU ID on :4001 inside the namespace only): 62 suites, 2,145 tests, 0 failed (`ns/touched.json`). Full suite as three serial `--runInBand --shard=i/3` runs, each in its own namespace and fresh database (copies of `t3ns/inner2.sh`): 216 suites, 5,743 tests, 5,726 passed, 4 skipped, 13 failed in 2 suites, none a file this task changed: `hub-rate-limits.contract.spec.ts` 11 (needs a non-loopback interface; 22/22 on the host network, `ns/rerun-hub-rate-limits.txt`) and `receipt-units.spec.ts` 2 (the 300 ms and 100 ms bounds at load 5 to 6; 43/43 alone, `ns/rerun-receipt-units.txt`). Shard totals 2,737 + 1,546 + 1,460 tests. |
| V4 Field trace | passed except D2 and D4 | Writer: the `POST /money/wallet/open` body. Storage: only the keyed BVN hash and the phone (claim row) and Nuvion's ids and words (`NuvionEntity`); the BVN, NIN, ID number, name, date of birth and address are never stored. Readers: Nuvion (create and correct) and `GET /money/wallet` (`review`, from the stored words). Scans (`pg_dump --inserts` of every table and the hub logs) for every BVN, NIN and ID number used: 0 hits in the first two phases' own scans (`live/p-open.txt`, `p-review.txt` SCAN lines), and a final scan of the branch database and all 8,094 saved log lines after the last phase: 0 contiguous BVN-shaped or NIN-shaped numbers and 0 ID numbers. The one way a number can land is D5. |
| V6 States | passed | Each state reached through its real cause on the built server: `needs_documents` (entity created, `incomplete`), `checking` (`pending`, and an unknown Nuvion word), `approved` (decidedAt set, state `opening`, no account number yet), `rejected` with reasons (BVN, documents, phone words; `canResubmit` true), `needs_documents` again after the correction, `stopped` (`failed` and `suspended`: state `not_open`, `review_stopped`, money routes `409 wallet_not_open`, tapping open sends nothing), opening (a lost create), `409 identity_under_review` (Nuvion's compliance review), `422 account_not_opened` (Nuvion refuses). `live/p-review.txt`, `p-open.txt`. |
| V8 Money | passed except D1, D3, D4 | Ten taps at once, one create (the create held 0.9 s so the race was real); ten simultaneous corrections, one PATCH; ten taps after a lost create past the window: one list read, one create; a lost create answer never resent inside the window, then the list is read first (found: none made; nothing made at Nuvion: exactly one; unreadable list: none made, still opening); the same approval delivered seven ways (same event id twice, a later timestamp, a changed id, four concurrent, on two servers): one `POST /accounts`; two servers and two deliveries each for another person: one; a lost account answer: found on Nuvion's list and recorded, no second request; an account Nuvion already had: adopted with no request; a refused request releases the claim and a later delivery opens it; a delivery saying approved while Nuvion says pending: nothing opened and `pending` recorded; the read-back failing: nothing opened, the delivery stays pending; unsigned, wrong-signature, other-secret, body-only-signature and 25-minute-old deliveries: 401, nothing stored. No ledger row is written by this task. |
| V9 Live seam | passed | Real wawu-id `fb8717e` (own `npm ci`, own database): register, email verified, `POST /auth/login`, its JWKS verifying the token at the Hub. The person's `sub`, email and phone come from the real token. Walk: `GET /money/wallet` (not_open, `openingFlow` review, `review` null) to `POST /money/wallet/open` to a signed `entities.updated` pending to approved to one account (`live/p-null.txt`, `p-review.txt`). |
| Mutants | 17 of 20 killed | Twenty of my own, each applied alone and restored (`git diff` clean after each; `mut/results.jsonl`). See below. |

**Mutants** (my own V1 to V20 against `nuvion-opening.contract.spec.ts` and `nuvion-opening-review.spec.ts`; V17 also runs the opening specs).
Killed: V1 acts on the delivery's status instead of the re-read and drops the claim's status check; V2 a refused account request keeps
its claim; V3 an entity adopted whatever the phone; V5 an unreadable entity list counts as none made; V6 a lost create answer is a
refusal (blind resend); V7 a correction always resends the BVN and NIN; V8 a correction makes a second entity; V9 an unknown Nuvion
word reads approved; V10 a rejected BVN is not read as not passed; V11 A14 always named; V12 Nuvion's text stored unmasked; V13 a held
BVN or phone swallowed; V15 gender flipped; V16 a savings account; V17 the review fields added under every provider (75 tests fail);
V18 the BVN written to the log; V20 the account request in USD. **Survived (spec gaps): V4** a list longer than the pages read counts
as "none made" (the "too long to tell" path has no test; with a 10-page bound and Nuvion's list filter unproven it is the guard that
stops a second create); **V14** the guard that never overwrites an entity id the person already holds (`HeldEntity` in `record`) has
no test; **V19** `walletProviderErrorToHttp('under_review')` answering a plain 409 again survives because the open route throws the
coded error itself, so no spec proves the code on any other money route.

**Defects**

- **D1 (defect, identity): anyone can hold anyone else's BVN, and the owner is told they already have a wallet.** Reproduction (built
  branch, nuvion, stand-in): account X sends `POST /money/wallet/open` with a valid body whose `bvn` is account Y's BVN (nothing proves
  it is X's) and gets 200; Nuvion rejects X's entity (or says nothing). Account Y sends `POST /money/wallet/open` with their own BVN
  and gets `409 identity_has_wallet` "This BVN or phone number already has a wallet on another account.", nothing sent, on every try,
  for as long as X's row exists (a `rejected`, `failed` or `stopped` opening never releases the hash). Evidence `live/p-review.txt` C4
  and `p-open.txt` O7. Cause: `FintavaWalletOpening.bvnHash` is unique and the claim is taken before any proof of ownership; under
  Fintava KYC-01's BVN check (the BVN's phone must be the account's) came first, under Nuvion nothing does (R-42 asked for it, the
  plan's default drops it). The same 409 is an oracle for "this BVN has an opening at WAWU" (a person whose opening is `failed` can
  probe again and again). The builder's test pins the 409 for a second account but not who holds the hash. Direction, not a fix: hold
  the BVN against others only from approval, or release it when Nuvion rejects, fails or suspends, or answer "being checked" instead
  of "already has a wallet".
- **D2 (defect, V2): an explicit `null` passes the required-field check.** Reproduction: `POST /money/wallet/open` with a valid body and
  `"gender": null` returns 200 and Nuvion receives `gender: "f"`; the same with `city`, `state`, `postalCode`, `idType`, `idNumber` or
  `proofOfAddressType` null returns 200 and Nuvion receives that field as `null` (`live/p-null.txt`, `p-odd.txt`). Cause: the optional
  DTO fields use `@IsOptional()` (null skips every validator) and `details()` tests `=== undefined`; `gender` is then mapped
  `'male' ? 'm' : 'f'`, so a null becomes female. A client sending `null` for an unselected picker is the likely caller. Omitting the
  field is correctly a 400.
- **D3 (defect, latent until NUV-03): a second rejection after a correction is not shown.** After a rejection and a correction the stage
  is `needs_documents` because `correctedAt` is later than `decidedAt`; `decidedAt` is refreshed only when the stored word changes. If
  Nuvion's review goes pending and then rejected again before the 30-second dispatcher reads the entity (the docs say the review is
  automatic, often within seconds), the handler reads `rejected` again, the word has not changed, `decidedAt` stays old and the person
  stays at `needs_documents` with a rejection nobody shows. Reproduction (`live/p-odd.txt` E1): reject, correct, set Nuvion's entity to
  rejected again (word unchanged), deliver `entities.updated`: `GET /money/wallet` still says `needs_documents`, `canResubmit` false.
  Direction: compare Nuvion's own `updated` times, or record the submit.
- **D4 (defect, identity): a correction moves the claim's BVN hash to a BVN Nuvion was never sent.** When the review named only a
  document, the correction sends no BVN or NIN (right), but `correct()` still writes the newly typed BVN's hash into the claim row.
  Reproduction (`live/p-review.txt` C2 and C3): reject on the document only, resend with a different BVN: the PATCH carries no number,
  the row's `bvnHash` changed, and a third account using that BVN gets `409 identity_has_wallet`. The record and Nuvion now disagree,
  and it is the same squat as D1 reached through an existing opening.
- **D5 (defect, low): a number Nuvion echoes in groups is logged and stored in clear.** `maskNuvionText` masks runs of 7 or more digits
  and `maskReviewWords` runs of 6 or more characters holding 4 digits; text such as "BVN 2221 0003 123 and NIN 3331-0003-123"
  (groups of 4 and 3) passes both. Reproduction: `live/p-odd.txt` E8 (the NuvionClient warning for a 422 carries the text, only the
  contiguous 11 digits masked) and `p-review.txt` R7b (`NuvionEntity.rejectionReasons` holds it). Unknown whether Nuvion echoes
  numbers at all; the rule in the brief is "never in the clear".
- **D6 (defect, low, V-check 6): "We will let you know when the review is done." has nothing behind it.** The sentence is
  `UNDER_REVIEW_MESSAGE`, now the live answer of `409 identity_under_review`. Nothing in `src/nuvion` or `src/money/opening` creates a
  notification, email or push when Nuvion approves, rejects or stops a person (no notification code in the diff). Either send one or
  reword to "Check again later".
- **D7 (defect, low, docs): the backend's contract docs and the gap row do not match the code.** `docs/contract/CONVENTIONS.md` has a
  reason-code table where NUV-07 added `fees_not_set` and `limit_reached`; `identity_under_review` is not in it, and no doc mentions
  `openingFlow`, `review` or the new body fields (0 hits in `docs/`). The builder report, SHARED-CHANGES NUV-02 #2 (c) and G-460 list a
  `nationality` field and "country" and "issuing country" as things the screens must send; the DTO has none (fixed to `NG` in the
  code). G-460 also omits that the app cannot send the raw BVN and NIN (see the G-460 paragraph).

**Unclear (needs the owner or the key)**

- U1: the scope says the BVN and NIN are "shown masked to the last 4". Under nuvion nothing shows them: after opening,
  `GET /money/identity` still answers `bvn: null`, `ninLast4: null` (no `WalletIdentity` row is written on this path). `live/p-null.txt`.
- U2: no attempt limit under Nuvion. Fintava capped BVN checks (3 a day) and selfie matches; here a refused create is `failed` and the
  next tap sends the BVN and NIN again, with only the global throttler between. Each refusal, correction or retry reaches Nuvion.
- U3: `POST /money/identity/bvn` (the first call the app makes) answers `503 provider_unreachable`, "We could not check your BVN right
  now. Try again in a moment.", `retryAfterSeconds` 30 under nuvion, because `checkIdentity` is `not_supported`. A permanent state is
  told as a transient one (NUV-01's mapping, seen here because G-460's first step hits it).
- U4: `GET /entities?name=` (how a lost create is looked for) is not in Nuvion's public docs. If Nuvion ignores the filter, a lost
  create with more than 1,000 children stays `unknown` (safe: never a second entity, but never settled either). Likewise where Nuvion
  puts refusal reasons: the code guesses seven field names, and the docs say "the rejection reason returned by the webhook", which the
  handler never reads because it acts on the re-read entity. Both are checks (key).
- U5: an opening whose answer was lost and whose webhook never arrives (Nuvion retries 15 minutes, then drops) stays `unknown`,
  "opening", until the person taps again; the sweep cannot settle it. That is NUV-08's missed-delivery job, not a NUV-02 defect, but
  nothing makes the person tap.
- U6: a date of birth of today is accepted and sent (no adult check here); Nuvion's review decides.

**Differs, with a recorded reason**

- 8 of 219 answers differ under `fintava` (and with the setting unset), main `dc3baa2` against the branch, same seeded data: all eight
  are bodies that carry one of the new optional fields (`gender`, `city`, ...). Main answers `400 property gender should not exist`;
  the branch accepts and ignores them under Fintava ("under Fintava they are ignored", G-460, task Scope). The other 211 answers (8
  accounts in 8 states, 12 GET routes, 11 open bodies, not-JSON, the BVN check, PIN reset, name check, no token, and an
  `entities.updated` delivery) are byte-identical, `Cache-Control` and `Content-Type` included (`live/sweep-main-*.json`,
  `sweep-branch-*.json`, `p-sweep.txt`). The opening rows after the runs are identical in both databases.
- The task text puts the entity create in `submitKyc`, the account in `openWallet` and the lookups "from `NuvionEntity`". Built: the
  create is in `openWallet`, the account request is in the `entities.updated` handler, `findCustomerByPhone` answers `unknown` and the
  sighting lookups `not_supported`, `getWalletAccount` stays in NUV-04's file. Reasonable (the seam's lookups are keyed by phone and
  `submitKyc` is NUV-03's submit), not in the builder's decision list; recorded here.

**G-460, the exact list.** What the app sends today (`src/features/open-wallet/api/opening.ts`): `firstName`, `lastName`,
`dateOfBirth`, `address` (one line), `checkHandle`; it keeps no BVN or NIN after A26 (G-72). Under nuvion the backend needs: `bvn` and
`nin` themselves (a `checkHandle` is `400` "Send bvn and nin with your details: this wallet is opened without a separate BVN check.");
`gender`, `city`, `state`, `postalCode`, `idType`, `idNumber`, `proofOfAddressType` (each required, a `400` naming the first missing, in
that order); optional `middleName`, `addressLine2`, `idIssueDate`, `idExpiryDate`; `address` is then the street line. Nationality,
country and issuing country are not fields (fixed `NG`). What the app sees today under nuvion: A26's `POST /money/identity/bvn` answers
`503 provider_unreachable` (U3), so a person never gets as far as the open call; if it did, a `400` as above; `GET /money/wallet`
answers 200 `not_open` with two extra fields the app ignores (`openingFlow` `review`, `review` null). The gap row is right about the
document and address fields, wrong about nationality, country and issuing country, and silent about the BVN and NIN and the BVN check
(D7).

**The decisions, judged**

1. `identity_under_review`, 409: right name and status, the old sentence kept. The sentence's promise is unbacked (D6), the code is
   declared only on `POST /money/wallet/open` although `walletProviderErrorToHttp` can answer it on any money route (V19 survives), and
   the doc table lacks it (D7).
2. `openingFlow` and `review` only under a reviewing provider, an absent flow meaning `check`: agree. The byte-identical Fintava answers
   confirm it; the contract marks both `nullable` although the server never sends `openingFlow: null`.
3. A rejected person's corrected details correct the same entity, the numbers only when the review named them: agree on the PATCH (one
   PATCH, no second entity, ten at once one PATCH). The "numbers only when named" part leaks into the claim (D4), and "starts again from
   the documents" hides a second rejection (D3).
4. An unknown Nuvion word reads `checking`: agree, safe in both directions (never approved or rejected on a guess); mutant V9 killed.
5. No phone-to-BVN match at launch, A14 only on Nuvion's own words: agree as the plan's default (owner question 4), but R-42's owner
   sentence "phone number should be verified with the BVN" is not met, and without any proof of ownership the BVN uniqueness becomes
   claimable (D1). The phone-word test is crude: any text with "phone" and "mismatch" or "differ" (even about different things) shows
   A14.
6. `provisioning` carries `review?`: agree, small and additive; `GET /money/wallet` reads the stored words, the carried review only
   feeds the first record.

**NOT RUN**

- (key) Capability checks 7 and 8 (a sandbox entity with the docs' example numbers reaches a decision, its time; the full
  `GET /entities/{id}` body after review, whether any field reports the BVN's phone). Unblocked when a lead brief allows
  `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`.
- (key) U4 and D3's cadence: whether `GET /entities?name=` filters, where Nuvion writes refusal reasons, and whether a quick second
  rejection arrives without a `pending` between. Same unblocking fact.
- The Open your wallet screens (G-460): none built, so no screenshots and no V5 or V7. Unblocked when a mobile task adds the fields and
  the stage states to the screens.
- Document upload, the selfie and the submit call are NUV-03; the account number is NUV-04; people outside Nigeria NUV-09; none
  exists, so "approved" ends at an account Nuvion holds and `GET /money/wallet` saying `opening`.

## Builder report, round 2

Builder, 9 Oct 2026 (a Sonnet session; round 1's builder and the verifier wrote none of this). Backend `wmt/NUV-02` `259e20a` (round 1's `9184ee0`, merged with backend main `dc3baa2`, then this round's commits); mobile `wmt/NUV-02` (this file, the contract copy, SHARED-CHANGES, BACKEND_GAPS, LOG). Stand-in only: no Nuvion, Fintava, wawuafrica.com or AI host was called. The live runs are the verifier's own phase scripts (`vnuv-02/live/`, copied and re-pointed at my worktree and databases) on built servers in a private network namespace (loopback only, Postgres through a unix-socket relay), the verifier's preload sending `api.nuvion.dev` to a stand-in on 127.0.0.1:5943 and refusing every other non-loopback host, and the real WAWU ID `fb8717e` (its own `npm ci`); ports 5941 to 5944 only. Databases `bn02r2_*`, all dropped at the end.

**The defects** (cause, fix, before and after. "Live" is the verifier's script on a built server, "spec" a named test in `src/nuvion/tests/nuvion-opening.contract.spec.ts`; on the unchanged code 36 of that file's 50 new tests failed, with the change all 87 pass)

- **D1, who holds a BVN.** Cause: `FintavaWalletOpening.bvnHash` is unique, the claim was taken before any proof of ownership and never let go, and the 409 said "already has a wallet". Fix (`src/money/opening/bvn-claim.ts`): the BVN is held only while the opening is with Nuvion (being made, documents needed, being checked) or approved; a rejected, failed or stopped opening lets go of it at once (the stored hash becomes `released:<user>:<hash>`, a value no other row can hold; a return to a held stage takes the hash back, and if another account holds it by then the opening is stopped with `bvn_held_by_another_account`, an approval opens nothing, and the person is told to contact support). Every writer of the opening state calls `alignClaim`: the create refused, the create's answer, a lost answer found, every delivery, a correction. One plain answer, `409 identity_has_wallet`, "We can't use this BVN or phone number for a new wallet. If it's yours, contact support.", the same whether the holder has a wallet or a check in progress; code unchanged. Before: live `p-review` C4 FAIL (Y refused with 409 for as long as the rejected squatter X existed); after: PASS (the real owner opens, 200). `p-open` O7 (a BVN held in review is refused, nothing sent) passes before and after. Specs: "X types Y's BVN and Nuvion rejects X", the three held stages, "a wallet and a check in progress are refused in exactly the same words", "Nuvion refusing the create releases the BVN", failed and suspended, "Nuvion approves an entity whose BVN another account has taken since".
- **D4, a correction moves the claim to a number Nuvion was never sent.** Cause: `correct()` wrote the typed BVN's hash into the claim whether or not the PATCH carried a number. Fix: the claim moves only in the step that sends the number. When the review named the BVN or NIN, both go and the claim moves to the BVN typed; otherwise no number goes, the typed number is ignored and the claim takes back the BVN Nuvion already has. The same rule for a lost answer sent again: the claim keeps the earlier number until a create really goes out (a `beforeCreate` hook the area runs after its look for the earlier entity found nothing). Before: live `p-review` C2 and C3 FAIL; after: PASS for C3 (the typed BVN is free for another account, 200) and for the PATCH in C2 (no BVN or NIN) (C2 compares the raw stored value, which changes from `released:<user>:<hash>` to `<hash>` by design when the BVN is taken back; the intent, that the typed number is not the claim, is what C3 shows). Specs: "a document-only rejection and a different BVN typed", "the BVN named as refused and a new one typed", "a correction cannot take a BVN another account holds", the three "lost answer retried" tests.
- **D2, a null in a required field.** Cause: `@IsOptional()` lets `null` past every validator and `details()` tested `=== undefined`; `gender` was `'male' ? 'm' : 'f'`, so null became female. Fix: the DTO turns `null` into a missing field for all 11 fields (the same plain 400 and message as an omitted one), `details()` also refuses `null`, and the area never guesses a gender. Before: live `p-null` 2 pass, 8 fail (7 of the fails are the nulls: each reached Nuvion as `null`, `gender` as `f`); after: 9 pass, 1 fail (the one is V9, U1 below): every null is a 400 "<field> is required to open this wallet" and nothing reaches Nuvion. Specs: the `D2` block (7 required fields, 4 optional, gender).
- **D3, a second rejection after a correction is not seen.** Cause: `decidedAt` moved only when the stored word changed. Fix: `isNewDecision` (`review-stage.ts`): a decision is new when it is the first, the word changed, or the same word came after corrected details with Nuvion's own `updated` time past the one recorded with the correction. The echo of our own PATCH has no later time and changes nothing, so "documents needed again after a correction" keeps working; with no `updated` time a decision after a correction is new (the lead's rule, literally). `decidedAt` is the database's clock, as `correctedAt` is. One nullable column in this task's own migration (`NuvionEntity.entityUpdatedAt`). Before: live `p-odd` E1 FAIL; after: PASS (the person is told `rejected` and may send again; `p-odd` 21 pass, 3 fail before, 23 pass, 1 fail after: the one left is `__proto__` and `constructor` keys, which are ignored and reach nothing, on main too, as the verifier said). Specs: the `D3` block and the pure `isNewDecision` table in `nuvion-opening-review.spec.ts`.
- **D5, numbers in groups.** Cause: `maskNuvionText` masked only contiguous runs of 7 digits. Fix: one pass masks a run of 7 or more digits with up to two spaces, dashes (also typographic) or dots between digits to the last 4, in the log and in what is stored (`maskReviewWords` calls it). Before: live `p-odd` E8 and `p-review` R7b FAIL; after: PASS (the stored words read `*******3123` for each of the three groupings, and the warning for a refused create carries none in the clear). Specs: the `D5` block and the pure mask table.
- **D6, the promise had nothing behind it.** Cause: no notification code in the diff. Fix: a new notification kind `identity_review` (`src/notification/notification-event.ts`; approved, rejected with what to fix, stopped; our own sentences; chip `other`; no Settings switch mutes it), written by the Nuvion opening handler once per decision after it is recorded (a compare-and-set on the word and the decision time, so a replay, a second delivery or several at once tell nobody twice), never with a BVN, NIN or ID number. At most once: it is written after the commit. The web's and the app's kind lists do not name the kind (G-490). Specs: the `D6` block (approved with seven deliveries, three at once; rejected with both numbers in Nuvion's text; a second rejection tells again; failed and suspended; nothing while it goes on; the person stopped by a taken BVN). Checked live after `p-review`: my own phase `p-notice` on a built server, three deliveries of each decision: before 0 notifications for approved, rejected and suspended; after exactly 1 each (the rejection carrying the BVN fix sentence, the suspension "Contact support and we will help."), 0 for pending, and no notification with four digits in a row.
- **D7, docs.** `docs/contract/CONVENTIONS.md`: the reason table gains `identity_under_review` and `step_not_used` and the new meaning of `identity_has_wallet` and `identity_checks_exhausted`; a new section 9a documents `openingFlow`, `review` and its stages, the body and its fields, who holds a BVN, the tries, decisions and notices. The round 1 builder report, SHARED-CHANGES NUV-02 #2 (c) and BACKEND_GAPS G-460 are corrected to the verifier's exact G-460 list: no `nationality` field (fixed `NG`), the BVN and NIN themselves are needed, and the app's first call `POST /money/identity/bvn` is now a permanent `409 step_not_used`, no longer a 503.
- **U2, the cap.** At most 3 opening tries a day per account that name a BVN or NIN: `BVN_CHECKS_PER_DAY` (the setting Fintava's BVN check had, PROVISIONAL, 3) and its ledger `BvnCheckAttempt` (outcome `opening`), a plain `429 identity_checks_exhausted` with `retryAfterSeconds`. A try is a request that takes the claim (first, after a refusal or a lost answer, a correction) or tries to and finds the BVN held (so the plain answer counts). Taps on an opening in flight or stopped, and requests refused before the claim, count for nothing. The limit is read before the claim and the try written after it; a held answer writes first and counts after, so a burst of probes at once learns it at most three times. Specs: the `U2` block (7 tests, one with 8 probes at once).
- **U3.** `POST /money/identity/bvn` answers `409 step_not_used` first thing when `capabilities.identityLookup` is false; nothing is hashed, counted or sent. Before: `503 provider_unreachable` "try again"; after: `409 step_not_used` (spec `U3`; the sweep below shows Fintava unchanged).
- **V4, V14, V19** (the verifier's surviving mutants) have specs now: "V4: an entity list longer than the pages read" (an endless list of cursors: nothing created, the opening waits, 10 pages read), "V14: a create that names an entity the person already holds another of" (a delivery adopts another entity while the create is in flight; the held id is never overwritten, the opening is `conflict`) and "V19: the seam maps `under_review` to 409 `identity_under_review` for any route" (the mapper itself). Each of the three mutants fails a spec (below).

**Rulings as built** (Default (lead), owner may override; the lead's rulings of 9 Oct 2026 for this round)
1. D1, D4: as above. 2. No existence oracle: one sentence for a BVN or phone another account holds, code `identity_has_wallet` kept and documented (CONVENTIONS section 3 and 9a), counted against the cap. 3. U2: 3 a day, a setting, a plain 429 with `reason`. 4. D2: as above, every field Nuvion needs. 5. D3: `decidedAt` is refreshed on every new decision and `canResubmit` follows the stage. 6. D5: as above. 7. D6: sent through the existing notification service; its vocabulary file is not fenced, so no shared-file change beyond the one every notification task makes. 8. D7: as above. 9. U3: `step_not_used`. 10. V4, V14, V19: as above. 11. The phone-to-BVN match (R-42) is not built (NOT RUN below, G-492).

**Decisions of mine** (Default (agent), owner may override)
- "Being checked by Nuvion" starts when the BVN is sent: a BVN is held from the claim (before the create goes out) through `incomplete`, `pending` and `approved`. The cost: an opening left at "documents needed" for ever holds its BVN for ever, and nothing sweeps it (G-491; the owner says how long).
- The held sentence names "BVN or phone number": one sentence for both unique keys, so a clash on the phone does not say it was the phone.
- The released value is `released:<wawuUserId>:<hash>` in the existing column, so the claim needed no schema change. The one new column is `entityUpdatedAt` (the migration changed in place; NUV-03 builds on this branch and will see the edit).
- An approval whose BVN is another account's now stops the opening (`stopped`, `bvn_held_by_another_account`, `review.stage` `stopped`), opens no account, answers the delivery `failed` for review and tells the person once (the stopped notice).
- `step_not_used` is a `409` (as `wallet_already_open`); the open's 429 reuses `identity_checks_exhausted` (the app already handles it).
- One notification kind with an `outcome`, not three; its copy avoids the words the notification module forbids (`wallet`, `withdraw`, `cash out`, `payout`).

**Checks** (backend `259e20a`)
- `npx tsc --noEmit` 0. eslint on the 20 changed `.ts` files 0. Key-shaped strings in the added lines: none.
- Specs: `src/nuvion/tests/nuvion-opening.contract.spec.ts` 87 tests (50 new; 36 of those failed on the unchanged code, all 87 pass), `nuvion-opening-review.spec.ts` 37 (22 new, pure). The touched modules (`src/nuvion src/money src/fintava src/wallet-provider src/kyc-submission src/notification`) in a private namespace at an earlier commit of this round: 67 suites, 2,265 tests passed.
- Full suite as three serial `--runInBand --shard=i/3` runs at `259e20a`, each in its own private network namespace and a fresh migrated and seeded database (copies of `t3ns/ns2.sh` and `inner2.sh`, `free -g` showed 8 to 12 GB available each time; the :4001 listener was mine alone before, during and after each: `ns/port4001-s1.txt` to `s3`): shard 1 74 suites, 2,754 tests passed; shard 2 73 suites, 1,597 passed; shard 3 73 suites, 1,483 passed and 4 skipped, with `hub-rate-limits.contract.spec.ts` (11 tests) failing inside the namespace as the common rules say it always does (it needs a non-loopback interface) and passing 22 of 22 on the host network. 220 suites, no assertion failure.
- Protected suite `run.sh --fresh HEAD` (namespace): 253/253 ("all 244 required tests passed"); the lock (`src/protected-routes`, `test/protected-routes`, the registry) has 0 diff lines against backend origin/main.
- Gates: 16 fail, 69 warn, 76 accepted, the same 16 FAIL file:line lines and the same 69 warn lines as main `dc3baa2` (my first run moved one existing FAIL line in `notification-event.ts` from 496 to 561 because the new kind was declared above it; it is declared below it now). No `PROVISIONAL` marker added. Tripwire on added lines: empty.
- `npm run contract:build` leaves `contract/openapi.json` unchanged after the regenerate commit. Against round 1 it adds only `step_not_used` in `MoneyErrorReason.code`, the `429` on `POST /money/wallet/open` and `step_not_used` in the 409 description of `POST /money/identity/bvn`.
- Mobile: the contract is copied from the branch (`contract/SOURCE_COMMIT` `wmt/NUV-02@259e20a`; `npm run api -- --backend` reads backend origin/main only, so as for FIX-24 the file is copied and `npm run api` regenerates the client; the copy is byte-equal to the branch's file). `npm run check` exit 0 (typecheck, lint, 95 suites and 1,606 tests, gates 0 fail 0 warn on 396 files, tasks).
- Fintava and unset, the verifier's sweep (`p-sweep`, main `dc3baa2` against the branch, same seeded data: 8 accounts in 8 states, 12 GET routes, 11 open bodies, not-JSON, the BVN check, PIN reset, name check, no token, an `entities.updated` delivery): 211 of 219 answers byte-identical under `WALLET_PROVIDER` unset and under `fintava`; the 8 that differ are the bodies carrying the new optional fields (main: `400 property gender should not exist`; the branch accepts and ignores them under Fintava, as in round 1). `POST /money/identity/bvn` is identical.
- Live phases, before (round 1 code, `e790fad`) and after (`p-null`, `p-odd`, `p-review`, `p-open`, my `p-notice`): 2 pass 8 fail to 9 pass 1 fail; 21/3 to 23/1; 36/4 to 39/1; 41/0 to 41/0; 2/3 to 5/0. What still fails after: V9 (U1, a BVN or NIN last 4 is shown nowhere under Nuvion; no ruling), the `__proto__` and `constructor` keys of `p-odd` (ignored by design) and C2's raw-value comparison (the stored form changes from `released:<user>:<hash>` to `<hash>` when the BVN Nuvion already has is taken back; C3 shows the typed number is free).
- Migration: changed in place (`entityUpdatedAt`); `prisma migrate diff` of the migrated database against the schema shows only main's existing GIN index drift; the stamp still sorts after main's newest (`20261016200000_points`).
- Backend main moved after my merge: `473b575` (NUV-04). A trial merge of it conflicts in `contract/openapi.json` (regenerate), `src/money/money-view.type.ts`, `src/money/opening/wallet-opening.service.ts` (NUV-04 and this task both edit `view()`; the call here is `this.reviewed.reviewOf(wawuUserId, opening)`) and `src/nuvion/tests/nuvion-adapter.spec.ts`. Aborted, nothing pushed of it; round 1 had the same overlaps with NUV-04, so the lead merges.

**Mutants** (my own, each applied alone and restored from a byte copy, the two NUV-02 specs run; log `mut/` in the scratch folder)
22 of 22 killed (log `mut/results.jsonl`). Identity rules: M01 a rejected opening keeps its BVN (5 tests fail); M02 failed or suspended keeps it (4); M03 a correction always moves the claim to the BVN typed (D4); M04 a lost answer retried moves the claim before the look for the earlier create; M16 an approval opens an account although the BVN is another account's; M22 a correction that cannot take the BVN still sends; M14 the claim is never aligned after a delivery (6). The cap: M05 a fourth try gets through; M06 no check before the claim; M07 a held answer is not counted (2); M08 the try is spent before the claim, so taps burn it (2). The mask: M09 grouped digits not masked (9). Nulls: M10 a null passes (5). Decisions: M11 a decision after a correction is never new (3); M12 the correction's echo counts as new (3); M13 no compare-and-set on the notice; M21 no notice written (6). Oracle: M17 the held answer names a wallet (8). U3: M15. The three gaps: M18 is V4, M19 is V14, M20 is V19.

**NOT RUN**
- (key) Capability checks 7 and 8 of round 1 (a sandbox entity with the docs' example numbers reaches a decision, and its time; the full `GET /entities/{id}` body after review), and U4 (does `GET /entities?name=` filter; where Nuvion writes refusal reasons). Unblocked when a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`.
- (key) D3's cadence, new in this round: on the sandbox, after `PATCH /individual-entities/{id}` on a rejected entity, does the entity's `updated` move, does `status` stay `rejected`, and does an `entities.updated` arrive for the PATCH itself; and after a resubmit, does a second rejection carry a later `updated`. If `updated` does not move on a decision, a quick second rejection is missed again; if Nuvion gives no `updated`, the rule falls back to "a decision after a correction is new" and the PATCH's own echo would bring the rejection back.
- (key) The phone-to-BVN match (R-42, G-492): the sandbox must show what `GET /entities/{id}` returns for an entity whose BVN's phone is not the entity's phone: a field carrying the BVN record's phone, or a verification word naming the phone (the field's name, and whether it is masked). Without one, the match is an owner question.
- The Open your wallet screens still send none of the new fields and still call the BVN step (G-460): no screen changed, so no screenshots and no V5 or V7.
- U1 (`GET /money/identity` shows no BVN or NIN last 4 under Nuvion; an owner question), U5 (an opening whose create answer was lost and whose delivery never arrives stays `opening` until the person taps again: NUV-08) and U6 (a date of birth of today is accepted): no ruling this round, unchanged.
- Document upload, the selfie and the submit call are NUV-03; the account number is NUV-04; people outside Nigeria NUV-09. For NUV-03: a return to review after a rejection takes the BVN back by itself (the delivery that reports `pending` calls `alignClaim`), and a person stopped for a taken BVN stays stopped.


## Owner sign-off
