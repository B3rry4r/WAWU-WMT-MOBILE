# CHECK-3, area 3: wallet and money, points and Studio, schools, professionals, services

Auditor: Sonnet agent (session 01YVWyVbutb6jEWsPXBkYeY9). Built none of this (new session; branch `wmt/CHECK-3-money-work` from origin/main 67f4d3ff).
Findings only. Stack: backend dcee8af on the Nuvion stand-in with the mock WAWU ID, app web export, Chromium 390x844 dark, ports 8940-8947.
Users driven: a funded fan, a creator, a verified creator, a person with no wallet, a person outside Nigeria (KE, opened by API, in review). Screenshots: `audits/CHECK-3/money-work/`.

## Biggest thing never covered

1. **Legal after the first message (S15 to S26, 12 artboards) and every Studio tool run (PT2 to PT3b, PT7, 8 artboards).** The stack has no AI assistant and no voice provider: the Legal chat answers "The assistant is taking a while to answer" (fan-s15), and the Hub lists one tool, VoiceOver, switched off ("AI tool isn't available right now", fan-pt2). Nothing past the first Legal message or inside a tool was reached.
2. Money with a foreign or crypto account (W3, W21 to W23, card screens W31 to W34): a world wallet opens but sits in review, no card was made (it charges), no crypto account exists. Not driven.
3. The release build on the owner's Android phone (R-24): not done, no phone here.
4. Earnings with data (W39 populated), the Pass (W44 populated), add-money waiting and received (W45, W46), failed send (W14), withdraw receipt (W19): states that need data or provider events this session did not stage.

## Counts

117 artboards in scope (Wallet 46, Points 19, Schools 11, Professionals 10, Services 31): **16 conforms, 17 differs, 23 unbuilt, 61 unverified.** Unbuilt: 9 wallet (W16, W18, W24, W25, W30, W40, W41 to W43), PT4a, 13 bills (S5 to S9, S11, S12, S27 to S32); all but W30 are ruled or on BRIEF.md "Not built at launch". W30 is needs-ruling.

## Defects

No high defect found in what could be reached (the high-risk paths held: see "Money flows tried"). Medium and low below, each: screen, artboard, what differs, repro, screenshot.

### Medium
- **D-01 World wallet home.** Wallet tab, W2 (world-w1 vs W2-dark). A person outside Nigeria sees "Your accounts" with USD $0.00, account details, "Send abroad", "Add a currency": no balance card, Add dollars, swap, Get paid from abroad or transactions. Repro: register with countryCode KE, open the wallet, open the Wallet tab. Needs a ruling (R-87 draws nothing for it).
- **D-02 Review button.** Send review, W10 (fan-send-review). Button reads "Send ₦5,010" (the total); the board's own note says the button shows the amount the person receives ("Send ₦25,000"). Fees split into Bank charge, WAWU's fee and Fees (three lines, the third repeats the sum, Bank charge ₦0.00 drawn at zero). Repro: Send, a WAWU user, ₦5,000, Continue.
- **D-03 Raw references.** Send receipt W12 and transaction detail W27 (fan-send-receipt, fan-w27) show "wawu-send-<uuid>" and "wawu-bank-<uuid>" as the Reference; the boards show "WAW-8F2K-91QX". Schools shows the right shape (fan-sc7, "WAW-LEMG-NZYF"). Repro: finish any send, open the receipt or the row in Transactions.
- **D-04 Inert rows on Add money.** W15 (fan-addmoney, fan-addmoney-dc). Three rows under "Other ways to add money": Debit card "This is not available yet.", USSD "...not available for Nigerian phone numbers yet.", Bank checkout "This is not available yet." The board draws none, Bank checkout is on no board, tapping a row does nothing. R-27 and R-47: an entry that opens nothing is a defect; placeholder wording.
- **D-05 Wallet settings rows.** W35 (fan-wsettings). The board draws Tier 2 account, Face ID for payments and Beneficiaries; the app has none of the three. Saved recipients exist (WALLET-14, "Save Ada as a beneficiary" on the receipt, a Saved list on W8) but no screen manages them. Tier row is allowed (WALLET-19 todo); the other two are not on BRIEF "Not built at launch".
- **D-06 Wrong error when there is nothing to load.** /swap for a person with no foreign account: "We couldn't load your accounts / Check your connection" with Try again (fan-swap, W20). /cards for a person with no wallet: "We couldn't load your cards" plus "You don't have a wallet yet" and Try again (nw-cards). Neither is a connection fault and retry cannot help; the way in should lead to Open your wallet or the account to open.
- **D-07 Card.** W29 (fan-card). The app sells a Virtual or Single-use USD card for ₦657.72; the board sells a Physical Verve card (₦2,000, delivery, W30) or a Virtual card (Free). W30 to W34 reachable only with a card (not made). Needs a ruling that the board is superseded (R-84).
- **D-08 Buy points.** PT4 (fan-pt4). "Pay with" has only the wallet; the board also draws Bank transfer ("From any bank"). R-86 (points through the app stores) may explain it; confirm.
- **D-09 Studio.** PT1 (fan-pt1a). One tile, VoiceOver, "Not available right now", where the board draws eight. It follows the Hub (`GET /ai-tools` returned one tool, enabled false), so this is the stack's configuration, but it means PT1's grid and every tool screen are unverified.

