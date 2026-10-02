---
id: MONEY-04
title: Money conventions and the wallet contract
owner: YOU
area: MONEY
order: 29
priority: launch
repo: wawu-backend
type: contract
status: done
depends_on: [OPS-02]
decisions: [R-10, R-19, R-20, R-21]
passes: [V1]
artboards: []
---
# MONEY-04 · Money conventions and the wallet contract

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Mobile builds wallet screens against an agreed contract before Fintava is connected.

## Scope

docs/contract/CONVENTIONS.md (money in kobo, phone in +234 normalised by the server, one error shape, Idempotency-Key header, how the PIN is sent, cursor pages). Contract entries for wallet, PIN, transfers, pay-from-wallet, holds and history in the backend's registry, from Fintava's docs (OPS-02). Also: named schemas instead of the duplicated inline response shapes (BACKEND_GAPS G-1).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava amounts are naira decimals (`2.75`, `"100.00"`), not kobo. The contract stays in kobo integers; conversion happens only inside the Fintava client (MONEY-06), by parsing the decimal string, never through a float. Fintava has no Idempotency-Key: ours is enforced by our backend, and our `CustomerReference` goes to Fintava where it is accepted.

## Capability checks

- [ ] Every wallet artboard's data needs (docs/analysis evidence, flow wallet) maps to a contract entry.
- [ ] Conflicts between the canvas and Fintava's real behaviour are listed in `docs/designer/BRIEF.md` and resolved there; only a conflict about money behaviour that `DECISIONS.md` doesn't cover goes to the owner.

## Lead rulings (2 Oct 2026, round 2)

Recorded in wawu-backend `docs/contract/WALLET.md`, section 1; they answer the verifier's three unclear items.

