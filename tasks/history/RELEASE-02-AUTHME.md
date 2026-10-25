# RELEASE-02 · R2-AUTHME: fixes for CHECK-3 area 1 (sign-up, settings, verification, referral, profile)

Built 25 Oct 2026 by a Sonnet builder (T1, app only), mobile `wmt/R2-AUTHME` on `origin/main` `a3fdaf71`. No backend change, no new route file, no native change (fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4` unchanged). Source: `audits/CHECK-3/auth-me.md` on `origin/wmt/CHECK-3-auth-me` (`2ee9b1d1`). Status of RELEASE-02 itself is not changed here (it covers three bundles).

| Finding | Before | After | Proof |
|---|---|---|---|
| D-1 HIGH | /tiers drew the Hub's dollar figures with a naira sign; Continue led to a cedi wallet opening | the currency the Hub gives is drawn with its own sign ($3, $9, $15); Continue says "Paying in dollars isn't open yet" and leads to the Wallet tab to add a dollar account; no checkout, no wallet opened. The Hub takes a plan payment only from the naira wallet (`PAYMENT_CURRENCY`), so there is nothing to pay from: G-R2-AUTHME-1. Renew (VF14) and Add 5 (VF13) use the plans' currency too | `tierCheckout.test.tsx` D-1 (2 cases); picture `tiers-usd`, `tiers-usd-continue` |
| D-2 HIGH | a fan could pay a tier, then "Record my voice" bounced to Home | Default (lead), owner may override: a fan may buy a tier (it opens hosting events and points; no ruling bars it, the Hub sells it), so after paying "Record my voice" is drawn for a creator account only, every other account ends on Done. The voice routes stay creator-only | `tierCheckout.test.tsx` D-2 (creator sees it, fan sees Done); pictures `tier-done-creator`, `tier-done-fan` |
| D-3 MED | Bank transfer row only after Pay was tapped (FIX-55 rule) | row from first paint beside the wallet, wallet chosen. One assertion in `tierCheckout.test.tsx` pinned the old rule ("no transfer card when the wallet covers it") and is updated. Points checkout (PT4) keeps its own rule. **Reversed in Fix round 1 (lead, 25 Oct): the tier checkout keeps the FIX-55 rule again** | picture `checkout` |
| D-7 MED | Verification showed Getting paid and, once a tier was held, Your tier | "Your ticks" (the tier held, "Get it" with the cheapest tier, its price and length, or "Upgrade" while a higher tier exists, both open /tiers) and "Every tick gives you" (uploads and library space from `GET /uploads/allowance`, reach and the tick beside the name as the board words them). A row whose figure the Hub did not give is not drawn | `verificationFlow.test.tsx` D-7 (7 cases); picture `verification` |
| D-2b MED | one Share target | Who Made This? chat (the line and link to a recent chat), Share (system sheet, which reaches every chat app) and Save (where the phone can). **Round 1 correction (lead):** the first build also drew WhatsApp by link on the lead's ruling; R-68 (no outside brand names) is the earlier owner ruling and wins, so WhatsApp is removed and the brand list in `ShareCardScreen.test.tsx` is exactly as on main again. Story is not drawn either (native module, and a brand): G-R2-AUTHME-2 | `ShareCardScreen.test.tsx` (4 new cases); picture `invite-card` |
| D-4 MED | About added Terms and Privacy rows Z9 does not draw; Banking by and Rate the app hidden | the two extra rows removed (they stay in Settings and the sign-up consent); Banking by, Contact support (address line) and Rate the app are the Hub's and the app config's: hidden until the owner sets them (G-R2-AUTHME-3). One assertion pinned the extra rows and is replaced | `aboutScreens.test.tsx`; picture `about` |
| D-5 MED | A5 is a form | not changed: under the review opening the Hub reads nothing from the BVN (`step_not_used`, G-460); G-R2-AUTHME-5 | none |
| D-6 MED | A29 had no reason card or Upload again | not changed: the built screen already draws the Hub's reasons, the "What to do" card (`review.reasons[].fix`) and Upload again (`canResubmit`); the audit reached it by URL with no rejection on record, a state the Hub never produces (covered by `documentsFlow.test.tsx`) | none |
| D-8 MED | Terms and Privacy "Not available yet" | not changed: the screens read the Hub's published documents (`GET /policies/{slug}`); nothing is published; the owner's terms text item (G-R2-AUTHME-4) | none |

## Lows (11)

Fixed: L-6 (RF4 item 6 now ends "You can convert points to cash in your wallet", dropped for a dollar account because it cannot convert, G-741; G-REF-03-2 closed; one assertion pinned the old line), L-8 (Sign in opened cold has a Back arrow that goes to Welcome; one assertion pinned "no Back button"), L-9 (Delete account says "Your wallet and cards", R-84; one assertion pinned the old copy).

Not fixed, each needs a ruling or a fact the app cannot supply:
- L-1 Me menu "Your tier" row: added by VERIFY-05, not on M7 or Z1. Keep or cut is a ruling.
- L-2 VF1 third row: the row is the Hub's event pass name ("Maker Pass, priority"), the board's "Christmas event pass" is sample text. Hub data.
- L-3 A26 and A27 extra fields and "voter's card": Nuvion requires ID type, ID number, postal code and document type (G-460) and accepts no voter's card; the copy is true.
- L-4 and L-4b Add a work Category and Description; Edit profile Country, State and City: the Hub's fields and R-85's country, region and city (GEO-03). Ruling to change either.
- L-5 Voice Intro counter 0 / 500 and no "About 20 seconds" line: the limit is the Hub's setting (`textMaxChars`) and no seconds figure exists to quote.
- L-7 visitor About footer lacks Follow and "Message · ₦300"; L-7b dashboard "Get verified" link, earnings chart and the meter copy for a tier holder: the meter reads the Hub's `tickHeld`, which is a tick, not a tier; whether a tier counts as a tick is a Hub ruling. No chart data is served.
- L-10 Welcome second line: "bank it all in one app" is held back by G-34 until the owner confirms the claim.
- L-11 A21 "Creators only.": untrue (any person with an open wallet reaches it from Withdraw; FIX-78 F-6), so it stays out.

## Checks (logs in `scratchpad/r2-authme/`)

`tsc5.log` EXIT 0 (run on the final tree); `eslint.log` EXIT 0 on 31 changed files (no --fix); `jest5.log` EXIT 0, 29 suites, 621 tests (route-guard, auth-welcome, `features/verify`, `features/me`); `jest3.log` and `jest4.log` (verification, about, delete-account, referral): every suite passes (the one RulesScreen timing case was fixed and `jest4.log` EXIT 0, 7 suites, 61 tests); `gates.log` EXIT 0 (0 fail, 18 warn, baseline 0 entries); `tasks.log` EXIT 0; `fingerprint.log` EXIT 0, hash `17ffb13d520882bf144982b61d03f3994c6e40e4`.

Pictures at 390 px, light and dark, board left and app right: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/r2-authme/shots/side-<name>-<light|dark>.png` for tiers-ngn, tiers-usd, tiers-usd-continue, checkout, tier-done-creator, tier-done-fan, verification, invite-card, about, sign-in. The app side is the real web export of this branch against a throwaway Hub stand-in that answers the reads in the Hub's shapes (not committed); the boards are `build/design_shots`. Not pictured (covered by tests): Delete account, RF4.

NOT RUN: a real Hub stack, the signed release build on a phone, the Who Made This? chat send to a real chat, WhatsApp opening on a phone.

## Round 1 (25 Oct 2026, lead correction)

WhatsApp removed from the share card (R-68 wins over the first D-2b ruling). Checks: see `scratchpad/r2-authme/r1-*.log`. Picture `shots/side-invite-card-*.png` from round 0 still shows WhatsApp and is superseded: the card now has Who Made This? chat and Share (Save on a phone).

## Verifier report (V-R2-AUTHME, lean T2, 25 Oct 2026): FIX

Checked `origin/wmt/R2-AUTHME` 65cb4ea7 against `origin/main` a3fdaf71 by a session that built none of it. Local stack (Nuvion stand-in, mock WAWU ID, ports 9090 to 9099), the branch's own web export at 390x844, Chromium. No Fintava, no live host. Pictures (board left, app right): `scratchpad/v-r2-authme/side-*.png`.

### Findings, ranked

1. **HIGH, defect (a consequence of the D-3 ruling): picking "Bank transfer" on a wallet that covers the total debits the wallet.** Repro: funded Nigerian user (₦200,000), `/tiers`, Continue, tap "Bank transfer", Pay, PIN. One `POST /plans/purchases` with `method: transfer`; balance 20,000,000 to 19,500,000 kobo and `GET /me/tier` is `active`, with no bank details shown. The screen read "We are confirming your payment. Don't pay again. / Paying..." 7 s after the PIN (its final state was not watched). The person chose to pay from a bank and was charged from the wallet. Cause: `usePlanPurchase.ts:163` sends the picked method, `CheckoutScreen.tsx:134-143` now always draws the row, and the Hub (`plan-purchase.service.ts:293`, `buyByTransfer` then `transfers.place`) settles at once when the balance already covers the total; the 17 Oct rule hid the row for exactly this. The one changed assertion (`tierCheckout.test.tsx`, transfer row present, wallet checked) does not cover picking the row on a covered wallet. Needs a ruling and a fix: for a covered wallet, say that the wallet pays (or do not select the row), or place the order so it waits for a bank transfer.
2. **MEDIUM, defect: "Add a dollar account" opens a cedi wallet.** Ghana user (no wallet), `/tiers`, Continue, "Add a dollar account": `tiers.tsx` pushes `/wallet`, which redirects to `/open-wallet` ("Where do you live?") with "Your first account" preselected to Ghanaian cedi and no mention of dollars. A tap on Continue opens a cedi wallet that still cannot pay the tier (G-R2-AUTHME-1). The same screen CHECK-3 D-1 complained about is one tap behind the explanation. Pass the dollar choice into the opening, or word the button for what it does.
3. **LOW, BRIEF entry stale (not a defect of this branch):** Z6 "Your wallet and cards" follows the board and R-84 (cards built, WALLET-22 `review`; R-84 settled R-16's cards), but `docs/designer/BRIEF.md` Z6 still says "Instead: wallet. No cards at launch (R-16)". DECISIONS outranks the BRIEF; the lead should correct the BRIEF entry. Its test lost `queryByText(/cards/i)` toBeNull for the same reason.
4. **LOW, open (owner setting, not code):** About shows only "Contact support" on this stack: "Banking by" and "Rate the app" stay hidden because the Hub's `bankName` and the store link are unset (G-R2-AUTHME-3). R-67 says "Banking by Nuvion" is shown now, so the release setting must be made or D-4 stays open.
5. **LOW, note:** the web export draws Chat and Share only on the share card (Save is phone-only by design); Save and the signed phone build are NOT RUN. The fan's Done screen was checked by URL with the fan's own paid purchase id (the fan's real pay ended in finding 1's state); the jest D-2 fan case covers the wallet path.

BRIEF rules 3, 4, 5 on the tiers checkout: Pay is the total (₦5,000 = Total; the PIN sheet says "₦5,000 for the Founding Maker tier"), "No fee" is never drawn, and the fee line (`CheckoutScreen.tsx:189`, unchanged by this branch) is drawn only when the Hub's fee is above 0, which it is not on this stand-in (book fee 0), so the breakdown itself was seen only in jest. No BRIEF entry exists for VF5 to VF7, RF2, RF4, M16 or A22; Z9 and Z6 are above.

### The brief's six points

| # | Result | Evidence |
|---|---|---|
| 1 | Nigerian: ₦1,000, ₦3,000, ₦5,000; checkout has the Bank transfer row from first paint, wallet chosen; one wallet debit of ₦5,000 (creator, wallet row). Ghana: $3, $9, $15, no ₦ anywhere; Continue says "Paying in dollars isn't open yet" with "Add a dollar account"; no non-GET request was sent, no wallet opened by Continue. Passes, except findings 1 and 2 | `side-tiers-ngn-light`, `side-tiers-usd-light`, `side-tiers-usd-continue-light`, `side-checkout-light` |
| 2 | Fan ends on "You're official" with Done and no voice button; creator sees "Record my voice", and `/voice-consent` opens (no voice provider on the stack: "Voices are not available right now", not a bounce Home) | `side-done-fan-light`, `creator-voice-light` |
| 3 | Verification: "Your ticks" (no tier: "Get your tick, Verify · ₦1,000 for 30 days, Get it", opens `/tiers`; Ghana: "$3"; tier held: Founding Maker, Active until 25 Oct 2027) and "Every tick gives you" (25 uploads, 10 GB, free 1 GB from `/uploads/allowance`; the "Free accounts get 5" line is absent because the Hub's free level is 0 uploads) | `side-verification-light`, `side-verification-dark` |
| 4 | Share card: "Who Made This? chat" (sheet opens, empty state "Your recent chats show up here.") and "Share"; no outside brand in the screen text; the ShareCardScreen test diff has only added lines (the brand-list assertions equal main's). Two added source lines name WhatsApp and Instagram, both comments | `side-invite-card-light` |
| 5 | About: three-row layout without Terms and Privacy (config-hidden rows per finding 4); sign-in opened cold has the Back arrow and it goes to `/welcome`; Delete account "Your wallet and cards" | `side-about-light`, `side-signin-light`, `side-delete-light` |
| 6 | Changed assertions, none weakened: `auth-welcome.test.tsx` A22 cold ("no Back" to Back goes to welcome); `aboutScreens.test.tsx` row-title loop lost "Terms" and "Privacy policy" (rows gone, others still asserted) and "can open Terms and Privacy" became "draws the three rows, no Terms or Privacy"; `aboutSupport.test.tsx` props only; `deleteAccount.test.tsx` three edits ("Your wallet" to "Your wallet and cards", and the no-cards assertion dropped, see finding 3); `RulesScreen.test.tsx` and `model.test.ts` (item 6 gains the convert sentence, the dollar variant still asserts none); `tierCheckout.test.tsx` (the transfer card absent to present, wallet checked; fixtures widened for dollars and account type); `verificationFlow.test.tsx` (defaults for `plans` and `allowance`, one title reworded, its assertions unchanged). Each pinned a defect or a rule a board or ruling reverses | `git diff origin/main...65cb4ea7 -- '*__tests__*'` |

### Checks (logs in `scratchpad/v-r2-authme/`)

`tsc.log` EXIT 0; `jest.log` EXIT 0 (33 suites, 669 tests: verify, verification, about, delete-account, referral, auth-welcome, route-guard; `features/create` not run); `gates.log` EXIT 0 (10 gates, 1414 files, 0 fail, 18 warn, baseline 0 entries; not compared against main's warn count); `tasks.log` EXIT 0; `fingerprint.log` EXIT 0, `17ffb13d520882bf144982b61d03f3994c6e40e4` (unchanged).

NOT RUN: the signed phone build, Save, a real chat send, the final state of finding 1's screen, a Ghana person with an open wallet, a transfer order on a short wallet, a non-zero fee breakdown on the stack.

## Fix round 1 (25 Oct 2026, T1, builder R2-AUTHME on `wmt/R2-AUTHME` `a09e523b`)

App only, no backend change, no new route file (so no SHARED-CHANGES row), no native change (fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4` unchanged). Answers the verifier's report above.

| # | Finding | Fix | Test (red before, green after) |
|---|---|---|---|
| 1 | HIGH: "Bank transfer" picked on a covering wallet debited the wallet | Lead ruling 25 Oct: D-3 is reversed on the tier checkout only. The FIX-55 rule is back (`usePlanPurchase.ts` `transferOffered`, `CheckoutScreen.tsx`): the "Bank transfer" row is drawn only when the wallet is short of the total, or a transfer is already under way. The Hub is not changed. Points checkout (PT4) untouched. BRIEF rules 3 to 5 hold: Pay is the total, no "No fee" | `tierCheckout.test.tsx`: the main assertion changed in round 0 is back as it was (no transfer row on a covering wallet); new: covering wallet draws no transfer row and Pay sends `method: wallet`; short wallet draws the row beside the wallet, the wallet chosen, and the row can be picked (that one passed before too: it guards "as before") |
| 2 | MEDIUM: "Add a dollar account" opened a cedi wallet | The choice goes through the route. `/tiers` pushes `/wallet?add=<the Hub's plan currency>`; the Wallet tab reads `add` (`src/app/(tabs)/wallet.tsx`). No wallet: it opens `/open-wallet?currency=USD`; that route reads `currency` (a code the app knows) and gives it to the country step, where "Your first account" starts on it when the Hub has it on (R-87: the person may still change it; a currency the Hub switched off is ignored and the country's own is offered). A person who already has a wallet: a Naira wallet puts the Dollar tab in front (its own "open account" is the way to add it); a wallet opened from outside Nigeria opens its "Add a currency" sheet, once, when USD can still be added. Someone who already holds USD is shown nothing extra | `walletAddCurrency.test.tsx` (7 cases, real tabs on the real router); `worldOpening.test.tsx` (4 cases: Ghana with USD asked for sees US dollar and goes on with USD; without it sees the cedi; a switched-off currency is ignored; the person's own pick wins); `tierCheckout.test.tsx` D-1 case now asserts `/wallet?add=USD` |
| 3 | LOW: BRIEF Z6 said "No cards (R-16)" | One line changed in `docs/designer/BRIEF.md` Z6 (the "Instead" line): keep "wallet and cards", virtual cards exist (R-84). Nothing else in the BRIEF | none |
| 4 | LOW, find only: where "Banking by" reads its name | See below. No code change | none |

Before the fix (source files put back to `a09e523b`, tests kept): 7 of 57 failed in `tierCheckout`, `walletAddCurrency` and `worldOpening` (`jest-before.log`); after: all pass.

### Finding 4: "Banking by"

`GET /about` `bankName` is `runningWalletLines(...)` in the Hub's `src/about/about-settings.ts`: a Hub environment variable, not an admin setting (the earlier gap row said admin settings). Under `WALLET_PROVIDER=nuvion` it is `NUVION_WALLET_BANK_NAME`; the code gives it no default on purpose (`src/money/opening/wallet-opening-config.ts`: "Nuvion's bank has no default (its docs name no issuing bank), so an unset name is shown empty"), so the app hides the row. Nothing was meant to default it, so no code change. Under `WALLET_PROVIDER=fintava` the key is `WALLET_BANK_NAME` with the default "Loma Bank" (not touched). The same value is the bank name on the wallet's account details and on receipts, so "Nuvion" shows there too. Console line for the live Hub: `NUVION_WALLET_BANK_NAME=Nuvion` (then restart the Hub). `G-R2-AUTHME-3` in `BACKEND_GAPS.md` now names it.

### Live proof (local stack `r2a1`, ports 9170 to 9175, Hub on the Nuvion stand-in, mock WAWU ID, this branch's web export at 390 px; no real provider, no Fintava)

- Covering wallet (₦200,000), `/tiers`, Continue: checkout draws the wallet only, no Bank transfer row; Pay, PIN: one `MakerPurchase` row `tier founding 500000 wallet paid`, balance 20,000,000 to 19,500,000 kobo, "You're official". Pictures `covered-2-checkout.png`, `covered-5-after-pin.png`.
- Short wallet (₦1,000), same path: wallet and Bank transfer rows both drawn, the wallet chosen with "Add money first"; pick Bank transfer, Pay, PIN: a `PlanTransferOrder` for ₦5,000, the card shows "Send exactly ₦4,000", the wallet's account number and "Your tier starts when the money lands". Pictures `short-2-checkout.png`, `short-3-transfer-picked.png`, `short-5-after-pin.png`.
- Ghana person with no wallet, `/tiers` ($3, $9, $15), Continue ("Paying in dollars isn't open yet"), "Add a dollar account": lands on `/open-wallet?currency=USD`, "Where do you live?" with Ghana and "Your first account" **US dollar** (no cedi). Pictures `ghana-1-tiers-usd.png`, `ghana-2-dollars-not-open.png`, `ghana-3-open-wallet-first-account.png`. The wallet was not opened (nothing past the step was tapped).
- Pictures are in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/r2a1/`, light theme only, app side only (no board beside them: the checkout board is VF6, the opening step has no board, R-29).

### Checks (logs in `scratchpad/r2a1/`)

`tsc.log` EXIT 0; `eslint.log` EXIT 0 on the 13 changed source and test files (no --fix); `jest.log` EXIT 0, 46 suites, 942 tests (wallet tab and world, open-wallet, verify, route-guard, the new `walletAddCurrency`); `gates.log` and `tasks.log` below; `fingerprint.log` EXIT 0, `17ffb13d520882bf144982b61d03f3994c6e40e4` (android, unchanged).

NOT RUN: the signed phone build, a Ghana person with an open wallet in the web export (jest covers it), the dark theme pictures, a non-zero fee breakdown.

## Fix round 2 (25 Oct 2026, T1, CI only, builder R2-AUTHME on `wmt/R2-AUTHME` `df1b952e`)

Two tests failed in GitHub's full jest on `df1b952e` and `a09e523b`; main `a3fdaf71` was green. Tests only, no source change, no route file, no native change.

| # | Failure | Cause | Fix |
|---|---|---|---|
| 1 | `auth-sign-in.test.tsx` "has no back button on sign in when there is no screen behind it" | The branch's: round 0's L-8 (CHECK-3) draws a Back arrow on a cold Sign in that goes to the welcome screen, and updated `auth-welcome.test.tsx` but not this file. Lead ruling: this one assertion follows L-8 | That assertion now presses Back and waits for the welcome screen (the same rule `auth-welcome.test.tsx` asserts). Nothing else in the file |
| 2 | `worldOpening.test.tsx` A31 "asks where they live first ..." (`open-wallet-country-field` not found) | Not the branch's code: a race in a test that is byte-identical on main. The title "Where do you live?" is drawn at once, the country field only after the Hub's country list arrives; the test used a synchronous `getByTestId` right after the title. CI's slower worker lost the race, the builder's lone run won it | `await findByTestId` (as the other tests in the file already do) before pressing the field. No timeout lengthened, nothing skipped |

Proof for 2: with the countries answer held back 400 ms in a scratch copy of the file (not committed), A31 fails with the same message on main `a3fdaf71` (1 failed, 19 passed) and on this branch before the fix; after the fix all 24 pass. The branch's `CountryStep` change (`preferredCurrency`) does not touch the loading path.

Checks (logs in `scratchpad/r2-authme-b/`): `tsc.log` EXIT 0; `eslint.log` EXIT 0 on the two files (no --fix); `two.log` EXIT 0 (2 suites, 65 tests); `ow.log` open-wallet folder EXIT 0 (24 suites, 374 tests); `auth.log` auth folder, the five `auth-*` tests and `route-guard.test.tsx` EXIT 0 (8 suites, 513 tests); `gates.log` EXIT 0 (0 fail, 18 warn, 0 accepted); `baseline.log` EXIT 0; `tasks.log` EXIT 0 (443 tasks).
