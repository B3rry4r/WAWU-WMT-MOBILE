---
id: OPS-02
title: Fintava test keys: the first real calls
owner: YOU
area: OPS
order: 3
priority: launch
repo: wawu-wmt-mobile
type: ops
status: building
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-02 · Fintava test keys: the first real calls

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Money is built from Fintava's published docs (`docs/fintava/`), so nothing waits on this task. When the test (sandbox) keys arrive, this task runs the real calls and corrects anything the docs got wrong before money goes live (CHECK-2).

## Scope

The published docs are already in `docs/fintava/reference/`, digested in `docs/fintava/naira-api.md`. Still needed: sandbox keys in the backend's local `.env` (not committed), one file per sandbox call with request and full response (keys and BVNs masked), webhooks with their headers, and written answers to the questions at the end of `naira-api.md`. Correct `naira-api.md` wherever a real response differs.

## Capability checks

- [ ] docs/fintava/ has every sandbox call listed in docs/PLAN.md, each with request and response.
- [ ] Every question at the end of `docs/fintava/naira-api.md` has a written answer or 'unknown'.
- [ ] No secret or real BVN is committed (gates and a manual read).

## Builder report

Builder, 2 Oct 2026, branch `wmt/OPS-02`. About 100 sandbox calls (`dev.fintavapay.com/api/dev` only), ₦40 spent, 0 customers created.
- **Blocker:** WAWU's sandbox merchant is `inactive`. Create customer, customer reads, BVN check, every transfer, every bill purchase and freeze/unfreeze answer `403 Merchant is not active` before validation. Unblocked when Fintava activates the sandbox merchant so `POST /create/customer` stops answering 403 (question 10 in `naira-api.md`).
- Files: `docs/fintava/sandbox/` (README plus 25 call files), corrections in `docs/fintava/naira-api.md`, `limits.md`, `fees.md`, `README.md`; `docs/LOG.md`; this file.
- Check 1 (every PLAN call saved): **partly**. Ran to a result: bank list, both name enquiries, phone check, selfie check, merchant balance and history, lookups by reference and id, discos, meter preview, data and cable lists, error shapes, measured charges. Saved as refused (403, NOT RUN to a result): BVN check, create customer, wallet-to-wallet (3 directions), bank send (success, failure, reversal), freeze/unfreeze, electricity, airtime, data, cable. Webhooks NOT RUN: no public URL here and nothing could fire (`sandbox/23-webhooks.md` lists the tunnel steps).
- Check 2 (every question answered or 'unknown'): done in `sandbox/README.md`, with evidence; 6 new questions added (10 to 15).
- Check 3 (no secret or real BVN committed): `git diff --cached` grepped for the key (0 hits) and for 11-digit runs (0 hits). The one real BVN and NIN received (the merchant admin's, embedded by Fintava in `GET /transaction/id`) are masked completely.
- Findings that change plans: a wrong key is 400 not 401; error bodies are `{status,timestamp,message[],path}` or a nested validation object; unknown transaction id is 200 `data:null`; `/txn/merchant` is cached about 5 minutes per page/take; selfie (₦10) and phone (₦5) checks are charged even when they fail; merchant balance returns `tier: "TIER_3"`; transaction-by-id embeds the customer's BVN/NIN; postpaid discos exist and minimums vary; 9mobile data is `ETISALAT`.
- Gates (`npm run check`): before (clean HEAD copy) typecheck 0 errors, lint clean, tests 4/4, gates 9 run, 5 files scanned, 0 fail/0 warn/0 accepted, task check 187 tasks. After: identical (exit 0; tests 4/4, gates 9 run, 5 scanned, 0/0/0, 187 tasks). Docs-only change, so no count moved.
- No shared-change requests. Nothing filed in `BACKEND_GAPS.md` (no code changed).
- Round 2 (verifier findings 1 and 2): wrong key documented as 400 without `live_` and 404 with it (confirmed with two fake keys, both saved in `sandbox/24-`), MONEY-06 told to treat both as auth failure (`naira-api.md`, `sandbox/24-`, `sandbox/README.md`); the 4th phone check (08:31:59, charge row `fc163c4e-...`) and the `Airtel`, `9mobile` and `T2` bundle attempts are now saved (`sandbox/06-`, `20-`, `25-`). Gates unchanged.

### Re-run (merchant active)

Builder, 2 Oct 2026, branch `wmt/OPS-02-rerun`. 86 calls to `dev.fintavapay.com/api/dev` only (09:39 to 09:47 UTC, re-check 10:18), ₦20 spent, 2 test customers.
- **Blocker resolved:** merchant `active` since 09:22 UTC. **New narrower blocker:** bank sends and airtime, data, electricity purchases answer `400 "Unable to find customers"`, cable `201 "service not currently available"`. Unblocked when a ₦100 `POST /bank/credit/merchant` to `0123456789`/`000013` stops answering that (question 17).
- Files: all 25 `docs/fintava/sandbox/` files (re-run on top, first run kept under "First run (merchant inactive)"), sandbox `README.md` (results, 9 contradictions, questions 17 to 22), `naira-api.md`, `fees.md`, `limits.md`, `BACKEND_GAPS.md` G-10, `docs/LOG.md`, this file.
- Check 1 (every PLAN call saved): **partly**. Now run to a result: create customer and reads, BVN check, wallet balance and history, wallet-to-wallet (3 directions, duplicate, insufficient funds), freeze/unfreeze, lookups. Run but refused by Fintava: bank send (success, failure, reversal NOT RUN to a result), all four bill purchases. Webhooks NOT RUN: no public URL and no dashboard access.
- Check 2 (every question answered or 'unknown'): `naira-api.md` questions 1 and 10 answered, 3, 4 and 6 partly, the rest open with evidence; 17 to 22 added.
- Check 3 (no secret or real BVN committed): staged diff grepped for the key (`grep -F` and every 8-character window: 0) and for unmasked 11-digit runs (0); admin identity masked; test values last 4 only.
- Findings that change plans: create opens `TIER_2`, returns 201 and `nin: null`, checks nothing; `/bank/credit` takes `CustomerReference` and refuses a repeat; transfer-response reference names swapped; history lists debits only; frozen wallet blocks both ways; refused bank sends leave `PENDING` records and burn the reference; a 2xx is not proof of payment; a 500 can be transient; airtime minimum ₦100; BVN check ₦5 even on failure; wallet-to-wallet ₦0 in the sandbox (owner: dashboard rates stand).
- Gates (`npm run check`, exit 0): before (branch from e657ad5) tests 32/32, gates 9 run, 23 files scanned, 0/0/0, 187 tasks; after merging main 0f6b042: tests 70/70, gates 9 run, 34 files scanned, 0/0/0, 187 tasks; lint 0 errors, 2 warnings (duplicate import in main's `src/components/Button.tsx`, not this task). Docs only.
- No shared-change requests. Not verified by me.

## Verifier report

Verifier, 2 Oct 2026, fresh session, branch `wmt/OPS-02` at 2dac4f7. I did not build any of this. Type `ops`, `passes: []`, so the evidence is the capability checks below plus the gates.

| Check | Result | Evidence |
|------|--------|----------|
| Gates (`npm run check`) | passed | My own run, exit 0: typecheck clean, lint clean, tests 4/4, gates 9 run, **5 files scanned**, 0 fail / 0 warn / 0 accepted, baseline 0, 187 tasks, 280 artboards. Same as the builder's counts. The gates scan source, not `docs/`, so they prove nothing about secrets in the sandbox files; the manual read below does. |
| Capability 3: no secret or real BVN committed | passed | Whole diff `main...wmt/OPS-02` (6218 lines) and every file on the branch under `docs/` and `tasks/`. API key: every 8-character window of the key compared against the diff and tree, 0 hits; no key prefix, key fragment, `eyJ`, JWT, password hash or token. 10+ digit runs: `1102038668` (WAWU's sandbox merchant account, allowed), `1100000000` (made-up receiver), `0123456789` (sandbox stub account), `1212121212` (made-up smartcard), `1111111111111` (made-up meter), `000000000000` (zero UUIDs), and four fragments of bank/bundle UUIDs; **no 11-digit run at all**. Identity: the admin's BVN and NIN are `<masked: a real person ...>`, date of birth and address `***`, phone `*******1201` (last 4), email `***@grr.la`, name `V*** A***` (`sandbox/12-transaction-by-id.md:114-124`, same in `10-merchant-history.md`). Only full DOB / street address in the diff is the made-up create-customer body (`Ada Sandbox`, `1992-10-04`, `1 Test Street`, `sandbox/07-create-customer.md:42-50`). `SIMI MICHELLE` is Fintava's sandbox stub name. Commit message clean. |
| Capability 1: every PLAN call has a file | NOT RUN to a result (external blocker), recorded correctly | PLAN items 1 to 13 each map to a file. Ran: 01, 02, 03, 05, 06, 08, 09, 10, 11, 12, 16, 17, 20/21 lists, 22, 24, 25. Saved as refused 403 with request and response: 04, 07, 13, 14 (3 attempts), 15, 18, 19, 20/21 purchases. 23 webhooks NOT RUN with reason and steps. Blocker and its unblocking fact are written down (`sandbox/README.md:25-28`: `POST /create/customer` stops answering `403 Merchant is not active`). |
| Capability 2: every question answered or 'unknown' | passed | Questions 1 to 9 each answered unknown / partly with evidence (`naira-api.md` questions section, `sandbox/README.md:87-116`). Questions 10 to 15 are new questions for Fintava raised by this run, each tied to a file. |
| Re-run of key facts (my own calls, sandbox host only) | passed | `GET /banks` 200, 358 banks, `090620 LOMA BANK`. `GET /merchant/balance` 200, `Test Account4`, `1102038668`, 49960 / 49960, `"tier": "TIER_3"`. `POST /create/customer` with `{}`: `403 ["Merchant is not active"]`. Two `GET /merchant/balance` calls with obviously fake keys (see defect 1). No money moved. |
| Claims match saved responses | passed except defect 1 | Sampled 01, 05, 08, 09, 10, 11, 12, 16, 20, 21, 22, 24, 25: bank count and 5 duplicate names, 5 non-6-digit codes; 22 discos, minimums 0/500/900/1000, postpaid present, two Ikeja prepaid codes; selfie 400 in 5.2 to 5.6 s and ₦10; wallet 400 "Wallet not found"; `/txn` 404; reference 404, id 200 `data: null`; bundle counts MTN 53, AIRTEL 38, GLO 55, ETISALAT 14, `9MOBILE` 404; cable GOTV/DSTV, lower case 404; balance shape and `TIER_3`; 8 BVNCHARGE rows, ₦40. |

### Findings

1. **defect: "a wrong key is 400" is only half true.** `docs/fintava/naira-api.md:37`, `docs/fintava/sandbox/24-auth-and-errors.md:15-18` and `:27`, `docs/fintava/sandbox/README.md:62`. The sandbox gives two different answers. A key without the `live_` prefix (`Bearer not-a-real-key`) is `400 ["Invalid API key"]`, as saved. A key **with** the `live_` prefix that Fintava does not recognise is **`404 ["Invalid API Key"]`** (capital K), reproduced 2 Oct 2026 08:48 UTC on `GET /merchant/balance`. A revoked or rotated real key is the second case, so a MONEY-06 client written from these lines would read a dead key as "not found". Fix: save the 404 response in `24-` and say in `naira-api.md` that a bad key is 400 or 404 (match on the message, case-insensitive, not the code).
2. **defect (minor): one charged call is not saved.** `sandbox/25-compliance-charges.md:33` says 4 phone checks and 2 selfies; the files hold 3 phone checks (`06-phone-check.md:26`, `:62`; `25-compliance-charges.md:84`) and 2 selfies. The eighth ₦5 `BVNCHARGE` row, created 08:32:00.050 (transaction `fc163c4e-...`, the one shown in `12-transaction-by-id.md:70-71`), has no saved request or response. The task asks for one file per call, and this one cost money. Fix: add the call if the builder still has it, or say in `06-` which call it was and that its response was not kept. Smaller gap of the same kind, not counted as a defect: `20-bills-data.md:15-17` says mixed-case `Airtel` and lower-case `9mobile` were tried; neither request is saved.
3. **note:** `docs/PROGRESS.md` changed but is missing from the builder's file list. It is regenerated by `check_tasks.py --write`, so the change is expected.
4. **note:** the masking line says the admin's name is masked; the first initials (`V*** A***`) and the phone's last 4 remain. Inside the "last 4 at most" rule, so not a defect.

What I ran: `git diff main...wmt/OPS-02` saved to my scratchpad and scanned (key windows, digit runs, emails, dates, addresses, field names); `git grep` on the branch; read README and sandbox files 05, 07, 10, 12, 13, 22, 23, 24, 25 and the doc diffs; parsed 01, 16, 20, 10 with Python; 3 sandbox calls with the real key (`GET /banks`, `GET /merchant/balance`, `POST /create/customer {}`) and 2 `GET /merchant/balance` with fake keys, all to `https://dev.fintavapay.com/api/dev`; and `npm run check` with a temporary `node_modules` symlink (removed afterwards). One mistake on my side: my first attempt sourced the env file in the shell, which expanded `$` inside the key. That sent a mangled key (404 "Invalid API Key", which is what led to finding 1), and one malformed curl that never reached `/create/customer`. Nothing was written to Fintava and the key was never printed or saved.

Status: back to `building` for findings 1 and 2. The inactive merchant is an external blocker, not a defect.

### Round 2

Verifier, 2 Oct 2026, branch head 60912e5 (builder fix e9c313a, main merged in 3f06c0c, LOG.md conflict fixed 60912e5).

| Check | Result | Evidence |
|------|--------|----------|
| Finding 1 (wrong key 400 vs 404) | closed | `naira-api.md:37-43`, `sandbox/24-auth-and-errors.md:15-24` and the two new saved calls (400 without `live_`, 404 with it), `sandbox/README.md:62`. MONEY-06 is told to match the message case-insensitively and treat both as an auth failure. Matches what I saw in round 1. |
| Finding 2 (unsaved charged call) | closed | `sandbox/06-phone-check.md:18-22` and the new 08:31:59 call with the balance read after it (49960); `25-compliance-charges.md:35-36`. The new response is consistent: content-length 164 equals a compact body with an 11-digit phone, same as the other three. The `Airtel` (200, 38 rows), `9mobile` (404) and `T2` (404) lookups are saved in `20-bills-data.md`. |
| Secrets and personal data, diff `a3bcd8c..HEAD` (1751 lines, font binary excluded) | passed | Every 8-character window of the key against that diff and the whole HEAD tree: 0 hits. No key value, bcrypt hash, key fragment, JWT, email or date of birth in added lines. 10+ digit runs: `1102038668` (sandbox merchant account), `0642289525` (UUID fragment), `1073741823/4/5` and `4294901760` (constants in the vendored React build). Phones show last 4 only (`*******0101`). |
| `docs/LOG.md` | passed | No conflict markers, no duplicate lines, OPS-02 entry present once. |
| Read-only call | passed | `GET /merchant/balance` (key read with `sed`, dev host only): 200, `Test Account4`, 49960, `TIER_3`. |
| Gates (`npm run check`) | passed | Exit 0: typecheck, lint, tests 5/5, gates 9 run, **6 files scanned**, 0 fail / 0 warn / 0 accepted, baseline 0, 187 tasks, 280 artboards. Tests 4 to 5 and files 5 to 6 come from main (`src/__tests__/gates.test.ts`), not from this task. |

Findings, round 2:
- **note:** `sandbox/20-bills-data.md:16-17` quotes the 404 as `Provider '9MOBILE' not found.` for both spellings; the saved lower-case response says `'9mobile'`. Cosmetic.

No open defects. The capability-1 gap stays the external blocker it was: customer, transfer, bill, freeze and webhook calls are re-run when Fintava activates the sandbox merchant (`POST /create/customer` stops answering `403 Merchant is not active`). Status: `review`.

### Re-run verification

Verifier, 2 Oct 2026, fresh session, branch `wmt/OPS-02-rerun` at 261e424 (main 0f6b042 merged in), detached worktree. I did not build any of this. Type `ops`, `passes: []`: the evidence is the capability checks, the gates and the checks below.

| Check | Result | Evidence |
|------|--------|----------|
| Diff against the report | passed | `git diff --stat origin/main...HEAD`: 33 files, the builder's list exactly, plus `docs/PROGRESS.md` (regenerated by `check_tasks.py --write`, expected). |
| Money table | passed | Arithmetic: WAWU 49,960 - 300 + 10 - 20 = 49,650; A +300 -50 -10 +10 = 250; B +50 -10 = 40; 49,650 + 250 + 40 = 49,940 = 49,960 - 20. Re-read at 10:27:41 to 10:27:44 UTC: merchant `bookedBalance`/`availableBalance` 49650/49650 `TIER_3`; A 250/250 `TIER_2`; B 40/40 `TIER_2`. No difference from the README. `/txn/merchant` (10:27:46): 15 rows, 12 ₦5 `BVNCHARGE` (8 first run + 4 re-run at 09:40:27.941, 09:43:21.255, 09:43:30.353, 09:43:30.558 = ₦20, ₦60 in all), `OPS02R-W2W-001` ₦300 `SUCCESS`, `OPS02R-MT-001` and `-MT-002` ₦100 `PENDING`; no credit rows (the ₦10 from A is absent), as `10-` says. |
| Spot-check of references | passed, with finding 2 | `OPS02R-W2W-001`: 200, `SUCCESS`, ₦300, id `02271ab1-...`, `reference` `23f77125-...` (the value the transfer response put in `customerReference`). `Aq3QKQ...` (the transfer response's `reference`): 404 "Transaction not found!". So the swap in `11-` and `naira-api.md` holds. `OPS02R-W2W-005`: 200, `SUCCESS`, ₦10 B to A, id `95bde900-...`, `reference` `d56551bf-...`, both as listed in `13-`. `OPS02R-MT-001` and `OPS02R-BC-001`: **HTTP 200 with body `{}`** (see finding 2), not the `PENDING` record the builder saw at 10:18. |
| Facts in `naira-api.md`, `fees.md`, `limits.md` | passed except finding 1 | Opened every cited file and found the recorded response behind each added fact: activation 09:22:24.993Z (`12-`); 201 and "User created successfully", `nin: null`, no tier in the create body, `TIER_2` in list/by-id/balance, the validation list without `nin`, the 403 "This NIN is blacklisted", the four ids and `tagpayWalletId` = account number, ₦0 for create (`07-`, `08-`, `25-`); BVN check 400 "Invalid BVN or BVN does not exist", 49960 to 49955 (`04-`); repeat refusals in both wordings, 500 ECONNRESET then 400 insufficient balance, response fields `total`, `transaction_fee: 0`, sender balance only (`13-`, `14-`); null `platformComm`/`merchantComm`/`lomaCharge` (`12-`); `PENDING` records and the 10:18 re-check (`14-`); record id as `sourceId` 404 (`14-`); leaked JS error (`03-`); debits only, `type=CREDIT` ignored (`09-`, `10-`); freeze 200 with `isFrozen` and the embedded BVN, "Kindly confirm both customer accounts are active" both ways (`15-`); airtime "Airtime amount is less than 100" (`19-`); cable 201 `{status: 200, message: "service not currently available"}` (`21-`); "Unable to find customers" (`18-` to `20-`); 82 calls (`24-`); largest amount ₦300 (`13-`). |
| Numbering | passed | `BACKEND_GAPS.md`: G-1 to G-8 and G-10, each once; G-9 is on `origin/wmt/MONEY-02` (checked). Questions 1 to 22 in `naira-api.md` and `sandbox/README.md`, 16 from main, 17 to 22 new. Every "question N" in `docs/fintava/` checked: 11 (`04-`, `17-`, README:113), 17 (`14-`, `18-`, README:35), 19 (README:160), 20 (README:153, `limits.md`:42, `naira-api.md`:169), 1 (`14-`:32) all point at the right question. G-10's tasks MONEY-18, WALLET-16, SETTINGS-06 exist and fit. |
| Secrets and personal data | passed except finding 3 | Diff `origin/main..HEAD` (7908 lines), commit messages and every file under `docs/` and `tasks/` at HEAD: every 8-character window of the key, 0 hits; no `eyJ`, `live_`, unmasked `Bearer`, or hash. No unmasked 11-digit run. 10+ digit runs: sandbox accounts (`1102038668`, `1154079370`, `1151496137`), the stub `0123456789`, made-up `1100000000`, `1212121212`, `1111111111111`, 30-digit `sessionId`s, UUID fragments. Emails `***@example.com`, `***@grr.la` only. Names: `Ada Sandbox`, `Bayo Sandbox` (made up), `SIMI MICHELLE` (Fintava's stub), `Test Account4`, bank names. Administrator: BVN and NIN `<masked ...>`, DOB, address, `auth.id` `***`, but see finding 3. |
| Rulings | passed | Nothing changes a `DECISIONS.md` ruling. R-10 against the sandbox's ₦0 is shown as settled by the owner (`fees.md`:7-9, README contradiction 1, question 18). Frozen wallet against R-11, R-17, R-19 is listed and filed (G-10), not resolved; G-10 offers options and says no ruling changes. "BVN check and selfie before create" matches R-6's order. `DECISIONS.md` unchanged. |
| Gates (`npm run check`) | passed | My run, exit 0: typecheck clean; lint 0 errors, 2 warnings (duplicate import in main's `src/components/Button.tsx`); tests 70/70 in 6 suites; gates 9 run, **34 files scanned**, 0 fail / 0 warn / 0 accepted, baseline 0; 187 tasks, 280 artboards. Same as the builder's numbers. Docs only, so the gates prove nothing about the sandbox files; the manual checks above do. |
| Capability 1: every PLAN call saved | NOT RUN to a result for items 7, 11 (purchases) and 13 (external blocker), recorded correctly | PLAN items 1 to 6, 8, 9, 10, 12 ran to a result (BVN and selfie to a failure, since no sandbox test BVN is known). Item 7 (bank send) and item 11 (electricity, airtime) are saved with request and response but refused "Unable to find customers"; meter preview ran (400). Item 13 webhooks NOT RUN (no URL, no dashboard). The blocker and what unblocks it are written (README:28-37, question 17). Every re-run section has as many requests as responses (87 saved = 86 calls, one saved twice). |
| Capability 2: every question answered or 'unknown' | passed | `naira-api.md` 1 to 22 each marked Answered, Partly answered or Open with evidence; README answers 1 to 9 and lists 10 to 22. |
| Capability 3: no secret or real BVN committed | passed | As in "Secrets and personal data". The real BVN and NIN are masked completely. |

Sandbox calls I made: 10, all `GET` to `https://dev.fintavapay.com/api/dev`, key read with `sed`, sent through stdin to curl, never printed or saved; responses kept only in my scratchpad. 10:27:41 `/merchant/balance` 200; 10:27:42 and 10:27:44 `/customer/wallet/balance/{A, B}` 200; 10:27:45 `/transaction/reference/` `OPS02R-W2W-001` 200, `Aq3QKQ...` 404, `OPS02R-W2W-005` 200, `OPS02R-MT-001` 200 `{}`; 10:27:46 `OPS02R-BC-001` 200 `{}`, `/txn/merchant?page=1&take=20&order=DESC` 200; 10:28:11 `OPS02R-MT-001` again 200 `{}`. Nothing moved, nothing charged (merchant balance 49650 before; the history shows no new row).

NOT RUN: webhooks and every bank send or purchase (forbidden to me, and blocked anyway); `GET /banks` (not needed); `OPS02R-W2W-004`/`-006` "no record" (would have needed more calls).

### Findings (re-run)

1. **defect (minor): the selfie and its retry limit are credited to the wrong tasks.** `fees.md`:65 and `naira-api.md`:131 say the backend runs "the BVN check and the selfie ... (KYC-01, KYC-04)"; `fees.md`:78 says "KYC-01 and KYC-04 limit retries". The selfie match and its retry rule are KYC-02 ("Selfie match to the BVN photo", `tasks/KYC-02.md`:33 and :43); KYC-04 is "account opened, create PIN", and neither KYC-01 nor KYC-04 mentions retries. (Main said "KYC-04 limits retries"; this branch rewrote the line and widened it.) Fix: KYC-01 (BVN) and KYC-02 (selfie, retries).
2. **defect (new sandbox behaviour, not a builder error): the refused bank sends no longer come back from the lookup.** At 10:27:45, 10:27:46 and 10:28:11 UTC, `GET /transaction/reference/OPS02R-MT-001` and `/OPS02R-BC-001` answered **HTTP 200 with the body `{}`** (`content-length: 2`, `etag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"`), while `/txn/merchant` at 10:27:46 still listed `OPS02R-MT-001` as ₦100 `PENDING`. At 10:18:41 the same lookup returned the full `PENDING` record (`14-bank-transfer.md`:623-680). The docs now steer MONEY-06 wrong: `naira-api.md`:38 ("a timed-out send is looked up by our reference before any retry") and :73 ("Not found is not one code") don't know that a 200 can carry `{}`, and README:184 and `14-`:36 say these records are findable by reference. Fix: record the `{}` lookup in `14-` (and `11-`), add "200 with `{}`" to the not-found list in `naira-api.md`, say a lookup must check for `data`, and add it to question 21.
3. **defect (minor): the administrator's identity is not "masked completely", as README:109-111 and :265 say.** The first-name and last-name initials (`V***`, `A***`) and the last 4 digits of the administrator's real phone (`*******1201`) stay in `12-transaction-by-id.md` (the 09:41:16 response) and on every row of `10-merchant-history.md`, 31 added lines in all. Round 2 of the first run accepted this as a note under "last 4 at most"; this re-run was asked for none of the administrator's identity, and the README promises it. Fix: mask them fully (`***`), or change the README's wording and get the owner's ok.
4. **note:** `naira-api.md`:326 "Events did fire in the re-run" reads as if webhook deliveries fired. Nothing was received or seen; `23-`:19-21 says what is meant (transfers happened that would have sent `wallet_to_wallet_transfer_v2` to a configured URL). Suggest the same wording.
5. **note:** `docs/PROGRESS.md` is in the diff but not in the builder's file list; it is regenerated, so this is expected.

Status: back to `building` for findings 1 to 3. The bank-send and bill blocker (question 17) and webhooks are external, not defects.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
