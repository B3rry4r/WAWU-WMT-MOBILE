---
id: RELEASE-02
title: Fix QA defects, re-verify, submit to the stores
owner: YOU
area: RELEASE
order: 300
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: [CHECK-3]
decisions: [R-20, R-24]
passes: []
artboards: []
---
# RELEASE-02 · Fix QA defects, re-verify, submit to the stores

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): CHECK-3.
- **History:** none yet. Reports go to tasks/history/RELEASE-02.md.
- **R2-SOCIAL (25 Oct 2026, Sonnet builder, T2; mobile `wmt/R2-SOCIAL` on `origin/main` `a3fdaf71`; app only, no backend change, no native change, no route added):** the CHECK-3 social defects (audit `audits/CHECK-3/social.md`), status of the task unchanged (todo, the other areas are not in yet).

| # | CHECK-3 defect | Before | After |
|---|---|---|---|
| 1 (high) | I1: no + above the tab bar | never wired: INBOX-04 gave "the + button" to INBOX-19, which read it as a new-message compose with no person picker (G-882) and drew none. The board's + is the shared Create button (kit.js `Fab`, R-38) that Home, Explore and Me draw through `CreateEntry` | the Inbox tab draws it for creator accounts over every chip, opening Create; a fan sees none, as on Home, Explore and Me |
| 2 (med) | H22, I33: `wawuafrica.com/...` where the boards write `wawu/c/...` | shown as the real link | REPORTED, no change: nothing the Hub serves opens `wawu/c/<slug>` (G-R2S-1); the shared link stays the one that opens |
| 3 (med) | Explore "Who Made This?" empty | the rail read only the admin-featured list, empty until someone is featured | nobody featured: the rail is the first of All creators (what See all opens); featured creators still lead; empty only if both are |
| 4 (low) | H14, E3 "Bank charge / Total", E3 "Pay · ₦5,000", H14 no thumbnail | a zero fee drew a ₦0 charge line | REVERSED by R2-SOCIAL2 item 1 (BRIEF rules 3 and 4: "No fee" is never drawn): H14 and E3 draw the charge, WAWU's fee where there is one, then the Total, also when a part is ₦0. Kept: E3 button "Pay ₦X" with no dot (the board and BRIEF E3 draw it so), H14 thumbnail when the preview is a picture (a clip has none, G-1724) |
| 5 (low) | detail heart under H19, H20, H24, H25 | the like count | "N% liked" from the Hub's `ratingPct` when the piece has one, else the like count |
| 6 (low) | X5 "People are searching", X10 "Closest things we have" | not seen on the audit stack | NOT A DEFECT: both are built (`/search/popular`, empty until three people search the same thing; `/search/closest`) and tested; the stack had no data |
| 7 (low) | I32, I33 copy lines | both missing | I33: written from `GET /communities/message-cost` (R-62). I32: not drawn, no route serves the host's share (G-INBOX-14-1) |
| 8 (low) | E7 brightness caption | held back, `expo-brightness` "not installed" | it is (package.json); the screen goes to full brightness while a valid ticket is open and back after; the caption shows on a phone, not on the web |

Tests that pinned the old behaviour and were updated (the item names the defect, so it is the ruling): `buyTickets.test.tsx` `payButton` matched `Pay · `, now `Pay ₦` (kept in round 2: the no-dot button is the board's and BRIEF E3's, not part of the "No fee" copy); `screens.test.tsx` and `slider.test.tsx` answer the All creators page the rail now reads when nobody is featured.

- **R2-SOCIAL2 (25 Oct 2026, Sonnet builder, T2; mobile `wmt/R2-SOCIAL` on `06da5ad0`; app only, no backend change, no native change, no route added; second pass audit `audits/CHECK-3/social-p2.md`):**

