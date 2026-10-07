# Who Made This: design brief for Claude Design, round 2

7 October 2026. Paste this into Claude Design with the existing WAWU mobile project open (the boards in `design/`: Auth, Home, Explore, Inbox, Me, Events, Professionals, Schools, Services, Settings, Wallet, and the WAWU Dark / WAWU Light compilations).

This round adds the owner's 5 October plan (Verify, Create, Earn), moves the wallet to Nuvion, and makes a few small changes the owner ruled today. Everything not named here stays exactly as it is.

---

## 0. Keep everything that exists

- **Same design system.** Same tokens, type, components, icons, radii and spacing as the existing boards. No new colours or components unless a screen below truly needs one; if it does, add it to the design system and use it everywhere.
- **Same board rules** (from `design/CLAUDE.md`): every flow board has a "Start here" entry map (the screen the user taps FROM, with numbered hotspots and a legend), journeys laid out left to right with the tap written on each arrow, "Starts from" / "Then" chips on each row, and an "Other states" row with "From Xnn" tags. Every screen dark on top, light underneath. Build boards with `_gen/build.js`; after any board change rebuild WAWU Dark and WAWU Light with `_gen/buildAll.js`.
- **Bottom bar stays:** Home · Explore · Inbox · Wallet · Me. **There is no Studio tab and no centre "Create ✨" tab** (owner ruling R-38). Create stays the floating button for creator accounts. The AI tools in this brief open from that Create button.
- **Copy rules.** Plain English, short sentences. **No em-dashes anywhere** (use a full stop, a comma, a colon or brackets). Links are `wawu/…`, never `wawu.africa/…`. Naira as `₦1,000`. Dollars as `$3` only for people billed in dollars (section 1).
- **Figures are placeholders.** Every price, points amount, limit and date below comes from one config file in the app, so label them as example values on the boards. Use the numbers given here so the boards read realistically.
- **Artboard ids.** New flows use new prefixes: **VF** (Verify), **PT** (Points and AI tools), **RF** (Referral). Changes to existing screens keep their id (H1, W1, M1 and so on). A new screen added to an existing flow takes the next free number in that flow (for example W44).

---

## 1. What changed in the product (update `design/CLAUDE.md` to say this)

Replace these standing rules:

| Old rule | New rule |
|---|---|
| Payments: Fintava wallet only ("Pay from wallet"). | The wallet runs on **Nuvion**. Money comes in **by bank transfer only** into the person's own wallet account number. There is no card or USSD top-up. |
| Sign-up is free. Free accounts: 5 uploads. More uploads come with a paid verification tick (₦2,000/yr). | Sign-up is free. Anyone can build a profile and **draft** products. **Publishing, or uploading any file, needs a paid tier** (Verify, Verify Plus or Founding Maker). Drafts with no files are free. |
| (none) | **Points** are the in-app currency for AI tools. Always shown as "points", never as naira or dollars. |
| (none) | People outside Nigeria pay in **dollars** at the dollar prices. The currency is set at the first purchase and does not change. |
| (Bills on Home and in the Wallet) | **Bills are switched off** (Nuvion has no bill payments). Remove every Bills entry from the screens. Keep the bills boards on the canvas but mark the board "Off at launch". |

**The three tiers** (example values from the plan):

| | Verify | Verify Plus | Founding Maker |
|---|---|---|---|
| Price in Nigeria | ₦1,000 | ₦3,000 | ₦5,000 |
| Price outside Nigeria | $3 | $9 | $15 |
| Lasts | 30 days | 6 months | 12 months |
| Products you can publish | 3 | 6 | 10 |
| Voice Intro in your own voice | First one included | First one included | First one included |
| Points included | 100 | 300 | 600 |
| Christmas event | Watch live, apply | Maker Pass | Maker Pass, priority |
| Extras | Verified badge | Priority in search | Numbered Founding badge, 10% bonus on points packs |

Need more? **Add 5 more products for ₦1,500 ($3)**, or upgrade and pay only the difference. A draft does not count until it is published.

**Points** (example values): buy 1,000 points for ₦1,000, 2,750 for ₦2,500, 6,000 for ₦5,000 (dollars: 2,500 for $3, 7,000 for $8, 14,000 for $15). Convert to cash in the wallet at 1,000 points = ₦500 ($0.50). Points come in lots that expire; the soonest-expiring lot is spent first.

**AI actions and their points cost** (example values): Hear your name 5 · Voice Intro 200 (first one free) · VoiceOver 250 a minute · Quick voice 125 a minute · Captions 15 a minute · Clean audio 400 a minute · Music track 500 · Sound effect 75 · Dubbing 1,500 or 6,500 a minute per language · Receptionist 20 a message, 400 a voice minute.

---

