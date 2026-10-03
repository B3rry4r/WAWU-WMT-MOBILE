---
id: MONEY-12
title: Open a Fintava account when someone opens a wallet
owner: YOU
area: MONEY
order: 79
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [MONEY-06, KYC-01, KYC-02]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-12 · Open a Fintava account when someone opens a wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A8: when a user finishes Open your wallet, they get their own Fintava account (R-6: never at sign-up).

## Scope

Account opening after BVN, NIN and address, safe to retry, a visible 'still opening' state, the account number shown on W1.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /create/customer` requires first and last name, phone, email, `fundingMethod: STATIC_FUND`, address, date of birth, BVN **and NIN**, and returns the account number at once. Store customerId (`userInfo.id`), walletId (`wallet.id`) and the account number. There is no tier in the API: open a normal account; limits are a question for Fintava.

## Capability checks

- [ ] A sandbox user who finishes Open your wallet has an account number that Fintava also reports.
- [ ] Retrying a failed opening never opens two accounts.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-12` `d056461` (on main `e8535d8`); mobile `wmt/MONEY-12` (on main `176a56d`). Neither main moved.
- **Backend:** `src/money/opening/` (controller, `WalletOpeningService` with a 30 s sweep, config, `OpenNairaWalletDto`, 2 specs); migration `20261003100000_wallet_opening` (`FintavaWalletOpening`, `FintavaWallet.accountName`, OWNED in the purge map); client `lookupCustomerByPhone`, `listCustomerSightings` (+ spec, + stall list); `WalletIdentityService.checkedIdentity`, `SelfieMatchService.matchedFor`; 3 codes (`selfie_required` 409, `identity_has_wallet` 409, `account_not_opened` 422); balance answers `409 wallet_opening`; GET `/money/wallet` moved from the declarations; contract, CONVENTIONS section 9, WALLET.md, `.env.example`, deploy README. Mobile: contract and types from the branch, sandbox `32-`, `naira-api.md`, gaps, shared changes.
- **Routes:** `POST /money/wallet/open` (BVN, NIN, A5's name and date of birth, address) and `GET /money/wallet` (`not_open` / `opening` / `open` with Fintava's account number and name), token-keyed, `no-store`.
- **Identity read once (G-25):** `checkedIdentity` compares BVN and NIN (NIN required) in one read and returns that check; the selfie must have matched exactly it (`matchedFor`); the opening records it. Tested with a check for another BVN passing right after the read (opens with the checked and matched BVN, tied to it) and B's BVN with only A's selfie (409).
- **Check 2, a retry never opens two:** per-person row claimed before anything is sent, re-checked just before the create; BVN hash and phone unique across accounts; Fintava asked by phone before every create. Lost answer (timeout, 5xx, unreadable 2xx, "already exists") is `unknown`, shown as opening, reconciled by the next request and the sweep: found by details or the newest-first list is recorded; "not created" only on Fintava's `404 ["Customer not found"]` AND no list row AND money timeout + `FINTAVA_RESEND_SAFETY_MS`. Tests: 15 taps in two waves while the create is in flight (1 create); late 201, 5xx after creating, unreadable 2xx (1 create each); nothing made (waits, then exactly one more create); `{}`, `data: null`, other 404s, 500, slow, list failing, list rows without time, list never reaching the attempt (all wait, nothing sent); sweep for a stopped server; concurrent reconcilers; existing customer adopted; one held by another account (409); a second WAWU account with the same BVN and phone (409). 16 mutants, all killed.
- **Check 1, sandbox:** route against the real sandbox opened account `1192964482`, `GET /customers/{id}` reports the same ids; repeat sent nothing; 5 calls, documented example data, BVN check and selfie seeded as stand-ins (`docs/fintava/sandbox/32-money12-account.md`).
- **Never stored or logged:** no BVN, NIN, address or date of birth in any column (spec and the sandbox database, 512 columns) or log line; 0 of 58 key windows in logs, answers, notes and each staged diff.
- **Runs:** tsc 0; eslint 0 on the 21 changed `.ts` files; Fintava, money, identity, purge, rate-limit specs 26 suites 1,145/1,145 (`m12_test`, stand-in WAWU ID :4902); full `test:contract` on fresh seeded `m12_full_test` (my mock on :4001, `lsof` free before, stopped after): 119 suites, 2,878 passed, 3 skipped, 1 failed (`money-contract` needed the two served routes listed, fixed in `d056461`, then 11/11); protected `--fresh HEAD` 253/253, all 244 required, registry sha256 `767e27bf...` unchanged; tripwire 0 added lines; `hub-rate-limits` 10/10 (no `@Throttle` added); gates main 16 fail / 8 warn, branch 16 / 9 (the one added warn `PROVISIONAL(WALLET-BANK-NAME)`), baseline OK; `contract:build` byte-stable. Mobile `npm run check` exit 0 before (main) and after: typecheck, lint, 19 suites 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks.
- **Defaults (agent), owner may override:** name, date of birth, address are the app's copy, never stored; phone is KYC-01's verified phone, email the token's (none: 422); one BVN and one phone per wallet across WAWU accounts; an unheld Fintava customer for the phone is adopted, not duplicated; a refusal saying the customer exists counts as lost; validation and identity refusals 422, merchant gate, key, rate limit and others 503, all `failed` (new attempt allowed); list scan 10 pages of 100 with 5 min clock skew, recheck at most every 15 s, `opening` stuck after 2 reads + money timeout + 60 s; bank "Loma Bank" (PROVISIONAL), code `090620`, licence lines from config (null hides); `limits` null, `bankTransfers` allowed when open (R-28), `beneficiaryCount` 0 until WALLET-14; `frozen` not answered (no Fintava call on GET); POST always 200, state tells.
- **Filed:** BACKEND_GAPS G-25 and G-12 updated, G-36 (BVN uniqueness lost on account deletion), G-37 (`conflict` openings have no admin view); SHARED-CHANGES MONEY-12 #1 (schema), #2 (contract from branch).
- **NOT RUN:** the whole Open your wallet against the sandbox (BVN check, selfie, open for one person): unblocked when Fintava names a sandbox BVN its check passes (question 11) and shows its real selfie success body (question 6, G-25). A lost create against the sandbox: cannot be provoked; proved against the stand-in. Whether Fintava refuses a repeated phone: not tried (one customer only). V10: no screen (KYC-03, WALLET-01). CI's `ci-check.sh`: tripwire and lock checked by hand; unblocked by the pull request's CI run (no PR opened, by instruction).

