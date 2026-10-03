---
id: KYC-03
title: Open your wallet: confirm details and address, selfie
owner: YOU
area: KYC
order: 86
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
