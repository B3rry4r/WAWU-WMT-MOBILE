# WAWU mobile: changes to the design canvas

For the designer of the WAWU mobile canvas. Written 2 Oct 2026 from the
export you last sent (297 artboards). Each item below names one artboard by
its id and name, exactly as printed in the artboard's header (for example
"W10 Send · review"), says what is drawn there now, what it must show
instead, and why. Nothing here changes the look of the app. It changes what
the screens say and which screens exist, because the owner has ruled on the
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
3. **The fee row is a breakdown, never one number.** Wherever the canvas shows
   a "Fee" row today, draw it as three parts:

   > Fintava's charge + WAWU's fee = total fee

   then the Total for the whole payment under it. How you lay it out (two
   rows plus a total, or one row with a small "₦40 + ₦25" line beneath) is
   your call; the three parts must all be visible before the person pays.
   Row labels are your call too: the owner decides whether the first part
   says "Fintava" or something like "Bank charge". Either part can be ₦0, so
   the row must also look right when it reads "₦0 + ₦0".
   Why: the person pays Fintava's charge plus WAWU's fee on top (R-10), and
   the real figures come from config, never from the canvas.
4. **"No fee" is never drawn as a fact.** Every "No fee" on the canvas becomes
   the breakdown in rule 3.
5. **No em-dashes in any copy.** Use a full stop, a comma, a colon or brackets.
   (Owner instruction, 1 Sep 2026.)

### Example values to use (Fintava's price list, 2 Oct 2026)

| Action | Fintava's charge | WAWU's fee | Total fee |
|---|---|---|---|
| Send to a bank, or withdraw to a bank | ₦40 | ₦25 | ₦65 |
| Send to a WAWU user, under ₦5,000 | ₦23.25 | ₦10 | ₦33.25 |
| Send to a WAWU user, ₦5,000 and over | ₦15.75 | ₦10 | ₦25.75 |
| Electricity | ₦100 | none set today (₦0) | ₦100 |
| Cable TV | ₦100 | none set today (₦0) | ₦100 |
| Airtime or data | ₦0 | none set today (₦0) | ₦0 |
| Virtual card | ₦2,000 | none set (₦0) | ₦2,000 |
| Card top-up | not Fintava (another card provider, price not known yet) | 1.5% | provider + 1.5% |
| Physical card | not published by Fintava yet | ₦1,500 card + ₦500 delivery | Fintava's + ₦2,000 |

---

## 1. Everywhere

### The ₦ symbol (open question D15), about 143 artboards
- **Now:** Alan Sans has no ₦ character (U+20A6), so every ₦ on the canvas is
  drawn by the phone's own fallback font, at a different weight and width
  from the digits beside it. Look at any balance, for example W1's
  "₦485,250.75".
- **Instead:** tell us which one you want, and supply it:
  (a) a ₦ glyph drawn to match Alan Sans in every weight we use (Light to
  Black), delivered as an updated font file; or (b) a named fallback font
  for the ₦ only; or (c) confirmation that the system fallback is acceptable.
  No artboard needs redrawing for this; only the font or the decision.
- **Why:** open decision D15. The app keeps the fallback until you answer.

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
- **Now:** row 8 reads "Four services · Pay bills, Events, Legal, Shop ·
  Flows S, E, SH".
- **Instead:** "Pay bills, Events, Legal, Schools · Flows S, E, SC".
- **Why:** R-2.

### H14 · Unlock sheet
- **Now:** Price ₦2,500, then "Fee: No fee".
- **Instead:** the fee breakdown (rule 3). Sample: Fintava's charge ₦23.25 +
  WAWU's fee ₦0 = ₦23.25, Total ₦2,523.25. The app fills the real figures;
  if the owner decides WAWU absorbs Fintava's charge on purchases, the row
  reads ₦0 + ₦0 and Total equals the price, so it must look right that way
  too.
- **Why:** R-10, and a Fintava fact: paying from a wallet is a wallet to
  wallet move, which Fintava charges ₦15.75 to ₦23.25 for.

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
- **Now:** hotspot 9 "Shop tab · Your products · Opens M3".
- **Instead:** remove hotspot 9 and renumber the hotspots after it.
- **Why:** R-9 (no Shop tab).

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
- **Now:** Course fee ₦150,000, "Fee: No fee", Total ₦150,000.
- **Instead:** the fee breakdown (rule 3). Sample: Fintava's charge ₦15.75 +
  WAWU's fee ₦0 = ₦15.75, Total ₦150,015.75. The app fills the real figures,
  and the row must also look right at ₦0 + ₦0.
- **Why:** R-10, and a Fintava fact: a wallet to wallet move costs ₦15.75 to
  ₦23.25.