| # | Item | Before | After |
|---|---|---|---|
| 1 | revert round 1 (d) | `noFee` on the shared pay sheet drew "Fee: No fee" for a zero fee | removed from `PaySheet`, `BuySheets`, `UnlockSheets` and their tests: the fee is its parts then the Total, a ₦0 part drawn as ₦0, and the paying button carries the total (rule 5); tests that pinned "No fee" now pin the breakdown at ₦0 and with a fee. `actionJoin: 'space'` stays: BRIEF E3 writes the button "Pay ₦7,515.75" |
| 2 (high) | I1, I20, I24: a fan's Inbox has no + and no header icons | creators get the settings and compose buttons and the + (Create) | NO CHANGE, reported (G-882). The boards' own Start-here map names the three: Settings opens I21 (paid messages, a creator's), Compose "New message or community" opens I32 ("Creator accounts only"), and the + is the shared Create button (kit.js `Fab`), which R-38 gives to creator accounts only (as on Home, Explore and Me). For a fan the only thing left is a new-message compose: the Hub can start a chat with a chosen person (`POST /chats {wawuId}`, `GET /search/people`), but no board draws the person picker, so a fan's compose would be a screen invented here (G-882, R-47). Unblocked by: the designer drawing the picker |
| 3a (med) | E25 call-off sheet | "The 1 buyer gets their money back." / "All N buyers get their money back." | "The 1 buyer gets the ticket price back." / "All N buyers get the ticket price back." (BRIEF E25, rule 6); the count-unknown line likewise. `organiser.test.tsx` pinned the old words: updated, the audit names the defect |
| 3b (med) | I4, I5 held-money card | "... and all of it comes back to your wallet." | "... and it comes back to your wallet." (the board; rule 6). `model.test.ts` and `askFlow.test.tsx` pinned the old words: updated |
| 3c (med) | E11 order page of a called-off event | "Your payment didn't go through" with the Hub's reason | a failed (refunded) order, or a paid one whose tickets are all void, reads the event (`cancelledAt`); when it was called off the page draws the ticket page's banner "This event was called off" with what came back ("₦7,500 is back in your Naira wallet.", or on its way); the Hub's own reason when no return record came. A failed order of an event still on keeps "Your payment didn't go through"; if the event cannot be read the old words stand |
| 4 | the 10 lows | see the list below | 14 and 15 built; the rest need a ruling or a Hub change |

The ten lows of `social-p2.md` (numbers as in the audit): **6** H33 "Ads keep TGIF free": not drawn, G-760 (a promise nothing backs), needs the owner. **7** X11: "People are searching" and "Creators to know" are built in `SearchScreen` and draw when the Hub has popular searches or creators to know (the audit's stack had none); no change. **8** H6 audio cover: the Hub's feed item has no cover field (G-218); needs a Hub change. **9** I12 "...": no board draws the menu (G-882); needs the designer. **10** I2 profile: the built visitor profile is the M5 layout (cover, left aligned) and carries both the paid "Message · ₦1,500" and the free chat button "Message Bisi" (R-13); the I2 board draws only the paid one on a centred head; needs a ruling on the two buttons. **11** I34 Join requests: no route makes a request (private rooms are paid to join); needs a ruling. **12** failure states after about 15 s: the shared client retries network and server errors (`src/api/query.ts`, fenced); needs a SHARED-CHANGES row and a ruling on the retry count. **13** white page on a cold web start: web build only, a phone shows its splash; no change. **14** credits: "WAWU Credits" is the name (R-37 keeps it, DECISIONS "where WAWU stays"), so the board's "Who Made This? Credits" is not followed; I28 now draws the board's line "A photo is 1 credit, a video or voice note 3." from `GET /communities/message-cost`, above the packs, once the costs are read. **15** E11 ticket: the whole card is greyed (the board's .45) for a void ticket of a called-off event; the QR stays hidden (the board draws it greyed; a ticket that cannot be used shows no code, and existing tests pin that), Default (lead), owner may override.

Seen and not mine: the wallet's FX screens and receipts still print "No fee" for a zero WAWU or network fee (`src/features/wallet/fx`), which BRIEF rule 4 forbids; that is the money area's.

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. Each CHECK-3 defect is fixed by the owner of that feature and re-verified by a different session; then the Android app is submitted to Google Play (R-24; iOS is RELEASE-03). Review time is the stores' decision, typically one to three days.

## Scope

Fixes for CHECK-3 defects only, each re-verified. Money launches with the app (R-20).

## Capability checks

- [ ] Every CHECK-3 defect is fixed and re-verified.
- [ ] The Android app is submitted to Google Play with the final build.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

**R2-SOCIAL lean T2 check (25 Oct 2026, Sonnet verifier; built none of it). Branch `wmt/R2-SOCIAL` `cd128c30` against `origin/main` `a3fdaf71`. Verdict: PASS (merge). No blocker, high or medium.**

Method: local stack (Hub on the Nuvion stand-in, mock WAWU ID, ports 9070 to 9079, no Fintava, no live host), web export of the branch, Chromium 390x844 dark. Seeded: a creator (@chidi), a fan with a funded wallet (ADA, 5,000,000 kobo, PIN set), three live priced pieces (template 96% rated, video 96% rated, template unrated), a published event with a Regular ticket at 7,500, an open community, three people searching the same word. Pictures in the verifier's scratchpad folder `v-r2-social/`.

| Check | Result | Evidence |
|---|---|---|
| I1 + for a creator, none for a fan | passed | creator: the + draws over All, Paid DMs, Communities and Money, same place and size as the board, and a tap opens `/create`; fan: 0 Create buttons on All, Communities and Money (`I1-creator-dark.png`, `I1-creator-light.png`, `I1-fan-dark.png`, `I1-plus-opens.png`) |
| Explore rail, nobody featured | passed | `featured-creators` answered empty, `explore/creators?page=1` was read, the rail shows @chidi with Follow, no "No creators to suggest yet" (`X1-explore-nobody-featured.png`) |
| H14, zero fee | passed | Price, Yours, "Fee: No fee", no Total, "Unlock · ₦1,500", thumbnail from a picture preview; matches the board (`H14-template-nofee.png`) |
| E3, zero fee | passed | Tickets ₦7,500, "Fee: No fee", Total ₦7,500, "Pay ₦7,500"; matches the board (`E3-pay-nofee.png`) |
| H14 and E3 with a fee | passed (sheet only) | Hub restarted with a ₦15.75 book fee: H14 "Bank charge ₦15.75, Total ₦2,515.75, Unlock · ₦2,515.75"; E3 "Bank charge ₦15.75, Total ₦7,515.75, Pay ₦7,515.75"; "No fee" never drawn (`H14-*-fee.png`, `E3-pay-fee.png`) |
| Detail heart | passed | "96% liked" on a piece with `ratingPct` 96 (`H19-c1-detail.png`); the unrated piece shows its like count (7) |
| I33 line | passed | "Chat and reading are free. Credits are for photos, video and voice notes." and `GET /communities/message-cost` answers text 0, photo 1, video 3, voice 3, so every word is backed (`I33-created.png`) |
| E7 ticket (web) | passed | ticket and QR drawn, no brightness caption on the web, as ruled (`E7-ticket-nofee.png`) |
| Money truth | passed | one wallet debit per pay: ₦1,500 unlock took the wallet 5,000,000 to 4,850,000 kobo (one `POST /unlock/wallet`), the ₦7,500 ticket took it to 4,100,000 (one `POST /orders/wallet/pay`, one paid order, one ticket). The extra EventOrder row is the quote of a look-only run, status pending, never charged. "No fee" only when the parts sum to 0 (`feesTotalKobo`), total is price plus the quote's parts, so the button equals the amount charged |
| X5 "People are searching", X10 "Closest things we have" | passed with data | three people searching "business" gives "PEOPLE ARE SEARCHING: business"; a no-result query "pricing zzz" gives "CLOSEST THINGS WE HAVE: Pricing playbook template" (`X5-search.png`, `X10-noresults.png`). Ruling (f) confirmed: built, needed data |
| Changed tests | passed | `buyTickets.test.tsx`: `payButton` `/^Pay · /` to `/^Pay ₦/` (the new copy) and the fee constant read from a field that still defaults to 1575; `screens.test.tsx` and `slider.test.tsx`: only add an answer for the All creators page the rail now reads. No assertion weakened; new tests added beside them |
| tsc | EXIT 0 | |
| jest, route-guard and the touched folders (pay-sheet, communities, community-host, content-detail, events, explore, inbox, unlock), maxWorkers 2, once | EXIT 0 | 56 suites, 1224 tests, all passed |
| gates | EXIT 0 | 10 gates, 1415 files, 0 fail, 18 warn; main is 1412 files, 0 fail, 18 warn (same); baseline check EXIT 0 |
| check_tasks | EXIT 0 | 443 tasks |
| native fingerprint | unchanged | `fingerprint:generate --platform android` is `17ffb13d520882bf144982b61d03f3994c6e40e4` on this branch and on main (default `b9901c63...`, iOS `496a3ee0...`, also equal) |

Rulings:
- (b) the link form kept as a real link: agree. `wawu/c/<slug>` has no scheme or host, so no chat app makes it tappable and nothing resolves a content slug; LINKS-01 A3 already ruled the bare label broken. differs-for-recorded-reason (G-R2S-1, owner for a short link host).
- (f) X5 and X10 built, needed data: confirmed above.
- I32 not drawn: right. No route serves the host's share (G-INBOX-14-1); R-47.

Findings (all low, no round needed):
1. low, differs-for-recorded-reason (G-1724): H14 for a video piece has no thumbnail (the quote carries no cover and a video preview is a clip); the head is the words alone, with no empty square. The board draws one. Reproduce: unlock sheet on the seeded video (`H14-video-nofee.png`).
2. low, NOT RUN: with a fee the sheets were captured but not paid. The stand-in keeps its fee at 0 unless it restarts (and loses its balances), so the Hub's ₦15.75 quote could not be paid against a matching debit. The pay path is the same code with or without a fee (total from the quote's parts), and the new PaySheet and buyTickets tests cover both.
3. low, NOT RUN: E7's brightness raise and caption on a phone (web has neither by design; `brightness.test.ts` covers the call order and the put-back). A phone is the lead's V10.
4. low, NOT RUN: "96% liked" moving after a new rating. `PUT /content/{id}/rating` answered 403 "Only people who bought this can rate it." for a piece the fan had not bought, and the fan bought the other piece only; the invalidate after a rating is covered by a unit test, not seen live.
5. test-gap note: the I33 line is tested for text cost 0 and above 0 in `memberCostLine`; no test mounts the screen while the cost read fails (it then shows only the first sentence, which is correct on reading the code).

Cleanup: stack down, my own Hub restart, the picture server and three worktrees removed; nothing of mine left listening on 9070 to 9089.

## Owner sign-off

_Owner: date, and "go" or what blocks it._

## Verifier report: R2-SOCIAL2 (v-R2-SOCIAL2, 25 Oct 2026, lean T2; checked `wmt/R2-SOCIAL` 56c6e642 against `origin/main` a3fdaf71, change since the last check 06da5ad0..56c6e642)

**Verdict: FIX.** One medium (E11 order page, below). Nothing else medium or worse. Stack: backend `origin/main` dcee8af on the Nuvion stand-in, mock WAWU ID, web export of 56c6e642, Chromium 390x844, light and dark. Data through the Hub's own routes (SQL only for the creator tier, "live" on the content piece and "published" on the events, as the audit did for the admin approval).

| Check | Result | Evidence |
|---|---|---|
| tsc | EXIT 0 | |
| jest (pay-sheet, communities, credits, events, paid-ask, unlock, route-guard; maxWorkers 2, once) | EXIT 0 | 42 suites, 1043 tests, 0 failed |
| gates | EXIT 0 | 10 gates, 1415 files, 0 fail, 18 warn, baseline check EXIT 0 (0 entries) |
| check_tasks | EXIT 0 | 443 tasks |
| fingerprint | NOT RUN | `fingerprint:generate` was not run here (steps); the diff touches no native file, `app.json` or `package.json`, so the builder's `17ffb13d...` is expected to hold |
| H14 and E3, fee ₦0 | passed | H14 "Price ₦2,500 / Bank charge ₦0 / Total ₦2,500", button "Unlock · ₦2,500"; E3 "Tickets ₦5,000 / Bank charge ₦0 / Total ₦5,000", button "Pay ₦5,000"; PIN sheets "Approve ₦2,500" and "Approve ₦5,000"; no "No fee" (light and dark) |
| H14 and E3, fee ₦23.25 (stack restarted with a book fee of 2325 kobo) | passed | E3 "Bank charge ₦23.25 / Total ₦5,023.25", PIN "Approve ₦5,023.25 to WAWU Creators Summit"; H14 charged 2,523.25 |
| Money truth | passed | one debit per pay. Fee 0: wallet 5,000,000 to 4,250,000 kobo after an order of 7,500 and a ticket of 5,000 and an unlock of 2,500 (exact). Fee 2325: 5,000,000 to 4,245,350 = 252,325 (unlock) + 502,325 (ticket), exact, nothing twice |
| E25 call-off sheet | passed | "The 1 buyer gets the ticket price back." (light and dark); only the 1-buyer line seen, the N-buyers line is covered by the unit test only |
| I28 credit cost line | passed | "A photo is 1 credit, a video or voice note 3." drawn from `GET /communities/message-cost` (costs 1, 3, 3), above "Credits don't expire...", then packs, "Bank charge ₦0.00 / Total ₦1,000.00", button "Buy 120 credits · ₦1,000" |
| E11 order page of a called-off event | FAILED | defect 1 |
| E11 greyed ticket card | NOT RUN | a refunded order leaves no ticket on the Hub (`tickets: []`), so no void ticket of a called-off event could be opened; covered by the unit test only |
| I4/I5 held-money line | NOT RUN in the app | the ask sheet opens (I3), the paid question was not sent (steps); the copy change is in `paid-ask/model.ts` and pinned by `model.test.ts` and `askFlow.test.tsx` |

**Findings**

1. **medium, defect: E11 order page of a called-off event still says "Your payment didn't go through"** (audit defect 4 is not fixed against the real Hub). `src/features/events/OrderTicketScreen.tsx` (event read `useQuery({ queryFn: () => fetchEvent(orderEventId) ... retry: false })`, about line 87, and `calledOff` on the next lines). After the host calls an event off, `GET /events/{id}` answers the fan 404 "Event not found." (checked with the buyer's token), so `calledOff` stays false and the old banner stands. Repro: fan buys a ticket from the wallet, host `POST /events/{id}/cancel`, fan opens `/events/orders/<orderId>`: red "Your payment didn't go through. This event can no longer take place. Your money is back in your wallet." (order is `status failed`, `returned.returnedKobo 750000`, `failureReason` as quoted). Why the tests miss it: `buyTickets.test.tsx` answers `GET /events/:id` for the fan with a called-off event, which the Hub never does. Fix: read the call-off from what the Hub serves a buyer (an additive `cancelledAt` on the order's `event` block, or treat a failed order with `returned` and the Hub's call-off reason as called off) and pin it with the Hub's 404.
2. **low, outside this task (reported, as the builder said): "No fee" is still drawn under `src/features/wallet/fx`**, which BRIEF rule 4 forbids: `FxReceiptScreen.tsx:46,47,60,61`, `CryptoSendScreen.tsx:324,348`, `swap/model.ts:71,84,86` (pinned by `fxModel.test.ts:144,145,170,177`, `fxSwapFlow.test.tsx:117`, `fxCryptoFlow.test.tsx:172`). Nothing else under `src/features` draws it (the other grep hits are comments, tests of the removal, or a refusal key `cards/model.ts:38` that reads "Cards are not ready yet."). Also `features/addmoney/AddMoneyScreen.tsx:196` draws a "Free" pill when the transfer-in fee is 0 (the same claim in another word); the money area's to rule.
3. **note:** the order-page void-ticket branch (`allVoid`) draws the greyed card nowhere (`TicketCard` there has no `dimmed`), only the ticket page does; follow the unit test with the same rule if the owner wants it.

**Changed or removed assertions in 06da5ad0..56c6e642** (each follows a BRIEF rule or an audit defect; none weakened):
- `PaySheet.test.tsx`: the whole round 1 "(d)" describe (H14 and E3 "No fee", the `noFee` option, "a caller that does not ask keeps the old rows", "the send form never says No fee") removed with the `noFee` prop (BRIEF rules 3 and 4); replaced by tests that pin the breakdown at ₦0 and with a fee and `queryByText('No fee')` null.
- `unlockFlow.test.tsx` and `buyTickets.test.tsx`: the "a quote with no fee reads Fee: No fee" tests replaced by the breakdown tests (rules 3 to 5); the `eventRow` handler and `orderView` plumbing changed for the E11 read (see finding 1: that mock is what hides the defect).
- `organiser.test.tsx`: five "their money back" strings to "the ticket price back" (audit defect 2, BRIEF E25 and rule 6).
- `model.test.ts`, `askFlow.test.tsx`: "and all of it comes back" to "and it comes back" (audit defect 3, rule 6).
- `format.test.ts`, `buyCredits.test.tsx`: additions only.

**Rulings**
- HIGH I1, I20, I24 left undrawn for a fan: agree. The board's own Start-here map (Inbox Flow) says Compose "New message or community" opens I32, whose only drawn content is "New community ... Creator accounts only"; no board draws a person picker for a new message; the + is the shared Create button (R-38, creator accounts only, as on Home, Explore and Me); Settings opens I21, a creator's paid messages. A fan's version would be invented here (R-47).
- QR hidden on a void ticket (Default (lead)): agree for the ticket page (a code that cannot be used is not shown); the board draws it greyed, so this stays a recorded difference the owner can override. Not seen in the app (finding list, NOT RUN).
- Lows 6, 8 to 12 left as gaps: agree. 6 (a promise nothing backs), 8 (Hub field missing), 9 (no board), 10 (two buttons need a ruling), 11 (no route), 12 (shared client, fenced). Not re-tested in the app.
