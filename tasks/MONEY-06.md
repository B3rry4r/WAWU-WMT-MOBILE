---
id: MONEY-06
title: Fintava client
owner: YOU
area: MONEY
order: 49
priority: launch
repo: wawu-backend
type: third-party
status: done
depends_on: [MONEY-04, OPS-02]
decisions: [R-25]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-06 · Fintava client

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A new Fintava gateway beside the Flutterwave one: one place in the backend that talks to Fintava. Fintava
goes beside Flutterwave until the web has no callers (CLAUDE.md rule 6); the web's Flutterwave paths keep working
until WALLET-30 removes them.

## Scope

Bearer-key auth (Fintava has no request signing), sandbox and live config, error mapping to our error shape,
timeouts. The Fintava variables are added to the `hub-api.env` list in wawu-backend `deploy/README.md` (step 4).
Local values live in the backend's `.env`; production values are put in `/etc/wawu/hub-api.env` on the
DigitalOcean droplet by OPS-10 (deploys go through GitHub Actions; there is no staging, R-25).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md` and the real sandbox calls in `docs/fintava/sandbox/` (OPS-02 and this task's `26-money06-client.md`); a real sandbox response overrides them.

Base URLs: sandbox `https://dev.fintavapay.com/api/dev`, live `https://live.fintavapay.com/api/dev`. Bearer key, no request signing. Errors are read by message as well as status: business errors `{ status, timestamp, message: [string], path }`, validation errors with the NestJS object nested in `message`, the documented shape `{ statusCode, message, error }` with `message` a string or an array; a wrong key is 400 or 404 (never 401), a blacklisted NIN is 403. `/single/transfer` is deprecated: use `/transaction/wallet-to-wallet`. Wallet-to-wallet, `/bank/credit/merchant` **and `/bank/credit`** take our `CustomerReference` and refuse a repeat; a refused wallet-to-wallet send leaves its reference usable, a refused bank send can leave a `PENDING` record and uses its reference up. Transfer responses swap their reference fields (their `customerReference` is Fintava's findable reference, their `reference` is not findable). Create customer answers 201; a customer has four ids. History lists only debits, and `/txn/merchant` is cached about 5 minutes per page and take. A 2xx is not proof of payment; a 5xx (`500 ECONNRESET`) or a timeout on a send is "unknown" until a lookup settles it. A lookup by reference (or by id) can answer `200 {}`: neither found nor not found. A frozen wallet can neither send nor receive. Bank sends and bill purchases are refused in the sandbox (question 17).

## Capability checks

