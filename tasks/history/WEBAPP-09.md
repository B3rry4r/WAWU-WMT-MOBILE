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


## Tests changed or added
Added: `src/__tests__/midSignupLinks.test.tsx` (13), `src/__tests__/tiersCold.test.tsx` (4), `src/features/store/__tests__/webWallet09.test.tsx` (9: W2 highest-tier Close, W3, W4, W5), W6 (3) appended to `paid-answers/__tests__/paidAnswers.test.tsx`. Edited: one added assertion (the room's join words, W7) in `communities/__tests__/RoomScreen.test.tsx`. No existing assertion changed.

## Pictures
/tmp/wmt-shots/webapp-09/: tiers-dollar-cold-sheet, tiers-highest-cold-sheet, checkout-upgrade-row and -paysheet, points-added-sheet, paid-reply-composer, room-not-member, led-on-r-code and -join; each `-p-l`, `-p-d` (390 light, dark), `-l-l`, `-l-d` (1440). Boards beside them in boards/ (VF5a, VF5b, VF6, PT4c, I10, I24; the dollar sheet, the highest-tier sheet and the not-member room are not on a board). The W4 two-tab pictures are `w4-tab1-*` and `w4-tab2-*`.
