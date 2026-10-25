# CHECK-3 audit, area 2, second pass: Home, Explore, Inbox, Communities, Flix, Events

Auditor: a Sonnet session that built none of this (findings only; no code, test, gate or baseline was touched). Mobile origin/main a3fdaf71, backend origin/main dcee8af. App: web export on a local stack (name p2s, ports 9030 to 9040: Hub 9030, app 9033, Nuvion stand-in 9038, mock WAWU ID 9039, storage stand-in 9040), Chromium 390x844, dark theme, each user type, cold start (fresh page with tokens) and resume. Design: `python3 scripts/design/render_design.py --flow` for Home, Explore, Inbox, Flix Movies, Events (all five exit 0). Pictures: audits/CHECK-3/social-p2/ (390 px wide, built screens only; the side by side sheets stayed in the scratchpad).

## Result

First pass left 81 artboards `unverified`. This pass reached **47 of 81**: **43 conforms, 4 differs**. **34 stay unreached** (reasons in the second table). Unbuilt 0.

Data made with the Hub's own routes (and SQL where no route exists): users Bisi (creator, Founding Maker tier, tick, wallet 100,000), Tolu (creator, Verify tier), a second creator with a Plus tier, fans Femi (wallet), Kemi (wallet of 900 naira), Dayo (no wallet), a UK registered person; 7 content pieces with real media (video, photo set, PDF, audio, template, course with lessons) approved through the admin route; 7 events (paid, sold out, free, called off, at the door, in review, sent back) with tickets bought from the wallet, one checked in, one event called off with a refund; an open and a private community with a paid pass and messages; chats with photo and file, 4 money requests (one declined); paid DMs (one answered, two waiting); 3 ad campaigns scheduled live (Today, Explore slider, TGIF card). SQL was used only for: the creator tiers (no route grants one), fan profile handles, one admin user, and the ad artwork address (the route takes only a public https link, so the campaigns were made with a placeholder link and then pointed at the storage stand-in). Uploads went through the storage stand-in (scripts/dev/storage-standin.cjs; it has no CORS headers, so the browser calls were relayed by a Playwright route). The AI assistant and voice key files were not needed: nothing in these six areas calls them.

Corrections to the first pass: its defect 4 (rows read "Bank charge / Total" where boards read "Fee / No fee", and the buttons show the total) is what BRIEF H14, E3 and rule 3 to 5 ask for, so it is not a defect. Its defects 1 (+ button) and 3 (Explore rail empty) are still present on origin/main a3fdaf71.

## Defects

High
1. **I1, I20, I24 Inbox: the + button and the two header icons are missing for a fan.** Boards draw a round + above the tab bar and filter and compose icons at the top right. The built Inbox draws neither (first pass defect 1, still open). Screen `src/app/(tabs)/inbox.tsx`. Repro: sign in as a fan, open Inbox, Money and Communities chips. Pictures: social-p2/i20-money-femi.png, i24-comm-femi.png, i1-femi.png.

Medium
2. **E25 Call it off: refund line promises more than comes back.** Sheet reads "The 1 buyer gets their money back."; BRIEF E25 and R-10 (rule 6) say "All N buyers get the ticket price back". Screen `src/app/events/dashboard/[id].tsx`. Repro: host, event dashboard, Call the event off. Picture: social-p2/e25-calloff-bisi.png.
3. **I4, I5 Waiting for a reply: "all of it comes back".** The amber card reads "Your money is held by Who Made This? No reply by tomorrow 14:14 and all of it comes back to your wallet." The board says "it comes back to your wallet"; BRIEF rule 6 forbids "all of it" because the charge is not returned. Screen `src/app/paid-thread/[wawuId].tsx`. Repro: fan asks a paid question, open the thread. Picture: social-p2/i4-waiting-femi.png.
4. **E11 order page for a called-off event says the payment failed.** Opening `/events/orders/<orderId>` of an order whose event was called off shows a red "Your payment didn't go through. This event can no longer take place. Your money is back in your wallet." The ticket screen of the same purchase says "This event was called off" correctly. Screen `src/app/events/orders/[orderId].tsx`. Repro: buy a ticket, host calls the event off, open the order. Picture: social-p2/e11-off-order-femi.png (ticket: e11-off-ticket-femi.png).
5. **X1 Explore: "Who Made This?" rail reads "No creators to suggest yet"** while Home's rail and Explore > categories list Bisi and Tolu for the same fan (first pass defect 3, still open). Screen `src/app/(tabs)/explore.tsx`. Pictures: social-p2/x16-explore-ad-femi.png, x17-noevents-ad-femi.png, h33-today-ad-femi.png.

