---
id: MONEY-09
title: Transaction PIN
owner: YOU
area: MONEY
order: 26
priority: launch
repo: wawu-backend
type: money-path
status: verifying
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
- **Served:** `GET`, `POST`, `PUT /money/pin` and `POST /money/pin/verify` moved from the unmounted `MoneyContractModule` to `MoneyModule` (`src/money/money.module.ts`, `src/money/pin/`), mounted in `app.module.ts` (fenced: SHARED-CHANGES row 7, for owner review at merge). Every other money route, reset included, is still `x-wawu-served: false`. Contract via `npm run contract:build`: the only semantic change is the served flag on those 4 operations (reset's operationId/tag renamed to `MoneyPinResetController`; no type shape changes). The emitter now keeps one copy of a schema a served and a declared route share when identical.
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