1. **₦10,000,000 cap:** Fintava's per-transaction cap on WAWU's merchant account (`limits.md`). Applies only to money through the merchant wallet (payments, holds and their release or refund, payouts from WAWU), never to customer-to-customer sends. Read from config `MERCHANT_MAX_PER_TXN_KOBO`, not a constant. Above it: `amount_out_of_range` with `maximumKobo`, not a plain validation 400. Refuse, never split.
2. **Daily limit on purchases:** a purchase debits the buyer like a send. `daily_limit_exceeded` is declared on payments and the payment quote carries `withinDailyLimit`. Fintava must confirm whether purchases count (question 16 in `docs/fintava/naira-api.md`).
3. **W26 grouped row:** the canvas decides the UI. History groups several unlocks of the same item into one row: `TransactionView.group` (`count`, `key`; `?group=<key>` expands it). WALLET.md says which rows group and when. MONEY-15 builds it.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-04` in both repos (wawu-backend commit `b00e4c3`, from main `b7d4e63`).
- **How the contract is declared:** `contract/openapi.json` is generated from the Nest controllers and DTOs (emit) plus handler return types (enrich), and `contract/**` is fenced, so the wallet contract is code: DTOs, named views and controllers in `src/money/`, in `MoneyContractModule`, which AppModule does not import (nothing is served). `emit-openapi.ts` adds its 29 operations marked `x-wawu-served: false` and `x-wawu-built-by: <task>`. A hand-written spec was rejected: the app reads only `openapi.json`, and a second file would drift once the routes are built.
- **Backend files:** `docs/contract/CONVENTIONS.md`, `docs/contract/WALLET.md` (routes, payment kinds, artboard mapping, conflicts, gaps), `src/money/**` (DTOs, views, enums, error envelope, 5 controllers, module, spec), `src/openapi/emit-openapi.ts`, `scripts/enrich-contract.js` (nullable named fields as `allOf` + `nullable`, money types only), `contract/openapi.json` (regenerated; also picks up main's missing profile `headline`), `CLAUDE.md` (pointer). Mobile: this file, `BACKEND_GAPS.md` (G-1 updated, G-7, G-8), `docs/LOG.md`.
- **Conventions chosen:** PIN only in `X-Transaction-Pin` on debits (never URL, body or log; new PINs in the PIN route's body). `Idempotency-Key` required on `transfers/wawu`, `transfers/bank`, `payments`: same key and body replays the stored result, different body is `409 idempotency_key_reused`; refusals before money moves are not stored. Errors: the existing envelope plus `reason.code` (27 codes, one HTTP status each).
- **Check 1 (data needs mapped):** every launch artboard in WALLET-01..06, 11, 13, MONEY-02, 03, KYC-03, 04 is mapped in `WALLET.md` section 3; after-launch ones listed. Not mapped to a Hub route, with reason: A5, A6, A14, A16 (WAWU ID, KYC-01/02), W39 earnings (WALLET-16, existing route), Face ID (MONEY-14). Tested by `src/money/tests/money-contract.spec.ts` (8 tests: not mounted, markers, named bodies, nullable refs, headers, no PIN in URL) and by generating types with openapi-typescript 7.13.0 (parses; `account` is `WalletAccountView | null`).
- **Check 2 (conflicts listed, not resolved):** 11 items in `WALLET.md` section 4, including two nobody has ruled: who pays Fintava's charge on the second leg (creator's 85%, hold release or refund), and whether WAWU's ₦25 comes back on a failed bank send.
- **Gates, backend:** tsc 0 before and after; eslint on changed files 0; gates 16 fail / 0 warn / 76 accepted before and after (all 16 already on main, exit 1 on main too), files scanned 525 to 536; baseline check passes. Protected route suite: 244 of 244 before (origin/main, fresh `money04_protected_test`) and after (this branch, fresh).
- **Gates, mobile:** `npm run check` exit 0 before and after (gates 0 fail, 23 files).
- **Not done:** the wallet-opening request (MONEY-12, needs KYC-01's design), Face ID device routes (MONEY-14), G-1 for served routes (retypes live contract entries; G-1 row), daily limits (no task, G-7). `npm run api` not run here: the app picks the routes up once this merges to backend main.
- **Round 2** (backend `b864994`, after verifier `74b97a4`):
  - Defect 1: the never-null list now has 11 fields (adds `AdminFinanceTransactionView.creator`, `.buyer`, `AdminFinanceWalletView.payoutSubaccount`), in WALLET.md, `enrich-contract.js` and G-1.
  - Defect 2: every `*Kobo` field and parameter is `integer`: enrich reads the name, `MoneyErrorReason` declares it, and a new spec test checks the whole contract. The name rule also turns 12 served admin finance fields from `number` to `integer`; the wire and the generated TS types are unchanged.
  - Rulings applied: the cap is gone from DTO validation and lives in config (`.env.example`); payments declare `daily_limit_exceeded` and the quote has `withinDailyLimit` and `remainingTodayKobo`; `TransactionGroupView` and `?group=` added.
  - Checks: tsc 0; eslint 0 on changed files; money spec 9/9; gates 16/0/76, the same as main (536 files); protected suite 244/244 on a fresh `money04_protected_test`; contract via `npm run contract:build`. Mobile: origin/main `6b7eaff` merged; `npm run check` exit 0 (jest 70/70, gates 0 fail on 34 files, lint 0 errors and 2 warnings, both in code from main).

## Verifier report

Verifier: fresh session, 2 Oct 2026; wrote none of this task's code. Own detached worktrees: wawu-backend `b00e4c3` (branch) and `b7d4e63` (= origin/main, the base), each with its own `npm ci`; wawu-wmt-mobile `4b59f2f` as committed, and `4b59f2f` with origin/main `9f35e9f` merged in (the branch as it will land; the only conflict was the generated `docs/PROGRESS.md`, rebuilt with `check_tasks.py --write`). Own database `money04_verifier_protected_test`, mock WAWU ID on :4001, app on :3911. Postgres 16 left running. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money04/` (logs named below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates, backend | passed (nothing went up) | `npx tsc --noEmit` 0 errors on main and branch. `npx eslint` (no `--fix`) on the 12 changed `src/` files: exit 0. `scripts/enrich-contract.js` is outside the eslint project on main too (same parse error, not in `npm run lint`'s glob). `npx jest src/money`: 8/8. `scripts/gates/run.py`: 16 fail / 0 warn / 76 accepted on both, files scanned 525 -> 536 (the 11 new `src/money` files); the 16 findings are identical line for line (4 deferrals, 1 fake_data, 11 forks, all pre-existing). `check_baseline.py` exit 0 on both, 108 entries (`gates-main.txt`, `gates-b.txt`, `baseline-*.log`) |
| V1 Gates, mobile | passed | `npm run check` exit 0 on `4b59f2f` (gates 0 fail, 23 files scanned; jest 32/32; task check 187 tasks) and on `4b59f2f` + origin/main (gates 0 fail, 34 files; jest 70/70; lint 0 errors, 2 warnings, both in code from main) (`check-branch.log`, `check-merged.log`) |
| V3 Regression (not in `passes`; run because the builder claims it) | passed | `scripts/protected-routes/run.sh --fresh <ref>` from the base worktree, lock from origin/main: `b7d4e63` 244/244 required (253 tests), exit 0; `b00e4c3` 244/244 required (253 tests), exit 0. 242 registry entries + 2 whole-registry tests = 244 (`protected-main.log`, `protected-b.log`) |
| Capability: every wallet artboard's data needs map to a contract entry | passed | Every launch artboard in WALLET-01..06, 11, 13, MONEY-02, 03, KYC-03, 04 appears in `WALLET.md` section 3 (W16 and W38 under after launch, with reason). 16 rendered and compared with the mapping: W1, W8, W10, W12, W14, W15, W17, W18, W19, W26, W27, W35, A8, H14, H17, W37 (`design_shots/`). Every drawn value has a field or is named as a gap; see unclear 3 for one W26 row |
| Capability: canvas-versus-Fintava conflicts listed, not resolved | passed | 11 items in `WALLET.md` section 4 checked against R-1, R-6, R-10, R-11, R-19, the designer brief and `docs/fintava/*.md`; none resolves a fee, limit, legal or money fact, none contradicts a ruling. Every figure quoted matches `fees.md` and `limits.md`; every canvas quote matches the render |

### What I checked, and what came back

1. **Diff against the report.** Backend `git diff --stat b7d4e63..b00e4c3`: 17 files, exactly the builder's list (CONVENTIONS.md, WALLET.md, 11 files in `src/money/`, `emit-openapi.ts`, `enrich-contract.js`, `contract/openapi.json`, `CLAUDE.md`). Mobile `git diff --stat e657ad5..4b59f2f`: the 4 listed files. Nothing extra, nothing missing.
2. **The 29 routes are unreachable (booted, not read).** Started the branch's own build (`dist/src/main.js` from `npm run contract:build` at `b00e4c3`) against my database: the router mapped 271 routes and **0** under `/api/hub/money` (`hub.txt`). All 29 declared operations answered **404** with no token and with a real mock WAWU ID token, while the served `GET /wallet` and `GET /users/me` answered 401 without and 400/200 with the token (`hub.log`). Mutation: adding `MoneyContractModule` to AppModule's imports in my worktree makes `money-contract.spec.ts` fail (1 failed, 7 passed); restored from a copy, tree clean. `declaredOnly` throws and its message carries only the input count, never a value.
3. **Contract is generated.** `npm run contract:build` on `b00e4c3` reproduces the committed `contract/openapi.json` byte for byte (`git status` clean): 261 paths, 29 operations marked `x-wawu-served: false`, 285 schemas. On main, the same command changes main's committed contract: `headline` appears on `CreatorProfile`, `UpdateUserProfileDto`, `UserProfileWithClaims` and the inline `PATCH /users/me` 200 body. The claim is real (main's contract was stale); it is slightly wider than "on /users/me" (three named schemas). Semantic diff of main-regenerated against the branch with the 25 `/money` paths removed: only the 39 new money schemas added; no served path or schema changed. No served operation carries `x-wawu-served`.
4. **Mobile types.** Copied the branch contract into the merged mobile worktree, ran `python3 scripts/api/sync_contract.py` (regenerate only: exclusions, then openapi-typescript 7.13.0): exit 0, `npx tsc --noEmit` exit 0. Every nullable named field keeps its null: `WalletView.account`, `.limits`, `BeneficiaryView.wawuUser`, `.bankAccount`, `TransferView.toWawuUser`, `.toBankAccount`, `.reversal`, `PaymentQuoteView.payee`, `PaymentView.hold`, `HoldView.payee`, `TransactionView.counterparty`, `.link` all generate `Named | null`; `GET /money/payout-account` is `PayoutAccountView | null` (`schema.generated.from-branch.ts`). The `x-wawu-served` flag does not survive into the types; the description "Declared by MONEY-04, not served yet" does, as JSDoc on all 29 operations. `npm run api` itself (which copies origin/main) was not run: the branch is not on origin/main.
5. **Conventions.**
   - PIN: only `X-Transaction-Pin` (`^[0-9]{4}$`, required) on the 3 debits, `PUT /money/pin` and `POST /money/pin/verify`. No query or path parameter matches `pin`. No debit DTO has a PIN field, and the global `ValidationPipe` (`forbidNonWhitelisted`) refuses one: `PaymentDto` with `pin` gives "property pin should not exist". New PINs travel in the PIN routes' own bodies, as stated. No logging anywhere in `src/money`.
   - Wrong PIN `403 pin_incorrect` + `triesLeft`; locked `423 pin_locked` + `lockedUntil`; `pin_required` 403; no money code maps to 401 (`MONEY_ERROR_STATUS`, and every operation's responses).
   - Idempotency-Key: required on the 3 debits (spec-checked). CONVENTIONS section 4: replay of the stored result with `Idempotent-Replayed`, `409 idempotency_key_reused` on a different body, `409 idempotency_in_progress` while running, refusals before money moves not stored and the key released. All four present and consistent with W14's "Try again" (a new key).
   - Kobo: request amounts are `integer` (6 DTO fields, 2 query params) with `@IsInt`; a float is refused ("amountKobo must be an integer number"). Responses: see defect 2.
6. **Section 4 against the rulings.** Item 1 matches R-10 and `fees.md` (₦40, ₦23.25/₦15.75, ₦100); the W10 render really is a bank send drawn with "Fee ₦10.00". Item 2 is genuinely unruled (R-10 covers the buyer's leg only; MONEY-17's scope confirms purchases go to WAWU's collection account). Item 3 matches R-19 and `limits.md`. Item 4 matches `limits.md` and the W35/A8 renders. Item 5 matches R-1 and `naira-api.md`. Item 6 states R-10's refund default correctly and leaves open only what R-10 and brief rule 6 leave open. Items 7 to 11 match the renders and `naira-api.md`. No contradiction found.
7. **Secrets and personal data.** Both diffs scanned for keys, tokens, PEM blocks, 10 and 11 digit numbers, phones and e-mail addresses: none. The phones in CONVENTIONS.md are format samples (`+2348031234567`, the masked `+234 803 *** 4412`) and two values quoted from WAWU ID's own tests. No `.env` or key file in either diff.
8. **Not run:** the full backend jest suite (`npm run test:contract`): not claimed by the builder and not in this task's passes; the money spec and the protected suite were run. V2, V4 to V9: not in this task's `passes` (type `contract`); nothing is served, so there is no live behaviour to attack.
9. **Process note.** Mobile origin/main moved to `9f35e9f` five minutes after the builder's commit; the branch has not merged it (WORKFLOW section 8.3). The merge conflicts only in generated `docs/PROGRESS.md`, and `npm run check` passes on the merged result. Backend branch is on the current origin/main.

### Findings

1. **defect: the list of served schemas whose nullable named field generates as never-null is incomplete.** `wawu-backend docs/contract/WALLET.md:315` says "Eight served schemas" and lists 8 fields; the same "eight" is in `scripts/enrich-contract.js:306`, and `BACKEND_GAPS.md` G-1 (line 13) says "8 nullable named fields". The branch contract has **11** such properties (`{ $ref, nullable: true }`): the 8 listed plus `AdminFinanceTransactionView.creator`, `AdminFinanceTransactionView.buyer` and `AdminFinanceWalletView.payoutSubaccount`. Affected: whoever takes G-1 for the served routes works from this list and would leave three admin-dashboard fields typed as never null, so a dashboard screen dereferences a null creator, buyer or payout subaccount with the type checker's blessing.
2. **defect: the contract does not say response amounts are integers.** CONVENTIONS.md lines 78 to 81 say every amount in a money route is a JSON integer of kobo, but in `contract/openapi.json` all 32 `*Kobo` fields of the money response schemas are `"type": "number"` (for example `FeeBreakdown.providerFeeKobo`, `WalletBalanceView.availableKobo`, `TransferView.totalKobo`, `MoneyErrorReason.shortfallKobo`); only the request side is `integer`. Source: the plain `number` fields in `src/money/money-view.type.ts` (from line 35) and `MoneyErrorReason` in `src/money/dto/money-error.dto.ts`, which the enricher writes as `number`. Affected: the contract is the agreed spec the app and later contract tests (V2) are built from; a test or validator generated from it accepts `2506500.5` as a balance, and a client generated in a language with integer and float types reads every amount as a float. The kobo rule the task exists to fix is stated in prose but not in the machine-readable contract.

### Unclear (for the owner)

1. **The ₦10,000,000 cap on every money route.** `MAX_AMOUNT_KOBO` (`src/money/dto/money-request.dto.ts:55`) takes `limits.md`'s figure for WAWU's **merchant** account and applies it as a hard validation bound to every amount, including customer-to-customer sends and payments, as a constant rather than config. `limits.md` says amounts above it are "split or refused"; the contract picks refused. Above it the caller gets a plain ValidationPipe 400 "amountKobo must not be greater than 1000000000" with no `reason`, not `400 amount_out_of_range` with `maximumKobo` as CONVENTIONS section 3 suggests (checked with class-validator against the built DTO). Does this cap stand for customer wallets, should it be config, and should an over-cap amount answer `amount_out_of_range`?
2. **Daily limit on purchases.** `POST /money/payments` and `GET /money/payments/quote` carry neither `daily_limit_exceeded` nor `withinDailyLimit`, while both transfers do. Whether Fintava's tier daily limit counts a wallet-to-wallet purchase is not in `limits.md`. If it does, a purchase over the limit has no declared refusal.
3. **W26's grouped earnings row.** The render shows "Unlock · Lighting night sho... · 3 buyers · +₦7,500.00", one row for three unlocks. `TransactionView` is one movement per row with no count, and WALLET.md does not say whether history groups earnings. The analysis evidence (A1.json, W26) does not list grouping, so this is not a mapping miss; it needs a ruling before MONEY-15 builds history.

### Round 2 (verifier, 2 Oct 2026): backend `b864994`, mobile `500f2af`

Fresh detached worktrees: wawu-backend `b864994` (own `npm ci`) and `b7d4e63` (= origin/main, the base checker); wawu-wmt-mobile `500f2af` (own `npm ci`), then the same with the newest origin/main `39365dc` merged in. Own database `money04_verifier2_protected_test` (dropped afterwards), Postgres left running. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money04-r2/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates, backend | passed | `tsc --noEmit` 0 errors. eslint (no `--fix`) on the 12 changed `src/` files: exit 0. `npx jest src/money`: 9/9. `scripts/gates/run.py`: 16 fail / 0 warn / 76 accepted, files scanned 536; the findings list is identical line for line to main's (only the files-scanned line differs, 525 -> 536). `check_baseline.py` exit 0 (`gates-b.txt`) |
| V1 Gates, mobile | passed | `npm run check` exit 0 on `500f2af` and on `500f2af` + `39365dc`: jest 70/70, gates 0 fail on 34 files, lint 0 errors and 2 warnings (both `src/components/Button.tsx`, from main), task check 187 tasks (`check-branch.log`, `check-merged.log`) |
| V3 Regression | passed | `run.sh --fresh` with the lock from origin/main: `b7d4e63` 244/244 required (253 tests), `b864994` 244/244 required (253 tests), both exit 0 (`protected-b7d4e63.log`, `protected-b864994.log`) |
| Capability: data needs mapped | passed | W26 re-rendered light and dark (`W26-*.png`); the new group row and the payment-limit row are mapped in WALLET.md section 3 |
| Capability: conflicts listed, not resolved | passed | Section 4 changes only cite the Lead rulings and add Fintava question 16; nothing resolves a fact on its own authority |

1. **Defect 1: fixed.** Recounted in the regenerated contract: exactly 11 `{ $ref, nullable: true }` properties, the same 11 now named in `WALLET.md` section 5, `scripts/enrich-contract.js:307` ("eleven") and `BACKEND_GAPS.md` G-1 ("11").
2. **Defect 2: fixed.** All 53 `*Kobo` fields and parameters in `contract/openapi.json` are `"type": "integer"`; none is anything else. Mutations in my worktree: (a) `WalletBalanceView.availableKobo` and the `fees/quote` `amountKobo` parameter set to `number` in the contract: the new spec test fails and names both; (b) the `koboAsInteger` call disabled in `enrich-contract.js` and `contract:enrich` re-run: the spec fails. Both restored from copies, tree clean, 9/9 again.
   - Side effect on served schemas, all three claims true: the only non-money changes since round 1 are 12 `type` values (`number` -> `integer`) in `AdminFinanceMoneyView`, `AdminFinanceStreamTotalsView`, `AdminFinanceCreditsAttributionView`, `AdminFinanceTransactionView` (3 each), plus the new `TransactionGroupView`; no served path changed. Responses unchanged: no file outside `src/money` changed, and the values are already integers on the wire (Prisma `_sum` of integer kobo columns, `nairaToKobo` = `Math.round(naira) * 100`, `splitKoboByBps` floors). openapi-typescript 7.13.0 on the round 1 and round 2 contracts: the diff touches no `AdminFinance*` type, only money types. Protected suite 244/244 (above).
3. **Lead rulings: applied as ruled.**
   - Cap: `MAX_AMOUNT_KOBO` is gone; `1000000000` is no longer anywhere in the contract or `src/`; it lives only as `MERCHANT_MAX_PER_TXN_KOBO=1000000000` in `.env.example`. Request DTOs now bound amounts only at `Number.MAX_SAFE_INTEGER`, so a customer send has no cap. `POST /money/payments` and `GET /money/payments/quote` declare `400 amount_out_of_range`, and CONVENTIONS, WALLET.md and both handlers' descriptions say above the cap is `amount_out_of_range` with `maximumKobo`, never split. Payouts from WAWU (WALLET-17) and hold release or refund (MONEY-18) are named as the other places the cap applies; neither is declared here. Nothing reads the config yet (no route is served); MONEY-17 is named as the first reader.
   - Daily limit: `POST /money/payments` declares `403 daily_limit_exceeded`; `PaymentQuoteView` has `withinDailyLimit: boolean` and `remainingTodayKobo: integer | null`, both required. Fintava question 16 added to `naira-api.md`.
   - W26 grouping: `TransactionView.group` (`TransactionGroupView | null`: `key`, `count`, `firstAt`, `lastAt`) and `?group=` on `GET /money/transactions`. The render matches the rule: one row "Unlock · Lighting night shoots" (the canvas source text; the render truncates it), "3 buyers", +₦7,500.00, the latest time 09:02, under the "Today" label, while the tip, airtime, electricity and transfer rows stay single.
4. **Contract regenerates byte for byte.** `npm run contract:build` on `b864994`: `git status` clean; 261 paths, 29 operations `x-wawu-served: false`, 286 schemas.
5. **Mobile types.** Branch contract through `sync_contract.py` (regenerate only), then `tsc --noEmit`: both exit 0. `group`, `hold`, `reversal`, `account`, `limits`, `counterparty`, `link` keep `| null`; `remainingTodayKobo` is `number | null` on both quotes.
6. **Also checked.** Round 2 diffs (backend `b00e4c3..b864994`, mobile `6b7eaff..500f2af`) contain no secret, key or personal data. The changed files match the builder's round 2 bullets; `docs/fintava/naira-api.md` (question 16) is named under "Lead rulings" rather than in the bullet list. Main's new verifier step "no stand-ins for what main has": this task changes no mobile code, so there is nothing to check.
7. **Notes, not defects.** `POST /money/transfers/*` and `GET /money/fees/quote` still list `amount_out_of_range` (from `DEBIT_GATE_ERRORS`). CONVENTIONS limits that code to "below the minimum" for them, and no minimum is defined anywhere yet, so it can't fire until one is. `TransactionGroupView.count` is `number`, not `integer` (it is not a kobo field). Mobile origin/main moved again to `39365dc` after the builder merged `6b7eaff`; the merge conflicts only in generated `docs/PROGRESS.md`, and `npm run check` passes on the merged result.
8. **Not run:** full backend jest (`test:contract`), which is not claimed and not in `passes`. `npm run api` as written (it copies origin/main; regenerate-only with the branch contract was used instead). V2 and V4 to V9, which are not in this task's `passes`.

**Round 2 verdict: no open defects; status `review`.** Round 1's three unclear items are answered by the Lead rulings recorded above.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
