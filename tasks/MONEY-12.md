---
id: MONEY-12
title: Open a Fintava account when someone opens a wallet
owner: YOU
area: MONEY
order: 79
priority: launch
repo: wawu-backend
type: money-path
status: building
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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
