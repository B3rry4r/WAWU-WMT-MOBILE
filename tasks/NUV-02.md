---
id: NUV-02
title: Open a wallet on Nuvion: the person, BVN and NIN, review, approved or rejected
owner: YOU
area: MONEY
order: 201
priority: launch
repo: wawu-backend
type: third-party
status: todo
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

- [ ] A person with BVN, NIN, date of birth, address and ID details can start opening: one child entity is created, and `GET /money/wallet` tells them what is still needed.
- [ ] Tapping open twice, or a create whose answer is lost, still leaves one entity (the opening is recorded before the call and checked before any retry) (V8).
- [ ] An `approved` delivery, re-fetched first, creates exactly one NGN checking account, also when replayed or delivered twice at once (V8).
- [ ] A `rejected` result tells the person the reason in plain words and what to fix, and they can submit again; `failed` and `suspended` stop money routes with the existing no-wallet answer.
- [ ] No BVN or NIN appears in the clear in a log line, a response or a stored column (the spec scans logs and rows).
- [ ] Under `fintava` the opening behaves exactly as before (existing opening specs pass unchanged).
- [ ] (key) A sandbox entity with the docs' example identity numbers reaches a decision; the time it took is in the report.
- [ ] (key) The full `GET /entities/{id}` body after review is in the report (identity numbers masked), saying whether any field reports the BVN's phone.

## Builder report

## Verifier report

## Owner sign-off