## 6. Open your wallet (the Auth flow)

The owner moved identity checks out of sign-up (R-6). Sign-up is email and
phone only. The BVN step, details, selfie, account opening and PIN screens
(A5 to A10, A14, A16) now form **"Open your wallet"**, which starts the first
time someone taps Wallet or anything that moves money. Keep their look; only
where they sit changes. Fintava will not open an account without a **NIN**
and a **full address**, and its BVN check returns name, date of birth,
gender, phone and photo only.

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
- **Why:** Fintava fact: the selfie is matched against the BVN photo; Fintava
  has no liveness check, so the app cannot claim one.

### A8 · Wallet open
- **Now:** "Tier 1 · Fintava MFB", Bank "Fintava MFB", Limit "₦300,000
  balance", link "Raise your limits".
- **Instead:** the subtitle and the Bank row show the bank name as a slot the
  app fills. Sample: "Loma Bank", and make sure the long legal name "Iyin
  Ekiti Microfinance Bank Limited (Loma Bank)" also fits (wrap or truncate).
  No "Tier 1": draw the Limit row as a slot that can be hidden.
- **Why:** R-1 and a Fintava fact: the bank is Loma Bank and its name comes
  from the API. Fintava's API has no tiers; limits are still a question for
  Fintava.

### A17 to A20 · Account limits, Tier 2 · NIN, Tier 2 done, Tier 3 · address (hold, owner to rule)
- **Now:** a three-tier ladder: Tier 1 (BVN and selfie), Tier 2 (upgrade with
  your NIN, A18), Tier 3 (upgrade with proof of address, A20), with limits and
  "Limits set by the CBN. ⚠ Final numbers from Fintava."
- **Instead:** don't redraw these yet; just be aware. Every wallet now gives
  its NIN and address when it opens (A26 and A5), so A18's "upgrade with NIN"
  repeats a step everyone has done, and A20's address fields do the same
  (the proof-of-address upload may still be needed). Fintava's API has no
  tiers, and the limits are a question the owner has put to Fintava. The
  owner will rule on what these four screens become.
- **Why:** Fintava facts (NIN and address required to open; no tiers in the
  API).

## 7. Wallet

### W1 · Wallet · Naira
- **Now:** the balance card reads "WAWU · Fintava MFB".
- **Instead:** "WAWU · " followed by the bank name as a slot the app fills.
  Sample "Loma Bank".
- **Why:** R-1 and a Fintava fact: the bank is Loma Bank, named by the API.

### W5 · Wallet · new account
- **Now:** "WAWU · Fintava MFB".
- **Instead:** "WAWU · Loma Bank" (bank name slot, as W1).
- **Why:** R-1.

### W10 · Send · review
- **Now:** sending ₦25,000 to Guaranty Trust Bank, "Fee ₦10.00", "Total
  ₦25,010.00". (₦10 is WAWU's fee for sending to a WAWU user, not to a bank.)
- **Instead:** the fee breakdown (rule 3). For this bank send: Fintava's
  charge ₦40 + WAWU's fee ₦25 = ₦65, Total ₦25,065.00. If you also draw the
  WAWU-user version: ₦15.75 + ₦10 = ₦25.75, Total ₦25,025.75. The button
  still shows the amount the person receives.
- **Why:** R-10, Fintava's price list.

### W11 · Send · PIN
- **Now:** behind the PIN sheet, W10's rows with "Fee ₦10.00", "Total
  ₦25,010.00".
- **Instead:** the same rows as the new W10 (₦40 + ₦25 = ₦65, Total
  ₦25,065.00).
- **Why:** R-10.

### W12 · Send · success receipt
- **Now:** "Fee ₦10.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65 for the bank send shown.
- **Why:** R-10.

### W14 · Send · failed
- **Now:** "Amount ₦25,010.00" and "Nothing was taken. The full ₦25,010 is
  back in your Naira wallet."
- **Instead:** the amount is a slot (with the new fee, the sample total is
  ₦25,065.00). Word the note so it says the amount was returned without
  promising that every charge came back, for example "₦25,065 is back in
  your Naira wallet." The app fills the amount actually reversed.
- **Why:** R-10 (the total now includes Fintava's charge). Whether Fintava
  returns its own charge on a reversal is not confirmed yet.

### W15 · Add money
- **Now:** Bank "Fintava MFB". Under Other ways, "Debit card · Instant ·
  1.5% fee".
- **Instead:** Bank shows the bank name slot (sample "Loma Bank", long name
  must fit). The card row's fee reads as a breakdown hint, for example
  "Card provider's charge + 1.5%".
- **Why:** R-1 for the bank. R-10 for the card: WAWU's 1.5% is added to the
  card provider's own charge (Fintava doesn't take cards, so it is another
  provider; card top-up comes after launch).

