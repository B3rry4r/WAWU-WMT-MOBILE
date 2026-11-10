# WEBAPP-09 · round history

Moved out of [tasks/WEBAPP-09.md](../WEBAPP-09.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/shell/startHref.tsx` (new), `src/app/_layout.tsx`, `src/app/r/[code].tsx`, `src/features/shell/LeaveDevRoute.tsx`, `src/features/bills/webGuard.tsx`, `src/app/tiers.tsx`, `src/features/verify/TiersScreen.tsx`, `src/features/verify/CheckoutScreen.tsx`, `src/features/feedpay/payCall.ts`, `usePaymentFlow.ts`, `src/features/store/webwallet/api.ts`, `useWebBuy.web.tsx`, `src/features/paid-answers/PaidThreadScreen.tsx`, `src/features/communities/RoomScreen.tsx`, SHARED-CHANGES.md; tests listed in the history. No Hub change.
- **W1 done.** One cause: Home (`/`) sits behind the sign-up steps, and four places redirected to it. The root layout now hands down the step the person has not finished (`startHref`); an invite link, a bills address and any unknown address lead there. Walked: person at /interests, then /r/ADA, /join, /bills, /bills/airtime, /zzz, /r/!!bad all land on /interests; /r/BOLA also wrote the PersonReferral row. Tests: midSignupLinks (3 route kinds x 2 steps + finished + guest + claim).
- **W2 done.** Cause: the Close did `replace('/')`, which goes nowhere while the tier offer is still up in a new tab. Cold on the web the screen now puts the person's step (Home, or the offer) under the sheet and pushes the sheet on top; the tiers route is a transparent modal on the web so that page shows behind; the highest tier has a Close. Walked: dollar person and highest-tier person, cold, reload, new tab with the offer pending (Close leads to the offer, its Close to Home). Tests: tiersCold, webWallet09.
- **W3 done.** The sheet reads the Hub's `grant.totalPoints` (pack plus bonus). Walked: 3,025 for a Founding Maker's 2,750 pack. A Hub answer with no grant says "Points added" and no number.
- **W4 done.** `payment_in_progress` now carries the open payment's id; the web hook reads it and, when it is the same pack or tier, shows it paid. A different purchase is not taken for it. Walked with two tabs whose posts were released together: tab 2 got 409, both tabs say "1,100 points added", the balance rose once.
- **W5 done.** The upgrade row shows the quote's total as the button does (walked: row, button and pay sheet all N7,000; a first purchase still shows the list price).
- **W6 done.** Enter sends, Shift+Enter a new line, not while composing. Walked as the creator: one reply of two lines.
- **W7 ruled and worded.** The Hub lets only members read a room (403 before Join is its rule). The page now says to join first and that joining and reading are free. The console 403 stays (it is how the screen learns the person is not a member).
- Walk detail: the stack ran over plain http on localhost (a secure context) with vercel.json's headers, hosts swapped to the stack; the container restarted once mid-task and the fixtures were rebuilt.
- Checks: `npm run check` EXIT 0 before and after (521 suites). No assertion changed; one lint error in my own new test fixed.
- NOT RUN: Safari and Firefox; the phone (jest only); a real store; dollar person's tier purchase (not sold on the web).

## Verifier report

### T1 verifier report (10 Nov 2026), branch wmt/WEBAPP-09 head e4d53cc, Hub main 7dd5b22, stack ver09 (ports 16040-16059)

**Verdict: MERGE.** No blocker, high or medium. 3 lows. `npm run check` EXIT 0 (521 suites, 7761 passed, 5 skipped; gates 0 fail, 17 warn, 1690 files scanned).

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | /tmp/wmt-09v/check.log |
| V5 | passed | 48 built captures (390 and 1440, light and dark) + 4 W4 two-tab sets, beside boards VF5a, VF5b, VF6, PT4c, I10, I24; contact sheets in /tmp/wmt-shots/webapp-09v/sheets (all looked at) |
| V6, V7 | passed | rows below |
| V9 | passed | real wawu-id sign-in, mailed codes typed, values only the Hub could give (3,025 points, 409 paymentId) |
| V4 | passed | money results below |

**Rows (web export in Chromium, behind vercel.json's headers with the two hosts swapped, own TMPDIR export, one React, stack hosts baked)**
- W1 PASS. Mid-sign-up people (tier offer, interests, people-to-follow, creator-setup, verify-bonus, claim-offer consumed to the next step) opened /r/STEP, /join, /bills, /bills/airtime, /zzz-nothing, /r/!!bad: every one lands on the person's own step, 0 blank pages (41 route opens, bodies 123 to 433 chars). /r/STEP still claims: PersonReferral rows written for the mid-sign-up people. Finished account (same session): every route goes Home. Guest: every route goes /welcome. Diff read of `_layout.tsx` (SHARED-CHANGES WEBAPP-09 #1): one import, one context provider around the Stack, `TIERS_SHEET` is undefined off the web so the phone keeps its own; /r, bills guard, LeaveDevRoute give the same address as before for a finished account; /tiers cold logic is `Platform.OS==='web'` only. Full jest (521 suites) green incl. midSignupLinks, tiersCold. Android jest preset cannot run here (known).
- W2 PASS. Dollar person (mid-sign-up and finished) and highest-tier person: /tiers cold, reload, new tab: Close always leaves (dollar: to the offer, then Home; highest: Home), a page (Home or the pending step) shows behind the sheet at 390 and 1440, light and dark.
- W3 PASS. Founding Maker, 2,750 pack: "3,025 points added", balance 600 to 3,625 (Hub PointLedger).
- W4 PASS. Same pack, two tabs, both POSTs released together (run 4 times, tab 2 lost the race 3 times and tab 1 once): one charge each time, both tabs "1,100 points added", same balance. Different packs in two tabs: both bought (two real purchases, each tab shows its own: 1,100 and 6,600). A second tab whose 409 names another purchase (injected 409 with the id of an earlier pack-s purchase while buying pack l): "Still confirming", not paid, no charge.
- W5 PASS. Upgrade row, button and pay sheet all N7,000; one upgrade charged 700,000 kobo.
- W6 PASS. Shift+Enter gave "line1\nline2", Enter sent one two-line reply (creator, paid question); diff is `Platform.OS==='web'` gated.
- W7 PASS. Before Join the page says "Join to read and write here. Joining is free, and so is reading."; Hub: GET messages for a non-member is 403 "Join this community to read or post in it." (community-message.service assertMember); joining an open room is free; reading costs nothing.

**Money (Hub ledger = Nuvion stand-in), user a09, N300,000 start**: tier Verify -299,900; upgrade to Founding -700,000; points pack m -250,000 (+3,025); pack s -100,000 (two tabs, one charge) then 3 more single-charge two-tab runs and 4 button purchases for the pictures, -100,000 each; different packs -100,000 and -500,000; credits (double-tapped Buy) -100,000, 1 POST, 120 credits; community pass (double-tapped) -100,000, 1 POST, 1 pass row; paid question -50,000 held. Hub out total 2,899,900, stand-in balance 27,100,100 = 30,000,000 - 2,899,900. Second user b09: tier -299,900, ledger = stand-in.

**Findings (all low, none block)**
1. LOW test-gap: W4's "different purchase named by the 409" case cannot happen on this Hub (it lets different packs run side by side), so I proved it with an injected 409; the builder's unit test covers the same. 
2. LOW unclear: W5's checkout row shows nothing until the quote has come, and nothing at all if the quote fails (the quote's 409 after an upgrade shows as a red console line, already known); not walked with the quote failing.
3. LOW: closing /tiers cold for a person who has not finished the offer shows the tier offer again (their pending step) before Home; intended by the builder, a second Close is needed.

**Pictures**: 48 built captures (led-on /r and /join, dollar sheet cold, highest sheet cold, checkout upgrade row and pay sheet, room before Join, paid-reply composer, points-added sheet, points pick; each at 390 L, 390 D, 1440 L, 1440 D) plus 12 W4 two-tab captures (tab 1 and 2 at 390 L/D, 1440 L/D), 183 files in all in /tmp/wmt-shots/webapp-09v. All 390 and 1440 sheets looked at one by one. Differences from boards are the web wallet's pay sheet (R-128, no Pay-with list, "Done" for "Back to AI tools"), and the room/led-on screens have no board of their own (I24/I10 shown for the room and thread; the interests step has none).

**NOT RUN**: needsEmail and needsIdentity steps (not reachable through the UI); base-branch before/after of the blank page (taken from walk 2); Safari, Firefox; android jest preset; real phone; card-fee history (Hub task).


## Tests changed or added
Added: `src/__tests__/midSignupLinks.test.tsx` (13), `src/__tests__/tiersCold.test.tsx` (4), `src/features/store/__tests__/webWallet09.test.tsx` (9: W2 highest-tier Close, W3, W4, W5), W6 (3) appended to `paid-answers/__tests__/paidAnswers.test.tsx`. Edited: one added assertion (the room's join words, W7) in `communities/__tests__/RoomScreen.test.tsx`. No existing assertion changed.

## Pictures
/tmp/wmt-shots/webapp-09/: tiers-dollar-cold-sheet, tiers-highest-cold-sheet, checkout-upgrade-row and -paysheet, points-added-sheet, paid-reply-composer, room-not-member, led-on-r-code and -join; each `-p-l`, `-p-d` (390 light, dark), `-l-l`, `-l-d` (1440). Boards beside them in boards/ (VF5a, VF5b, VF6, PT4c, I10, I24; the dollar sheet, the highest-tier sheet and the not-member room are not on a board). The W4 two-tab pictures are `w4-tab1-*` and `w4-tab2-*`.
