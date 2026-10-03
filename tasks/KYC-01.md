---
id: KYC-01
title: BVN check when someone opens a wallet
owner: YOU
area: KYC
order: 74
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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
- **Defaults (agent), owner may override:** NIN hashed+last 4 (taken on A26 with the BVN); address not held at all (to MONEY-12); prefill not kept (G-25); the verified phone stored (G-11); a failed later check keeps an earlier pass; checks that never reached the provider are given back; route under `/money/identity`.
- **Filed:** BACKEND_GAPS G-25 (new), G-11, G-17, G-20 updated; SHARED-CHANGES KYC-01 #1 (schema), #2 (`src/api`, contract from branch).

## Verifier report

Verifier, 2 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/KYC-01` `7a64a51` and mobile `wmt/KYC-01` `5776ac3`, each in a fresh detached worktree (`/home/user/wt/vk1b`, `/home/user/wt/vk1m`). **Main moved twice during verification**, so the branches were checked as they will land against the newest main: backend main `fdd9716` (INBOX-06) merged in, then `14a7fb2` (SETTINGS-07) on top; mobile main `ca6d6cb` merged in (all three local only, nothing of them pushed). My own databases `vk1_*` (dropped afterwards), ports 4771 (mock WAWU ID, then a harness serving its JWKS and a Fintava stand-in) and 4772 (built Hub), plus :4001 for the nine suites that hard-code it, only after `lsof` showed it free each time (my own mock, stopped after). Everything I started is stopped. **Verdict: PASS, no open defects.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend, merged with `14a7fb2`: `tsc --noEmit` 0; eslint (no `--fix`) on the 14 changed `.ts` files 0 (repo-wide 3642 errors are pre-existing, none in a KYC-01 file); gates 9 run / 584 files scanned / 16 fail / 6 warn / 76 accepted against main `14a7fb2` 16 / 4 / 76 on 576 files: the 16 failures are main's, line for line, and the 2 new warnings are the `PROVISIONAL(BVN-CHECKS-PER-DAY)` and `PROVISIONAL(BVN-CHECK-BURST)` markers (the builder's "3 -> 5" is now "4 -> 6": INBOX-06 added `CHAT-LIMITS`); `check_baseline.py` passes (108 entries); no gate, baseline or `.pipeline` file changed. Mobile with main `ca6d6cb` merged: `npm run check` exit 0: typecheck, lint, 17 suites / 289 tests, gates 9 run / 77 files scanned / 0 fail, 201 tasks. Key scan, my own scanner: the Fintava sandbox key (65 chars, compared from the file, never printed) and a 16-character fragment of it, PEM private keys, JWTs, Flutterwave and `sk_`/`pk_` keys, long bearer tokens, 64-hex strings and secret assignments: 0 hits in both branches' commits, both branch trees and both worktrees, except obviously fake fixtures in the specs (`k01-...-identity-hash-key-...`, `live_test_..._FAKEKEY`). |
| V2 Contract | passed | Full `test:contract` on a fresh migrated and seeded `vk1_contract_test` (merged with `14a7fb2`): **105 suites, 2054 passed, 0 failed, 3 skipped** (legal-intake's 3, as on main): 96 suites / 1968 against the mock on :4771 (`account` needs `WAWU_ID_BASE_URL_TEST`), plus the 9 that hard-code :4001 (`blocked-account`, `credits-state`, `kyc-submission`, `mentor`, `mentor-request`, `notification`, `partner-service`, `privacy-settings`, `saved-item`) 86/86 on :4001. The KYC-01 specs: 26 + 5 + 4 = 35 passed. The same run against the first merge (`fdd9716`): 95 + 9 suites, 1948 + 86 passed; `account`'s 5 failed only for want of `WAWU_ID_BASE_URL_TEST` and passed 5/5 when it was set. Contract: merged `openapi.json` regenerated with `npm run contract:build`; its paths are exactly main's 267 plus the 3 identity routes, every main path unchanged, every branch schema present; the only changed main schema is `MoneyErrorReason` (optional `checksLeft` added, 6 codes added to the `code` enum, no existing route answers them). Unexpected format: the account phone written `08031234412` through the real mock login matches a BVN record phone `0803 123 4412` (and `+234...` against `0...` in the builder's spec). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` on `vk1_protected_test`: **253/253, all 244 required**, on both merges (lock `fdd9716`, then `14a7fb2`); `.pipeline/protected-registry.json`, `src/protected-routes/` and `test/protected-routes/` unchanged. Migration: `20261002200000_wallet_identity` applied to a database already at main `14a7fb2` (after `20261002190000_free_chat` and SETTINGS-07's `20261002140000_notification_switches`): schema dumps before and after differ only by the two new tables, their primary keys and one index (0 lines removed); the migration header's rollback (`DROP TABLE` x2) gives back main's schema exactly; `prisma migrate diff` shows only the pre-existing `ContentPiece_specializations_idx` drift, as on main. |
| V4 Field trace | passed | `bvnHash`/`ninHash` (keyed HMAC): written by `POST /money/identity/bvn` on a pass, read only by `matchesCheckedIdentity` (no caller yet: KYC-02, MONEY-12). `bvnLast4`, `bvnVerifiedAt`, `ninLast4`: written there, read by `GET /money/identity` and the mobile `fetchWalletIdentity`. `occupation`: `PUT /money/identity/occupation` (409 before a pass), read by the GET (and named for profile tasks in G-17). `verifiedPhone` (E.164): written on a pass, no reader yet (G-11, MONEY-14). Prefill: answered once, stored nowhere (column scan below), typed as `BvnPrefill` for the app. `BvnCheckAttempt`: one row per counted check, read by the limit and `checksLeft`. Both tables OWNED in the purge map (`account-data-map.spec` passes). No screen reads any of it yet (KYC-03, KYC-05). |
| V9 Live seam | passed | Built app (`node dist/src/main.js` on :4772) against the mock WAWU ID on :4771: registered a new person with phone `08031234412`, signed in through `/auth/login` (no minted token), GET read `checksLeft: 3`; an A14 BVN answered 422 `bvn_phone_mismatch` with `checksLeft: 2`; a matching BVN answered 200 with the prefill; occupation stored; GET read back `bvn.last4 0001`, `ninLast4 0001`, `occupation Filmmaker`, `checksLeft 1`; a second person signed in read none of it. Fintava there was a local stand-in serving the documented `verify-bvn` shape (no sandbox BVN passes, question 11). |

**Capability checks**
- A valid sandbox BVN fills the A5 details: **passed against the documented shape; NOT RUN against a real sandbox record** (no BVN the sandbox accepts is known, `README.md` question 11; unblocked when Fintava names one). On the built app: name parts (`firstName`, `middleName`, `lastName`), date of birth answered `YYYY-MM-DD` from both `14-Mar-1994` and `1994-03-14`, gender `Male` -> `male`, `f` -> `female`; the photo is never passed on; `Cache-Control: no-store`. A5 shows "14 Mar 1994": formatting it is the screen's job (KYC-03).
- The full BVN is never stored or logged: **passed.** Every column of every table (823 columns) of the boot database after all scenarios scanned for every full BVN and NIN sent and the BVN record's phone: 0 hits. `WalletIdentity` holds 64-hex hashes that I recomputed as HMAC-SHA256 under the configured key over `bvn:<digits>` / `nin:<digits>` (a plain SHA-256 of the BVN does not match); `BvnCheckAttempt` holds only id, person, outcome, time. Logs of six real boots (production, no key, full config, Fintava unreachable, sandbox, V9), every line: 0 full BVNs or NINs, 0 BVN phones, 0 hash keys, 0 Fintava keys, including a Fintava refusal that echoed the BVN (logged as `*******0003`) and a malformed JSON body carrying one (answered 400 without echoing it, not logged). Missing `IDENTITY_HASH_KEY` with Fintava configured: 503 `provider_unreachable`, 0 calls to Fintava, 0 rows, one boot warning; a key under 32 characters stops the boot without printing it. Mutation check (my own 14, against the identity specs, baseline 35/35): all 14 killed: full BVN stored, plain SHA-256, BVN logged, the up-front key check removed, count-then-insert (TOCTOU), BVN phone in the A14 answer, first X-Forwarded-For entry, X-Forwarded-For trusted from any peer, phone comparison removed, non-Nigerian phone checked after the charge, refused check given back, `short` limit 3 -> 30, wallet-open check removed, prefill stored; the worktree was clean afterwards.
- A BVN whose phone differs from the one entered gives the A14 state: **passed against the stand-in; NOT RUN on a real record** (same reason). 422 `bvn_phone_mismatch`, "This isn't the number on your BVN. Use that one." (A14's words), `checksLeft` only: no name, no date, no digit of the BVN record's phone; a record with no phone is A14 too; nothing stored.

**Typed errors (built app):** unknown BVN 422 `bvn_not_confirmed` (counted); account phone `+44...` or no phone claim 422 `phone_not_nigerian` and wallet already open 409 `wallet_already_open`, both with 0 Fintava calls and 0 rows; Fintava unreachable (connection refused) 503 `provider_unreachable` with `retryAfterSeconds 30`, counted as `unavailable`; production boot with no settings 503 (below); no token 401; `wawuUserId` in the body 400; a 12-digit BVN 400 "bvn must be 11 digits".

**The charge limit:** 3 per person per 24 h in the database: 10 checks fired at once for one person, each from its own address so only the database limit applies, 5 rounds: Fintava calls 3, 2, 1, 0, 0 and rows to match, **never more than 3**. Per address on the real global guard: the 4th within a minute from one nginx-appended address is 429 with Fintava at 3 and no row counted, whatever the caller writes in front of it; another address at the same moment 422; 21 checks from one address at 3 a minute: 20 reach Fintava and the 21st and 22nd are 429 (`medium` 20/h, run over 7 minutes). The route's metadata names only `short` and `medium` (the builder's spec, and mutant 12).

**Rule 6:** passed. `NODE_ENV=production`, no `FINTAVA_*`, no `IDENTITY_HASH_KEY` (`CORS_ORIGIN`, `FLUTTERWAVE_SECRET_KEY` and `WAWU_ID_INTERNAL_SERVICE_KEY` set to dummies: main refuses a production boot without them, unchanged here): boots, `/api/hub/health` 200, the BVN check 503 `provider_unreachable` with 0 calls out and 0 rows, `GET /money/identity` 200. Migration: see V3.

**Sandbox:** 1 BVN lookup, the docs' example BVN (last 4 `0003`, from `reference/create-customer-copy.md`), through the route on the built app against `https://dev.fintavapay.com/api/dev`, 20:28:59 UTC: 422 `bvn_not_confirmed` in 2.69 s, `Cache-Control: no-store`, `checksLeft 2`, GET then `bvn: null`; one log line `verify BVN: identity_refused HTTP 400 "Invalid BVN or BVN does not exist"`; the full BVN and the key appear 0 times in the log. No balance read, no live call.

**Rulings on the builder's defaults** (Default (agent), owner may override), all accepted: NIN keyed-hashed with the last 4 kept (lets MONEY-12 check the NIN it is sent without storing it; the last 4 is what a screen may show); the prefill not stored (the ticket's "store only" list; G-21 records what MONEY-12 does instead); the verified phone stored (it is the account's own phone, not BVN-record data, and G-11 needs the proved number); routes under `/money/identity` (beside `/money/pin` and `/money/balance`, behind WAWU ID, caller from the token). Also accepted: a later failed check keeps an earlier pass; checks that never reached the provider given back (but see note 3).

**OPS-11 merge note (pass 4):** I ran the branch's compiled `bvnCheckTracker` in an Express app under four `trust proxy` settings, with requests through loopback (as nginx) and from a non-loopback address (192.0.2.2, as a direct caller). No setting (today): through nginx the tracker is the nginx-appended address and a forged prefix is ignored; a direct caller is its own address and its X-Forwarded-For is ignored. Safe on its own. OPS-11 as built (`a0eb924`, `hubTrustProxy`: hop 0 and loopback only): `req.ip` is the nginx-appended address and the tracker equals `req.ip` in every case; nothing becomes forgeable, and the tracker is redundant (G-20 already says it can go). The tracker reads `req.ip` first, so it inherits whatever `trust proxy` says: with `true`, a forged left-most entry through nginx becomes the bucket (`6.6.6.6`), and with `true` or a bare hop count `1`, a direct caller picks its own bucket. **For OPS-11:** keep the hop-0-and-loopback function; never `true` or a hop count. Once it lands, `bvnCheckTracker` can be deleted (a follow-up, not needed for safety).

**Findings** (none is a defect)
1. Merge note, mobile: main `ca6d6cb` (SETTINGS-07) took `G-21` to `G-24` in `BACKEND_GAPS.md`, so this branch's new `G-21` (account opening) collides and conflicts. On the next merge of main, renumber it (`G-25` is free) and update the two references in this task's builder report. `contract/*`, `src/api/schema.generated.ts` and `docs/PROGRESS.md` also conflict: regenerate them (section 8.5). I checked the regeneration: the branch's types reproduce byte for byte from its contract, and after regenerating from the merged backend contract every KYC-01 path and schema (`WalletIdentityView`, `CheckedBvnView`, `BvnPrefillView`, `BvnCheckView`, `BvnCheckDto`, `IdentityOccupationDto`, `MoneyErrorReason`) is identical to the branch's, and main's paths are unchanged. So `npm run api -- --backend ../wawu-backend` after the backend merges reproduces them, with main's newer paths beside them. Backend: `prisma/schema.prisma` and `contract/openapi.json` conflict with `fdd9716` (keep both model blocks; `npm run contract:build`), and `14a7fb2` then merges cleanly.
2. Note, concurrency (safe side): when 4 or more checks for one person arrive at the same moment from different addresses, the insert-then-count can let fewer through than are left, and the refused ones answer 429 `identity_checks_exhausted` with `retryAfterSeconds` 86400. Measured: 4 at once with none used let 2 through, and GET then showed 1 left. A concurrent answer that does pass can also report `checksLeft` one or two low. The cap is never exceeded, and one phone (one address) cannot send more than 3 a minute. KYC-05 should disable Continue while a check is running. A per-person advisory lock would make it exact if the owner wants that.
3. Note, the "given back" default is narrower in code than in words: a check that fails because Fintava could not be reached at all (connection refused) is counted (`unavailable`), although nothing reached the provider. The client reports that and a timeout (which may have been charged) as the same kind, so counting both is the cost-safe reading. Worth one line in the defaults list.
4. Not a stand-in: `src/api/walletIdentity.ts` has its own private `Envelope<T>`, the same one-line alias `src/api/money.ts` keeps unexported on main, pending SHARED-CHANGES row 11 (MONEY-11's, open), which removes both. Nothing on main can be imported in its place.

Files checked against the report: the backend's 22 files and the mobile's 13 match the builder's list; nothing missing or extra.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

**Lead at merge (2 Oct 2026):** backend PR #32 merged as d27ad37 (the verifier's tested merge of main 14a7fb2). This task's new gap row is BACKEND_GAPS **G-25** (it was G-21 on the branch; main's SETTINGS-07 had taken G-21 to G-24). Contract re-synced from backend main.
