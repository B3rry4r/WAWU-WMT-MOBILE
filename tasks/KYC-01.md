---
id: KYC-01
title: BVN check when someone opens a wallet
owner: YOU
area: KYC
order: 72
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-06]
decisions: [R-6]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# KYC-01 · BVN check when someone opens a wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Identity is checked when someone first opens a wallet or touches money, never at sign-up (R-6). The BVN confirms who they are and fills in their details (A5).

## Scope

Fintava's BVN lookup (`GET /compliance/verify/bvn`) through the backend's Fintava client (MONEY-06; WAWU ID keeps only the account), prefill name, date of birth and gender, store when it was verified plus a hash and the last 4 digits only. The full BVN and NIN go to account opening (MONEY-12) in the same flow and are never stored in full.

Occupation, typed on A5, is stored here (AUTH-03 no longer stores it).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`GET /compliance/verify/bvn?bvn=` returns name, date of birth, phone, gender and a photo. State and occupation are not in it: the user types them on A5. Fintava also needs the **NIN and a full address** to open the account (MONEY-12), so this step collects them.

## Capability checks

- [ ] A valid sandbox BVN fills the A5 details.
- [ ] The full BVN is never stored or logged.
- [ ] A BVN whose phone differs from the one entered gives the A14 state.

## Builder report

Backend `wmt/KYC-01` `7a64a51` (main `2b407e7` merged); mobile `wmt/KYC-01`.
- **Backend:** `src/money/identity/` (controller, service, config, DTOs, views, 3 specs), migration `20261002200000_wallet_identity` (`WalletIdentity`, `BvnCheckAttempt`, OWNED in the purge map), 6 new money codes + `reason.checksLeft`, contract regenerated, CONVENTIONS section 8, WALLET.md, `.env.example`, deploy README, `scripts/local/up.sh`. Routes: `POST /money/identity/bvn` `{bvn, nin}`, `GET /money/identity`, `PUT /money/identity/occupation`, all behind WAWU ID, caller from the token.
- **Mobile:** `src/api/walletIdentity.ts` + `src/__tests__/wallet-identity.test.ts`; types generated from the branch contract (SHARED-CHANGES KYC-01 #2); `docs/fintava/sandbox/28-kyc01-bvn-check.md`. No screen (A26/A14 are KYC-05's, A5 KYC-03's).
- **Prefill:** a passed check answers name, date of birth (`YYYY-MM-DD`, NIBSS `14-Mar-1994` read too) and `male`/`female`, once, unstored; tested over HTTP against the double's documented body.
- **Never stored or logged:** stored = HMAC-SHA256 (key `IDENTITY_HASH_KEY`) + last 4 of BVN and NIN, `bvnVerifiedAt`, matched phone (E.164), occupation. Tests: every text column of every table scanned for the full BVN/NIN (0 hits); stdout, stderr, console and Nest logger captured for the whole file, plus every answer, incl. a Fintava refusal echoing the BVN: 0 hits for BVN, NIN, BVN phone, key.
- **A14:** BVN phone != account phone (or none) -> `422 bvn_phone_mismatch`, A14's sentence, no name, no phone digits, nothing stored. Non-Nigerian account phone -> `422 phone_not_nigerian` before any charge.
- **Isolation:** 401 on all three without a token; `wawuUserId` in a body is 400; B reads/changes nothing of A's.
- **Throttle (PROVISIONAL):** 3 checks/person/24 h in the DB (race-safe: 6 parallel -> at most 3 reach Fintava), `429 identity_checks_exhausted`; per address `short` 3/min and `medium` 20/h through AppModule's real guard (4th -> 429, Fintava saw 3), counted per caller behind nginx (`bvnCheckTracker`, G-20).
- **Production boot:** AppModule with `NODE_ENV=production` and no FINTAVA_*: boots, check -> typed 503, nothing sent or counted. No key -> 503 too.
- **Mutations (17):** phone compare, plain hash, full BVN stored, BVN logged, limit off, prefill leak on A14, guard removed, occupation without check, `@Throttle` on `default`/removed, tracker x3, boot path: all killed. Two boot mutants survive by design (two independent 503 paths).
- **Runs:** tsc 0; eslint 0 on changed files. Full `test:contract` fresh `k01_full_test`: 96 suites, 1937 passed, 3 skipped, 0 failed. Protected `--fresh` `k01_protected_test`: 253/253 (244 required), lock unchanged. Gates 16 fail before (main) and after, same lines; warns 3 -> 5 (the two PROVISIONALs). Mobile `npm run check` exit 0 before (16 suites, 285 tests, gates 0 on 75 files) and after (17 suites, 289 tests, gates 0 on 77 files).
- **Sandbox:** 2 BVN lookups, both the docs' example `*******0003`: client direct 400, route `422 bvn_not_confirmed`, charged ₦5, BVN in 0 log lines.
- **NOT RUN:** a passing BVN and A14 on a real record (no sandbox BVN known, question 11); 6 suites hard-coding :4001 (kyc-submission, notification, blocked-account, privacy-settings, saved-item, credits-state); a first full run reached :4001 by login before I excluded them.
- **Defaults (agent), owner may override:** NIN hashed+last 4 (taken on A26 with the BVN); address not held at all (to MONEY-12); prefill not kept (G-21); the verified phone stored (G-11); a failed later check keeps an earlier pass; checks that never reached the provider are given back; route under `/money/identity`.
- **Filed:** BACKEND_GAPS G-21 (new), G-11, G-17, G-20 updated; SHARED-CHANGES KYC-01 #1 (schema), #2 (`src/api`, contract from branch).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
