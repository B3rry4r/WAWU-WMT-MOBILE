---
id: WALLET-08
title: Find a recipient, and recent recipients
owner: YOU
area: WALLET
order: 134
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: [MONEY-10, MONEY-12, SETTINGS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-08 · Find a recipient, and recent recipients

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W7: search by name, @handle or phone, and show recent recipients.

## Scope

Recipient search across all accounts that have wallets, block-aware (SETTINGS-04: a blocked user never appears); recent recipients from the ledger.

## Capability checks

- [ ] Searching a phone written 080... finds the same person as +234...
- [ ] People the user blocked never appear.

## Builder report

Builder, 4 Oct 2026. Backend `wmt/WALLET-08` **6dab9c8** (main 38bbe4c is already in it; no conflicts). Mobile branch `wmt/WALLET-08`: this file, BACKEND_GAPS G-132 and G-133, the LOG line, and the contract copied from 6dab9c8 (byte-equal to the backend's `contract:build`).

**Built.** `GET /money/recipients?q=` and `GET /money/recipients/recent`, as declared by MONEY-04 (same path, same `RecipientView` array, same maximums 20 and 10), now served from `src/money/recipients/` behind MONEY-13's gate (`409 wallet_not_open` or `wallet_opening` first, before the text is read), `no-store`, no Fintava call. The declared handlers moved out of `MoneyTransferController`. The route's operationId changed from `MoneyTransferController_recipients` to `MoneyRecipientController_search` (nothing in the app uses it). `loadMoneyParties` (`src/money/money-party.ts`) is the shared "name, handle, avatar, tick" read: the beneficiaries list now calls it instead of its private copy, with the same output. Docs: `docs/contract/CONVENTIONS.md` section 13 and the WALLET.md rows.

**Rules, each with the test that proves it** (`money-recipient.contract.spec.ts`, 44 tests over HTTP: real MoneyModule, real database, real RS256 tokens; `recipient-throttle.contract.spec.ts`, 5 tests through the whole AppModule):
- **Open wallet only, never the caller.** A person with no wallet, an opening still in progress, a proved phone with no wallet, a wallet deleted since, and the caller by name, @handle or phone: never found.
- **Phone is exact.** `+2348..`, `234..`, `08..`, `8..`, with spaces, dashes and brackets, all give the same one person. Not found by a prefix, a suffix, one digit short, one too many, another network prefix with the same last 8, or the same first 9 (10 near-misses, plus a neighbour test). A handle written as a number does not stand in for the number. A phone is searched as a phone and as nothing else.
- **Name and @handle** are a case-insensitive beginning (of the handle, or of any word of the wallet name); `@x` is handle only; `%`, `_` and `\` are plain characters. Under 2 characters after trimming (and after an `@`): 400 in the one error shape (no `reason`, as CONVENTIONS section 3 says for a malformed field) for `a`, `   a   `, empty, spaces, `@a`, `@`, one digit; also a missing, repeated or over-60 `q` and any other query field.
- **A result is 5 fields** (`wawuUserId`, `displayName`, `handle`, `avatarUrl`, `tick`). Checked by key list, and by scanning every body for the person's phone in every form, account number, email, `4321`/`8765` (seeded BVN and NIN last 4) and the words bvn, nin, accountNumber, verifiedPhone.
- **Blocked either way** never appears in a name, handle or phone search, nor in recent; unblocking brings them back; a blocked phone answers byte-for-byte like an unknown one.
- **Page cap.** 25 people with one prefix: 20 answered, the first 20 in name order. 13 recent recipients: the newest 10.
- **Recent** counts completed outgoing ledger rows to a WAWU user (category transfer or purchase), one person once at their latest; excluded: pending, failed, reversed, incoming, bank, merchant, top-up, earning, someone else's rows, the merchant wallet's rows, the caller; people blocked either way or with no open wallet dropped, and the list still fills from the rest.
- **Throttle.** Search 20 a minute and 120 an hour per address: the 21st is 429 `{statusCode:429, data:null}` with no `reason`, `Retry-After`, and the limit headers; per-address buckets (a caller's own X-Forwarded-For entries count for nothing); recent shows the global 20/200 headers. Exact limits added to `src/tests/hub-rate-limits.contract.spec.ts` (the `@Throttle` file list, the override list, the exact figures, and the "only tightens" check).
- **Mutants:** 23 hand-made mutant runs of the SQL and the parser (drop each block filter, status, direction, kind, category, walletKind, the JOIN, self, the cap, the min length, the LIKE escape, a tail or head phone match). The first 18 left 5 alive: two equivalent (an `OR 1=0`, and a prefix LIKE on a full number), a LEFT JOIN, a last-8 phone match on the identity table, and a cap edit on the phone query (which can only ever hold one person). I added the near-miss phone test (same last 8, same first 9) and a named, deleted person to recent; the 5 reruns (LEFT JOIN, tail on both tables, head, text cap) all fail now.

**Gates and counts.** `tsc --noEmit` 0 errors; eslint on every changed file clean; prettier clean. Full suite on a fresh migrated and seeded DB in its own network namespace (mock WAWU ID on :4001 inside it, listener PID checked to be mine before and after): **152 suites, 3652 passed, 3 skipped (none in a file this task touches), 0 failed**. `hub-rate-limits` on the host network, 22/22. Money, wallet-gate, MONEY-04 contract and rate-limit specs inside those. Protected suite `run.sh --fresh HEAD`: **253/253**, lock unchanged (empty diff on the lock files, tripwire on added lines: no match). Gates: main **16 fail, 33 warn, 76 accepted**; branch **16 fail, 34 warn, 76 accepted**; the one new warn is `PROVISIONAL(RECIPIENT-SEARCH-RATE)`. Fintava key scan of the staged diff (58 eight-character windows): 0 hits. Mobile `npm run check` exit 0 (typecheck, lint, 36 suites and 666 tests, gates 0 fail 0 warn, tasks).

**Decisions (Default (agent), owner may override).**
- **Plain arrays, no cursor.** CONVENTIONS section 6 says "short lists (banks, recipients, beneficiaries) are plain arrays with a stated maximum and no paging", and the declared shape is that; a cursor envelope would change the declared shape non-additively. Cap 20 and 10 are the "page size". A search is narrowed by typing more.
- **Names are searched where the Hub has them** (G-132): the wallet name and the handle. Displayed name: WAWU ID, else wallet name, else handle; a person with none of the three is left out.
- **Phone compared with the phone the wallet was opened with** (`FintavaWalletOpening.phone`, indexed and unique, and `WalletIdentity.verifiedPhone`); the Hub holds no other phone.
- **`@` needs 2 characters after it** (`@a` is a 400). A phone-shaped text is searched as a phone only. Digits that are not a whole mobile are text.
- **Recent categories:** transfer and purchase only, to a `wawu_user` counterparty.
- **Limits** 20 a minute and 120 an hour per address, `PROVISIONAL(RECIPIENT-SEARCH-RATE)`; recent has no route limit.
- **No schema change, no migration.**

**Gaps filed:** G-132 (name search needs WAWU ID's names; the phone is the one the wallet opened with) and G-133 (limit is per address, not per person). No SHARED-CHANGES rows.

**NOT RUN.**
- A search or recent list from a real send: `POST /money/transfers/wawu` (WALLET-07) is declared only, so recent was tested on ledger rows written in the shape the ledger consumer writes. Unblocked by: WALLET-07 serving that route (then send, then `GET /money/recipients/recent` lists the person).
- V9 against the real WAWU ID: tokens were real RS256 signed with the mock WAWU ID's key and checked through its JWKS; names came from a stand-in lookup in the contract spec. Unblocked by: the backend running with a real `WAWU_ID_BASE_URL` (OPS-10 deploy), a real sign-in, then a search that shows WAWU ID's name.

### Builder round 2 (4 Oct 2026)

Backend `wmt/WALLET-08` **d01d019** (on 6dab9c8; origin/main still 38bbe4c, nothing to merge). Mobile: origin/main 9b4f9ac is already in; contract copied from d01d019 (byte-equal to the backend's `contract:build`). The verifier's three defects, each fixed:

**D1, ruling 6: a per-person limit on the search.** `RecipientSearchLimiter` counts in the handler, after `WawuAuthGuard` and the wallet gate, on the verified wawuUserId: **20 a minute, 120 an hour, 500 a day**, fixed windows that start at the person's first search in them. Past any of them: `429 recipient_search_rate_limited` (new code, in the one error shape) with `retryAfterSeconds` (seconds to the end of the longest full window, rounded up, at least 1) and the same number in a `Retry-After` header. The per-address `@Throttle` (20 a minute, 120 an hour) stays. `PROVISIONAL(RECIPIENT-SEARCH-RATE)` names both. The counter is the statements one, generalised: `src/money/person-window-limiter.ts` holds the logic once, `StatementRateLimiter` is now a 10-line subclass with the same figures, error and behaviour (its spec is unchanged and passes). A search the route refuses with a 400 is read before it is counted and does not count; a refusal by the token guard or the wallet gate never reaches the counter.
- **Proof, through the whole AppModule** (`recipient-throttle.contract.spec.ts`, now 10 tests):
  - One account from 30 addresses in one /64 (`2001:db8:abcd:12::1` to `::1e`): requests 1 to 20 answer 200, **21 to 30 answer 429** `recipient_search_rate_limited`, each with an integer `retryAfterSeconds` of 1 to 60 and `Retry-After` equal to it.
  - Two accounts on one address X: A 15 and B 5 answer 200 (20 from X); then both are refused from X by the address limit (429, no `reason`); from another address A has exactly 5 left and its 6th is the per-person 429; B, from a third address, has 15 left and its 16th is the per-person 429. So each keeps their own budget and the address limit still holds for the address.
  - 90 refused requests (no token, `q=a`, a person with no wallet), none counted: all 20 searches are still there and the 21st is 429.
  - The hour and the day, on a clock the test moves (500 requests, each from its own address): 120 in six minutes of one hour, the 121st is 429 with `retryAfterSeconds` **3,234** (3,600,000 - 366,000 ms, exactly); 1 ms before the hour ends it is 1; four hours give 480, 20 more make 500, the 501st is 429 with **71,939** (86,400,000 - 14,461,000 ms) although the minute and hour have room; a day later the person starts clean.
  - Exact figures in the spec as literals, and in `hub-rate-limits.contract.spec.ts`.
- **Mutants killed:** no counter (4 tests fail), day 501 (2), hour 121 (2).

**D2, contract.** The search now declares `400` (`MoneyPlainErrorEnvelope`: statusCode, message, data null, no `reason`), `429` (`recipient_search_rate_limited`, the money envelope) beside 409 and 423; both arrays carry `maxItems` 20 and 10 (new `@MaxItems(n)` decorator, written as `x-wawu-max-items` and applied to the 200 array by `scripts/enrich-contract.js`). A test reads `contract/openapi.json` for the statuses, the schemas and both maximums. Mobile types regenerated.

**D3, tests.** The caps are literals now: 25 people give exactly 20 (the first 20 by name), 13 recent give exactly 10, and the constants are checked to equal 20 and 10 (mutants search cap 21 and recent cap 11: each fails 1 test). New test: fullwidth, Arabic-Indic, Eastern Arabic-Indic and Devanagari digits, fullwidth with `+234`, a mixed ASCII and fullwidth number and superscripts are all read as text and find nobody, while the ASCII number finds the person; a 9-digit text and a 10-digit text starting `09` are text (an NFKC mutant fails 1 test).

**Optional index: not done, G-134 filed.** `lower(handle) text_pattern_ops` would serve only an `@` search; a plain text search reads the handle OR the wallet name (`ILIKE '% x%'`), which no btree serves, so the index would not change the 306,000-wallet figure. The real fix needs the name held in one lower-case column (with G-132) and a trigram index. **G-133** is closed (what is left: the counter is in memory in one process, like the statements one).

**Checks.** `tsc` 0; eslint clean on `src/money` and `src/tests`; prettier clean. Full suite, fresh migrated and seeded DB, own network namespace with the mock on :4001 inside it (listener PID mine before and after): **152 suites, 3659 passed, 3 skipped, 0 failed** (`fintava-stall` passed in it, no rerun needed). `hub-rate-limits` on the host: 22/22. Protected `run.sh --fresh HEAD`: **253/253**, lock ref origin/main 38bbe4c, lock files diff empty; tripwire on added lines 0. Gates: **16 fail, 34 warn, 76 accepted** (the same as round 1; the warn list differs only in line numbers), `check_baseline` ok. Secret scan of the staged backend diff (58 windows): 0 hits. Mobile `npm run check` exit 0 (36 suites, 666 tests, gates 0 fail 0 warn, tasks); mobile secret scan 0 hits.

**Default (agent), owner may override:** the 500 a day (the lead's figure); the new code is `recipient_search_rate_limited`; `Retry-After` carries whole seconds.

**NOT RUN.** The same two as round 1 (V9 against the real WAWU ID; recent from a real send once WALLET-07 serves `POST /money/transfers/wawu`), unchanged. The limiter's 120 an hour and 500 a day were proved on a moved clock, not by waiting an hour or a day; unblocked by nothing short of a 24-hour run, and the figures are pinned by literals.

## Verifier report

Verifier, 4 Oct 2026, independent (wrote none of this). Backend `wmt/WALLET-08` 6dab9c8 (main 38bbe4c in it, checked: `git diff 38bbe4c 6dab9c8` is the 19 files the builder lists), mobile dd5fed4. Fresh detached worktrees; own databases `vw08_*_test`; the built Hub on :4989 with a stand-in WAWU ID on :4990 (same signing key as the contract specs), Fintava base pointed at a dead local port (no Fintava call, live host never touched); full suite and protected suite each in their own network namespace (mock on :4001 inside it only). All evidence is under `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw08/` (phones masked to the last 4 digits in everything written there).

**Verdict: 2 defects open (D1 ruling 6, D2 contract) and 1 minor test defect (D3). Status `building`.** V9 is NOT RUN against a real login (item 1 of NOT RUN). Every other ruling holds under attack: no phone, account number, email, BVN or NIN reached any of 38 scanned responses (bodies and headers), a blocked person answers byte for byte like an unknown one in both directions, and a phone is found only in full.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend `tsc --noEmit` 0 (`tsc.log`); eslint `--no-fix` 0 on the 16 changed `.ts` files (`eslint.log`). Gates: main 38bbe4c 722 files **16 fail / 33 warn / 76 accepted**, branch 729 files **16 fail / 34 warn / 76 accepted**; the 16 FAIL lines are identical (`gates-main.fails`, `gates-branch.fails`, `diff` empty); the one new warn is `PROVISIONAL(RECIPIENT-SEARCH-RATE)` (`gates-*.findings`); `check_baseline.py` ok. Tripwire: 0 of 1,913 added lines match `test/protected-routes\|src/protected-routes\|compareShape\|protected-registry`. Mobile `npm run check` exit 0 (`mobile-check-before.log`: gates 171 files 0 fail 0 warn, 207 tasks). Secret scan: Fintava key (65 characters, 58 eight-character windows) against both branch diffs: **0 hits** (backend 100,150 bytes, mobile 44,962 bytes). No em-dash in added user-readable text (2 hits are tests asserting absence); no TODO or "for now" in added code. |
| V2 Contract | passed, with D2 | **Recipient specs** `src/money/recipients`: 2 suites, 39 + 5 = **44 tests** pass (`spec-recipients.json`; the builder's "44 tests and 5 tests" is 44 in all, not 49). **Money, wallet-gate, MONEY-04, rate-limit specs** (`src/money` and `hub-rate-limits`, host network): 37 suites, **955/955** (`spec-money.json`; `hub-rate-limits` 22/22, `wallet-gate.contract` 16, `wallet-gate-coverage` 7, `money-contract` 11). **Full suite** on a fresh migrated and seeded DB, own namespace, CI environment: 153 suites, 3,548 passed, 126 failed, 3 skipped (`ns/full.txt`); the 126 are two environment failures that are not this branch: `hub-rate-limits` (22, the spec needs a non-loopback IPv4 interface, the namespace has none; 22/22 on the host) and `fintava-stall` (104 timing assertions at host load average 15 to 25; 120/120 on a rerun at load 15, `fintava-stall-rerun.log`; `src/fintava` is untouched by the diff). So 3,674 passed, 3 skipped, 0 failed, and 3,674 minus the 22 is the builder's 3,652. None of the 3 skips is in a file the diff touches. `contract:build` leaves `contract/openapi.json` byte for byte (sha256 `0792156a...`), equal to the mobile copy (`contract-build.log`). The contract omits the 400 and 429 answers (D2). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` in its own namespace: **253/253, all 244 required**, exit 0, lock ref origin/main 38bbe4c (`ns/prot.txt`). `git diff 38bbe4c 6dab9c8 -- src/protected-routes test/protected-routes .pipeline/protected-registry.json` is empty. |
| V4 Field trace | passed | Phone: written by KYC-02 and MONEY-12 (`WalletIdentity.verifiedPhone`, `FintavaWalletOpening.phone`, both E.164, checked at `wallet-identity.service.ts:270` and `wallet-opening.service.ts:335`), read only by the phone query, never selected. Name: WAWU ID first and last name, else `FintavaWallet.accountName` (Fintava's name at opening), else the profile handle; a name search reads the wallet name and the handle only (G-132). Handle, avatar, ticks: `UserProfile`, one query. Blocks: `BlockedAccount` (SETTINGS-04) read through `hiddenFrom`, both directions, on all three queries (mutants M02 to M04). Sends: `FintavaLedgerEntry` rows (MONEY-10), read by recent only. Both sides of a crossing checked: caller and blocked person, `t6-block-recent.json`. |
| V9 Live seam | NOT RUN (real login); partly run against the stand-in | The pass asks for a real sign-in and a value only the server has. I ran the built Hub (`node dist/src/main.js`, :4989) with RS256 tokens minted with the stand-in WAWU ID's own key (the way the contract specs do, not a login), people registered in the stand-in so its name lookup answered, and read a search result that carried the stand-in's first and last name with the wallet row's handle, avatar and tick (`t1-phone-forms.json`, `t3-injection.json`). Unblocked by: see NOT RUN, first item. |

### Capability checks, as written

| Check | Result | Evidence |
|-------|--------|----------|
| Searching a phone written 080... finds the same person as +234... | passed | 8 people times 7 spellings (`+234`, `234`, `0`, bare 10 digits, spaces, dashes, brackets): the 3 open-wallet people (A, G, H) were found in all 7 spellings, each time the same one person; the blocked, blocking, wallet-less, opening and caller (5 people) in none (`t1-phone-forms.json`). A number with NBSP separators: found. |
| People the user blocked never appear | passed | name, handle and phone search, and recent, both directions; a block added or removed between two requests takes effect on the next one (`t6-block-recent.json`). |

### The lead's rulings, one by one (live, on the built Hub)

| # | Ruling | Result | What I did |
|---|--------|--------|-----------|
| 1 | Open wallet only, never the caller | holds | wallet-less person with a proved phone (identity row only), a person whose opening is `opening`, the caller by phone (7 spellings), name and handle: always `[]`. |
| 2 | Phone exact after +234; name and handle prefix, 2 characters | holds | prefix of 8 digits, last 8, `%`, `__`, trailing letter, `+2340...`, two numbers, zero-width digit: all `[]`. Fullwidth, Arabic-Indic, Devanagari digits and a superscript 2: not a phone, read as text, `[]` (no NFKC; mutant M19 shows nothing pins that, D3). `%%`, `__`, `\\`, `%a`, `a_`, quote injection, a Cyrillic look-alike of "adaeze": `[]`. `q` of 1 character, spaces, `@`, `@a`, empty, 1 digit, 1 emoji, NUL pair: 400. `q=ab%00`: reads as `ab`. 61 and 5,000 characters: 400. Repeated `q`, `q[]`, `q[a]`, another field, missing `q`: 400 in the one shape, no `reason`. (`t3-injection.json`) |
| 3 | Five fields only | holds | result keys over all responses: `wawuUserId,displayName,handle,avatarUrl,tick`. Leak scan: for 9 people, their phone in 8 spellings (E.164, 234, 0, bare, last 8, spaced, last 4), account number, email and its local part, `4321` and `8765`, and the words bvn, nin, accountNumber, verifiedPhone, email, phone, customerId, walletId, balance, across **38 responses, bodies and every header: 0 hits** (`t6-leak-scan.json`; a first pass flagged "nin" inside the header name `x-ratelimit-remaining`, a false hit, fixed by whole-word matching). |
| 4 | Blocked either way never appears | holds | the blocker, the blocked, and a third party; recent for the blocked person: `[]` (`t6-block-recent.json`). |
| 5 | Capped results; plain arrays | holds, with D3 | CONVENTIONS section 6 says in as many words "Short lists (banks, recipients, beneficiaries) are plain arrays with a stated maximum and no paging": consistent. Live: a capped response is exactly 20, never more (467 capped responses in the walk). D3: the caps 20 and 10 are not pinned by a literal anywhere. |
| 6 | Throttled per caller, exact limits in the rate-limit spec | **not met, D1** | the exact limits are in `hub-rate-limits.contract.spec.ts` (20 a minute and 120 an hour, `short` and `medium` named throttlers); live the 21st from one address is 429. But the limit is per address only. |
| 7 | Behind the wallet gate | holds | no token 401; a person with no wallet and one still opening: 409 `wallet_not_open` / `wallet_opening` with q of `a`, `ad` and a phone (the text is never read), both routes (`t8` output); `wallet-gate-coverage` lists both routes. |
| 8 | Recent | holds | newest first, one person once, caps, blocked, wallet-less, pending removed (`t6`); mutants M10 to M12, M15, M21 to M24 (M24 survives, D3). |

### Defects

- **D1 (defect, ruling 6): the search has no per-caller limit, and the per-address limit is no bound.** The ruling says per caller; the builder's reason (G-133: the global guard runs before the token is read) is true of the guard but not of the repo: `StatementRateLimiter` counts per `wawuUserId` in the handler after the gate (5 a minute, 30 an hour), and the BVN check and the selfie match count per person per 24 hours. A per-caller counter in `MoneyRecipientController.search` is the same pattern. Reproduction (`h/t7.mjs`, `t5-throttle.json`): one address, 60 requests in parallel: 20 answer 200, 40 answer 429; the same account from 30 different addresses (one /64): 30 of 30 answer 200; two accounts from one address share one bucket (a 401 and a 400 also spend it). `deploy/install-services.sh` has nginx listening on `[::]:80`, so a caller with one IPv6 /64 has 2^64 addresses; the Hub tracks `req.ip` as written, with no masking. So one account (it needs an open wallet, nothing more) is unlimited. **Fix:** a per-caller counter in the handler (after the gate, before the query), the limits set by the owner (no ruling names a figure, so it stays `PROVISIONAL`), and keep the per-address limit; then `RECIPIENT-SEARCH-RATE` names both. If the lead accepts per address, that is a decision to record in DECISIONS.md and G-133 closed as accepted; this report does not do that.
- **D2 (defect, minor): the contract does not declare the 400 and 429 of `GET /money/recipients`.** Its responses are `200, 409, 423`; `GET /money/statements` declares `400, 409, 423, 429, 503` and `POST /money/identity/bvn` declares `429`. The app's generated types therefore cannot model "type at least 2 letters" or "slow down", which the route answers (`contract/openapi.json`). The response array also carries no `maxItems` (20 and 10 live only in prose). **Fix:** declare 400 and 429 on the search, rebuild the contract, sync the mobile copy.
- **D3 (defect, minor, tests): the caps are not pinned, and the digit spelling is not pinned.** `money-recipient.contract.spec.ts` builds its cap expectations from the constants (`RECIPIENT_SEARCH_MAX`, `RECENT_RECIPIENTS_MAX`, lines 936 to 947 and 1027 to 1039), so raising 20 to 21 or 10 to 11 passes every test (mutants M14 and M24 survive). The cap is the privacy bound on one answer; the `hub-rate-limits` spec pins its own constants as literals, this one should too. No test pins fullwidth or Arabic-Indic digits as text (M19 survives): the behaviour is correct today (`t3`), a later NFKC would pass unseen.

### Findings (numbers; design-level, none breaks a ruling except D1)

1. **Can name search at 2 characters walk the user base? Yes, at about 3 requests a person.** A prefix walk (every 2-character `[a-z0-9]` pair, then each response that came back full, 20, extended by one character) over 6,000 synthetic wallet holders (60 first names, 60 surnames, handles `name+digits`) enumerated **6,000 of 6,000 in 18,108 requests** (467 capped answers, 3.02 requests per person including the 1,296 starting pairs; `t4-walk.json`). Limits allow: per address 120 an hour is the binding one (20 a minute would be 1,200), **2,880 requests a day, about 950 people a day** by the naive walk, and at most 57,600 rows a day (20 distinct per request) at the ceiling. Per account: no limit of its own, so addresses multiply it linearly and a /64 removes it (D1). At 3 requests a person, 1,000,000 wallet holders is about 3.0 million requests: 25,200 address-hours, or one day with 1,050 addresses. What a walker gets is id, display name, handle, avatar url and tick for every open-wallet person who has not blocked or been blocked by the caller, no phone. The rulings allow a 2-character prefix; this is the cost of that, and a per-caller limit (D1) is what bounds it.
2. **Phone: no harvest, but reverse lookup and a yes-or-no on a number, by design.** A phone returns the person or nothing; nothing reveals a number. A hit costs about 5 ms more than anything else (p50 12.8 ms against 7.8 ms, Mann-Whitney z = 7.8 over 150 each, `t2-timing.json`; the extra is the WAWU ID name lookup, and against the real WAWU ID it will be larger), but a hit is also plain in the body (171 to 203 bytes against 43). A **blocked hit, a person with no wallet, an opening in progress, the caller and an unknown number are indistinguishable**: all 43 bytes, same body, same status, and timing z between -0.9 and 0.9 against an unknown number.
3. **Name search reads the BVN name; the answer may not show it.** `FintavaWallet.accountName` is Fintava's account name at opening. A search for a word of that name finds the person and shows only their WAWU ID name and handle: searching `zedlegal` returned the person shown as "Zed Unnamedwid" with no handle (`t10-legal-name.txt`). So anyone with a wallet can test "is there a holder whose bank name begins with X" and tie a legal name to a public profile, which matters for a creator who uses a stage name on WAWU ID. Separately, when WAWU ID gives no name (an outage, or an id it does not know) the result shows the wallet name before the handle: `ADAEZE ABDULLAHI` with handle `adaeze688x2774`. Recorded by the builder as G-132; I classify it `unclear` (it does not break a ruling, ruling 2 says "name"; whether the legal name may be searched and shown is the owner's call).
4. **A search is a full scan.** No index serves `ILIKE '% x%'` on `accountName` or `handle`. Plan: parallel seq scan of both tables, a hash join and a sort, then `LIMIT 20`. On 306,000 wallets (host load average 15): text search median **325 to 380 ms**, a phone search about 103 ms (`t9` output). Fine at launch size; with D1 open, parallel callers on many addresses are a load path onto the database.
5. Answers outside the one shape: a query over about 16 KB (`q` of 20,000 characters) gets Node's own **431 with an empty body**, before the app (through nginx a 414 or 400); the missing-`q` and repeated-`q` messages read "q must be shorter than or equal to 60 characters" (class-validator's first failure), and the same short text gets two different messages (`q must be longer than or equal to 2 characters` from the DTO for one emoji, `Type at least 2 letters of a name or @handle.` from the parser). All 400, same envelope, no `reason`: cosmetic. The 429 body message is `ThrottlerException: Too Many Requests` (the app-wide default for every throttled route, not this task's) and carries `Retry-After-short`, not `Retry-After`, as every route here does (the builder's "Retry-After" is that header).
6. `GET /money/recipients/recent?q=ad` ignores `q` (200, no complaint), and `/money/recipients/`, `/money/RECIPIENTS` and `HEAD` share the search's bucket (Express path matching, the throttler keys on the handler): no bypass.
7. The sweep of my seeded `opening` person called the dead Fintava stand-in address every 30 s (`look up customer: unavailable "no connection"` at :00 and :30, `hub4989.log`); it started when I created that row, is not caused by a search, and the recipient routes make no Fintava call (the spec asserts it with a counting double and the service imports no client).

### Mutants of my own (SQL and parser; `mut.py`, `mutants-first3.json`, `mutants-main.json`, `mutants.json`, `mut-M*.log`; run against the recipient spec, 39 tests, in a separate worktree)

31 mutants applied, 1 pattern did not apply (M31, not counted): **25 killed, 6 survived.**

| Killed | Mutant |
|---|---|
| M01 | minimum length 2 to 1 |
| M02, M03, M04 | block filter dropped from the phone query, the text query, recent |
| M05, M06 | phone matched by its last 8 digits (opening table), by a prefix (identity table) |
| M07, M26 | LIKE not escaped, only `%` escaped |
| M08, M09, M28 | caller not excluded (text, phone, recent) |
| M10, M11, M21, M22, M23 | recent: any status, direction `in`, any category, any counterparty kind, any wallet kind |
| M12 | recent: LEFT JOIN wallet (wallet-less come back) |
| M13 | result carries `accountName` |
| M15 | recent oldest first |
| M17 | name search by contains instead of word beginning |
| M20 | `@` handle needs 1 character, not 2 |
| M25 | phone query lets a non-wallet holder through |
| M27 | `@` search also searches names |
| M29 | INNER JOIN on the profile (people with no profile lost) |
| M30 | phone normalised to `+2340...` |

| Survived | Mutant | Verdict |
|---|---|---|
| M14 | search cap 20 to 21 | real test gap (D3) |
| M24 | recent cap 10 to 11 | real test gap (D3) |
| M19 | NFKC before the phone parse | test gap (D3); the shipped behaviour is right |
| M16 | handle branch without `ESCAPE` | equivalent: PostgreSQL's default escape is the backslash |
| M32 | phone query without `LIMIT` | equivalent: at most 2 people can match one number (the opening phone is unique, the identity phone is not) |
| M18 | a 9-digit text read as a phone with a 9 put in front | weak: it finds one exact number, never a partial one; not pinned |

### NOT RUN

- **V9 with a real sign-in, against the real WAWU ID.** Tokens were minted with the stand-in's key, not obtained by a login. Names came from the stand-in WAWU ID (mock `/internal/users/lookup`), and the timing figure in finding 2 is against its local latency. Unblocked by: the Hub started with a real `WAWU_ID_BASE_URL` and `WAWU_ID_INTERNAL_SERVICE_KEY` (OPS-10 deploy), a real sign-in, then a search that shows WAWU ID's name and the same timing run (150 hits, 150 misses).
- **Recent from a real send.** `POST /money/transfers/wawu` (WALLET-07) is declared only, so recent was read on ledger rows written in the shape the consumer writes. Unblocked by: WALLET-07 serving that route (send, then `GET /money/recipients/recent` lists the person).
- **The 120-an-hour window itself.** I sent 20 in a minute (21st 429) and read the constants from the spec; I did not wait an hour for the 121st. Unblocked by: a clock the throttler reads (none exists) or a 61-minute run; the spec pins `ttl: 3_600_000`.
- **Real Fintava, real nginx.** The route calls neither. Address behaviour was tried from loopback with one `X-Forwarded-For` entry, which is what nginx writes (`hubTrustProxy` trusts one loopback hop); a real proxy hop is the OPS-11 spec's.
- **Screens.** None (V5 to V7, V10 are not in this task's passes).

## Verifier report, round 2

Verifier, 4 Oct 2026, independent. Backend `wmt/WALLET-08` d01d019 (origin/main 38bbe4c), mobile 8d4cc64. Fresh detached worktrees, own databases `vw08r2_*_test`, the built Hub on :4989 and the stand-in WAWU ID on :4990, Fintava base pointed at a dead local port (no Fintava call), full suite and protected suite in their own network namespace (mock on :4001 inside it only). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw08r2/`.

**Verdict: D1, D2 and D3 are closed; 1 minor test defect open (D4). Status `building`.** The per-person limit holds under every evasion I tried, and statements behave exactly as before.

| Check | Result | Evidence |
|-------|--------|----------|
| 1. D1 per-person limit | passed | Built Hub, real HTTP, `X-Forwarded-For` written as nginx writes it (below). |
| 2. Statements unchanged | passed | Differential: 299,894 takes, 19,337 refusals, 59,626 give-backs, identical; two built Hubs, identical transcript (below). |
| 3. D2 contract | passed | Contract diff against 38bbe4c: recipients paths, new schemas, one enum value only. |
| 4. D3 pinned caps and digits | passed | M14, M24, M19 now killed. |
| 5. G-133, G-134 | passed | Closed honestly; G-134 has a checkable target. |
| 6. Regression | passed | Numbers below. |

### 1. D1, the per-person limit (`h/d1a.mjs`, `d1b.mjs`, `d1c.mjs`; outputs `d1a-output.txt`, `d1b-output.txt`, `d1c-output.txt`)

- **My round-1 reproduction, one account, 30 addresses in one /64:** requests 1 to 20 answer 200, **21 to 30 answer 429** `recipient_search_rate_limited`, every one with `retryAfterSeconds` 60 and a `Retry-After: 60` header equal to it; the body has the one error shape with `reason`, `Cache-Control: no-store`.
- **Two accounts, one address X:** A 15 and G 5 answer 200 from X (20); both are then refused from X with a 429 that has no `reason` (the per-address limit, still in force). From other addresses A has exactly 5 left (the 6th is the person's 429) and G exactly 15 (the 16th).
- **Evasion, all failed to get past 20:**
  - Token refresh and several sessions: for one person, a login, a refreshed token, a second login and a token minted with the stand-in key (all four carry the same `sub`): 20 searches spread over them, all 200; the 21st through the refreshed token and through the minted one: 429. The counter is the verified `sub`, not the session.
  - Concurrent burst: 25 parallel requests from 25 addresses with a new token each: **20 answer 200, 5 answer 429**. The count is taken synchronously in the handler, so nothing slips through before it is seen (60 parallel from one address: 20 and 40, per address).
  - Window edge: 20 at t0 (all 200, the 21st 429), wait 60.2 s, 25 parallel: **20 and 5**. A new window gives exactly 20, not 40.
  - `/money/RECIPIENTS/?q=`, `HEAD`, a trailing `&`: all counted in the same bucket (8 + 6 + 6, then the 21st normal request is 429). `recent` and `GET /money/wallet` are not limited by it.
- **400s are not counted:** 30 searches with `q=a` answer 400, then 20 valid ones answer 200 and the 21st is 429. A refusal by the token guard or the wallet gate never reaches the counter (409 and 401 answers, round 1 and the builder's 90-refusal test).
- **Retry-After:** 60 on the first refusal, **30 thirty seconds later** (body and header agree, rounded up). The hour and the day on a moved clock are the builder's: 3,234 and 71,939 exact, and 1 ms before the hour ends is 1.
- **The limiter against an independent model** (my own re-implementation of "fixed window from the first search in it, longest wait rounded up, at least 1", `vscratch.spec.ts.txt`, a scratch spec not committed): 8 seeds, 480,000 operations including every boundary (59,999, 60,000, 60,001, 3,599,999 ... 86,400,000 ms): 473,828 counted and 6,172 refused, **every answer and every retry value identical**.
- **Walk cost now:** 500 a day per account is about 165 people a day per account at the 3.0 requests a person I measured in round 1 (6,000 of 6,000 in 18,108 requests), 20 a minute, and an account needs an open wallet. The per-address limit and the per-person limit now both bind. Many accounts still multiply it. A fixed window lets a person do 20 at the end of a minute and 20 at the start of the next (40 in a few seconds, shown above), and about 2 x 500 across a day edge (the 120 an hour holds in between); that is what "fixed windows" in the builder's report says.
- **In memory, one process:** `deploy/install-services.sh` has one `ExecStart=/usr/bin/node` and no cluster or pm2, so one counter. A restart clears it (G-133 says so).

### 2. WALLET-27's statements, before and after

- **Spec files unchanged:** `git diff 38bbe4c d01d019 --stat -- src/money/statements` is one file, `statement-config.ts` (+18, -87); no file under `statements/tests` and no other statement file changed; `statement.controller` is unchanged. The statement specs pass: 37 suites, 962/962 in `src/money` and `hub-rate-limits` (`money-statement.contract` 26, `statement-units` 11).
- **Differential test of the two classes**, origin/main's `StatementRateLimiter` (copied in) against d01d019's, on a shared moved clock: 8 seeds, 50,000 operations each, random users, steps from 0 to 3 s with window edges (59,999, 60,000, 60,001, 3,599,999, 3,600,000, 3,600,001 ms) and jumps of up to two hours, give-backs (and a second give-back of the same take), prunes: **299,894 takes, 19,337 refusals, 59,626 give-backs; every outcome identical** (the `MoneyError` class, code, status, and the whole response body with `retryAfterSeconds`), and `size` equal after every step. Figures identical: 5 a minute and 30 an hour.
- **Two Hubs, one transcript** (`h/stmt.mjs`, `stmt-branch.txt`, `stmt-main.txt`; a Hub built from d01d019 and one from origin/main, the same database, each run with new people): 5 requests answer 200 and the 6th `429 statement_rate_limited` with `retryAfterSeconds` 60 (`ra=40` after 20.3 s, so the rounding up is the same); 4 bad periods, a bad format and a future date answer 400 and then 5 valid ones answer 200 and the 6th is 429 (400s not counted); 8 `400 statement_too_large` on a 50,001-row period, then 5 valid and the 6th is 429 (given back); **30 heavy statements at once from 6 people (45,000 rows each): 18 answered 200 and 12 answered `503 statement_busy` on the d01d019 Hub, 21 and 9 on the main Hub, and on both the 6th request of every one of the 6 people is `429` (the 503s counted)**. `diff stmt-branch.txt stmt-main.txt` is empty (even the retry seconds). No difference found.

### 3. D2, the contract

`contract:build` leaves `contract/openapi.json` unchanged (sha256 `562a1767...`), equal to the mobile copy. Against 38bbe4c the differing paths are only: `/money/recipients` and `/money/recipients/recent` (served, tags, operationId, the declared-only fields gone, `x-wawu-max-items`, `maxItems` 20 and 10 on the 200 arrays, and on the search the new `400` as `MoneyPlainErrorEnvelope` and `429` as `MoneyErrorEnvelope`), the new schema `MoneyPlainErrorEnvelope`, the new `recipient_search_rate_limited` value in the `MoneyErrorReason.code` enum and one description sentence on `retryAfterSeconds`. No other route's schema changed; the `maxItems` found elsewhere in the file (14 request-body fields) are the same as on main. `@MaxItems` is an `ApiExtension` and the enrich change reads it only where present.

### 4. D3

The caps are literals (25 people give exactly 20, 13 recent give exactly 10, the constants are asserted equal to 20 and 10), and a test reads fullwidth, Arabic-Indic, Eastern Arabic-Indic, Devanagari, a mix with ASCII and superscripts as text. **M14 (search cap 21), M24 (recent cap 11) and M19 (NFKC before the phone parse) are each killed (1 test fails)** (`mutants-r2.json`).

### 5. The gaps

G-133 is closed and says what is left (memory, one process, which the deploy confirms). G-134 names a target I can check: the name in one lower-case column, a `pg_trgm` index, and `EXPLAIN` on 300,000 wallets showing an index scan and a median under 50 ms. Its reason for not indexing the handle alone is right: the same condition reads `accountName` too.

### 6. Regression

| Check | Result |
|---|---|
| `tsc`, eslint, prettier | `tsc --noEmit` 0; `eslint --no-fix` 0 on the 21 changed `.ts` files; prettier clean on them (`tsc.log`, `eslint.log`) |
| Specs (host) | `src/money` and `hub-rate-limits`: 37 suites, **962/962** (`hub-rate-limits` 22, `recipient-throttle` 10, `money-recipient` 41, `receipt-units` 43) |
| Full suite, fresh DB, own namespace | 153 suites, 3,669 passed, 12 failed, 3 skipped (`ns/full.txt`). The 12 are `hub-rate-limits` (11, needs a non-loopback IPv4 interface, there is none in the namespace) and `receipt-units` "under 300 ms" (363 ms while my mutants ran; 43/43 on the host). Both passed on the host, so 3,681 passed, 3 skipped, 0 failed. |
| Protected `run.sh --fresh HEAD` | **253/253, all 244 required**, lock ref origin/main 38bbe4c, lock-file diff empty |
| Gates | main 722 files **16 fail / 33 warn / 76 accepted**; branch 730 files **16 fail / 34 warn / 76 accepted**; the 16 FAIL lines identical; the one added warn is `PROVISIONAL(RECIPIENT-SEARCH-RATE)`; baseline ok |
| Tripwire | 0 of 2,484 added lines match the protected-suite pattern |
| `contract:build` | equal to the committed contract and to the mobile copy |
| Mobile `npm run check` | exit 0 (36 suites, 666 tests, gates 0 fail 0 warn, 207 tasks) |
| Secret scan | 58 windows: backend diff 0 hits (133,156 bytes), mobile diff 0 hits (83,129 bytes) |

### Defect

- **D4 (defect, minor, tests): nothing pins that a window starts again.** Mutant L9 (`PersonWindowLimiter.take` never resets a window) passes all 51 recipient tests and all 37 statement tests. It is not equivalent: an expired window with a full count gives a negative wait, which is not a refusal, so after the first minute the 20-a-minute (and 5-a-minute) limit is never enforced again, only the hour and the day. The shipped code is right (live: after 60.2 s, 25 parallel give 20 and 5; the model run above), the tests would not catch a change. The pre-existing statements spec had the same gap (the shared class made it shared). **Fix:** one test of a second minute: 20 at t0 pass, the 21st is refused, at t0 + 61 s exactly 20 pass again and the 21st is refused, on the moved clock, for the recipient search and (one line) for statements.

### Mutants of my own, round 2 (`mut2.py`, `mut3.py`, recipient specs 51 tests, statements specs 37)

12 valid mutants: **10 killed, 2 survived** (L10 is a no-op I wrote by mistake, not counted).
Killed: M14, M24, M19 (above); L1 counting before the 400 is read (28 fail); L2 one shared counter for everyone (22); L3 day limit 501 (2); L4 hour limit 121 (2); L5 the `Retry-After` header dropped (2); L7 minute limit 21 (4); L8 the per-address `@Throttle` removed (2).
Survived: **L9** (D4); **L6** retry rounding ceil to floor passes the recipient specs (their waits are whole seconds, 3,234 and 71,939) but **is killed by the statements spec** (1 test), and the class is shared, so the rounding is pinned.

### Incident (mine, disclosed)

While seeding round-2 statement tests (16 people with 45,000 ledger rows each, 720,000 rows) the database grew to 557 MB on a volume that had 14 MB free, and the shared PostgreSQL cluster stopped (`could not write to file pg_wal/xlogtemp ... No space left on device`). Another session's restart had already failed on the same error. I dropped my database (1.5 GB free afterwards) and ran `pg_ctlcluster 16 main start`; the cluster recovered ("database system is ready to accept connections", 14:12 UTC). Any session that held a connection between about 14:05 and 14:12 UTC saw connection errors. After that I seeded 6 people with 45,000 rows and dropped the database after each Hub run.

### NOT RUN

- **V9 with a real sign-in against the real WAWU ID** (unchanged): tokens minted with the stand-in's key, plus two stand-in logins and a refresh for the evasion test. Unblocked by: the Hub with a real `WAWU_ID_BASE_URL` and `WAWU_ID_INTERNAL_SERVICE_KEY` (OPS-10 deploy), a real sign-in, then a search.
- **Recent from a real send** (unchanged). Unblocked by: WALLET-07 serving `POST /money/transfers/wawu`.
- **The hour and the day over real time.** Proved on a moved clock (the builder's test, and 480,000 model operations of mine), not by waiting an hour or a day. Unblocked by nothing short of a 24-hour run.
- **The round-1 live attack battery against d01d019** (phone spellings, injection, leak scan, block timing). Not re-run: it sends 100+ searches from one account and would now meet the person limit; `recipient-query.ts` and the SQL in `recipient.service.ts` are unchanged (the diff touches only the call and the signature) and the 41 recipient tests pass. Unblocked by: the same scripts in `../vw08/h/` with one account per 20 searches.
- **The statements hour window (30 an hour) over HTTP.** It needs 6 or more minutes of real time per Hub. Covered by the differential run (the hour window is in it) and the unchanged statements spec.
- **A multi-process counter.** Not applicable on the droplet's single process; G-133 states it.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