## 2. New flow: Verify (VF)

The journey: sign up free → build a draft → hear your name → write a Voice Intro → "Hear it in my voice" → Make it official (tiers) → pay → celebration → record 30 seconds → hear yourself → publish. **Never send people to a wall; send them to a finish line.** They build first and pay when they are most excited.

"Start here" entry map: Me (M1) with the draft product card and the Voice Intro prompt as hotspots, and the Create button.

| Id | Screen | What it shows | States to draw |
|---|---|---|---|
| VF1 | Your bonus is waiting | Right after sign-up. The points, the Voice Intro and the event pass that a tier unlocks, shown locked. One button: "Build my shop". | Default |
| VF2 | Draft shop | The existing product form (Create) without the file upload step: title, price, look. A progress ring for "shop ready". Draft products show a "Draft" tag. | Empty, one draft, three drafts |
| VF3 | Hear your name | Free. The person's name with a play button, said in a studio voice. "Not quite right?" lets them type a phonetic spelling and hear it again, then Save. | Playing, phonetic edit, saved |
| VF4 | Write your Voice Intro | A text box (a few lines about you or your service, with a character count) and the button "Hear it in my voice". | Empty, written, too long |
| VF5 | Make it official | Opens from "Hear it in my voice", from Publish, or from any upload. Header: "Your intro is ready. Hear it in your own voice." Three tier cards (section 1), **Founding Maker pre-selected**, the person's draft visible behind. Prices in the person's currency. | Naira, dollars, already on a tier (shows Upgrade and "pay only the difference") |
| VF6 | Checkout | The chosen tier, then the payment methods: **WAWU wallet** (balance shown) and **bank transfer**. A checkbox offer: "Add 1,000 points for ₦800". Total. Pay. | Wallet enough, wallet short ("Add money first", opens Add money), transfer details shown, paying, failed |
| VF7 | You're official | Celebration: confetti, the badge, points added, "3 products to publish", the event pass. Button: "Record my voice". | Verify, Founding (numbered badge) |
| VF8 | Your voice, your consent | Before recording. The consent line to read: "I am [name]. I agree that WHO MADE THIS? may create an AI version of my voice for my intros." Who can do this (only the account owner, only their own voice). | Default |
| VF9 | Record 30 seconds | The script to read (includes the consent line), a timer to 30 s, record / stop / redo. | Ready, recording, too short, done |
| VF10 | Making your intro | Progress while the intro is generated. | Working, failed (points not taken, try again) |
| VF11 | Hear yourself | Player with the intro in their own voice and an **"AI voice"** label. Buttons: Use this, Edit text, Re-record. | Default |
| VF12 | Publish your first product | The draft now accepts files; Publish. A "1 of 3 used" meter. | Uploading, published, share sheet |
| VF13 | You've used all your products | A sheet: "You have used 3 of 3. Add 5 more for ₦1,500 or upgrade." Two buttons. | Naira, dollars |
| VF14 | Your tier | From Me and from Settings: tier name, badge, active until, products used (2 of 3), points included, event pass, Renew / Upgrade. | Active, ending in 3 days, ended (published products stay up; new publishing is paused until renewed) |
| VF15 | Identity check needed | After payment the person's identity check runs (BVN and NIN, as when opening a wallet). If it fails: uploads are paused, with the reason and what to do. | Checking, passed, failed |

Changes on existing boards for this flow:
- **M1 Me (and the service page):** the Voice Intro player with its "AI voice" label under the name; the tier badge; a "2 of 3 products" meter for the owner; drafts shown with a "Draft" tag.
- **M11 to M14 (Verification tick):** replaced by VF5 to VF7. Mark them "Replaced by VF" on the board.
- **M19 to M22 (Create):** the upload and publish steps open VF5 when the person has no tier; drafts save without files.
- **E21 "Needs a tick" (host an event):** reads "Needs a tier": hosting events needs an active tier.

---

## 3. New flow: Points and AI tools (PT)

AI tools open from the **Create button** (never a tab). "Start here": the Create sheet as it is today, with a new "AI tools" row and the points balance shown on it.