- [ ] Against the sandbox, each call in `docs/PLAN.md` items 1 to 13 returns a typed result through the client, and a bad key gives a clear typed error. Bank sends and bill purchases that the sandbox refuses (the blocker below) are reported NOT RUN with that reason.
- [ ] No Fintava secret appears in logs.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-06` in both repos. Round 1: wawu-backend `9dc61f3` (main `5c07568`). Round 2: wawu-backend `b1e361f`; mobile with main `12d9b22`, then `637fbc6`, merged in.
- **Built (backend, additive):** `src/fintava/` (client, config, errors, amounts, reconcile, types, module; not mounted, no route served, no Flutterwave file touched); `test/fintava/fintava-double.ts` (local double answering the recorded sandbox bodies); `scripts/fintava/sandbox-check.ts` (re-runnable sandbox proof). `.env.example` and `deploy/README.md` step 4 list `FINTAVA_BASE_URL`, `_API_KEY`, `_WEBHOOK_SECRET`, `_TIMEOUT_MS`, `_MONEY_TIMEOUT_MS`, `_CHECK_TIMEOUT_MS`, no values. `docs/contract/CONVENTIONS.md` section 4 corrected (`/bank/credit` takes our reference).
- **Calls (PLAN 1 to 12; 13 is MONEY-07's receiving end):** BVN, selfie, phone checks; create, get, find by phone, list customers; wallet and merchant balance; customer and merchant history; banks; bank and wallet name checks; bank and merchant bank sends; lookups by reference and id; wallet to wallet; freeze, unfreeze; discos, meter preview, data, cable lists; electricity, airtime, data, cable purchases. Typed results in kobo; Fintava's embedded identity (BVN, NIN, admin login) dropped.
- **Idempotency (round 2 rule):** every send carries our `CustomerReference`; a lost answer, and a repeated reference (the send exists), are unknown outcomes with `recordMayExist: true`, never refunded or charged again. Resends go only through `retry*`, which reconcile first (lookup, then the sender's history). Absent needs Fintava's own JSON `404 "Transaction not found!"` AND no row in history AND the money timeout plus `FINTAVA_RESEND_SAFETY_MS` (10 min) since the first send; then wallet to wallet resends the same reference, a bank send only a new one. Any other 404 (route, empty, HTML), `{}`, PENDING or unreachable: wait. MONEY-08 must hold one retry at a time per payment (documented on the client).
- **Round 2, verifier defects 1 to 5:** (1) the host is compared with the two exact strings; `constructor`, `__proto__`, `toString`, `hasOwnProperty`, `valueOf`, `isPrototypeOf` refused in test and production; (2) only that JSON 404 is absent, the rest `outcome_unknown` (by reference and by id); (3) the safety window and the history check: the verifier's case (send done at 600 ms, timeout 200 ms, retry at once) sends once, then reads `settled`; (4) `duplicate_reference` carries `recordMayExist: true` and maps like `outcome_unknown` ("still confirming"), kept as its own kind so a caller knows the record exists; (5) docs timing rewritten from the observations. Note acted on: any run of 8 or more characters of the key is masked in Fintava's texts. Each fix mutation-checked: reverting it fails its tests.
- **Check 1, typed results and a bad key:** sandbox run 3 (44 calls): 25 passed, 0 failed, 5 NOT RUN, balances back to start; a bad key (400 and 404) is `auth`. Runs 1 and 2 each failed 2 steps on the script's own `{}` expectations (recorded). Evidence `docs/fintava/sandbox/26-money06-client.md`. NOT RUN: BVN, selfie, phone (charged); create (no new customers); bank sends and bill purchases (question 17, unblocked when a ₦100 `/bank/credit/merchant` to `0123456789`/`000013` stops answering "Unable to find customers"); webhooks (MONEY-07).
- **Check 2, no secret in logs:** `fintava-logging.spec.ts` captures the Nest logger, stdout, stderr and console against a double that echoes the key, fragments of it and a BVN back, over success, refusals, auth, 5xx, timeout, hang-up and an unreadable body; no key, no 8 characters of it, no `Bearer` token, no BVN or phone in logs, errors or `inspect(client)`. Mutation-checked twice (logging key characters; masking only the whole key). Sandbox output: 0 key windows.
- **Tests:** 3 suites, 192 tests (units 118, contract 73, logging 1).
- **Runs (round 2, `b1e361f`):** tsc 0; eslint 0 on changed files; full `test:contract` 96 suites, 1919 passed, 3 skipped, 0 failed (fresh `money06_test`, my own mock WAWU ID on :4001; an earlier run failed 48 auth tests only because an orphaned mock from a deleted verifier worktree held :4001 with another key pair, which I stopped); protected suite 253/253 on a fresh `money06_protected_test` (main 253/253 in round 1); gates 16 fail / 3 warn / 76 accepted on 553 files, the same 16 as main, the warns are `PROVISIONAL(FINTAVA-TIMEOUTS)`, `PROVISIONAL(FINTAVA-RESEND-SAFETY)` and main's PIN one; baseline check passes. Mobile `npm run check` on the branch with main `12d9b22`: exit 0 (13 suites, 250 tests, gates 0 on 69 files); again after merging main `637fbc6` (UI-03): exit 0 (typecheck 0, lint 0, 14 suites, 271 tests, gates 0 on 71 files, tasks check passes).
- **New sandbox facts (naira-api.md updated, question 21 widened):** a lookup by reference can answer `200 {}` for a record that exists, SUCCESS ones included (seen from about a minute after the send to at least 18.5 minutes, flipping with the full record within 1 to 2 seconds), while an unknown reference stays 404; a ₦10 send the script gave up on after 3 s landed, and `reconcile` found it SUCCESS (`settled`, not resent).
- **Defaults (agent), owner may override:** timeouts 15, 30 and 30 s, a 30 s retry-after and a 10-minute resend safety window (at least 1 minute), all PROVISIONAL; `FINTAVA_BASE_URL` empty means sandbox, except in production where it must be set; only Fintava's two hosts are accepted; an identity refusal maps to a plain 422 (no money code fits); 9mobile data is asked for as `ETISALAT`; the ₦100 airtime minimum is checked before sending.
- **Not done:** no route served (MONEY-07 onwards); the success bodies of bank sends, bill purchases, the BVN check and the selfie are unseen (questions 17 and 11), so those parsers follow the docs and keep every scalar. No gap or shared-change row needed.

## Verifier report

Verifier, 2 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/MONEY-06` `9dc61f3` (main `5c07568`, up to date) and mobile `wmt/MONEY-06` `9d8bc0f` (built on main `02d766b`), each in a fresh detached worktree, with my own databases `vm6_money06_test` and `vm6_money06_protected_test` (dropped afterwards) and the mock WAWU ID on :4001. **Verdict: `building`, defects 1 to 5 open.** Mobile main moved to `12d9b22` (AUTH-03) during verification; the branch no longer merges cleanly (generated files) and must merge main again before its pull request.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: `tsc --noEmit` exit 0; eslint (no `--fix`) on the 12 changed `.ts` files exit 0; gates on main 16 fail / 1 warn / 76 accepted on 543 files, on the branch 16 / 2 / 76 on 553, the same 16 failures (diffed line by line), the new warn is `PROVISIONAL(FINTAVA-TIMEOUTS)` only; `check_baseline.py` passes (108 entries). Mobile `npm run check` on the branch exit 0: typecheck 0, lint 0, 13 suites 250 tests, gates 0 on 69 files, tasks check passes. |
| V2 Contract | failed | The 3 new suites: 164 of 164. Full `test:contract` on my database: 96 suites, 1891 passed, 3 skipped, 0 failed (a first run failed 99 tests in 7 suites only because a fresh worktree has no `mock-wawu-id/private.pem`; re-run with the running mock's key pair, green). My own 38 tests against the double (deleted afterwards): 36 behaved as claimed, and they found defects 1 to 4. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh`, lock `origin/main`: main `5c07568` 253/253, branch `9dc61f3` 253/253 (all 244 required). `npm run contract:build` on the branch regenerates `contract/openapi.json` byte-identical to main's. The diff touches no Flutterwave, controller, `app.module`, prisma, `src/common`, guard or `contract/` file, and nothing outside `src/fintava/` imports `FintavaModule`. |
| V6 States | passed, with defects 2 and 4 | Every failure state driven over a socket through the double: 5xx, timeout, hang-up, unreadable 2xx, `200 {}` (write: `not_confirmed`; lookup: unknown), `200 { data: null }`, 404, frozen (`wallet_inactive`), repeat reference, wrong key 400/404 (`auth`, never `not_found`). Two are misread: defects 2 and 4. |
| V8 Money attack | failed | Reconcile from history holds: across every `{}` case below nothing was sent twice and nothing failed was reported settled. But defects 1 to 3 each give a path to a second bank payout, and defect 4 reports a landed send as a plain failure. Bank sends and bill purchases against the sandbox: NOT RUN (sandbox refuses every payout, question 17; unblocked when a ₦100 `POST /bank/credit/merchant` to `0123456789`/`000013` stops answering "Unable to find customers"). |
| V9 Live seam | NOT RUN (no route) | The client serves no route (MONEY-07 onwards), so there is no login-to-server-value check yet. The client's own seam: 9 read-only sandbox calls through it, all typed (below). |

**Check 1 (the safety logic), my tests against the double:**
- A send that succeeded, lookup now `{}`: merchant history SUCCESS gives `settled`; customer history `success` (lower case) gives `settled`; history (cached) without the row gives `wait empty_lookup`; a bank send `{}` plus history SUCCESS gives `settled`; history 502 gives `wait unreachable`. No POST in any.
- A refused bank send left PENDING: lookup `{}` plus history PENDING, lookup found PENDING, and lookup `{}` with history empty all give `wait`, no POST; status `REVERSED` gives `wait`; a record for another reference gives `wait`; `200 { data: null }` gives `wait`.
- A send that never reached Fintava (`404 "Transaction not found!"`, 10 minutes old): wallet to wallet is sent once under the same reference; a bank send once under the new reference; a 404 "Invalid API Key" on the lookup throws `auth`, nothing sent.
- A 404 inside the money timeout (29 s): `wait too_soon` for both kinds, nothing sent.
- Writes: `200 {}` is `not_confirmed` (record may exist), `500 ECONNRESET` and a timeout are `outcome_unknown`, the frozen message is `wallet_inactive`.
- Where it breaks: defects 2, 3 and 4.

**Check 2 (secrets):** `fintava-logging.spec.ts` 1/1. My mutation (every failure log line also prints key characters 10 to 17) fails it; with the file restored it passes. No 8-character window of the real key (65 characters, 58 windows) in: both branch diffs, every commit patch on both branches (backend 1 commit, mobile 3), every changed file, the commit messages, and all my logs and sandbox output. `26-money06-client.md`: no 11-digit run, no phone pattern; its 10-digit runs are the sandbox account numbers, the bank stub and the made-up `1100000000`.

**Check 3 (host lock):** unset is the sandbox (development, test); live only when `FINTAVA_BASE_URL` names it; refused: `evil.example.com`, `dev.fintavapay.com.evil.com`, `http://` to either Fintava host, userinfo on live, bare `fintavapay.com`, `ftp://`. Production with it unset or blank throws; a Nest testing module that imports `FintavaModule` fails to compile under `NODE_ENV=production` without it, and resolves `live` with the live URL. Today's app never reads it (AppModule does not import the module), which is what "unmounted" means; the guard bites when MONEY-07 imports it. But two other hosts get through: defect 1.

**Sandbox calls (verifier), 9 of the 10 allowed, all GET to `https://dev.fintavapay.com/api/dev`, 16:00:18 to 16:00:21 UTC,** through the client behind a fetch guard (GET only, that host only, at most 10); no money moved, nothing charged:

| # | Call | HTTP | Client read |
|---|------|------|-------------|
| 1 | by reference `MONEY06-SBX-20261002154144-1` (SUCCESS, sent 15:41:44) | 200, 769 bytes | found SUCCESS |
| 2 | by reference `OPS02R-W2W-001` | 200, 756 bytes | found SUCCESS |
| 3 | by reference `OPS02R-MT-001` (refused bank send) | 200, 756 bytes | found PENDING |
| 4 | by reference, a reference that never existed | 404 "Transaction not found!" | absent |
| 5 | by reference `MONEY06-SBX-20261002154144-1` again, 1.2 s after #1 | 200, body `{}` | unknown, so to history |
| 6 | `/txn/merchant` page 1, DESC | 200 | found SUCCESS in history: `settled` |
| 7 | by reference `OPS02R-MT-001` again, 1.1 s after #3 | 200, body `{}` | unknown, so to history |
| 8 | `/txn/merchant` page 1, DESC | 200 | found PENDING in history: `wait pending` (bank) |
| 9 | by id `00000000-0000-0000-0000-000000000000` | 200, 49 bytes (`data: null`) | absent |

So `{}` is real and the client reads it as documented (never absent; history decides). The timing in the docs is not what the sandbox did: defect 5.

**Findings**

1. `defect` (host lock). `src/fintava/fintava-config.ts:106` reads `HOSTS[url.hostname]` from a plain object, so the prototype answers for two hostnames: `https://constructor/api/dev` gives environment `Object` (a function) and `https://__proto__/api/dev` gives `Object.prototype`. Both are accepted even with `NODE_ENV=production`, and a client built on `https://constructor/api/dev` attempted the request with the Bearer key (it failed only on DNS). The claim "only Fintava's two hosts are accepted" does not hold.
2. `defect` (money). Any 404 on the lookup by reference is "absent", whatever its body: `src/fintava/fintava-error.ts:199` maps every 404 to `not_found`, and `src/fintava/fintava-client.ts:837` turns that into `absent`. A NestJS route 404 (`{ statusCode: 404, message: "Cannot GET /api/dev/transaction/reference/...", error: "Not Found" }`), an empty body and an HTML gateway page each made `retryMerchantBankTransfer` send again under the new reference (one POST each). The only absence signal in the evidence is `404 "Transaction not found!"`. If Fintava moves or deprecates the lookup path (it has deprecated `/single/transfer`), or a gateway answers 404, every unknown bank send is paid a second time.
3. `defect` (money). The in-flight guard equals the client's own money timeout: `src/fintava/fintava-reconcile.ts:48` compares the age with `inFlightMs`, which `src/fintava/fintava-client.ts:1103` sets to `moneyTimeoutMs`. So the first retry after a timeout passes the guard immediately, with no margin, although Fintava carries on after the client gives up (`sandbox/26-`: a ₦10 send abandoned at 3 s landed). Test: money timeout 200 ms, a merchant bank send the double completes at 600 ms, retry straight after the timeout: the lookup is still 404, the decision is `resend_new_reference`, and both `V-B-1` and `V-B-2` reached `/bank/credit/merchant`. The comment at `fintava-reconcile.ts:22` ("not while the first request could still be running at Fintava") is not what the code guarantees.
4. `defect` (money). A wallet-to-wallet `duplicate_reference` means Fintava already has that reference, so the money may have moved, yet the error carries `recordMayExist: false` (`src/fintava/fintava-error.ts:97-99`; `walletToWallet` at `src/fintava/fintava-client.ts:932` sets nothing for it) and maps to "Payments are not available right now. Try again in a moment." (`fintava-error.ts:261`). It is what `retryWalletToWallet` gets when its same-reference resend races the first send (defect 3) or a second retry, and a caller trusting `recordMayExist` would refund the payer or let them pay again.
5. `defect` (docs). The `{}` timing is stated three ways, and the sandbox matched none: `docs/fintava/naira-api.md:52-53` "about a minute after each was found", `naira-api.md:427` "about a minute after they are made", `tasks/MONEY-06.md:63` "about a minute after each send". At 16:00 UTC a record 18.5 minutes after its send was served in full, then `{}` 1.2 s later (calls 1 and 5, again 3 and 7). Also `naira-api.md` (the "Not found" point, and `sandbox/26-money06-client.md:34`) says the unknown id moved to `{}` "in the later two" runs; at 16:00:20 it was `data: null` again. Docs to say: `{}` can answer for an existing reference at any time, even a second after it was served, and it comes and goes. The task's "Fintava facts" and CONVENTIONS section 4 give no timing and agree with the code and the evidence.

Notes, not defects:
- `maskFintavaText` (`src/fintava/fintava-error.ts:153`) masks the whole key and `Bearer` tokens only. A provider message that echoed part of the key without "Bearer" (I tried its first 20 characters) is logged as it is. Fintava's real messages don't echo the key, so check 2 holds; masking every 8-character window would close it.
- `getTransactionById` reads `200 { data: null }` as `absent` (`src/fintava/fintava-client.ts:880`), though the by-id lookup comes and goes like the one by reference. Reconcile does not use it; a resend must never be based on it.
- Two concurrent bank retries, each with its own new reference, both send. MONEY-08 must allow one retry at a time per payment.
- The backend specs carry Fintava's documented example BVN and NIN and made-up test phones unmasked. None is a real person's. The masking rule covers the docs and sandbox files, and those are clean.

NOT RUN: bank sends and bill purchases against the sandbox (question 17); the BVN, selfie and phone checks (charged); creating a customer; webhooks (MONEY-07); a re-run of the builder's money-moving `sandbox-check.ts` and the remaining reads (balances, banks, names, customers, freeze, bill lists, bad key), outside the verifier's 10 read-only calls (the builder's run 3 in `sandbox/26-` is the evidence); V9 (no route yet); V10 (not in this task's passes).

### Round 2 (verifier, 2 Oct 2026)

Re-verified wawu-backend `wmt/MONEY-06` `b1e361f` (on `9dc61f3`, main `5c07568`) and mobile `wmt/MONEY-06` `465253c` (main `637fbc6` merged in), in fresh detached worktrees, with my own databases `vm6r2_money06_test` and `vm6r2_protected_test` and my own mock WAWU ID (:4001 for the contract suite, :4011 for the protected suite; both stopped, databases dropped). **Verdict: PASS, `review`.** Defects 1 to 5 are fixed and no new defect was found.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0; eslint (no `--fix`) on the 12 changed `.ts` files 0; gates main 16 fail / 1 warn / 76 accepted on 543 files, branch 16 / 3 / 76 on 553, the same 16 failures (diffed), warns are the `PROVISIONAL` markers only (`FINTAVA-TIMEOUTS`, `FINTAVA-RESEND-SAFETY`, main's `PIN-LOCK-MINUTES`); `check_baseline.py` passes. Mobile `npm run check` exit 0: 14 suites, 271 tests, gates 0 on 71 files, tasks check passes. |
| V2 Contract | passed | Fintava suites 192/192 (164 + 28). Full `test:contract` on a fresh database: 96 suites, 1919 passed, 3 skipped, 0 failed. My own 75 tests against the double (deleted afterwards): 73 passed. The other 2 cover one input, and the rule it shows is fine (note 1 below). |
| V3 Regression | passed | Protected suite, fresh database, lock `origin/main`, mock on :4011: main `5c07568` 253/253, branch `b1e361f` 253/253 (all 244 required). The branch diff still touches no Flutterwave, controller, `app.module`, prisma, `src/common`, guard, `.pipeline` or `contract/` file. |
| V6 States | passed | The round 1 states plus every 404 form below, the resend window, and a repeated reference on a resend. |
| V8 Money attack | passed | No path found to a second send or to a landed send reported as failed (below). Bank sends and bill purchases against the sandbox: NOT RUN (question 17). |
| V9 Live seam | NOT RUN (no route) | The client serves no route yet (MONEY-07 onwards). 3 read-only sandbox calls through it (below). |

**Defects, each fixed and mutation-checked.** Each mutation was applied on its own and run against the builder's suites and mine, then the file was restored.

1. **Host lock: fixed.** Refused under `production`, `test` and unset NODE_ENV: `constructor`, `__proto__`, `tostring`, `toString`, `hasownproperty`, `valueof`, `isprototypeof`, `prototype`, `__definegetter__`, `propertyisenumerable`, `tolocalestring`. Also refused in production: other hosts, look-alikes, `http`, a username in the URL, the bare domain, and `127.0.0.1`. The two Fintava hosts still work, and production with the base URL unset still throws. Mutation (back to an object lookup): builder 2 failed, mine 6 more failed.
2. **Only Fintava's own 404 is absent: fixed.** Each of these makes both `retryMerchantBankTransfer` and `retryWalletToWallet` answer `wait unrecognised` and send nothing, and by-id never answers `absent`:
   - a framework "Cannot GET";
   - an empty body, or an HTML page;
   - a JSON 404 saying "Not Found", or "No wallet exists for the customer";
   - "Transaction not found!" sent beside a second message;
   - "Transaction not found!" in the nested validation shape.

   The real body still reads as absent. Sandbox call #1 below, `{ status, timestamp, message: ["Transaction not found!"], path }`, gave `absent` through the client.

   Mutations:
   - any 404 counts as absent: builder 9 failed, mine 14 more;
   - the message check dropped: builder 2, mine 6;
   - the classify guard dropped: builder 3. Mine still pass, because the client's message check alone still refuses those 404s.
3. **Resend needs the real 404, no history row and the timeout plus the safety window: fixed.**
   - My round 1 reproduction (timeout 200 ms, send lands at 600 ms, immediate retry) now gives `wait too_soon`, and only one send reached Fintava.
   - The minimum window (60 s) still waits at 59 s.
   - The default (30 s plus 10 min) still waits at 10 min.
   - `FINTAVA_RESEND_SAFETY_MS` of 0, 1, 59999, 86400001, `abc` and -5 are refused when the client is built.
   - The real 404 with a PENDING row in history gives `wait pending`; with a SUCCESS row, `settled`; with history down, `wait unreachable`.
   - The real 404, old enough and with no row: one send (bank under the new reference, wallet to wallet under the same one).
   - `{}` cases unchanged from round 1.

   Mutations:
   - the safety window removed: builder 2 failed, mine 3 more;
   - history ignored on a 404: builder 1, mine 2;
   - the age check removed: builder 5, mine 3.
4. **A repeated reference: fixed.** On a resend it is `duplicate_reference` with `recordMayExist: true`. Its HTTP error is 503 "We are still confirming this payment...", equal in status and body to `outcome_unknown`'s.

   Mutations:
   - dropped from the unknown outcomes: builder 2 failed, mine 1 more;
   - its HTTP case removed: builder 1, mine 1.

   **Ruling: keeping it a separate kind is acceptable.** `FINTAVA_UNKNOWN_OUTCOMES` lists it, and a caller sees the same `recordMayExist` and the same HTTP error as for `outcome_unknown`. The separate kind also tells the caller that Fintava has the reference, so reconcile will find it. One condition: references must stay unique per payment (derived from our own transaction id, CONVENTIONS section 4). A reused reference would otherwise reconcile to the older send.
5. **Docs: fixed.** `naira-api.md:50-60` and `:94-99`, `sandbox/26-money06-client.md:28-49` and `tasks/MONEY-06.md:64` now give only observed timing. `{}` was seen from about a minute to at least 18.5 minutes after a send (and on hours-old records), flipping within 1 to 2 s, and an unknown id answers `data: null`, sometimes with no `data`. They agree with each other, with CONVENTIONS section 4 (now names the real 404, history and the safety window), with the task's "Fintava facts", and with my calls.

**Builder's notes.**
- **Masking: holds.** Any run of 8 or more key characters is masked: 20, 9 and 8 characters, at the key's end, two runs, a run beside digits. 7 characters are left, as designed. A 20-character echo through the client never reaches the error.

  The logging spec now echoes a fragment without "Bearer". It fails when masking goes back to the whole key only, and when the run masking is disabled. It passes restored.
- **One retry at a time: documented, mostly.** It is in the class comment (`fintava-client.ts:274-277`), which names `retry*` and the two-bank-retries case, and on `retryWalletToWallet` (`:1146`). `retryBankTransfer` and `retryMerchantBankTransfer` don't repeat it. The class comment covers them, so this is a note for MONEY-08, not a defect.

**Secrets.** No 8-character window of the real key in:
- either branch diff against its main;
- any commit patch (backend 2 commits, mobile 8);
- any changed file;
- my logs and the sandbox output.

**Sandbox, 3 read-only GETs to `https://dev.fintavapay.com/api/dev`, 16:27:31 UTC, through the round-2 client** behind a fetch guard (GET, that host, at most 3); no money moved, nothing charged:

| # | Call | HTTP | Client read |
|---|------|------|-------------|
| 1 | by reference, a reference that never existed | 404, `{ status, timestamp, message: ["Transaction not found!"], path }` | absent |
| 2 | by reference `MONEY06-SBX-20261002154144-1` (sent 15:41:44, 46 min earlier) | 200, 769 bytes | found SUCCESS |
| 3 | by id `00000000-0000-0000-0000-000000000000` | 200, 49 bytes (`data: null`) | absent |

**Notes (not defects):**
1. A JSON 404 whose only message is "Transaction not found" (no `!`), in the NestJS `{ statusCode, message, error }` shape, reads as absent. That shape is one of Fintava's documented error shapes (task "Fintava facts"), and the text is Fintava's, so this is in line with the rule. It is the only input my 2 failing tests cover.
2. A non-default port on a Fintava host (`https://dev.fintavapay.com:444`) is accepted; the key still goes only to Fintava's host.
3. Any MONEY-08 caller must hold one retry at a time per payment (above).

NOT RUN: bank sends and bill purchases against the sandbox (question 17, unblocked when a ₦100 `POST /bank/credit/merchant` to `0123456789`/`000013` stops answering "Unable to find customers"); the BVN, selfie and phone checks (charged); creating a customer; webhooks (MONEY-07); the builder's money-moving `sandbox-check.ts` (not re-run; read-only calls only); V9 (no route yet); V10 (not in this task's passes).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
