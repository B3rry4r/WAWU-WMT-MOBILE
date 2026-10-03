---
id: MONEY-09
title: Transaction PIN
owner: YOU
area: MONEY
order: 59
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [MONEY-04]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-09 · Transaction PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Every movement of money asks for a 4-digit PIN (W11, W36).

## Scope

Set, confirm, change; stored as a slow hash; locked after 5 wrong tries; required on every debit endpoint.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava has no wallet PIN (only card PINs), so this PIN is ours, as planned.

## Capability checks

- [ ] A debit without a PIN, or with a wrong PIN, is refused.
- [ ] Five wrong PINs lock it, and the lock is shown with when it ends.
- [ ] The PIN never appears in logs.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-09` in both repos (wawu-backend `8382c88` + `8840684`, from main `efec55c`).
- **Served:** `GET`, `POST`, `PUT /money/pin` and `POST /money/pin/verify` moved from the unmounted `MoneyContractModule` to `MoneyModule` (`src/money/money.module.ts`, `src/money/pin/`), mounted in `app.module.ts` (fenced: SHARED-CHANGES row 10, for owner review at merge). Every other money route, reset included, is still `x-wawu-served: false`. Contract via `npm run contract:build`: the only semantic change is the served flag on those 4 operations (reset's operationId/tag renamed to `MoneyPinResetController`; no type shape changes). The emitter now keeps one copy of a schema a served and a declared route share when identical.
- **PIN:** new table `TransactionPin` (additive migration `20261002120000_transaction_pin`: hash, failedTries, lockedUntil, setAt; no row means no PIN). argon2id (already a dependency) with its own random salt per hash; `argon2.verify` compares with `timingSafeEqual`. A try is counted before the hash is compared, in one conditional update, so concurrent tries cannot pass 5. Wrong: `403 pin_incorrect` + `triesLeft` (4..1); the 5th wrong and every try until the lock ends: `423 pin_locked` + `lockedUntil` (ISO). Count resets on a right PIN, a change, or the lock's end. Never 401.
- **Lock length:** `PIN_LOCK_MINUTES` in config (`.env.example`), default 30 marked `PROVISIONAL(PIN-LOCK-MINUTES, owner=YOU, ...)`: WALLET.md and the rulings name no length. Owner to confirm.
- **Guard:** `TransactionPinGuard` / `@RequireTransactionPin()` reads only `X-Transaction-Pin`; missing, doubled or not 4 digits is `403 pin_required` (no try used); it deletes the header from `headers` and `rawHeaders` once read. Guards run before pipes, so the PIN is checked before body validation (CONVENTIONS.md section 5 updated to say so); a replay layer (MONEY-17) must run before it.
- **Check "a debit without a PIN, or with a wrong PIN, is refused":** no debit route is served yet; proved on `PUT /money/pin` and `POST /money/pin/verify` (same guard), and a unit test fails if any mounted route documents the header without the guard.
- **Check "five wrong PINs lock it, shown with when it ends":** HTTP spec (4 x 403 with 4,3,2,1, then 423 with `lockedUntil` = now + config; right PIN refused while locked; `GET /money/pin` shows `triesLeft: 0` and the time); lock end; 10 concurrent wrong tries give exactly 4 x 403 + 6 x 423.
- **Check "the PIN never appears in logs":** spec captures the Nest logger, stdout, stderr and console across set, wrong tries, change, a validation 400, the lock and a forced 500; asserts the digits are absent from output, bodies and headers. Mutation-checked: a `console.error(pin)` in the guard makes it fail.
- **Found by the suite:** the account purge's drift guard flagged `TransactionPin.wawuUserId`; it is now OWNED in `account-data-map.ts` (deleted with the account).
- **Backend runs:** tsc 0 before and after; eslint 0 errors 0 warnings on changed files; money specs 3 suites / 62 tests (unit 26, HTTP 25, contract 11); full `test:contract` 93 suites, 1727 passed, 3 skipped, 0 failed (own DB `money09_test`); protected suite 244/244 before (main) and after (`8840684`, fresh `money09_protected_test`); gates 16 fail / 0 warn / 76 accepted on 536 files before, 16 / 1 / 76 on 543 after (the 16 are main's; the warn is the provisional marker); baseline check passes.
- **Mobile:** `npm run check` exit 0 before (jest 6 suites / 70, gates 0 on 34 files, lint 0 errors 2 warnings) and after merging main `02d152a` (jest 9 / 136, gates 0 on 50 files). `npm run api` not used to commit anything: it copies backend origin/main; the branch contract was swapped in locally, types generated and `tsc` passed (exit 0), then main's contract restored.
- **Gaps filed:** G-11 (W37 reset needs the verified phone from KYC-01/MONEY-12; reset stays declared for MONEY-14), G-12 (PIN routes do not answer the wallet gate codes until MONEY-12/13 store wallet state).
- **Not done:** reset (MONEY-14's, G-11); weak-PIN rules (no contract code exists); Face ID (MONEY-14). `prisma/schema.prisma` is fenced except a migration the ticket names: the migration was named in the build brief, not this file.

## Verifier report

Verifier: fresh session, 2 Oct 2026; wrote none of this task's code. Own detached worktrees: wawu-backend `8840684` (branch) and `efec55c` (= origin/main, the base), node_modules symlinked (lockfiles identical); wawu-wmt-mobile `0c178b1` as pushed, and the same with the newest origin/main `4532d4d` merged in locally (not pushed). Own databases `v09_app`, `v09_test`, `v09_protected`, `v09_main`, `v09_mig`, `v09_id` (all dropped afterwards). Mock WAWU ID on :4001, real wawu-id (`76d8b46`, origin/main) on :3092, branch app on :3091. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/v09/` (logs named below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates, backend | passed (nothing went up) | `npx tsc --noEmit` 0 errors on main and branch. `npx eslint` (no `--fix`) on the 13 changed `.ts` files: exit 0, no output. `scripts/gates/run.py`: main 16 fail / 0 warn / 76 accepted on 536 files; branch 16 / 1 / 76 on 543 (the 7 new `src/money` files). The two outputs differ only by the new warn, `PROVISIONAL(PIN-LOCK-MINUTES)` at `transaction-pin.service.ts:19`; the 16 fails are line for line main's. `check_baseline.py` exit 0 on both, 108 entries (`gates-b9main.txt`, `gates-b9.txt`, `baseline-*.txt`, `eslint.log`, `tsc*.log`) |
| V1 Gates, mobile | passed | `npm run check` exit 0 on `0c178b1`: tsc 0, lint 0 errors 0 warnings, jest 9 suites 136/136, gates 0 fail on 50 files, task check 187 tasks (`m-check-branch2.log`). With origin/main `4532d4d` merged: exit 0, jest 10/185, gates 0 on 53 files, 199 tasks (`m-check-merged.log`). A first run on `0c178b1` failed one test from main (`src/__tests__/lists.test.tsx:56`, 5 s jest timeout) while the backend suite was loading the machine; it passed on re-run (unclear 2) |
| V2 Contract | passed | Booted app (`flow.py`, `flow.out`): 45 HTTP checks, 44 as expected; the 45th was my wrong expectation (a header sent as `" 7391"` is accepted: HTTP strips leading whitespace from a field value, so it is the same value). Unexpected formats: PIN as a JSON number, `12a4`, 3 digits, missing confirmation: 400; header `12345`, `abcd`, `123`, empty, doubled, PIN only in the query or only in the body: 403 `pin_required`, no try used. Money specs: 3 suites 62/62 (`money-specs.log`). Full `test:contract` on `v09_test`: 93 suites, 1727 passed, 3 skipped, 0 failed (`full-contract.log`). Contract: `npm run contract:build` reproduces `contract/openapi.json` byte for byte (sha256 `0d0a36d2...`) |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh <ref>` with `PROTECTED_LOCK_REF=efec55c`: main code 244/244 required (253 tests), branch code 244/244 required (253 tests), both exit 0 (`protected-main.log`, `protected-branch.log`) |
| V4 Field trace | passed | Writers: `POST /money/pin` (insert), `PUT /money/pin` (hash, setAt, count reset), the guard (failedTries, lockedUntil). Storage: `TransactionPin` (`pinHash` is `$argon2id$v=19$m=65536,p=4,t=3$...`, never the digits). Readers: `GET /money/pin` and the verify/change bodies (`PinStateView`), `403 reason.triesLeft`, `423 reason.lockedUntil`; read back after each write in the flow. Mobile reader: `wmt/MONEY-02` `src/components/pin-sheet/types.ts` `PinRefusal` (`pin_incorrect` + `triesLeft: number`, `pin_locked` + `lockedUntil: string`) and the `lockedUntil` prop from `PinStateView.lockedUntil`: the served shapes match. `WalletView.pin` is MONEY-12's and not served. Account purge: the real `AccountPurgeService.purge` on `v09_app` deleted that user's row (`{"TransactionPin.wawuUserId":1}`) and left the other 6 |
| V6 States | passed (backend; this task has no screen) | Each reached through its real cause on the booted app: not set (409 `pin_not_set` on verify and change), set (201), mismatch (400 `pin_mismatch` on set and change), already set (409), malformed (400 without `reason`), `pin_required`, `pin_incorrect` 4, 3, 2, 1, locked on the 5th (423), locked with the right PIN, lock ended (`PIN_LOCK_MINUTES=1`, a real 60 s wait: GET shows 5 tries and no lock, a wrong PIN is 403 with 4, the right PIN 200), a 500 (table renamed under the running app: body "Something went wrong. Please try again."), and `PIN_LOCK_MINUTES=0` stops the app at boot with the stated message (`app-bad.log`) |
| V7 Flow walk | passed at the API; app walk NOT RUN | A new person with no wallet (the only state that exists, G-12) through set, verify, change, 5 wrong, locked, lock end, right PIN (`flow.out`, `expiry*.py`). The app walk is NOT RUN: this task builds no screen (the PIN sheet is MONEY-02, reset and Face ID MONEY-14) |
| V8 Money attack | PIN parts passed; the rest NOT RUN | Wrong PIN 5 times locks (above). 10 parallel wrong tries, 5 rounds on fresh users: every round exactly 4 x 403 (`triesLeft` 4, 3, 2, 1) and 6 x 423 with one `lockedUntil`, DB `failedTries` 5 with the lock set, and an 11th try with the right PIN 423 (`conc.out`). The PG statement log shows each try is one `UPDATE ... WHERE "failedTries" < 4 AND "lockedUntil" IS NULL RETURNING` (then `= 4` with the lock), so Postgres re-checks the condition under the row lock. Same request twice, double tap, insufficient funds, webhook replay and forgery, reversal, ledger against Fintava: NOT RUN, no debit route is served by this task (WALLET-07, WALLET-09, MONEY-17 serve them) |
| V9 Live seam | passed | Real wawu-id at origin/main on its own DB: `POST /auth/register`, then `POST /auth/login` 200 (email marked verified in `v09_id`, as no mail service runs locally); the Hub verified the token through wawu-id's JWKS. `GET /money/pin` read back `triesLeft: 4` after one wrong try and the server's `changedAt`; right PIN 200 with 5; no header 403; a bad token 401 (`v9.out`) |

### What I checked, and what came back

1. **Diff against the report.** Backend `git diff --stat efec55c...8840684`: 18 files, all accounted for by the report (it does not name `src/money/money-error.ts`, the one error class every PIN refusal uses; nothing else unlisted). Mobile `git diff --stat origin/main...0c178b1`: `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`, this file. No `src/`, `contract/` or `src/api/` change: nothing copied from a branch contract.
2. **Capability checks, as written.**
   - "A debit without a PIN, or with a wrong PIN, is refused": passed on the two guarded routes (`PUT /money/pin`, `POST /money/pin/verify`); no debit route is served. Mutation: `PUT /money/pin` with `@TransactionPinHeader()` in place of `@RequireTransactionPin()` fails 5 money tests (`mutation4.log`).
   - "Five wrong PINs lock it, and the lock is shown with when it ends": passed. The 5th wrong is 423 with `lockedUntil` 30.00 min ahead at the default; the right PIN while locked is 423 with the same time; `GET /money/pin` shows `triesLeft: 0` and that time; the lock ends on time with `PIN_LOCK_MINUTES=1`.
   - "The PIN never appears in logs": passed. The app ran with `DEBUG=*` (express, body-parser, router), every Nest log level, and Postgres `log_statement=all` on its database. Six distinct PINs sent as right, wrong, new and mismatched values, through set, change, verify, the lock, validation 400s and three forced 500s: 0 hits in the app logs (78,639 lines), the mock and real WAWU ID logs, the Postgres log (754 lines since start) and every response body and header. The only hits are 8 express-router debug lines of my deliberate probe that put the PIN in the URL (`?pin=7391`), which the server refused with `pin_required`; that is why CONVENTIONS section 5 forbids a PIN in a URL. Builder's mutation (`console.error(pin)` in the guard): the log test fails (`mutation1.log`). Mine: a Nest `Logger.debug` of the PIN in the service fails it too (`mutation3.log`); not deleting the header fails 8 tests (`mutation2.log`). All restored from git, tree clean.
3. **Contract.** Semantic diff of main's contract against the branch's: on the 4 PIN operations only `x-wawu-served: false` and the "Declared by MONEY-04, not served yet" description are removed; on reset and reset/confirm the operationId (`MoneyPinController_*` to `MoneyPinResetController_*`) and the tag (`MoneyPin` to `MoneyPinReset`) change. Nothing else. 25 money operations remain `x-wawu-served: false`; in the booted app all 25 answer 404 with a valid token, an `X-Transaction-Pin` and an `Idempotency-Key`, and the router maps exactly 4 `/money` routes. The order of paths and of 25 schemas in the file changed (served routes are emitted first), so the regenerated mobile types diff is about 218 lines of reordering; branch contract through `sync_contract.py` then `tsc --noEmit`: exit 0 (restored afterwards).
4. **Migration.** Additive: on a copy of a seeded database at main's schema, `prisma migrate deploy` applied only `20261002120000_transaction_pin`; `pg_dump -s` before and after differs only by the new table and its primary key, and the data dump of every other table is identical (md5 `e4b161d1...` both). `prisma migrate diff` from that database to the branch's `schema.prisma` gives only `DROP INDEX "ContentPiece_specializations_idx"`, which main gives too.
5. **Decision points.**
   - `app.module.ts`: one import line and one `imports` entry (`MoneyModule`, after `ShopModule`), plus a 4-line comment. Minimal.
   - Guard before validation: documented in CONVENTIONS section 5 ("Nest runs guards before pipes, so the PIN is checked before the body is validated: a malformed body with a wrong PIN still uses a try"), and observed: malformed body + wrong PIN is 403 `pin_incorrect`, + right PIN is 400.
   - G-11 names its unblocking facts (KYC-01 or MONEY-12 storing the verified phone on the Hub, and MONEY-14 listing that task in `depends_on`); G-12 names its (MONEY-12 storing the wallet, MONEY-13 its state, then MONEY-13 gating `/money/pin`).
   - PIN checked but money moving without the guard: none in this task. No served money route moves money, the declared debits answer 404, and a future debit is held by two tests (a money-moving route must document `X-Transaction-Pin`; a mounted route that documents it must run the guard). The live web's `POST /wallet/withdraw` (Flutterwave, protected registry) moves money without a PIN, as before: the web stays on Flutterwave until after launch (wawu-backend CLAUDE.md, Money), so not this task's.
   - The contract's 403 and 423 shapes match the PIN sheet on `wmt/MONEY-02` (V4 above); the extra `reason.message` is harmless to it.
6. **Secrets.** Both diffs scanned for keys, tokens, PEM blocks and `.env` files: none. The HTTP spec signs tokens with the mock WAWU ID's key read from disk at run time (`mock-wawu-id/private.pem`, gitignored, generated on first run).
7. **Not run:** the app-level flow walk (V7) and the debit attacks of V8, for the reasons in the table; V5 and V10 are not in this task's passes.

### Findings

No defects.

### Unclear (for the owner)

1. **SHARED-CHANGES row 7 is taken on main now (renumbered to 10 at merge).** Main moved twice during verification (`7148749`, `4532d4d`). Main's section 1 already has row 7 (UI-02 follow-up) and rows 8 and 9; this branch adds MONEY-09's `app.module.ts` request as row 7 too. Merging main conflicts in `SHARED-CHANGES.md` (and the generated `docs/PROGRESS.md`); `npm run check` passes once both rows are kept. Whoever merges main before the pull request (WORKFLOW section 8.4) renumbers this row to the next free number (10) and updates "row 7" in the builder report. Not a code defect: the row was free when the builder merged `02d152a`.
2. **A main test timed out once under load.** `src/__tests__/lists.test.tsx:56` (5 s default) failed once while the backend suite ran in parallel, then passed. Not in this branch's diff; WORKFLOW section 10 sends any flaky suite to the owner.
3. **Lock length.** `PIN_LOCK_MINUTES` defaults to a provisional 30 (the gates' one new warn); no ruling names it. The owner confirms or sets it in config.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
