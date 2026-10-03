---
id: MONEY-13
title: No wallet yet: money screens lead to Open your wallet
owner: YOU
area: MONEY
order: 82
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-12]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-13 · No wallet yet: money screens lead to Open your wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Nobody has a wallet until they open one (R-6), new and existing users alike. Every money endpoint answers 'no wallet yet' the same way, and every money screen leads to Open your wallet.

## Scope

A consistent `no_wallet` error on every wallet and payment endpoint, in the contract (MONEY-04). The screens
that lead to Open your wallet are wired by KYC-05 (the pay sheet) and by each screen task that draws a way in
(docs/WORKFLOW.md section 7, "Links between screens").

## Capability checks

- [ ] A signed-in user with no wallet gets the same `no_wallet` answer from every wallet and payment endpoint (no 500s).

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-13` `35b68af` (on main `6d48c97`); mobile `wmt/MONEY-13` (on main `12aa3c9`). Neither main moved. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/m13/` (logs, `full*.json`, `live-drive.json`, `sbx/`).
- **Built:** a wallet gate, `src/money/gate/wallet-gate.ts`: `WalletGate.requireOpen`, `WalletGateGuard`, `@RequireOpenWallet()`, `@CurrentWallet()`, and `walletStateOf`, the one rule `GET /money/wallet`'s `state` and the gate's code both use (so they never disagree). It answers before the PIN, the body, the quote or Fintava, reads only our database, and drops an `X-Transaction-Pin` header unread when it refuses. `@RequireTransactionPin()` now brings the gate ahead of the PIN. Gated: `GET`, `POST`, `PUT /money/pin`, `POST /money/pin/verify` (closes G-12) and `GET /money/wallet/balance` (its own check removed; it takes the gate's wallet). MoneyModule exports the gate. Files: the gate and 3 specs (new), `money.module.ts`, `money-pin.controller.ts`, `transaction-pin.guard.ts`, the balance controller and service, `wallet-opening.service.ts` (view uses `walletStateOf`), CONVENTIONS section 7, the MONEY-09 PIN spec and the MONEY-11 balance spec. Mobile: sandbox `34-` and its README row, BACKEND_GAPS.
- **The `no_wallet` answer is the contract's `409 wallet_not_open`** (MONEY-04; the app already maps it to `no_wallet` in `src/api/money.ts`). One body on every route: message "You don't have a wallet yet. Open your wallet to continue."; `409 wallet_opening` "Your account is still being opened. Check again in a moment.". Not gated: Open your wallet itself (`/money/identity/*`, `POST /money/wallet/open`), `GET /money/wallet` (200 `not_open`), and the declared bank list and name check (WALLET-09).
- **Check, "the same `no_wallet` answer from every wallet and payment endpoint, no 500s":** `wallet-gate.contract.spec.ts` (real MoneyModule, database, RS256 tokens, MONEY-06 client to the stand-in) finds the gated routes from the controllers, not a hand list, and sends each 3 shapes (nothing; a wrong body and a PIN; a malformed PIN and a non-UUID id) as: a new user, BVN checked only, last opening `failed`, both identity stops, and an existing web creator with a Flutterwave wallet and an old PIN: 15 of 15 byte-identical `409 wallet_not_open`, `GET /money/wallet` `not_open`, 0 Fintava calls. Opening `opening`, `unknown`, `conflict` (held) and `open` without the wallet row: 15 of 15 `409 wallet_opening`, GET `opening`. Five wrong PINs without a wallet: 409 each, 0 tries used, old PIN untouched. 30 at once: all 409, one body. A wallet holder passes (PIN set, read, checked; balance from Fintava). No token: 401. Unit spec: the state table (14 rows), header drop, once per request.
- **Every route, held by code:** `wallet-gate-coverage.spec.ts` walks every controller AppModule mounts: a route documenting the gate codes runs the gate and the reverse; the gate runs before the PIN guard; every mounted `/money` route is gated or listed with a reason; every declared `/money` route documents both codes (so it fails the first rule if served ungated).
- **Mutants (9), all killed:** GET pin ungated, PIN guard before the gate, `failed` read as opening, identity stop ignored, no header drop, balance ungated, a route-specific message, gate run twice, gate passing without a wallet.
- **Sandbox (2 reads, `34-money13-no-wallet.md`):** built Hub :4911, stand-in WAWU ID :4912, real register and login. Four kinds of person without a wallet: every gated route, bare and with a PIN and a wrong body, the one body each, 0 Fintava calls; the holder of `1192964482` set and checked a PIN and read the balance from the sandbox (`availableKobo: 0`). Key: 0 of 58 windows in logs, outputs and the staged diff.
- **Runs:** tsc 0; eslint 0 on the 12 changed `.ts` files; money, Fintava, KYC review, identity, purge and rate-limit specs 32 suites 1,318/1,318 (`m13_test`, :4912). Full suite on fresh seeded databases with the mock on :4001 (`lsof` empty before): run 1 (`m13_full_test`) 3,019 passed, 3 skipped, 2 failed, both timing under load from other sessions' jest runs (load 5 to 8 on 4 CPUs): `wallet-opening` "a create that lands after the timeout" (`opening` where `open` expected, line 804) and `ledger-status` "two servers never ask about the same row in one minute" (98 rows, 49 expected). Neither touches the gate; both passed 3 of 3 on that database at load 5.3 to 8.1. Run 2 (`m13_full2_test`): **124 suites, 3,021 passed, 3 skipped, 0 failed**. Protected `--fresh HEAD` 253/253, all 244 required, lock "No change", registry sha256 `767e27bf...`; tripwire 0 of 1,386 added lines; `hub-rate-limits` 10/10, no `@Throttle` added; gates main 16 fail / 10 warn, branch 16 / 10, identical findings (no new warn), baseline OK; `contract:build` byte-stable (`74e3f2d4...`): the contract already declared every code, so no API change and no sync (`sync_contract.py` gave no diff). Mobile `npm run check`: main exit 1 only on a stale `docs/PROGRESS.md`; branch exit 0 (typecheck, lint, 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks).
- **Defaults (agent), owner may override:** `no_wallet` is `409 wallet_not_open`, not a new code; the two sentences above, one per code, on every route (the balance's "Open your wallet to see your balance." retired); the PIN routes are gated (the PIN is set on A9, after A8); an opening `conflict` held because another WAWU account holds the account reads `opening` (MONEY-12's view), an identity stop `not_open`; `423 wallet_frozen` is never answered by the gate (nothing stores a freeze, G-10).
- **Tests changed, and why:** the MONEY-09 PIN spec's people now hold a wallet (precondition only, no assertion changed); the MONEY-11 balance spec expects the gate's sentence.
- **Filed:** G-12 closed on this branch; G-40 (the web's Flutterwave payment routes take money without a wallet and are protected: WALLET-30); G-41 (a PIN set before the gate stays; A9 must read `pin.isSet`: KYC-04). No SHARED-CHANGES row (no fenced file touched).
- **For the parallel builders (findings):** MONEY-15's history service and WALLET-14's saved-accounts controller check the wallet inline; MONEY-15 imports `BALANCE_OPENING_MESSAGE`, which this branch removes. Whichever merges after this branch replaces the inline check with `@RequireOpenWallet()` and `@CurrentWallet()`; `wallet-gate-coverage.spec.ts` fails until each served wallet route is gated. Small overlaps in `money.module.ts`, `transaction-pin.guard.ts`, `money-pin.controller.ts` (MONEY-14) and `wallet-opening.service.ts` (WALLET-14).
- **NOT RUN:** `opening` and `unknown` openings on the live Hub against the sandbox (its 30 s sweep would ask Fintava about made-up phones): proved against the stand-in; unblocked when Fintava names a sandbox BVN its check passes (question 11) and its selfie success body (question 6), so a real opening can be left in flight. The screens leading to Open your wallet (V6, V7 on screens): KYC-05 (pay sheet), KYC-03, WALLET-01 and each screen task; unblocked when they are built. V10: no screen. CI's `ci-check.sh`: tripwire and lock checked by hand; unblocked by the pull request's CI run (no PR opened, by instruction).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
