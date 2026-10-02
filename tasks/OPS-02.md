---
id: OPS-02
title: Fintava test keys: the first real calls
owner: YOU
area: OPS
order: 5
priority: launch
repo: wawu-wmt-mobile
type: ops
status: review
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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
