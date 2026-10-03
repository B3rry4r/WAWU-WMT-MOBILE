---
id: MONEY-14
title: Reset the PIN, and approve with fingerprint or face
owner: YOU
area: MONEY
order: 104
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-09, AUTH-03]
decisions: [R-24, R-26, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9, V10]
artboards: []
---
# MONEY-14 · Reset the PIN, and approve with fingerprint or face

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W37: reset the PIN by a code to the phone. W35: the phone's own biometric prompt (fingerprint or face unlock,
whichever it has; `expo-local-authentication`, R-26) can stand in for the PIN.

## Scope

PIN reset by a code sent through the same SMS route as AUTH-03 (Fintava's `POST /sms/send`); device key
registration so a biometric approval on a known device counts as the PIN. A failed biometric prompt never uses up
a PIN try.

V10 runs on a real Android phone only (R-24).

## Capability checks

- [ ] A user who forgot their PIN can reset it with a code and pay again.
- [ ] An approval from an unregistered device is refused.
- [ ] A user whose fingerprint fails sees "Fingerprint failed. Use your PIN." and still has all five PIN tries.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-14` `da76d13` (from main `6d48c97`, with backend `wmt/MONEY-13` `35b68af` merged in at `1552e8e` on the lead's instruction); mobile `wmt/MONEY-14` from main `12aa3c9` (neither main moved).
- **Backend, new:** `src/money/pin/` `pin-reset.service.ts`, `pin-reset-config.ts`, `approval-device.service.ts`, `money-pin-reset.controller.ts` (the declared reset moved here; `money-wallet.controller.ts` deleted), `money-device.controller.ts`; `FintavaClient.sendSms` (`POST /sms/send`, a write: lost answer `outcome_unknown`, the text masked out of errors and logs); additive migration `20261003160000_pin_reset_and_approval_device` (SHARED-CHANGES MONEY-14 #1); purge map (3 OWNED rows); `TransactionPinGuard` also takes `X-Device-Approval` on `@RequireApproval()` routes; two codes `reset_codes_exhausted` 429, `device_approval_refused` 403; CONVENTIONS.md section 5, WALLET.md, `.env.example`. Specs: `pin-reset.contract`, `device-approval.contract`, `pin-reset-and-approval`, `fintava-sms`, `sendSms` added to FIX-01's stall list, harness `test/money/pin-approval-harness.ts`.
- **Reset (W37):** the code goes only to `WalletIdentity.verifiedPhone` of a passed BVN check (G-11 closed), never the token's phone. Not weaker than the PIN: 6 digits, argon2id hash, 300 s, 5 wrong tries per code counted before the compare (the PIN's 5), single use, only the newest works, 5 texts a day per person and per phone; at most 25 guesses a day at 10^6 codes against the PIN's 240 at 10^4 (unit-tested, including the largest config allowed). Asking again before Resend opens answers the same reset, no text. The right code sets the PIN, clears count and lock, and turns biometric off.
- **Biometric (W11, W35):** one phone per person registers a P-256 public key with the PIN (`PUT /money/device`); an approval is that key's DER signature over a one-time challenge (`POST /money/device/challenge`, 120 s) plus method, path and body hash, sent as `X-Device-Approval: v1.<challengeId>.<sig>`. Served check: `POST /money/approval/verify` (`@RequireApproval()`, the debits' decorator from now on: WALLET-07, WALLET-09, MONEY-17).
- **MONEY-13 merge:** every new route is behind the wallet gate (none exempt); `@RequireApproval()` runs `WalletGateGuard` before `TransactionPinGuard`; the gate also drops `X-Device-Approval` unread; the gate specs' route inventories list the 7 new routes.
- **Check 1, reset and pay again:** passed in `pin-reset.contract.spec.ts`: locked after 5 wrong PINs, reset, one text to the proved phone, confirm, the new PIN passes the debit check (`/money/approval/verify`), the old one is 403. Plus double tap (5 at once, 1 text), resend, 5 wrong codes, 10 concurrent wrong (exactly 5 compared), expiry, 2 right confirms at once (one wins), another person's reset, mismatch uses no try, bad formats, daily limit per person and per phone, Fintava refusal and lost answer, no code or PIN in logs, answers or columns. Mutations killed: try limit removed (2 fail), supersede removed (1 fail).
- **Check 2, unregistered device refused:** passed in `device-approval.contract.spec.ts`: a key never registered, a replaced phone (old and new challenges), turned off, no phone at all: all `403 device_approval_refused`. Mutation (signature check skipped): 4 fail.
- **Check 3, fingerprint fails, five tries left:** server side passed: 10 refused approvals of every kind (garbage, unknown challenge, replay, expired, another person's, another request's, broken signature, unregistered phone, empty) each leave `triesLeft` 5, then the PIN works; a wrong PIN beside an approval uses no try. The copy "Fingerprint failed. Use your PIN." is MONEY-02's sheet (`PinSheet.test.tsx:336`, passing); the sheet is not wired to the server yet (G-43).
- **Runs:** tsc 0; eslint 0 on changed files; money, Fintava, KYC, purge and rate-limit specs 33 suites, all pass except `kyc-submission` on an unseeded DB (seed data; it passes in the full run); full `npx jest --runInBand --forceExit` on fresh seeded `m14_full_test`, my mock on :4001 (`lsof` free first, stopped after): 128 suites, 3,097 passed, 3 skipped, 0 failed (a first run failed once: the leak scan matched a logged duration; fixed in `da76d13`, rerun green); `hub-rate-limits` passes, no `@Throttle` added; protected `run.sh --fresh` 253/253 (244 required) before and after the merge, lock untouched; gates main 16 fail / 10 warn, branch 16 / 12 (the 2 new are `PROVISIONAL(PIN-RESET-LIMITS)`, `PROVISIONAL(DEVICE-APPROVAL-SECONDS)`), baseline passes; tripwire 0 added lines; key scan 0 of 58 windows on every commit. Mobile `npm run check` exit 0 (typecheck with the regenerated types, lint, jest 20 suites 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks); its only failure before the report was the stale PROGRESS.md.
- **Sandbox (2 calls, `docs/fintava/sandbox/35-money14-pin-reset.md`):** `POST /sms/send` to the documented example is refused `400 ["amount must be greater than or equal to 1"]`; without `+234` a validation 400. No text leaves the sandbox (G-42).
- **Defaults (agent), owner may override:** one registered phone per person; a PIN lock also blocks biometric approval (`423 pin_locked`, G-9 answered); a reset turns biometric off; the reset is for a wallet holder (gated; no proved phone is `409 wallet_not_open`); `sentTo` shows the last 4 digits only (`+234 *** *** 4412`); the text reads "Your Who Made This code to reset your transaction PIN is 123456. It expires in 5 minutes. Never share it with anyone." (copy not drawn).
- **Owner question:** a reset proves the SIM, not the person. Someone holding the unlocked phone (or a swapped SIM plus the WAWU ID session, which wawu-id can reset by SMS too) can reset the PIN; the PIN alone would stop them. Closing it needs a factor not on the SIM: KYC-02's selfie match against the BVN photo on W37 (10 naira a match) or a waiting period before the first debit after a reset; both change the flow or add a limit, so neither is built.
- **NOT RUN:** a real text end to end (sandbox refuses every send; unblocked when one `POST /sms/send` to `+2349036652198` answers 2xx, G-42); the app side of biometric approval (no signing library or key store wired; unblocked by WALLET-06 and WALLET-02 with the package in G-43); V10 on an Android phone (needs G-43 and the backend on the droplet); a debit route with `X-Device-Approval` (none served; WALLET-07, WALLET-09, MONEY-17 swap in `@RequireApproval()` and update MONEY-04's debit header test to expect the pair); `sync_contract.py --backend` copies backend `origin/main`, so the branch contract was copied by hand (SHARED-CHANGES MONEY-14 #2).
- **Gaps:** G-9 answered, G-11 closed, G-42 and G-43 added.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