### Low
- D-10 History W26: the top-right icon on the board is missing (fan-history).
- D-11 Reset PIN W37: the code is sent to the email ("s***@example.com"), the board says the phone number (fan-w37). Confirm the ruling.
- D-12 Statements W38: CSV only (no Stamped PDF), "Confirm email" must come first, no "Send to" field (fan-w38). The board's own note says PDF depends on the provider.
- D-13 Convert PT6: footnote "Spent on AI tools, points go further than cash." missing (fan-pt6).
- D-14 Professionals P1: intro is "Vetted practitioners."; the board adds "Pay to send the first message." (fan-p1).
- D-15 Bills: no entry anywhere (good, R-52) but /bills and /bills/electricity still open "Pay a bill" by URL.
- D-16 Wallet W1: tabs Euro, Pound, CAD, Dirham, Cedi and a Capital row are drawn; the board has Naira, Dollar, Crypto and no Capital row (fan-w1). Likely R-83 and R-84; confirm.
- D-17 Your points PT5: section label "LAST MOVEMENT" for the board's "Last 20".
- D-18 My courses SC8: an unpaid enrolment shows "Not paid yet" and keeps its seat (8 seats left became 6 with one paid and one unpaid). Check the hold has an end.
- No em-dash was found in any user text on the 30 routes scanned for the fan and the no-wallet user (script over innerText).

## Money flows tried
- Send to a WAWU user: over balance shows "Over your balance" and Add money; wrong PIN twice ("Wrong PIN. 4 tries left", then 3); right PIN with a double tap on the last digit: one debit (₦500,000 to ₦494,990); five wrong PINs lock the PIN ("PIN locked. Try again in 29:58", fan-pinlock); closing the PIN sheet and going back changed no balance.
- Send to a bank: name check came back, review, PIN, "Still confirming" until the Hub's 30 s tick (fan-w12 is the review page in that state), then the row is Completed in history with the right ₦2,550.
- Enrol and pay (SC4 to SC7) double-tapped: one charge of ₦150,000; enrolling again in the same class returns to the paid receipt (fan-reenrol2), no second charge. No wallet: Continue sends the person to Open your wallet (steps 1 of 4).
- Buy points from the wallet (double tap): ₦2,500 once, 2,750 points; convert 1,000 points: ₦500 once.
- No wallet: Send, Add money, Withdraw, Buy points all open the Open your wallet flow; Transactions and Wallet settings show "You don't have a wallet yet / Open your wallet"; Studio, Points and Schools open normally.
- World wallet: opened by API (KE), account number issued, PIN set refused until the opening finished; the money paths of a world wallet were not reached.

