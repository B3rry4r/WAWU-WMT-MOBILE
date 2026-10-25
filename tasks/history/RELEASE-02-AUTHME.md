# RELEASE-02 · R2-AUTHME: fixes for CHECK-3 area 1 (sign-up, settings, verification, referral, profile)

Built 25 Oct 2026 by a Sonnet builder (T1, app only), mobile `wmt/R2-AUTHME` on `origin/main` `a3fdaf71`. No backend change, no new route file, no native change (fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4` unchanged). Source: `audits/CHECK-3/auth-me.md` on `origin/wmt/CHECK-3-auth-me` (`2ee9b1d1`). Status of RELEASE-02 itself is not changed here (it covers three bundles).

| Finding | Before | After | Proof |
|---|---|---|---|
| D-1 HIGH | /tiers drew the Hub's dollar figures with a naira sign; Continue led to a cedi wallet opening | the currency the Hub gives is drawn with its own sign ($3, $9, $15); Continue says "Paying in dollars isn't open yet" and leads to the Wallet tab to add a dollar account; no checkout, no wallet opened. The Hub takes a plan payment only from the naira wallet (`PAYMENT_CURRENCY`), so there is nothing to pay from: G-R2-AUTHME-1. Renew (VF14) and Add 5 (VF13) use the plans' currency too | `tierCheckout.test.tsx` D-1 (2 cases); picture `tiers-usd`, `tiers-usd-continue` |
| D-2 HIGH | a fan could pay a tier, then "Record my voice" bounced to Home | Default (lead), owner may override: a fan may buy a tier (it opens hosting events and points; no ruling bars it, the Hub sells it), so after paying "Record my voice" is drawn for a creator account only, every other account ends on Done. The voice routes stay creator-only | `tierCheckout.test.tsx` D-2 (creator sees it, fan sees Done); pictures `tier-done-creator`, `tier-done-fan` |
| D-3 MED | Bank transfer row only after Pay was tapped (FIX-55 rule) | row from first paint beside the wallet, wallet chosen. One assertion in `tierCheckout.test.tsx` pinned the old rule ("no transfer card when the wallet covers it") and is updated. Points checkout (PT4) keeps its own rule | picture `checkout` |
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
