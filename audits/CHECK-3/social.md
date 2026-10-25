# CHECK-3 audit, area 2: Home, Explore, Inbox, Communities, Flix, Events

Auditor: a Sonnet session that built none of this (git log: every file in scope is by other sessions). Findings only; no code, test, gate or baseline was touched.
Mobile origin/main 67f4d3ff, backend origin/main dcee8af. App: web export on a local stack (Hub on the Nuvion stand-in, mock WAWU ID, ports 8920 to 8939, no Fintava, no live host), Chromium 390x844, dark and light. Design: `python3 scripts/design/render_design.py --flow <Home|Explore|Inbox|Flix Movies|Events>` (all five exit 0). Users: fan with a funded wallet (adaeze), creator (chidi), pro creator (zainab), a fan with no wallet, a person registered in the UK (onboarded, money not walked).

## Biggest thing never covered

81 of 128 artboards are `unverified`: their screens exist (task done or review, route present) but I did not drive them or compare them. Mostly the Inbox hidden states (chat I12 to I15, money requests I16 to I20, refund and decline I4 to I8, I11, I22, I23, private community I30, I31, I37, joins I34, sending I26, I38, out of credits I27, I29), the Events host, dashboard and door boards (E13 to E16, E18 to E20, E22 to E25), and every loading and error board (H11, H13, X12, X14, MV10 to MV12, I36). Not walked either: a person outside Nigeria through any money flow, back-mid-flow on a payment, the no-wallet fan tapping Unlock or Get tickets, a low-balance wallet (H17, I6). Cause: the step budget and a stack seed with no host tier, no private community, no ad campaign and no media files. Coverage `built` for those rows comes from the task status and the route list, not from seeing them.

## Counts

Artboards 128. conforms 34, differs 13, unbuilt 0, unverified 81.

## Defects

High
1. **I1 Inbox: the + button is missing.** Board I1 draws a round + above the tab bar (bottom right). The built Inbox draws none, for a fan and for a creator. Screen: `src/app/(tabs)/inbox.tsx`; INBOX-04 file says the compose entry belongs to INBOX-19 (review). Repro: sign in as any user, open Inbox, compare with I1. Pictures: social/i1-fan-inbox.png, social/i1-pro-inbox.png. Header buttons (paid settings, new community) are drawn for creators only, which is by design.

Medium
2. **Links are not written wawu/... (H22 share sheet, I33 created screen).** Share sheet shows `wawuafrica.com/content/<uuid>`; board H22 shows `wawu/c/pricing-playbook`. I33 shows `wawuafrica.com/c/chidi-beauty-circle`; board shows `wawu/c/aba-tailors`. Repro: open any content, tap Share; or create a community. Pictures: social/h22-share.png, social/i33-created.png. Rule: CLAUDE.md "Links are written wawu/...".
3. **Explore rail "Who Made This?" says "No creators to suggest yet" while Home's rail and Explore > See all show creators.** Same person (no-wallet fan following nobody). X1 draws the rail with creator cards. Repro: sign in as a fan who follows nobody, compare `/` and `/explore`. Pictures: social/x1-explore.png, social/h19-home-today.png (Home of the same user).

Low
4. H14 unlock sheet and E3 ticket sheet price rows read "Bank charge / Total" where the boards read "Fee / No fee"; E3 button "Pay · ₦5,000" where the board has "Pay ₦7,500" (format); H14 has no content thumbnail. Pictures: social/h14-sheet.png, social/e3-pay.png.
5. H19, H20, H24, H25 detail action row shows the like count under the heart; boards show "96% liked". Pictures: social/cd-tmpl.png, social/cd-video.png, social/h20-detail-unlocked.png.
6. X5 Search lacks the "People are searching" section; X10 No results lacks "Closest things we have". Pictures: social/x5-search.png, social/x10-noresults.png (the stack has little content, so X10 may be data; confirm with seeded content).
7. I32 New community lacks the footnote "Free to host. You keep 85% of every credit spent in your room."; I33 lacks "Members pay 1 credit a message and reading is free." Pictures: social/i32-new-community.png, social/i33-created.png.
8. E7 Ticket lacks the caption "Brightness goes up when this opens." (device behaviour; check on the Android phone). Picture: social/e7-qr.png.

