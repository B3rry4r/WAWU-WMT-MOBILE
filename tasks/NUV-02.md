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

## Owner sign-off
