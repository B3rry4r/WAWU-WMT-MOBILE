---
id: MONEY-14
title: Reset the PIN, and approve with fingerprint or face
owner: YOU
area: MONEY
order: 104
priority: launch
repo: wawu-backend
type: money-path
status: review
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

Verifier, 3 Oct 2026 (a session that wrote none of this code). **Verdict: no open defect; status `review`.** Nobody else's reset can be confirmed, the code goes only to the BVN-proved phone, guessing is capped at 25 compared codes a day, and an approval cannot be moved to another amount, recipient, path, query, method, person, challenge or phone. Every refused approval and every reset step leaves the PIN's tries as they were. Three `unclear` findings and four notes follow. None of them lets anyone spend someone else's money.

Checked at backend `wmt/MONEY-14` da76d13 (main 6d48c97, with `wmt/MONEY-13` 35b68af merged in at 1552e8e) and mobile `wmt/MONEY-14` 94c8f56, in fresh detached worktrees. During the run, backend main moved to c1d23b5 (the MONEY-13 merge). Its tree is identical to 35b68af. `git merge-tree c1d23b5 da76d13` is clean and gives da76d13's own tree (827855a), so every result below holds on the new main too. Mobile main moved to a3e072c (MONEY-13 docs only). Evidence is in the verifier session's scratchpad `vm14/` (file names below). The attack spec `vm14-attack.spec.ts` (23 tests, built on the builder's harness, plus a stand-in debit route with a body marked `@RequireApproval()`) is kept there, out of the branch.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Backend: `tsc --noEmit` exit 0; eslint (no fix) exit 0 on all 33 changed `.ts` files; gates 16 fail / 12 warn on 631 files scanned, against main's 16 / 10 on 619. The fail lists are identical, and the only new warnings are `PROVISIONAL(PIN-RESET-LIMITS)` (`pin-reset-config.ts:32`) and `PROVISIONAL(DEVICE-APPROVAL-SECONDS)` (`:50`). `check_baseline.py` passes (108 entries). Mobile `npm run check` exit 0: typecheck, lint, jest 20 suites / 371 tests, gates 0 fail / 0 warn on 96 files scanned, 203 tasks | `tsc.log`, `eslint.log`, `gates-branch.log`, `gates-main.log`, `gates-baseline.log`, `mobile-check-before.log` |
| V2 Contract | passed. Full suite on a fresh migrated and seeded `vm14_full_test`, with my own mock WAWU ID on :4001 (keypair made as `deploy.yml` makes it, `lsof` free first, stopped right after): `npx jest --runInBand --forceExit` gave 128 suites, 3,097 passed, 3 skipped, **0 failed**. The attack spec passed 23/23. Its unexpected formats (R13: a code sent as a JSON number, with a space, or in full-width digits, an upper-case `resetId`, a PIN as a number, an extra `phone` field) are all `400` and use no try of the code, and the right code still works afterwards. `npm run contract:build` on da76d13 reproduces the committed `contract/openapi.json` byte for byte. The mobile copy is identical to it, and `sync_contract.py` regenerates the types with no change | `full-suite.log`, `attack-run3.log`, `attack-evidence.json`, `contract-build.log`, `mobile-sync.log` |
| V3 Regression | passed. `scripts/protected-routes/run.sh --fresh` gave 253/253 (all 244 required) on both da76d13 and main 6d48c97, and the lock files are untouched. CI tripwire: 0 added lines outside the suite's files match. `hub-rate-limits.contract.spec.ts` passed 10/10, and no `@Throttle` was added. The migration only creates tables and indexes (3 tables, 4 indexes) and `migrate deploy` applied it cleanly to a fresh database. `prisma migrate diff` from that database to the schema shows only main's own `DROP INDEX "ContentPiece_specializations_idx"` | `protected-da76d13.log`, `protected-6d48c97.log`, `rate-limits.log` |
| V4 Field trace | passed (server side). `WalletIdentity.verifiedPhone` is written by KYC-01's BVN check, which is refused once a wallet is open (`wallet_already_open`), so the phone cannot change under a wallet holder. It is read only by `PinResetService.start`: R1 shows the text went to it with a different token phone and a `phone` in the body, and the live seam shows the row's `phone` is the proved number. `ApprovalDevice.lastUsedAt` is written by a passed approval and read by `GET /money/device` (live seam). The PIN state after a reset is read by `GET /money/pin` (R12: `triesLeft` 5, `lockedUntil` null). The view types reach the mobile contract and `schema.generated.ts` unchanged. No app screen reads them yet (G-43) | `attack-evidence.json` (R1, R12), `live-seam.json` |
| V6 States | server states passed; app states NOT RUN. Each of these was triggered through its real cause: `409 wallet_not_open` (no wallet, live), `429 reset_codes_exhausted` (sixth text; per phone too), `503 provider_unreachable` both ways (refused: row `failed`, not counted; lost answer: row `unknown`, counted, not resent), `400 reset_code_invalid`, `403 device_approval_refused` (every kind in D1 to D7), `423 pin_locked` for a valid approval, and `403 pin_required` where only the PIN applies. NOT RUN: the app states, because this task builds no screen. The PIN sheet's biometric key is not wired (G-43); unblocked when WALLET-06 and WALLET-02 land with the signing package | `attack-evidence.json` |
| V7 Flow walk | server flow passed; app flow NOT RUN. Lock the PIN with 5 wrong tries, reset with the texted code, then the old PIN is `403` and the new one passes `POST /money/approval/verify`, with the biometric phone turned off (R12). Live, on the built server: sign in, set the PIN, register the phone, get a challenge, approve (200), and the replay is refused. NOT RUN: the app walk, for the same reason as V6 (G-43) | `attack-evidence.json` (R12), `live-seam.json` |
| V8 Money attack | passed for what this task serves. A double tap is one text (12 parallel starts gave one reset and one text). 30 parallel wrong codes: exactly 5 compared. 10 parallel uses of one signed approval: exactly one passes. 5 wrong PINs lock, and a locked PIN also blocks approval. A confirmed reset replayed is refused. Every mutated request is refused. NOT RUN: debit, insufficient funds, webhook and ledger items, because no debit route is served (WALLET-07, WALLET-09, MONEY-17 put `@RequireApproval()` on them) | `attack-evidence.json` (R3, R6, R8, D1, D2) |
| V9 Live seam | passed. The built Hub (`node dist/src/main.js`) ran on :4923 against a stand-in WAWU ID on :4924. A real register and login there gave the token (nothing was minted in the test). The flow: `409 wallet_not_open` before a wallet, PIN set and read back, device registered, challenge, approval 200, replay 403, then `GET /money/device` shows the server's `lastUsedAt`. The one text attempt went through the real Fintava sandbox (dev.fintavapay.com) to the documented example number `+2349036652198`. It was refused `400 "amount must be greater than or equal to 1"` exactly as G-42 records, the reset answered `503 provider_unreachable`, and the row is `failed` and superseded. The key was not in the hub log or the output (0 of 58 windows) | `live-seam.js`, `live-seam.json`, `hub4923.log` |
| V10 Device | NOT RUN. Needs a release build on the owner's Android phone with the app-side key (G-43) and the backend on the droplet (R-24, R-25). Unblocked when WALLET-06 and WALLET-02 land and MONEY-14 is deployed |  |

**Capability checks, as written.**
1. "A user who forgot their PIN can reset it with a code and pay again": passed against the built server, with the code read from the stand-in's text (R12; `pin-reset.contract.spec.ts`). "Pay again" means `POST /money/approval/verify`, the check every debit makes, because no debit is served. A real text end to end is NOT RUN: the sandbox refuses every text (reproduced live above, G-42).
2. "An approval from an unregistered device is refused": passed. All of these are `403 device_approval_refused`: a key never registered, another person's key, another person's challenge, a replaced phone's old key on a new challenge, an old challenge with the new key, any challenge after `DELETE /money/device` (a new challenge is refused too), and registering without the PIN (`403 pin_required`) (D2, D3).
3. "A user whose fingerprint fails sees 'Fingerprint failed. Use your PIN.' and still has all five PIN tries": the server side passed. Refused approvals of every kind leave `triesLeft` where it was (D1, D2, D5, D6, D7). A passed approval does not reset the count (3 stays 3), and an empty `X-Device-Approval` beside a wrong PIN uses no try. The copy is MONEY-02's (`PinSheet.test.tsx:336`, passing in the mobile jest run). Seeing it on a phone is NOT RUN (G-43, V10).

**Attacks run (my own spec, all as the contract says).**
- **Reset.**
  - The code went only to the proved phone, even with a different token phone and a body naming another number (R1).
  - Another person confirming my `resetId` with the right code is refused and uses none of my code's tries (R2).
  - 30 parallel wrong codes: exactly 5 compared, then the right code is dead (R3).
  - Repeated fresh resets: 5 texts, then `429`; at most 25 codes compared in the window (R4).
  - A superseded code is dead even with the right digits (R5), and a confirmed reset replayed is refused (R6).
  - 12 parallel starts with 4 texts already counted: exactly one text; the next is `429` with `retryAfterSeconds` 86,399. A second person whose proved phone is the same number is `429` too (R8).
  - Fintava refusal versus lost answer accounting is as documented (R9).
  - Timing: another person's live `resetId` (median 4.8 ms) and a random uuid (4.8 ms) are indistinguishable, while a wrong code on your own reset is about 73 ms. That one only reveals your own reset, and the answer says the same (R10).
  - The code and the new PIN appear in no log line, answer or column of `TransactionPinReset` or `TransactionPin` (R11).
  - Reset start and wrong codes use no PIN try. A reset clears a lock, the old PIN dies, and the phone is turned off (R12).
- **Approval.**
  - A correct approval on a route with a body passes (D0). Changing any one of amount, recipient, JSON whitespace, query, path case, a trailing slash, method, or the route the signature was made for is refused (D1).
  - Reuse, parallel reuse, expired challenges, cross-person challenges and keys, and replaced or deleted phones are all refused (D2, D3).
  - These keys are `400` and nothing gets registered: P-384, secp256k1, Ed25519, RSA, an off-curve point, a raw point, garbage, standard base64 with padding (D4).
  - These signatures are refused: raw P1363, non-canonical DER, DER with a trailing byte (D5).
  - The header is removed and ignored on `PUT /money/pin`, `POST /money/pin/verify` and `PUT /money/device` (`403 pin_required`). There a wrong PIN beside an approval uses a try exactly as on main. A duplicated or empty header is refused (D6).
  - A body that is not JSON (`text/plain`), and `{}` signed as an empty body, are refused (D8, D9).

**Mutations (14 of my own, none of the builder's 3)**, run against the builder's MONEY-14, gate, PIN and SMS specs (143 tests). The builder's specs killed 11:
- the reset confirmable by anyone (1 failing test)
- the reset keeping the phone (1)
- the daily limit per person only (1)
- no body hash in the signed text (3)
- a locked PIN allowing approval (1)
- approval accepted on every PIN route (3)
- a lost answer not counted (1)
- no method in the signed text (1)
- 6 tries a code (2)
- the reset not clearing the lock (1)
- no advisory lock on start (1)

Three survived:
- **M7**, an unusable `X-Device-Approval` (empty or sent twice) falling back to the PIN. The builder's specs miss it; my D6 kills it (a wrong PIN beside an empty header would use a try).
- **M11**, not checking the challenge's `deviceId` against the phone. This is an equivalent mutant: the signature is still checked with the current phone's key over its current `deviceId`, and registering a phone deletes old challenges.
- **M14**, the gate no longer dropping `X-Device-Approval` when it refuses. No test covers it, but nothing reads the header after a gate refusal, so it is defence in depth.

The other shared-file edits behave as claimed: `wallet-gate.ts` only adds the header name, the two gate specs only add the 7 routes to their inventories with no assertion removed, the `transaction-pin.service.ts` edit only adds `assertNotLocked`, `fintava-stall.spec.ts` adds `sendSms`, and the guard's PIN path is unchanged.

**Secret scan.** The full branch diff and every commit's patch were scanned, backend 6d48c97..da76d13 and mobile 12aa3c9..94c8f56: 0 hits for any of the key's 58 eight-character windows (`keyscan.txt`). The sandbox was called once, to the documented example number, and never live.

**Findings**
- `unclear`: a reset started before a PIN change still works after it (R7: start, `PUT /money/pin` with the current PIN, then the code confirms and overwrites the new PIN, 200). Whoever can read the text could start a new reset anyway, so this opens nothing new. But a person who changes their PIN after seeing an unexpected reset text does not stop the code already in flight (up to 300 s). Superseding open codes on `PUT /money/pin` would close it. Owner or lead to decide.
- `unclear`: the builder's owner question stands. A reset proves the SIM, not the person, so someone holding the unlocked phone, or a swapped SIM with the WAWU ID session, can set a new PIN. Nothing was found that makes this worse than the task file says.
- `unclear`: test gaps in the branch's own specs. Mutants M7 and M14 survive them (above). Neither is a product fault (the code behaves correctly, shown by my D6 and by reading), but nothing in the suite would catch a regression there.
- Note: ECDSA signatures are malleable. The high-s twin of a valid signature is accepted on first use (D5), and the original is then refused because the challenge is spent. Only the key holder can make either, and a challenge works once, so nothing is gained.
- Note: a P-256 key in compressed SPKI form (59 bytes, 79 base64url characters) fails the `{80,200}` pattern. The contract asks for SPKI DER and Android Keystore exports uncompressed keys, so this only matters if WALLET-06 picks a library that compresses.
- Note: when 30 wrong codes race, the requests that lose the race are told `triesLeft: 0` while the code still has tries for an instant (R3). The answer is consistent once the five slots are taken. This is cosmetic.
- Note: a refused text supersedes the code before it, so a person whose second text is refused loses the first code too (they ask again when Resend opens). This is safe, not a defect.

**NOT RUN** (each with what unblocks it):
- A real text end to end: unblocked when one `POST /sms/send` to `+2349036652198` answers 2xx (G-42).
- The app side of biometric approval, V6 and V7 in the app, and V10: unblocked by WALLET-06 and WALLET-02 landing with the signing package (G-43), and for V10 by the backend on the droplet.
- A real debit with `X-Device-Approval`: unblocked when WALLET-07, WALLET-09 or MONEY-17 serves a debit under `@RequireApproval()`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
