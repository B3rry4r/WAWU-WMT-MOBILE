---
id: NUV-03
title: ID document, proof of address and the hosted selfie, then submit for review
owner: YOU
area: MONEY
order: 202
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [NUV-01, KYC-02]
decisions: [R-39, R-42]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# NUV-03 · ID document, proof of address and the hosted selfie, then submit for review

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- Nuvion's docs, saved in the lead's scratchpad `nuvion/docs/` (one Markdown file per page; `llms-full.txt` has them all), and the lead's scratchpad `nuvion/NUVION-RESEARCH.md` and `nuvion/SANDBOX-FINDINGS.md` (what Nuvion's dashboard code shows beyond the public docs; the sandbox key answered 401 on 7 Oct); for this task: `api-reference__entities.md` (documents and onboarding submissions), `core-concepts__entities.md`, `quickstart.md`; SANDBOX-FINDINGS items 4 and 5

## Goal

Opening a wallet adds an ID document (front, and back where it has two sides) and a proof of address dated within
3 months, as R-42 rules and Nuvion requires, and Nuvion's hosted selfie if its API can start one for our people
(R-39). When both documents are in, the opening is submitted for review once.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- KYC-02 (done, selfie match to the BVN photo): rewired. Under `nuvion` there is no selfie match; the hosted selfie replaces it, or the step is dropped if the API cannot start it for a child entity (R-39). Fintava's path is kept for rollback.
- WALLET-24 (proof of address, after launch) and WALLET-34 (admin proof-of-address review queue, after launch): obsolete. Proof of address is now required at opening and Nuvion reviews it.

## Scope

- New Hub routes, signed in, own opening only: `POST /money/identity/documents` (multipart: `kind` `identity` or `proof_of_address`, `side` front or back, a PDF, JPG, JPEG or PNG up to 10 MB), `GET /money/identity/documents` (each kind's state), `POST /money/identity/liveness` (starts the hosted selfie; answers the page URL; `redirect_url` back to the app or the website), `GET /money/identity/liveness` (the result).
- `src/nuvion/areas/documents.ts`: `POST /documents` (base64 `file` and `file_back`, `key`, `description`, `meta.file_type`, `link_to_identity.person_id`, the child's `entity_id`), and `POST /onboarding-submissions` once both documents are accepted (and the selfie finished when `hostedLiveness` is on).
- `src/nuvion/areas/liveness.ts`: `POST /kyc/liveness/sessions` and `GET /kyc/liveness/sessions/{id}` (from Nuvion's dashboard code, not the public docs); the session id saved on the entity as `meta.liveness_check_id`.
- Storage, Default (agent), owner may override: the file goes to Nuvion and WAWU keeps no copy; we keep kind, side, state, Nuvion's document id and the time. The new table is decided in `data-export-sections.ts`.
- Not in scope: the entity (NUV-02); the screens (cut from the round 2 Open your wallet boards; the website's in WEBPAY-01).

**Stand-in, not the sandbox.** The Nuvion sandbox key does not work yet (401). Every spec runs against the Nuvion stand-in that NUV-01 builds (`test/nuvion/nuvion-standin.ts`, from the docs' own request and response examples). No spec or run calls `api.nuvion.dev`, `api.nuvion.co`, any Fintava host or any wawuafrica.com host. Checks marked **(key)** need the sandbox: until a lead brief allows `api.nuvion.dev` and `GET https://api.nuvion.dev/bank-codes/NG` answers 200 with the key in the local `.env`, the verifier reports them NOT RUN with that fact. Everything else is built and verified now.

## Capability checks

- [ ] A person can upload an ID front and back and a proof of address; each is forwarded once to Nuvion, linked to their person; a file over 10 MB or of another type answers 422 before any call.
- [ ] When both documents are accepted the opening is submitted for review exactly once, also when the last upload is sent twice (V8).
- [ ] A person cannot read, replace or submit another person's documents (404); an upload with no opening started gets the existing no-wallet answer.
- [ ] A person can start the hosted selfie, come back, and the opening reads its result (approved, not approved, still pending); when the stand-in refuses a session for a child entity, `hostedLiveness` is off and the opening goes on without a selfie (R-39).
- [ ] WAWU keeps no document content (the spec reads the tables and the storage bucket after an upload).
- [ ] (key) `POST /kyc/liveness/sessions` with a child `entity_id` works with an API key, or the report records that it does not and the selfie step stays off.
- [ ] (key) Two small PNG uploads and a submission reach a sandbox decision.

## Builder report

## Verifier report

## Owner sign-off