No em-dash was found in any text on the screens walked (Home, Explore, Inbox, Events, Movies, TGIF, categories, creators, search, my tickets, content detail, sheets) and none in the user-visible strings of the feature folders in scope. No "Flutterwave" on any screen.

## Money paths attacked (fan, funded wallet, local stack)

- Unlock a ₦1,500 template: wrong PIN gives "Wrong PIN. 4 tries left.", a second wrong gives "3 tries left."; a double tap on the sheet's Unlock button made exactly one Purchase row and one ₦1,500 debit (wallet ₦50,000 to ₦48,500). Passed.
- Tip ₦2,000 on a video: sheet, PIN, "sent" screen; creator wallet rose by ₦1,700 (85/15). Passed.
- Buy a ₦5,000 event ticket: pay sheet, PIN, ticket, My tickets, ticket QR. One order. Passed.
- Reply to a paid DM: queue (I9) and reply screen (I10) reached; the reply was typed but not sent (not covered).
- Not attacked: back mid-flow, no-wallet payer, UK person, insufficient funds, "still confirming".

## Hubs checked in full

- Home (H1): tabs Today, Following, For you, search, bell, wallet card (Send, Add; Scan is not built at launch), Studio, Learn, Legal, plus Monetize and the + for creators only, Who Made This? rail, Flix rail. Ad banner not checked (no campaign).
- Explore (X1): search, slider (events), TGIF card, category chips, creators rail, Flix rail, Upcoming events, the three doors (professional, school, list your services), + for creators. All present; see defect 3 for the rail's data.
- Inbox (I1): chips All, Communities, Money, plus Paid DMs for creators; settings and new community for creators. See defect 1.
- Events (E1): Discover, My events, Host event, filter, featured, list, Host your event card. All present.
- Flix: Home and Explore rails, MV1, MV6, MV2, MV4, MV9 reached.

## Coverage table

Coverage is `built` for every row (task done or review and a route exists); conformance is `conforms` only where I compared both pictures (design render `build/design_shots/<ID>-dark.png` or `-light.png` against the screenshot named). Unverified rows say why.