| Id | Screen | What it shows | States |
|---|---|---|---|
| PT1 | AI tools | A grid of tools, each with its points cost shown before use: VoiceOver, Quick voice, Captions, Clean audio, Music, Sound effects, Dubbing, Receptionist, Voice Intro, Hear your name. Points balance at the top. | Default, no points |
| PT2 | One tool (pattern) | Draw it once for VoiceOver: the input (text, up to 5,000 characters), the voice, the cost ("This uses 250 points"), Run. Then working, done (player, save, use in a product), failed ("No points were taken"). | All four |
| PT3 | Not enough points | A sheet: cost, balance, shortfall. If "Use wallet" is on: "Use ₦X from your wallet for the missing points?" with Confirm. Otherwise Buy points. Nothing runs without a tap. | Wallet on, wallet off, wallet too low |
| PT4 | Buy points | The three packs in the person's currency (Founding shows +10%). Pay from wallet or by transfer. | Naira, dollars, paying, added |
| PT5 | Your points | Balance, lots with their expiry dates ("400 points end 12 Jan"), the last 20 movements (bonus, spent on VoiceOver, bought, converted). | Default, nothing yet |
| PT6 | Convert to cash | Points to wallet cash at the rate (1,000 points = ₦500), with a line that spending on AI is worth more. Confirm. | Default, below the minimum, done |
| PT7 | Daily limit reached | Friendly message when a daily points or job-size cap is reached. | Default |

---

## 4. New flow: Referral (RF)

"Start here": Me, with "Invite and earn" as the hotspot.

| Id | Screen | What it shows | States |
|---|---|---|---|
| RF1 | Invite and earn | Your link (`wawu/r/code`) and code with Copy and Share. A meter: brought, verified, points earned, pending. Your level and its multiplier (×1, ×1.25, ×1.5, ×2, ×3) and the next milestone (+500 points at 5 verified, +1,500 at 10, +5,000 at 25). | New (nothing yet), some pending, a milestone close |
| RF2 | Share card | The image that goes to WhatsApp and Instagram: name, badge, link. | Default |
| RF3 | You earned points | The reward moment when a referred person pays and is verified (after the 7-day hold). | Default, milestone |
| RF4 | How it works | Plain rules: only verified people earn; you earn when the person you invited pays and is verified; one level only; rewards are held 7 days; no reward if refunded. | Default |

Rewards are points, never cash, until the person converts them.

---

## 5. Wallet on Nuvion (changes to the Wallet and Auth boards)

| Id | Screen | Change |
|---|---|---|
| W1 | Wallet | Three things at the top: **Cash** (naira), **Points**, **Passes** (the Christmas event pass). Buttons: Add money, Send, Withdraw, Buy points, Convert to cash. **No Bills.** |
| W15 | Add money | **Bank transfer only.** A card with the wallet's own account number, bank name and account name, each with Copy, plus Share details. "Money you send arrives in a few minutes." States: details, waiting, received (amount and new balance). |
| W16 | Add money · card | Remove (mark "Removed: transfer only"). |
| W44 | Your pass | The Christmas event pass: tier, type (Watch live / Maker Pass / Maker Pass priority), the event (date to be announced), and what it gets you. |
| A-flow, Open your wallet | Steps | Keep BVN and NIN, and the selfie (now Nuvion's own selfie page: draw the hand-off "You'll finish this on a secure page" and the return). **Add two upload steps:** an ID document (front and back where it has two sides) and a proof of address (utility bill or bank statement, last 3 months). Then: "Checking your details" (account number arrives in a few moments), approved (account number shown), rejected (the reason and what to fix). |
| A14 | Phone doesn't match BVN | Keep. The phone on the account is checked against the phone on the BVN record when the wallet is opened (owner, 7 Oct). |

---

## 6. Small changes on existing boards

- **H1 Today and H36:** remove **Bills** from the balance card and the **Pay bills** tile from the service row (the row becomes Events, Legal, Schools). Everything else stays.
- **H29 to H34 (TGIF cards):** the second count beside Amen is **readers that day** ("3.4K read today"), with a reader icon.
- **Wherever a price is shown to someone billed in dollars,** show `$` from their tier prices; naira everywhere else.

---

## 7. Open points (design around them; do not block)

- **Points and WAWU Credits.** WAWU Credits (paid community chat, boards I27 to I29) stay as they are for now. Whether credits become points is still to be decided; draw points as their own balance.
- **Event date and upgrade prices** for the Christmas event are not set. Use "Date to be announced".
- **Card payment for tiers and points.** Draw only wallet and bank transfer. If a card option is added later, it goes on VF6 and PT4 as one more method.

---

## 8. Deliverables

- New boards: **Verify Flow (VF1 to VF15)**, **Points Flow (PT1 to PT7)**, **Referral Flow (RF1 to RF4)**, each with its "Start here" map, journeys, chips and "Other states" row.
- Updated boards: Home (H1, H36, H29 to H34), Me (M1, service page, M11 to M14 marked replaced, M19 to M22), Wallet (W1, W15, W16 removed, W44 new), Auth (Open your wallet steps), Events (E21).
- Every screen in dark and light. Rebuild WAWU Dark and WAWU Light with `_gen/buildAll.js`.
- Update `design/CLAUDE.md` with the new standing rules in section 1.
- Export the boards as before (`.dc.html` plus `.sections.json`), so they drop into the app repo's `design/` folder unchanged in format.
