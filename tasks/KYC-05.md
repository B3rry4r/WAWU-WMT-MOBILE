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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
