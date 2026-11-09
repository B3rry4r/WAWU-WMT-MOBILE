# WEBAPP-05 · round history

Moved out of [tasks/WEBAPP-05.md](../WEBAPP-05.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/components/pin-sheet/useKeypadKeys.ts` (new), `Keypad.tsx`, `src/components/amount-entry/AmountKeypad.tsx`, `src/features/send/AmountScreen.tsx` (Enter = Continue), `src/features/open-wallet/api/hostedPage.ts` (new), `liveness.ts`, `HostedSelfieScreen.tsx`. The two keypad files are in the fenced `src/components/**` but the ticket's scope names them; no shared-change row.
- Keys: only the keypad mounted last listens (a screen left open under a sheet hears nothing); it takes every digit, Backspace, Delete and Enter and Space (so a button left focused behind the sheet is never pressed; that button is blurred when the keypad opens) even while locked or checking, and ignores Ctrl/Alt/Meta keys and a held key. The amount keypad leaves a focused text field (the note) its own keys. No input element exists, so the PIN is never in the DOM; nothing is logged.
- Tests: `src/components/pin-sheet/__tests__/laptopKeys.test.tsx` (8: type 1234 submits once with 1234; held key and a fifth digit; wrong PIN five times locks and later keys are swallowed; focus; PIN not in the tree or console; a sheet over a keypad; amount keys; no listener on android) and one case in `hostedSelfie.test.tsx` (web: same tab, `https://usewmt.com/selfie`, no Linking).
- Stack proof (real Hub, Nuvion stand-in): wrong PIN x5 -> 403 pin_incorrect (4,3,2,1 left) then 423 pin_locked on the fifth; the right PIN afterwards is still 423; balance unchanged (5,000,000 kobo). In a real Chromium on the stack web export, typing 4829 on the keyboard filled the dots and paid.
- Checks: tsc EXIT 0; eslint on 24 changed files EXIT 0; gates 0 fail; jest of 77 suites in the touched areas EXIT 0 (1192 passed, 5 skipped); laptopKeys 8 passed; hostedSelfie 38 passed.
- Gaps: none filed; no Hub change.

- Pictures: 40 of 40 taken (10 states x dark and light x 390 and 1440) on the stack web export, into /tmp/wmt-shots/webapp05/ (no artboard exists for these states: the tasks list none, so there is no picture beside an artboard; the pay sheet is the shared one). Money proofs: /tmp/wmt-shots/webapp05/money-proofs.txt.

## Verifier report

## Verifier report

Verifier: separate session, own stack `vwebapp05` (Hub + Nuvion stand-in + mobile web export of head 0078e0e), 9 Nov 2026. Verdict: **FIX** (1 high, 2 medium). Pictures: /tmp/wmt-shots/v-webapp05/ (artboards in art/).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | tsc EXIT 0; jest 99 suites, 1532 passed, 5 skipped, EXIT 0 (store, pin-sheet, open-wallet, bills, home, wallet/home, send, verify, points, credits, community-pass, amount-entry); eslint on changed files EXIT 0; gates 10 run, 1659 files scanned, 0 fail, 17 warn; baseline check EXIT 0 |
| V2 | passed | every route used answered per contract; wrong format: body with priceKobo/currency/packId unknown, unknown pack, missing quoteToken all 400; wrong quote 409 quote_changed |
| V3 | passed (no Hub change) | the branch touches no wawu-backend file; every wallet route pre-existed |
| V4 | passed | tier price/points/days from GET /plans reach tier-offer, checkout, pay sheet, tier-done (100 points, 4 products, 12 months) and the Hub's grant; points 2,750 added, balance 2,850; pass 200,000 shown as 2,000 |
| V6 | passed with finding F1 | states reached through real causes: review, not enough (short wallet), wrong PIN 1 to 4 left, locked, still confirming (stand-in hold), failed (stand-in fail, refund), paid, pass joined |
| V7 | passed with F1, F2 | tierless (tier-offer, buy, grant), tier holder (renew/upgrade by API; /tiers UI NOT RUN), no wallet person (Gina: signed in, hit your-details; wallet entry NOT RUN) |
| V8 | passed (see numbers) | /tmp/v5/*.out (a1,a2,a3,b1,p1) |
| V9 | passed | real sign-in through /sign-in on the stack, no injected token; tier-offer showed the Hub's 2,999 / 5,999 / 9,999 |

V8 numbers (kobo; ledger = Hub balance equals stand-in balance after every step, always EQUAL):
- Tier Verify 299,900: 6 parallel same key gave 1 paid, 5 idempotency_in_progress; debit 299,900 once; replay same key 201 Idempotent-Replayed true, extra 0; same body new key 409 target_not_payable; fresh quote while held 409 "already have a plan".
- Renew 299,900 once (3 parallel same key: 1 paid). Upgrade verify to plus 300,000 once; again 409. Points granted once: 100 (tier) then plus tier 300, packs 2 x 1,000: 2,400 total.
- Points pack 100,000: 4 parallel different keys same quote gave 1 paid, 3 payment_in_progress, +1,000 points once; 4 parallel same key 1 paid, replay extra 0, +1,000.
- Credits starter 50,000: 5 parallel same key 1 paid, replay extra 0, +50 credits once. A new key on the same quote buys a second pack (by design, debit 50,000 more).
- Community pass 200,000 (end to end, seeded private room): 4 parallel same key 1 paid, replay extra 0, member active, buyer debit 200,000, host +170,000 (85%) for the first; UI walk in the browser dark (F) and light (I): one POST, one debit, "You're in".
- Tampered: bad signature, forged payload (price 100), expectedTotal 1 and total+1: 409 quote_changed, debit 0. No quoteToken 400. Client priceKobo/amountKobo/currency/points: 400, debit 0. Pack swap and kind swap with another quote: 409.
- Short balance (wallet 100,000 vs 299,900): quote shows shortfall 199,900; 3 parallel pays 402 insufficient_funds with the same figures; balance unchanged; no tier.
- PIN: 4 wrong = 403 (4,3,2,1 left), 5th = 423 pin_locked, then the right PIN 423 three more times (API and browser), debit 0, points 0. Held transfer: browser "Still confirming", then settled paid once; failed transfer: "Payment did not go through. No money left your wallet", balance back to 20,000,000.
- NOT RUN: an expired quote (30 minute TTL, signed token cannot be forged); webhook replay and forgery (no webhook path changed here).

R-86: PASS. `useWebBuy`, `loadWebCatalog` are reached only behind `Platform.OS === 'web' && os === null`; `buy` returns the old store path otherwise; `sheets` is null on a phone; `{web.sheets}` in PassScreen renders null with no open sheet; all store specs pass under the default native platform and the builder's webWallet test replaces Platform to android and ios. Test gap (low): no test asserts `begin` is never called on android.

Keypad (real Chrome, 390 wide): digits, Backspace work on the PIN keypad; Enter and Space swallowed; Tab is trapped in the sheet (Close, 1..9, no button behind); no input element exists in the sheet; document.activeElement stayed in the sheet; PIN never in the DOM (searched for 4829 and typed values), never in a URL or console message (only the X-Transaction-Pin header on the one POST); one POST per attempt. Amount keypad: jest only (laptopKeys.test); the browser run was NOT RUN (/send/amount needs a recipient, budget). Top keypad only: the stacked checkout screen behind did not react.

Hosted selfie: NOT RUN on the stack. The stack was started without STACK_NUVION_LIVENESS=on and a restart would have dropped the seeded people; so the same-tab open and the return to origin/selfie are proven by the builder's jest only (read, not re-run beyond the suite above). No open redirect could be tried; the Hub's allow list (NUVION_LIVENESS_REDIRECT_ORIGINS) is what refuses a foreign origin.

Bills on the web (R-47): no Home card, no Wallet entry, no text "bill" on Home, Wallet or Me; /bills, /bills/number, /bills/items, /bills/review go home; phones unchanged (jest). BUT see F2.

Pictures: 31 state pictures (dark and light where the state allows) taken on the stack at 390 into /tmp/wmt-shots/v-webapp05/, beside artboards VF5, VF6, VF6a, VF6c, VF6d, VF7, PT4, PT4b, PT4c, H15, H17, I28, I29, I30, I27 (art/). The built tier screens differ from VF5/VF6 (tier-offer page and the shared pay sheet instead of the VF6 "Pay with" list): differs-for-recorded-reason (R-86/R-89/R-101, unchanged by this task). NOT RUN pictures: credits pack screens (no entry reached in the budget), /tiers for a holder, locked state in dark with a fresh person (dark locked is H attempt 5).

### Findings
- **F1 high, defect.** "Add" on the web pay sheet is a dead button. `src/features/store/webwallet/useWebBuy.tsx` passes `onAddMoney={() => router.navigate('/wallet')}` (and the same in `useWebBuy`); on the stack, as a person with a short wallet, tapping "Add 1,999" on the checkout sheet leaves the URL and the sheet unchanged (dark and light, 3 s, no console message). The other pay screens use `router.push(addMoneyHref(short))`; `/add-money?amount=1999` opens correctly. Fails WEBAPP-06 check 2 ("the way to add money") and hard rule never a dead button.
- **F2 medium, defect.** The claim "/bills and any bills deep link go home" is false: only `src/app/bills/index.tsx` is guarded. `/bills/airtime`, `/bills/data`, `/bills/cable`, `/bills/electricity` and `/bills/receipt/<id>` still draw the "Pay a bill" screens on the web, whose payment window is not built (R-47). Guard every `src/app/bills/**` route with `billsOffered()`.
- **F3 medium, defect.** The branch commits `node_modules` as a symlink (mode 120000, absolute path /home/user/wawu-wmt-mobile/node_modules; absent on main). Merging it puts a dangling link in the repo root. Remove it from the branch.
- F4 low: on the pay sheet the pass button reads "Buy" while the page's reads "Join"/"Renew"; Enter and Space do nothing on a focused keypad key or Close (a keyboard-only person must click); no test pins that `begin` is never called on android.
- F5 unclear (Hub, not this branch): on the stack 3 of 4 community pass payments show payeeSettledAt null (host paid 170,000 of 680,000 expected) 80 minutes later; the payer side is exact and the ledger equals the stand-in. Also: an upgrade after a renew resets the end date (the renewed year is lost), and a new key on the same quote buys again (credits, pass renew). Owner or lead to rule; none is changed by WEBAPP-05/06.
