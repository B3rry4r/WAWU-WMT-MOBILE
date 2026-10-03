---
id: KYC-05
title: Open your wallet: enter your BVN and NIN
owner: YOU
area: KYC
order: 84
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [UI-02, MONEY-03, MONEY-13, KYC-01]
decisions: [R-6]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A14]
---
# KYC-05 · Open your wallet: enter your BVN and NIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- `docs/designer/BRIEF.md`: "New artboard A26 · Open your wallet: BVN and NIN" and "A14" (the brief is part of the design: build its version)
- The design: `python3 scripts/design/render_design.py A3 A14` then open `build/design_shots/` (A26 is not drawn; it uses A3's field style)
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

The first step of Open your wallet (R-6): a user gives their BVN and NIN, the BVN check confirms who they are,
and a BVN registered to a different phone stops here with A14. Everyone lands on this step the first time they
tap anything that moves money. Fintava won't open an account without both numbers (`docs/fintava/naira-api.md`).

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`. This task also wires the pay sheet's "no wallet yet" state (MONEY-03) and the
`no_wallet` answer (MONEY-13) to this step. The other ways in (the Wallet tab, the Home balance card, the
Getting paid rows, Earnings, A11) are added by the tasks that build those screens (docs/WORKFLOW.md section 7,
"Links between screens").

## Artboards

- **A26 · Open your wallet: BVN and NIN** (new in the brief, not drawn): the first screen of Open your wallet in A3's field style: BVN with the hint "Dial *565*0# to get it", NIN with the hint "Dial *346# from the phone on your NIN to get it", Continue.
- **A14 · Phone doesn't match BVN**: the same error the canvas draws on A3, shown as a state of A26 with A26's fields (BRIEF A14).

## Ruling R-6

Identity is checked when someone opens a wallet, never at sign-up. Someone without a Nigerian BVN cannot open a
Naira wallet; dollar and crypto accounts are for them after launch, so for now the flow ends with a clear "not
available yet" instead of an error.

## Brief changes (build these, not the canvas)

- **A14**: the same error, as a state of the new BVN and NIN step (A26), showing that screen's fields. (Why: R-6.)
- **A26**: the first screen of Open your wallet, in A3's field style: BVN (with the "Dial *565*0# to get it" hint) and **NIN** beside it (the canvas's own hint from A18 works: "Dial *346# from the phone on your NIN to get it"). "Must be the number on your BVN" stays relevant for the phone, so A14's error now belongs to this step.

## Capability checks

- [ ] A signed-in user with no wallet who taps Pay on any pay sheet lands on A26.
- [ ] **A26**: a user can enter their BVN and NIN and tap Continue; the BVN check runs (KYC-01) and its name, date of birth and gender are kept for A5.
- [ ] **A14**: a user whose BVN is registered to a different phone sees A14 on this step, can correct the number and continue.
- [ ] A user without a Nigerian BVN reaches a clear "not available yet" end, not an error.
- [ ] A26 is built in A3's field style and A14 matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as is the drawn state A14.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A26: 'Dial *565*0# to get it', 'Dial *346# from the phone on your NIN to get it' (USSD codes)
- A14: phone must equal the BVN-registered phone

## Builder report

Builder, 3 Oct 2026. Mobile `wmt/KYC-05` on main `0b83be8` (merged; main brought docs only). No backend change. Shots: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc05/shots/` (`$K`; copied to `build/screens/KYC-05/`), 390 px at 2x, light and dark, `side-A14-*` and `side-A3-A26-*` beside the renders.
- **Files:** `src/features/open-wallet/` (`OpenWalletScreen.tsx` A26 and its states, `OpenWalletEnd.tsx` the kit `result` ends, `checkFailure.ts` refusal to state, `keptCheck.ts` the passed check in memory for A5, `entry.ts` the way in, `numbers.ts`, `api/account.ts` GET `/users/me` and GET `/money/wallet`, `__tests__/` 21 tests); route `src/app/open-wallet.tsx`; BACKEND_GAPS G-55, G-56; SHARED-CHANGES KYC-05 #1, #2, R1.
- **Check 1 (Pay with no wallet lands on A26): NOT RUN on a screen.** `PaySheet` is fenced and its no-wallet state draws no button; the entry is filed as SHARED-CHANGES KYC-05 #1 (`onOpenWallet`). Built and tested: `useOpenWalletEntry().open` pushes `/open-wallet`; `leadIfNoWallet` does so for `409 wallet_not_open` only (`logic.test.ts`). Unblocked when KYC-05 #1 is applied and a payer passes `onOpenWallet`.
- **Check 2 (A26, the check runs, prefill kept):** jest: grouped input sends `{bvn, nin}` as 11 digits, the confirmed end shows the server's last 4 only, `readKeptCheck(owner)` holds name, date of birth and gender, another account reads null. V9: `a14-*` then `a26-confirmed-*` (built Hub, stand-in record): `WalletIdentity` rows hold last 4 and the verified phone only.
- **Check 3 (A14, correct and continue):** server's `422 bvn_phone_mismatch` sentence under the phone (`a14-*`); editing the BVN clears it (`a14-corrected-*`), Continue passes (`a26-confirmed-*`). Jest the same, plus `accessibilityHint`.
- **Check 4 (no Nigerian BVN: "Not available yet"):** the link "I don't have a Nigerian BVN" (`a26-not-available-link-*`, nothing sent) and the server's `422 phone_not_nigerian` for a +44 account (`a26-foreign-phone-*`, `a26-not-available-server-*`); no alert role (jest).
- **Check 5 (V5):** for the verifier; not claimed. A26 uses A3's field, title (24, 1.15), gaps 6 and 14 and AuthFrame.
- **Check 6 (values from the API or the user):** phone from `/users/me`, masked digits from the check's answer, every refusal sentence the server's. USSD hints left out (G-56).
- **Check 7 (V6, each by its cause):** loading (Hub answers held 6 s, `a26-loading-*`); load error (no connection to `/users/me`, Try again recovers, `a26-load-error*-*`); empty (`a26-empty-*`, `a26-empty-continue-*`); checking (`a26-checking-*`); unknown BVN (`a26-bvn-not-confirmed-*`); person's 4th check `429 identity_checks_exhausted` (`a26-limit-*`); address limit 3 a minute (`a26-address-throttle-*`); Fintava 500, `503` (`a26-unreachable-*`); offline check (`a26-check-offline-*`); wallet open, opening (DB rows, `a26-wallet-open*-*`); signed out goes to `/welcome`.
- **V9:** built Hub main `a055b4f` on :4961 (`k05_test`, migrated and seeded), mock-wawu-id :4962, web export on :8161 passing `/id/*` through with login and refresh wrapped in `{data}` (the stand-in answers the pair unwrapped; the real wawu-id wraps it), a Fintava stand-in for `GET /compliance/verify/bvn` only (made-up numbers). Eight people registered on the stand-in and signed in on the app's own A22. 13 BvnCheckAttempt rows. 0 hits for any typed BVN or NIN in a full `k05_test` dump, Hub, stand-in and web logs; browser after a check: only the two session keys, no sessionStorage, IndexedDB or cookie. No sandbox or live call.
- **Tests:** 4 one-line mutants each fail jest (phone editable 1, A14 on the BVN 2, prefill not kept 3, non-Nigerian as a banner 2), files restored by sha1. `npm run check` before (main `68c68ba`): exit 1 only for a stale `docs/PROGRESS.md`, 21 suites 377 tests, gates 98 files 0 fail 0 warn, lint clean. After (merged): exit 0, 23 suites 398 tests, gates 108 files 0 fail 0 warn 0 accepted, lint clean, 203 tasks.
- **Defaults (agent), owner may override:** the phone is read-only, the person corrects the BVN (G-55); USSD hints left out (G-56); no NIBSS lock line (BRIEF A3, unbacked); copy not drawn: nav "Open your wallet", title "Let's open your wallet" (A3's line "Your BVN fills in the rest." kept), the link, the field and banner words, and the ends ("BVN confirmed", "Not available yet", "Your wallet is open", "Your account is opening"); a pass ends at "BVN confirmed" with Done until KYC-03 makes Continue open A5; `frozen` reads as open; the BVN and NIN live in the two fields only, cleared on a pass or an end.
- **Findings for KYC-03:** A6 (`POST /money/identity/selfie`) needs the BVN and A7 (`POST /money/wallet/open`) the BVN and NIN again, but this task keeps neither past A26's request (the build rule). KYC-03 either asks for them again or the backend matches the stored check instead; and the prefill is memory only (G-25), so a restarted app needs a new, counted check before A5.
- **NOT RUN:** check 1 on a screen (above). V10: no device; unblocked by a tester build with the backend on the droplet (OPS-10). A passing sandbox BVN: none known (Fintava question 11); stand-in record used.

## Verifier report

Verifier, 3 Oct 2026 (fresh session; wrote none of this code). Mobile `wmt/KYC-05` at 0622ef4 (merge base = main 0b83be8); main then moved to 2ca65d0 (docs only, FIX-03), merged in as bf580d3 (`docs/PROGRESS.md` conflict regenerated). Backend: built Hub from main c197d58 (main is now 7601a5f: two test files only, FIX-03). Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk05/`: screenshots `$V/shots/`, design renders `$V/design/`, side by sides `$V/side-*.png`, `$V/sheet-*.png`, run results `$V/results.jsonl`, request log `$V/calls.jsonl`, browser dumps `$V/browser-dumps.jsonl`, privacy scan `$V/privacy-scan.txt`, mutants `$V/mutants.txt`, driver `$V/drive.py`.

**Verdict: 5 defects open, status back to `building`.**

| Pass | Result | Evidence |
|------|--------|----------|
| Privacy | **failed** (defect 1). Passed: 66 distinct BVNs and NINs typed across 53 browser sessions; 0 hits in a full `vk05_test` dump, the Hub log, the stand-in WAWU ID, Fintava stand-in and web-server logs, browser localStorage, sessionStorage, IndexedDB, cookies, console and every URL and navigation (positive control: the same scan finds 61 of them in the captured request bodies). localStorage holds only `wawu.session.access` and `.refresh`. Numbers go only in the POST body, never a URL or route param. `WalletIdentity` holds last 4, a 64-char keyed hash and the verified phone. The confirmed end shows `•••• ••• 0001` only, and the DOM never holds the full number after a pass. Re-entry after Back or Done shows empty fields. `keptCheck` is per account (another owner reads null, jest M2 killed). **But signing out does not clear it** | `$V/privacy-scan.txt`, `$V/browser-dumps.jsonl` |
| V1 | passed | `npm run check` on 0622ef4: exit 0, 23 suites 398 tests, gates 9 run 108 files scanned 0 fail 0 warn 0 accepted, lint clean, 203 tasks (`$V/check-branch.log`). Merged with main 2ca65d0: exit 0, the same counts, 204 tasks (`$V/check-merged.log`). Scope: only `src/features/open-wallet/`, `src/app/open-wallet.tsx`, task docs, BACKEND_GAPS, SHARED-CHANGES; no `_layout.tsx` or shared component edits. No em-dash in user copy, no hex or colour literal, no USSD code (`565`, `346` absent). Diff matches the builder's file list. No copy of anything on main (`AuthField`, `AuthFrame`, `Banner`, `Button`, `Card`, `IconTile` imported). The phone hint "Must be the number on your BVN" is a literal, but contract CONVENTIONS section 8 (A14) backs it: the server enforces the rule, and the app does not check it itself |
| V4 | failed (defect 4). The rest passed | Phone: GET `/users/me` `data.phone` (the token's claim, the same one `checkBvn(user.sub, user.phone, ...)` compares), shown `0803 113 0001` for `+2348031130001`, foreign `+447700901123` as stored. Wallet state: GET `/money/wallet` `state` (`open`, `opening` from real `FintavaWallet`, `FintavaWalletOpening` rows). BVN and NIN: the user. Masked digits: the POST answer's `identity.bvn.last4` and `ninLast4`. Every refusal sentence is the server's `message` (A14, not confirmed, limit, unreachable, `phone_not_nigerian`). Banner titles and end copy are the app's own words. **"Wait a minute, then try again." is a hard-coded time with no backing** |
| V5 | passed, differences classified below | `$V/side-A14-light.png`, `$V/side-A14-dark.png`, `$V/side-A3-A26-light.png`, `$V/side-A3-A26-dark.png` (render left, own 390 px shot right) |
| V6 | failed (defects 2, 3, 4). The rest passed | Each state in light and dark, by its cause against the built Hub: loading (Hub answers held 6 s) `a26-loading`; empty `a26-empty`; empty Continue (no request, 0 POSTs) `a26-empty-continue`; checking (answer held 5 s, button busy) `a26-checking`; A14 (stand-in record on 080 9999 0000) `a14`; A14 corrected (error clears on the BVN edit) `a14-corrected` then `a14-then-confirmed`; unknown BVN (Fintava 400) `a26-bvn-not-confirmed`; daily limit (4th check, `429 identity_checks_exhausted`) `a26-limit`; address limit (two people, one address, 4 in a minute) `a26-address-throttle`; hourly address limit `a26-address-hourly-limit`; unreachable (Fintava 500, `503`) `a26-unreachable`; offline (browser offline) `a26-check-offline`, banner holds 8 s and after reconnect; Hub unreachable while online `a26-check-hub-unreachable`, `-10s`; load error and Try again `a26-load-error`, `-retried`; not available yet by the link (0 POSTs, no alert role) `a26-not-available-link` and by `phone_not_nigerian` (+44 account) `a26-not-available-server`; wallet open `a26-wallet-open`; opening `a26-wallet-opening`; confirmed `a26-confirmed`; signed out goes to `/welcome` with no Hub call `a26-signed-out`. All `$V/shots/<name>-<theme>.png` |
| V7 | passed (except check 1, NOT RUN) | Fresh user signed in on A22, then `/open-wallet` pushed in app (no reload): the form; header Back goes to `/`; re-entry has empty fields; numbers typed then Back: gone on return; pass; Done goes to `/`; re-entry and browser Back then Forward show "BVN confirmed" (kept in memory, 1 POST in total). Cold start (reload) after a pass: the form again (prefill gone, G-25 as recorded). The flow stops at "BVN confirmed" with Done (KYC-03 continues to A5). `leadIfNoWallet`: the real Hub's gated `GET /money/transactions` answers `409` with `reason.code` `wallet_not_open` (no wallet) or `wallet_opening` (an opening row); `errors.ts` reads `reason.code`; jest proves only `wallet_not_open` routes (mutant M1, any 409, killed) | `$V/results.jsonl` (`reentry`, `pass`) |
| V9 | passed | Hub `dist` built from c197d58 on :4963, `vk05_test` fresh, migrated and seeded; stand-in WAWU ID :4964 (users registered on it, signed in through the app's A22, no injected token); Fintava stand-in :4965 (`$V/fintava-standin.js`, made-up numbers, started with `env -i`, no `FINTAVA_API_KEY` in its environment; the Hub had `FINTAVA_BASE_URL` on 127.0.0.1 and a made-up key); web export on :8163 (`EXPO_PUBLIC_*` local, Metro cache cleared: a cached bundle had carried another session's URLs); every request to `*wawuafrica.com` was blocked and counted (0). 48 `POST /money/identity/bvn` bodies, each exactly `{bvn, nin}`, both 11 digits only, no query string (`$V/calls.jsonl` keeps key names and lengths only). 24 `BvnCheckAttempt` rows, 6 verified, 6 `WalletIdentity` rows. The server-only value on screen: the masked last 4 from the check's answer. **WAWU ID shape:** real wawu-id answers login and refresh as `{ data: Session }` and `{ data: TokenPair }` (`auth.controller.ts` `return { data: ... }`, no global interceptor; `contract/identity/openapi.json` `SessionAnswer`, `TokenPairAnswer`, identical to wawu-id main dbcb2f8), and the app reads `payload.data.accessToken`: the app matches the real server. Only the stand-in answers unwrapped, so my pass-through wrapped it as `{data}` |
| Mutations | failed (defect 5) | 8 mutants on the feature, each restored by sha1 (`$V/mutants.txt`): killed M1 (any 409 opens A26), M2 (kept check not per account), M3 (A14 on the BVN), M6 (mask shows more digits). Survived and equivalent: M4 (fields not cleared on a pass: the form unmounts), M8 (NIN sent ungrouped: `checkBvn` strips spaces). **Survived, not equivalent: M5 and M7** |
| V10 | NOT RUN | no device; unblocked by a tester build with the backend on the droplet (OPS-10) |

### Capability checks

1. Pay with no wallet lands on A26: **NOT RUN**. No payer exists on main besides `src/app/preview/pay-sheet.tsx`, and `PaySheet` draws nothing in its no-wallet state. Unblocked when SHARED-CHANGES KYC-05 #1 is applied (`onOpenWallet` on `PaySheet`) and the preview passes it.
2. Enter BVN and NIN, Continue, check runs, prefill kept: passed (V9, `pass` and `reentry`).
3. A14 then correct and continue: passed (`a14`, `a14-corrected`, `a14-then-confirmed`), by correcting the BVN; the phone is read-only (G-55).
4. No Nigerian BVN reaches "Not available yet": passed, both ways.
5. V5: passed with the differences below.
6. Values from the API or the user: failed on the "Wait a minute" line (defect 4).
7. States by real cause: failed on defects 2, 3 and 4.

### Findings

**Defect 1 (privacy): signing out leaves the BVN prefill (name, date of birth, gender) in memory.** `forgetKeptCheck` has no caller, and `signOut()` / the session's `drop()` never touch `keptCheck`. Reproduce: `keepCheck('owner-a', check); await signOut(); readKeptCheck('owner-a')` still returns the prefill (verifier probe in jest, then removed). In the app, the same account signing back in within the same process lands on "BVN confirmed" with that prefill held, without a new check. The owner check stops another account reading it, but the brief requires sign-out to clear it.

**Defect 2: pasting a BVN or NIN cuts it short.** Real Ctrl+V in the web export, into both fields, light and dark. The raw `maxLength={GROUPED_ID_LENGTH}` (13) cuts the pasted text before `groupIdNumber` strips separators. Results, each pasted into an empty field:

| Pasted | Field shows | Digits kept |
|---|---|---|
| `22234567812`, `2223 4567 812`, `2223-4567-812`, `2223.4567.812` | `2223 4567 812` | 11 |
| `2223 - 4567 - 812` | `2223 4567` | 8 |
| `222 345 678 12` | `2223 4567 81` | 10 |
| `222-345-678-12` | `2223 4567 81` | 10 |
| `  2223 4567 812  ` (copied with spaces round it) | `2223 4567 8` | 9 |

The field drops the digits without saying so. Continue then asks for 11 digits, so no wrong number is sent (0 POSTs). Evidence: `$V/shots/a26-paste-cut-*`, `results.jsonl` scenario `paste`.

**Defect 3: a Hub that cannot be reached during a check swaps the banner for the load-error screen.** Reproduce: the Hub drops connections (`/__down?on=1`) while the device is online, then tap Continue. At 2 s the "No connection" banner shows over the form. By 10 s the whole screen is "We couldn't open this step" with Try again, and the typed numbers and banner are gone. The cause is in `OpenWalletScreen`: the `catch` runs `invalidateQueries(walletIdentityQuery)`. Its refetch fails after the query retries, and `[account, wallet, identity].find((q) => q.isError)` treats a failed background refetch, with data still present, as a failed load. With the browser itself offline, the query pauses instead and the banner stays (`a26-check-offline`). Evidence: `a26-check-hub-unreachable-*`, `a26-check-hub-unreachable-10s-*`.

**Defect 4 (fact): "Too many tries. Wait a minute, then try again." is hard-coded.** The address limit has two windows (CONVENTIONS section 8: `short` 3 a minute, `medium` 20 an hour, both PROVISIONAL). Reproduce: 21 requests from one address over 7 minutes, then a check from that address. The Hub answers `429` with `Retry-After-medium: 3448` (about 57 minutes), and A26 still says "Wait a minute". Nothing in the app reads the answer's retry time. Evidence: `a26-address-hourly-limit-*`, `$V/medium.log`.

**Defect 5 (tests): two mutants that change behaviour survive the 21 feature tests.**
- M7 removes the `inFlight` guard, the only same-frame double-tap protection on a charged check. The UI held at 1 POST under a forced second click, but no test covers it.
- M5 shows "BVN confirmed" for any kept check, instead of only one whose last 4 equal the server's current `identity.bvn.last4`. A pass with another BVN elsewhere would then show stale digits and a stale prefill.

**Differs for a recorded reason (V5, A14 and A26 against A3):**
- The status bar and device frame are the render's.
- The nav title "Open your wallet" and the heading "Let's open your wallet" are not drawn. They are A26's own (BRIEF A26; builder default copy).
- No Email, Password, password hint or NIBSS line: BRIEF A3, A26.
- The NIN field is added: BRIEF A26.
- No USSD hint lines: task "Figures on these artboards are not facts", G-56.
- Phone, BVN and NIN lack the mono tracking (`.04em`): SHARED-CHANGES KYC-05 #2 (the prop does not exist on `TextField`; fenced).
- The "I don't have a Nigerian BVN" link: R-6 "not available yet" end.

A14's error treatment matches the render in light and dark: the red border on the phone, the icon and the sentence in place of the hint.

**Unclear:**
- G-55: the phone is read-only. A person whose BVN truly carries another number has no way on in the app until wawu-id has a signed-in phone change. This is recorded as a default; the owner decides.
- The builder's KYC-03 finding: A6 and A7 need the BVN and NIN again, but this step keeps neither.

## Builder round 2

Builder, 3 Oct 2026. Mobile `wmt/KYC-05` from the verifier's 2d4776d (main 2ca65d0 in), then main `c42595b` (WALLET-11) merged: conflicts only in `docs/PROGRESS.md` (regenerated), BACKEND_GAPS and SHARED-CHANGES (both sides kept). Evidence `$K2` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc05/` (`shots-r2/`, also `build/screens/KYC-05/r2/`; `drive-log.jsonl`, `medium-r2.log`, `mutants-r2.txt`, `drive.py`).
- **Defect 1 fixed (privacy).** A26 forgets the kept BVN details (`forgetKeptCheck`) when the session becomes signed out (`useSession`: sign-out, and a refused refresh, which drops the session), when another account opens it, and whenever A26 unmounts (Back, Done, the signed-out redirect). KYC-03's A5 is pushed on top of A26, so it still reads them inside the flow. Default (agent), owner may override: leaving the step forgets them, so re-entry shows the form, not "BVN confirmed" (V9 `leave`: Done, then an in-app push back to `/open-wallet` with no reload, form shown, 1 POST in total, `a26-reentry-after-done-*`). The session itself does not notify features (fenced): SHARED-CHANGES KYC-05 #4 asks for `onSessionEnd` as hardening for KYC-03's multi-screen state. Tests: sign-out, a refused refresh, unmount and another account each null the kept check. There is no sign-out button on main to drive in the browser.
- **Defect 2 fixed.** The BVN and NIN fields set no `maxLength`. `groupIdNumber` takes the digits first, then caps at 11. The jest helper `typeInto` applies a field's `maxLength` before `onChangeText`, as the platform does. Real Ctrl+V in Chromium, round-1 build (`a26-paste-before-*`): `2223 - 4567 - 812` gave 8 digits, `222 345 678 12` and `222-345-678-12` 10, ` 2223 4567 812 ` 9, the NIN `7019 - 0000 - 999` 8. This build (`a26-paste-after-*`): all 8 pastes keep 11 digits. The pasted BVN then passes (`a26-paste-after-confirmed-*`).
- **Defect 3 fixed.** Only a read that never answered (`isError` with no data) is a failed load. A refused check no longer refetches the identity. V9: the Hub drops every connection while the browser stays online (`/__down`). At 2 s and at 12 s the form shows the "No connection" banner with both numbers typed and no error view (`a26-check-hub-unreachable-*`, `-12s-*`). Jest: every read fails and a full refetch runs after the refused check, and the banner and numbers stay.
- **Defect 4 fixed.** The wait comes from the answer: `reason.retryAfterSeconds` (contract `MoneyErrorReason`), else the longest `Retry-After*` header (the throttler's `Retry-After-short` and `-medium`), shown in words by `wait.ts` ("in under a minute", "in 3 minutes", "in about 20 minutes", "in about an hour", "in about 24 hours"). With no figure the banner says "Try again later."; nothing is invented. `unwrap` drops both extras (fenced), so A26 sends the check through `src/features/open-wallet/api/check.ts` (`runBvnCheck`, the typed client) until SHARED-CHANGES KYC-05 #3 puts `retryAfterSeconds` on `ApiError`. V9 results:
  - Address `short` window: "Try again in a minute." (`a26-address-throttle-*`).
  - Hourly window, after 21 requests over 7 minutes from one client address (`medium-r2.log`: `retry-after-medium: 3600`): "Try again in about an hour." (`a26-address-hourly-limit-*`).
  - The person's 4th check (`retryAfterSeconds` about 86,400): "Try again in about 24 hours." (`a26-limit-*`).
- **Defect 5 fixed.** M7: two presses in the same frame through the platform's press handler send 1 POST. M5: a kept check whose last 4 differ from the server's current ones shows the form; a match shows "BVN confirmed". The 10 mutants were each restored by sha1, and all 10 were killed: M5, M7, the 3 forget paths, `maxLength` 13, any query error as a failed load, a hard-coded wait, headers ignored, body wait ignored (`mutants-r2.txt`).
- **V9 rerun.** Built Hub from backend main `7601a5f` on :4961 (`k05_test`, fresh, migrated, seeded). Stand-in WAWU ID :4962 (11 people registered there and signed in on the app's A22). Fintava stand-in on an OS-assigned port (made-up numbers). Web export on :8161 (Metro cache cleared, `EXPO_PUBLIC_*` local, 0 `wawuafrica.com` in the bundle). The pass-through still wraps the stand-in's unwrapped token pair (BACKEND_GAPS G-59, filed by WALLET-11). It now also sets `X-Forwarded-For` per run, as nginx does, so the light, dark and hourly runs count as separate addresses. Every state from round 1 was re-shot in light and dark (28 shots per theme, `shots-r2/`).
- **Privacy:** 0 hits for any number typed, in a full `k05_test` dump or in the Hub, stand-in or web logs. The only hits are the driver's own record of the strings it pasted. Browser after a check: only the two session keys; no sessionStorage, IndexedDB or cookie.
- **Counts:** `npm run check` exit 0 (merged with c42595b): 26 suites 434 tests (open-wallet 31), gates 9 run, 120 files, 0 fail, 0 warn, 0 accepted, lint clean, 204 tasks.
- **Clean-up:** every process I started is stopped (PIDs checked), the database is dropped, and the Hub worktree is removed.
- **Filed:** SHARED-CHANGES KYC-05 #3 (`ApiError.retryAfterSeconds`) and #4 (`onSessionEnd`). #2 notes it is the same `mono` prop as WALLET-11 #1 (c).
- **NOT RUN:** sign-out in the browser (no sign-out control on main; jest covers it; unblocked by the Settings sign-out row). Check 1 and V10 as in round 1.

## Verifier report, round 2

Verifier, 3 Oct 2026 (fresh session; wrote none of this code). Mobile `wmt/KYC-05` at f55585a, which already contains mobile main c42595b (`git merge-base --is-ancestor` true; origin/main has not moved since), so the branch and its merge with main are the same tree. Backend: Hub built from main 7601a5f. Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vk05r2/`: screenshots `$V/shots/<name>-<theme>.png`, contact sheets `$V/sheet-states-light.png` and `-dark.png`, renders `$V/design/`, side by sides `$V/side-*.png`, run results `$V/results.jsonl`, request log `$V/calls.jsonl` (key names and lengths only), browser dumps `$V/browser-dumps.jsonl`, privacy scan `$V/privacy-scan.txt`, mutants `$V/mutants.txt`, the sign-out probe `$V/probe-keptcheck.test.tsx` and `.log`, driver `$V/drive.py`, hourly filler `$V/medium.py` and `.log`.

**Verdict: 1 defect open (round 1's defect 1 is closed only in part), status back to `building`.**

### Round 1's five reproductions on the new build

| Round 1 defect | Now | Evidence |
|---|---|---|
| 1. Sign-out leaves the kept BVN prefill | **Partly closed.** If the session ends while A26 is on screen, the details go: in the browser, a refused refresh (pass-through answers 401 to the Hub and to `/auth/refresh`) while "BVN confirmed" is up sends the user to `/welcome`, and the same account signing in again in the same process gets the form (both themes). **Still open by a second path: defect 1 below.** | `signout_mounted` in `results.jsonl`, `a26-after-session-end-resignin-*` |
| 2. Pasted BVN or NIN cut short | **Closed.** I pasted ten forms with a real Ctrl+V into both fields, in both themes: round 1's eight, plus `222345678129` (12 digits) and `BVN: 22234567812`. Every one leaves `2223 4567 812`, 11 digits, and the pasted number then passes (1 POST). | `paste` in `results.jsonl`, `a26-paste-cut-*` |
| 3. Hub unreachable during a check becomes the load-error screen | **Closed.** With the Hub dropping every connection and the browser online, I looked at 2 s, 12 s and 30 s after Continue. Each time the form showed the "No connection" banner and both numbers stayed typed, with no error view. After the Hub came back, Continue passed (2 POSTs in all). | `hubdown2`, `a26-check-hub-unreachable-{2s,12s,30s}-*` |
| 4. Hard-coded "Wait a minute" | **Closed.** I filled the hourly address window with `medium.py`: 21 malformed checks from 10.99.0.7 over 7 minutes, ending in a `429` with `Retry-After-medium: 3600`. A check from that address then got `retry-after-medium: 3533` (light) and `3527` (dark), and the app said "Too many tries. Try again in about an hour." The short window (two people, one address) said "Try again in a minute." The person's 4th check said "You've used today's checks. Try again in about 24 hours." | `medium.log`, `medium`, `throttle_b`, `limit`; `a26-address-hourly-limit-*`, `a26-address-throttle-*`, `a26-limit-*` |
| 5. Mutants M5, M7 survive | **Closed** (the builder's tests). I did not rerun the builder's mutants; my own 10 are below. | `$V/mutants.txt` |

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| Privacy | **failed** (defect 1). Passed: 78 distinct numbers typed or pasted across 50 browser sessions. A full `vk05r2_test` dump and the Hub, stand-in WAWU ID, Fintava stand-in, web pass-through and filler logs held 0 of them. So did browser localStorage, sessionStorage, IndexedDB, cookies, console, every URL and navigation, and every request URL. Positive control: the same scan finds 74 of the 78 in the captured request bodies; the other 4 were never sent (the paste set and the "no BVN" link). localStorage holds only `wawu.session.access` and `.refresh`. 57 `POST /money/identity/bvn` bodies reached the pass-through, each exactly `{bvn, nin}`, 11 digits each, with no query string. `WalletIdentity` holds hashes, last 4, the verified phone and name keys only. The confirmed end shows `•••• ••• 0001`; the DOM never holds a full number after a pass, and the fields are empty on re-entry after Back or Done. `keptCheck` holds name, date of birth, gender and the last-4 state, for one owner | `$V/privacy-scan.txt`, `$V/browser-dumps.jsonl` |
| V1 | passed | `npm run check` on f55585a (= merged with main c42595b): exit 0, typecheck and lint clean, 26 suites 434 tests, gates 9 run, 120 files scanned, 0 fail, 0 warn, 0 accepted, 204 tasks (`$V/check-branch.log`). An earlier run, made while a web export ran at the same time, failed once: the first A26 test took over jest's 5 s limit (`$V/check-branch-under-load.log`). On its own that test takes 1.0 s. This is load, not the code. Scope (`git diff --name-only origin/main...HEAD`): only `src/features/open-wallet/`, `src/app/open-wallet.tsx`, the task file, LOG, PROGRESS, BACKEND_GAPS and SHARED-CHANGES; no `_layout.tsx`, `src/api/` or `src/components/` edit. No em-dash, no hex or colour literal, no `565` or `346` in the feature |
| V4 | passed | Phone: GET `/users/me` `data.phone` (`0803 121 0021` for `+2348031210021`; the foreign `+447700901123` shown as stored). Wallet state: GET `/money/wallet` `state`, from real `FintavaWallet` and `FintavaWalletOpening` rows. BVN and NIN: the user. Masked digits: the check answer's `identity.bvn.last4` and `ninLast4`. Refusal sentences: the server's `message`. **The waits now come from the answer:** the body's `reason.retryAfterSeconds` (daily limit, 86,400 s, shown as "about 24 hours") or the longest `Retry-After*` header (short 60 s gives "a minute"; medium 3,527 to 3,600 s gives "about an hour"); with no figure, "later". Banner titles and end copy are the app's own words |
| V5 | passed; differences classified as in round 1 | `$V/side-A14-light.png`, `-dark.png` (A14 render left, my 390 px `a14` right), `$V/side-A3-light.png`, `-dark.png` (A3 render, `a26-typed`). A14's red phone border, the icon and the server's sentence in place of the hint all match in both themes. The A26 fields, label, title and line follow A3's style. No change since round 1 |
| V6 | passed (the state set); the sign-out state fails under defect 1 | I entered each state by its cause against the built Hub, in light and dark (`$V/shots/`, `$V/sheet-states-*.png`): loading (answers held 6 s) `a26-loading`; empty `a26-empty`; empty Continue (0 POSTs) `a26-empty-continue`; typed `a26-typed`; checking (answer held 5 s, button busy) `a26-checking`; confirmed `a26-confirmed`; A14 `a14`; A14 corrected (the error clears on the BVN edit) `a14-corrected`, then `a14-then-confirmed`; unknown BVN (Fintava 400) `a26-bvn-not-confirmed`; daily limit (4th check) `a26-limit`; address limit, short `a26-address-throttle` and hourly `a26-address-hourly-limit`; unreachable (Fintava 500, `503`) `a26-unreachable`; offline (browser offline) `a26-check-offline`, held 8 s and still a banner after reconnect `a26-check-offline-back-online`; Hub unreachable while online `a26-check-hub-unreachable-{2s,12s,30s}`; load error, then Try again `a26-load-error`, `-retried`; not available yet by the link (0 POSTs, no alert role) `a26-not-available-link`; by `phone_not_nigerian` (+44 account) `a26-foreign-phone`, `a26-not-available-server`; wallet open `a26-wallet-open`; opening `a26-wallet-opening`; signed out (no Hub call) `a26-signed-out` |
| V7 | passed except defect 1 and check 1 (NOT RUN) | Fresh user signed in on A22, then `/open-wallet` pushed in app: the form. Header Back goes to `/`. Re-entry shows empty fields; numbers typed then Back are gone on return. Pass, then Done goes to `/`; in-app re-entry shows the form, not "BVN confirmed" (the builder's round-2 default), with 1 POST in total (`reentry`, `a26-reentry-confirmed-*`, which is the form despite its name). **But Back pressed while the check is running leaves the details kept: re-entry then shows "BVN confirmed"** (`race_back`, `a26-race-reentry-*`; defect 1). `leadIfNoWallet`: the real Hub's gated `GET /money/transactions` answers `409` `reason.code` `wallet_not_open` for a person with no wallet; jest still routes only that code (`logic.test.ts`) |
| V9 | passed | Hub `dist` built from 7601a5f on :4963. `vk05r2_test` fresh, migrated and seeded. Stand-in WAWU ID :4964 (people registered there and signed in through the app's A22; no injected token). Fintava stand-in :4965 (`$V/fintava-standin.js`, made-up numbers, started with `env -i PATH=...`; its environment holds only PATH, checked in `/proc`). The Hub had `FINTAVA_BASE_URL` on 127.0.0.1 and a made-up key. Web export on :8163 with `EXPO_PUBLIC_*` local and the Metro cache cleared; 0 `wawuafrica.com` strings in the bundle and 0 such requests. 35 `BvnCheckAttempt` rows, 15 `WalletIdentity` rows. Every body matched `BvnCheckDto` exactly (`{bvn, nin}`, both `^[0-9]{11}$`, nothing more). The server-only value on screen is the masked last 4. **WAWU ID shape:** real wawu-id (dbcb2f8) answers login and refresh as `{ data: ... }` (`auth.controller.ts:191`, `:210`; contract `SessionAnswer` requires `data`). The app reads `payload.data` (`src/api/identity.ts`), so the app matches the real server. Only the stand-in answers unwrapped (G-59), so my pass-through wraps it |
| Mutations | passed | 10 of my own (`$V/mutants.txt`), each restored and sha1-checked. **Killed (7):** the header wait wins over the body; the shortest header instead of the longest; the NIN sent as the BVN; the daily limit ignores the wait; hours floored; the confirmed card shows the NIN digits as the BVN; the phone shown as stored. Survived and equivalent (2): a dropped connection rethrown raw (the client's `onError` already makes it `networkError()`); letters counted as a whole number (the field only ever holds `groupIdNumber`'s digits and spaces). Survived, a test gap but not a defect (1): `runBvnCheck` accepting a 200 whose `identity` has no `bvn` key, an answer the contract excludes |
| V10 | NOT RUN | No device. Unblocked by a tester build with the backend on the droplet (OPS-10) |

### Capability checks

1. Pay with no wallet lands on A26: **NOT RUN**, as in round 1. `PaySheet` draws nothing in its no-wallet state, and no payer exists on main besides the preview. Unblocked when SHARED-CHANGES KYC-05 #1 (`onOpenWallet`) is applied and the preview passes it.
2. Enter BVN and NIN, Continue, the check runs, the prefill is kept: passed (`pass`).
3. A14, then correct and continue: passed (`a14`), by correcting the BVN (phone read-only, G-55).
4. No Nigerian BVN reaches "Not available yet": passed, both ways.
5. V5: passed.
6. Values from the API or the user: passed.
7. States by their real cause: passed, apart from the sign-out path in defect 1.

### Findings

**Defect 1 (privacy, round 1's defect 1 still open by a second path): BVN details from a check that answers after A26 has gone survive sign-out.** `submit` calls `keepCheck(account.wawuUserId, check)` whenever the check resolves, even if A26 has already unmounted. The header Back stays live while Continue is busy. So: tap Continue, tap Back before the answer, and the answer arrives with no A26 mounted. Every forget path is then skipped: the unmount cleanup has already run, and the sign-out effect lives in A26. SHARED-CHANGES KYC-05 #4 says the current clearing "covers every path without this"; this path shows it does not.
- Reproduce in the browser (`race_signout`, both themes). Type a passing BVN and NIN. Hold the Hub's answers 5 s (`/__delay?ms=5000`), tap Continue, then tap Back after 1 s. Wait for the answer (1 POST). End the session with a refused refresh (`/__deny?on=1`, then a screen that reads the Hub: `/payout-account`); the app lands on `/welcome`. Sign in again on A22 as the same person, in the same tab with no reload, and push `/open-wallet` in-app. The screen shows "BVN confirmed" with that person's masked BVN and NIN, and the name, date of birth and gender are still held. No new check is made (1 POST in total). Evidence: `a26-race-signout-resignin-light.png`, `-dark.png`, `results.jsonl`.
- Without signing out (`race_back`), the same race makes re-entry show "BVN confirmed". That contradicts the round-2 default "leaving the step forgets them" (`a26-race-reentry-*`).
- Reproduce in jest (`$V/probe-keptcheck.test.tsx`: the suite's own harness, run in my worktree, then removed; `$V/probe-keptcheck.log`). The POST answer is deferred; press Continue, unmount the screen, release the answer, `signOut()`. `readKeptCheck(OWNER)` still returns the prefill (`Ada B Eze`, `1992-10-04`, `female`). Round 1's exact probe (`keepCheck`, `signOut()`, `readKeptCheck`) also still returns it while A26 is not mounted.

**Checked and not a defect:**
- `src/features/open-wallet/api/check.ts` calls the typed client directly and repeats `checkBvn`'s request (from `@/api/walletIdentity`). Main's `checkBvn` cannot give the wait, because `unwrap` drops both `reason.retryAfterSeconds` and the headers, and the throttler's 429 has no `reason` (backend CONVENTIONS section 8). So this is not a stand-in for something main has; same reasoning as WALLET-11's `BankField`. The repeated request matches the original: the same path and body (it strips `\D`, `checkBvn` strips `\s`, the same for grouped input), the same success checks (`prefill` object, `checksLeft` integer, `bvn` key), the same `toApiError`, and network failures become `networkError()`. SHARED-CHANGES KYC-05 #3 names the exact change and says `check.ts` is deleted once it lands. On web, the `Retry-After*` headers are readable only through a same-origin proxy: the Hub sets no `exposedHeaders` (`main.ts:36`). The app ships as native, where every header is readable.
- How waits are worded (`wait.ts`): from 5 minutes up, minutes are rounded to fives, and from 45 minutes up, to hours. A 7-minute wait reads "about 5 minutes" and an 89-minute one "about an hour". The words say "about", and a retry that is too early gets the new figure, so I record this rather than open a defect.
- A pasted 12-digit string keeps its first 11 digits without a word, as round 1's `maxLength` did and as typing a 12th digit does. Not a regression.

**Differs for a recorded reason (V5):** unchanged from round 1. The status bar and frame belong to the render. The nav title and heading are A26's own. No Email, Password or NIBSS line (BRIEF A3, A26). The NIN field is added (BRIEF A26). No USSD hints (G-56). No mono tracking (SHARED-CHANGES KYC-05 #2). The "I don't have a Nigerian BVN" link is R-6's "not available yet" end.

**Unclear (unchanged, owner):** G-55 (the phone is read-only; a person whose BVN truly carries another number has no way on). The builder's KYC-03 finding (A6 and A7 need the BVN and NIN again).

## Builder round 3

Builder, 3 Oct 2026. Mobile `wmt/KYC-05` from the verifier's de27d15, then main `6bc420e` (ME-17) merged (only `docs/PROGRESS.md` conflicted, regenerated). Evidence `$K3` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/kyc05/r3/` (the verifier's `drive.py` and `web-server.js` with my ports, `results.jsonl`, `browser-dumps.jsonl`, shots under `shots-race-before/`, `shots-race-after/`, `shots-r3/`; copied to `build/screens/KYC-05/r3-*`). Mutants: `../mutants-r3.txt`.
- **The open defect is fixed: a check that answers after A26 has closed, or after the session that sent it ended, is never kept.** There are two guards.
  - **The store guard (`keptCheck.ts`).** A write needs a ticket taken when the check is sent (`ticketFor(owner)`). Every `forgetKeptCheck` voids every ticket already handed out: sign-out, session end, another account, and leaving the step. So `keepCheck(ticket, check)` refuses a late answer and returns false, whoever calls it.
  - **The form guard (`OpenWalletScreen.tsx`).** It drops an answer that lands after it unmounted, or while the session is not signed in, and then writes nothing: neither the kept details nor the identity in the query cache.
- **Header Back stays enabled during a check.** Default (agent), owner may override. Leaving mid-check is the person's choice and the check is charged either way; a late answer is now safe.
- **Jest** (35 open-wallet tests, 4 new):
  - an answer after unmount: nothing kept, the cache untouched, and re-entry shows the form;
  - an answer after a sign-out and the same person signing in again: nothing kept, no "BVN confirmed";
  - a stray late write with an old ticket: refused;
  - a ticket voided by a forget: refused, even when reused.
- **Mutants:** 8 of 8 killed: store accepts a voided ticket, forget voids nothing, form keeps a late answer, both guards off, plus M5, M7 and two forget paths. Every file was restored by sha1.
- **Browser, the verifier's race cases, light and dark.**
  - **Before:** an export of de27d15 (`shots-race-before/`). `race_back`: Back at 1 s, the pass lands at 5 s, and re-entry shows "BVN confirmed •••• ••• 0031". `race_signout`: the same, then the session revoked (Hub and refresh 401, sent to `/welcome`), the same person signs in again, and it shows "BVN confirmed".
  - **After:** this build (`shots-race-after/`). `race_back` re-entry shows the form, 1 POST. `race_signout` after signing in again shows the form, 1 POST. `signout_mounted` shows the form.
  - The store lives in JS memory only. In the browser, an empty store shows as the form on re-entry: the server's identity holds a passed BVN, so a kept check would show "BVN confirmed". Browser storage after each race: only the two session keys, no sessionStorage, IndexedDB or cookie.
- **V9:** built Hub from backend main `7601a5f` (still main) on :4961, fresh `k05_test`. Stand-in WAWU ID :4962 (people registered there and signed in on the app's A22). Fintava stand-in started with `env -i`. Web export on :8161 (Metro cache cleared, 0 `wawuafrica.com`), with `X-Forwarded-For` set per scenario. The verifier's `loading`, `empty`, `pass`, `a14`, `unknown`, `hubdown2`, `reentry`, `paste`, `open`, `opening` and `nobvn` all pass in light and dark on this build (`shots-r3/`).
- **Privacy scan:** 45 distinct typed numbers. 0 hits in a full `k05_test` dump and in the Hub, stand-in and web logs. The positive control finds 43 of them in captured request bodies.
- **Counts:** `npm run check` exit 0 (merged with 6bc420e): 26 suites 438 tests, gates 9 run, 120 files, 0 fail, 0 warn, 0 accepted, lint clean, 204 tasks.
- **SHARED-CHANGES KYC-05 #4 corrected.** It no longer claims the screen-side clearing covered every path. It names the late-answer race and the store's ticket, and keeps `onSessionEnd` as hardening for KYC-03's state across screens.
- **Clean-up:** all four processes stopped (PIDs checked), `k05_test` dropped, the Hub worktree and a temporary mobile worktree (for the "before" export) removed.
- **Incident:** while discarding a database dump I ran `mv dump.sql /dev/null` as root, which replaced `/dev/null` with a regular file for about a minute. I restored it at once (`mknod -m 666 /dev/null c 1 3`; checked as a character device 1,3). Output any other process wrote to it meanwhile was discarded as intended. The dump held no typed number (scan above).
- **NOT RUN:** check 1 (SHARED-CHANGES KYC-05 #1) and V10, as before.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