## Verifier report

Verifier, 3 Oct 2026. This is a fresh session that wrote none of MONEY-12's code. I checked wawu-backend `wmt/MONEY-12` `d056461` (on main `e8535d8`) and mobile `wmt/MONEY-12` `3b500ab` (on main `176a56d`), in fresh detached worktrees `/home/user/wt/vm12b` and `/home/user/wt/vm12m`. Backend main did not move (`origin/main` still `e8535d8`), so no merge with main was needed. A local merge with `wmt/MONEY-08` `0eb32a9` (`/home/user/wt/vm12mg`, never pushed) was checked too.

- **Databases:** `vm12_test`, `vm12_contract`, `vm12_main`, `vm12_hub`, `vm12_protected_test` and `vm12_merge_test`, all dropped afterwards.
- **Ports:** built Hubs on :4921 and :4923 (one database), stand-in WAWU ID :4922, my Fintava stand-in on an OS-assigned 127.0.0.1 port. :4001 only for the 4 suites that hard-code it: `lsof` was empty before, my mock ran there, then it was stopped and `lsof` was empty after.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/ev/` (logs, JSON results), `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/sbx/` (sandbox calls, masked), `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/live/` (stand-in, Hub boot and drive scripts), and my attack spec `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/vm12-attack.contract.spec.ts`. The attack spec reuses the builder's harness, but its stand-in returns `userInfo.bvn` and `dateOfBirth` on reads, as the real sandbox does. It was run from the backend worktree and removed again; nothing of it is committed.

**Verdict: 1 open defect (D1). Status `building`.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | **Backend:** `tsc --noEmit` 0; eslint 0 on the 21 changed `.ts` files (`tsc-branch.txt`, `eslint-branch.txt`). Gates: main `e8535d8` 9 run / 608 files / **16 fail / 8 warn** / 76 accepted; branch 9 / 615 / **16 / 9** / 76. The only added finding is `PROVISIONAL(WALLET-BANK-NAME)` (`g-main.lst`, `g-branch.lst`). `check_baseline.py`: 108 entries OK. **Diff against the report:** every file the builder lists is in `git diff --stat`, and nothing extra. **Mobile:** `npm run check` exit 0: typecheck, lint, 19 suites / 345 tests, gates 9 run / 90 files / 0 fail / 0 warn, 202 tasks (`mobile-check-branch.log`). |
| V2 Contract | **failed (D1)** | **Full `test:contract`** on a fresh migrated and seeded `vm12_contract`: 119 suites, 2,882 tests (`contract-full.json`). 2,595 passed, 3 skipped, 284 failed: <br>- 244 are the protected suite, which refused the database name (it needs "test" in it). It passes run on its own (V3). <br>- 40 are the 4 suites that hard-code :4001. With my mock there they pass **40/40** (`contract-4001.log`, `lsof-4001-*.txt`). <br>So 2,879 passed, 3 skipped, 0 failed. **Inside the run:** `wallet-opening` 53/53, `wallet-opening-production-boot` 3/3, `fintava-customer-lookup` 16/16, `fintava-stall` 114/114, `money-contract` 11/11, `money-identity` 26/26, `selfie-match` 182/182, `money-balance` 14/14, `account-data-map` 4/4, `hub-rate-limits` 10/10. The builder's opening specs alone on `vm12_test`: 3 suites, 72/72 (`builder-opening-specs.log`). **Contract file:** `contract:emit` + `contract:enrich` rebuild `contract/openapi.json` byte for byte (sha256 `45061de3...`), equal to mobile's copy. `sync_contract.py` regenerates `openapi.mobile.json` and `schema.generated.ts` with no diff. **Merge with MONEY-08:** clean (`.env.example` auto-merged), tsc 0, opening + lookup + ledger + balance + money-contract specs 10 suites 160/160 (`merge-money08.txt`, `merge-money08-specs.log`). **Migration:** additive (one nullable column, one table, three indexes). It applies on a fresh database and on one migrated to main first; the schema drift afterwards is main's own (`ContentPiece_specializations_idx`), identical in all three cases (`drift-*.sql`). **Failed** because of D1: the opened account must be the person's own. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh d056461` (`vm12_protected_test`, lock `origin/main` `e8535d8`): **253/253, all 244 required** (`protected-branch.log`). `lock-diff.py e8535d8 d056461`: "No change". `protected-registry.json` sha256 `767e27bf...` on main and branch. CI tripwire, run as `ci-check.sh` runs it: **0 of 3,088 added lines** match (`outside.diff`). |
| V4 Field trace | **failed (D1)** | The account number and name are written by the open (Fintava's answer) into `FintavaWallet` and read by `GET /money/wallet` (A8, W1, W15) and the balance (`walletId`); `accountName` is backed by A8 and W15, which draw it. Across people it fails: with D1, one person's Fintava account number and name reach another person's A8/W15, and that person's balance reads the other's wallet (live `adopt`, `live-adopt.txt`). |
| V6 States | passed | Each state was reached through its real cause, in specs and on the built Hubs: <br>- `not_open`, then `open`; `opening` while a create is in flight or its answer is lost, also after a server was killed mid-create; <br>- `failed` back to `not_open` once proved absent; <br>- `409 bvn_not_checked`, `selfie_required`, `identity_has_wallet`; `422 account_not_opened` (no email); `503 provider_unreachable` (lookup unreadable); `400` (NIN missing or empty); <br>- balance `409 wallet_opening` while opening and `409 wallet_not_open` before; `401` without a token on both routes. <br>(`attack-run2.log`, `live-*.txt`) |
| V7 Flow walk | passed (backend); screens NOT RUN | **Built Hubs, real sign-in** (`/auth/register` then `/auth/login` on the stand-in WAWU ID, no minted token): BVN check, selfie, `GET /money/wallet` `not_open`, open, `open`. **Resume:** Hub A was killed 1.2 s into a create that Fintava made, and restarted. A tap 10 s later answered `opening` and sent nothing. Hub B's sweep recorded the account 71 s after the kill: one create in all (`live-restart-*.txt`, `hub-4923.log`). Unverified: `bvn_not_checked`. The screens (KYC-03, WALLET-01) are not built: NOT RUN below. |
| V8 Money | **failed (D1)** | **One create per person under every race I tried** (table below). **Failed** because of D1: a person can be handed another person's Fintava account. Money sent to "their" account number then lands in someone else's account, and money already in that account becomes spendable by the wrong person. PIN, insufficient funds, webhook and reversal do not apply to an opening. |
| V9 Live seam | passed | Built branch Hub (`node dist/src/main.js`, :4921 and :4923 on `vm12_hub`), signed in through the stand-in's real login. The route answered account `1137204581`, which only my Fintava stand-in had made: the same number on both Hubs. The two `GET /money/wallet` reads made **0 Fintava calls**; all answers were `no-store`; a second open sent nothing (`live-v9.txt`). |

**Races: one person, one account.**

| Case | Result | Where |
|------|--------|-------|
| 24 opens at once, alternating two real Hubs, create answered after 2.5 s (money timeout 1.5 s), then 10 more | 24 `opening`, then 1 `open` + 9 `opening`; **1 create** | `live-race.txt` |
| 3 WAWU accounts with the same BVN and phone, 8 taps each at once, create late | 8 `200 opening`, 16 `409 identity_has_wallet`; **1 create, 1 wallet** | spec B1 |
| Same BVN, another phone, two accounts at once | 2 `200 open` (the same person), 2 `409`; 1 create | spec B2; live `race-2` 409 |
| Same phone, another BVN, after the first opened | `409 identity_has_wallet`, nothing sent | spec B3 |
| Second in-process service instance + both sweeps racing the routes, create late | **1 create**, `open` | spec B4 |
| Server killed mid-create, restarted | 1 create, recorded by the other Hub's sweep | `live-restart-*.txt` |

**Lost answers.**
- **Window boundary:** 50 ms before money timeout + resend safety it is `wait`; 50 ms after it is `absent` (spec C1).
- **Fintava's clock 6 min behind ours,** details 404 for the new customer: the list still finds it by phone, and nothing is resent (C2).
- **Each "wait" leg the builder tests holds:** `{}`, `data: null`, another 404 text, an empty 404, a 500, a slow details, a list failing, a list row without time, and pages running out. A list that stalls ends at FIX-01's deadline, is caught and is `unknown`, so `wait` (code read).
- **"Already exists" refusals** are lost answers and are never resent. But see D1 (A3): its reconcile adopts by phone.
- Notes N1 and N2 below.

**Identity binding.**
- `checkedIdentity` reads the BVN hash, NIN hash, check time and phone in one query, and the NIN is required.
- `matchedFor` needs a `matched` selfie row with exactly that check's `bvnVerifiedAt` and `bvnHash`.
- The claim stores that check. The create sends the BVN and NIN that hashed to it, and the phone it proved.
- **NIN:** missing or empty gives 400; another person's gives 409 `bvn_not_checked`; nothing is sent (D1 spec).
- **A new BVN check (another BVN, same phone) while an opening was lost:** once the opening is proved absent, the old BVN gives 409 and the new BVN without its own selfie gives `selfie_required`. Nothing more is sent (D2 spec).
- **A new check passing between the read and the claim:** the open goes ahead on the check read, which is passed and selfie-matched. It is superseded but not revoked; KYC-01 has no revocation (note N3).

**Never stored, never logged.**
- **Spec run:** 541 text, JSON and array columns and 65 values (BVNs, NINs, addresses, and a unique date of birth per person): 0 hits. 137 captured log lines and 10 answers: 0 hits (F1, F2).
- **Live Hubs:** 4 logs, 0 eleven-digit runs, 0 addresses, 0 dates of birth. `vm12_hub`'s 541 columns: 0 hits, apart from hex `_prisma_migrations.checksum` false positives.
- **Name:** the name typed on A5 is never stored. Fintava's `wallet.accountName` is, because A8 and W15 show it and `GET /money/wallet` never calls Fintava.

**Account deletion (purge map).** `FintavaWalletOpening` is OWNED: the purge deletes it with `FintavaWallet` (spec A2, E1). This reproduces G-36: after a purge, the same BVN on a new account with a new phone makes a **second** Fintava customer for that BVN (E1: 2 customers for one BVN). That is the recorded gap, still the owner's call (see "unclear" below). The same phone after a purge is D1 (A2).

**Sandbox (`dev.fintavapay.com` only; masked; the key read from file into the call's stdin, never printed).** 4 calls, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/sbx/`:

| # | Sent (UTC) | Call | HTTP | What it showed |
|---|---|---|---|---|
| 1 | 06:08:35 | `GET /customers/14acc2fc-2952-43b6-be71-168633aa086c` | 200, 0.52 s | Still account `1192964482`, `john ugochukwu`, `TIER_2`, `active`. **`userInfo.bvn` is the full 11 digits** (ends `8901`), and `dateOfBirth`, `firstName` and `lastName` are there too, so MONEY-12's own read already carries what it needs to compare |
| 2 | 06:08:43 | `GET /customers/list?page=1&take=100` | 200, 0.28 s | 3 customers, newest first (createdAt non-increasing); every row carries `userInfo.bvn` |
| 3 | 06:08:53 | `POST /create/customer`: Fintava's documented example (`john ugochukwu`, the phone ending `5863` that `1192964482` holds, `lugbe,abuja`, `1992-05-17`, BVN ending `8901`, NIN ending `0003`, a new `@example.com` email) | **500** `["Something went wrong on our end. Please try again shortly."]`, 0.32 s | **A repeated phone is not accepted** |
| 4 | 06:09:02 | `GET /customers/list?page=1&take=100` | 200, 0.38 s | Still 3 customers: call 3 made nothing. **No new sandbox customer exists** |

On call 3: OPS-02 (`07-`) saw the same BVN and NIN accepted twice, and the email was new, so the phone is the likely cause, but the 500 names no field. The answer is a generic 500, which MONEY-12 rightly reads as a lost answer. Its reconcile then finds the phone's existing customer and adopts it (D1, A3).

### Findings

**D1, `defect` (blocks): an existing Fintava customer is adopted on the phone alone.**
- **What happens:** when Fintava has a customer for the person's verified phone and no WAWU account holds it, MONEY-12 records it as the person's wallet and shows its account number and name. Nothing is compared between Fintava's record and the checked identity.
- **Where it happens:**
  - the lookup before the create (`wallet-opening.service.ts` lines 260 to 286);
  - the reconcile's details lookup and its list sighting (lines 419 to 452; `findInList` matches a row on phone before looking at its age, so a customer of any age counts);
  - the sweep, through reconcile.
- **Fintava's reads carry what is needed:** `userInfo.bvn` in full (sandbox call 1, and `reference/create-customer-copy.md`), with the date of birth and name. `readCustomer` drops them.
- **Who it hands a stranger's account:**
  - a recycled or SIM-swapped number whose old holder had a Fintava customer (A14 only proves the BVN record's phone equals the account's; a BVN record's phone can be stale);
  - a customer made outside WAWU with this phone;
  - a customer whose phone was changed to this one;
  - per G-36's own text, anyone signing up with the phone of a deleted WAWU account.
- **Reproduction:**
  - **Spec** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12/vm12-attack.contract.spec.ts`; copy it into `src/money/opening/tests/` and run with the opening specs' environment.
    - **A1:** the stand-in holds a customer for the phone with another BVN, the name "Chidi Stranger" and another date of birth. `POST /money/wallet/open` answers `200 open`, account = the stranger's, `accountName: "Chidi Stranger"`, 0 creates.
    - **A2:** person 1 opens, is purged, and the number goes to person 2 with another BVN. Person 2 gets person 1's account.
    - **A3:** details 404 and a create refused with `400 "phoneNumber already exists"` give `opening`. The next tap's reconcile finds a 2-year-old stranger row in the list by phone and adopts it.
    - **A4:** the sweep alone does the same.
  - **Live** (`live-adopt.txt`): the built Hub, real login. Open answered `state=open acct=<stranger's> name=Chidi Stranger`, and the balance then read the stranger's wallet.
- **Fix to suggest:**
  - Adopt only when Fintava's record matches the checked identity: the IdentityHasher's `bvn` hash of `userInfo.bvn` equals the opening row's `bvnHash`. Optionally the date of birth too.
  - Read Fintava's BVN only to hash it, never store or log it.
  - Apply the comparison in `record()`'s callers on both paths, the details and the list.
  - A missing or mismatched BVN is not adopted and nothing is created (call 3 suggests Fintava will not open a second customer on that phone anyway). The opening stops: a `conflict` row with its own `failure` (for example `identity_mismatch`), one error log line, and the person told it cannot open. This is a WORKFLOW section 10 stop for the owner (live data, someone else's account), not a guess.
  - G-36's sentence "gets their old Fintava account back" then still holds for the same person (same BVN) and no longer for a stranger.
  - Add a spec whose stand-in returns `userInfo.bvn`. The builder's stand-in omits it, which is why their "found customer" tests could not see this.

**Notes (not defects, not blocking):**
- **N1, list order is assumed, not checked (spec C3).** `findInList` stops at the first page that has a row older than the attempt, trusting newest-first. If Fintava served the list oldest first and its details answered 404 for a customer that exists (the builder's own spec treats that as possible), a lost create would be proved absent and made again: **2 creates, 2 customers for one phone** in C3. Sandbox call 2 shows newest first on 3 rows. A cheap guard: a page whose `createdAt` is not non-increasing is `unknown`.
- **N2, the resend window uses each Hub's own clock (spec C4).** `attemptStartedAt` and every age comparison come from the Hub's `new Date()`. A sweep on a Hub running 12 min fast proved an in-flight create absent, and a tap then sent a second create (2 creates). It needs a clock about 10 min off (NTP keeps them close), or a Hub paused for over 10 min between its last claim check and the send. Using the database's `now()` for the stamp and the comparisons would remove the first case.
- **N3, a superseding check.** A BVN check for another BVN on the same phone that passes after the identity read does not stop the open. The open uses the check it read, which is passed and selfie-matched (G-25's rule). After that, `WalletIdentity` names the newer BVN while the wallet is the older one's. No harm found; recorded.

**`unclear` (owner): G-36.** Confirmed as filed (E1): after the purge, the same BVN with a new phone opens a second Fintava customer. The decision is the owner's (keep a RETAINED BVN hash in the purge map, or not).

### NOT RUN
- **The whole Open your wallet against the sandbox** (BVN check, selfie, open, for one person). Unblocked when Fintava names a sandbox BVN its check passes (question 11) and shows its real selfie success body (question 6, G-25).
- **A lost create against the sandbox:** it cannot be provoked there. Covered against the stand-ins.
- **Which field Fintava's 500 on call 3 refused.** Unblocked when Fintava states whether `POST /create/customer` refuses a phone it already holds, and with which answer.
- **V7 on screens and V10:** no screen yet. Unblocked when KYC-03 and WALLET-01 are built.
- **CI's `ci-check.sh` itself:** the tripwire and lock were checked by hand, as CI runs them. Unblocked by the pull request's CI run (no PR opened).

## Builder report (round 2)

Builder (round 2, a session that wrote none of round 1), 3 Oct 2026. wawu-backend `wmt/MONEY-12` `9902ca1` (on main `e8535d8`); mobile `wmt/MONEY-12` (on main `176a56d`). Neither main moved. A local merge with `wmt/MONEY-08` `2c5dee8` is clean: tsc 0, opening + Fintava + ledger + balance + money-contract specs 18 suites 869/869 (never pushed).
- **D1 fixed: a phone's Fintava customer is adopted only if it carries the person's BVN.** Client `getCustomerMatch` reads `GET /customers/{id}` and hands `userInfo.bvn` (11 digits, else null) only to a digest; `lookupCustomerByPhone` takes the digest too. The service passes `IdentityHasher.hash('bvn', ...)` (KYC-01's `bvn:<digits>` HMAC) and adopts only when it equals the opening's `bvnHash`: before the create, in the reconcile (details and list, a list row of any age read by id and compared) and so in the sweep; "already exists" goes through the reconcile. A BVN that differs or is absent adopts and creates nothing: the row becomes `conflict` with `phone_held_by_other_identity` or `phone_holder_bvn_unreadable`, one error line (no BVN, no hash), and the person gets `409 phone_held_by_other_identity` now and on every later open, asking Fintava nothing; `GET /money/wallet` reads `not_open`, the balance `409 wallet_not_open`. Files: `src/fintava/fintava-client.ts`, `fintava.interface.ts`, `src/money/opening/wallet-opening.service.ts`, new `opening-stops.ts`, `wallet-balance.service.ts`, the code in `money-enums.ts`, `money-contract.ts`, the controller, CONVENTIONS sections 3 and 9, `contract/openapi.json`.
- **Proving tests** (`wallet-opening.contract.spec.ts`, stand-in now returns `userInfo.bvn` and `dateOfBirth`): A1 (stranger with another BVN, name, date of birth: 409, 0 creates, Fintava only read), masked or absent BVN (409, `phone_holder_bvn_unreadable`), A2 (reissued number after a purge: refused; the first holder with the same BVN gets theirs back), A3 ("already exists", then a 2-year-old stranger in the list: refused), a stranger found by the reconcile's details lookup, A4 (the sweep alone: `conflict`, then 409), stays stopped through sweeps; matching BVN still adopted before the create (an old one too), from the list (of any age) and after a purge. Client spec: the BVN goes only to the digest, never in the answer (nor the date of birth); masked, absent, 10 or 12 digits, spaced or an object give no digest.
- **N1 fixed: the list's order is not assumed.** It is read to its end (up to 10 pages of 100): a list read to its end without the phone is "no row" whatever its order; a longer list counts only if every row read was newest first and reached back past the attempt, else the opening waits (one warn line). Tests: truly oldest first and the verifier's exact C3 order, details missing the customer: found on page 2, 1 create; a long list out of order: waits; a long list newest first: still proved absent.
- **N2 fixed: one clock.** Every opening time (claim, the stamp before the create, recheck, stuck, resend window) is the database's `now()`. Tests with this process's `Date` moved 12 min: a fast server's sweeps leave a create in flight alone and a tap sends nothing; a slow server's stamp is the database's, and a server on time does not call it absent. 1 create each.
- **The verifier's attack spec** (copied into `src/money/opening/tests/`, run, removed): 12 passed; its 5 REPRO cases now fail exactly at their bug assertions (A1 to A3 answer 409, A4 records no wallet, C3 makes 1 create). B1 to B4, C1, C2, D2 and E1 are folded into the spec as their own tests (E1 kept as "G-36 as filed").
- **Mutants (11), all killed:** adopt on phone, adopt an unreadable BVN, the process clock, early stop at an older page, order ignored, no check in the reconcile, none before the create, no refusal on retry, the view and the balance not reading the stop, a loose BVN reader.
- **Sandbox (`dev.fintavapay.com`, 5 `GET`s, no create, `docs/fintava/sandbox/32-money12-account.md`):** `GET /customers/{id}` for `1192964482` carries the full `userInfo.bvn` (equal to Fintava's documented example, compared in memory). Built Hub, real login, identity steps as stand-ins: the same phone with another BVN got `409 phone_held_by_other_identity`, nothing adopted; the record's own BVN got `1192964482` recorded with no create.
- **Live on the stand-in** (built Hubs :4901 and :4903, real login): the verifier's `live-adopt` is now 409 on Hub A and on retry on Hub B (0 Fintava calls, 0 creates), GET `not_open`, balance `wallet_not_open`; own old customer adopted on Hub B; a fresh open makes 1 create, GET on the other Hub 0 calls.
- **Never stored or logged:** spec scans now include every stranger's BVN and date of birth and a unique date of birth per person (0 hits in all columns, logs and answers); `m12b_hub` 541 columns 0 hits; Hub logs 0 eleven-digit runs; key: 0 of 58 windows in logs, outputs and the staged diff; 0 unmasked 11-digit numbers added.
- **Runs:** tsc 0; eslint 0 on the 12 changed `.ts` files; opening, Fintava, identity, KYC review, money, purge and rate-limit specs 27 suites 1,210/1,210 (`m12b_test`, stand-in WAWU ID :4902); full contract on fresh seeded `m12b_full_test`: 119 suites, 2,878 passed, 3 skipped, 35 failed, all in the 3 suites that hard-code :4001 (kyc-submission, privacy-settings, credits-state), which pass 48/48 (+3 skipped, legal-intake) with my mock on :4001 (`lsof` empty before and after): 2,913 passed, 0 failed; protected `--fresh HEAD` 253/253, all 244 required, registry sha256 `767e27bf...` unchanged; tripwire 0 of 4,407 added lines; `hub-rate-limits` 10/10; gates main 16 fail / 8 warn, branch 16 / 9 (only `PROVISIONAL(WALLET-BANK-NAME)`); `contract:build` byte-stable. Mobile `npm run check` exit 0: typecheck, lint, 19 suites 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks.
- **Defaults (agent), owner may override:** the refusal is `409 phone_held_by_other_identity` (409, like `identity_has_wallet`) with "This phone number is already linked to an account we could not match to your BVN, so we have not opened your wallet. Contact support."; a stopped opening reads `not_open` on `GET /money/wallet` (not "opening", which would never end); the date of birth is not compared (the BVN decides); the list scan reads up to 10 pages on every reconcile that needs it.
- **Stop for the owner (WORKFLOW section 10, live data, someone else's account):** a person whose proved phone already has a Fintava customer with another BVN (or none) cannot open a wallet, and what a reviewer may do then is not decided. Recorded in BACKEND_GAPS G-37 (case 2); G-36 updated (the same person with the same BVN still gets their account back; a stranger never).
- **N3 left as is**, as instructed: a newer BVN check passing mid-open does not stop it; the open uses the passed, selfie-matched check it read.
- **Residual (recorded, not a defect):** with more than 1,000 customers, a list that is newest first for its first 1,000 rows but hides a lost create further down, plus a details lookup that misses it, could still be read as absent.
- **NOT RUN:** the whole Open your wallet against the sandbox (BVN check, selfie, open, one person): unblocked when Fintava names a sandbox BVN its check passes (question 11) and shows its real selfie success body (question 6, G-25). A real stranger's customer for a person's phone in the sandbox: the sandbox has 3 customers, none with a second identity for one phone; proved with a made-up BVN against `1192964482`. V7 on screens and V10: unblocked when KYC-03 and WALLET-01 are built. CI's `ci-check.sh`: tripwire and lock checked by hand; unblocked by the pull request's CI run (no PR opened).

## Verifier report (round 2)

Verifier (round 2), 3 Oct 2026. This is a fresh session: it wrote none of MONEY-12's code and did not verify round 1. I checked wawu-backend `wmt/MONEY-12` `9902ca1` (on main `e8535d8`) and mobile `wmt/MONEY-12` `cb6907b` (on main `176a56d`), in fresh detached worktrees `/home/user/wt/vm12b2` and `/home/user/wt/vm12m2`.

- **Mains:** backend `origin/main` is still `e8535d8`. Mobile `origin/main` moved to `ddafc76` (AUTH-02). A local merge of it into `cb6907b` conflicts only in `BACKEND_GAPS.md` (main's G-34 and G-35 rows beside the branch's G-36 and G-37 rows: keep both) and the generated `docs/PROGRESS.md`. Resolved that way and regenerated, `npm run check` exits 0: 20 suites / 371 tests, gates 0 fail / 0 warn on 96 files, 202 tasks (`mobile-check-merged-main.log`). The merge was not pushed.
- **MONEY-08:** a local merge with `wmt/MONEY-08` `2c5dee8` (still its head) is clean, and tsc gives 0. Opening, Fintava, ledger, balance and money-contract specs: 16 suites, 829/829 (`merge-specs.log`). The migrations apply in either order, and on a fresh database:
  - MONEY-08's set, then the merge, applies `20261003100000_wallet_opening`;
  - MONEY-12's set, then the merge, applies `20261003120000_ledger_status_schedule`;
  - all three databases have 78 migrations and identical `pg_dump` schemas;
  - the only drift left is main's own `ContentPiece_specializations_idx` (`drift-merge.sql`).
  Nothing of the merge was pushed.
- **Databases:** `vm12r2_test`, `_hub`, `_full_test`, `_protected_test`, `_merge_test`, `_m08first`, `_m12first`, `_mergefresh`. All were dropped afterwards.
- **Ports:**
  - Hubs on :4921 and :4923 (one database);
  - the stand-in WAWU ID on :4922;
  - my Fintava stand-in on an OS-assigned 127.0.0.1 port;
  - :4001 only for the 5 suites that hard-code it. `lsof` was empty before. My mock ran there and was then stopped (PID checked by its working directory), and `lsof` was empty after.
  All my processes are stopped.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm12r2/`:
  - `ev/`: logs and JSON facts;
  - `live/`: the stand-in, the skew preload, the Hub launcher and the drive script;
  - `sbx/`: the sandbox call, masked;
  - my attack spec `vm12r2-attack.contract.spec.ts`;
  - round 1's spec as rerun, `vm12-attack.contract.spec.ts`.
  The specs were run from the backend worktree and removed again. Nothing of them is committed.

**Verdict: no open defect. Status `review`.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | **Backend:** tsc 0; eslint 0 on the 22 added or changed `.ts` files (`tsc-branch.txt`, `eslint-branch.txt`). Gates: main `e8535d8` 9 run / 608 files / **16 fail / 8 warn** / 76 accepted; branch 9 / 616 / **16 / 9** / 76. The only added findings are `PROVISIONAL(WALLET-BANK-NAME)` and its file line (`g-main.lst`, `g-branch.lst`). `check_baseline.py`: OK. **Diff against the report:** round 2's 13 backend files and round 2's mobile files are exactly the ones the builder lists. **Key scan** (every 8-character window of the key, 58 windows, read from the file and never printed): 0 hits in the backend branch diff, the mobile branch diff, my staged diff, `sbx/` and `ev/`. The mobile diff has 0 unmasked 11-digit numbers. The backend diff has 9, all made-up spec fixtures (phones `0803123...`, `0800000000x`; a made-up BVN and NIN fixture pair, both ending `0999`). **Mobile:** `npm run check` exit 0: typecheck, lint, 19 suites / 345 tests, gates 9 run / 90 files / 0 fail / 0 warn, 202 tasks (`mobile-check-before.log`). |
| V2 Contract | passed | **Full test suite** on a fresh, migrated and seeded `vm12r2_full_test`, stand-in WAWU ID :4922: 119 suites, 2,916 tests; 2,873 passed, 3 skipped, 40 failed (`contract-full.json`). The 40 are all `fetch failed` in the 5 suites that hard-code :4001: kyc-submission, privacy-settings, credits-state, account, legal-intake. With my mock on :4001 they pass: 5 suites, 53 passed, 3 skipped (`contract-4001.log`, `lsof-4001-*.txt`). **In all: 2,913 passed, 3 skipped, 0 failed.** **Inside the run:** `wallet-opening` 75/75, production boot 3/3, `fintava-customer-lookup` 25/25, `fintava-stall` 117/117, `money-contract` 11/11, `money-identity` 26/26, `selfie-match` 182/182, `money-balance` 14/14, `account-data-map` 4/4, `hub-rate-limits` **10/10**. **Contract:** `contract:build` rebuilds `contract/openapi.json` byte for byte (sha256 `74e3f2d4...`), equal to mobile's copy. `sync_contract.py` regenerates `openapi.mobile.json` and `schema.generated.ts` with no diff. **Migration:** additive (above). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` (`vm12r2_protected_test`, lock `origin/main` `e8535d8`): **253/253, all 244 required** (`protected.log`). `lock-diff.py e8535d8 HEAD`: "No change". `.pipeline/protected-registry.json` sha256 `767e27bf...` on main and branch. CI tripwire, run as `ci-check.sh` runs it: **0 of 4,089 added lines** match (`outside.diff`). |
| V4 Field trace | passed | The account number and name come from Fintava's answer (`createCustomer`, or a customer whose `userInfo.bvn` digest equals the opening's `bvnHash`). They are written to `FintavaWallet` and read by `GET /money/wallet` (A8, W1, W15) and the balance (`walletId`). Across people, round 1's crossing is gone: a stranger's record never reaches another person's wallet in any of the 26 record shapes, the 4 reconcile paths or the live run below. |
| V6 States | passed | Each state was reached through its real cause, in specs and on the built Hubs: <br>- `not_open`, then `open`; <br>- `opening` while a create is lost, in flight, or the Hub was killed; <br>- `409 phone_held_by_other_identity`, then `not_open` on GET and `409 wallet_not_open` on the balance; <br>- `503 provider_unreachable` when the holder's record has no readable `userInfo`, or details name a customer whose read is 404; <br>- balance `409 wallet_opening` while opening; `401` without a token (`live-v9.txt`, `live-race.txt`, attack facts). |
| V7 Flow walk | passed (backend); screens NOT RUN | **Built Hubs, real sign-in** (`/auth/register` then `/auth/login` on the stand-in WAWU ID): BVN check, selfie, `not_open`, open, `open`, on both Hubs. **Resume:** Hub A was killed while a create Fintava made was in flight, and restarted. A tap on Hub B 10 s later answered `opening` and sent nothing. The sweeps then recorded it: **1 create** in all (`live-restart-*.txt`). Screens: NOT RUN below. |
| V8 Money | passed | **D1 fixed and attacked (below). One create per person in every race I tried (below).** PIN, insufficient funds, webhook and reversal do not apply to an opening. |
| V9 Live seam | passed | Built branch Hubs (`node dist/src/main.js`) on :4921 (process `Date` moved **+12 min**) and :4923 (**-12 min**) over one database, signed in through the stand-in's real login. Open on Hub B answered `1145045644`, the account only my stand-in had made; both Hubs then answered it. The two `GET /money/wallet` made **0 Fintava calls**, all answers were `no-store`, and a second open sent nothing (`live-v9.txt`). |

**D1 (adopt only on a BVN match): fixed.**

*The digest* (`getCustomerMatch`, `bvnOf`, `identityStop`):
- The BVN on Fintava's record counts only as 11 ASCII digits in `userInfo.bvn`, as a string or a safe integer; surrounding whitespace is trimmed. It goes only to `IdentityHasher.hash('bvn', ...)`, the same `bvn:<digits>` HMAC KYC-01 stores. A different person's BVN can therefore never produce the person's digest.
- The comparison is `===` on two server-side 64-hex HMACs. It is not constant-time, but it is safe: the caller supplies neither value, and the first mismatch makes the row terminal, so there is no oracle to repeat.

*Every shape tried, before the create* (spec G1, each a fresh person, a holder record for their phone; 0 creates in every case):

| Holder record's BVN | Outcome |
|---|---|
| The person's BVN as a string, a number, padded with spaces, or with a leading zero as a string | Adopted, correctly: the same BVN |
| Spaces or dashes inside; a leading-zero BVN served as a number (10 digits left); 12 digits (leading 0 or trailing digit); 10 digits; fullwidth or Arabic-Indic digits; masked `*******1234`; `null`; `""`; `true`; an array; an object; absent; only on the top level; only in `wallet` | `409`, `conflict` / `phone_holder_bvn_unreadable` |
| The person's NIN; one digit off; a stranger's | `409`, `conflict` / `phone_held_by_other_identity` |
| `userInfo` missing, or an array | `503 provider_unreachable`, row `failed`, again 503 on retry. Never adopted, never created |

*Every path that can adopt, attacked:*
- **The reconcile's details lookup:** "already exists" refusal, then a masked holder. `409`, 1 create in all (the refused one).
- **The list:** details always 404, a list row by phone whose by-id record has a lost leading zero. `409`.
- **The sweep alone:** three service instances sweeping at once plus 2 taps. Exactly 1 `conflict`; 0 adopted; 0 creates.
- **Two customers for one phone:** a stranger served by details while the person's own is in the list gives `409`; the person's own served by details is adopted.
- **A lost create with both customers in the list:** newest first adopts the person's own; oldest first stops (note N4). Never the stranger, 1 create.
- **Details naming a customer whose read is 404:** `503`, nothing made.
- **Round 1's attack spec rerun** (adapted only to compile: the removed `realLookup`, and C4's clock moved through `Date`): 12 passed. A1 to A3 now fail exactly at their old bug assertions (409 instead of 200). A4's sweep records `conflict` with no wallet. C3 makes 1 create (`r1-attack-rerun.log`, `r1-attack-facts.json`).

*The stop holds* (23 stopped rows, `provesStopped`). After each stop, all at once:
- the row aged by a day with `checkedAt` cleared;
- 6 HTTP taps;
- 4 opens on a second service instance, standing in for a restart;
- both sweeps.

Result: all `409 phone_held_by_other_identity`, **0 Fintava calls**, row, failure and attempt unchanged, no wallet, GET `not_open`, balance `409 wallet_not_open`. **Live:** a stranger's customer for the phone gave 409 on Hub A, then 409 on retry on Hub B with 0 Fintava calls, and 0 calls through 31 s of both Hubs' sweeps. A masked holder gave 409 on both Hubs. The person's own old customer (same BVN) was adopted with 0 creates (`live-adopt.txt`).

*G-36:* after a purge, the same person (same BVN and phone) got their old account back with 0 creates. A stranger given the number then got `409`, 0 creates (G3). The same BVN with a new phone still makes a second customer: G-36 as filed, rerun as E1.

**N1 (list order): fixed; the residual is acceptable.**
- **The list is read to its end:** 10 pages asked for a 1,000-row list served oldest first, found on page 10, 0 extra creates.
- **The builder's residual, reproduced** (G4 `RESIDUAL`): 1,500 rows; the first 1,000 newest first and older than the attempt; the lost create at row 1,200; details 404 for it. Proved absent, so **2 creates**.
- **Why it is acceptable:** it needs two Fintava faults at once. Its details lookup must answer its own `404 "Customer not found"` for a customer that exists, and its list must be unsorted beyond row 1,000. For a list sorted newest first throughout, the create cannot sit below rows older than the attempt. With 1,100 customers made after the create (G4 `global`), the first 1,000 rows never reach back past the attempt, so it **waits** (1 create).
- **The same class:** a list whose `hasNextPage` says false while more rows exist also gives 2 creates (G4 `metaLie`). Recorded as note N5, not a defect.

**N2 (one clock): fixed.**
- **In-process:** the process `Date` was moved +12 and -12 min while stamping, then the other way while 2 instances swept and tapped. The stamp is within 9 ms of the real time, and **1 create** (G5).
- **Two real Hubs, +12 and -12 min, one database.** Fintava made the customer, the answer was lost, and the customer was hidden from reads for 40 s (resend window 61.5 s). Taps every 5 s on both Hubs, plus both crons:
  - opened on the slow Hub: `opening` until 50 s, then `open`, **1 create**;
  - opened on the fast Hub: the same, **1 create**;
  - nothing made: the second create came **65.5 s** after the first, past the 61.5 s window, and never early on the fast Hub (`live-skew-*.txt`).

**Round 1 guarantees still hold.**

| Case | Result | Where |
|------|--------|-------|
| 24 opens at once, alternating the +12 and -12 min Hubs, create answered after 2.5 s (money timeout 1.5 s), then 10 more | 24 `opening`, then 1 `open` + 9 `opening`; **1 create**, 1 customer; balance `409 wallet_opening` meanwhile | `live-race.txt` |
| 3 accounts with the same BVN and phone, 8 taps each | 8 `opening`, 16 `409 identity_has_wallet`; 1 create, 1 wallet | r1 B1 |
| Same BVN, another phone / same phone, another BVN | 409 `identity_has_wallet`, 1 create / nothing sent | r1 B2, B3 |
| Second service instance plus both sweeps racing, create late | 1 create, `open` | r1 B4 |
| Hub killed mid-create, restarted | 1 create, recorded by the sweep | `live-restart-*.txt` |
| Window boundary, Fintava clock 6 min behind | wait / absent at ±50 ms; found by list, nothing resent | r1 C1, C2 |

**Identity and storage:**
- **Identity read once, NIN required:** missing or empty NIN gives 400; another NIN gives 409 `bvn_not_checked`; nothing is sent (r1 D1, D2).
- **Nothing in logs or answers:** 320 captured log lines and 23 answers. 0 hits for any BVN, NIN or address sent, any holder-record BVN, or any of 259 digests (every `bvnHash`/`ninHash` and the HMAC of every BVN). 0 unmasked 11-digit runs.
- **`getCustomerMatch`'s result:** neither the BVN nor the date of birth (G6).
- **Nothing in columns:** 541 text, JSON and array columns, 0 hits.
- **Live Hubs:** 3 logs, 0 eleven-digit runs, addresses, dates of birth or 64-hex digests. `vm12r2_hub`'s 541 columns hold none of the BVNs, addresses or dates of birth. Regex hits were only inside 64-hex hashes and `_prisma_migrations` ids and checksums.

**Sandbox (`dev.fintavapay.com` only; masked; the key read from file into the call's environment, never printed).** One read-only call, no create (`sbx/call1-get-customer.txt`):

| # | Sent (UTC) | Call | HTTP | What it showed |
|---|---|---|---|---|
| 1 | 07:29:43 | `GET /customers/14acc2fc-2952-43b6-be71-168633aa086c` through the branch's built `getCustomerMatch` | 200, 0.57 s | Still `1192964482`, `john ugochukwu`. The digest function was called once. Its digest equals the HMAC of Fintava's documented example BVN (ending `8901`, `reference/verify-bvn.md`) and differs for that BVN one digit off. The result object carries neither the BVN nor the date of birth |

### Findings

No defect.

**Notes (not defects, not blocking):**
- **N4, a stop can leave the person's own customer unrecorded.** This happens in two cases (both found by the reconcile; nothing wrong is adopted, and a review clears it under G-37):
  - a lost create, details missing it, and the list served oldest first with a stranger's older row for the same phone (G2 `both`);
  - a stranger appearing for the phone while the person's own create is in flight (G2 `stopVsLate`). The original request then answers `200 not_open`.
- **N5, the list residual (above).** Two Fintava faults at once give a second create: details missing a customer and a list unsorted past 1,000 rows, or `hasNextPage` false while rows remain. A cheap guard for the second case: compare `itemCount` with the rows read.
- **N6, the create's own answer is not BVN-checked.** A `201` to our create that carries another customer (another BVN) is recorded as it is (G7). Fintava has not been seen doing this: it makes a new customer, and a repeated phone gives 500. The 201 body carries `userInfo.bvn`, so the same digest check would close it.
- **N3 (round 1)** is left as the builder recorded it.

### NOT RUN
- **The whole Open your wallet against the sandbox** (BVN check, selfie, open, for one person). Unblocked when Fintava names a sandbox BVN its check passes (question 11) and shows its real selfie success body (question 6, G-25).
- **A real stranger's customer for a person's phone, and a lost create, in the sandbox:** neither can be made without creating customers. Both were covered against the stand-ins. Unblocked when Fintava gives a sandbox phone held by a second identity.
- **Whether Fintava's details lookup can answer 404 for an existing customer, and whether its list is sorted newest first beyond 1,000 rows** (N5). Unblocked when Fintava states both.
- **V7 on screens and V10:** no screen yet. Unblocked when KYC-03 and WALLET-01 are built.
- **CI's `ci-check.sh` itself:** the tripwire and lock were checked by hand, as CI runs them. Unblocked by the pull request's CI run (no PR opened).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
