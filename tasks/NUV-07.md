---
id: NUV-07
title: Fees and limits as settings, and nothing moves before they are set
owner: YOU
area: MONEY
order: 198
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-20, WALLET-15]
decisions: [R-42, R-10, R-23, R-31]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# NUV-07 · Fees and limits as settings, and nothing moves before they are set

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-39, R-42 and R-44
- `tasks/MONEY-20.md`: the provider seam (`src/wallet-provider/`), its verifier findings 1 to 4 and the lead merge note (the `provider` column, per-provider bank lines, Fintava config at boot, MONEY-17's re-point)
- `tasks/WALLET-15.md` (fee quotes)
- the lead's scratchpad `nuvion/SANDBOX-FINDINGS.md` item 10 (fee simulations and limit errors)

## Goal

Nuvion's charges and limits are settings, filled in when Nuvion answers (R-42), never figures in code, and nothing
moves real money on Nuvion until they are set. WAWU's own fee on top (R-10) and the one Fees row (R-23) stay as
they are.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- WALLET-15 (done, fee quotes): rewired; the provider part of a quote comes from the running provider's settings.
- OPS-09 (Fintava merchant charges in the sandbox dashboard): obsolete under Nuvion; WAWU's fee is our own setting.
- WALLET-23 (account limits from Fintava, after launch) and WALLET-19 (the A17 to A20 limit screens, after launch): obsolete as written; Nuvion documents no account tiers, and limits are WAWU settings here.

## Scope

- `src/money/fees/*`: a fee schedule per provider. Under `nuvion` the provider part of every quote comes from settings (`NUVION_FEE_*` for a book transfer, a bank payout and an inflow; a flat kobo figure or bands; no default value). Fintava's schedule is untouched (rollback).
- While any Nuvion fee setting is unset under `nuvion`, every quote and every money-moving route answers `503 fees_not_set` before any call to Nuvion. Read-only routes (balance, history, account number) are unaffected.
- New `src/money/limits/`: per-transaction, daily and monthly limits per person and per kind of movement, as settings; unset means no WAWU limit. A movement over a set limit answers `limit_reached` naming the limit, before any call; Nuvion's `error_transfer_daily_limit_exceeded`, `error_transfer_transaction_limit_exceeded` and `error_transfer_monthly_volume_exceeded` give the same answer.
- `.env.example` and `deploy/README.md` list every setting with no figure.
- Default (agent), owner may override: a quote does not call `POST /fee-simulations`; NUV-08 compares it with the setting and reports a difference.

Built on the seam alone; it needs neither NUV-01 nor the key (the spec stands Nuvion in at `WALLET_PROVIDER`).

## Capability checks

- [ ] With the Nuvion fee settings filled in (spec values), a quote shows the provider's charge and WAWU's fee as one Fees row, and changing a setting changes the quote with no code change.
- [ ] With any Nuvion fee setting unset, every quote and money-moving route answers `fees_not_set` and the provider receives no call.
- [ ] A movement above a set per-transaction, daily or monthly limit answers `limit_reached` naming the limit, before any call; each of Nuvion's three limit errors gives the same answer.
- [ ] Under `fintava` every quote is byte-identical to main (V3).
- [ ] No fee or limit figure appears in source (gates, and a grep in the spec).

## Builder report

Builder, 8 Oct 2026 (the lead's agents, PLAN-PAY wave 1, built beside NUV-01, TIER-01, POINTS-01 and MONEY-17).
wawu-backend `wmt/NUV-07` `d22424b` on main `965280e`; this repo `wmt/NUV-07` on main `50a7a89`. Nuvion is stood in at
`WALLET_PROVIDER` in every spec. No Nuvion, Fintava, Flutterwave or wawuafrica.com host was called.

**Built** (backend; the rules are in `docs/contract/CONVENTIONS.md` section 11 and its error table):
- `src/money/fees/`: `nuvion-fee-config.ts` (`NUVION_FEE_BOOK_TRANSFER`, `NUVION_FEE_BANK_PAYOUT`, `NUVION_FEE_INFLOW`,
  each one kobo figure or `from:fee` bands, **no default**; a set but unusable value stops a Nuvion server at boot naming
  it; never read under Fintava), `provider-fee-schedule.ts` (the provider's part per provider: Fintava's WALLET-15
  schedule unchanged, or Nuvion's settings), `fees-not-set.ts` (`503 fees_not_set`), `fees-set.guard.ts`
  (`@RequireFeesSet()`). `fee-quote.service.ts` takes the running provider (`WALLET_PROVIDER`'s `name`) and its
  settings, and `lines()`, so `quote()` and `check()`, refuse `fees_not_set` before anything else.
  `money-fees.controller.ts`: the quote runs the guard first, documents `fees_not_set` and `target_not_payable`, and
  shows today's limit standing when `MoneyLimits` is mounted (optional; SHARED-CHANGES NUV-07 #2).
- New `src/money/limits/`: `money-limit-config.ts` (`WAWU_LIMIT_<KIND>_<PER_TRANSACTION|DAILY|MONTHLY>_KOBO`, 12
  settings for the quote's four kinds, empty = no WAWU limit, no figure; a bad value, or a smaller window set above a
  larger, stops boot), `money-limits.service.ts` (`assertMayMove`: `fees_not_set`, then per transaction, the Lagos
  day, the Lagos month, counted from the person's own pending and completed movements of the kind in the ledger, by
  amount before fees; given the caller's transaction it takes a per-person advisory lock first; `dailyStanding` for a
  pay sheet), `limit-reached.ts`, `lagos-window.ts`, `money-limits.module.ts`.
- `src/wallet-provider/wallet-provider-limit.ts` (new, beside the seam's error, which is unchanged):
  `WalletProviderLimitError` (kind `refused`, `recordMayExist` false, `toHttpException()` is `403 limit_reached` with
  `limit`), the table of Nuvion's three limit error types, and `providerLimitError()` for the Nuvion adapter.
- Shared money files, additive, at the end of each list (SHARED-CHANGES NUV-07 #1): the two codes, their statuses,
  `DEBIT_GATE_ERRORS`, the `limit` reason field. `.env.example` and `deploy/README.md` list all 15 settings, each
  empty; CONVENTIONS; `contract/openapi.json` regenerated (additive only: NUV-07 #3).
- Specs (new): `fees/tests/nuvion-fees.spec.ts` with `fintava-quote-golden.json`, `fees/tests/nuvion-fees.contract.spec.ts`,
  `limits/tests/money-limits.spec.ts`, `money-limits.contract.spec.ts`, `money-moving-coverage.spec.ts`,
  `no-fee-or-limit-figures.spec.ts`: 71 tests (22, 6, 18, 12, 8, 5).

**Capability checks**
1. Fees filled in: a quote shows the provider's charge and WAWU's fee as one Fees row, and a setting change changes it
   with no code change: **passed.** Unit (`nuvion-fees.spec.ts`): a send to a WAWU user is `balance_transfer` (the
   book transfer setting) + `wawu_fee` ₦10, `fee.totalFeeKobo` their sum (R-23's row); a bank send is the payout
   setting by band + ₦25; a purchase the book transfer only; two settings, same code, two quotes; a quote signed under
   the old setting is `quote_changed` with the new one. HTTP (`nuvion-fees.contract.spec.ts`, real MoneyModule, real
   RS256 sign-in, Nuvion stand-in at `WALLET_PROVIDER` recording every call): the same parts and totals, `no-store`,
   and the stand-in received no call.
2. Any Nuvion fee setting unset: every quote and money-moving route answers `fees_not_set` and the provider receives
   no call: **passed.** Each of the three unset alone, and all three: every kind, `lines()` and `check()` answer 503
   (unit); over HTTP every kind, a malformed query and a person with no wallet get `503 fees_not_set` with zero calls to
   the stand-in, while the balance (one `getBalance`), the history and the account number answer 200. No money-moving
   route is served on main (the three debits are declarations): `money-moving-coverage.spec.ts` fails any mounted one
   that does not run `FeesSetGuard` first and document `fees_not_set` and `limit_reached`, and every declared one
   documents both (`DEBIT_GATE_ERRORS`); `MoneyLimits.assertMayMove` answers `fees_not_set` first, before any read.
3. Above a set per-transaction, daily or monthly limit: `limit_reached` naming it, before any call; Nuvion's three errors
   give the same answer: **passed.** `money-limits.contract.spec.ts` drives the flow every money-moving service follows
   (assertMayMove in the transaction that writes the pending row, then the provider, failures through
   `toHttpException()`): fees unset, each limit passed: zero calls and nothing written; within: one call for the
   amount; a stand-in refusing with each of Nuvion's three types gives a body equal, field for field, to WAWU's own
   refusal for that limit. Also: what counts (own, out, pending or completed, by kind, Lagos day and month edges to the
   millisecond, not another person's, not WAWU's account, not failed or reversed); two movements at once by one
   person against one daily limit: one passes, one refused, one pending row.
4. Under `fintava` every quote is byte-identical to main (V3): **passed.** `fintava-quote-golden.json` was made from
   main `965280e`'s own FeeQuoteService before anything changed: 224 inputs (every kind and bill category, 16 amounts
   across band edges, the merchant cap and 2^53, under the ruled defaults and under a fully set schedule with a low
   cap), each answer's JSON (quote with its signed token, or the refusal) hashed; today's service matches 224 of 224
   built with no provider, with Fintava's name, and with Nuvion settings present. WALLET-15's own specs pass unchanged.
5. No fee or limit figure in source: **passed.** `no-fee-or-limit-figures.spec.ts` reads the code (comments and strings
   blanked) of every NUV-07 fee and limit file and finds no number but 0 and 1, and shows a figure would be found; both
   settings files list every setting once, each empty. Gates: the same 16 FAIL lines as main, the same 58 warnings, no
   new PROVISIONAL.

**Runs** (load average 30 to 47 on 4 cores throughout, from other sessions' suites; 2.8 GB free):
- `npx tsc --noEmit` 0; eslint 0 on the 18 changed `.ts` files (prettier run on NUV-07's files only).
- NUV-07's specs 71/71; with WALLET-15's, `src/money/fees` 66/66 and `src/money/limits` 43/43.
- Money, Fintava, seam, KYC and identity specs, one jest process per directory (one process for all of them was
  OOM-killed): green first time in Fintava webhooks 41, fees 66, gate 45, history 47, ledger 85, limits 43,
  statements 37, `src/money/tests` 11, seam 18. Red only on 5 s timeouts at load 40 or more: balance, identity,
  opening, PIN, receipts, recipients, saved accounts. Each rerun alone with `--testTimeout=60000`: identity-throttle
  7/7, money-identity 26/26, selfie-match 182/182, selfie-production-boot 5/5, wallet-opening-production-boot 3/3,
  money-pin 25/25, money-receipt 21/21, recipient-throttle 13/13, saved-accounts 34/34; balance production-boot 5/5
  with 400 s (its AppModule boot took over 60 s at load 46). Still red, both timing and in files this task did not
  touch: `fintava-stall` (9 of 120 at load 47) and `receipt-units`' 300 ms drawing bound (1 of 43); both green later
  at load 13 to 16 (120/120, 43/43). `kyc-submission.contract` calls the mock at a hard-coded :4001, so it ran in the
  namespace suite below (green there).
- Protected suite `run.sh --fresh HEAD` on `3fff2b3`, lock origin/main `965280e`: **253/253, all 244 required**, lock
  untouched (`d22424b` after it changes one spec file only).
- Gates: main 16 fail / 58 warn / 76 accepted on 889 files; branch 16 / 58 / 76 on 906. The 16 FAIL lines are
  byte-identical, the warnings identical but for line numbers; no new PROVISIONAL. CI tripwire: 0 added lines match.
  Key-shaped scan of the staged diffs: nothing but setting names, the golden's 224 SHA-256 digests of quote answers
  and its test quote key.
- `npm run contract:build`: additive only (SHARED-CHANGES NUV-07 #3). Here `npm run api -- --backend` copies backend
  origin/main, so only `contract/SOURCE_COMMIT` moved (`3041887` to `965280e`, same contract). The branch's contract,
  generated in a scratch run and restored, typechecks (`tsc` 0) with `fees_not_set`, `limit_reached` and `limit`.
- Mobile `npm run check`: **exit 0** (typecheck, lint, jest 76/76 suites and 1,377 tests, gates 0 fail / 0 warn on 346
  files, 249 tasks). A first run at load 40 had two screen tests over the 20 s limit (A26 `OpenWalletScreen`, Z3
  notifications), 128/128 alone. This task changes no app code (docs, rows and `contract/SOURCE_COMMIT`).
- **V9 live seam (Fintava):** the built server (`dist`) on :5641, `WALLET_PROVIDER` unset, no Fintava or Nuvion setting,
  signed in through the stand-in WAWU ID's real `POST /auth/login` on :5642 (no minted token): no wallet, `409
  wallet_not_open`; with a `FintavaWallet` row, ₦10,000 to a bank `bank_transfer` 4000 + `wawu_fee` 2500 = total
  1006500, a ₦4,999 purchase 2325 (502225), ₦5,000 1575 (501575), `no-store`: main's answers.
  `WALLET_PROVIDER=nuvion` still stops at boot with MONEY-20's reserved message. Under Fintava,
  `NUVION_FEE_BOOK_TRANSFER=abc` boots (not read, by design) and so does `WAWU_LIMIT_PURCHASE_DAILY_KOBO=abc` (the
  limits module is not mounted until SHARED-CHANGES NUV-07 #2).
- **Mutants**, 17 of my own on money behaviour, each applied, its specs run, `git restore`d (tree clean after each):
  **17 killed, 0 survived.** M1 a Nuvion band one kobo late; M2 the per-transaction limit refusing the limit itself
  (amounts); M3 no per-person lock (double spend: the concurrency test lets both through); M4 usage across every
  person's wallet and M9 a book transfer charged the payout rule (wrong account); M5 usage on the total with fees
  (wrong units); M6 failed and reversed rows counted; M7 `lines()` without the fees check; M8 `assertMayMove` without
  it; M10 Fintava's merchant cap dropped (the golden catches it); M11 the Lagos day read as the UTC day; M12 Nuvion's
  daily and monthly errors swapped; M13 a provider limit refusal marked "money may have moved"; M14 the fees guard
  after the wallet gate; M15 ConfigService injected as a union type, so the Nuvion settings never arrive (a real bug I
  made and the HTTP spec caught, kept as a mutant); M16 a default Nuvion fee in code; M17 the month counted from the
  day.
- Full suite in a private network namespace (copies of the lead's `ns2.sh` and `inner2.sh`, paths, database and
  worktree changed), fresh migrated and seeded `bn07_full_test`, the namespace's own mock on its :4001 (checked
  before, during and after), three serial `--shard=i/3` runs (one in-band run of everything was OOM-killed before):
  **189 suites, 4,826 tests, 4,716 passed, 4 skipped, 106 failed in 8 suites**, none in a file this task changed:
  `hub-rate-limits` 11 (needs a non-loopback interface; 22/22 on the host), and at load 40 to 47 `fintava-stall`
  (timing), `money-pin` and `admin-events`, `learn-guide`, `playbook` (5 s hook and test limits), `profile-work-owner`
  (the mock closed sockets under load) and `wallet-opening.contract` (2 of 75). Each rerun alone on the host at load 13
  to 17: `hub-rate-limits` 22/22, `wallet-opening.contract` 75/75, `profile-work-owner` 11/11, `admin-events` 37/37,
  `learn-guide` 26/26, `playbook` 12/12, `money-pin` 25/25, `fintava-stall` 120/120. `data-export-map` and
  `account-data-map` green inside it (no model added).

**Money safety**
- No balance is summed. A limit counts what the person moved (amounts out, pending or completed): a usage figure,
  never shown or used as a balance; the balance stays the provider's, and `GET /money/wallet/balance` still answers
  while fees are not set.
- Nothing reaches the provider before the fee check and the limits; the route guard runs before the wallet gate, the
  Idempotency-Key record and the PIN, so no PIN try is used and nothing is stored while fees are not set.
- A provider limit refusal has `recordMayExist` false (Nuvion answered 400: nothing moved), so a caller fails that send;
  every other provider failure keeps its kind, and unknown outcomes are still reconciled, never retried.
- Two movements by one person are checked one after the other (advisory lock in the caller's transaction).
- No fee or limit figure for Nuvion or the limits anywhere in code; Fintava's ruled figures and WAWU's R-10 fees stay
  where WALLET-15 put them. Kobo only; no currency added. No BVN, NIN, PIN or image is read, stored or logged.

**Decisions** (each Default (agent), owner may override)
1. Nuvion's three settings (book transfer, bank payout, inflow), each one figure or bands; all three, inflow included,
   must be set before anything moves; read only when Nuvion runs, so a rollback never trips on them.
2. A quote never calls `POST /fee-simulations` (the task's default); NUV-08 compares.
3. Under Nuvion a bill quote is `409 target_not_payable` ("Bills cannot be paid right now."): Nuvion has no bills.
4. Under Nuvion `MERCHANT_MAX_PER_TXN_KOBO` (Fintava's merchant wallet policy) does not apply; the purchase
   per-transaction limit does that job.
5. `fees_not_set` is 503 with no `retryAfterSeconds` ("Payments are not switched on yet. Try again later."), answered
   first on the route, before the wallet gate.
6. `limit_reached` is 403 (as `daily_limit_exceeded`) with `reason.limit`, the same body whether WAWU's limit or the
   provider's stopped it. `daily_limit_exceeded` stays in the contract untouched.
7. Limits: the quote's four kinds; amount before fees; pending and completed count; the Lagos calendar day and month;
   under either provider (all unset by default, so Fintava runs exactly as main); a smaller window set above a larger
   stops boot.
8. The limits module is standalone and MoneyModule's import of it is a SHARED-CHANGES request (#2), not an edit; the
   provider's limit refusal is a subclass in a new seam file, so the seam's error file is unchanged.

**Merge order:** NUV-01 first, as briefed. No source file in common (NUV-07 adds no file under `src/nuvion/`); both add
blocks to `.env.example` and `deploy/README.md`, in different places. Then G-411 is one call in NUV-01's mapping. With
NUV-01 in, `WALLET_PROVIDER=nuvion` boots and every quote answers `fees_not_set` until the owner sets `NUVION_FEE_*`
(R-42 working). MONEY-17 adds to the same three money files at other places and edits `fee-quote.service.ts`'s
claims, `quote()` and `check()`, which NUV-07 leaves alone. Once both are in, `POST /money/payments` documents
`fees_not_set` (`DEBIT_GATE_ERRORS`), so `money-moving-coverage.spec.ts` fails until it carries `@RequireFeesSet()` as
its last decorator (G-410): the tripwire working, not a conflict.

**Filed:** SHARED-CHANGES NUV-07 #1 (made: the codes, statuses, debit list, reason field), #2 (request: MoneyModule
imports MoneyLimitsModule), #3 (contract, additive); BACKEND_GAPS G-410 (what each money-moving route must do), G-411
(Nuvion's limit types through `providerLimitError`), G-7 updated.

**NOT RUN**
- (key) A real Nuvion limit refusal reaching the app as `limit_reached`, and Nuvion's own fee for a book transfer and a
  payout against the settings (`POST /fee-simulations`, NUV-08): unblocked when `GET https://api.nuvion.dev/bank-codes/NG`
  answers 200 with the key in the local `.env`, a lead brief allows that host, and G-411 is applied.
- The live seam under `WALLET_PROVIDER=nuvion` (the built server answering `fees_not_set`, then quoting from the
  settings): the server cannot boot under nuvion until NUV-01 merges (checked above). Unblocked when
  `WALLET_PROVIDER=nuvion` boots on backend main.
- A served money-moving route refusing over HTTP: none is served on main. Unblocked when MONEY-17, NUV-05 or NUV-06
  serves one with G-410 applied.
- The real figures: the owner's NGN fees and limits from Nuvion (NUV-10).

## Verifier report

## Owner sign-off