| Artboard | Name | Coverage | Conformance | Design file | Built file | Picture | Note |
|---|---|---|---|---|---|---|---|
| E1 | Events | built | conforms | design/Events Flow.dc.html (E1) | src/app/events/index.tsx | e1-events, L-e1 |  |
| E2 | Event | built | conforms | design/Events Flow.dc.html (E2) | src/app/events/[id].tsx, tickets/index.tsx, orders/[orderId].tsx | e2-event, e5-ticket, e6-mytickets |  |
| E3 | Pay | built | differs | design/Events Flow.dc.html (E3) | src/app/events/[id].tsx (pay sheet) | e3-pay | low: "Bank charge / Total" rows and "Pay · ₦5,000" where the board has "Fee / No fee" and "Pay ₦7,500" |
| E4 | PIN | built | conforms | design/Events Flow.dc.html (E4) | src/app/events/[id].tsx, tickets/index.tsx, orders/[orderId].tsx | e2-event, e5-ticket, e6-mytickets |  |
| E5 | Ticket | built | conforms | design/Events Flow.dc.html (E5) | src/app/events/[id].tsx, tickets/index.tsx, orders/[orderId].tsx | e2-event, e5-ticket, e6-mytickets |  |
| E6 | My tickets | built | conforms | design/Events Flow.dc.html (E6) | src/app/events/[id].tsx, tickets/index.tsx, orders/[orderId].tsx | e2-event, e5-ticket, e6-mytickets |  |
| E7 | Ticket QR | built | differs | design/Events Flow.dc.html (E7) | src/app/events/tickets/[ticketId].tsx | e7-qr | low: "Brightness goes up when this opens." caption missing |
| E8 | Filters | built | unverified | design/Events Flow.dc.html (E8) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E9 | Sold out | built | unverified | design/Events Flow.dc.html (E9) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E10 | Still confirming | built | unverified | design/Events Flow.dc.html (E10) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E11 | Called off | built | unverified | design/Events Flow.dc.html (E11) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E12 | Checked in | built | unverified | design/Events Flow.dc.html (E12) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E13 | Basics | built | unverified | design/Events Flow.dc.html (E13) | - | - | host needs a tier (chidi has none: "Hosting needs a tier" shows) |
| E14 | When and where | built | unverified | design/Events Flow.dc.html (E14) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E15 | Tickets | built | unverified | design/Events Flow.dc.html (E15) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E16 | Sent for review | built | unverified | design/Events Flow.dc.html (E16) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E17 | My events | built | conforms | design/Events Flow.dc.html (E17) | src/app/events/mine.tsx | e17-myevents |  |
| E18 | Organiser dashboard | built | unverified | design/Events Flow.dc.html (E18) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E19 | At the door | built | unverified | design/Events Flow.dc.html (E19) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E20 | Let them in | built | unverified | design/Events Flow.dc.html (E20) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E21 | Needs a tier | built | unverified | design/Events Flow.dc.html (E21) | - | - | seen as text ("Hosting needs a tier"), not compared |
| E22 | Sent back | built | unverified | design/Events Flow.dc.html (E22) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E23 | Already used | built | unverified | design/Events Flow.dc.html (E23) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E24 | Not valid | built | unverified | design/Events Flow.dc.html (E24) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| E25 | Call it off | built | unverified | design/Events Flow.dc.html (E25) | - | - | not driven: needs a host tier, a door scan, or a ticket holder of a called-off event |
| X1 | Explore | built | conforms | design/Explore Flow.dc.html (X1) | src/app/(tabs)/explore.tsx | x1-explore, x15-explore-bottom, L-x1 | event slide image absent (no banner on stack) |
| X15 | Explore · scrolled down | built | conforms | design/Explore Flow.dc.html (X15) | src/app/(tabs)/explore.tsx | x1-explore, x15-explore-bottom, L-x1 | event slide image absent (no banner on stack) |
| X2 | Categories | built | conforms | design/Explore Flow.dc.html (X2) | src/app/categories.tsx, src/app/creators.tsx | x2-categories, x4-creators |  |
| X3 | One category | built | unverified | design/Explore Flow.dc.html (X3) | - | - | not driven: needs seeded content or a forced failure |
| X4 | All creators | built | conforms | design/Explore Flow.dc.html (X4) | src/app/categories.tsx, src/app/creators.tsx | x2-categories, x4-creators |  |
| X16 | Slider · event slide | built | unverified | design/Explore Flow.dc.html (X16) | - | - | not driven: needs seeded content or a forced failure |
| X17 | No events | built | unverified | design/Explore Flow.dc.html (X17) | - | - | not driven: needs seeded content or a forced failure |
| X5 | Search | built | differs | design/Explore Flow.dc.html (X5) | src/app/search.tsx | x5-search | low: no "People are searching" section, no recent chips to compare |
| X6 | Results · All | built | unverified | design/Explore Flow.dc.html (X6) | - | - | not driven: needs seeded content or a forced failure |
| X7 | Content | built | unverified | design/Explore Flow.dc.html (X7) | - | - | not driven: needs seeded content or a forced failure |
| X8 | Creators | built | unverified | design/Explore Flow.dc.html (X8) | - | - | not driven: needs seeded content or a forced failure |
| X9 | Communities | built | unverified | design/Explore Flow.dc.html (X9) | - | - | not driven: needs seeded content or a forced failure |
| X10 | No results | built | differs | design/Explore Flow.dc.html (X10) | src/app/search.tsx | x10-noresults | low: no "Closest things we have" list |
| X11 | No recent searches | built | unverified | design/Explore Flow.dc.html (X11) | - | - | not driven: needs seeded content or a forced failure |
| X12 | Search failed | built | unverified | design/Explore Flow.dc.html (X12) | - | - | not driven: needs seeded content or a forced failure |
| X13 | Empty category | built | conforms | design/Explore Flow.dc.html (X13) | src/app/categories.tsx | x13-emptycat |  |
| X14 | Explore · loading | built | unverified | design/Explore Flow.dc.html (X14) | - | - | not driven: needs seeded content or a forced failure |
| MV1 | Flix movies | built | conforms | design/Flix Movies Flow.dc.html (MV1) | src/app/movies/* | mv1, mv2-movie, mv4-continue, mv6-all, mv9-premiering, L-mv1 | differences already ruled in FLIX-03 (trailer line, no share icon) |
| MV2 | Movie | built | conforms | design/Flix Movies Flow.dc.html (MV2) | src/app/movies/* | mv1, mv2-movie, mv4-continue, mv6-all, mv9-premiering, L-mv1 | differences already ruled in FLIX-03 (trailer line, no share icon) |
| MV4 | Continue on Flixora | built | conforms | design/Flix Movies Flow.dc.html (MV4) | src/app/movies/* | mv1, mv2-movie, mv4-continue, mv6-all, mv9-premiering, L-mv1 | differences already ruled in FLIX-03 (trailer line, no share icon) |
| MV5 | Opening Flixora | built | unverified | design/Flix Movies Flow.dc.html (MV5) | - | - | external hand-off, no live Flixora |
| MV3 | Trailer | built | unverified | design/Flix Movies Flow.dc.html (MV3) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| MV6 | All movies | built | conforms | design/Flix Movies Flow.dc.html (MV6) | src/app/movies/* | mv1, mv2-movie, mv4-continue, mv6-all, mv9-premiering, L-mv1 | differences already ruled in FLIX-03 (trailer line, no share icon) |
| MV7 | Filter | built | unverified | design/Flix Movies Flow.dc.html (MV7) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| MV8 | Search | built | unverified | design/Flix Movies Flow.dc.html (MV8) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| MV9 | Premiering soon | built | conforms | design/Flix Movies Flow.dc.html (MV9) | src/app/movies/* | mv1, mv2-movie, mv4-continue, mv6-all, mv9-premiering, L-mv1 | differences already ruled in FLIX-03 (trailer line, no share icon) |
| MV10 | No results | built | unverified | design/Flix Movies Flow.dc.html (MV10) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| MV11 | Loading | built | unverified | design/Flix Movies Flow.dc.html (MV11) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| MV12 | Couldn't load | built | unverified | design/Flix Movies Flow.dc.html (MV12) | - | - | not driven in this pass (trailer, filter sheet, failure states) |
| H1 | Today | built | conforms | design/Home Flow.dc.html (H1) | src/app/(tabs)/index.tsx | h1-creator-home2, h1-fan-top, L-h1 | Scan and the currency picker are in BRIEF "Not built at launch"; the ad banner needs a live campaign (none on the stack, see below) |
| H2 | For you · video | built | conforms | design/Home Flow.dc.html (H2) | src/app/(tabs)/index.tsx (feed) | h2-foryou | media is black on the stack (no files) |
| H3 | Photo set | built | unverified | design/Home Flow.dc.html (H3) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H4 | PDF / book | built | unverified | design/Home Flow.dc.html (H4) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H5 | Locked | built | unverified | design/Home Flow.dc.html (H5) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H6 | Audio · Following | built | unverified | design/Home Flow.dc.html (H6) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H7 | Course | built | unverified | design/Home Flow.dc.html (H7) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H8 | Template · Following | built | unverified | design/Home Flow.dc.html (H8) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H9 | Creator card | built | unverified | design/Home Flow.dc.html (H9) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H10 | Professional card | built | unverified | design/Home Flow.dc.html (H10) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H11 | Today · loading | built | unverified | design/Home Flow.dc.html (H11) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H12 | Following · empty | built | unverified | design/Home Flow.dc.html (H12) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H13 | Feed · couldn't load | built | unverified | design/Home Flow.dc.html (H13) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H14 | Unlock sheet | built | differs | design/Home Flow.dc.html (H14) | src/features/unlock/UnlockSheets.tsx | h14-sheet | low: rows read "Bank charge / Total" where the board has "Fee / No fee"; no content thumbnail |
| H15 | PIN | built | conforms | design/Home Flow.dc.html (H15) | src/features/unlock/UnlockSheets.tsx | h15-wrongpin, h16-unlocked | biometric key is device-only |
| H16 | Unlocked | built | conforms | design/Home Flow.dc.html (H16) | src/features/unlock/UnlockSheets.tsx | h15-wrongpin, h16-unlocked | biometric key is device-only |
| H17 | Not enough in wallet | built | unverified | design/Home Flow.dc.html (H17) | - | - | needs a wallet with too little money |
| H18 | Couldn't confirm | built | unverified | design/Home Flow.dc.html (H18) | - | - | needs a confirmation that times out |
| H19 | Detail · locked preview | built | differs | design/Home Flow.dc.html (H19) | src/app/content/[id].tsx | cd-tmpl, h20-detail-unlocked, cd-video | low: action row shows the like count where the board shows "96% liked" |
| H20 | Detail · unlocked | built | differs | design/Home Flow.dc.html (H20) | src/app/content/[id].tsx | cd-tmpl, h20-detail-unlocked, cd-video | low: action row shows the like count where the board shows "96% liked" |
| H21 | Comments | built | conforms | design/Home Flow.dc.html (H21) | src/app/content/[id].tsx | h21-comments (viewed in c11) |  |
| H22 | Share sheet | built | differs | design/Home Flow.dc.html (H22) | src/app/content/[id].tsx | h22-share | medium: link shown as wawuafrica.com/content/<id>, board says wawu/c/<slug> |
| H23 | Rate | built | conforms | design/Home Flow.dc.html (H23) | src/app/content/[id].tsx | h21-comments (viewed in c11) |  |
| H24 | Detail · free video | built | differs | design/Home Flow.dc.html (H24) | src/app/content/[id].tsx | cd-tmpl, h20-detail-unlocked, cd-video | low: action row shows the like count where the board shows "96% liked" |
| H25 | Detail · course | built | differs | design/Home Flow.dc.html (H25) | src/app/content/[id].tsx | cd-tmpl, h20-detail-unlocked, cd-video | low: action row shows the like count where the board shows "96% liked" |
| H26 | Tip sheet | built | conforms | design/Home Flow.dc.html (H26) | src/features/tips | h26-tip, h28-tip-sent | Dollar and USDT toggle after launch (R-16) |
| H27 | PIN | built | conforms | design/Home Flow.dc.html (H27) | src/features/tips | h26-tip, h28-tip-sent | Dollar and USDT toggle after launch (R-16) |
| H28 | Tip sent | built | conforms | design/Home Flow.dc.html (H28) | src/features/tips | h26-tip, h28-tip-sent | Dollar and USDT toggle after launch (R-16) |
| H29 | Verse | built | conforms | design/Home Flow.dc.html (H29) | src/app/tgif.tsx | h29-tgif, h-tgif-2, h-tgif-3, h-tgif-5 |  |
| H30 | What it means | built | conforms | design/Home Flow.dc.html (H30) | src/app/tgif.tsx | h29-tgif, h-tgif-2, h-tgif-3, h-tgif-5 |  |
| H31 | The line to carry | built | conforms | design/Home Flow.dc.html (H31) | src/app/tgif.tsx | h29-tgif, h-tgif-2, h-tgif-3, h-tgif-5 |  |
| H32 | Prayer | built | unverified | design/Home Flow.dc.html (H32) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H33 | Sponsored | built | unverified | design/Home Flow.dc.html (H33) | - | - | needs a live ad campaign |
| H34 | One thing to do | built | conforms | design/Home Flow.dc.html (H34) | src/app/tgif.tsx | h29-tgif, h-tgif-2, h-tgif-3, h-tgif-5 |  |
| H35 | Share the verse | built | unverified | design/Home Flow.dc.html (H35) | - | - | not driven: needs media/campaign/state the stack does not have (audio, photo, pdf feed cards, ad, loading and error states) |
| H36 | Daily TGIF notification | built | unverified | design/Home Flow.dc.html (H36) | - | - | needs the daily notification |
| I1 | Inbox · All | built | differs | design/Inbox Flow.dc.html (I1) | src/app/(tabs)/inbox.tsx | i1-fan-inbox, i1-pro-inbox | HIGH: the + button above the tab bar is missing for every account |
| I35 | Inbox · empty | built | unverified | design/Inbox Flow.dc.html (I35) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I36 | Inbox · loading | built | unverified | design/Inbox Flow.dc.html (I36) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I2 | Profile · Message | built | unverified | design/Inbox Flow.dc.html (I2) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I3 | Write the question | built | conforms | design/Inbox Flow.dc.html (I3) | src/app/profile/[wawuId].tsx (ask sheet) | i3-ask |  |
| I4 | Waiting for a reply | built | unverified | design/Inbox Flow.dc.html (I4) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I5 | Replied | built | unverified | design/Inbox Flow.dc.html (I5) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I6 | Not enough in wallet | built | unverified | design/Inbox Flow.dc.html (I6) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I7 | Refunded | built | unverified | design/Inbox Flow.dc.html (I7) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I8 | Creator has paid messages off | built | unverified | design/Inbox Flow.dc.html (I8) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I9 | Paid DMs · to answer | built | conforms | design/Inbox Flow.dc.html (I9) | src/features/inbox/PaidQueueView, src/app/paid-questions/[wawuId].tsx | i9-queue, i10-reply |  |
| I10 | Reply | built | conforms | design/Inbox Flow.dc.html (I10) | src/features/inbox/PaidQueueView, src/app/paid-questions/[wawuId].tsx | i9-queue, i10-reply |  |
| I11 | Answered | built | unverified | design/Inbox Flow.dc.html (I11) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I12 | Chat | built | unverified | design/Inbox Flow.dc.html (I12) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I13 | Add to chat | built | unverified | design/Inbox Flow.dc.html (I13) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I14 | Amount | built | unverified | design/Inbox Flow.dc.html (I14) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I15 | Sent | built | unverified | design/Inbox Flow.dc.html (I15) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I16 | Request sheet | built | unverified | design/Inbox Flow.dc.html (I16) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I17 | Request sent | built | unverified | design/Inbox Flow.dc.html (I17) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I18 | Request from someone | built | unverified | design/Inbox Flow.dc.html (I18) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I19 | Request paid | built | unverified | design/Inbox Flow.dc.html (I19) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I20 | Money filter | built | unverified | design/Inbox Flow.dc.html (I20) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I21 | Settings | built | conforms | design/Inbox Flow.dc.html (I21) | src/app/paid-message-settings.tsx | i21-paid-settings |  |
| I22 | Warning | built | unverified | design/Inbox Flow.dc.html (I22) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I23 | Switched off for 7 days | built | unverified | design/Inbox Flow.dc.html (I23) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I24 | Communities | built | unverified | design/Inbox Flow.dc.html (I24) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I25 | Community | built | unverified | design/Inbox Flow.dc.html (I25) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I26 | Sending text | built | unverified | design/Inbox Flow.dc.html (I26) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I38 | Sending a photo | built | unverified | design/Inbox Flow.dc.html (I38) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I27 | Out of credits | built | unverified | design/Inbox Flow.dc.html (I27) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I28 | Buy credits | built | conforms | design/Inbox Flow.dc.html (I28) | src/features/credits | i28-buycredits |  |
| I29 | Credits added | built | unverified | design/Inbox Flow.dc.html (I29) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I30 | Private · pay to join | built | unverified | design/Inbox Flow.dc.html (I30) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I31 | Joined | built | unverified | design/Inbox Flow.dc.html (I31) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I37 | Approved · inside | built | unverified | design/Inbox Flow.dc.html (I37) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |
| I32 | New community | built | differs | design/Inbox Flow.dc.html (I32) | src/app/community/new.tsx | i32-new-community | low: footnote "Free to host. You keep 85%..." missing |
| I33 | Created | built | differs | design/Inbox Flow.dc.html (I33) | src/app/community/created/[id].tsx | i33-created | medium: link shown as wawuafrica.com/c/<slug> (board: wawu/c/<slug>); low: "Members pay 1 credit a message..." line missing |
| I34 | Join requests | built | unverified | design/Inbox Flow.dc.html (I34) | - | - | not driven: chat, money request, refund, private community and error states were out of reach in the step budget |

Screenshots (50, 390 px wide) are in `audits/CHECK-3/social/`. The design renders and side-by-side sheets were kept in the auditor's scratchpad, not committed.
