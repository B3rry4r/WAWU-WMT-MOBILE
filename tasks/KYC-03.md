---
id: KYC-03
title: Open your wallet: confirm details and address, selfie
owner: YOU
area: KYC
order: 86
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: done
depends_on: [KYC-05, MONEY-03, MONEY-12, MONEY-13, KYC-01, KYC-02, UI-02]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [A5, A6, A7, A16]
---
# KYC-03 · Open your wallet: confirm details and address, selfie

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A5 A6 A7 A16` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for A5, A6 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (R-24).

## Artboards

- **A5 · Confirm your details**: Read-only 'From your BVN' card: Name, Date of birth, Gender; then the user's home address (street address, city or town, state, in A20's field style) and Occupation (BRIEF A5); checkbox 'I agree to the terms and privacy policy'; Continue.
- **A6 · Selfie**: Camera oval: 'Fit your face in the oval. It must match your BVN photo.' Nothing says or suggests a liveness check (BRIEF A6).
- **A7 · Matched**: Success state: 'Matched to your BVN. Opening your account' (spinner while the wallet is provisioned).
- **A16 · Face doesn't match**: Selfie failure: 'We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.' Try again.

## Ruling R-6

This flow is not part of sign-up. It starts the first time someone taps Wallet
or anything that moves money, for every user, new or existing. The design draws
these screens inside sign-up; keep their look, change only where they sit. The
BVN and NIN step is A26 (KYC-05); A3 is sign-up and no longer asks for the BVN. Someone without a Nigerian BVN cannot open a Naira wallet; dollar
and crypto accounts are for them and come after launch, so for now the flow
ends with a clear "not available yet" instead of an error.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava needs the NIN and a full address to open an account, and the canvas draws neither. The NIN is taken on A26 (KYC-05). The address is added to A5 in the canvas's own field style, as BRIEF A5 describes. A6 says nothing about blinking or liveness (KYC-02). A5's name, date of birth and gender come from the BVN check; state and occupation are typed by the user.

## Brief changes (build these, not the canvas)

- **A5**: keep the BVN card exactly as is. Below it, add a full **home address**: street address, city or town, and state (the existing "State you live in" picker becomes the state part of the address). Keep Occupation. Use the field style A20 already draws for an address (Home address, City, State). (Why: Fintava fact: an account cannot open without a full address. The BVN check doesn't return an address, state or occupation, so the person types them.)
- **A6**: drop "Then blink slowly". For example: "Fit your face in the oval. It must match your BVN photo." Nothing on this screen, or on A7 and A16, may say or suggest a liveness check. (Why: Fintava fact: Fintava's API matches the selfie against the BVN photo and has no liveness check, so the app cannot claim one.)

## Capability checks

- [ ] From A26 (KYC-05), a user who taps Continue lands on A5 (this task adds that step).
- [ ] **A5**: a user can review the prefilled details; enter their home address (street, city or town, state) and occupation; tick terms/privacy consent; tap Continue (-> A6).
- [ ] **A6**: a user can fit their face in the oval and take the selfie.
- [ ] **A7**: a user can wait while the account opens (MONEY-12).
- [ ] **A16**: a user can retry.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states A7, A16.

## What the backend serves today (from the analysis)

- **A5**: partial. Missing: No dateOfBirth column in WAWU ID or Hub. Occupation is silently dropped today. No BVN source to prefill from. Consent route exists but is not called by any client (grep '/policies' wawuafrica/src -> none).
- **A6**: missing. Missing: No liveness or face-match capability or provider anywhere; no place to store the result.
- **A7**: missing. Missing: No face-match result; account opening at Fintava does not exist (see A8).
- **A16**: missing. Missing: No face match; no retry/lockout policy; no fallback to manual review is drawn.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A5: 'From your BVN' includes 'State you live in' and 'Occupation' (claim that a BVN record carries these is unverified)
- A6: 'It must match your BVN photo'

## Designer notes (⚠, unresolved)

- None.

## Builder report

Builder, 3 Oct 2026. Mobile `wmt/KYC-03` from main `42309b2`, then main `c733413` (INBOX-08, WALLET-15) merged (BACKEND_GAPS conflict: both sides kept). No backend change. Evidence `$S` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc03/`: shots `$S/shots/<name>-<theme>.png` (390 px at 2x, light and dark), side by sides `$S/side-{A5,A6,A7,A16}-{light,dark}.png` (render left), driver `$S/drive.py`, pass-through `$S/web-server.js`, results `$S/results.jsonl`, request log `$S/calls.jsonl` (key names and lengths only), privacy scan `$S/privacy-scan.txt`, mutants `$S/mutants*.txt`.
- **Files:** `src/features/open-wallet/` new `ConfirmDetailsScreen.tsx` (A5), `SelfieScreen.tsx` (A6, A7, A16, the opening), `StatePicker.tsx`, `details.ts`, `leave.ts`, `api/opening.ts`, `selfie/{types,capture,capture.web}.ts`, 3 test files; changed `OpenWalletScreen.tsx` (a pass goes to A5; "BVN confirmed" now has Back and Continue), `OpenWalletEnd.tsx` (optional bar), `keptCheck.ts` (A5's address kept beside the check, same ticket and forgets), the A26 test for Continue. Routes `src/app/open-wallet-details.tsx`, `open-wallet-selfie.tsx`; `open-wallet.tsx` passes `onContinue`.
- **Check 1 (A26 Continue lands on A5):** jest (`onContinue` on a pass and from the confirmed end) and V9 (`a5`: A26 pass, then A5 pushed in app; Back to A26 shows "BVN confirmed" with Continue, `a26-confirmed-continue-*`).
- **Check 2 (A5):** V9 against the built Hub: the card shows the real check's prefill (stand-in record), "14 Mar 1994", "Female"; street, city or town, state (sheet of the 36 states and the FCT, `a5-state-sheet-*`), occupation, consent; Continue sends `PUT /money/identity/occupation` (54 `WalletIdentity` rows hold it), keeps the address in memory and opens A6; back from A6 the occupation comes back from the server and the address from memory. Missing fields, consent, a refused save, a stale check, no kept check, a BVN without a date of birth (`a5-unusable-*`, before any selfie is charged): jest and shots.
- **Check 3 (A6 take the selfie):** web build: "Take selfie" opens the browser's picker (the test seam: Playwright sets a synthetic 1200x1600 JPEG), re-encoded to 640 px JPEG (9,984 base64 chars) and sent once as `{ image }`. **Today's Hub refuses it: `400` "bvn must be 11 digits" (G-72), shown on A6 (`a6-g72-refused-*`).** Phone build: no camera module (SHARED-CHANGES KYC-03 #1), so A6 says "We can't open your camera" (jest). No word suggests liveness (jest scans every text).
- **Checks 4 and 5 (A7 wait, A16 retry) and the drawn states: NOT RUN against the real Hub** (G-72 blocks both routes). Pictures and flows with the pass-through answering only those two routes with the contract's documented answers, each logged `standin`: `a7`, `a7-opening-wait` then `-then-open` (polls `GET /money/wallet`, real route on the Hub otherwise), `a7-open-failed`, `-retried`, `a7-not-opened`, `a16`, `a16-try-again`, `a16-then-open`, `a16-no-tries-left`, `a6-limit` ("Try again in about 24 hours."), `a6-unreachable`. Jest covers each against the contract. Unblocked when G-72 is served.
- **Check 6 (V5):** for the verifier; not claimed.
- **Check 7 (values):** prefill from the check's answer, occupation from `GET /money/identity`, every refusal sentence the server's (A16's first sentence is its title, the rest the line, as drawn), waits from `retryAfterSeconds`; the state list is the Constitution's (cited in `details.ts`). Gaps: G-72, G-73.
- **Check 8 (V6, by cause), light and dark:** A5 loading (Hub answers held 6 s) `a5-loading`; A5 load error (the identity read's connection dropped), Try again `a5-load-error`, `-retried`; A5 missing fields `a5-missing`; A5 unusable BVN record `a5-unusable`; reload on A5 goes back to A26 `a5-reload-back-to-a26`; A6 loading `a6-loading`; A6 load error and retry `a6-load-error`, `-retried`; offline match "No connection" `a6-offline`; unusable photo (20x20 picked) `a6-unusable-photo`; the real Hub's 400 `a6-g72-refused`; the drawn A7 and A16 states as above.
- **Privacy:** 241 BVNs and the NIN scanned, raw and grouped: 0 hits in a full `k03_test` dump and the Hub, stand-in WAWU ID, Fintava stand-in, pass-through and request logs; 0 address hits; 0 base64 JPEG runs. Browser after every run: only the two session keys, no sessionStorage, IndexedDB, cookie, data-URL image or file input left. After Done the DOM holds no address (leaving dismisses every flow screen; found and fixed when nothing is under the flow). The selfie lives in one local value; a late answer after a session end moves and opens nothing (jest).
- **V9:** Hub `dist` from backend main `1e6b807` (identity and opening unchanged since `fe1ec6c`) on :4941, fresh `k03_test` migrated and seeded; stand-in WAWU ID :4942 (people registered there, signed in on A22, no injected token; pass-through wraps its pair, G-59); Fintava stand-in with `env -i`, BVN route only, 0 selfie or customer calls reached it; web export on :8141, 0 `wawuafrica.com` in the bundle and 0 attempted. 67 `BvnCheckAttempt`, 0 `SelfieMatchAttempt`, 0 openings.
- **Tests and counts:** `npm run check` before (main 42309b2): typecheck and lint clean, 28 suites 485 tests (a first run timed out A26's first test under load, then passed), gates 9 run 123 files 0/0/0, 205 tasks. After (merged): exit 0, 31 suites 534 tests, gates 9 run 137 files 0 fail 0 warn 0 accepted, 205 tasks. My 12 mutants: 10 killed (bvn or nin sent, double tap, A16 Try again with 0 left, late match opens, stale check, unusable capture sent, address after a forget, consent, X on A7); 2 equivalent (A5 continuing when the address keep fails: a forget always unmounts the form; a missing date of birth: the date pattern refuses it too).
- **Filed:** BACKEND_GAPS G-72 (selfie and opening without the BVN and NIN; a BVN without name or date of birth), G-73 (consent recorded nowhere, no policy links). SHARED-CHANGES KYC-03 #1 (`expo-camera`, `expo-image-manipulator`, plugin, permission text), KYC-03 R1 (the two routes under the signed-in guard).
- **Defaults (agent), owner may override:** A26 goes straight to A5 on a pass; a "Take selfie" button (A6 draws none; the oval sits where A16 draws it); A7's spinner in the button row; A7 asks `GET /money/wallet` every 5 s while opening; the X goes back to A5 before the opening is sent and leaves the flow after; the account-open end is "Your wallet is open / You can pay from it now." with Done until KYC-04's A8; labels "Home address", "City or town", "State" (A20), placeholder "Choose"; copy not drawn: the A5 error lines, "We can't open an account from this BVN", the A6 notes ("We couldn't check your selfie", "That photo could not be used", "Take your selfie again", "We can't open your camera"), "You've used today's selfie checks", "We couldn't open your account"; terms and privacy policy are not links (G-73); selfie at 640 px long side.
- **NOT RUN:** checks 4 and 5 and A7/A16 against the real Hub (until G-72 is served); V10 (no device; and the phone build has no camera until SHARED-CHANGES KYC-03 #1 is applied and a development build made); a real selfie match (no sandbox BVN passes, Fintava questions 6 and 11, G-25); sign-out from a button (none on main; jest covers session end).

## Builder round 2

Builder, 4 Oct 2026. Lead ruling (Default (lead), owner may override): close G-72 with a **sealed check handle**, storing nothing new. Backend `wmt/KYC-03` **51c1e10** (the work on main `1e6b807`, e769347 and f474a74, then backend main `9a370c0` merged in: no conflict); mobile `wmt/KYC-03` with mobile main `9a0c1be` merged in (conflicts in SHARED-CHANGES, both sides kept, and the generated PROGRESS and contract files, regenerated). Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc03/`: shots `shots/` (this round, runs 4 to 6), `results.jsonl`, `calls.jsonl`, `privacy-scan-r2.txt`, `b-mutants*.txt`, `mutants-H*.txt`, `b-full.log`, `b-protected.log`, `b-cicheck.log`, `sheet-r2-dark.png`.
- **Protected routes:** `POST /money/identity/bvn`, `/selfie` and `/money/wallet/open` are not in `.pipeline/protected-registry.json` (129 endpoints, none under `money/`) or the lock; lock-diff says "No change". Shapes changed additively only.
- **The key:** HKDF-SHA256 from `IDENTITY_HASH_KEY` with label `wawu/kyc-check-handle/v1` (`IdentityHasher.deriveKey`). Default (agent), owner may override. That key is the one documented for `hub-api.env` (deploy/README) whose absence already turns the BVN check off (503): wherever a handle can be issued, the key exists, and nothing else is needed on the droplet. `ADMIN_JWT_SECRET` is enforced but belongs to admin sign-in; reusing it would tie identity data to an admin rotation. No new env var.
- **Backend:** new `src/money/identity/check-handle.ts` (AES-256-GCM, 12-byte nonce, the label as associated data, `{ sub, bvn, nin, checkId, iat, exp }`, 30 minutes, strict shape). The BVN check answers `checkHandle` (`BvnCheckView`, required). `SelfieMatchDto` and `OpenNairaWalletDto` take `checkHandle` in place of `bvn` and of `bvn`, `nin` (now optional, so old callers still work); both together is 400. `WalletIdentityService.checkedByHandle` opens it and requires the seal, not expired, `sub` the caller, `checkId` a `verified` BvnCheckAttempt of the caller's, and the sealed numbers equal to the caller's current check (`checkedIdentity`). Any failure: `409 bvn_not_checked` "Check your BVN again to continue.", never a 500, never which part. Not a string or over 1,024 characters: one fixed 400 sentence. Never stored, logged or echoed. CONVENTIONS section 8 and deploy/README updated; contract rebuilt (`contract:build`: only `BvnCheckView`, `SelfieMatchDto`, `OpenNairaWalletDto` changed).
- **Backend tests** (`src/money/identity/tests/check-handle.contract.spec.ts`, 18): the round trip (Fintava's selfie and create requests carry the unsealed BVN and NIN); the numbers still work; one handle serves a retried match and opening; refused, with nothing sent to Fintava: a changed byte in nonce, body or tag, expired, another person's, sealed for someone else on the caller's own check, a failed or foreign or unknown `checkId`, an earlier check after another BVN passed, another key, malformed, longer life than a handle has, an extra, missing or mistyped field, `iat` in the future; 400s for a non-string, too long, or both kinds sent; and no handle in any captured log line, any answer but the check's own, or any row. **Mutants:** 10, all killed (3 needed new tests: `sub` not compared, lifetime not bounded, selfie ignoring the sealed BVN).
- **Backend suite, fresh DB the way deploy runs it** (migrate deploy, seed, mock JWKS on :4942, `tsc` clean, `jest --runInBand`). Before the main merge (e769347): 3,318 tests, 3,275 passed, 3 skipped, 40 failed, all in 4 suites that hard-code `http://localhost:4001` (`kyc-submission`, `privacy-settings`, `credits-state`, `account`); `account` honours `WAWU_ID_BASE_URL_TEST` and passed 9 of 9 on :4942. **Finding about :4001:** three other suites (`blocked-account`, `notification`, `saved-item`) start their own mock WAWU ID on :4001 when it is free, and did so in that run for their own duration (I did not start it and nothing of mine listens there). After the merge (51c1e10): 3,406 tests, 3,363 passed, 3 skipped, 40 failed, in those 6 :4001-bound suites; this time another session's process held :4001 (not mine, left alone), so the three self-starting suites got its tokens and 401. The identity, opening, handle, gate and money-contract suites: 14 of 14, 447 tests, on the merged tree. The 6 are NOT RUN here: unblocked by CI, where :4001 is the suite's. **Protected (merged tree):** `run.sh --fresh HEAD` 253 of 253 (244 required); `ci-check.sh` (lock and tripwire) exit 0, "No change". **Gates:** 16 fail, 21 warn, 76 accepted, the same as backend main 9a370c0 (14 warn before main moved); a deferral comment of mine was found and reworded. `contract:build` on the merged tree reproduces the committed contract; it differs from main only in the three schemas. **Key scan:** the Fintava key and private-key or live-key patterns: 0 in both branch diffs and every log.
- **Mobile:** the contract copied from backend `51c1e10` (main's HOME-04 routes kept; only the three schemas differ from mobile main) and types regenerated (SHARED-CHANGES KYC-03 #2, which also covers the shared `checkBvn` now returning the handle, and its test fixture). `api/check.ts` refuses a pass without a handle; `keptCheck.ts` keeps `checkHandle` beside the check (not inside it), under the same ticket, forgotten with it on every forget and session end; `api/opening.ts` sends `{ image, checkHandle }` and the opening with `checkHandle` (no casts); A6 without a kept handle goes back to A26; starting again (`restart`) now forgets the kept check, so a handle the server refuses (`409 bvn_not_checked`, for example after 30 minutes) leads to a new BVN check, not a loop. Tests: 6 new or changed. **Mutants:** H1 to H6 (handle not sent to the match or the opening, restart keeping the stale check, handle not kept, a pass without a handle accepted, A6 going on without one): all killed (H5 needed the new A26 test).
- **V9, against a Hub built from backend e769347 (before the main merge; f474a74 adds docs only, and the merge touches no identity or opening file)** (:4941, fresh `k03_test`, stand-in WAWU ID :4942, people signed in on A22): Fintava stand-in for Fintava's routes only (the backend tests' own shapes; the selfie verdict is KYC-02's stand-in pass, since no sandbox BVN or selfie passes, Fintava questions 6 and 11). The G-72 stand-in in the pass-through is no longer used. **Checks 3, 4 and 5 and A7/A16 now reach the real Hub, light and dark:** the full flow ends open (`a6-a7-real-hub-open`; `GET /money/wallet` then reads `open` with an account); A7 while opening (`a7`, answers held 5 s); a lost create answer, A7 waiting until the Hub's own sweep finds the customer (`a7-opening-wait`, `-then-open`); A16 (`a16`, `-try-again`, `-then-open`); no matches left (`a16-no-tries-left`, `checksLeft` 0 from the Hub); the person's 4th match (`a6-limit`, "Try again in about 24 hours."); the address limit (`a6-address-throttle`, 4 matches in a minute); Fintava down (`a6-unreachable`); create refused by a key (`a7-open-failed`, then `-retried` opens); create refused for its details (`a7-not-opened`, `422 account_not_opened`). Every match body was `{image, checkHandle}` and every opening `{firstName, lastName, dateOfBirth, address, checkHandle}` (`calls.jsonl`, key names only). Rows: 39 `SelfieMatchAttempt` (17 matched, 20 not, 2 unavailable), 13 accounts opened, 4 openings failed as asked.
- **Privacy (round 2):** the BVNs typed in runs 4 to 6 and the NIN: 0 in a full `k03_test` dump and in the Hub, stand-in, mock and pass-through logs; 0 handle-shaped strings in any of them; 0 addresses; 0 base64 JPEG runs. Browser: only the two session keys.
- **Counts (mobile):** `npm run check` exit 0 on the merged branch: 32 suites 608 tests (main brought 71; round 1 had 534 on the old main), gates 9 run 149 files 0 fail 0 warn 0 accepted, lint clean, 205 tasks.
- **Lead decisions applied:** SHARED-CHANGES KYC-03 #1 (camera) and R1 stay open; G-73 as filed. G-72 is served; its part (c) (a BVN record without a readable name or date of birth) stays open.
- **NOT RUN:** the 3 backend suites that hard-code :4001 (above); a real selfie match or opening on the Fintava sandbox (questions 6 and 11, G-25); handle expiry in the browser (30 minutes; proved in the backend spec and by the restart test); V10 and the phone camera (SHARED-CHANGES KYC-03 #1, OPS-10).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier, 4 Oct 2026. Independent session; I wrote none of this code. Mobile `wmt/KYC-03` at 62478c6 (main 9a0c1be in, still current), backend `wmt/KYC-03` at 51c1e10 (main 9a370c0 in, still current), each in a fresh detached worktree (`/home/user/wt/vk03m`, `/home/user/wt/vk03b`). Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk03/`. Every `vk03_*` database (all named `*_test`) was dropped at the end, and every process I started was stopped.

**Verdict: one defect is open (defect 1, below). Status `building`.** The sealed handle held against every attack I made on it, and nothing leaked. The defect is in the app: when the server refuses a handle, the app drops the person back on A26 without saying why.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | **passed**. Mobile `npm run check` exit 0 on the final tree (counts in "Regression" below). Backend `tsc --noEmit` exit 0. ESLint on the 9 changed `.ts` files: 0 problems. Backend gates: 9 run, 675 files scanned, 16 fail, 21 warn, 76 accepted, the same findings as main 9a370c0 (673 files; the only difference is 3 warns in `identity-config.ts` moved down 3 lines); baseline exit 0. Secret scan: every 8-character window of the Fintava key, 0 hits in both diffs (backend 56 KB, mobile 197 KB); 0 private-key or live-key patterns | `$V/m-check-final.log`, `b-tsc.log`, `b-eslint-changed.log` (empty), `b-gates.txt`, `b-gates-main.txt`, `b-baseline.txt` |
| V4 Field trace | **passed**. Name, date of birth and gender: Fintava's BVN record, then the check's prefill, then A5's card (memory only), then the opening body. Occupation: A5, then `PUT /money/identity/occupation`, then `WalletIdentity.occupation` (21 rows "Photographer"), then read back on A5 after A6's X. Address: A5, then memory, then the opening's `address`, then Fintava's create body (key seen in the stand-in log). Handle: the check's answer, then memory, then the selfie and opening bodies, then unsealed into Fintava's `bvn` and `nin` | `results.jsonl` (`back-forth`), `calls.jsonl`, `fintava.log` (key names, BVN last 4 only) |
| V5 Picture | **passed, with cosmetic differences** (see unclear 3). A5 light and dark: the BVN card matches the canvas row for row, including the hairline under Gender. Below it are Home address, City or town and State in A20's style, then Occupation and consent (BRIEF A5 applied). A6: "Fit your face in the oval" and "It must match your BVN photo.", with no blink and no liveness wording on A6, A7 or A16 (BRIEF A6 applied; a grep of `src/features/open-wallet` finds none). A7: green ring, "Matched to your BVN", "Opening your account". A16: red ring, the server's two sentences, Try again. The oval holds no drawn avatar, because on web that is where the camera goes. The button row (Take selfie, A7's spinner) is the builder's recorded default. The oval sits about 24 px higher than the canvas because the web build draws no status bar | `side-A5-{light,dark}.png`, `side-A6-*`, `side-A7-*`, `side-A16-*`, `crop-A5-card-light.png`, `design/` |
| V6 States | **failed** (defect 1). Each state below was entered by its real cause, light and dark. Passed: A5 loading (Hub held 6 s); A6 loading; Hub unreachable during the match ("No connection"); Fintava down ("We couldn't check your selfie", 503); A16; A16 with no tries left (Done, no Try again); the person's 4th match ("You've used today's selfie checks", "Try again in about 24 hours."); the address throttle ("Too many tries", "Try again in a minute."); the opening refused by Fintava (`422`, "We couldn't open your account"); A7 waiting, then open; a reload on A6 goes back to A26. Failed: a handle the server refuses has no visible state | `shots/`, `sheet-states-dark.png`, `results.jsonl` |
| V7 Flow walk | **passed** for a new account without a wallet, cold start: sign-in, A26, A5, A6, A7, open. Resume from a reload on A6 goes to A26. Leaving dismisses every flow screen: after Done at the open end, Done on A16 with no tries left, and Back from A26's "BVN confirmed", the DOM holds 0 `open-wallet*` test ids and no typed address, at `/` | `results.jsonl` (`after_done_flow_ids`, `after_leave_flow_ids`) |
| V9 Live seam | **passed**. Hub `dist` built from 51c1e10 on :4943, fresh `vk03_v9_test`. Mock WAWU ID on :4944: people registered there and signed in through the app's own sign-in screen, with no injected token. My own Fintava stand-in (`fintava-standin.js`, made-up numbers, Fintava's documented shapes) was started with `env -i`. Web export on :8143 (pass-through `web-server.js`, key names only). 21 browser runs (the first `leave-a16` dark hit my own harness's address throttle and was rerun): the full flow ends `open`, and `GET /money/wallet` then reads `open` with an account. Every match body was `{checkHandle, image}` (39) and every opening `{address, checkHandle, dateOfBirth, firstName, lastName}` (8). 0 requests to `wawuafrica.com` or `fintavapay.com`, and 0 console errors. Rows: 39 verified checks, 12 matched, 17 not matched, 2 unavailable, 8 wallets open, 2 openings failed | `results.jsonl`, `calls.jsonl`, `drive.py`, `hub.log` |
| V10 Device | **NOT RUN**. No Android phone in this session, and the phone build has no camera until SHARED-CHANGES KYC-03 #1 (`expo-camera`, `expo-image-manipulator`) is applied and a development build is made (OPS-10 for the droplet) | none |
| Mutations | **passed**: 14 of my own, every file restored and sha1-checked. Backend 8: 7 killed (expiry, `outcome: 'verified'`, both forms, lifetime over 30 min, fixed nonce, `iat` in the future, extra field). **1 survived: BM3**, the handle path comparing only the sealed BVN and not the NIN (unclear 1). Mobile 6: 5 killed (forget leaving the handle readable, the address kept under a fresh ticket, the match without the handle, leaving dismissing only the top screen, A6 not comparing the owner). 1 equivalent: MM1, A7's late opening answer not checked against the ticket. Every way a ticket goes void also unmounts A6, so the late `setPhase` does nothing | `b-mutants.txt`, `b-mutate.py`, `m-mutants.txt`, `m-mutate.py` |

### The sealed check handle, attacked (`attack.js`, `attack-31001.jsonl`: 71 cases, live Hub)

- **Shape.** Unsealed with the derived key, a handle holds exactly `{bvn, checkId, exp, iat, nin, sub}`. `exp - iat` is 1800, `sub` is the caller, and `checkId` is that check's `verified` BvnCheckAttempt. The handle is `v1.` plus base64url of nonce, ciphertext and tag. Nothing outside the seal is derived from the numbers, and the BVN check's answer holds neither number in full (last 4 only). 11 handles had 11 distinct nonces, and two checks by the same person gave two different handles.
- **38 refusals, each exactly `409 bvn_not_checked` "Check your BVN again to continue."**, none echoing a number or the handle, and none reaching Fintava (the stand-in counted 1 selfie call across all of them, which was the legitimate one):
  - tampering: a changed byte in the nonce, the ciphertext or the tag;
  - truncation: the last character dropped; cut to 40 characters; `v1.` alone; the empty string;
  - format: `V1.` and `v2.` prefixes; `==` padding; the `+/` alphabet; a leading space; a trailing newline; 1,024 characters of junk;
  - another person: B replaying A's handle at the match and at the opening;
  - wrong key: sealed under another IDENTITY_HASH_KEY, under the raw key without HKDF, under another HKDF label, and without the AAD;
  - forged with the real key (an insider's handle): expired 1 s ago; expiring exactly now; a 30 min 1 s life; `iat` 2 minutes ahead; `sub` swapped either way; A's numbers with B's `checkId`; an unknown `checkId`; an extra field; a missing `nin`; numbers typed as JSON numbers; a duplicated `sub` key, both orders; B's numbers sealed for A; the right BVN with a wrong NIN;
  - a failed check's `checkId`;
  - an old handle after a newer check (same BVN, new NIN) passed. The newer handle then served.
- **A failed check answers no handle** (`422 bvn_not_confirmed`).
- **400 with the one fixed sentence**, "Your BVN check could not be read. Check your BVN again to continue.", for a handle that is a number, an array, an object, `null`, or 1,025 characters.
- **400 for both forms or neither:**
  - selfie: handle and `bvn`; handle and `nin`; neither;
  - opening: handle, `bvn` and `nin`; handle and `nin`; neither.
  - None echoed a number.
- **Body over 100 KB:** a 100,000-character handle is `500` "Something went wrong" (unclear 2). It reveals nothing.
- **Encoding.** A non-canonical base64url spelling of a real handle (spare low bits set in the last character) decodes to the same bytes and is accepted. This is harmless: the bytes are authenticated, and no handle is stored, deduplicated or compared as text.
- **Timing.** Median refusal times are 5.4 ms for a malformed handle, 6.0 ms for another person's, and 7.7 ms for a wrong check or numbers. So the stage that failed is visible. The numbers themselves are not: only the handle's owner can reach the stage that compares them, and the comparison is a keyed hash read from the row.
- **Replay.** One handle serves a retried match and a retried opening within its life. After a match, a further match is `409 selfie_already_matched` and is not sent. A second opening returns the same wallet, with 1 Fintava create in total.
- **Key separation is sound.** HKDF-Extract with an empty salt keys HMAC with zeros and takes IDENTITY_HASH_KEY as input, and Expand uses the label. The BVN and NIN hashes use IDENTITY_HASH_KEY directly as the HMAC key, so neither use can produce the other's outputs. A handle forged with the raw key or with another label is refused.
- **IDENTITY_HASH_KEY rotated or missing** (`keyrot.js`, `keyrot.log`; the Hub was restarted each time):
  - rotated: the same handle is `409` at the match and the opening. `deploy/README.md` says so: "Changing IDENTITY_HASH_KEY voids every handle out".
  - unset: the check, the match and the opening are all `503 provider_unreachable` before any handle is read, and the Hub logs one "not set" warning.
  - restored: the handle works again within its 30 minutes.
- **Malformed JSON** carrying a handle, or a BVN on KYC-01's route, is `400` with the parser's position only. Nothing sent is echoed.
- **Protected routes.** `.pipeline/protected-registry.json` has no `money/` route. `ci-check.sh 9a370c0 51c1e10 0`: "No change: the branch is checked against exactly the lock on the base", 253 of 253 tests, 244 required, exit 0.
- **The old number bodies, judged: safe to keep for now.** `{bvn, image}` and `{bvn, nin, ...}` still give 200, and a wrong BVN gives `409` "Confirm your BVN first.". They add no exposure on the server: they need the caller's own passed check, compared as a keyed hash, and store nothing. The old exposure was the phone keeping the numbers after A26, and the app no longer sends them (0 of 47 match and opening bodies). Nothing schedules their removal (unclear 4).

### Privacy (`privacy-scan.py`, `privacy-scan.txt`)

- **Scanned:** 176 BVN and NIN values (every one typed in the browser runs, the attack run and the key test), raw and grouped 4-4-3, and the 12 handles the attack run captured.
- **Hits: 0.** No number, handle, handle-shaped string (`v1.` plus 100 or more characters), base64 JPEG run or typed address appeared in a full dump of `vk03_v9_test` (245 KB), or in the Hub, mock, Fintava stand-in, pass-through, request or attack logs.
- **The one address hit** is my own `results.jsonl`, where the driver recorded the street it read back from A5's field.
- **Positive control:** the attack run's numbers file held 30 of them. It was deleted after the scan.
- **Browser, after every one of the 21 runs:** localStorage held only `wawu.session.access` and `.refresh`. Session storage, IndexedDB and cookies were empty, there were no `data:` images, and no file input was left behind.
- **Mobile code:** no `console`, SecureStore, AsyncStorage or web storage call anywhere under `src/features/open-wallet`.

### KYC-05's switch scenarios through A5, A6 and A7

Probe `zz-vk03-probe.test.tsx` ran in place in the mobile worktree, 9 of 9 passing, and was then removed (`probe.log`). Each case runs twice: once with A replaced by B through a refresh that answers B's token, and once through a sign-in as B (status `signedIn` throughout). The results:

- **P1, A5 mid-flow:** B sees no part of A's name, typed street or handle. A5 restarts, and A has no check or handle kept.
- **P2, A5's save answers late:** Continue is not called, and no address is kept for A or B.
- **P3, A6's match answers late:** no opening is sent and no A7 is shown.
- **P4, A7's opening answers late:** B never sees "Your wallet is open". No `/money/` request goes out under B's token. A's opening body was exactly `{firstName, lastName, dateOfBirth, address, checkHandle}`.
- **P5:** nothing but the session keys reached secure storage.

### Regression

- **Backend full suite, as deploy runs it** (`fullsuite.sh`):
  - setup: fresh `vk03_full_test`, `migrate deploy`, seed, then `jest --runInBand --forceExit --no-cache`;
  - mock WAWU ID on :4001: started by me once `lsof` showed the port free (pid 7544, not mine, held it earlier and I waited), then stopped by me;
  - result: **142 of 142 suites, 3,403 passed, 3 skipped, 0 failed.**
  - The :4001-bound suites the builder could not run all pass: `kyc-submission` 22, `privacy-settings` 9, `credits-state` 4, `account` 5, `blocked-account` 9, `notification` 11, `saved-item` 7.
  - Evidence: `b-full.log`, `b-full.json`. My first attempt died with ENOSPC (the machine's disk was full of other sessions' files) and is void.
- **Handle spec:** 18 of 18 (`b-handle-spec.log`).
- **Protected suite:** `run.sh --fresh HEAD` gave 253 of 253, all 244 required (`b-protected.log`).
- **Contract:** `contract:build` reproduces the committed `contract/openapi.json` byte for byte, and the mobile `contract/openapi.json` equals it.
- **Mobile `npm run check`:**
  - First run, while my backend lint ran alongside on a 4-core machine at load 8: A26's first test (KYC-05's, in a file this task edits) timed out at 20 s, giving 607 of 608 (`m-check.log`).
  - Same file alone: 106 of 106.
  - Final run after this report: exit 0, 32 of 32 suites, 608 of 608 tests, gates 9 run on 149 files scanned with 0 fail, 0 warn, 0 accepted, 205 tasks (`m-check-final.log`).
  - The builder saw the same timeout once (unclear 5).

### Findings

**Defect 1 (V6): when the server refuses the handle, the app sends the person back to A26 with nothing on screen to say why.** The trigger is any `409 bvn_not_checked`: the 30 minutes ran out, the key changed, or another check passed elsewhere. The refusal can come from the match (A6) or from the opening (A7, including Try again after "We couldn't open your account"). In each case `SelfieScreen` calls `onRestart`, which forgets the kept check and dismisses to A26. The person then sees an empty BVN and NIN form, and nothing says why. The server's sentence, "Check your BVN again to continue.", is dropped, and the home address typed on A5 is gone too. Starting again costs a charged BVN check and, if a selfie had matched, a charged selfie (3 of each a day).

- **Reproduce:**
  1. `RUN=2 python3 drive.py dark expired`: sign in, pass A26, fill A5, open A6.
  2. Restart the Hub with another IDENTITY_HASH_KEY. Its answer is identical to an expired handle's: the attack run's "expired" and "another key" cases give the same `409` body.
  3. Tap Take selfie.
- **Result:** the URL is `/open-wallet`, the BVN and NIN fields are empty, the screen text is A26's own form text, and no message appears (`shots/a6-handle-refused-goes-to-dark.png`, `results.jsonl` scenario `expired`).
- **Expected:** the person is told why they are back at A26. For example, A26 shows the server's sentence as its banner on arrival.

**Unclear 1: test gap (BM3).** If the handle path compared only the sealed BVN, all 18 handle tests would still pass. The product is right: the live attack "old handle after a newer check (same BVN, new NIN)" is refused. But no test pins it, so a later edit could let an opening send Fintava a NIN the person's current check no longer holds. The builder can add one test for this case.

**Unclear 2: a body over 100 KB answers `500`, not `413`.** This applies to every route, including KYC-01's `PUT /money/identity/occupation` with a 150,000-character body, so it predates this task (body-parser's "request entity too large" reaches `AllExceptionsFilter` as an unknown error). It leaks nothing, but the handle path's "never a 500" holds only up to the body limit. Owner of `src/common` to decide.

**Unclear 3: cosmetic V5 differences.**
- A16's line wraps onto two lines. The server's sentence ends with "cap." (the canvas has no full stop), and the words are inset by the gutter.
- On the always-dark camera page, the X's round background shows near-black in dark mode and is invisible in light mode. The canvas draws the same faint circle in both.

**Unclear 4: nothing removes the number bodies.** WORKFLOW section 6 needs a `removal` task once the logs show no calls for two weeks. No task or BACKEND_GAPS row names one for `SelfieMatchDto.bvn` and `OpenNairaWalletDto.bvn`/`nin`.

**Unclear 5: A26's first test is timing-sensitive under load.** It timed out at 20 s once in my run and once in the builder's, and passes alone. WORKFLOW section 10 says a flaky suite is made deterministic.

**Unclear 6: a refused opening (`422 account_not_opened`) offers only Done.** It shows the server's "We could not open your account with these details. Check them and try again." Done leaves the flow and forgets the address. Coming back (`reenter-after-422`) costs a second charged BVN check and a second charged selfie: the run saw 2 checks, 2 matches and 2 openings. The owner should say whether A7's refusal goes back to A5 to correct the address instead.

**Bookkeeping:** SHARED-CHANGES `KYC-03 #2` says `open`, but its change (contract, generated types, `checkBvn`) is already on this branch. KYC-01 and KYC-02's rows say "Done in ...".

**Capability checks:**
- **Check 1** (A26's Continue lands on A5): passed (V9, every run).
- **Check 2** (A5): passed (V9).
- **Check 3** (A6, take the selfie): passed on the web build. NOT RUN on a phone (V10).
- **Check 4** (A7 waits): passed (V9, Hub held 5 s, then open).
- **Check 5** (A16 retry): passed (V9).
- **Check 6** (V5): passed, with the cosmetic notes in unclear 3.
- **Check 7** (values from the API or the user): passed. The server's sentences and `retryAfterSeconds` are shown as sent, and the state list is the Constitution's.
- **Check 8** (V6): failed (defect 1).

**NOT RUN:**
- V10: no Android phone in this session, and the camera stays off until SHARED-CHANGES KYC-03 #1 is applied and a development build is made.
- A real Fintava sandbox selfie and opening: no sandbox BVN passes (Fintava questions 6 and 11, G-25).
- A handle's real 30 minutes in the browser: the equivalent refusal was driven by changing the key, and the backend expiry cases were run with forged `exp`.

## Builder round 3

Builder, 4 Oct 2026. Mobile `wmt/KYC-03` (0c14b21, then the fix below); backend `wmt/KYC-03` **442bf98** (one test added, pushed). Neither main moved (mobile `9a0c1be`, backend `9a370c0`), so nothing was merged. Evidence in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc03/r3/`: `shots/`, `results.jsonl`, `calls.jsonl`, `drive.py` (the verifier's driver with my ports and four new scenarios), `sheet-r3.png`.

- **Defect 1 (V6), fixed as ruled (Lead ruling, owner may override).** A `409 bvn_not_checked` at A5 (saving the occupation, or a newer check seen on load), at A6 (the match) or at A7 (the first opening and Try again) now goes back to A26 with the server's sentence. A26 shows it in a warning banner titled "We need a new BVN check", followed by "Your home address and occupation are kept." when they are. The store (`keptCheck.ts`) has a new `expireKeptCheck(notice)` for this path. It forgets only the check and its handle and voids every ticket out. A5's address and occupation stay in memory for the same account under the same rules: the session end, another account, and leaving the flow (A26 closing) still forget everything, and nothing goes to storage. When a new check passes for the same account, they carry over and A5 comes back filled in. The consent box is ticked again by the person. The plain words that a new BVN check cannot be avoided are the banner's title and the server's sentence; no em-dash.
- **A defect of my own, found by the browser run and fixed.** In the first browser run the banner never appeared. A6 is still mounted until it is dismissed, so it saw nothing kept and fired its own restart without a sentence, and that overwrote the notice. The jest tests had used a mock restart and could not see it. Fix: a restart without a sentence keeps the one already there. Test: A6 with the route's real restart (`expireKeptCheck`) still leaves the sentence for A26. The mutant that undoes the fix is killed.
- **Item 6 (`422 account_not_opened`).** A7's refusal now offers **Check my details** (back to A5) and **Done** (leave). The kept check, its handle and the server's selfie match are all untouched, so after correcting A5 and pressing Continue, A6 goes straight to the opening. A6's selfie read is no longer served from an earlier visit (`gcTime: 0`): a stale "not matched" would have offered a second selfie.
  - **No second selfie is charged.** Browser, light and dark: 1 BVN check, 1 match and 2 openings, then the account opens with the corrected street (`a7-not-opened-check-my-details-*`, `a5-after-check-my-details-*`, `a7-opened-after-check-my-details-*`).
  - If the handle has expired by then, the opening answers 409 and the defect-1 path applies. That path needs a new BVN check and a new selfie, and both are charged.
  - `identity_has_wallet` and `phone_held_by_other_identity` keep Done only.
  - `OpenWalletEnd` gained an optional second button (`secondaryLabel`, `onSecondary`), inside this feature.
- **Test gap (BM3), closed on the backend (442bf98).** New test: "a handle from an earlier check is refused once a check of the same BVN with another NIN has passed". It kills the mutant that compares only the BVN on the handle path.
- **Bookkeeping.**
  - SHARED-CHANGES KYC-03 #2 is marked applied on the branch (9e5d7bc, contract re-copied in 62478c6).
  - BACKEND_GAPS **G-98** is filed (owner: lead): remove the number-based bodies on the selfie match and the opening once every build sends the handle, that is after OPS-10's tester build is the only build.
  - The 500 on bodies over 100 KB is left as G-49.
- **Cosmetic V5, not changed.**
  - A16's line: narrowing the inset from the gutter to `space.sm` still wrapped "cap." at 390 px (`a16-*`), because the server's sentence is longer than the canvas's line. I reverted it. A one-line A16 needs the backend's sentence without its last word or full stop, or a smaller type size than the canvas.
  - The X's circle on the dark camera page comes from the shared `IconButton` (`surfaceScrim`, fenced). A fixed camera tone would need a prop there (a SHARED-CHANGES row). Not filed: cosmetic only.
- **Tests (jest).** All cases below pass, and 13 mutants are all killed (no carry-over; a sentence dropped at A6 or A7; A5 keeping nothing on 409; the restart forgetting everything; no banner; A26 forgetting on mount; the store's tickets left live; the kept occupation ignored or not kept; the stale restart silent; Check my details never offered; the sentence overwritten).
  - Every refused handle (A6, A7, A7's Try again, A5's save and A5's newer check) calls the restart with the server's sentence.
  - A26 shows the banner, then loses it after a new pass while keeping the address and occupation.
  - A5 comes back filled in after a refused handle and a new pass.
  - The store keeps the address through an expiry, voids old tickets, and forgets everything at the session end and on leaving.
  - Check my details opens again with no second selfie, including on the same query cache.
- **Checks.**
  - `npm run check`: exit 0, 32 suites and 620 tests; gates 9 run, 149 files, 0 fail, 0 warn, 0 accepted; lint clean; 205 tasks.
  - Backend at 442bf98 on a freshly migrated and seeded `k03_contract_test`, with the stand-in WAWU ID on :4942: identity, opening, money and gate specs, 14 suites, 448 tests, all passed.
  - A5's first test timed out once under a full parallel run and passed in the next three runs, the same pattern as the verifier's unclear 5 for A26.
- **V9, the changed paths, light and dark, all `ok`.**
  - Setup:
    - a Hub built from backend 442bf98 on :4941 with a fresh `k03_v9r3_test` (migrated, seeded);
    - the stand-in WAWU ID on :4942, and people signed in on A22;
    - the verifier's Fintava stand-in for Fintava's routes only;
    - the web export of this branch on :8141;
    - 0 `wawuafrica.com` in the bundle and 0 attempted;
    - browser storage holds only the two session keys.
  - The refused handle is produced the verifier's way: the Hub is restarted with another `IDENTITY_HASH_KEY`, which gives the same 409 as an expired handle.
  - Scenarios:
    - `expired`: A6 (the verifier's reproduction, `RUN=3 python3 drive.py dark expired`).
    - `expired-retry`: A7's Try again, after a Fintava 401 made the first opening fail.
    - `expired-a7`: A7's first opening. Only this scenario's match was answered by the pass-through's G-72 stand-in (logged as `standin`, 2 calls), because the real match would meet the rotated key first. The opening's 409 is the real Hub's.
    - `check-details`.
    - `a16`.
  - In each refused-handle scenario A26 shows the banner (`a6-handle-refused-a26-banner-*`, `a7-retry-handle-refused-a26-banner-*`, `a7-handle-refused-a26-banner-*`). After the key is restored and a new check passes, A5 shows "9 Verifier Crescent, Surulere", Lagos, Lagos and Photographer (`a5-prefilled-after-new-check-*`).
  - No selfie or opening body carried a BVN or NIN, only `checkHandle`.
- **NOT RUN:**
  - V10 and the phone camera (SHARED-CHANGES KYC-03 #1, OPS-10).
  - A real Fintava sandbox selfie or opening (questions 6 and 11, G-25).
  - A handle's real 30 minutes in the browser (driven by a key change, as the verifier did).
  - The full backend suite this round: only the spec tests changed since the verifier's 142/142 run.

## Verifier report, round 3

Verifier, 4 Oct 2026. Narrow round on mobile `wmt/KYC-03` at e698d94 and backend `wmt/KYC-03` at 442bf98, each in a fresh detached worktree (`/home/user/wt/vk03m3`, `/home/user/wt/vk03b3`). Evidence `$V3` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk03/r3/`. Every `vk03r3_*` database (all `*_test`) was dropped at the end, and every process I started was stopped.

**Both mains moved during this round.** Mobile main is now f8130cd (ME-06) and backend main is now e6bd701 (HOME-05), so the branch heads were verified as given, without them.
- A trial merge (`git merge-tree`) of backend e6bd701 into 442bf98 is clean.
- Mobile f8130cd into e698d94 conflicts in `BACKEND_GAPS.md` and `SHARED-CHANGES.md` (rows added at the same place: this branch's G-98, ME-06's G-110 to G-113 and ME-06 #1 to #5) and the generated `docs/PROGRESS.md`. Those are bookkeeping conflicts only: no file under `src/` or `contract/` overlaps.

**Verdict: defect 1 is closed, item 6 works, and BM3 is now killed. No defect is open. Status `review`.**

### 1. Defect 1: a refused handle, in the browser

Setup:
- a Hub built from 442bf98 on :4943 with a fresh `vk03r3_v9_test`;
- the mock WAWU ID on :4944, with sign-in on the app's own screen;
- my Fintava stand-in;
- the web export of e698d94 behind my pass-through on :8143. Round 3 adds `/__holdopen` and `/__release`, which hold an opening before it is forwarded;
- driver `drive3.py`.

Each refusal is the real Hub's `409 bvn_not_checked`. It is produced by restarting the Hub with another IDENTITY_HASH_KEY, which gives the same answer as an expired handle, or for A5 by clearing the person's `bvnVerifiedAt`.

**18 of 18 scenarios pass, light and dark** (`results.jsonl`, `shots/r3-*`, `sheet-r3-verifier.png`):

| Scenario | Where the refusal lands | A26 shows | After a new pass |
|---|---|---|---|
| `expired-a6` | the match | "We need a new BVN check" with "Check your BVN again to continue. Your home address and occupation are kept.", BVN and NIN empty | A5 holds "9 Verifier Crescent, Surulere", Lagos, Lagos, Photographer, with consent unticked (A5's own error line showed it). The account then opens |
| `refused-a5` | A5's occupation save | the same title with the save's own sentence, "Confirm your BVN first. Your home address and occupation are kept." | A5 filled in, then open |
| `expired-a7` | the first opening (held at the pass-through while the key changed; 1 released) | the banner | A5 filled in |
| `expired-a7-retry` | A7's Try again, after a Fintava 401 | the banner | A5 filled in |
| `check-details-expired` | the opening sent again after "Check my details" | the banner | A5 holds the *corrected* street |
| `two-refusals` | the match, twice, with a new pass between | the banner both times | filled in both times, then open |
| `leave-come-back` | the match, then Back from A26 | the banner, then on leaving 0 flow test ids and no typed address in the DOM, at `/` | coming back: no banner and an empty street. The occupation shown is the server's saved one, as before round 3 |
| `reload-with-notice` | the match, then a reload | the banner, then after the reload no banner | an empty street |

- Every match body was `{checkHandle, image}` and every opening `{address, checkHandle, dateOfBirth, firstName, lastName}`.
- After all 22 runs, browser storage held only `wawu.session.access` and `.refresh`. Session storage, IndexedDB and cookies were empty, with no `data:` images and no file input left behind.
- 0 requests to blocked hosts, 0 console errors.
- My first `check-details` and `check-details-expired` runs in each theme (4 runs) failed in my own harness: it ticked a box that was already ticked (unclear R3-1). They were rerun as `RUN=2` and pass.

### 2. Breaking `expireKeptCheck`

Probe `zz-vk03r3-probe.test.tsx` ran in place and was then removed. It passed 11 of 11 (`probe.log`). The route's restart was emulated exactly as `leave.ts` does it, with `expireKeptCheck(notice ?? null)`.

- **Q1, A to B while A26 shows A's notice**, both through a refresh that answers B and through a sign-in as B:
  - no banner appears, and no part of A's sentence, street, city, occupation, name or handle is on screen;
  - `isKeptFor`, `readAddress` and `readOccupation` are empty for A and for B;
  - B's own pass then carries nothing of A.
- **Q2, sign-out while the notice shows:** everything is forgotten. Signing in again as A shows no banner and keeps no address. There is no sign-out control in this build, so this case was run in jest only, with the real session module.
- **Q3, leaving with the notice shown, then coming back:** nothing kept, no banner.
- **Q4, two refusals in a row through the real A6:**
  - The first 409 restarts with its sentence, then A6 (now holding nothing) restarts without words, and the first sentence survives.
  - After a new pass, the second 409's sentence *replaces* the first.
  - The address and occupation wait through both.
  - The match bodies carried the first handle, then the second.
- **Q5, late answers after an expiry:**
  - a: a match answering 200 after an expiry sends no opening, so never one with a null handle, and shows no A7.
  - b: A5's save answering 200 after an expiry calls no Continue and keeps no address.
  - c: A5's save answering 409 after an expiry does not restart a second time with its own words. The first sentence stays.
- **Q6, the store:** a pass for B after A's expiry carries none of A's address or occupation.
- **Q7:** across every probe, only `wawu.session.*` keys reached secure storage.
- **Q5d (recorded, not a defect):** a stale restart without words that lands while a new A26 check is in flight voids that check's ticket. The charged pass is then dropped silently and the form stays. Round 2's `forgetKeptCheck` did the same. Such a restart comes only from A5 or A6 in the moment before `dismissTo` unmounts them, which is before a person could type two 11-digit numbers, so I found no way to reach it.

### 3. Item 6: "Check my details" after `422 account_not_opened`

- A7 shows "Check my details" with Done under it, in light and dark.
- **The happy path, `check-details`:**
  - "Check my details" goes back to A5, which still holds the address, occupation and tick.
  - I changed the street to "11 Corrected Road, Yaba" and pressed Continue. A6 went straight to the opening, and the account opened.
  - Requests: 1 BVN check, **1 selfie match** and 2 openings. The second opening's address was "11 Corrected Road, Yaba, Lagos, Lagos".
- **With the handle expired, `check-details-expired`:** the second opening's 409 takes the defect-1 path. After a new pass, A5 holds the corrected street.
- `identity_has_wallet` and `phone_held_by_other_identity` keep Done only. I read this in the code; neither was driven live.

### 4. BM3

My BVN-only mutant (the handle path compares the sealed BVN, not the NIN) is now **killed**: 1 failed, 18 passed, 19 total. The failing test is the new "a handle from an earlier check is refused once a check of the same BVN with another NIN has passed". Evidence: `b-mutants3.txt`, file restored and sha1-checked.

### 5. Mutants of my own on the round-3 paths: 5 of 5 killed

Each was run against the probe and the four open-wallet test files, and every file was restored and sha1-checked (`m-mutants3.txt`).

| Mutant | Tests |
|---|---|
| RM1 `expireKeptCheck` leaves the tickets live (no `era` bump) | 2 failed of 109 |
| RM2 A6's selfie read served from an earlier visit (`gcTime: 0` removed) | 3 failed |
| RM3 A5's 409 on save does not keep what was typed | 4 failed |
| RM4 the first refusal sentence sticks (`notice ?? kept.notice` swapped) | 3 failed |
| RM5 `keepCheck` carries over without comparing the owner | 4 failed |

### 6. Regression

- **Mobile `npm run check`:** exit 0, 32 of 32 suites, 620 of 620 tests, gates 9 run on 149 files with 0 fail, 0 warn and 0 accepted, 205 tasks (`m-check.log`). The A26 or A5 cold-start timeout did not recur in this run.
- **Backend `src/money` and `src/fintava` specs** (identity, opening, gate, ledger, pin and the Fintava client): 40 of 40 suites and 1,505 tests, on a fresh `vk03r3_spec_test` (`b-money-specs.log`).
- **Backend full suite, as deploy runs it:** fresh `vk03r3_full_test`, migrated and seeded, then `jest --runInBand --forceExit --no-cache`. My mock WAWU ID ran on :4001, started only once `lsof` showed the port free (two other sessions held it first) and stopped afterwards. **142 of 142 suites: 3,404 passed, 3 skipped, 0 failed** (`b-full.log`, `b-full.json`).
- **Protected:** `run.sh --fresh HEAD` gave 253 of 253, all 244 required (`b-protected.log`). `ci-check.sh 9a370c0 442bf98 0` reports "No change: the branch is checked against exactly the lock on the base", 253 of 253 (`b-cicheck.log`).
- **Backend gates:** 9 run on 675 files, 16 fail, 21 warn, 76 accepted, the same as main; baseline exit 0 (`b-gates.txt`).
- **Typecheck and lint:** `tsc --noEmit` exit 0, and ESLint on the one changed spec found 0 problems.
- **Contract:** `contract:build` leaves the tree clean, and the mobile `contract/openapi.json` equals the backend's.
- **Key scan:** every 8-character window of the Fintava key, and private or live key patterns, 0 hits in both diffs from their mains (backend 57 KB, mobile 251 KB). The round-3 mobile diff adds no em-dash.
- **Privacy:** 72 BVN and NIN values typed this round, raw and grouped 4-4-3, gave 0 hits in a full dump of `vk03r3_v9_test` (238 KB) and in the Hub, mock, stand-in, pass-through and request logs. There were no handle-shaped strings, no base64 JPEG runs and no typed address in the dump or the server logs (`privacy-scan.txt`). The only address hits are my own `results.jsonl`, which records what the driver read back from A5.

### Findings

**No defect is open.**

**Unclear R3-1: on web, A5's consent box does not say whether it is ticked.**
- **Cause:** react-native-web 0.21.3 no longer reads `accessibilityState`, and the box sets only that (`ConfirmDetailsScreen.tsx`). On web, the element with `role="checkbox"` therefore has no `aria-checked`.
- **Effect:** a screen reader on the web build cannot hear the tick. A phone build reads `accessibilityState` and is unaffected. The same cause dropped the box's `disabled` state on web.
- **Age:** this predates round 3; the box has been there since round 1.
- **Fix:** add `aria-checked` beside `accessibilityState`, as the design-system Showcase does.

**Note:** the A5 refusal's banner carries the occupation route's sentence ("Confirm your BVN first."), not the handle's ("Check your BVN again to continue."). Both are the server's own words under the same title, as built.

**Before merge:** mobile main f8130cd must be merged into the branch (the bookkeeping conflicts above), and backend main e6bd701 (clean).

**NOT RUN:**
- V10 and the phone camera (SHARED-CHANGES KYC-03 #1, OPS-10).
- A real Fintava sandbox selfie or opening (questions 6 and 11, G-25).
- A handle's real 30 minutes in the browser: a key change was used instead.
- A sign-out and an A-to-B switch in the browser: there is no sign-out control in this build, and a sign-in reload empties memory anyway. Both were run in jest (Q1, Q2).
- `identity_has_wallet` and `phone_held_by_other_identity` live.

## Lead merge note (4 Oct 2026)

Merged to main by the lead. Backend PR #59 (95d8bd4) carries the sealed check
handle and the step 2 routes; it deployed to api.wawuafrica.com. Mobile
contract synced from backend main 95d8bd4. Merge conflicts were rows added on
both sides (BACKEND_GAPS G-98 beside G-100..113, SHARED-CHANGES KYC-03 rows
beside ME-06 and HOME-05); both sides kept. Open follow-ups: G-98 (remove the
old number bodies), the web consent checkbox's aria-checked (R3-1), and
SHARED-CHANGES KYC-03 #1 (expo-camera), which needs a new development build
and waits on OPS-10.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
