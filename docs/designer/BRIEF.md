# WAWU mobile: changes to the design canvas

Written 2 Oct 2026 for the designer of the WAWU mobile canvas, from the export
last sent (297 artboards). The designs are final as exported (DECISIONS,
Authority): nothing here is redrawn. Every change below is made in code by the
task that builds the artboard, and every screen task lists this file under Read
first (R-29). Section 12 adds the changes the build makes itself, and "Not built
at launch" lists the entries that wait for after-launch tasks. Each item below names one artboard by
its id and name, exactly as printed in the artboard's header (for example
"W10 Send · review"). Where the text sits outside a numbered artboard (a
flow's "Start here" map, a flow note, a components sheet), the item names
that instead. Every item says what is drawn now, what it must show instead,
and why. Nothing here changes the look of the app. It changes what the
screens say and which screens exist, because the owner has ruled on the
product, or because the banking provider's system works differently from
what the canvas assumes.

Who is who, so the reasons make sense:

- **Fintava** is the banking technology behind every WAWU wallet. The bank
  that holds the money and the licence is **Loma Bank** (full name "Iyin Ekiti
  Microfinance Bank Limited (Loma Bank)"). There is no "Fintava MFB".
- **Cardex** is Fintava's crypto partner. It handles USDT and USDC, nothing
  else.
- A reason like "R-10" is one of the owner's rulings. "Fintava fact" means
  Fintava's published API or price list says so.

## Ground rules for this round

1. **Keep every artboard id.** The build tracks screens by id. Never renumber.
   A new screen takes the next free id in its flow (Auth's next is A26).
   An artboard that is retired can be deleted or left marked "Retired, not
   built"; either is fine, as long as nothing links into it any more.
2. **Every amount on a screen is a sample.** Balances, fees, limits, rates
   and totals are filled in by the app from the real system. Where this brief
   gives example values, use them so the samples add up, but treat them as
   samples, not as prices.
3. **The fee row is a breakdown, never one number.** Wherever a payment is
   reviewed, draw the fee as its parts and then the total:

   > Fintava's charge + WAWU's fee = total fee, then the Total for the whole
   > payment

   Layout and row labels are your call (two rows plus a total, or one row
   with a small "₦40 + ₦25" line beneath; "Fintava's charge" or something
   like "Bank charge"). What matters is that every part and the total are
   visible before the person pays. Where WAWU adds no fee (purchases, below),
   the breakdown is just Fintava's charge and the total. Any part can be ₦0,
   so the row must also look right when it reads ₦0.
   Why: the person pays Fintava's charge plus WAWU's fee on top (R-10), and
   the real figures come from config, never from the canvas.
4. **"No fee" is never drawn as a fact.** Every "No fee" on the canvas becomes
   the breakdown in rule 3.
5. **One rule for amounts on buttons, everywhere.** The button that pays
   (the one that leads to the PIN) and the PIN sheet's "Approve" line show
   the **total the payer pays**, fees included. When another person receives
   a set amount (a send, a withdrawal, a request), that amount is its own
   line, for example "They get ₦25,000". Any "money left your wallet" line
   and any "not enough in your wallet" shortfall use the same total. A success
   screen shows the total paid; after a send or a tip it may lead with the
   amount sent ("₦25,000 sent"), as long as the total paid is its own row. A
   chat bubble shows the amount sent. A button that only opens the review and doesn't pay (for
   example "Message · ₦1,500", "Ask a follow-up · ₦1,500", "Get tickets")
   shows the price, because the review that follows shows the total.
6. **Refunds and reversals never promise more than came back.** Show the
   amount actually returned as a slot the app fills. Don't write "Nothing was
   taken", "in full" or "the full amount" about a payment that carried a
   charge: whether Fintava returns its own charge on a reversal is not
   confirmed yet. A refund names the price that comes back (the refund
   default, below).
7. **Licence, bank and deposit-insurance lines come from config.** Draw them
   as slots (keep room for a line about as long as today's) and don't write
   your own wording; the owner fills them in (R-1).
8. **No em-dashes in any copy.** Use a full stop, a comma, a colon or brackets.
   (Owner instruction, 1 Sep 2026.)

### Three defaults the owner may still change

- **Purchases carry Fintava's charge, and no WAWU fee.** Paying from your
  wallet for anything on WAWU (an unlock, a tip, a paid message, credits, a
  tick, a ticket, a course, a legal service) is a wallet to wallet move.
  The buyer pays Fintava's balance-transfer charge for it (R-10), and WAWU
  adds nothing on top, because WAWU's share is already the 15% split.
  Sending money to another WAWU user (from Wallet or in a chat) is different:
  WAWU's ₦10 is added on top (R-10).
- **The Dollar account is for later, not launch** (R-16). W2 and the Dollar
  tab on W1, W3 and W5 stay drawn as they are; at launch the app hides them,
  and hides W15's "From your Dollar account" option too. The only Dollar
  change now is W2's provider line (see W2).
- **A refund returns the price, not Fintava's charge.** When a paid message
  goes unanswered or an event is called off, the buyer gets the price back
  (the ₦1,500 message, the ₦7,500 ticket); Fintava's charge on the original
  payment is not returned. Refund copy names the price ("your ₦1,500 comes
  back", "the ticket price back") and never "everything you paid". This is
  separate from a failed send or bill (W14, S12), where whether Fintava's
  charge comes back is still unconfirmed, so rule 6 applies.

### Example values to use (Fintava's price list, 2 Oct 2026)

| Action | Fintava's charge | WAWU's fee | Total fee |
|---|---|---|---|
| Send to a bank, or withdraw to a bank | ₦40 | ₦25 | ₦65 |
| Send to a WAWU user, under ₦5,000 | ₦23.25 | ₦10 | ₦33.25 |
| Send to a WAWU user, ₦5,000 and over | ₦15.75 | ₦10 | ₦25.75 |
| A purchase on WAWU, under ₦5,000 | ₦23.25 | none (15% split) | ₦23.25 |
| A purchase on WAWU, ₦5,000 and over | ₦15.75 | none (15% split) | ₦15.75 |
| Electricity | ₦100 | none set today (₦0) | ₦100 |
| Cable TV | ₦100 | none set today (₦0) | ₦100 |
| Airtime or data | ₦0 | none set today (₦0) | ₦0 |
| Virtual card | ₦2,000 | none set (₦0) | ₦2,000 |
| Card top-up | not Fintava (another card provider, price not known yet) | 1.5% | provider + 1.5% |
| Physical card | not published by Fintava yet | ₦1,500 card + ₦500 delivery | Fintava's + ₦2,000 |

---

## 1. Everywhere

### The ₦ symbol, about 143 artboards (closed: R-35)
- **Now:** Alan Sans has no ₦ character (U+20A6), so every ₦ on the canvas is
  drawn by the phone's own fallback font.
- **Instead:** nothing changes. The ₦ is drawn by the phone's font, as the
  export does; that is the design.
- **Why:** R-35 (Lead, 2 Oct 2026), which closes D15.

## 2. Home

### H1 · Today
- **Now:** "What would you like to do today?" has four tiles: Pay bills,
  Events, Legal, **Shop**.
- **Instead:** the fourth tile is **Schools** (with a schools icon), and it
  opens SC1 Schools.
- **Why:** R-2. Shop is retired; Schools takes its place.

### H36 · Today · TGIF off
- **Now:** the same four tiles, the last one **Shop**.
- **Instead:** the fourth tile is **Schools**, opening SC1.
- **Why:** R-2.

### Home flow, "Start here" map (no artboard id)
- **Now:** the Home phone shows the Shop tile, and row 8 reads "Four services
  · Pay bills, Events, Legal, Shop · Flows S, E, SH".
- **Instead:** the phone shows the Schools tile; row 8 reads "Pay bills,
  Events, Legal, Schools · Flows S, E, SC".
- **Why:** R-2.

### H10 · Professional card
- **Now:** "4.9 · 212 reviews · **91 Trust Score** · ~3h usual reply", and
  your note lists "Trust Score" among the card's parts.
- **Instead:** remove the Trust Score figure and its label; keep rating,
  reviews and usual reply time. Drop "Trust Score" from the note.
- **Why:** R-18. No Trust Score on professional cards: a number nothing
  calculates never ships.

### H14 · Unlock sheet
- **Now:** Price ₦2,500, "Fee: No fee", button "Unlock · ₦2,500".
- **Instead:** the breakdown (rule 3): Price ₦2,500, Fintava's charge ₦23.25,
  Total ₦2,523.25; button "Unlock · ₦2,523.25".
- **Why:** R-10 and the purchases default: an unlock is a wallet to wallet
  move, which Fintava charges ₦23.25 for under ₦5,000.

### H15 · PIN
- **Now:** "Approve ₦2,500 to Chidi Eze".
- **Instead:** "Approve ₦2,523.25 to Chidi Eze".
- **Why:** rule 5, following H14.

### H16 · Unlocked
- **Now:** "Paid ₦2,500.00".
- **Instead:** "Paid ₦2,523.25" (or the price and Fintava's charge as two
  rows, your call).
- **Why:** rule 5.

### H17 · Not enough in wallet
- **Now:** "This costs ₦2,500. You have ₦1,200.00.", Price ₦2,500, "Top up
  at least ₦1,300", "Add ₦1,300".
- **Instead:** "This costs ₦2,523.25. You have ₦1,200.00." Show Fintava's
  charge under the price, then "Top up at least ₦1,323.25" and "Add
  ₦1,323.25".
- **Why:** rule 5: the shortfall includes the charge.

### H18 · Couldn't confirm
- **Now:** "₦2,500 left your wallet and we couldn't finish opening the
  video."
- **Instead:** "₦2,523.25 left your wallet ...", the total H14 now shows.
- **Why:** rule 5.

### H19 · Detail · locked preview
- **Now:** price card "₦3,000 · Yours forever" with "Unlock · ₦3,000" and
  "Pay from wallet", leading into the unlock sheet and PIN (H14 to H16).
- **Instead:** if this button opens the H14 sheet, it keeps the price
  ("Unlock · ₦3,000") and the sheet shows the total. If you mean it to go
  straight to the PIN, it shows the total instead: "Unlock · ₦3,023.25"
  (₦3,000 + Fintava's ₦23.25).
- **Why:** rule 5 and the purchases default.

### H25 · Detail · course
- **Now:** "Pay from wallet · ₦485,250 available" and "Unlock course ·
  ₦8,000".
- **Instead:** as H19: a price if it opens the unlock sheet, or the total
  "Unlock course · ₦8,015.75" (₦8,000 + Fintava's ₦15.75) if it goes straight
  to the PIN.
- **Why:** rule 5 and the purchases default.

### H26 · Tip sheet
- **Now:** amounts, note, Pay from wallet, "Tip ₦2,000". No fee shown.
- **Instead:** add the breakdown above Pay from wallet: Tip ₦2,000,
  Fintava's charge ₦23.25, Total ₦2,023.25; button "Tip ₦2,023.25".
- **Why:** R-10 and the purchases default; rule 5.

### H27 · PIN
- **Now:** "Approve ₦2,000 to Tife Adeola".
- **Instead:** "Approve ₦2,023.25 to Tife Adeola".
- **Why:** rule 5, following H26.

### H28 · Tip sent
- **Now:** "₦2,000 sent to Tife" and the note, then Done.
- **Instead:** keep the heading, and add a row "Total paid ₦2,023.25".
- **Why:** rule 5.

## 3. Me (profile and menu)

### M1 · Me · Content
- **Now:** profile tabs Content · Services · **Shop** · About.
- **Instead:** three tabs: Content · Services · About.
- **Why:** R-9. No Shop tab on profiles; creators don't sell physical
  products yet.

### M2 · Services
- **Now:** tabs Content · Services · Shop · About, and the flow arrow "Tap
  Shop" leads on to M3.
- **Instead:** three tabs (Content · Services · About). The next step after
  M2 is "Tap About" to M4; the arrow to M3 goes.
- **Why:** R-9.

### M3 · Shop
- **Now:** the creator's Shop tab with products.
- **Instead:** retired. Delete it, or mark it "Retired, not built". Nothing
  links to it.
- **Why:** R-9.

### M4 · About
- **Now:** tabs Content · Services · Shop · About.
- **Instead:** Content · Services · About.
- **Why:** R-9.

### M5 · Public profile
- **Now:** visitor view, tabs Content · Services · Shop · About.
- **Instead:** Content · Services · About.
- **Why:** R-9.

### M6 · Following
- **Now:** tabs Content · Services · Shop · About.
- **Instead:** Content · Services · About.
- **Why:** R-9.

### M10 · Saved (the "Profile saved" toast over the profile)
- **Now:** tabs Content · Services · Shop · About.
- **Instead:** Content · Services · About.
- **Why:** R-9.

### M33 · About, as a visitor
- **Now:** tabs Content · Services · Shop · About.
- **Instead:** Content · Services · About.
- **Why:** R-9.

### M7 · Menu
- **Now:** "My purchases · 12" and "My courses · 1 enrolled". The Shop flow's
  own map wires a second meaning onto My purchases ("Me menu · My purchases
  → orders", opening SH9 My orders).
- **Instead:** keep the menu as drawn. "My purchases" opens M29 (content you
  bought) and nothing else; there are no Shop orders. "My courses" stays as
  the Schools entry (opens SC8).
- **Why:** R-2. The Me menu's Shop entry goes; Schools is already there as My
  courses.

### Me flow, "Start here" map (no artboard id)
- **Now:** the phone shows the Shop tab, and hotspot 9 reads "Shop tab · Your
  products · Opens M3".
- **Instead:** the phone shows three tabs; remove hotspot 9 and renumber the
  hotspots after it.
- **Why:** R-9.

### M18 · Creator dashboard
- **Now:** the Earnings row's subtitle reads "Move to your wallet (W39)".
- **Instead:** a subtitle that doesn't ask for a move, for example "Lands in
  your wallet automatically", still opening W39.
- **Why:** R-11. Earnings land in the wallet by themselves.

### M12 · Pay
- **Now:** Professional tick ₦2,000, Pay from wallet, "Pay ₦2,000". No fee
  shown.
- **Instead:** add the breakdown: Fintava's charge ₦23.25, Total ₦2,023.25;
  button "Pay ₦2,023.25".
- **Why:** R-10 and the purchases default.

### M13 · PIN
- **Now:** "₦2,000 for the professional tick".
- **Instead:** "₦2,023.25 for the professional tick".
- **Why:** rule 5, following M12.

## 4. Shop

### SH1 to SH15 · the whole Shop flow
- **Now:** a full marketplace flow (Marketplace, product, cart, checkout,
  My orders, and so on).
- **Instead:** retired. Delete the flow, or mark every artboard "Retired, not
  built". The combined "WAWU Dark" and "WAWU Light" files carry it as
  "Flow 10 of 12 · Shop"; drop it there too, and apply every change in this
  brief to those combined files as well as to the per-flow files.
- **Why:** R-2.

### Shop flow, "Start here" map, and SH9 · My orders
- **Now:** the map says Shop opens from "Home · Shop" and lists "Me menu · My
  purchases → orders · Opens SH9". SH9 is marked "Starts from SH8 · My
  orders, or Me menu".
- **Instead:** no entry into Shop from Home or from the Me menu. If you keep
  the flow as retired, delete these links so nothing points into it.
- **Why:** R-2.

## 5. Schools

### Schools flow, "Start here" map (no artboard id)
- **Now:** "Schools open from Explore."
- **Instead:** "Schools open from the Schools tile on Home, and from Explore."
- **Why:** R-2.

### SC5 · Pay
- **Now:** Course fee ₦150,000, "Fee: No fee", Total ₦150,000, button "Pay
  ₦150,000".
- **Instead:** the breakdown: Course fee ₦150,000, Fintava's charge ₦15.75,
  Total ₦150,015.75; button "Pay ₦150,015.75".
- **Why:** R-10 and the purchases default (₦15.75 from ₦5,000).

### SC6 · PIN
- **Now:** "Approve ₦150,000 to Greenfield Tech Academy".
- **Instead:** "Approve ₦150,015.75 to Greenfield Tech Academy".
- **Why:** rule 5, following SC5.

### SC7 · Enrolled
- **Now:** "Paid ₦150,000".
- **Instead:** "Paid ₦150,015.75" (or the course fee and Fintava's charge as
  two rows).
- **Why:** rule 5.

## 6. Open your wallet (the Auth flow)

The owner moved identity checks out of sign-up (R-6). Sign-up is email and
phone only. The BVN step, details, selfie, account opening and PIN screens
(A5 to A10, A14, A16) now form **"Open your wallet"**, which starts the first
time someone taps Wallet or anything that moves money. Keep their look; only
where they sit changes. Fintava will not open an account without a **NIN**
and a **full address**, and its BVN check returns name, date of birth,
gender, phone and photo only. Fintava's API has **no account tiers**.

### Auth flow, "Start here" map (no artboard id)
- **Now:** a row "Wallet settings · Tier · Raise your limits · Opens A17".
- **Instead:** remove the row.
- **Why:** Fintava fact: the API has no tiers, so there is no tier to raise
  (A17 to A20 are on hold, below).

### Auth flow note, "Sign up · A1–A16" (no artboard id)
- **Now:** "One path, left to right. Email, phone and BVN first. The phone
  and the face must match the BVN. BVN fills the rest. Tier 1 opens the
  wallet."
- **Instead:** split it to match the new order. Sign up (A1, A2, A3, A4):
  email and phone. Open your wallet (A26, A14, A5, A6, A7, A16, A8, A9,
  A10): BVN and NIN, details and address, selfie, then the wallet opens. No
  "Tier 1".
- **Why:** R-6, and no tiers in Fintava's API.

### Auth flow note, "Tiers · A17–A21" (no artboard id)
- **Now:** "Raise your limits. CBN tiers. Tier 1 is done at sign-up.",
  starting from "A8 · Raise your limits, or Wallet settings".
- **Instead:** drop "CBN tiers. Tier 1 is done at sign-up." and the A8 start.
  A21 Payout bank stays as drawn; A17 to A20 are on hold (below).
- **Why:** R-6 (nothing about the wallet happens at sign-up) and no tiers in
  Fintava's API.

### A3 · Email, phone, BVN
- **Now:** "Let's open your account. Your BVN fills in the rest." Email,
  Phone, **BVN** ("Dial *565*0# to get it"), Password, and "Checked with
  NIBSS. We never see your balances."
- **Instead:** sign-up only: Email, Phone number, Password. No BVN field, and
  no line about NIBSS. Heading along the lines of "Create your account".
- **Why:** R-6.

### New artboard A26 · Open your wallet: BVN and NIN
- **Now:** not drawn. The BVN field sits on A3.
- **Instead:** the first screen of Open your wallet, in A3's field style:
  BVN (with the "Dial *565*0# to get it" hint) and **NIN** beside it (the
  canvas's own hint from A18 works: "Dial *346# from the phone on your NIN to
  get it"). "Must be the number on your BVN" stays relevant for the phone, so
  A14's error now belongs to this step.
- **Why:** R-6, and a Fintava fact: opening an account requires the BVN and
  the NIN.

### A14 · Phone doesn't match BVN
- **Now:** drawn as an error state of A3 (sign-up).
- **Instead:** the same error, as a state of the new BVN and NIN step (A26),
  showing that screen's fields.
- **Why:** R-6.

### A5 · Confirm your details
- **Now:** a "From your BVN" card (Name, Date of birth, Gender), then typed
  fields "State you live in" and "Occupation", then terms and Continue.
- **Instead:** keep the BVN card exactly as is. Below it, add a full
  **home address**: street address, city or town, and state (the existing
  "State you live in" picker becomes the state part of the address). Keep
  Occupation. Use the field style A20 already draws for an address (Home
  address, City, State).
- **Why:** Fintava fact: an account cannot open without a full address. The
  BVN check doesn't return an address, state or occupation, so the person
  types them.

### A6 · Selfie
- **Now:** "Fit your face in the oval. It must match your BVN photo. Then
  blink slowly".
- **Instead:** drop "Then blink slowly". For example: "Fit your face in the
  oval. It must match your BVN photo." Nothing on this screen, or on A7 and
  A16, may say or suggest a liveness check.
- **Why:** Fintava fact: Fintava's API matches the selfie against the BVN
  photo and has no liveness check, so the app cannot claim one.

### A8 · Wallet open
- **Now:** "Tier 1 · Fintava MFB", Bank "Fintava MFB", Limit "₦300,000
  balance", and a "Raise your limits" link.
- **Instead:** the subtitle and the Bank row show the bank name as a slot the
  app fills. Sample: "Loma Bank", and make sure the long legal name "Iyin
  Ekiti Microfinance Bank Limited (Loma Bank)" also fits (wrap or truncate).
  No "Tier 1". Draw the Limit row as a slot that can be hidden. Remove the
  "Raise your limits" link; "Create your transaction PIN" stays.
- **Why:** R-1 and a Fintava fact: the bank is Loma Bank and its name comes
  from the API. Fintava's API has no tiers, so there is nothing to raise;
  limits are still a question for Fintava.

### A17 to A20 · Account limits, Tier 2 · NIN, Tier 2 done, Tier 3 · address (hold, owner to rule)
- **Now:** a three-tier ladder: Tier 1 (BVN and selfie), Tier 2 (upgrade with
  your NIN, A18), Tier 3 (upgrade with proof of address, A20), with limits and
  "Limits set by the CBN. ⚠ Final numbers from Fintava."
- **Instead:** don't redraw these yet; nothing links to them now (A8's link
  and the Auth map row go). Every wallet now gives its NIN and address when it
  opens (A26 and A5), so A18's "upgrade with NIN" repeats a step everyone has
  done, and A20's address fields do the same (the proof-of-address upload may
  still be needed). The owner will rule on what these four screens become.
- **Why:** Fintava facts: NIN and address are required to open; the API has
  no tiers; limits are a question put to Fintava.

## 7. Wallet

### Wallet flow, "Start here" map (no artboard id)
- **Now:** the phone's balance card reads "WAWU · Fintava MFB". Hotspot 5
  reads "Crypto tab · Receive and send USDT, BTC". A row reads "Me → Creator
  dashboard → Earnings · Creator earnings, move to wallet · Opens W39".
  Hotspots 3 and 4 offer "Swap · Naira, dollars and crypto" and "Dollar tab ·
  Dollar account · Opens W2".
- **Instead:** the card reads "WAWU · Loma Bank" (bank name slot). Hotspot 5:
  "Receive and send USDT, USDC". The earnings row: "Creator earnings · Opens
  W39", no "move to wallet". Hotspots 3 and 4 can stay, marked "after
  launch" for the Dollar parts.
- **Why:** R-1 (bank name); Cardex fact (no BTC); R-11 (earnings land in the
  wallet by themselves); R-16 (dollar account after launch).

### Wallet flow note, "Wallet · W1–W6" (no artboard id)
- **Now:** "'Wallet' is the label, but these are full bank accounts at
  Fintava MFB."
- **Instead:** "... full bank accounts at Loma Bank", or drop the bank name.
- **Why:** R-1.

### Wallet flow note, "Cards · W29–W34 · WAWU Verve card" (no artboard id)
- **Now:** "Virtual cards are free and ready instantly."
- **Instead:** drop "are free". Virtual cards cost Fintava's ₦2,000 (see
  W29).
- **Why:** R-10, Fintava's price list.

### Wallet "For approval · New components in this flow" sheet (no artboard id)
- **Now:** the Banner sample reads "Your money is held at Fintava MFB ·
  Licensed by the CBN. Deposits insured by NDIC." The "KeyValue rows (review,
  receipt)" sample shows "Fee ₦10.00".
- **Instead:** the Banner's bank name is a slot (sample "Loma Bank"), and the
  licence line and the deposit-insurance line are slots filled from config by
  the owner (rule 7); don't state NDIC cover yourself. The KeyValue sample
  shows the fee breakdown (rule 3), for example ₦40 + ₦25 = ₦65.
- **Why:** R-1: bank, licence and insurance claims come from config. R-10:
  the fee is a breakdown.

### W1 · Wallet · Naira
- **Now:** the balance card reads "WAWU · Fintava MFB". Tabs Naira, Dollar,
  Crypto.
- **Instead:** "WAWU · " followed by the bank name as a slot the app fills.
  Sample "Loma Bank". Keep the Dollar tab drawn; the app hides it at launch.
  In the recent transactions, a debit row shows the total that left the
  wallet: "Chidinma Okoro · Transfer · GTBank −₦25,065.00" (₦25,000 + ₦65)
  and "Ikeja Electric · Prepaid −₦10,600.00" (₦10,500 + ₦100). The tip
  received stays +₦2,000.00.
- **Why:** R-1 and a Fintava fact: the bank is Loma Bank, named by the API.
  R-16 for the Dollar tab. Rule 5 and R-10 for the debit rows.

### W26 · Transaction history
- **Now:** debit rows "MTN airtime −₦2,000.00", "Ikeja Electric · Prepaid
  −₦10,500.00", "Chidinma Okoro · Transfer · GTBank −₦25,000.00", and the
  summary "Out · September ₦96,820.50".
- **Instead:** each debit row shows the total that left the wallet:
  Ikeja Electric −₦10,600.00, the GTBank transfer −₦25,065.00, MTN airtime
  −₦2,000.00 (its charge is ₦0). "Out · September" is the sum of those
  totals (keep it an obvious sample).
- **Why:** rule 5 and R-10: the money that left the wallet includes the
  charges.

### W27 · Transaction detail
- **Now:** the drawn example is a tip received (+₦2,000.00), with no charge.
- **Instead:** keep it. For a debit, the detail shows the amount, Fintava's
  charge, WAWU's fee (if any) and the total, so the charge behind each W26
  row is visible here. If you draw a debit example, use the GTBank send:
  ₦25,000 + (₦40 + ₦25) = ₦25,065.00.
- **Why:** R-10: the charges must be visible somewhere the person can check.

### W2 · Wallet · Dollar
- **Now:** "USD account · Fintava".
- **Instead:** keep the screen as drawn for after launch. The provider line
  is a slot filled from config (sample "USD account").
- **Why:** R-16 (dollar account after launch) and R-1 (provider and bank
  lines come from config).

### W5 · Wallet · new account
- **Now:** "WAWU · Fintava MFB".
- **Instead:** "WAWU · Loma Bank" (bank name slot, as W1). Dollar tab as W1.
- **Why:** R-1.

### W10 · Send · review
- **Now:** sending ₦25,000 to Guaranty Trust Bank, "Fee ₦10.00", "Total
  ₦25,010.00". (₦10 is WAWU's fee for sending to a WAWU user, not to a bank.)
- **Instead:** the fee breakdown (rule 3). For this bank send: Fintava's
  charge ₦40 + WAWU's fee ₦25 = ₦65, Total ₦25,065.00. If you also draw the
  WAWU-user version: ₦15.75 + ₦10 = ₦25.75, Total ₦25,025.75. The button
  shows the total, "Send ₦25,065", and a line above it says what arrives:
  "They get ₦25,000" (rule 5). Your note on W10, "The button shows the amount
  the person receives", changes to match.
- **Why:** R-10, Fintava's price list.

### W11 · Send · PIN
- **Now:** behind the PIN sheet, W10's rows with "Fee ₦10.00", "Total
  ₦25,010.00".
- **Instead:** the same rows as the new W10 (₦40 + ₦25 = ₦65, Total
  ₦25,065.00), and the sheet's line "Approve ₦25,000 to Chidinma Okoro"
  becomes "Approve ₦25,065 to Chidinma Okoro".
- **Why:** R-10 and rule 5.

### W12 · Send · success receipt
- **Now:** "Fee ₦10.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65 for the bank send shown,
  and a "Total paid ₦25,065.00" row. The heading "₦25,000 sent" stays.
- **Why:** R-10 and rule 5.

### W14 · Send · failed
- **Now:** "Reversed to your wallet", "Amount ₦25,010.00", and a note headed
  "Nothing was taken" saying "The full ₦25,010 is back in your Naira wallet."
- **Instead:** the Amount row is "Returned to your wallet" with a slot the
  app fills (sample ₦25,000.00); if a charge was kept, a second row shows it.
  Replace the note's heading "Nothing was taken" with a plain one such as
  "Your money is back", and the line with "₦25,000 is back in your Naira
  wallet." No "full", no "nothing was taken".
- **Why:** rule 6. The total now includes Fintava's charge (R-10), and
  whether Fintava returns its charge on a reversal is not confirmed.

### W15 · Add money
- **Now:** Bank "Fintava MFB". Under Other ways, "Debit card · Instant ·
  1.5% fee", and "From your Dollar account · $1 = ₦1,580.00".
- **Instead:** Bank shows the bank name slot (sample "Loma Bank", long name
  must fit). The card row's fee reads as a breakdown hint, for example
  "Card provider's charge + 1.5%". Keep the Dollar option drawn; the app
  hides it at launch.
- **Why:** R-1 for the bank. R-10 for the card: WAWU's 1.5% is added to the
  card provider's own charge (Fintava doesn't take cards, so it is another
  provider; card top-up comes after launch). R-16 for the Dollar option.

### W16 · Add money · card
- **Now:** "Card fee ₦150.00", You pay ₦10,150.00, Wallet gets ₦10,000.00.
- **Instead:** the card fee as a breakdown: card provider's charge + WAWU's
  1.5% (₦150 on ₦10,000) = card fee, then You pay and Wallet gets. The
  provider's charge isn't known yet, so draw it as an obvious sample. The
  button shows what the card is charged ("Pay ₦10,150" plus the provider's
  part), not "Add ₦10,000"; "Wallet gets ₦10,000" stays as its own line.
- **Why:** R-10 and rule 5.

### W17 · Withdraw to bank
- **Now:** "Fee ₦25.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65 (on ₦50,000, so ₦50,065.00
  leaves the wallet). The button shows the total, "Withdraw ₦50,065", with a
  line "Your bank gets ₦50,000".
- **Why:** R-10, Fintava's price list (a withdrawal is a bank send); rule 5.

### W19 · Withdraw · on its way
- **Now:** "Fee ₦25.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65, and a "Total paid
  ₦50,065.00" row. The heading "₦50,000 on its way" stays.
- **Why:** R-10 and rule 5.

### W29 · Cards · get a card
- **Now:** Physical card "Delivered in 3–5 working days · ₦2,000"; Virtual
  card "Ready now, for online payments · **Free**".
- **Instead:** neither price is a single fixed number. Physical: WAWU's ₦1,500
  card + ₦500 delivery, plus Fintava's card charge (not published yet).
  Virtual: not free; Fintava charges ₦2,000 (+ WAWU's fee, none set). Show
  each as "from" a sample, with the breakdown on the next screen.
- **Why:** R-10 and Fintava's price list. Cards come after launch and are
  still undecided (R-16), so this can wait for the rest of this list.

### W30 · Cards · delivery
- **Now:** Card ₦1,500, Delivery ₦500, Total ₦2,000.
- **Instead:** add Fintava's card charge as its own row before the total
  (sample left obvious; Fintava hasn't published it). The button "Order card
  · ₦2,000" shows that new total.
- **Why:** R-10 and rule 5.

### W33 · Card · limits and controls
- **Now:** your note "⚠ These are CBN-style default limits. The real caps
  depend on your KYC tier."
- **Instead:** "Card limits come from Fintava when cards are built." No
  tier.
- **Why:** Fintava fact: no tiers in the API.

### W35 · Wallet settings
- **Now:** "Tier 2 account · ₦5,000,000 daily · BVN + NIN verified" and
  "Account details · Fintava MFB · 812 345 6789".
- **Instead:** "Account details · Loma Bank · 812 345 6789" (bank name
  slot). The top row can't name a tier: draw it as a limits row that the app
  can fill or hide.
- **Why:** R-1; Fintava fact: no tiers in the API, limits still to come from
  Fintava.

### Wallet flow note, "Earnings · W39–W40" (no artboard id)
- **Now:** "Earnings build up from unlocks, tips and paid DMs, then move into
  the Naira wallet. KYC gates this move (from the code: KYC decides when
  earnings pay out, never what can be published)."
- **Instead:** "Earnings from unlocks, tips and paid DMs land in the Naira
  wallet automatically." No "move", and no KYC gate on it; a creator without
  a wallet yet keeps earning and the money lands when they open one.
- **Why:** R-11.

### W39 · Earnings
- **Now:** "Ready to move ₦84,500.00" and a **Move to wallet** button.
- **Instead:** no button and no "Ready to move". Earnings land in the wallet
  by themselves. Lead with what was earned (for example "₦312,800 earned
  all time", or this month) and keep the breakdown by stream and by content.
  For a creator who hasn't opened a wallet yet, a short note: the money is
  waiting and lands the moment they open one, with a link to Open your
  wallet.
- **Why:** R-11.

### W40 · Earnings · move to wallet
- **Now:** the "Move ₦84,500 to your wallet. It's instant and free." sheet.
- **Instead:** retired. Delete it or mark it "Retired, not built". Nothing
  links to it.
- **Why:** R-11.

### W41 · Share as
- **Now:** Bank "Fintava MFB", footer "Check it at wawu/r/T1P9 · Fintava MFB,
  licensed by the CBN".
- **Instead:** Bank shows the bank name slot (sample "Loma Bank"). The footer's
  licence wording is a slot filled from config by the owner (rule 7).
- **Why:** R-1.

### W42 · Image
- **Now:** same receipt: Bank "Fintava MFB", "Fintava MFB, licensed by the
  CBN".
- **Instead:** as W41.
- **Why:** R-1.

### W43 · PDF
- **Now:** same receipt: Bank "Fintava MFB", "Fintava MFB, licensed by the
  CBN".
- **Instead:** as W41.
- **Why:** R-1.

### W3 · Wallet · Crypto
- **Now:** holdings Tether (USDT · TRC-20, ERC-20) and **Bitcoin** (BTC ·
  Bitcoin network, 0.014200 BTC); a "Sent BTC" transaction; your note "USDT
  and BTC held by Fintava's custody partner, totalled in dollars".
- **Instead:** two holdings: **USDT** and **USDC**, nothing else. Replace the
  BTC transaction with a USDC one. USDT networks: TRC-20, ERC-20, BEP-20.
  USDC networks: TRC-20, ERC-20, BEP-20, Base, Solana. Any line saying who
  holds the coins is a slot filled from config. The Dollar tab as W1.
- **Why:** Cardex fact: only USDT and USDC. Cardex holds the coins in WAWU's
  own treasury, so the wording is the owner's.

### W22 · Crypto · receive
- **Now:** asset switch "USDT | BTC"; networks TRC-20, ERC-20, BEP-20.
- **Instead:** "USDT | USDC". For USDC the network choice adds Base and Solana.
  Add a short line under the address for the minimum deposit on that network
  (a slot; Cardex sets a minimum per network).
- **Why:** Cardex facts: no BTC; USDC runs on five networks; each network has
  a minimum deposit.

### W23 · Crypto · send
- **Now:** "The network fee comes off the amount": Amount 120.00 USDT,
  Network fee 1.00 USDT, They get 119.00 USDT.
- **Instead:** the fee is added on top: Amount 120.00 USDT, Network fee (a
  slot; keep 1.00 USDT as a sample), Total from your balance 121.00 USDT,
  They get 120.00 USDT.
- **Why:** Cardex fact: the fee is charged on top of the amount.

### W20 · Swap
- **Now:** Naira to "Dollar", "Holds 0:28" (your note: "The rate is held for
  30 seconds"), "Fee: No fee".
- **Instead:** the rate hold counts down from the quote's real expiry, which
  is **90 seconds** today (sample "Holds 1:28"). The fee row is a breakdown
  slot (Cardex's charge + WAWU's fee); the amounts aren't known yet, so keep
  them obvious samples. A swap into crypto shows **USDT** or **USDC** as the
  "You get" side, never "Dollar" or "Dollar account"; a swap with the real
  Dollar account comes later with W2.
- **Why:** Cardex facts: a quote is held 90 seconds and used once; conversion
  fees are still to come from Fintava; a stablecoin balance is not a dollar
  account. R-16: the dollar account comes after launch.

### W21 · Swap · review
- **Now:** "To: Dollar account", "Fee: No fee", the same 0:28 hold.
- **Instead:** "To" names the asset (USDT or USDC), the fee row is the
  breakdown slot, and the hold matches W20 (90 seconds). The button "Swap
  ₦158,000" shows the total including that fee slot.
- **Why:** as W20, and rule 5.

## 8. Bills and Legal (the Services flow)

Bills are not free. Fintava charges ₦100 for electricity and for cable TV,
and ₦0 for airtime and data; WAWU's bill fee is added on top if the owner
sets one (none today). The payer also pays Fintava's balance-transfer charge
for moving the money into WAWU's wallet, as on any purchase (R-31, default
until the owner rules); the samples below leave it out, and the app shows it
from the fee quote. Legal services are purchases (the default above).

### Services flow, "Start here" map (no artboard id)
- **Now:** the Home phone shows the Shop tile, and hotspot 5 reads "Shop ·
  Shop flow · Flow SH".
- **Instead:** the phone shows the Schools tile, and hotspot 5 reads "Schools
  · Schools flow · Flow SC".
- **Why:** R-2.

### S3 · Biller
- **Now:** several electricity billers say "Prepaid and postpaid".
- **Instead:** the billers Fintava lists, with their prepaid and postpaid
  codes as listed, each with its own minimum and maximum. (This item first
  said "Prepaid only, never below ₦500"; the sandbox corrected it.)
- **Why:** Fintava fact from the sandbox (`docs/fintava/sandbox/16-bills-discos.md`):
  postpaid is listed, minimums run from ₦0 to ₦1,000, and some billers are
  unavailable and are hidden.

### S5 · Review
- **Now:** Ikeja Electric ₦10,000.00, "Fee: No fee", Total ₦10,000.00, "Pay
  ₦10,000".
- **Instead:** the fee breakdown: Fintava's charge ₦100 + WAWU's fee ₦0 =
  ₦100, Total ₦10,100.00. The button says "Pay ₦10,100".
- **Why:** R-10, Fintava's price list.

### S6 · PIN
- **Now:** behind the sheet, S5's rows with "No fee"; the sheet says "Approve
  ₦10,000 to Ikeja Electric".
- **Instead:** S5's new rows behind it, and "Approve ₦10,100 to Ikeja
  Electric".
- **Why:** rule 5.

### S7 · Token
- **Now:** "₦10,000 paid".
- **Instead:** "₦10,100 paid", or "₦10,000 paid" with a row showing the
  ₦100 charge; the total paid must be visible.
- **Why:** rule 5.

### S11 · Not enough in wallet
- **Now:** S5's rows with "No fee", and "You have ₦6,200.00. Add ₦3,800 to
  pay this." / "Add ₦3,800".
- **Instead:** S5's new rows (Total ₦10,100.00), and the shortfall that
  follows: "Add ₦3,900".
- **Why:** rule 5: the total includes the fee, so the shortfall does too.

### S12 · Failed
- **Now:** "Reversed to your wallet", "Amount ₦10,000.00".
- **Instead:** the Amount row is "Returned to your wallet" with a slot the
  app fills (sample ₦10,000.00); if a charge was kept, a second row shows it.
- **Why:** rule 6.

### S8 · Airtime
- **Now:** network, number, amount, then "Buy ₦2,000 airtime" straight to the
  PIN. No fee shown anywhere.
- **Instead:** show the fee before the PIN, either a review step like S5 or a
  fee line above the button: ₦0 + ₦0 = ₦0, Total ₦2,000. It reads ₦0 today,
  but WAWU may set a bill fee, so the line must exist.
- **Why:** R-10: the fee is always shown before paying.

### S9 · Cable package
- **Now:** DStv packages, then "Smartcard, review, PIN, receipt".
- **Instead:** no change to S9 itself; the cable review it leads to must
  carry the breakdown. If you draw that review, sample: Compact ₦15,700 +
  (₦100 + ₦0) = Total ₦15,800.
- **Why:** R-10, Fintava's price list.

### S30 · Pay from the reminder
- **Now:** Ikeja Electric, Amount ₦10,500, Pay from wallet, "Pay ₦10,500",
  then the PIN. No fee shown.
- **Instead:** add the fee breakdown above Pay from wallet: ₦100 + ₦0 = ₦100,
  Total ₦10,600, button "Pay ₦10,600".
- **Why:** R-10: bills carry Fintava's ₦100 for electricity.

### S19 · Pay (legal consultation)
- **Now:** Video consultation ₦15,000, Pay from wallet, "Pay ₦15,000". No fee
  shown.
- **Instead:** add the breakdown: Fintava's charge ₦15.75, Total ₦15,015.75;
  button "Pay ₦15,015.75".
- **Why:** R-10 and the purchases default.

### S22 · Pay to start
- **Now:** a row "Fee ₦45,000" (the legal price), "Pay ₦45,000 to start".
- **Instead:** call the price row "Price" (so it isn't mistaken for the fee
  breakdown), add Fintava's charge ₦15.75, Total ₦45,015.75; button "Pay
  ₦45,015.75 to start".
- **Why:** R-10 and the purchases default.

### S26 · Fixed-price request
- **Now:** a row "Fee ₦35,000" (the price), "Continue · ₦35,000", then Pay
  and PIN.
- **Instead:** on S26 itself, call the price row "Price", add Fintava's
  charge ₦15.75 and Total ₦35,015.75; button "Continue · ₦35,015.75" (it
  leads to the PIN, so it shows the total, rule 5).
- **Why:** R-10 and the purchases default.

## 9. Inbox

### Inbox flow note, "Paid DMs · I2–I8" (no artboard id)
- **Now:** "... and if they don't answer in time the full amount comes back."
- **Instead:** "... and if they don't answer in time, the price of the
  message comes back." No "full amount".
- **Why:** rule 6: the fan paid Fintava's charge too, and it isn't confirmed
  that it comes back.

### I3 · Write the question
- **Now:** ₦1,500, "No reply in time, your ₦1,500 comes back in full", Pay
  from wallet, "Send · ₦1,500". No fee shown.
- **Instead:** add the breakdown: Fintava's charge ₦23.25, Total ₦1,523.25;
  button "Send · ₦1,523.25". The refund line names the amount that comes back
  without "in full": "No reply in time, your ₦1,500 comes back."
- **Why:** R-10 and the purchases default; rule 6 for the refund.

### I6 · Not enough in wallet
- **Now:** I3's line "No reply in time, your ₦1,500 comes back in full", then
  "You need ₦1,500. You have ₦900.00." and "Add ₦600".
- **Instead:** the refund line as on I3 ("your ₦1,500 comes back", no "in
  full"), then "You need ₦1,523.25. You have ₦900.00." and "Add ₦623.25".
- **Why:** rule 5 (the shortfall uses I3's total) and rule 6.

### I10 · Reply
- **Now:** "That's 85% of ₦1,500. Miss it and Bisi gets the full amount
  back."
- **Instead:** "That's 85% of ₦1,500. Miss it and Bisi gets her ₦1,500
  back." No "full amount".
- **Why:** rule 6.

### I11 · Answered
- **Now:** "₦1,275 added to your earnings. Replied in 49 minutes. It moves to
  your wallet from Earnings (W39).", and the flow arrow under it reads
  "Earnings move to the wallet from W39".
- **Instead:** "₦1,275 is in your wallet. Replied in 49 minutes." (for a
  creator without a wallet yet: "... it lands when you open your wallet").
  The arrow becomes "Earnings show in W39".
- **Why:** R-11. Earnings land in the wallet by themselves.

### I8 · Creator has paid messages off
- **Now:** "You can still follow, tip and buy from Tolu's shop."
- **Instead:** "You can still follow, tip and buy Tolu's work."
- **Why:** R-2 and R-9: there is no shop.

### I14 · Amount (send money in a chat)
- **Now:** ₦25,000 to Femi, "Send ₦25,000", then the PIN. No fee shown.
- **Instead:** add a fee line above the button: Fintava's charge ₦15.75 +
  WAWU's fee ₦10 = ₦25.75, Total ₦25,025.75. The button shows the total,
  "Send ₦25,025.75", with a line "Femi gets ₦25,000", as on W10 (rule 5).
- **Why:** R-10: sending to a WAWU user carries Fintava's charge plus WAWU's
  ₦10.

### I18 · Request from someone
- **Now:** Kemi requests ₦12,000; the bubble's button is "Pay ₦12,000", then
  the W11 PIN. No fee shown.
- **Instead:** paying a request is a send to a WAWU user, so show the
  breakdown before the PIN (in the bubble, or a short review sheet):
  Fintava's charge ₦15.75 + WAWU's fee ₦10 = ₦25.75, Total ₦12,025.75, "Kemi
  gets ₦12,000"; button "Pay ₦12,025.75".
- **Why:** R-10 and rule 5, as I14.

### I21 · Settings (paid messages)
- **Now:** "On · fans pay ₦1,500 to ask you".
- **Instead:** "On · ₦1,500 a message". Fans pay the price plus Fintava's
  charge, so the line names the price, not what fans pay.
- **Why:** R-10 and the purchases default.

### I22 · Warning
- **Now:** the warning keeps the line "On · fans pay ₦1,500 to ask you".
- **Instead:** "₦1,500 a message", as I21.
- **Why:** as I21.

### I23 · Switched off for 7 days
- **Now:** "Back on 3 October. Publishing, communities, tips and your shop
  all keep working."
- **Instead:** "Back on 3 October. Publishing, communities and tips all keep
  working."
- **Why:** R-2 and R-9.

### I28 · Buy credits
- **Now:** 120 credits for ₦1,000, "Buy 120 credits · ₦1,000". No fee shown.
- **Instead:** add the breakdown: Fintava's charge ₦23.25, Total ₦1,023.25;
  button "Buy 120 credits · ₦1,023.25". Credits stay a count.
- **Why:** R-10 and the purchases default.

### I29 · Credits added
- **Now:** "Paid ₦1,000 from your Naira wallet."
- **Instead:** "Paid ₦1,023.25 from your Naira wallet."
- **Why:** rule 5.

## 10. Events

### Events flow, "Start here" map (no artboard id)
- **Now:** the Home phone shows the Shop tile.
- **Instead:** the Schools tile.
- **Why:** R-2.

### E3 · Pay
- **Now:** Tickets ₦7,500, "Fee: No fee", Total ₦7,500, button "Pay ₦7,500".
- **Instead:** the breakdown: Tickets ₦7,500, Fintava's charge ₦15.75, Total
  ₦7,515.75; button "Pay ₦7,515.75".
- **Why:** R-10 and the purchases default (ticket money is held in WAWU's own
  wallet until the event, R-19).

### E4 · PIN
- **Now:** "Approve ₦7,500 to WAWU Creators Summit".
- **Instead:** "Approve ₦7,515.75 to WAWU Creators Summit".
- **Why:** rule 5.

### E11 · Called off
- **Now:** "₦7,500 is back in your Naira wallet."
- **Instead:** keep the sentence; the amount is the ticket price (sample
  ₦7,500), filled by the app. Don't add "in full" or "everything you paid".
- **Why:** the refund default (R-10): a refund returns the ticket price, not
  Fintava's charge.

### E25 · Call it off
- **Now:** "This refunds real money. All 64 buyers get their money back."
- **Instead:** "This refunds real money. All 64 buyers get the ticket price
  back."
- **Why:** the refund default (R-10): Fintava's charge on each ticket isn't
  returned, so "their money back" promises more than the buyer gets.

## 11. Settings

### Settings flow, "Start here" map (no artboard id)
- **Now:** the Me menu phone shows "My content · 4 of 7 slots".
- **Instead:** "My content · 4 of 5 uploads", as on M7.
- **Why:** R-7.

### Z1 · Me menu
- **Now:** "My content · 4 of 7 slots".
- **Instead:** "My content · 4 of 5 uploads", as on M7.
- **Why:** R-7: free accounts get 5 uploads (25 with a tick); there are no
  "7 slots".

### Z2 · Settings
- **Now:** the "Wallet and PIN" row's subtitle is "Tier 2 · W35".
- **Instead:** no tier, for example "PIN, statements, limits".
- **Why:** Fintava fact: no tiers in the API.

### Z9 · About
- **Now:** "Banking by Fintava MFB · Licensed by the CBN".
- **Instead:** "Banking by" + the bank name slot (sample "Loma Bank"), and the
  licence line as a slot filled from config by the owner (rule 7).
- **Why:** R-1.

### Z10 · Terms
- **Now:** "Payments move through your WAWU wallet, held at Fintava MFB. Fees
  are shown before you pay."
- **Instead:** "held at Loma Bank" (bank name slot). The terms text itself is
  the owner's legal text and will be replaced; keep the layout.
- **Why:** R-1.

---

## 12. Changes the build makes in code (2 Oct 2026)

Made by the task that builds each artboard, in the canvas's own style. Nothing
here is redrawn.

### W11 · Send · PIN
- **Now:** "Face ID can stand in once it's set up".
- **Instead:** the phone's own fingerprint or face unlock, whichever it has;
  the label names it ("Use fingerprint" on most Android phones). When it
  fails: "<Name> failed. Use your PIN." (for example "Fingerprint failed. Use
  your PIN."), and no PIN try is used up. The same on H15, M13 and every PIN
  sheet.
- **Why:** R-26. Testing is Android first (R-24); Face ID is Apple's.

### W35 · Wallet settings
- **Now:** "Face ID for payments"; rows Cards and Statements; "Help with a
  payment".
- **Instead:** "Fingerprint or face for payments" (what the phone has). Cards
  and Statements are not built at launch (below). Help with a payment opens
  the support chat (SUPPORT-01).
- **Why:** R-26, R-16, R-30.

### W36 · Transaction PIN · create
- **Now:** "create" a PIN.
- **Instead:** "change" the PIN: a wallet holder already set one on A9.
- **Why:** R-6: the PIN is created when the wallet opens.

### A4 · Phone code
- **Now:** "Sent by SMS to 0803 ••• 4412, the number on your BVN".
- **Instead:** "Sent by SMS to 0803 ••• 4412". No BVN at sign-up.
- **Why:** R-6.
- **Owner-ruled deviation (R-39, 6 Oct 2026, AUTH-07), replaces the line above, when WAWU ID
  mails the code:** the code is mailed, not texted. The nav title is **"Verify your email"**
  (was "Verify your phone") and the line under "Enter the 6-digit code" is **"Sent to
  n•••@example.com"** (the address typed on A3, written by WAWU ID with the first letter and
  the domain; was "Sent by SMS to 0803 ••• 4412"). The six boxes, the keypad, "Resend in
  0:42" and "Resend code" are as drawn. The same on A15: the wrong-code state keeps "That
  code isn't right" and everything else of A4. A3 still asks for the phone number and
  verifies nothing about it. No separate "Check your email" step follows A4: the email is
  proven here. Layout, spacing and type are unchanged: only the channel words move.
- **Which words show (lead, 10 Oct 2026; A3 corrected in round 3):** WAWU ID's
  `SIGNUP_VERIFY_CHANNEL` is `phone` until the release steps switch it to `email` (task
  AUTH-07, "Release steps"). Under `phone` WAWU ID answers without a channel and the app draws
  the old words above ("Verify your phone", "Sent by SMS to 0803 ••• 4412"); under `email` it
  draws the mailed ones. **A3's line follows the same setting**: on arrival the app asks
  WAWU ID which channel the code will travel (`GET /auth/signup/channel`), so A3 and A4 name
  the same channel. Under `phone` the line under A3's heading is **"We'll text a code to your
  phone."** (the canvas's own words); under `email` it is **"We'll email you a code to confirm
  your address."** While the app has no answer (offline, or an answer it does not know) the
  line is not drawn: it is never guessed.
- **A mailed sign-up made without the number typed (Default (lead), 10 Oct 2026, round 3; owner
  may override):** a mailed code proves no number, so it never takes one from an account that
  only typed it. When the number typed on A3 is held that way, the sign-up goes ahead without
  it and A4 says so with the warning note under the heading, **"We couldn't add your phone
  number"** over **"Another account already has that number. You can add a phone number
  later."** (the shared `Banner`, warning tone, as A3 uses for its own refusals; no artboard
  draws it). The note is shown again when the app is reopened on A4. The texted A4 never shows
  it: a texted sign-up takes the number when its code proves it. Adding and proving a phone
  later is BACKEND_GAPS G-222, which the switch to `email` waits for.

### A10 · Confirm PIN
- **Now:** no mismatch state drawn.
- **Instead:** a mismatch uses the PIN sheet's wrong-PIN line in W11's style;
  KYC-04 records its wording here.
- **Wording (KYC-04, 4 Oct 2026):** the line is the server's own sentence for
  `pin_mismatch`: "The two PINs do not match. Enter the same PIN twice." It
  sits under the dots with W11's CircleAlert in the danger colour, and the
  empty dots are ringed in danger until the first digit is typed again. The
  screen goes back to step 1 ("1 of 2", "Create your transaction PIN"),
  because neither entry is kept once the request is answered. Other refusals
  use the same line without the red ring, in the server's words (for example
  "No connection. Check your internet and try again." when no answer came
  and the PIN turned out not to be set).
- **A PIN the server already holds (KYC-04 round 3, Default (agent), owner may
  override; round 2's wording is replaced):** when the set answers that a PIN
  already exists on the account and the screen did not know of one, A10 ends
  with the canvas's result layout (warning tone, the lock): "You already have
  a transaction PIN" over "Your account has a transaction PIN. If you just set
  it, it is the one you typed. If you set one before, that earlier PIN still
  approves payments." and Done. The app cannot tell the two causes apart: this
  person's own set landed first and its answer arrived twice (the typed PIN IS
  the stored one), or a PIN was set earlier or on another phone. The sentence
  is true in both, and it never says the typed PIN was not saved, nor that
  the PIN was just set. A way to reset a PIN the person does not know (W37) is
  added once WALLET-06 builds it (BACKEND_GAPS G-116).
- **No answer, and no answer to the check either (KYC-04 round 2, Default
  (agent)):** A10 stays, keys off, with the line "We couldn't check whether
  your PIN was set." followed by the read's own words (for example "No
  connection. Check your internet and try again.") in W11's line, and a Try
  again that only checks again. A new PIN is never asked for while the first
  may be set.
- **Why:** every state needs a real look; the canvas's own style is used.

### A11 · Creator setup
- **Now:** "Uploading is open. Getting paid needs your ID checked."
- **Instead:** "Uploading is open. Your earnings wait until you open your
  wallet." Verify your identity opens Open your wallet (A26).
- **Why:** R-11 and R-6: earning isn't gated; the money lands when the wallet
  opens.

### M7 · Menu
- **Now:** Verification "Creator tick · ID check in review".
- **Instead:** the tick state only; no "ID check in review".
- **Why:** R-6: there is no manual ID review at launch.

### M11 · Verification
- **Now:** "Getting paid": Identity check, "Usually 1–3 days", In review.
- **Instead:** the wallet state (Not opened / Open), opening Open your wallet.
  No "In review", no "1–3 days".
- **Why:** R-6.

### M14 · Tick live
- **Now:** Identity check "Payouts go to your bank · Approved".
- **Instead:** the Getting paid row shows the wallet state.
- **Why:** R-6 and R-11.

### M16 · KYC not started
- **Now:** "Needed to get paid · Not started".
- **Instead:** kept; its cause is "no wallet yet", and the row opens Open your
  wallet.
- **Why:** R-6.

### M17 · KYC not approved
- **Now:** "Send your ID again · Not approved".
- **Instead:** kept; its cause is Open your wallet stopping after three failed
  selfie matches.
- **Why:** R-6, KYC-02's retry rule.

### M18 · Creator dashboard
- **Now:** "Identity check (KYC) In review · unlocks payouts".
- **Instead:** "Open your wallet: Not opened / Open", opening Open your wallet.
- **Why:** R-6 and R-11.

### Z2 · Settings
- **Now:** a Password row with no screen drawn behind it.
- **Instead:** Password opens a change-password screen in A22's field style
  (current password, new password, Save).
- **Why:** the row is drawn; its screen is built in the canvas's own style.

### Z2 · Settings, one added row (JOIN-03, no artboard)
- **Now:** Notifications, Privacy and Password in the first group.
- **Instead:** a fourth row, "Access code" with the line "Claim a plan you paid
  for at an event" (Ticket icon, the same tile as its neighbours), opening the
  access code screen. It is drawn only because that screen is built (R-47).
- **Why:** R-48. The plan screen where the claim also belongs is not built, so
  Settings is the one place a signed-in person can reach it from.

### Access code screen (JOIN-03, no artboard)
- **Now:** nothing is drawn: the registration page (JOIN-02) hands a person a
  code, and no screen takes it.
- **Instead:** one screen in A22's field style: the title "Your access code",
  one field (shown "XXXX XXXX", upper case), and a "Claim my plan" button. A
  refusal keeps the code and says why in plain words (a note above the field,
  or a line on it for the code itself). On success the same frame shows "Your
  plan is ready" with the Hub's own list of what the code gave that the app
  puts to use today: the plan, the day it ends, and the points if they were
  added. Not listed, though the Hub grants them: the products the plan allows,
  the event pass and the first Voice Intro (round 2, N2). Their screens are not
  built and the publishing limit the app enforces is still the flat one, so
  listing them would promise what the app does not do (R-47). Their lines come
  back with TIER-02 to TIER-05, the points tools and Voice Intro.
- **Why:** R-48 and JOIN-03. Every line is the Hub's answer; the phone works
  out nothing.

### Have an access code? (JOIN-03 round 2, no artboard)
- **Now:** after sign-up the app opens Home; the access code is reachable only
  from Settings, and nothing leads a person who paid at an event to it.
- **Instead:** right after sign-up, once per account, one screen in the access
  code screen's style: a Ticket tile, the title "Have an access code?", the
  line "Paid for a plan at an event? Enter the code from your registration to
  claim it. You can also do this later in Settings.", and two buttons: "Enter
  code" (opens the access code screen) and "Skip" (opens the app). No back
  arrow: there is nothing behind it. It is shown only to an account that has
  just signed up, never to someone signing in, and it never holds the app up:
  if the phone cannot remember whether it was shown, it is not shown. Settings'
  Access code row stays.
- **Why:** R-48 and JOIN-03 ("after sign-up"). The lead approved the step
  (round 2, ruling 7). SHARED-CHANGES JOIN-03 #4.

### Z6 · Delete account
- **Now:** "wallet and cards" in what goes.
- **Instead:** "wallet". No cards at launch.
- **Why:** R-16.

### W12 · Send · success receipt
- **Now:** Share receipt opens W41.
- **Instead:** at launch, Share receipt opens the phone's share sheet with the
  receipt's text and reference. The same on W19, W27, S7 and SC7. The W41
  image and PDF come after launch (WALLET-12).
- **Why:** R-33.

### SC1 · Schools
- **Now:** ratings "4.8" and "4.7" (and SC2 "4.8 (1,240)").
- **Instead:** no rating at launch; the card keeps its layout without it.
- **Why:** R-32: nothing writes a school rating.

### S13 · Not live yet
- **Now:** shown when bill payments are switched off.
- **Instead:** shown only on a real cause: the biller or Fintava's bills
  service reports unavailable (a biller listed as unavailable, or a purchase
  answered "service not currently available", as cable does today). No
  switch.
- **Why:** R-20: no feature flags.

### S2 · Pay a bill
- **Now:** a Data tile with no screen drawn behind it.
- **Instead:** Data is built on S8's layout with the bundle list in place of
  the amount presets (BILLS-03).
- **Why:** the tile is drawn; its screen is built in the canvas's own style.

### E18 · Organiser dashboard
- **Now:** Edit event, Ticket types and Shared links with no screens drawn.
- **Instead:** Edit event and Ticket types reuse E13 to E15; Shared links lists
  the host's referral links.
- **Why:** the rows are drawn; their screens reuse the canvas's own.

### W18 · Withdraw · waiting on KYC
- **Now:** drawn.
- **Instead:** not built until Fintava names an account status that blocks
  withdrawals.
- **Why:** R-28: it has no real cause today.

## Not built at launch

Entries drawn on launch screens whose screens come after launch. Each is added,
as drawn, by the task that builds its screen (R-27, R-47); CHECK-3 allows only these
to be missing.

| Where | Entry | Added by |
|---|---|---|
| W1 | Dollar and Crypto tabs, Swap | WALLET-21 |
| W1, H1 | Scan | WALLET-20 |
| M1 | QR code | WALLET-20 |
| W1 | WAWU card row | WALLET-22 |
| W35 | Cards | WALLET-22 |
| W35 | Statements | WALLET-35 |
| W15 | Debit card | WALLET-36 |
| W15 | USSD | WALLET-26 |
| W15 | From your Dollar account | the dollar-account task, once Fintava sends that API (WALLET-32) |
| W12, W19, W27, S7, SC7 | Share as image or PDF (W41 to W43); the share sheet ships at launch | WALLET-12 |

## How these changes are made

Each change is made in code by the task that builds the artboard. The export
stays as it is; nothing is sent back for redrawing.