Low
6. H33 Sponsored story: the line "Ads keep TGIF free" (bottom left) is missing. social-p2/h-tgif-4.png.
7. X11 No recent searches: lacks "People are searching" chips and "Creators to know" (first pass defect 6 extended). social-p2/x11-norecent-uk.png.
8. H6 audio card: a grey tile with a waveform icon where the board draws cover art; the seeded audio has a cover. social-p2/h3-foryou-scroll2-femi.png.
9. I12 chat header: the "..." button at the right is missing. social-p2/i12-chat-femi.png.
10. I2 profile with Message: left aligned over a cover, Message drawn twice (header and row); board centres the avatar with Follow and Message. social-p2/i2-profile-bisi-femi.png.
11. I34 Join requests: board draws rows with Decline and Approve; built holds only removed people and has no way to make a request. Needs a ruling (private rooms are paid to join). social-p2/i34-requests-bisi.png.
12. Failure states arrive late: Search (X12) and Flix (MV12) show skeleton rows or a spinner for about 15 s before "Try again" (the Home feed error H13 is quick). social-p2/x12-failed-femi.png.
13. Cold start with a slow Hub: the web build shows an empty white page (not the dark background) until the first Hub answer; the skeleton boards H11, X14, I36, MV11 cannot be seen. Web build only; a phone shows its native splash. social-p2/h11-slow-femi.png.
14. Credits copy: the app says "WAWU Credits" (Inbox card, I28 sheet title, I29) where boards read "Who Made This? Credits"; the I28 sheet also lacks the line "A photo is 1 credit, a video or voice note 3" above the packs. Needs a ruling on the name. social-p2/i28b-femi.png, i24-comm-femi.png.
15. E11 ticket of a called-off event is not drawn greyed (board greys the ticket card). social-p2/e11-off-ticket-femi.png.