### W16 · Add money · card
- **Now:** "Card fee ₦150.00", You pay ₦10,150.00, Wallet gets ₦10,000.00.
- **Instead:** the card fee as a breakdown: card provider's charge + WAWU's
  1.5% (₦150 on ₦10,000) = card fee, then You pay and Wallet gets. The
  provider's charge isn't known yet, so draw it as an obvious sample.
- **Why:** R-10.

### W17 · Withdraw to bank
- **Now:** "Fee ₦25.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65 (on ₦50,000, so ₦50,065.00
  leaves the wallet).
- **Why:** R-10, Fintava's price list (a withdrawal is a bank send).

### W19 · Withdraw · on its way
- **Now:** "Fee ₦25.00".
- **Instead:** the fee breakdown: ₦40 + ₦25 = ₦65.
- **Why:** R-10.

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
  (sample left obvious; Fintava hasn't published it).
- **Why:** R-10.

### W35 · Wallet settings
- **Now:** "Tier 2 account · ₦5,000,000 daily · BVN + NIN verified" and
  "Account details · Fintava MFB · 812 345 6789".
- **Instead:** "Account details · Loma Bank · 812 345 6789" (bank name
  slot). The top row can't name a tier: draw it as a limits row that the app
  can fill or hide.
- **Why:** R-1; Fintava fact: no tiers in the API, limits still to come from
  Fintava.

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
  licence wording is a slot filled from config by the owner; keep room for a
  line about as long as today's. Don't write your own wording for it.
- **Why:** R-1: licence wording comes from config, filled in by the owner.

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
  holds the coins is a slot filled from config.
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
  "You get" side, never "Dollar" or "Dollar account".
- **Why:** Cardex facts: a quote is held 90 seconds and used once; conversion
  fees are still to come from Fintava; a stablecoin balance is not a dollar
  account. (A real dollar account comes only when Fintava provides it, R-16.)

### W21 · Swap · review
- **Now:** "To: Dollar account", "Fee: No fee", the same 0:28 hold.
- **Instead:** "To" names the asset (USDT or USDC), the fee row is the
  breakdown slot, and the hold matches W20 (90 seconds).
- **Why:** as W20.

## 8. Bills (the Services flow)

Bills are not free. Fintava charges ₦100 for electricity and for cable TV,
and ₦0 for airtime and data; WAWU's bill fee is added on top if the owner
sets one (none today).

### S3 · Biller
- **Now:** several electricity billers say "Prepaid and postpaid".
- **Instead:** every biller says "Prepaid".
- **Why:** Fintava fact: electricity is prepaid only (and never below ₦500).

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
- **Why:** R-10.

### S11 · Not enough in wallet
- **Now:** S5's rows with "No fee", and "You have ₦6,200.00. Add ₦3,800 to
  pay this." / "Add ₦3,800".
- **Instead:** S5's new rows (Total ₦10,100.00), and the shortfall that
  follows: "Add ₦3,900".
- **Why:** R-10: the total includes the fee, so the shortfall does too.

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

## 9. Events

### E3 · Pay
- **Now:** Tickets ₦7,500, "Fee: No fee", Total ₦7,500.
- **Instead:** the fee breakdown: Fintava's charge ₦15.75 + WAWU's fee ₦0 =
  ₦15.75, Total ₦7,515.75. As on H14, it must also look right at ₦0 + ₦0.
- **Why:** R-10, and a Fintava fact: a wallet to wallet move costs ₦15.75 to
  ₦23.25 (ticket money is held in WAWU's own wallet until the event, R-19).

## 10. Settings

### Settings flow, "Start here" map (no artboard id)
- **Now:** the Me menu phone on this map shows "My content · 4 of 7 slots".
- **Instead:** match M7: "My content · 4 of 5 uploads".
- **Why:** R-7: free accounts get 5 uploads (25 with a tick); there are no
  "7 slots".

### Z9 · About
- **Now:** "Banking by Fintava MFB · Licensed by the CBN".
- **Instead:** "Banking by" + the bank name slot (sample "Loma Bank"), and the
  licence line as a slot filled from config by the owner.
- **Why:** R-1.

### Z10 · Terms
- **Now:** "Payments move through your WAWU wallet, held at Fintava MFB. Fees
  are shown before you pay."
- **Instead:** "held at Loma Bank" (bank name slot). The terms text itself is
  the owner's legal text and will be replaced; keep the layout.
- **Why:** R-1.

---

## What happens next

The owner sends you this brief. When your new export comes back, we replace
the whole design folder with it, regenerate the list of artboards, and record
which artboards changed. Please send the whole export (all flows), not only
the changed ones, and keep the ids as they are.