## Hubs
- Wallet hub W1: balance, Points, actions (Add money, Send, Withdraw, Buy points, To cash), card row, Transactions and See all, settings icon all lead where they should. Missing from the board and allowed: scan icon (WALLET-20). Passes tile appears only with a pass.
- Home tiles Studio, Learn, Legal lead to /studio, /schools, /legal. Explore doors Find a professional, Find a school, List your services lead to /professionals, /schools, /professional-apply (a fan gets "This needs a creator account").
- Wallet settings: PIN, Cards, Statements, Account details, Help with a payment all open (Help opens a support chat). See D-05 for what is missing.

## Coverage table
| Artboard | Coverage | Conformance | Evidence or reason |
|---|---|---|---|
| W1 Wallet · Naira | built | differs | fan-w1 vs W1-dark: 8 tabs (Euro, Pound, CAD, Dirham, Cedi added) and a Capital row the board does not draw; scan icon allowed (WALLET-20) |
| W2 Wallet · Dollar | built | differs | fan-tab-USD: "Open a dollar account" empty state; world-w1 vs W2-dark: world user sees "Your accounts" card with no balance card, Add dollars, swap or transactions. Needs ruling |
| W3 Wallet · Crypto | built | unverified | only the "Get an address" empty state seen (fan-tab-crypto); funded view needs a crypto account the stack cannot make |
| W4 Wallet · loading | built | unverified | skeleton too brief to capture |
| W5 Wallet · new account | built | unverified | no zero-balance fresh account captured (seeded wallets were funded) |
| W6 Wallet · can't reach account | built | unverified | not driven (needs the bank to stop answering) |
| W7 Send · to a Who Made This? user | built | conforms | fan-send-search vs W7-dark; Abroad tab added by R-87; Recent row empty for a first-time sender |
| W8 Send · to a bank account | built | conforms | fan-w8 vs W8-dark; Saved list empty (none saved) |
| W9 Send · amount | built | conforms | fan-send-amount5k vs W9-dark |
| W10 Send · review | built | differs | fan-send-review vs W10-dark: three fee lines, button shows total "Send ₦5,010" where the board says the button shows the amount received (D-02) |
| W11 Send · PIN | built | conforms | fan-send-wrongpin vs W11-dark; biometric key absent on web; wrong PIN shows "Wrong PIN. 4 tries left." |
| W12 Send · success receipt | built | differs | fan-send-receipt vs W12-dark: reference is the raw "wawu-send-<uuid>" (D-03), fee rows split |
| W13 Send · insufficient balance | built | unverified | text matches ("Over your balance of", Add money); picture not compared (fan-send-over not rendered to a sheet) |
| W14 Send · failed | built | unverified | failed send not driven; the bank send stayed "Still confirming" until the Hub tick (M15 state, fan-w12) |
| W15 Add money | built | differs | fan-addmoney vs W15-dark: three extra inert rows (Debit card, USSD, Bank checkout), clock footnote missing (D-04) |
| W45 Add money · waiting | built | unverified | not driven |
| W46 Add money · received | built | unverified | not driven (the stand-in inflow was seen only as the seeded top-up row) |
| W17 Withdraw to bank | built | unverified | board state needs a saved payout account; the no-account state seen (fan-withdraw) is on no board |
| W19 Withdraw · on its way | built | unverified | withdraw not driven |
| W16 Removed: transfer only | missing | unbuilt | ruled not built (DECISIONS not-built list, R-42) |
| W18 Withdraw · waiting on KYC | missing | unbuilt | ruled not built (R-28) |
| W44 Your pass | built | unverified | only the empty state seen (fan-w44, "You don't have a pass yet") |
| W20 Swap | built | differs | /swap with no foreign account shows "We couldn't load your accounts / Check your connection" (fan-swap vs W20-dark) (D-06) |
| W21 Swap · review | built | unverified | needs two accounts; not reached |
| W22 Crypto · receive | built | unverified | /crypto-receive picker seen as text only |
| W23 Crypto · send | built | unverified | not driven |
| W24 Scan to pay | missing | unbuilt | WALLET-20 todo; BRIEF "Not built at launch" (Scan) |
| W25 My QR code | missing | unbuilt | WALLET-20 todo; BRIEF "Not built at launch" (QR code) |
| W26 Transaction history | built | differs | fan-history vs W26-dark: top-right icon missing (D-10) |
| W27 Transaction detail | built | differs | fan-w27 vs W27-dark: raw "wawu-bank-<uuid>" reference (D-03); extra Amount/Bank charge/WAWU fee block |
| W28 History · no results | built | unverified | text seen ("No results", "No content sales yet"); picture not compared |
| W41 Share as | missing | unbuilt | WALLET-12 todo; BRIEF "Not built at launch" (share as image or PDF) |
| W42 Image | missing | unbuilt | WALLET-12 todo; BRIEF |
| W43 PDF | missing | unbuilt | WALLET-12 todo; BRIEF |
| W29 Cards · get a card | built | differs | fan-card vs W29-dark: built offers Virtual and Single-use USD cards at ₦657.72, board draws Physical Verve (₦2,000) and Virtual (Free) (D-07) |
| W30 Cards · delivery | needs-ruling | unbuilt | no physical-card delivery screen; BRIEF does not list it as not built |
| W31 Card detail | built | unverified | no card made (making one charges ₦657.72); not driven |
| W33 Card · limits and controls | built | unverified | needs a card |
| W34 Card PIN | built | unverified | needs a card |
| W32 Card · frozen | built | unverified | needs a card |
| W35 Wallet settings | built | differs | fan-wsettings vs W35-dark: Tier row, Face ID toggle and Beneficiaries row missing (D-05) |
| W36 Transaction PIN · create | built | unverified | change-PIN "Enter your current PIN" seen (fan-w36); the create-PIN screen was set by API on the stack |
| W37 Transaction PIN · reset | built | differs | fan-w37 vs W37-dark: code goes to the email ("s***@example.com"), the board says the phone number (D-11) |
| W38 Statements | built | differs | fan-w38 vs W38-dark: CSV only (no Stamped PDF), email must be confirmed first, no "Send to" field (D-12) |
| W39 Earnings | built | unverified | only the empty state seen (vc-w39); earnings need sales |
| W40 Earnings · move to wallet | missing | unbuilt | ruled not built (R-11) |
| PT1 Studio | built | unverified | Hub lists one tool (VoiceOver, enabled false): grid has 1 of 8 tiles; funded view seen as text only |
| PT2 VoiceOver | built | unverified | /studio-tool?id=voiceover says "AI tool isn't available right now" (fan-pt2): no AI stand-in on the stack |
| PT2a Working | built | unverified | same, tool disabled on the stack |
| PT2b Done | built | unverified | same |
| PT2c Failed | built | unverified | same |
| PT3 Not enough points | built | unverified | same, needs a runnable tool |
| PT3a Use wallet off | built | unverified | same |
| PT3b Wallet too low | built | unverified | same |
| PT4 Buy points | built | differs | fan-pt4 vs PT4-dark: no "Bank transfer" pay-with row (R-86 may explain), no Founding +10% pill (D-08) |
| PT4b Paying | built | unverified | transient state not captured |
| PT4c Points added | built | unverified | text matches (2,750 points added); picture not compared |
| PT4a Dollars | missing | unbuilt | ruled not built (not-built list) |
| PT5 Your points | built | differs | fan-pt5 vs PT5-dark: section reads "LAST MOVEMENT", board "Last 20"; otherwise matches (low) |
| PT5a Nothing yet | built | unverified | text matches; picture not compared |
| PT6 Convert to cash | built | differs | fan-pt6 vs PT6-dark: board footnote "Spent on AI tools, points go further than cash." missing (D-13) |
| PT6b Converted | built | unverified | text matches ("₦500 added to your wallet"); picture not compared |
| PT6a Below the minimum | built | unverified | text matches ("The minimum is 1,000 points."); picture not compared |
| PT7 Daily limit | built | unverified | needs a runnable tool |
| PT1a No points | built | differs | fan-pt1a vs PT1a-dark: one tile, "Not available right now" (D-09) |
| SC1 Schools | built | conforms | fan-sc1 vs SC1-dark; rating left out by R-32; covers are placeholders (no images in seed) |
| SC2 School | built | conforms | fan-sc2 vs SC2-dark; rating left out by R-32 |
| SC3 Course | built | conforms | fan-sc3 vs SC3-dark |
| SC4 Your details | built | conforms | fan-sc4 vs SC4-dark |
| SC5 Pay | built | conforms | fan-sc5b vs SC5-dark; "Bank charge ₦0" for "No fee", button "Pay · ₦150,000" |
| SC6 PIN | built | unverified | text matches; picture not compared (fan-sc6) |
| SC7 Enrolled | built | conforms | fan-sc7 vs SC7-dark; "will contact you" without "within 2 working days" |
| SC8 My courses | built | conforms | fan-sc8 vs SC8-dark; "In progress" row not driven |
| SC9 Apply on their site | built | conforms | fan-sc9 vs SC9-dark |
| SC10 No results | built | unverified | text matches; picture not compared (fan-sc10) |
| SC11 Class full | built | unverified | "No other class has a seat right now" seen (fan-sc11); board draws a January class to enrol in; picture not compared |
| P1 Professionals | built | differs | fan-p1 vs P1-dark: intro lacks "Pay to send the first message." (D-14); no ticks or photos (seed has none) |
| P2 Profile | built | conforms | fan-p2 vs P2-dark |
| P3 Not taking messages | built | unverified | text matches ("Not taking messages / Check back later"); picture not compared |
| P4 Empty field | built | conforms | fan-p4 vs P4-dark |
| P5 Offer your services | built | unverified | text matches; picture not compared (vc-p5-filled) |
| P6 Credentials | built | unverified | text matches; picture not compared (vc-p6) |
| P7 Under review | built | unverified | needs an upload; not driven |
| P8 Your listings | built | conforms | vc-p8 vs P8-dark; board "(I21)" is a designer note |
| P9 Hidden | built | unverified | text matches ("Hidden. Nobody can find you / Show"); picture not compared |
| P10 Needs a creator account | built | unverified | text matches; picture not compared (fan-p10) |
| S2 Pay a bill | built | unverified | bills switched off at launch (R-52); no entry drawn; route still opens by URL (D-15); BILLS-01 built, not compared |
| S3 Biller | built | unverified | bills switched off at launch (R-52); no entry drawn; route still opens by URL (D-15); BILLS-01 built, not compared |
| S4 Meter and amount | built | unverified | bills switched off at launch (R-52); no entry drawn; route still opens by URL (D-15); BILLS-01 built, not compared |
| S10 Meter not found | built | unverified | bills switched off at launch (R-52); no entry drawn; route still opens by URL (D-15); BILLS-01 built, not compared |
| S13 Not live yet | built | unverified | bills switched off at launch (R-52); no entry drawn; route still opens by URL (D-15); BILLS-01 built, not compared |
| S5 Review | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S6 PIN | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S7 Token | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S8 Airtime | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S9 Cable package | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S11 Not enough in wallet | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S12 Failed | missing | unbuilt | BILLS-02/03 todo; bills off (R-52) |
| S27 This month | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S28 New reminder | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S29 Reminder | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S30 Pay from the reminder | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S31 Not on Who Made This? | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S32 No reminders yet | missing | unbuilt | BILLS-05/06 todo; bills off (R-52) |
| S14 Legal chat | built | conforms | fan-s14 vs S14-dark |
| S15 Profiling | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S16 Brief | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S17 Consultant joins | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S18 Book | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S19 Pay | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S20 Booked | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S21 Quote and sign | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S22 Pay to start | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S23 Delivered | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S24 Fixed price, in chat | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S25 No slots | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |
| S26 Fixed-price request | built | unverified | chat says "The assistant is taking a while to answer" (fan-s15): no assistant on the stack; /legal-book, /legal-fixed, /legal-matter go back to the chat with no matter |

## Could not reach
Listed in the table and above: no AI assistant or voice provider on the stack (Legal S15 to S26, Studio PT2 to PT3b and PT7), no crypto or foreign money, no card, no earnings or pass, add-money inflow and failed-send states not staged, release build on Android not possible here.

## Process notes
Postgres was down at the start; I started it (`service postgresql start`) and left it up. Once I ran a `pkill -f` pattern by mistake (it hit only my own shell and my own script); no other process was touched.