Environment limits, not defects: every video area is black because the Chromium build here has no H.264 decoder (H2, H5, H7 media); the web build has no camera (E19 board's night picture is black); the stand-in's fees for a book transfer are 0 so Totals equal prices.

No em-dash was found in any text read from the screens walked (events, host, door, dashboard, inbox, chats, DMs, communities, credits, search, categories, feed, TGIF). No "Flutterwave" on any screen.

## Coverage table, rows reached (conformance `conforms` only where both pictures were compared)

| Artboard | Name | Coverage | Conformance | Design file | Built file | Picture | Note |
|---|---|---|---|---|---|---|---|
| E8 | Filters | built | conforms | design/Events Flow.dc.html (E8) | src/app/events/index.tsx (calendar sheet) | e8-filter-femi | when, kind, category and the Show N events button as drawn |
| E9 | Sold out | built | conforms | design/Events Flow.dc.html (E9) | src/app/events/[id].tsx | e9-sold-femi | Sold out row, text and disabled button as drawn |
| E11 | Called off | built | conforms | design/Events Flow.dc.html (E11) | src/app/events/tickets/[ticketId].tsx | e11-off-ticket-femi, e11-off-order-femi | Called off banner and refund line as drawn (price back). low: the ticket is not drawn greyed. medium: the order page for the same ticket says "Your payment didn't go through" (defect 4) |
| E12 | Checked in | built | conforms | design/Events Flow.dc.html (E12) | src/app/events/tickets/[ticketId].tsx | e12-checkedin-femi | Already checked in banner, QR and code |
| E13 | Basics | built | conforms | design/Events Flow.dc.html (E13) | src/app/events/host.tsx | e13-host-bisi | empty Basics step, format chips, Continue |
| E18 | Organiser dashboard | built | conforms | design/Events Flow.dc.html (E18) | src/app/events/dashboard/[id].tsx | e18-dash-bisi | Sold, Checked in, Left, 85% earnings, door, ticket types, links, edit, call off; figures are live (2 sold, 12,750 naira) |
| E19 | At the door | built | conforms | design/Events Flow.dc.html (E19) | src/app/events/door/[id].tsx | e19-door-bisi | camera permission state; no camera on the web build, so the board's night picture is black |
| E20 | Let them in | built | conforms | design/Events Flow.dc.html (E20) | src/app/events/door/[id].tsx | e20-letin-bisi | green Let them in, name, room count; typed through "Type the code instead" |
| E21 | Needs a tier | built | conforms | design/Events Flow.dc.html (E21) | src/app/events/host.tsx | e21-needstier-dayo | Hosting needs a tier, tiers named, From 1,000 naira, See tiers |
| E22 | Sent back | built | conforms | design/Events Flow.dc.html (E22) | src/app/events/sent-back/[id].tsx | e22-sentback-bisi | Sent back note with the reviewer text, fields, Send again |
| E23 | Already used | built | conforms | design/Events Flow.dc.html (E23) | src/app/events/door/[id].tsx | e23-used-bisi | amber Already used with the time |
| E24 | Not valid | built | conforms | design/Events Flow.dc.html (E24) | src/app/events/door/[id].tsx | e24-invalid-bisi | red Not a valid ticket |
| E25 | Call it off | built | differs | design/Events Flow.dc.html (E25) | src/app/events/dashboard/[id].tsx (call-off sheet) | e25-calloff-bisi | medium: reads "The 1 buyer gets their money back."; BRIEF E25 asks for "All N buyers get the ticket price back" (R-10 refund default, rule 6) |
| X3 | One category | built | conforms | design/Explore Flow.dc.html (X3) | src/app/categories.tsx | x3-category-femi | chips and creator tiles; only two creators exist on the stack |
| X16 | Slider · event slide | built | conforms | design/Explore Flow.dc.html (X16) | src/app/(tabs)/explore.tsx | x16-explore-ad-femi | featured event slide and a Sponsored slide in the same slider (ad scheduled live first) |
| X17 | No events | built | conforms | design/Explore Flow.dc.html (X17) | src/app/(tabs)/explore.tsx | x17-noevents-ad-femi | events list answered empty in the browser; the Sponsored slide stands alone, then TGIF |
| X6 | Results · All | built | conforms | design/Explore Flow.dc.html (X6) | src/app/search.tsx | x6-results-femi | All tab with counts, Creators and Communities sections (query "bisi", no content title matches) |
| X11 | No recent searches | built | differs | design/Explore Flow.dc.html (X11) | src/app/search.tsx | x11-norecent-uk | low: RECENT line only; the board also draws "People are searching" chips and "Creators to know" (defect 7) |
| X12 | Search failed | built | conforms | design/Explore Flow.dc.html (X12) | src/app/search.tsx | x12-failed-femi | Search isn't working right now, Try again, shown after about 15 s of skeleton rows (low, defect 12) |
| MV12 | Couldn't load | built | conforms | design/Flix Movies Flow.dc.html (MV12) | src/app/movies/index.tsx | mv12-error-femi | Couldn't load movies, Try again, after about 15 s of spinner |
| H3 | Photo set | built | conforms | design/Home Flow.dc.html (H3) | src/app/(tabs)/index.tsx | h3-foryou-scroll4-femi | photo set with the 1/3 counter and chips |
| H4 | PDF / book | built | conforms | design/Home Flow.dc.html (H4) | src/app/(tabs)/index.tsx | h3-foryou-scroll3-femi | PDF cover, page count, free pages, price bar |
| H6 | Audio · Following | built | conforms | design/Home Flow.dc.html (H6) | src/app/(tabs)/index.tsx | h3-foryou-scroll2-femi | audio card, chips, player; low: a grey tile with a waveform icon where the board draws the cover art (defect 8) |
| H7 | Course | built | conforms | design/Home Flow.dc.html (H7) | src/app/(tabs)/index.tsx | h6-follow-scroll0-femi | Course chip, lessons line, price bar; no "lesson 1 free" chip because no free lesson was seeded |
| H8 | Template · Following | built | conforms | design/Home Flow.dc.html (H8) | src/app/(tabs)/index.tsx | h3-foryou-scroll1-femi | Template chip, title, price bar |
| H12 | Following · empty | built | conforms | design/Home Flow.dc.html (H12) | src/app/(tabs)/index.tsx | h12-followingempty-uk | copy and button as drawn, rail below |
| H13 | Feed · couldn't load | built | conforms | design/Home Flow.dc.html (H13) | src/app/(tabs)/index.tsx | h13-feederr-femi | The feed didn't load, Try again |
| H32 | Prayer | built | conforms | design/Home Flow.dc.html (H32) | src/app/tgif.tsx | h-tgif-3 | Prayer card |
| H33 | Sponsored | built | conforms | design/Home Flow.dc.html (H33) | src/app/tgif.tsx | h-tgif-4, h33-today-ad-femi | Sponsored card with Get tickets and Skip. low: the line "Ads keep TGIF free" is missing (defect 6). The Home Today banner for the same campaign reads AD, headline, Get tickets |
| I2 | Profile · Message | built | differs | design/Inbox Flow.dc.html (I2) | src/app/profile/[wawuId].tsx | i2-profile-bisi-femi | low: board centres the avatar over Follow and Message; the built profile is left aligned over a cover and draws Message twice (header and row) |
| I4 | Waiting for a reply | built | conforms | design/Inbox Flow.dc.html (I4) | src/app/paid-thread/[wawuId].tsx | i4-waiting-femi | waiting banner and held-money line; medium copy: "all of it comes back" (defect 3) |
| I5 | Replied | built | conforms | design/Inbox Flow.dc.html (I5) | src/app/paid-thread/[wawuId].tsx | i4-waiting-femi | the same thread shows the answered question first: "Bisi answered, so they've been paid", closed |
| I6 | Not enough in wallet | built | conforms | design/Inbox Flow.dc.html (I6) | src/app/profile/[wawuId].tsx (ask sheet) | i6-low-kemi | Not enough in your Naira wallet, You need 1,000. You have 900, Add 100; refund line has no "in full" |
| I12 | Chat | built | conforms | design/Inbox Flow.dc.html (I12) | src/app/chat/[id].tsx | i12-chat-femi | bubbles, photo, file; low: the header "..." button is missing (defect 9) |
| I13 | Add to chat | built | conforms | design/Inbox Flow.dc.html (I13) | src/app/chat/[id].tsx | i13-add-femi | Add to chat: Send money, Request money, Photo or video, File |
| I14 | Amount | built | conforms | design/Inbox Flow.dc.html (I14) | src/app/chat/[id].tsx | i14b-review-femi | keypad, note, fee line (Bank charge 0 + fee 10 = 10), Total, They get, button shows the total (BRIEF I14) |
| I18 | Request from someone | built | conforms | design/Inbox Flow.dc.html (I18) | src/app/chat/[id].tsx | i18-kemi-chat-femi | Requested from you bubbles with Decline and Pay, a Declined one, and the sender's own Waiting for Kemi |
| I20 | Money filter | built | conforms | design/Inbox Flow.dc.html (I20) | src/app/(tabs)/inbox.tsx | i20-money-femi | Money rows (requested, declined). The header icons and + button are missing (defect 1) |
| I24 | Communities | built | conforms | design/Inbox Flow.dc.html (I24) | src/app/(tabs)/inbox.tsx | i24-comm-femi | credits card with Buy, YOUR COMMUNITIES rows; no SUGGESTED section (nothing public to suggest on the stack). + button missing (defect 1) |
| I25 | Community | built | conforms | design/Inbox Flow.dc.html (I25) | src/app/community/[id].tsx | i25-open-femi | open room header, Host tag, messages, composer |
| I26 | Sending text | built | conforms | design/Inbox Flow.dc.html (I26) | src/app/community/[id].tsx | i26-typing-femi | typed text and the send arrow |
| I38 | Sending a photo | built | conforms | design/Inbox Flow.dc.html (I38) | src/app/community/[id].tsx | i38-sending-femi | photo chip with "Photos 1 credit...", Send . 1; the photo upload went through the storage stand-in |
| I27 | Out of credits | built | conforms | design/Inbox Flow.dc.html (I27) | src/app/community/[id].tsx | i25-open-femi | You're out of credits card, Buy credits, 0 credits chip |
| I29 | Credits added | built | conforms | design/Inbox Flow.dc.html (I29) | src/features/credits | i29-credits-added-femi | 120 credits added, Paid 1,000 naira, You have 120 credits (button reads Done, the board Back to chat, because it opened from Inbox) |
| I30 | Private · pay to join | built | conforms | design/Inbox Flow.dc.html (I30) | src/app/community/pass/[id].tsx | i30-priv-kemi | private pay to join with a low wallet: shortfall card and Add 100 |
| I31 | Joined | built | conforms | design/Inbox Flow.dc.html (I31) | src/app/community/pass/[id].tsx | i31-pass-femi, i31-priv-femi | You're in, pass end date, Member, Open the room, Renew; paying member also opens straight into the room |
| I34 | Join requests | built | differs | design/Inbox Flow.dc.html (I34) | src/app/community/requests/[id].tsx | i34-requests-bisi | low: board draws asked-to-join rows with Decline and Approve; the built screen only holds removed people ("No requests waiting"); no route makes a request (private rooms are paid to join) |

## Rows still unreachable, with the exact reason

| Artboard | Name | Coverage | Conformance | Reason |
|---|---|---|---|---|
| E10 | Still confirming | built | unverified | needs a payment that stays pending: the stack holds a transfer only for a book transfer into the operational account and I did not switch the hold on (budget) |
| E14 | When and where | built | unverified | host wizard past Basics not filled in (steps budget) |
| E15 | Tickets | built | unverified | host wizard past Basics not filled in (steps budget) |
| E16 | Sent for review | built | unverified | host wizard past Basics not filled in (steps budget) |
| X7 | Content | built | unverified | results tabs did not switch on a tap (tab labels carry counts, the exact-text tap missed) and the query "bisi" matches no content title |
| X8 | Creators | built | unverified | results tabs did not switch on a tap (see X7) |
| X9 | Communities | built | unverified | results tabs did not switch on a tap (see X7) |
| X14 | Explore · loading | built | unverified | the web build shows an empty white page until the first Hub answer, so the skeleton never paints when the Hub is slow (defect 13); not reachable |
| MV5 | Opening Flixora | built | unverified | external hand-off, no live Flixora |
| MV3 | Trailer | built | unverified | no Flixora movies on this stack: /movies returns to Home; no catalogue was seeded |
| MV7 | Filter | built | unverified | no movies on this stack (see MV3) |
| MV8 | Search | built | unverified | no movies on this stack (see MV3) |
| MV10 | No results | built | unverified | no movies on this stack (see MV3) |
| MV11 | Loading | built | unverified | white page while the Hub is slow (see X14) |
| H5 | Locked | built | unverified | the "Preview ended" overlay needs the preview to play to its end; the Chromium build here cannot decode H.264 mp4, so every video area is black. The Locked chip and the Unlock bar are drawn |
| H9 | Creator card | built | unverified | no creator card turned up in the feed on this stack (needs a suggested creator card source) |
| H10 | Professional card | built | unverified | no professional card in the feed; the seeded professional has no public profile |
| H11 | Today · loading | built | unverified | white page while the Hub is slow (see X14) |
| H17 | Not enough in wallet | built | unverified | not walked (steps budget): Unlock sheet as the low-balance fan |
| H18 | Couldn't confirm | built | unverified | needs a confirmation that times out (hold the stand-in transfer); not walked |
| H35 | Share the verse | built | unverified | not walked (steps budget) |
| H36 | Daily TGIF notification | built | unverified | the daily notification needs the scheduler and a push device; none on the stack |
| I35 | Inbox · empty | built | unverified | not walked (steps budget): a fan with no chats |
| I36 | Inbox · loading | built | unverified | white page while the Hub is slow (see X14) |
| I7 | Refunded | built | unverified | a refund of an unanswered paid message needs the answer window to pass; not walked |
| I8 | Creator has paid messages off | built | unverified | needs a creator with paid messages off and a public profile; the one seeded has none |
| I11 | Answered | built | unverified | not walked: the creator side after replying (steps budget) |
| I15 | Sent | built | unverified | the PIN pad tap failed in my script (the pad sits in a dialog); the send was not completed |
| I16 | Request sheet | built | unverified | not captured (steps budget) |
| I17 | Request sent | built | unverified | not captured (steps budget) |
| I19 | Request paid | built | unverified | paying a request through the app was not walked (steps budget); requests were left pending |
| I22 | Warning | built | unverified | not walked (steps budget) |
| I23 | Switched off for 7 days | built | unverified | not walked (steps budget) |
| I37 | Approved · inside | built | unverified | no approval path exists (private rooms are paid to join) |

Pictures in audits/CHECK-3/social-p2/ are named by screen and user (femi fan with wallet, kemi fan with 900 naira, bisi creator host, dayo creator with no tier, uk a person registered in the UK).
